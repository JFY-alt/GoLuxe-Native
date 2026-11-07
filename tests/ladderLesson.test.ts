import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LADDER_LESSON} from '../data/ladderLesson';
import {SENSEI_LESSONS} from '../data/senseiLessons';
import {lessonBoard} from '../logic/study';
import {emptyPosition,playMove} from '../logic/sgf';
import {findGroup,getLiberties,getBoardString} from '../logic/goEngine';
const target={x:2,y:2};
function position(index:number){const board=lessonBoard(LADDER_LESSON,index);return {...emptyPosition(9),board,turn:LADDER_LESSON.beats[index].studentColor||'black' as const,history:[getBoardString(board)]};}
test('full ladder alternates legal ataris/extensions and captures twelve with exact displayed boards',()=>{
 let s=position(1);
 for(let i=1;i<=23;i++){
  const beat=LADDER_LESSON.beats[i];assert.equal(s.turn,beat.studentColor);
  assert.equal(getBoardString(s.board),getBoardString(lessonBoard(LADDER_LESSON,i)));
  const group=findGroup(s.board,target)!;assert.equal(getLiberties(s.board,group.group).size,s.turn==='white'||i===23?1:2);
  // Verify a countercapture elsewhere cannot give the target more liberties than its shown escape.
  if(s.turn==='white')for(let y=0;y<9;y++)for(let x=0;x<9;x++){
   if(s.board[y][x])continue;let next;try{next=playMove(s,{x,y});}catch{continue;}
   const remaining=findGroup(next.board,target);if(remaining&&getLiberties(next.board,remaining.group).size>1)assert.deepEqual({x,y},beat.taps![0]);
  }
  s=playMove(s,beat.taps![0]);
 }
 assert.equal(s.captures.black,12);assert.equal(findGroup(s.board,target),null);
 assert.equal(getBoardString(s.board),getBoardString(lessonBoard(LADDER_LESSON,24)));
});
test('supporting stone joins the actual ladder path and produces three liberties',()=>{
 let s=position(25);
 for(let i=1;i<=14;i++){const beat=LADDER_LESSON.beats[i];s=playMove(s,beat.taps![0]);}
 assert.equal(getBoardString(s.board),getBoardString(lessonBoard(LADDER_LESSON,26)));
 const group=findGroup(s.board,target)!;assert.ok(group.group.some(p=>p.x===6&&p.y===6));
 assert.equal(getLiberties(s.board,group.group).size,3);assert.equal(s.captures.black,0);
});
test('illustrative attack sequence is legal, with White liberties matching the explanations',()=>{
 const l=SENSEI_LESSONS.find(l=>l.id==='balances')!;const i=l.beats.findIndex(b=>b.title==='Attack for Profit');
 const board=lessonBoard(l,i);let s={...emptyPosition(9),board,history:[getBoardString(board)]};
 s=playMove(s,l.beats[i].taps![0]);assert.equal(getLiberties(s.board,findGroup(s.board,{x:4,y:3})!.group).size,5);
 assert.equal(getBoardString(s.board),getBoardString(lessonBoard(l,i+1)));
 s=playMove(s,{x:5,y:4});assert.equal(getLiberties(s.board,findGroup(s.board,{x:4,y:3})!.group).size,6);
 assert.equal(getBoardString(s.board),getBoardString(lessonBoard(l,i+2)));
 s=playMove(s,{x:4,y:2});assert.equal(getBoardString(s.board),getBoardString(lessonBoard(l,i+3)));
 assert.equal(findGroup(s.board,{x:4,y:2})!.group.length,1);
});
