import {test} from 'node:test';
import assert from 'node:assert/strict';
import {displayHoshiPoints,boardPresentation,atariConnections} from '../logic/boardPresentation';
import {createEmptyBoard,getHoshiPoints} from '../logic/goEngine';
test('13×13 uses the web visual star layout while preserving fixed-handicap positions',()=>{
 assert.deepEqual(displayHoshiPoints(13),[{x:3,y:3},{x:9,y:3},{x:6,y:6},{x:3,y:9},{x:9,y:9}]);assert.equal(getHoshiPoints(13).length,9);assert.equal(displayHoshiPoints(9).length,5);assert.equal(displayHoshiPoints(19).length,9);
});
test('atari connectors lead only to groups whose final liberty is the marked point',()=>{
 const b=createEmptyBoard(9);b[4][4]='white';b[3][4]='black';b[5][4]='black';b[4][3]='black';
 assert.deepEqual(atariConnections(b,{x:5,y:4}),[{x:-1,y:0}]);assert.equal(boardPresentation(b,false,new Set(),null).atari.has('5,4'),true);
});
test('seki eye markers highlight their whole adjacent group during scoring',()=>{
 const b=createEmptyBoard(9);b[4][4]='black';b[4][5]='black';const p=boardPresentation(b,true,new Set(['4,3']),null);
 assert.deepEqual([...p.sekiStones].sort(),['4,4','5,4']);assert.equal(boardPresentation(b,false,new Set(['4,3']),null).sekiStones.size,0);
});
test('virtual scoring stones affect atari preview without mutating the board or practice liberties',()=>{
 const b=createEmptyBoard(9);b[4][4]='white';b[3][4]='black';b[5][4]='black';const p=boardPresentation(b,true,new Set(),{x:3,y:4,color:'black'});
 assert.equal(p.atari.has('5,4'),true);assert.equal(b[4][3],null);assert.equal(p.wLibs.has('3,4'),true);
});
