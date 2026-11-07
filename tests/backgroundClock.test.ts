import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createClock,tickClock} from '../logic/clocks';
import type {TimeSettings} from '../types';
test('one delayed clock settlement charges the same hidden time as regular callbacks in all systems',()=>{
 for(const system of ['absolute','fischer','japanese','canadian','ing','nhk'] as const){
  const settings={system,mainTimeMinutes:1,byoyomiSeconds:30,byoyomiPeriods:5,canadianMinutes:2,canadianStones:10,ingBlockSeconds:60,ingPeriods:3,nhkSeconds:30,nhkPeriods:5} as TimeSettings;
  const initial=createClock(settings,10000);const delayed=tickClock(initial,settings,35000);
  let sliced={clock:initial,timedOut:false};for(let i=0;i<35&&!sliced.timedOut;i++)sliced=tickClock(sliced.clock,settings,1000);
  assert.deepEqual(delayed,sliced,system);assert.equal(initial.mainTimeLeft,10000,'Original clock is not mutated');
 }
});
test('long hidden intervals can exhaust overtime and cannot grant extra time',()=>{
 for(const system of ['japanese','canadian','ing','nhk'] as const){
  const settings={system,byoyomiSeconds:30,byoyomiPeriods:3,canadianMinutes:1,canadianStones:10,ingBlockSeconds:30,ingPeriods:2,nhkSeconds:30,nhkPeriods:2} as TimeSettings;
  assert.equal(tickClock(createClock(settings,1000),settings,300000).timedOut,true,system);
 }
});
