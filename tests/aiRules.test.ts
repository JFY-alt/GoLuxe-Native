import {test} from 'node:test';
import assert from 'node:assert/strict';
import {toFastState,evaluateSearchPosition,getBestMove,getBestMoveAsync} from '../logic/simpleAi';
import {emptyPosition,playMove,passMove} from '../logic/sgf';
import {calculateScores,getBoardString} from '../logic/goEngine';
import {ENDGAME_LESSON} from '../data/endgameLesson';
import {lessonBoard} from '../logic/study';
test('search scoring honors Japanese prisoners vs Chinese stones, komi, and inherited captures',()=>{
 const board=lessonBoard(ENDGAME_LESSON,1);
 for(const ruleset of ['japanese','chinese'] as const)for(const komi of [0,7.5,-3.5]){
  const position={...emptyPosition(9,ruleset),board,captures:{black:5,white:2}};
  const fast=toFastState(position,komi),score=evaluateSearchPosition(fast);
  const expected=calculateScores(board,position.captures,komi>=0?komi:0,komi<0?-komi:0,new Set(),ruleset);
  assert.equal(score.black,expected.black.total);assert.equal(score.white,expected.white.total);
 }
});
test('search positions agree with the authoritative engine on every candidate along deterministic games',()=>{
 for(const ruleset of ['japanese','chinese'] as const){
  let position=emptyPosition(9,ruleset),fast=toFastState(position,0);let seed=301;
  for(let move=0;move<35;move++){
   const legal:number[]=[];
   for(let idx=0;idx<81;idx++){
    const clone=fast.clone(),before=clone.positionKey();let expected:ReturnType<typeof playMove>|null=null;
    try{expected=playMove(position,{x:idx%9,y:Math.floor(idx/9)});}catch{}
    const accepted=clone.play(idx);assert.equal(accepted,!!expected,`${ruleset} move ${move} point ${idx}`);
    if(expected){legal.push(idx);assert.equal(clone.positionKey(),getBoardString(expected.board));assert.equal(clone.captures[1],expected.captures.black);assert.equal(clone.captures[2],expected.captures.white);}
    else assert.equal(clone.positionKey(),before,'Rejected simulations restore the board');
   }
   seed=(seed*1664525+1013904223)>>>0;
   if(move%11===10||!legal.length){fast.play(-1);position=passMove(position);}
   else{const idx=legal[seed%legal.length];assert.ok(fast.play(idx));position=playMove(position,{x:idx%9,y:Math.floor(idx/9)});}
  }
 }
});
test('older repetition is forbidden in Chinese search, permitted under Japanese simple-ko convention',()=>{
 const current=emptyPosition(9),target=playMove(current,{x:7,y:7});
 for(const ruleset of ['japanese','chinese'] as const){
  const position={...current,ruleset,history:[getBoardString(target.board),'older unrelated position',getBoardString(current.board)]};
  assert.equal(toFastState(position).play(70),ruleset==='japanese');
 }
});
test('exact ko is rejected without mutation; passing lifts simple ko but not positional superko',()=>{
 const rows=['.XO......','XO.O.....','.XO......','.........','.........','.........','.........','.........','.........'];
 for(const ruleset of ['japanese','chinese'] as const){
  const board=rows.map(r=>[...r].map(c=>c==='X'?'black' as const:c==='O'?'white' as const:null));
  const initial={...emptyPosition(9,ruleset),board,history:[getBoardString(board)]};
  const captured=playMove(initial,{x:2,y:1}),fast=toFastState(initial);assert.ok(fast.play(11));assert.equal(fast.positionKey(),getBoardString(captured.board));
  const key=fast.positionKey(),caps={...fast.captures};assert.equal(fast.play(10),false);assert.equal(fast.positionKey(),key);assert.deepEqual(fast.captures,caps);
  fast.play(-1);fast.play(-1);assert.equal(fast.play(10),ruleset==='japanese');
 }
});

test('large estimated deficits do not end the game through an uncalibrated AI resignation',async()=>{
 const board=lessonBoard(ENDGAME_LESSON,1),key=getBoardString(board);
 const position={...emptyPosition(9),board,history:Array(35).fill(key)};
 assert.notEqual(getBestMove(position,'advanced',1000),'resign');
 assert.notEqual(await getBestMoveAsync(position,'master',1000,{budgetMs:25}),'resign');
});
