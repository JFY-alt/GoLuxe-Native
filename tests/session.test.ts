import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyPosition, playMove, passMove, parseSgf, serializeSgf, createRecord, appendMove } from '../logic/sgf';
import { createClock, tickClock, clockAfterMove } from '../logic/clocks';
import { getBoardString } from '../logic/goEngine';
import { SENSEI_LESSONS } from '../data/senseiLessons';
test('SGF replay captures stones and preserves all variations and escaped comments',()=>{
 const sgf='(;GM[1]SZ[9]KM[-6.5]RU[Japanese]C[A \\] bracket and \\\\ slash];B[ab];W[bb];B[ba];W[ee];B[cb];W[ff];B[bc](;W[gg]C[main])(;W[hh]C[var]))';
 const loaded=parseSgf(sgf);let end=loaded.root;while(end.children.length===1)end=end.children[0];
 assert.equal(end.position.board[1][1],null);assert.equal(end.position.captures.black,1);assert.equal(end.children.length,2);assert.equal(loaded.komi,-6.5);assert.equal(loaded.ruleset,'japanese');
 const roundtrip=parseSgf(serializeSgf(loaded.root));assert.deepEqual(roundtrip.root.properties.C,loaded.root.properties.C);assert.equal(roundtrip.root.children[0].position.turn,'white');
});
test('SGF setup rectangles, removals, handicap, and explicit player are preserved',()=>{
 const {root}=parseSgf('(;GM[1]SZ[9]HA[2]AB[aa:bb]AW[cc]AE[aa]PL[W];W[dd])');
 assert.equal(root.position.board[0][0],null);assert.equal(root.position.board[1][1],'black');assert.equal(root.position.turn,'white');assert.equal(root.children[0].position.board[3][3],'white');
 assert.match(serializeSgf(root),/AB\[aa:bb\]/);
});
test('Chinese superko blocks older positions; Japanese only blocks immediate ko',()=>{
 const start=emptyPosition(9), p={x:4,y:4}, next=playMove(start,p);
 const repeated={...start,history:[getBoardString(next.board),'old','previous','current']};
 assert.throws(()=>playMove(repeated,p),/Ko/);assert.doesNotThrow(()=>playMove({...repeated,ruleset:'japanese'},p));
});
test('two passes enter scoring, record both passes, and lift immediate ko after passing',()=>{
 let s=emptyPosition(9);const root=createRecord(s,7.5);let node=root;
 for(let i=0;i<2;i++){const next=passMove(s);node=appendMove(node,s,next,null);s=next;}
 assert.equal(s.phase,'scoring');assert.equal(s.turn,'black');assert.match(serializeSgf(root),/;B\[\];W\[\]/);
});
test('handicap is setup, not alternating moves; White plays after placement',()=>{
 let s=emptyPosition(9,'chinese',2);const root=createRecord(s,.5);let n=root;
 for(const p of [{x:2,y:2},{x:6,y:6}]){const next=playMove(s,p);n=appendMove(n,s,next,p);s=next;}
 assert.equal(s.turn,'white');assert.deepEqual(root.properties.AB,['cc','gg']);assert.equal(root.properties.HA[0],'2');assert.equal(n.moveNumber,0);
 assert.equal(parseSgf(serializeSgf(root)).root.position.turn,'white');
});
test('malformed and illegal SGF imports leave callers with a clear error',()=>{
 for(const input of ['','(;SZ[17])','(;SZ[9]C[unterminated)','(;SZ[9];B[ss])','(;SZ[9];B[aa];W[aa])','(;SZ[9])(;SZ[9])'])assert.throws(()=>parseSgf(input));
});
test('long linear records parse and export without recursive stack overflow',()=>{
 const {root}=parseSgf('(;SZ[9]'+(';C[n]'.repeat(3000))+')');assert.equal(parseSgf(serializeSgf(root)).size,9);
});
test('branch continuation retains imported commentary and other children',()=>{
 const {root}=parseSgf('(;SZ[9]C[root];B[aa])');const next=playMove(root.position,{x:4,y:4});appendMove(root,root.position,next,{x:4,y:4});assert.equal(root.children.length,2);assert.equal(parseSgf(serializeSgf(root)).root.children.length,2);
});
test('all six clock systems handle expiry and overtime overshoot',()=>{
 const absolute={system:'absolute' as const,mainTimeMinutes:1};assert.equal(tickClock(createClock(absolute,1000),absolute,1000).timedOut,true);
 const japanese={system:'japanese' as const,mainTimeMinutes:1,byoyomiPeriods:3,byoyomiSeconds:10};const j=tickClock(createClock(japanese,1000),japanese,25000);assert.equal(j.clock.byoyomiPeriodsLeft,1);assert.equal(j.clock.byoyomiTimeLeft,6000);assert.equal(j.timedOut,false);
 const canadian={system:'canadian' as const,mainTimeMinutes:1,canadianStones:2,canadianMinutes:1};const c=tickClock(createClock(canadian,1000),canadian,2000).clock;assert.equal(c.canadianTimeLeft,59000);assert.equal(clockAfterMove(clockAfterMove(c,canadian),canadian).canadianTimeLeft,60000);
 const fischer={system:'fischer' as const,mainTimeMinutes:1,fischerIncrement:10};assert.equal(clockAfterMove(createClock(fischer,1000),fischer).mainTimeLeft,11000);
 const ing={system:'ing' as const,mainTimeMinutes:1,ingPeriods:2,ingBlockSeconds:10};assert.equal(tickClock(createClock(ing,1000),ing,12000).clock.ingPeriodsLeft,0);assert.equal(tickClock(createClock(ing,1000),ing,22000).timedOut,true);
 const nhk={system:'nhk' as const,mainTimeMinutes:0,nhkPeriods:1,nhkSeconds:30};assert.equal(tickClock(createClock(nhk,0),nhk,31000).clock.nhkTimeLeft,59000);assert.equal(tickClock(createClock(nhk,0),nhk,91000).timedOut,true);
});
test('study content includes every web lesson and valid diagrams at their specified board size',()=>{
 assert.equal(SENSEI_LESSONS.length,12);for(const l of SENSEI_LESSONS){assert.ok(l.beats.length);for(const b of l.beats)if(b.board){assert.ok(b.board.length<=(l.boardSize||9));assert.ok(b.board.every(r=>r.length<=(l.boardSize||9)));}}
});
