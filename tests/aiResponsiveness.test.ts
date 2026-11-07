import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getBestMoveAsync} from '../logic/simpleAi';
import {emptyPosition,playMove} from '../logic/sgf';
import {getBoardString} from '../logic/goEngine';
test('MCTS yields to timers while thinking and returns a legal move without changing the source position',async()=>{
 for(const size of [9,13,19]){
  const position=emptyPosition(size),before=getBoardString(position.board);let heartbeats=0;
  const timer=setInterval(()=>heartbeats++,1);
  try{
   const choice=await getBestMoveAsync(position,'master',7.5,{budgetMs:60});
   assert.ok(heartbeats>=2,`${size}: the UI event loop must run during search`);
   if(typeof choice!=='string')assert.doesNotThrow(()=>playMove(position,choice));
   assert.equal(getBoardString(position.board),before);
  }finally{clearInterval(timer);}
 }
});
test('changing the game cancels an in-flight search instead of returning an obsolete move',async()=>{
 let cancelled=false;let timer:ReturnType<typeof setTimeout>;
 const search=getBestMoveAsync(emptyPosition(19),'master',7.5,{budgetMs:6000,cancelled:()=>cancelled});
 timer=setTimeout(()=>{cancelled=true;},20);
 try{await assert.rejects(search,{name:'AbortError'});}finally{clearTimeout(timer);}
});
test('already cancelled search never starts and heuristic levels respect cancellation after yielding',async()=>{
 await assert.rejects(getBestMoveAsync(emptyPosition(9),'master',7.5,{cancelled:()=>true}),{name:'AbortError'});
 let checks=0;await assert.rejects(getBestMoveAsync(emptyPosition(9),'beginner',7.5,{cancelled:()=>++checks>1}),{name:'AbortError'});
});
test('interleaved searches on different board sizes keep independent neighbor geometry',async()=>{
 const positions=[emptyPosition(9),emptyPosition(19)];
 const choices=await Promise.all(positions.map(p=>getBestMoveAsync(p,'master',7.5,{budgetMs:40})));
 choices.forEach((choice,i)=>{if(typeof choice!=='string')assert.doesNotThrow(()=>playMove(positions[i],choice));});
});
