import test from 'node:test';
import assert from 'node:assert/strict';
import { classify, extractQuarterResultRow, financialChange, filingRuleMatches, moveThresholdExceeded, normalizeNseTicker, parseNseDate, percentMove, stableFilingId, volumeThresholdExceeded, volumeMultiple, withinWindow } from '../server/domain.js';

test('normalizes symbols and rejects invalid input',()=>{
  assert.equal(normalizeNseTicker('infy'),'INFY.NS');
  assert.equal(normalizeNseTicker('RELIANCE.NS'),'RELIANCE.NS');
  assert.equal(normalizeNseTicker('ABC.BO'),'ABC.BO');
  assert.throws(()=>normalizeNseTicker('INFY/../../secret'));
});
test('announcement classification preserves reference category IDs and reason tiers',()=>{
  assert.deepEqual(classify('Quarterly financial results submitted'),{category:'results',priority:'High'});
  assert.deepEqual(classify('Appointment of Chief Financial Officer'),{category:'management_change',priority:'High'});
  assert.deepEqual(classify('Declared interim dividend with record date'),{category:'dividend',priority:'Medium'});
  assert.deepEqual(classify('Compliance certificate under listing regulations'),{category:'unclassified',priority:'Routine'});
});
test('NSE local timestamp is parsed explicitly as India time',()=>{
  assert.equal(parseNseDate('14-Nov-2026 02:37:11'),'2026-11-13T21:07:11.000Z');
});
test('stable filing IDs deduplicate identical source rows',()=>{
  assert.equal(stableFilingId(['INFY.NS','time','subject','url']),stableFilingId(['INFY.NS','time','subject','url']));
  assert.notEqual(stableFilingId(['INFY.NS','time','subject','url']),stableFilingId(['INFY.NS','time','different','url']));
});
test('EOD close percentage handles threshold, missing, and zero baselines',()=>{
  assert.equal(percentMove(105,100),5);
  assert.equal(percentMove(95,100),-5);
  assert.equal(percentMove(10,0),null);
  assert.equal(percentMove(Number.NaN,10),null);
});
test('volume multiple requires exactly 20 prior sessions and excludes current',()=>{
  const prior=Array.from({length:20},()=>100);
  assert.equal(volumeMultiple(200,prior),2);
  assert.equal(volumeMultiple(99,prior.slice(1)),null);
  assert.equal(volumeMultiple(100,Array(20).fill(0)),null);
});
test('window filtering includes the boundary and rejects future rows',()=>{
  const now=1_800_000_000_000;
  assert.equal(withinWindow(now-24*3600000,now,24),true);
  assert.equal(withinWindow(now+1,now,24),false);
  assert.equal(withinWindow(now-25*3600000,now,24),false);
});
test('alert thresholds include the boundary and reject missing observations',()=>{
  assert.equal(moveThresholdExceeded(-5,5),true);
  assert.equal(moveThresholdExceeded(4.99,5),false);
  assert.equal(moveThresholdExceeded(null,5),false);
  assert.equal(volumeThresholdExceeded(2,2),true);
  assert.equal(volumeThresholdExceeded(null,2),false);
});
test('financial comparisons handle positive, zero, and negative prior periods safely',()=>{
  assert.deepEqual(financialChange(120,100),{absolute:20,percentage:20,percentageMeaningful:true});
  assert.deepEqual(financialChange(10,0),{absolute:10,percentage:null,percentageMeaningful:false});
  assert.deepEqual(financialChange(-5,-10),{absolute:5,percentage:null,percentageMeaningful:false});
  assert.deepEqual(financialChange(Number.NaN,1),{absolute:null,percentage:null,percentageMeaningful:false});
});
test('filing rules match one ticker or the whole portfolio and deduplicate category scope',()=>{
  assert.equal(filingRuleMatches('INFY.NS','results|dividend','INFY.NS','results'),true);
  assert.equal(filingRuleMatches('INFY.NS','results','TCS.NS','results'),false);
  assert.equal(filingRuleMatches('*','*','TCS.NS','capex'),true);
});
test('quarter result extraction requires consolidated basis, currency units, and three period values',()=>{
  const page='Statement of Consolidated Audited Results for quarter ended September 30 (in ₹ crore) Revenue from operations 49,244 48,211 44,490 Profit before tax 11,063 11,028 10,229 Profit for the period 7,838 7,775 7,375';
  assert.deepEqual(extractQuarterResultRow(page,'Revenue from operations'),[49244,48211,44490]);
  assert.deepEqual(extractQuarterResultRow(page,'Profit before tax'),[11063,11028,10229]);
  assert.equal(extractQuarterResultRow(page,'EBITDA'),null);
  assert.equal(extractQuarterResultRow(page.replace('Consolidated ',''),'Revenue from operations'),null);
});
