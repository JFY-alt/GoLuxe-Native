import {emptyPosition,playMove} from '../logic/sgf';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SENSEI_LESSONS} from '../data/senseiLessons';
import {lessonBoard} from '../logic/study';
import {checkCaptures,isSelfCapture,getNeighborsFixed,getBoardString,findGroup,getLiberties} from '../logic/goEngine';
const finishing=SENSEI_LESSONS.find(l=>l.id==='finishing')!;
const moves=SENSEI_LESSONS.find(l=>l.id==='moves')!;
test('false-eye demonstration legally captures both bordering chains and matches the result diagram',()=>{
 const i=finishing.beats.findIndex(b=>b.title==='Why False?');const b=lessonBoard(finishing,i),p={x:0,y:0};
 assert.equal(isSelfCapture(b,p,'white'),false);b[0][0]='white';const next=checkCaptures(b,p,'white');
 assert.equal(next.captureCount,2);assert.equal(getBoardString(next.newBoard),getBoardString(lessonBoard(finishing,i+1)));
});
test('shoulder hit is diagonal and cap is separated from the target stone',()=>{
 for(const [title,target] of [['The Shoulder Hit',{x:4,y:4}],['The Cap',{x:4,y:5}]] as const){
  const i=moves.beats.findIndex(b=>b.title===title),p=moves.beats[i].taps![0],board=lessonBoard(moves,i);
  assert.equal(board[target.y][target.x],'white');assert.ok(!getNeighborsFixed(target,9).some(n=>n.x===p.x&&n.y===p.y));
  if(title==='The Shoulder Hit'){assert.equal(Math.abs(p.x-target.x),1);assert.equal(Math.abs(p.y-target.y),1);}else{assert.equal(p.x,target.x);assert.equal(target.y-p.y,2);}
  board[p.y][p.x]='black';assert.equal(getBoardString(board),getBoardString(lessonBoard(moves,i+1)));
 }
});
test('all lesson diagrams use documented symbols',()=>{
 for(const l of SENSEI_LESSONS)for(const beat of l.beats)for(const row of beat.board||[])assert.match(row,/^[XO.]+$/,`${l.id}: ${beat.title}`);
});

test('common-mistakes death example is surrounded and capturable, rather than an open escape',()=>{
 const lesson=SENSEI_LESSONS.find(l=>l.id==='mistakes')!;
 const board=lessonBoard(lesson,lesson.beats.findIndex(b=>b.title==='Saving Dead Stones'));
 const chain=findGroup(board,{x:3,y:3})!;
 assert.equal(chain.group.length,8);assert.deepEqual([...getLiberties(board,chain.group)],['4,4']);
 assert.equal(isSelfCapture(board,{x:4,y:4},'black'),true);
 assert.equal(isSelfCapture(board,{x:4,y:4},'white'),false);
 board[4][4]='white';assert.equal(checkCaptures(board,{x:4,y:4},'white').captureCount,8);
});
test('peep and White connection are legal and produce the displayed colors and liberty counts',()=>{
 const lesson=SENSEI_LESSONS.find(l=>l.id==='mistakes')!;
 const i=lesson.beats.findIndex(b=>b.title==='The Empty Peep');const board=lessonBoard(lesson,i);
 let state={...emptyPosition(9),board,history:[getBoardString(board)]};
 state=playMove(state,lesson.beats[i].taps![0]);assert.equal(state.turn,'white');
 state=playMove(state,{x:4,y:4});assert.equal(getBoardString(state.board),getBoardString(lessonBoard(lesson,i+1)));
 assert.equal(getLiberties(state.board,findGroup(state.board,{x:4,y:4})!.group).size,7);
 assert.equal(getLiberties(state.board,findGroup(state.board,{x:4,y:5})!.group).size,3);
});
test('filling the open eye leaves twelve outside liberties and matches the next diagram',()=>{
 const lesson=SENSEI_LESSONS.find(l=>l.id==='mistakes')!;const i=lesson.beats.findIndex(b=>b.title==='Filling Your Eyes');
 const board=lessonBoard(lesson,i);assert.equal(getLiberties(board,findGroup(board,{x:3,y:4})!.group).size,13);
 const after=playMove({...emptyPosition(9),board,history:[getBoardString(board)]},lesson.beats[i].taps![0]);
 assert.equal(after.captures.black,0);assert.equal(findGroup(after.board,{x:4,y:5})!.group.length,9);
 assert.equal(getLiberties(after.board,findGroup(after.board,{x:4,y:5})!.group).size,12);
 assert.equal(getBoardString(after.board),getBoardString(lessonBoard(lesson,i+1)));
});
test('opening extension strengthens Black without reducing White liberties',()=>{
 const lesson=SENSEI_LESSONS.find(l=>l.id==='opening')!;const i=lesson.beats.findIndex(b=>b.title==='Answer Contact');const board=lessonBoard(lesson,i);
 assert.equal(getLiberties(board,findGroup(board,{x:3,y:2})!.group).size,3);
 const after=playMove({...emptyPosition(9),board,history:[getBoardString(board)]},lesson.beats[i].taps![0]);
 assert.equal(getLiberties(after.board,findGroup(after.board,{x:3,y:2})!.group).size,5);
 assert.equal(getLiberties(after.board,findGroup(after.board,{x:3,y:3})!.group).size,3);
 assert.equal(getBoardString(after.board),getBoardString(lessonBoard(lesson,i+1)));
});
