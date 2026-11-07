import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SENSEI_LESSONS} from '../data/senseiLessons';
import {lessonBoard} from '../logic/study';
import {findGroup,getLiberties,getAllGroups,getBoardString,createEmptyBoard} from '../logic/goEngine';
import {emptyPosition,playMove} from '../logic/sgf';
const shape=SENSEI_LESSONS.find(l=>l.id==='shape')!;
const diagram=(title:string)=>lessonBoard(shape,shape.beats.findIndex(b=>b.title===title));
test('shape examples substantiate their liberty counts rather than infer death from shape',()=>{
 const triangle=diagram('The Empty Triangle');assert.equal(getLiberties(triangle,findGroup(triangle,{x:3,y:4})!.group).size,7);
 const line=createEmptyBoard(9);line[4][3]=line[4][4]=line[4][5]='black';assert.equal(getLiberties(line,findGroup(line,{x:3,y:4})!.group).size,8);
 const dumpling=diagram('The Dumpling');assert.equal(getLiberties(dumpling,findGroup(dumpling,{x:3,y:4})!.group).size,10);
 assert.equal(getAllGroups(diagram('The Ponnuki')).length,4);
});
test('bamboo joint reply joins the original four stones legally while leaving White uncaptured',()=>{
 const before=diagram('The Bamboo Joint'),cut=diagram('Answer the cut');
 const reply=playMove({...emptyPosition(9),board:cut,history:[getBoardString(cut)]},{x:4,y:4});
 assert.equal(reply.captures.black,0);assert.equal(findGroup(reply.board,{x:3,y:4})!.group.length,5);
 for(let y=0;y<9;y++)for(let x=0;x<9;x++)if(before[y][x])assert.equal(cut[y][x],before[y][x]);
 assert.equal(cut[5][4],'white');
});
