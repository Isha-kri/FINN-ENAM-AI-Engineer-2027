import { createHash } from 'node:crypto';

export const announcementCategories:Record<string,string[]>={
  results:['financial results','quarterly results','audited results'], 'M&A':['acquisition','merger','demerger','joint venture'], fund_raise:['qip','preferential allotment','rights issue','commercial paper'], management_change:['resignation','appointment','chief financial officer','managing director'], litigation:['court','fine','penalty','regulatory order','insolvency'], insider_trading:['disclosure under regulation 7','insider trading'], earnings_call:['earnings call','conference call','concall'], investor_meetings:['investor meeting','institutional investor','investor conference'], credit_rating:['credit rating','rating outlook'], dividend:['dividend','record date'], bonus_split:['stock split','bonus issue'], capex:['capital expenditure','capacity expansion','new plant'], press_release:['press release','order win','launch'], postal_ballot:['postal ballot'], agm_egm:['annual general meeting','extraordinary general meeting'], pledging:['pledge','encumbrance']
};
const highPriority=new Set(['results','M&A','fund_raise','management_change','litigation','credit_rating','pledging']);
const mediumPriority=new Set(['insider_trading','dividend','bonus_split','capex','earnings_call','investor_meetings','press_release']);
export type Priority='High'|'Medium'|'Routine';
export function classify(title:string){const text=title.toLowerCase();for(const [category,terms]of Object.entries(announcementCategories))if(terms.some(term=>text.includes(term)))return{category,priority:(highPriority.has(category)?'High':mediumPriority.has(category)?'Medium':'Routine') as Priority};return{category:'unclassified',priority:'Routine' as Priority};}
export function normalizeNseTicker(input:string){const ticker=input.trim().toUpperCase();if(!/^[A-Z0-9&-]+(?:\.(?:NS|BO))?$/.test(ticker))throw new Error('Ticker must be an NSE/BSE symbol such as INFY or INFY.NS');return ticker.includes('.')?ticker:`${ticker}.NS`;}
export function parseNseDate(value:string){const match=value.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4}) (\d{2}:\d{2}:\d{2})$/);const months:Record<string,string>={Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};const iso=match?`${match[3]}-${months[match[2]]}-${match[1].padStart(2,'0')}T${match[4]}+05:30`:value;return new Date(iso).toISOString();}
export function stableFilingId(parts:string[]){return createHash('sha256').update(parts.join('|')).digest('hex');}
export function percentMove(current:number,previous:number){if(!Number.isFinite(current)||!Number.isFinite(previous)||previous===0)return null;return(current-previous)/previous*100;}
export function volumeMultiple(current:number,priorSessions:number[]){if(!Number.isFinite(current)||priorSessions.length!==20||priorSessions.some(v=>!Number.isFinite(v)))return null;const average=priorSessions.reduce((a,b)=>a+b,0)/priorSessions.length;return average>0?current/average:null;}
export function withinWindow(timestamp:number,now:number,hours:number){return Number.isFinite(timestamp)&&timestamp<=now&&timestamp>=now-hours*3600000;}
export function moveThresholdExceeded(move:number|null,threshold:number){return move!==null&&Number.isFinite(threshold)&&threshold>0&&Math.abs(move)>=threshold;}
export function volumeThresholdExceeded(multiple:number|null,threshold:number){return multiple!==null&&Number.isFinite(threshold)&&threshold>0&&multiple>=threshold;}
export function financialChange(current:number,prior:number){
  if(!Number.isFinite(current)||!Number.isFinite(prior))return{absolute:null as number|null,percentage:null as number|null,percentageMeaningful:false};
  const absolute=current-prior;
  return{absolute,percentage:prior>0?absolute/prior*100:null,percentageMeaningful:prior>0};
}
export function filingRuleMatches(ruleTicker:string,ruleCategories:string,filingTicker:string,filingCategory:string){
  const tickerMatches=ruleTicker==='*'||ruleTicker.toUpperCase()===filingTicker.toUpperCase();
  const categories=ruleCategories.split('|').map(x=>x.trim()).filter(Boolean);
  return tickerMatches&&(categories.length===0||categories.includes('*')||categories.includes(filingCategory));
}
export function extractQuarterResultRow(pageText:string,label:string){
  if(!/statement of consolidated audited results/i.test(pageText)||!/quarter ended/i.test(pageText)||!/in ₹ crore/i.test(pageText))return null;
  const escaped=label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const match=pageText.replace(/\s+/g,' ').match(new RegExp(`(?:^|\\s)${escaped}\\s+([\\d,]+)\\s+([\\d,]+)\\s+([\\d,]+)(?=\\s|$)`,'i'));
  if(!match)return null;
  const values=match.slice(1,4).map(value=>Number(value.replace(/,/g,'')));
  return values.every(Number.isFinite)?values:null;
}
