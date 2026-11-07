import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PRACTICE_LESSON} from '../data/practiceLessons';
import {lessonBoard} from '../logic/study';
import {emptyPosition,playMove} from '../logic/sgf';
import {getBoardString,findGroup} from '../logic/goEngine';
function solve(index:number){const beat=PRACTICE_LESSON.beats[index],board=lessonBoard(PRACTICE_LESSON,index),turn=beat.studentColor||'black';return playMove({...emptyPosition(9),board,turn,history:[getBoardString(board)]},beat.choices!.find(c=>c.correct)!);}
test('independent capture exercises prove the requested capture for both colors',()=>{
 for(const index of [1,2]){const b=PRACTICE_LESSON.beats[index],next=solve(index);assert.equal(next.captures[b.studentColor!],1);assert.equal(next.board[4][4],null);assert.ok(b.unmarked);assert.ok(b.feedback);}
});
test('connection exercise produces one three-stone chain',()=>{assert.equal(findGroup(solve(3).board,{x:3,y:4})?.group.length,3);});
test('false-eye independent exercise captures two separate chains',()=>{assert.equal(solve(4).captures.white,2);});
test('plausible wrong choices are legal alternatives with explanations and do not achieve the task',()=>{
 for(let i=1;i<=4;i++){const beat=PRACTICE_LESSON.beats[i],board=lessonBoard(PRACTICE_LESSON,i),turn=beat.studentColor||'black';for(const wrong of beat.choices!.filter(c=>!c.correct)){assert.ok(wrong.nudge);const next=playMove({...emptyPosition(9),board,turn,history:[getBoardString(board)]},wrong);if(i===3)assert.equal(findGroup(next.board,{x:3,y:4})?.group.length,1);else assert.equal(next.captures[turn],0);}}
});
