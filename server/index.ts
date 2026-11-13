import express from 'express';
import Database from 'better-sqlite3';
import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { registerResearch } from './research.js';
import { classify as classifyAnnouncement, normalizeNseTicker, parseNseDate, percentMove, stableFilingId, volumeMultiple } from './domain.js';

const app = express();
app.use(express.json());
const dataDir = join(process.cwd(), 'data'); mkdirSync(dataDir, { recursive: true });
const db = new Database(join(dataDir, 'finn.sqlite'));
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS alert_rules (id TEXT PRIMARY KEY, ticker TEXT NOT NULL, kind TEXT NOT NULL, threshold REAL NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS refreshes (id INTEGER PRIMARY KEY AUTOINCREMENT, provider TEXT NOT NULL, status TEXT NOT NULL, detail TEXT NOT NULL, fetched_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS filings (id TEXT PRIMARY KEY, ticker TEXT NOT NULL, company TEXT NOT NULL, title TEXT NOT NULL, category TEXT NOT NULL, priority TEXT NOT NULL, published_at TEXT NOT NULL, url TEXT NOT NULL, source TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS prices (ticker TEXT NOT NULL, day TEXT NOT NULL, close REAL NOT NULL, adjclose REAL NOT NULL, volume REAL NOT NULL, fetched_at TEXT NOT NULL, PRIMARY KEY(ticker,day));
CREATE TABLE IF NOT EXISTS alert_events (id TEXT PRIMARY KEY, rule_id TEXT NOT NULL, ticker TEXT NOT NULL, day TEXT NOT NULL, kind TEXT NOT NULL, explanation TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY,ticker TEXT NOT NULL,title TEXT NOT NULL,doc_type TEXT NOT NULL,period TEXT NOT NULL,published_at TEXT NOT NULL,source_url TEXT NOT NULL,file_path TEXT,checksum TEXT,status TEXT NOT NULL,pages INTEGER NOT NULL DEFAULT 0,indexed_at TEXT);
CREATE TABLE IF NOT EXISTS chunks (id TEXT PRIMARY KEY,document_id TEXT NOT NULL,ticker TEXT NOT NULL,page INTEGER NOT NULL,chunk_index INTEGER NOT NULL,text TEXT NOT NULL,FOREIGN KEY(document_id) REFERENCES documents(id));`);

const companies = [
  ['RELIANCE.NS','Reliance Industries','Energy'],['HDFCBANK.NS','HDFC Bank','Financials'],['ICICIBANK.NS','ICICI Bank','Financials'],['SBIN.NS','State Bank of India','Financials'],['INFY.NS','Infosys','Technology'],['TCS.NS','Tata Consultancy Services','Technology'],['BHARTIARTL.NS','Bharti Airtel','Telecom'],['ITC.NS','ITC','Consumer'],['LT.NS','Larsen & Toubro','Industrials'],['SUNPHARMA.NS','Sun Pharmaceutical','Healthcare'],['TITAN.NS','Titan Company','Consumer'],['ASIANPAINT.NS','Asian Paints','Consumer'],['NTPC.NS','NTPC','Utilities'],['TATASTEEL.NS','Tata Steel','Materials'],['MARUTI.NS','Maruti Suzuki India','Automotive'],['ULTRACEMCO.NS','UltraTech Cement','Materials'],['HINDUNILVR.NS','Hindustan Unilever','Consumer'],['POWERGRID.NS','Power Grid Corporation','Utilities']
].map(([ticker,name,sector])=>({ticker,name,sector}));
app.get('/api/portfolio',(_req,res)=>res.json({companies,source:'Configured demo universe'}));
app.get('/api/status',(_req,res)=>{const last=db.prepare('SELECT * FROM refreshes ORDER BY id DESC LIMIT 1').get();res.json({mode:'EOD / delayed',lastRefresh:last??null,portfolio:companies.length});});
app.get('/api/filings',(_req,res)=>res.json(db.prepare('SELECT * FROM filings ORDER BY published_at DESC LIMIT 100').all()));
app.get('/api/rules',(_req,res)=>res.json(db.prepare('SELECT * FROM alert_rules ORDER BY updated_at DESC').all()));
app.put('/api/rules', (req,res)=>{const {id,kind,threshold,enabled}=req.body??{};let ticker:string;try{ticker=normalizeNseTicker(String(req.body?.ticker||''));}catch{return res.status(400).json({error:'Provide a valid NSE/BSE ticker.'});}if(!id||!['move','volume'].includes(kind)||!Number.isFinite(threshold)||threshold<=0)return res.status(400).json({error:'Provide id, kind (move or volume), and a positive numeric threshold.'}); db.prepare('INSERT INTO alert_rules(id,ticker,kind,threshold,enabled,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET ticker=excluded.ticker,kind=excluded.kind,threshold=excluded.threshold,enabled=excluded.enabled,updated_at=excluded.updated_at').run(id,ticker,kind,threshold,enabled?1:0,new Date().toISOString());res.json({ok:true});});
app.delete('/api/rules/:id',(req,res)=>{db.prepare('DELETE FROM alert_rules WHERE id=?').run(req.params.id);res.json({ok:true});});
app.get('/api/alerts',(_req,res)=>res.json(db.prepare('SELECT * FROM alert_events ORDER BY created_at DESC LIMIT 50').all()));
app.get('/api/prices/latest',(_req,res)=>res.json(db.prepare(`SELECT p.* FROM prices p JOIN (SELECT ticker,MAX(day) AS day FROM prices GROUP BY ticker) x ON x.ticker=p.ticker AND x.day=p.day ORDER BY p.ticker`).all()));
app.post('/api/refresh',async(_req,res)=>{
  const fetchedAt=new Date().toISOString(); const outcomes:string[]=[];let inserted=0;let rssOk=false;let priceOk=0;let priceFailed=0;const touched:string[]=[];
  try {
    const rss=await fetch('https://nsearchives.nseindia.com/content/RSS/Online_announcements.xml',{headers:{'User-Agent':'Mozilla/5.0 FINN local prototype','Accept':'application/rss+xml, application/xml, text/xml'},signal:AbortSignal.timeout(12000)});
    if(!rss.ok) throw new Error(`NSE RSS HTTP ${rss.status}`);
    rssOk=true;const xml=await rss.text(); const unescape=(s:string)=>s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");const items=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(m=>m[1]);
    for(const item of items){const field=(tag:string)=>unescape(item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,'i'))?.[1]?.replace(/<!\[CDATA\[|\]\]>/g,'').trim()??'');const companyName=field('title');const description=field('description');const url=field('link');const published=field('pubDate');
      const haystack=(companyName+' '+description).toLowerCase();const match=companies.find(c=>haystack.includes(c.name.toLowerCase())||haystack.includes(c.name.replace('&','and').toLowerCase())); if(!match||!url||!companyName) continue;
      const summary=description.replace(/\s*\|\s*SUBJECT:\s*/i,' · ');const {category,priority}=classifyAnnouncement(companyName+' '+description);const id=stableFilingId([match.ticker,published,description,url]);const r=db.prepare('INSERT OR IGNORE INTO filings(id,ticker,company,title,category,priority,published_at,url,source) VALUES(?,?,?,?,?,?,?,?,?)').run(id,match.ticker,match.name,summary||companyName,category,priority,parseNseDate(published),url,'NSE RSS');inserted+=r.changes;
    }
    outcomes.push(`NSE RSS: ${items.length} items scanned; ${inserted} new portfolio filings stored.`);
  } catch(e) { outcomes.push(`NSE RSS unavailable: ${(e as Error).message}`); }
  const rules=db.prepare('SELECT * FROM alert_rules WHERE enabled=1').all() as {id:string;ticker:string;kind:string;threshold:number}[];const upsert=db.prepare('INSERT INTO prices(ticker,day,close,adjclose,volume,fetched_at) VALUES(?,?,?,?,?,?) ON CONFLICT(ticker,day) DO UPDATE SET close=excluded.close,adjclose=excluded.adjclose,volume=excluded.volume,fetched_at=excluded.fetched_at');
  const saveEvent=db.prepare('INSERT OR IGNORE INTO alert_events(id,rule_id,ticker,day,kind,explanation,created_at) VALUES(?,?,?,?,?,?,?)');
  const marketTargets=[...companies,...[...new Set(rules.map(r=>r.ticker).filter(t=>!companies.some(c=>c.ticker===t)))].map(t=>({ticker:t,name:t,sector:'Custom'}))];
  for(const company of marketTargets){try{const response=await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(company.ticker)}?range=3mo&interval=1d&events=history`,{headers:{'User-Agent':'Mozilla/5.0 FINN local prototype'},signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error(`HTTP ${response.status}`);const payload=await response.json() as any;const result=payload.chart?.result?.[0];const timestamps:number[]=result?.timestamp??[];const quote=result?.indicators?.quote?.[0];const adjusted:number[]=result?.indicators?.adjclose?.[0]?.adjclose??[];const observations=timestamps.map((ts,i)=>({day:new Date(ts*1000).toISOString().slice(0,10),close:quote?.close?.[i],adjclose:adjusted[i]??quote?.close?.[i],volume:quote?.volume?.[i]})).filter(x=>Number.isFinite(x.close)&&Number.isFinite(x.volume));if(!observations.length)throw new Error('No daily observations');const latest=observations.at(-1)!;const knownDay=(db.prepare('SELECT MAX(day) AS day FROM prices WHERE ticker=?').get(company.ticker) as {day:string|null}).day;const isNewSession=!knownDay||latest.day>knownDay;for(const x of observations)upsert.run(company.ticker,x.day,x.close,x.adjclose,x.volume,fetchedAt);priceOk++;touched.push(company.ticker);const prior=observations.at(-2);const average=observations.slice(-21,-1);const ratio=average.length===20?volumeMultiple(latest.volume,average.map(x=>x.volume)):null;const avgVolume=average.length===20?average.reduce((sum,x)=>sum+x.volume,0)/20:null;if(isNewSession)for(const rule of rules.filter(x=>x.ticker===company.ticker)){let reason='';if(rule.kind==='move'&&prior){const move=percentMove(latest.adjclose,prior.adjclose);if(move!==null&&Math.abs(move)>=rule.threshold)reason=`${latest.day}: adjusted close ₹${latest.adjclose.toFixed(2)} vs prior ₹${prior.adjclose.toFixed(2)} (${move>=0?'+':''}${move.toFixed(2)}%, threshold ±${rule.threshold}%).`;}if(rule.kind==='volume'&&avgVolume!==null&&ratio!==null&&ratio>=rule.threshold)reason=`${latest.day}: volume ${Math.round(latest.volume).toLocaleString('en-IN')} vs prior 20-session average ${Math.round(avgVolume).toLocaleString('en-IN')} (${ratio!.toFixed(2)}×; threshold ${rule.threshold}×).`;if(reason)saveEvent.run(createHash('sha256').update(`${rule.id}|${latest.day}|${rule.kind}`).digest('hex'),rule.id,company.ticker,latest.day,rule.kind,reason,new Date().toISOString());}await new Promise(r=>setTimeout(r,120));}catch{priceFailed++;}}
  outcomes.push(`Yahoo chart EOD/delayed: ${priceOk} symbols refreshed; ${priceFailed} unavailable.`);const status=rssOk?'success':priceOk?'partial':'unavailable';const detail=outcomes.join(' ');db.prepare('INSERT INTO refreshes(provider,status,detail,fetched_at) VALUES(?,?,?,?)').run('NSE RSS + Yahoo chart',status,detail,fetchedAt);
  res.status(200).json({ok:rssOk||priceOk>0,status,detail,fetchedAt,inserted,marketUpdated:priceOk,marketFailed:priceFailed,mode:'EOD / delayed; fetched at refresh time'});
});
app.get('/api/research/infosys',(_req,res)=>res.redirect('/api/research/documents/INFY.NS'));
registerResearch(app,db,dataDir);
app.use(express.static(join(process.cwd(),'dist')));app.get(/^(?!\/api\/).*/,(req,res,next)=>req.path.startsWith('/api/')?next():res.sendFile(join(process.cwd(),'dist','index.html')));
const port=Number(process.env.PORT||8000);app.listen(port,()=>console.log(`FINN listening on http://localhost:${port}`));
