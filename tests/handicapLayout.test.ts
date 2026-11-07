import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixedHandicapPoints,remainingFixedHandicapPoints} from '../logic/handicap';
import {emptyPosition,playMove,createRecord,appendMove,serializeSgf,parseSgf} from '../logic/sgf';
import {coordinateLabel} from '../logic/recordPresentation';
test('19x19 fixed sets follow the traditional two-through-nine pattern',()=>{
 const expected:Record<number,string[]>={2:['Q16','D4'],3:['Q16','D4','Q4'],4:['Q16','D4','Q4','D16'],5:['Q16','D4','Q4','D16','K10'],6:['Q16','D4','Q4','D16','Q10','D10'],7:['Q16','D4','Q4','D16','Q10','D10','K10'],8:['Q16','D4','Q4','D16','Q10','D10','K16','K4'],9:['Q16','D4','Q4','D16','Q10','D10','K16','K4','K10']};
 for(let n=2;n<=9;n++)assert.deepEqual(fixedHandicapPoints(19,n).map(p=>coordinateLabel(p.x,p.y,19)),expected[n]);
});
test('a two-stone setup rejects the center and records both stones as setup with White next',()=>{
 let s=emptyPosition(19,'japanese',2);const root=createRecord(s,.5);let node=root;
 assert.throws(()=>playMove(s,{x:9,y:9},remainingFixedHandicapPoints(s)),/Fixed handicap/);
 for(const p of fixedHandicapPoints(19,2).reverse()){const next=playMove(s,p,remainingFixedHandicapPoints(s));node=appendMove(node,s,next,p);s=next;}
 assert.equal(s.turn,'white');assert.equal(s.handicapPlacementsLeft,0);assert.equal(node.moveNumber,0);const restored=parseSgf(serializeSgf(root));assert.equal(restored.root.properties.HA[0],'2');assert.equal(restored.root.position.turn,'white');assert.equal(restored.root.position.board[3][15],'black');
});
test('small-board conventions provide complete unique sets with explicit limits',()=>{
 for(const size of [9,13])for(let count=2;count<=(size===9?5:9);count++){const points=fixedHandicapPoints(size,count);assert.equal(points.length,count);assert.equal(new Set(points.map(p=>`${p.x},${p.y}`)).size,count);let s=emptyPosition(size,'chinese',count);for(const p of points)s=playMove(s,p,remainingFixedHandicapPoints(s));assert.equal(s.turn,'white');}
 assert.throws(()=>fixedHandicapPoints(9,6));
});
