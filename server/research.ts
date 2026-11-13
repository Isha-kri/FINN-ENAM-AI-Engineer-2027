import type { Express } from 'express';
import type Database from 'better-sqlite3';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const documents = [
  { id:'infosys-ar-fy26', ticker:'INFY.NS', title:'Infosys Integrated Annual Report 2025–26', type:'annual_report', period:'FY 2025–26', published:'2026-06-15', url:'https://www.infosys.com/investors/reports-filings/annual-report/annual/documents/infosys-ar-26.pdf' },
  { id:'infosys-q2-fy27-call', ticker:'INFY.NS', title:'Infosys Q2 FY27 Earnings Conference Call Transcript', type:'earnings_call', period:'Q2 FY 2026–27', published:'2026-10-23', url:'https://www.infosys.com/investors/reports-filings/quarterly-results/2026-2027/q2/documents/transcripts/earningscall.pdf' }
];

export function registerResearch(app:Express, db:Database.Database, dataDir:string) {
  app.get('/api/research/documents/:ticker',(req,res)=>{
    const ticker=req.params.ticker.toUpperCase().includes('.')?req.params.ticker.toUpperCase():req.params.ticker.toUpperCase()+'.NS';
    const stored=db.prepare('SELECT id,status,pages,indexed_at,checksum FROM documents WHERE ticker=?').all(ticker) as any[];
    const available=documents.filter(d=>d.ticker===ticker);
    res.json({ticker,mode:'primary company documents only',documents:available.map(d=>({...d,ingestion:stored.find(x=>x.id===d.id)||{status:'available',pages:0}})),unsupported:available.length===0});
  });
  app.post('/api/research/ingest/:ticker',async(req,res)=>{
    const ticker=req.params.ticker.toUpperCase().includes('.')?req.params.ticker.toUpperCase():req.params.ticker.toUpperCase()+'.NS';
    const targets=documents.filter(d=>d.ticker===ticker);
    if(!targets.length)return res.status(404).json({error:`No verified primary-document links are configured for ${ticker}.`});
    const results:any[]=[];
    for(const doc of targets){
      try{
        const response=await fetch(doc.url,{headers:{'User-Agent':'Mozilla/5.0 FINN local research prototype','Accept':'application/pdf'},signal:AbortSignal.timeout(30000)});
        if(!response.ok)throw new Error(`HTTP ${response.status}`);
        if(!response.headers.get('content-type')?.includes('application/pdf'))throw new Error('Source did not return a PDF');
        const bytes=new Uint8Array(await response.arrayBuffer());
        if(bytes.byteLength>45*1024*1024)throw new Error('Document exceeds the 45 MB local ingestion limit');
        const checksum=createHash('sha256').update(bytes).digest('hex');
        const old=db.prepare('SELECT checksum,status,pages FROM documents WHERE id=?').get(doc.id) as {checksum:string;status:string;pages:number}|undefined;
        if(old?.checksum===checksum&&old.status==='indexed'){results.push({id:doc.id,status:'already indexed',pages:old.pages});continue;}
        const pdfjs:any=await import('pdfjs-dist/legacy/build/pdf.mjs');
        const pdf=await pdfjs.getDocument({data:bytes.slice(),useSystemFonts:true}).promise;
        const storage=join(dataDir,'documents');await mkdir(storage,{recursive:true});const filePath=join(storage,`${doc.id}.pdf`);await writeFile(filePath,bytes);
        db.prepare('DELETE FROM chunks WHERE document_id=?').run(doc.id);
        db.prepare(`INSERT INTO documents(id,ticker,title,doc_type,period,published_at,source_url,file_path,checksum,status,pages,indexed_at) VALUES(?,?,?,?,?,?,?,?,?,'indexing',?,?) ON CONFLICT(id) DO UPDATE SET checksum=excluded.checksum,file_path=excluded.file_path,status='indexing',pages=excluded.pages,indexed_at=excluded.indexed_at`).run(doc.id,ticker,doc.title,doc.type,doc.period,doc.published,doc.url,filePath,checksum,pdf.numPages,new Date().toISOString());
        const insert=db.prepare('INSERT INTO chunks(id,document_id,ticker,page,chunk_index,text) VALUES(?,?,?,?,?,?)');
        const transaction=db.transaction((rows:any[])=>{for(const row of rows)insert.run(row.id,row.docId,row.ticker,row.page,row.chunkIndex,row.text);});
        let batch:any[]=[];
        for(let pageNumber=1;pageNumber<=pdf.numPages;pageNumber++){
          const page=await pdf.getPage(pageNumber);const content=await page.getTextContent();const text=content.items.map((x:any)=>x.str||'').join(' ').replace(/\s+/g,' ').trim();
          const size=1200,overlap=160;
          for(let start=0,chunkIndex=0;start<text.length;start+=size-overlap,chunkIndex++){
            const excerpt=text.slice(start,start+size);batch.push({id:createHash('sha256').update(`${doc.id}|${pageNumber}|${chunkIndex}|${excerpt}`).digest('hex'),docId:doc.id,ticker,page:pageNumber,chunkIndex,text:excerpt});
          }
          if(batch.length>=300){transaction(batch);batch=[];}
        }
        if(batch.length)transaction(batch);
        db.prepare("UPDATE documents SET status='indexed' WHERE id=?").run(doc.id);
        results.push({id:doc.id,status:'indexed',pages:pdf.numPages,checksum});
      }catch(error){
        const message=(error as Error).message;
        db.prepare("INSERT INTO documents(id,ticker,title,doc_type,period,published_at,source_url,status,indexed_at) VALUES(?,?,?,?,?,?,?,'unavailable',?) ON CONFLICT(id) DO UPDATE SET status='unavailable',indexed_at=excluded.indexed_at").run(doc.id,ticker,doc.title,doc.type,doc.period,doc.published,doc.url,new Date().toISOString());
        results.push({id:doc.id,status:'unavailable',error:message});
      }
    }
    res.json({ticker,results,success:results.some(x=>x.status==='indexed'||x.status==='already indexed')});
  });
  app.post('/api/research/ask',(req,res)=>{
    const raw=String(req.body?.ticker||'');const ticker=raw.toUpperCase().includes('.')?raw.toUpperCase():`${raw.toUpperCase()}.NS`;const question=String(req.body?.question||'').trim();
    if(!question)return res.status(400).json({error:'Enter a research question.'});
    const sources=db.prepare("SELECT id,title,doc_type,period,published_at,source_url,pages FROM documents WHERE ticker=? AND status='indexed'").all(ticker) as any[];
    if(!sources.length)return res.status(409).json({error:'No primary documents are indexed for this ticker yet.',needsIngestion:true,ticker});
    const stop=new Set(['what','when','where','which','with','from','have','this','that','were','does','about','into','over','under','their','there','they','them','then','than','show','tell','give','compare','company','management']);
    const terms=[...new Set((question.toLowerCase().match(/[a-z0-9]+/g)||[]).filter(w=>w.length>2&&!stop.has(w)))];
    const chunks=db.prepare("SELECT c.id,c.document_id,c.page,c.text,d.title,d.doc_type,d.period,d.published_at,d.source_url FROM chunks c JOIN documents d ON d.id=c.document_id WHERE c.ticker=? AND d.status='indexed'").all(ticker) as any[];
    const candidates=chunks.map(row=>{const lower=row.text.toLowerCase();const metadata=(row.title+' '+row.period).toLowerCase();const score=terms.reduce((n,term)=>n+Math.max(0,lower.split(term).length-1)+(metadata.includes(term)?4:0),0);return {...row,score};}).filter(row=>row.score>0).sort((a,b)=>b.score-a.score);
    const quarter=(question.toLowerCase().match(/\bq[1-4]\b/)||[])[0];const periodCandidates=quarter?candidates.filter(row=>(row.title+' '+row.period).toLowerCase().includes(quarter)):candidates;const sourceCandidates=periodCandidates.length?periodCandidates:candidates;
    const ranked:any[]=[];const seenPages=new Set<string>();for(const row of sourceCandidates){const key=row.document_id+'|'+row.page;if(seenPages.has(key))continue;seenPages.add(key);ranked.push(row);if(ranked.length===7)break;}
const citations=ranked.map(row=>{const lower=row.text.toLowerCase();const positions=terms.map(term=>lower.indexOf(term)).filter(index=>index>=0);const start=positions.length?Math.max(0,Math.min(...positions)-100):0;const excerpt=(start>0?'…':'')+row.text.slice(start,start+680)+(start+680<row.text.length?'…':'');return{id:row.id,document:row.title,type:row.doc_type,period:row.period,page:row.page,sourceUrl:row.source_url,excerpt};});
    res.json({ticker,mode:'local lexical retrieval · no LLM',question,coverage:{documentsSearched:sources.length,documents:sources.map(d=>({title:d.title,period:d.period,type:d.doc_type,sourceUrl:d.source_url,pages:d.pages})),pagesRetrieved:new Set(citations.map(c=>c.document+':'+c.page)).size,indexedPages:new Set(chunks.map(c=>c.document_id+':'+c.page)).size},message:citations.length?'Retrieved passages from primary company documents. These excerpts are evidence to inspect, not generated conclusions.':'No supporting passage was found in the indexed primary documents.',citations});
  });
  app.get('/api/evidence/:id',(req,res)=>{
    const row=db.prepare('SELECT c.id,c.page,c.text,d.title,d.period,d.doc_type,d.source_url,d.ticker FROM chunks c JOIN documents d ON d.id=c.document_id WHERE c.id=?').get(req.params.id);
    if(!row)return res.status(404).json({error:'Evidence chunk not found.'});res.json(row);
  });
}
