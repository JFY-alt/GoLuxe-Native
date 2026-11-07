import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decodeSession,encodeSession,LiveSession,recoverSession} from '../logic/gameSession';
import {appendMove,createRecord,emptyPosition,parseSgf,passMove,playMove,rewindHandicapSetup,serializeSgf} from '../logic/sgf';
import {createClock,tickClock} from '../logic/clocks';
function fixture():LiveSession{
 const game=emptyPosition(9),root=createRecord(game,7.5);
 return {version:1,savedAt:1000,clockAt:1000,mode:'2p',game,root,selected:root,snapshots:[],
  aiConfig:null,timeSettings:null,gameStarted:true,clocks:{black:createClock(null,60000),white:createClock(null,60000)},
  reviewMode:false,handicapOn:false,handicapType:'fixed',handicapCount:1,komiDirection:'standard',komiValue:7.5,customKomi:'',scoringTool:'dead'};
}
test('recovery preserves branch identity, exact ko history, undo positions and review comments',()=>{
 const s=fixture(),first=playMove(s.game,{x:2,y:2}),node=appendMove(s.root,s.game,first,{x:2,y:2});
 appendMove(node,first,playMove(first,{x:3,y:3}),{x:3,y:3});
 const alternative=playMove(first,{x:5,y:5}),selected=appendMove(node,first,alternative,{x:5,y:5});selected.properties.C=['A continuation'];
 s.game=alternative;s.selected=selected;s.snapshots=[{node:s.root,position:s.root.position},{node,position:first}];s.reviewMode=true;
 const restored=decodeSession(encodeSession(s))!;
 assert.deepEqual(restored.game,s.game);assert.equal(restored.selected,restored.root.children[0].children[1]);
 assert.equal(restored.snapshots[1].node,restored.selected.parent);assert.deepEqual(restored.snapshots[1].position,first);
 assert.equal(serializeSgf(restored.root),serializeSgf(s.root));assert.equal(restored.reviewMode,true);
});
test('scoring marks, ended result, compensation and AI configuration survive independently of SGF',()=>{
 const s=fixture();s.game={...playMove(s.game,{x:1,y:1}),phase:'scoring',deadStones:new Set(['1,1']),sekiPoints:new Set(['3,3'])};
 s.mode='ai';s.aiConfig={userColor:'white',difficulty:'master'};s.komiDirection='reverse';s.komiValue=3.5;s.scoringTool='seki';
 const result=decodeSession(encodeSession(s))!;assert.deepEqual(result.game,s.game);assert.deepEqual(result.aiConfig,s.aiConfig);
 assert.equal(result.komiDirection,'reverse');assert.equal(result.scoringTool,'seki');
 s.game={...s.game,phase:'ended',winner:'white',winReason:'points'};
 assert.deepEqual(decodeSession(encodeSession(s))!.game,s.game);
});
test('incomplete fixed handicap retains placements remaining, Black turn and setup undo',()=>{
 const s=fixture();s.game=emptyPosition(19,'japanese',4);s.root=createRecord(s.game,.5);s.selected=s.root;
 const previous=s.game,next=playMove(previous,{x:3,y:3});appendMove(s.root,previous,next,{x:3,y:3});
 s.game=next;s.snapshots=[{position:previous,node:s.root}];s.handicapOn=true;s.handicapCount=3;
 const restored=decodeSession(encodeSession(s))!;
 assert.equal(restored.game.handicapPlacementsLeft,3);assert.equal(restored.game.turn,'black');
 assert.equal(restored.snapshots[0].position.handicapPlacementsLeft,4);assert.equal(restored.snapshots[0].position.board[3][3],null);
 assert.deepEqual(restored.root.properties.AB,['dd']);
});
test('rewinding free handicap invalidates the former continuation instead of replaying old setup stones',()=>{
 const initial=emptyPosition(9,'chinese',2),root=createRecord(initial,.5);
 const one=playMove(initial,{x:2,y:2});appendMove(root,initial,one,{x:2,y:2});
 const two=playMove(one,{x:6,y:6});appendMove(root,one,two,{x:6,y:6});
 const oldWhite=playMove(two,{x:4,y:4});appendMove(root,two,oldWhite,{x:4,y:4});assert.equal(root.children.length,1);
 rewindHandicapSetup(root,one);assert.equal(root.children.length,0);assert.deepEqual(root.properties.PL,['B']);
 const changed=playMove(one,{x:6,y:2});appendMove(root,one,changed,{x:6,y:2});
 const white=playMove(changed,{x:4,y:4}),node=appendMove(root,changed,white,{x:4,y:4});
 assert.equal(node.position.board[6][6],null);assert.equal(node.position.board[2][6],'black');
 const s=fixture();s.root=root;s.selected=node;s.game=node.position;
 assert.deepEqual(decodeSession(encodeSession(s))!.game.board,white.board);
 assert.deepEqual(parseSgf(serializeSgf(root)).root.children[0].position.board,white.board);
});
test('all clock systems charge closed-process time without changing the persisted source',()=>{
 for(const system of ['absolute','fischer','japanese','canadian','ing','nhk'] as const){
  const s=fixture();s.timeSettings={system,mainTimeMinutes:1,byoyomiPeriods:5,byoyomiSeconds:30,canadianStones:10,canadianMinutes:2,ingPeriods:3,ingBlockSeconds:60,nhkSeconds:30,nhkPeriods:5,fischerIncrement:5};
  s.clocks={black:createClock(s.timeSettings,10000),white:createClock(s.timeSettings,10000)};
  const roundTrip=decodeSession(encodeSession(s))!,restored=recoverSession(roundTrip,36000);
  assert.deepEqual(restored.clocks.black,tickClock(s.clocks.black,s.timeSettings,35000).clock,system);
  assert.deepEqual(restored.clocks.white,s.clocks.white);assert.equal(roundTrip.clocks.black.mainTimeLeft,10000);
 }
});
test('expired games end on recovery; unstarted, scoring, and finished clocks do not run',()=>{
 const s=fixture();s.timeSettings={system:'absolute',mainTimeMinutes:1};
 const expired=recoverSession(s,61000);assert.equal(expired.game.phase,'ended');assert.equal(expired.game.winner,'white');assert.equal(expired.game.winReason,'time');
 s.gameStarted=false;assert.deepEqual(recoverSession(s,999999).clocks,s.clocks);
 s.gameStarted=true;s.game={...s.game,phase:'scoring'};assert.deepEqual(recoverSession(s,999999).clocks,s.clocks);
 assert.deepEqual(recoverSession(expired,999999).clocks,expired.clocks);
 assert.deepEqual(recoverSession(s,500).clocks,s.clocks,'Backward wall-clock adjustment grants no increment');
});
test('imported setup and complete variation tree remain available at the selected node',()=>{
 const s=fixture(),parsed=parseSgf('(;GM[1]SZ[9]KM[0]AB[aa][bb]AW[cc]C[Root];W[dd](;B[ee]C[Main])(;B[ff]C[Alternative]))');
 s.root=parsed.root;s.selected=s.root.children[0].children[1];s.game=s.selected.position;s.reviewMode=true;s.komiValue=0;s.komiDirection='none';
 const result=decodeSession(encodeSession(s))!;assert.equal(result.selected.properties.C[0],'Alternative');assert.equal(serializeSgf(result.root),serializeSgf(s.root));
});
test('a real captured ko still forbids recapture after recovery under both rule conventions',()=>{
 for(const ruleset of ['japanese','chinese'] as const){
  const s=fixture(),parsed=parseSgf(`(;GM[1]SZ[9]RU[${ruleset}]AB[ba][ab][bc]AW[ca][bb][db][cc];B[cb])`);
  s.root=parsed.root;s.selected=s.root.children[0];s.game=s.selected.position;
  const restored=decodeSession(encodeSession(s))!;
  assert.equal(restored.game.captures.black,1);assert.throws(()=>playMove(restored.game,{x:1,y:1}),/Ko/);
  const afterPasses={...passMove(passMove(restored.game)),phase:'play' as const,consecutivePasses:0};
  if(ruleset==='japanese')assert.doesNotThrow(()=>playMove(afterPasses,{x:1,y:1}));
  else assert.throws(()=>playMove(afterPasses,{x:1,y:1}),/Ko/);
 }
});
test('a legal 350-move 19x19 game keeps every undo/repetition state within a practical save size',()=>{
 const s=fixture();s.game=emptyPosition(19);s.root=createRecord(s.game,7.5);s.selected=s.root;let seed=45;
 for(let move=0;move<350;move++){
  let next:typeof s.game|undefined,point={x:0,y:0};
  for(let attempt=0;attempt<2000;attempt++){
   seed=(seed*1664525+1013904223)>>>0;point={x:seed%19,y:Math.floor(seed/19)%19};
   try{next=playMove(s.game,point);break;}catch{}
  }
  assert.ok(next,`A legal move exists at move ${move}`);
  s.snapshots.push({node:s.selected,position:s.game});s.selected=appendMove(s.selected,s.game,next,point);s.game=next;
 }
 const text=encodeSession(s);assert.ok(text.length<2*1024*1024,'Full-sized games must not duplicate entire histories in every stored node');
 const restored=decodeSession(text)!;assert.deepEqual(restored.game,s.game);assert.equal(restored.snapshots.length,350);
 restored.snapshots.forEach((v,i)=>{assert.deepEqual(v.position,s.snapshots[i].position);assert.equal(v.node.moveNumber,i);});
 assert.ok(encodeSession(restored).length<2*1024*1024,'A restored game remains compact on subsequent saves');
});
test('the original uncompressed v1 snapshot remains readable',()=>{
 const s=fixture(),raw=JSON.parse(encodeSession(s));raw.nodes[0].position=raw.game;
 delete raw.packed;delete raw.positions;delete raw.histories;
 assert.deepEqual(decodeSession(JSON.stringify(raw))!.game,s.game);
});
test('malformed slots, cycles, invalid clocks and missing positions are rejected rather than partly restored',()=>{
 const valid=JSON.parse(encodeSession(fixture()));
 for(const mutate of [(s:any)=>s.version=2,(s:any)=>s.positions[0].board='bad',(s:any)=>s.positions[0].history=[999999],(s:any)=>s.histories[0]='invalid',(s:any)=>s.nodes[0].position=999999,(s:any)=>s.nodes[0].children=[0],(s:any)=>s.selected=4,(s:any)=>s.game.history=['bad'],(s:any)=>s.clocks.black.mainTimeLeft=-1,(s:any)=>s.game.deadStones=['99,99'],(s:any)=>s.game.phase='ended',(s:any)=>s.snapshots=[{node:8,position:s.game}],(s:any)=>s.timeSettings={system:'ing',mainTimeMinutes:1,ingPeriods:2,ingBlockSeconds:0}]){
  const broken=structuredClone(valid);mutate(broken);assert.throws(()=>decodeSession(JSON.stringify(broken)),/preserved/);
 }
 assert.throws(()=>decodeSession('{'),/preserved/);assert.equal(decodeSession(null),null);
});
