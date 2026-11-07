import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculateScores,createEmptyBoard,getAllGroups,getLiberties} from '../logic/goEngine';

function spaciousEyes(){
 const b=createEmptyBoard(13);
 for(let y=0;y<=6;y++)b[y][0]=b[y][10]='white';
 for(let x=0;x<=10;x++)b[0][x]=b[6][x]='white';
 for(let x=1;x<=9;x++)b[1][x]=b[5][x]='black';
 for(let y=1;y<=5;y++)b[y][1]=b[y][5]=b[y][9]='black';
 return b;
}
test('agreed scoring keeps the 27-stone two-large-eye group on the board',()=>{
 const b=spaciousEyes();assert.ok(getAllGroups(b).every(g=>getLiberties(b,g.group).size>0));
 const score=calculateScores(b,{black:0,white:0},0,0,new Set(),'chinese');
 assert.equal(score.black.stones,27);assert.equal(score.black.territory,18);assert.equal(score.black.total,45);
 assert.equal(score.white.captures,0);
});
test('Japanese seki designation excludes private eyes; Chinese retains their area',()=>{
 const b=spaciousEyes(),keys=new Set<string>();b.forEach((r,y)=>r.forEach((c,x)=>{if(c==='black')keys.add(`${x},${y}`);}));
 assert.equal(calculateScores(b,{black:0,white:0},0,0,new Set(),'japanese',keys).black.territory,0);
 assert.equal(calculateScores(b,{black:0,white:0},0,0,new Set(),'chinese',keys).black.total,45);
 // This fixture tests annotation semantics, not automatic recognition of a seki position.
});
test('dead stones count as Japanese prisoners and freed territory, not Chinese prisoners',()=>{
 const b=createEmptyBoard(9);for(let y=0;y<9;y++)for(let x=0;x<9;x++)b[y][x]='black';b[4][4]='white';
 const dead=new Set(['4,4']);const j=calculateScores(b,{black:2,white:0},0,0,dead,'japanese');const c=calculateScores(b,{black:2,white:0},0,0,dead,'chinese');
 assert.equal(j.black.captures,3);assert.equal(j.black.territory,1);assert.equal(c.black.captures,0);assert.equal(c.black.total,81);
});
test('shared empty regions remain neutral in both scoring modes',()=>{
 const b=createEmptyBoard(9);b[4][3]='black';b[4][5]='white';
 for(const rs of ['chinese','japanese'] as const){const s=calculateScores(b,{black:0,white:0},0,0,new Set(),rs);assert.equal(s.black.territory,0);assert.equal(s.white.territory,0);}
});

import {emptyPosition,playMove} from '../logic/sgf';
import {getBoardString} from '../logic/goEngine';
test('eye-bearing seki: either initiator loses; Japanese eyes neutral, Chinese eyes count',()=>{
 const rows=['XXXXX','X.XXX','XX.XO','OOOOO','OOO.O'];
 const b=rows.map(r=>[...r].map(c=>c==='X'?'black' as const:c==='O'?'white' as const:null));
 for(const turn of ['black','white'] as const){
  const initial={...emptyPosition(5,'japanese'),board:b,turn,history:[getBoardString(b)]};
  const first=playMove(initial,{x:2,y:2});assert.equal(first.captures[turn],0);
  const response=playMove(first,turn==='black'?{x:1,y:1}:{x:3,y:4});
  assert.ok(response.captures[turn==='black'?'white':'black']>0,'Initiator loses its whole group');
 }
 const annotations=new Set<string>();for(const g of getAllGroups(b))g.group.forEach(p=>annotations.add(`${p.x},${p.y}`));
 const j=calculateScores(b,{black:0,white:0},0,0,new Set(),'japanese',annotations);
 assert.equal(j.black.total,0);assert.equal(j.white.total,0);
 const c=calculateScores(b,{black:0,white:0},0,0,new Set(),'chinese',annotations);
 assert.equal(c.black.total,13);assert.equal(c.white.total,11);
});
import {signedCompensation} from '../logic/scoring';
test('genuine zero komi supports jigo and is distinct from handicap tie-break compensation',()=>{
 assert.equal(signedCompensation(false,'none',7.5),0);
 assert.equal(signedCompensation(false,'standard',.5),.5);
 assert.equal(signedCompensation(false,'reverse',6.5),-6.5);
 assert.equal(signedCompensation(true,'none',0),.5);
 assert.equal(signedCompensation(false,'standard',NaN),0);
 const b=createEmptyBoard(9);b[4][3]='black';b[4][5]='white';const s=calculateScores(b,{black:0,white:0},signedCompensation(false,'none',7.5),0,new Set(),'chinese');
 assert.equal(s.black.total,s.white.total);
});
