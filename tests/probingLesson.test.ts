import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SENSEI_LESSONS} from '../data/senseiLessons';
import {lessonBoard} from '../logic/study';
import {emptyPosition,playMove} from '../logic/sgf';
import {findGroup,getLiberties,getBoardString} from '../logic/goEngine';
const lesson=SENSEI_LESSONS.find(l=>l.id==='strategies')!;
const idx=(title:string)=>lesson.beats.findIndex(b=>b.title===title);
const b=(title:string)=>lessonBoard(lesson,idx(title));
const pos=(title:string,turn:'white'|'black')=>({...emptyPosition(9),board:b(title),turn,history:[getBoardString(b(title))]});
test('probe uses White; Black connection reply is legal and creates one chain',()=>{
 const peep=playMove(pos('The Probe','white'),{x:4,y:5});
 const response=playMove(peep,{x:4,y:4});assert.deepEqual(response.board,b('A Connecting Answer'));assert.equal(findGroup(response.board,{x:3,y:4})!.group.length,3);
});
test('ignored probe branch remains legal; gap move connects White and separates Black chains',()=>{
 const peep=playMove(pos('The Probe','white'),{x:4,y:5});
 const ignored=playMove(peep,{x:8,y:8});assert.deepEqual(ignored.board,b('An Answer Elsewhere'));
 const cut=playMove(ignored,{x:4,y:4});const white=findGroup(cut.board,{x:4,y:4})!;assert.equal(white.group.length,2);assert.equal(getLiberties(cut.board,white.group).size,4);
 assert.equal(findGroup(cut.board,{x:3,y:4})!.group.length,1);assert.equal(findGroup(cut.board,{x:5,y:4})!.group.length,1);
});
test('13x13 invasion places White and matches the shown start without claiming immediate life',()=>{
 const l=SENSEI_LESSONS.find(l=>l.id==='opening13')!,i=l.beats.findIndex(b=>b.title==='The 3-3 Invasion');
 assert.equal(l.beats[i].studentColor,'white');const board=lessonBoard(l,i);
 assert.deepEqual(playMove({...emptyPosition(13),board,turn:'white',history:[getBoardString(board)]},l.beats[i].taps![0]).board,lessonBoard(l,i+1));
});
