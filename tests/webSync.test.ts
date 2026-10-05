import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SENSEI_LESSONS} from '../data/senseiLessons';
import {lessonBoard,resumeBeat} from '../logic/study';
import {createEmptyBoard,getImmortalPoints,isKoViolation} from '../logic/goEngine';
import {getBestMove} from '../logic/simpleAi';
import {emptyPosition,playMove} from '../logic/sgf';

test('expanded lessons build the right board and keep all overlays within its bounds',()=>{
  for(const lesson of SENSEI_LESSONS) {
    const size=lesson.boardSize||9;
    lesson.beats.forEach((beat,index)=>{
      const board=lessonBoard(lesson,index);
      assert.equal(board.length,size);assert.ok(board.every(row=>row.length===size));
      for(const p of [...beat.taps||[],...beat.choices||[],...beat.marks||[]]) {
        assert.ok(p.x>=0&&p.x<size&&p.y>=0&&p.y<size,`${lesson.id}: ${beat.title} overlay outside board`);
      }
      for(const line of beat.lines||[])assert.ok(line.index>=0&&line.index<size);
    });
  }
});
test('lesson resume retains incomplete progress and restarts completed or invalid progress',()=>{
  const lesson=SENSEI_LESSONS[0];
  assert.equal(resumeBeat(lesson,4),4);
  for(const value of [undefined,NaN,-1,'4',lesson.beats.length-1,9999])assert.equal(resumeBeat(lesson,value),0);
});
test('Benson life recognition requires two separate vital eye regions',()=>{
  const board=createEmptyBoard(9);
  for(let x=1;x<=7;x++){board[1][x]='black';board[3][x]='black';}
  board[2][1]=board[2][4]=board[2][7]='black';
  assert.ok(getImmortalPoints(board).has('1,1'));
  board[2][4]=null;
  assert.equal(getImmortalPoints(board).size,0);
});
test('the shared ko helper distinguishes immediate ko from older repetition',()=>{
  assert.equal(isKoViolation('old',['old','different','current'],'japanese'),false);
  assert.equal(isKoViolation('old',['old','different','current'],'chinese'),true);
  assert.equal(isKoViolation('different',['old','different','current'],'japanese'),true);
});
test('updated beginner and casual AI suggest legal moves without mutating the position',()=>{
  let position=playMove(emptyPosition(9),{x:2,y:2});
  const original=JSON.stringify(position.board);
  for(const difficulty of ['beginner','intermediate'] as const){
    const move=getBestMove(position,difficulty,.5);
    assert.notEqual(move,'resign');
    if(typeof move==='object')assert.doesNotThrow(()=>playMove(position,move));
    assert.equal(JSON.stringify(position.board),original);
  }
});
