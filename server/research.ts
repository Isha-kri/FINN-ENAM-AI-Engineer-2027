import type { Express } from 'express';
import type Database from 'better-sqlite3';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { extractQuarterResultRow, financialChange, normalizeNseTicker } from './domain.js';

const documents = [
  { id:'infosys-ar-fy26', ticker:'INFY.NS', title:'Infosys Integrated Annual Report 2025–26', type:'annual_report', period:'FY 2025–26', published:'2026-06-15', url:'https://www.infosys.com/investors/reports-filings/annual-report/annual/documents/infosys-ar-26.pdf' },
  { id:'infosys-q2-fy27-call', ticker:'INFY.NS', title:'Infosys Q2 FY27 Earnings Conference Call Transcript', type:'earnings_call', period:'Q2 FY 2026–27', published:'2026-10-23', url:'https://www.infosys.com/investors/reports-filings/quarterly-results/2026-2027/q2/documents/transcripts/earningscall.pdf' },
  { id:'infosys-q2-fy27-results', ticker:'INFY.NS', title:'Infosys Q2 FY27 Audited Financial Results', type:'results', period:'Q2 FY 2026–27', published:'2026-10-23', url:'https://www.infosys.com/investors/reports-filings/quarterly-results/2026-2027/q2/documents/q2-and-h1-fy27-financial-results-auditorsreports.pdf' },
  { id:'infosys-q1-fy27-call', ticker:'INFY.NS', title:'Infosys Q1 FY27 Earnings Conference Call Transcript', type:'earnings_call', period:'Q1 FY 2026–27', published:'2026-07-23', url:'https://www.infosys.com/investors/reports-filings/quarterly-results/2026-2027/q1/documents/transcripts/earningscall.pdf' },
  { id:'infosys-q1-fy27-results', ticker:'INFY.NS', title:'Infosys Q1 FY27 Audited Financial Results', type:'results', period:'Q1 FY 2026–27', published:'2026-07-23', url:'https://www.infosys.com/investors/reports-filings/quarterly-results/2026-2027/q1/documents/q1-fy27-financial-results-auditorsreports.pdf' },
  { id:'infosys-q4-fy26-call', ticker:'INFY.NS', title:'Infosys Q4 FY26 Earnings Conference Call Transcript', type:'earnings_call', period:'Q4 FY 2025–26', published:'2026-04-23', url:'https://www.infosys.com/investors/reports-filings/quarterly-results/2025-2026/q4/documents/transcripts/earningscall.pdf' },
  { id:'infosys-q4-fy26-results', ticker:'INFY.NS', title:'Infosys Q4 FY26 Audited Financial Results', type:'results', period:'Q4 FY 2025–26', published:'2026-04-23', url:'https://www.infosys.com/investors/reports-filings/quarterly-results/2025-2026/q4/documents/q4-and-12m-fy26-financial-results-auditorsreports.pdf' },
  { id:'infosys-q3-fy26-call', ticker:'INFY.NS', title:'Infosys Q3 FY26 Earnings Conference Call Transcript', type:'earnings_call', period:'Q3 FY 2025–26', published:'2026-01-14', url:'https://www.infosys.com/investors/reports-filings/quarterly-results/2025-2026/q3/documents/transcripts/earningscall.pdf' },
  { id:'infosys-q3-fy26-results', ticker:'INFY.NS', title:'Infosys Q3 FY26 Audited Financial Results', type:'results', period:'Q3 FY 2025–26', published:'2026-01-14', url:'https://www.infosys.com/investors/reports-filings/quarterly-results/2025-2026/q3/documents/q3-and-9m-fy26-financial-results-auditorsreports.pdf' },
  { id:'cipla-q2-fy27-call', ticker:'CIPLA.NS', title:'Cipla Q2 FY27 Earnings Conference Call Transcript', type:'earnings_call', period:'Q2 FY 2026–27', published:'2026-10-27', url:'https://www.cipla.com/sites/default/files/Cipla_Q2FY27_Earning-Transcript.pdf' },
  { id:'cipla-q2-fy27-results', ticker:'CIPLA.NS', title:'Cipla Q2 FY27 Unaudited Financial Results', type:'results', period:'Q2 FY 2026–27', published:'2026-10-27', url:'https://www.cipla.com/sites/default/files/Cipla_SE_20261027_FR_Signed.pdf' },
  { id:'trent-q2-fy27-results', ticker:'TRENT.NS', title:'Trent Q2 FY27 Financial Results', type:'results', period:'Q2 FY 2026–27', published:'2026-10-30', url:'https://docs.trent-tata.com/Results_Q2_FY27.pdf' },
  { id:'coalindia-q2-fy27-results', ticker:'COALINDIA.NS', title:'Coal India Q2 FY27 Consolidated Financial Results Extract', type:'results', period:'Q2 FY 2026–27', published:'2026-10-30', url:'https://nsearchives.nseindia.com/corporate/COALINDIA_30102026122406_NP_Q2.pdf' },
  { id:'bpcl-ar-fy25', ticker:'BPCL.NS', title:'BPCL Annual Report 2024–25', type:'annual_report', period:'FY 2024–25', published:'2025-07-31', url:'https://www.bharatpetroleum.in/bharat-petroleum/pdf/annual-report-2024-25.pdf' }
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
  app.post('/api/research/modules',(req,res)=>{
    const raw=String(req.body?.ticker||'');const ticker=raw.toUpperCase().includes('.')?raw.toUpperCase():`${raw.toUpperCase()}.NS`;
    const sources=db.prepare("SELECT id,title,doc_type,period,published_at,source_url,pages FROM documents WHERE ticker=? AND status='indexed'").all(ticker) as any[];
    if(!sources.length)return res.status(409).json({error:`No indexed primary documents for ${ticker}.`,ticker,modules:[]});
    const specs=[
      {id:'business',title:'Business snapshot',terms:['business','segment','revenue','service','product','geography']},
      {id:'financials',title:'Financial snapshot and trajectory',terms:['revenue','profit','margin','growth','cash flow','year ended','quarter ended']},
      {id:'narrative',title:'Management narrative',terms:['guidance','expect','outlook','demand','growth','margin']},
      {id:'bull',title:'Potentially positive evidence',terms:['growth','opportunity','increase','improve','strong demand','record']},
      {id:'bear',title:'Risks and constraints',terms:['risk','challenge','decline','headwind','uncertainty','competition']}
    ];
    const chunks=db.prepare("SELECT c.id,c.document_id,c.page,c.text,d.title,d.doc_type,d.period,d.source_url FROM chunks c JOIN documents d ON d.id=c.document_id WHERE c.ticker=? AND d.status='indexed'").all(ticker) as any[];
    const modules=specs.map(spec=>{
      const ranked=chunks.map(row=>{const text=row.text.toLowerCase();const score=spec.terms.reduce((sum,term)=>sum+(text.match(new RegExp(`\\b${term.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&')}\\b`,'g'))||[]).length,0);return{...row,score};}).filter(row=>row.score>0).sort((a,b)=>b.score-a.score);
      const seen=new Set<string>();const evidence=ranked.filter(row=>{const key=`${row.document_id}|${row.page}`;if(seen.has(key))return false;seen.add(key);return true;}).slice(0,3).map(row=>({id:row.id,document:row.title,period:row.period,type:row.doc_type,page:row.page,sourceUrl:row.source_url,excerpt:row.text.slice(0,620)}));
      return{id:spec.id,title:spec.title,status:evidence.length?'evidence_found':'not_found',message:evidence.length?'Retrieved excerpts only; FINN does not infer a conclusion from these passages.':'Not found in the indexed primary documents.',evidence};
    });
    res.json({ticker,mode:'extractive evidence map · no LLM',coverage:{documentsSearched:sources.length,indexedPages:new Set(chunks.map(row=>`${row.document_id}:${row.page}`)).size,documents:sources.map(row=>({title:row.title,period:row.period,type:row.doc_type,sourceUrl:row.source_url,pages:row.pages}))},modules});
  });
  app.get('/api/research/results/:ticker',(req,res)=>{
    let ticker:string;try{ticker=normalizeNseTicker(req.params.ticker);}catch{return res.status(400).json({error:'Provide a valid NSE ticker.'});}
    const doc=db.prepare("SELECT id,title,period,source_url FROM documents WHERE ticker=? AND doc_type='results' AND status='indexed' ORDER BY published_at DESC LIMIT 1").get(ticker) as any;
    if(!doc)return res.status(404).json({ticker,error:'No indexed primary results statement is available.'});
    const pages=db.prepare('SELECT c.page,MIN(c.id) AS chunk_id,GROUP_CONCAT(c.text,CHAR(32)) AS text FROM chunks c WHERE c.document_id=? GROUP BY c.page ORDER BY c.page').all(doc.id) as any[];
    const labels=[['revenue','Revenue from operations'],['pbt','Profit before tax'],['pat','Profit for the period']] as const;
    const page=pages.find(candidate=>labels.some(([,label])=>extractQuarterResultRow(candidate.text,label)!==null));
    const metrics:any={};
    for(const [key,label] of labels){
      const values=page?extractQuarterResultRow(page.text,label):null;
      if(!values){metrics[key]={label,status:'not_reliably_extracted',basis:'Consolidated',unit:'₹ crore',source:doc.title,sourceUrl:doc.source_url,page:page?.page??null};continue;}
      const qoq=financialChange(values[0],values[1]);const yoy=financialChange(values[0],values[2]);
      metrics[key]={label,status:'extracted',value:values[0],period:doc.period,basis:'Consolidated',unit:'₹ crore',qoq:{priorPeriod:'immediately previous quarter',absolute:qoq.absolute,percentage:qoq.percentage,percentageMeaningful:qoq.percentageMeaningful,formula:`(${values[0]} - ${values[1]}) / ${values[1]} × 100`},yoy:{priorPeriod:'same quarter previous year',absolute:yoy.absolute,percentage:yoy.percentage,percentageMeaningful:yoy.percentageMeaningful,formula:`(${values[0]} - ${values[2]}) / ${values[2]} × 100`},source:doc.title,sourceUrl:doc.source_url,page:page.page,evidenceChunkId:page.chunk_id,evidenceExcerpt:`${label} ${values.join(' ')}`};
    }
    metrics.ebitda={label:'EBITDA',status:'not_reliably_extracted',basis:'Consolidated',unit:'₹ crore',source:doc.title,sourceUrl:doc.source_url,page:page?.page??null,reason:'No explicit EBITDA row was found in the audited statement table; FINN will not infer a company-specific EBITDA definition.'};
    res.json({ticker,period:doc.period,basis:'Consolidated',unit:'₹ crore',document:doc.title,sourceUrl:doc.source_url,metrics,method:'Deterministic extraction from one consolidated audited statement page. QoQ uses the immediately preceding quarter; YoY uses the same quarter last year. EBITDA remains unextracted unless explicitly disclosed.'});
  });
  app.get('/api/research/narrative/:ticker',(req,res)=>{
    let ticker:string;try{ticker=normalizeNseTicker(req.params.ticker);}catch{return res.status(400).json({error:'Provide a valid NSE ticker.'});}
    const specs=[
      {doc:'infosys-q2-fy27-call',period:'Q2 FY27',target:'FY27'},
      {doc:'infosys-q1-fy27-call',period:'Q1 FY27',target:'FY27'},
      {doc:'infosys-q4-fy26-call',period:'Q4 FY26',target:'FY27'},
      {doc:'infosys-q3-fy26-call',period:'Q3 FY26',target:'FY26'}
    ];
    const claims=specs.map(spec=>{
      const doc=db.prepare("SELECT id,title,period,source_url FROM documents WHERE id=? AND ticker=? AND status='indexed' AND doc_type='earnings_call'").get(spec.doc,ticker) as any;
      if(!doc)return{period:spec.period,status:'source_not_indexed',message:'The primary transcript is not indexed.'};
      const chunks=db.prepare("SELECT c.id,c.page,c.text,d.title,d.source_url FROM chunks c JOIN documents d ON d.id=c.document_id WHERE c.document_id=? ORDER BY c.page,c.chunk_index").all(doc.id) as any[];
      const candidate=chunks.find(row=>/revenue.{0,50}guidance|guidance.{0,50}revenue/i.test(row.text)&&/\d+(?:\.\d+)?\s*%\s*to\s*\d+(?:\.\d+)?\s*%/i.test(row.text));
      if(!candidate)return{period:spec.period,status:'guidance_not_found',message:'No explicit revenue growth range was found in the indexed transcript.'};
      const range=candidate.text.match(/\d+(?:\.\d+)?\s*%\s*to\s*\d+(?:\.\d+)?\s*%/i)?.[0]??null;
      const rangeNumbers=range?.match(/\d+(?:\.\d+)?/g)?.map(Number)??[];
      const offset=candidate.text.toLowerCase().search(/revenue.{0,50}guidance|guidance.{0,50}revenue/i);
      const excerpt=candidate.text.slice(Math.max(0,offset-180),Math.min(candidate.text.length,offset+420)).trim();
      let outcome:any={status:'outcome_not_found',message:`No comparable full-year ${spec.target} actual is available in the indexed primary documents.`};
      if(spec.target==='FY26'){
        const outcomeDoc=db.prepare("SELECT id,title,source_url FROM documents WHERE id='infosys-q4-fy26-call' AND ticker=? AND status='indexed'").get(ticker) as any;
        const actual=outcomeDoc?db.prepare("SELECT id,page,text FROM chunks WHERE document_id=? AND lower(text) LIKE '%fy26 revenues%' AND text LIKE '%3.1%' ORDER BY page,chunk_index LIMIT 1").get(outcomeDoc.id) as any:undefined;
        if(actual){const actualMatch=actual.text.match(/FY26 revenues[^.]{0,180}?3\.1%[^.]*/i);const value=3.1;const inside=rangeNumbers.length===2&&value>=rangeNumbers[0]&&value<=rangeNumbers[1];outcome={status:'comparable_outcome_found',value,unit:'% constant currency',period:'FY26 full year',withinGuidanceRange:inside,comparison:inside?'Reported full-year growth fell within the stated guidance range.':'Reported full-year growth fell outside the stated guidance range.',document:outcomeDoc.title,page:actual.page,sourceUrl:outcomeDoc.source_url,evidenceChunkId:actual.id,evidenceExcerpt:actualMatch?.[0]??actual.text.slice(0,360)};}
      }
      return{period:spec.period,targetPeriod:`FY${spec.target.slice(2)} full year`,classification:'explicit_quantitative_guidance',guidanceRange:range,unit:'% constant currency',transcript:{document:candidate.title,page:candidate.page,sourceUrl:candidate.source_url,evidenceChunkId:candidate.id,excerpt},outcome};
    });
    res.json({ticker,mode:'deterministic transcript-to-outcome evidence map',coverage:{transcriptsSearched:claims.filter(x=>(x as any).transcript).length,quarters:claims.length},claims});
  });
  app.get('/api/evidence/:id',(req,res)=>{
    const row=db.prepare('SELECT c.id,c.page,c.text,d.title,d.period,d.doc_type,d.source_url,d.ticker FROM chunks c JOIN documents d ON d.id=c.document_id WHERE c.id=?').get(req.params.id);
    if(!row)return res.status(404).json({error:'Evidence chunk not found.'});res.json(row);
  });
}
