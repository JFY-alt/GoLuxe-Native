import {test} from 'node:test';
import assert from 'node:assert/strict';
import {displayHoshiPoints,boardPresentation,atariConnections} from '../logic/boardPresentation';
import {createEmptyBoard,getHoshiPoints} from '../logic/goEngine';
test('13×13 uses the web visual star layout while preserving fixed-handicap positions',()=>{
 assert.deepEqual(displayHoshiPoints(13),[{x:3,y:3},{x:9,y:3},{x:6,y:6},{x:3,y:9},{x:9,y:9}]);assert.equal(getHoshiPoints(13).length,9);assert.equal(displayHoshiPoints(9).length,5);assert.equal(displayHoshiPoints(19).length,9);
});
test('atari connectors lead only to groups whose final liberty is the marked point',()=>{
 const b=createEmptyBoard(9);b[4][4]='white';b[3][4]='black';b[5][4]='black';b[4][3]='black';
 assert.deepEqual(atariConnections(b,{x:5,y:4}),[{x:-1,y:0}]);assert.equal(boardPresentation(b,false,new Set()).atari.has('5,4'),true);
});
test('seki eye markers highlight their whole adjacent group during scoring',()=>{
 const b=createEmptyBoard(9);b[4][4]='black';b[4][5]='black';const p=boardPresentation(b,true,new Set(['4,3']));
 assert.deepEqual([...p.sekiStones].sort(),['4,4','5,4']);assert.equal(boardPresentation(b,false,new Set(['4,3'])).sekiStones.size,0);
});
test('scoring presentation uses the real board without introducing diagnostic stones',()=>{
 const b=createEmptyBoard(9);b[4][4]='white';b[3][4]='black';b[5][4]='black';const before=JSON.stringify(b);
 const p=boardPresentation(b,true,new Set());
 assert.equal(p.atari.size,0);assert.equal(JSON.stringify(b),before);assert.equal(p.wLibs.has('3,4'),true);
});

test('alive chains and nearby atari retain independent status on the same board',()=>{
 const b=createEmptyBoard(9);
 for(let y=0;y<9;y++)for(let x=0;x<9;x++)b[y][x]='black';
 b[1][1]=null;b[1][3]=null; // Two eyes keep the surrounding black chain alive.
 b[7][7]='white';b[7][8]=null; // White has exactly one liberty beside that chain.
 const before=JSON.stringify(b),p=boardPresentation(b,false,new Set());
 assert.ok(p.immortal.has('8,6'));assert.ok(p.eyes.has('1,1'));
 assert.ok(p.atari.has('8,7'));assert.deepEqual(atariConnections(b,{x:8,y:7}),[{x:-1,y:0}]);
 assert.equal(JSON.stringify(b),before);
});
