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
