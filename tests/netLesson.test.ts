import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NET_LESSON} from '../data/netLesson';
import {SENSEI_LESSONS} from '../data/senseiLessons';
import {lessonBoard} from '../logic/study';
import {emptyPosition,playMove,passMove} from '../logic/sgf';
import {findGroup,getLiberties,getBoardString} from '../logic/goEngine';
import type {GameState,Point} from '../types';
const target={x:3,y:5};
const moves:(Point|null)[]=[null,...Array.from({length:81},(_,i)=>({x:i%9,y:Math.floor(i/9)}))];
const play=(s:GameState,p:Point|null)=>p?playMove(s,p):passMove(s);
function position(index:number,turn:'black'|'white'='black'){
 const board=lessonBoard(NET_LESSON,index);return {...emptyPosition(9),board,turn,history:[getBoardString(board)]};
}
test('net teaching line alternates legal moves, matches diagrams, and captures four stones',()=>{
 let s=position(1,'white');
 for(let i=1;i<=3;i++){
  s=playMove(s,NET_LESSON.beats[i].taps![0]);assert.equal(getBoardString(s.board),getBoardString(lessonBoard(NET_LESSON,i+1)));
 }
 assert.equal(getLiberties(s.board,findGroup(s.board,target)!.group).size,1);
 s=playMove(s,NET_LESSON.beats[4].choices!.find(c=>c.correct)!);assert.equal(s.captures.black,4);assert.equal(findGroup(s.board,target),null);
});
test('net capture strategy covers every legal White move and pass, including outside support and countercapture attempts',()=>{
 for(const ruleset of ['japanese','chinese'] as const){
  const start={...position(0,'white'),ruleset};const original=getBoardString(start.board);let paths=0;
  for(const p of moves){
   let first:GameState;try{first=play(start,p);}catch{continue;}
   // Close the outside door after an extension; block the right gap if White adds right-hand support.
   const reply=p?.x===2&&p.y===5?{x:1,y:5}:p?.x===4&&p.y===5?{x:5,y:5}:p?.x===5&&p.y===5?{x:4,y:5}:{x:2,y:5};
   const black=playMove(first,reply);
   for(const q of moves){
    let second:GameState;try{second=play(black,q);}catch{continue;}
    const group=findGroup(second.board,target)!;assert.ok(group);
    const liberties=[...getLiberties(second.board,group.group)];assert.equal(liberties.length,1,JSON.stringify({ruleset,p,q}));
    const [x,y]=liberties[0].split(',').map(Number);const captured=playMove(second,{x,y});
    assert.equal(findGroup(captured.board,target),null);assert.ok(captured.captures.black>=2);paths++;
   }
  }
  assert.equal(paths,5329);assert.equal(getBoardString(start.board),original);
 }
});
test('outside support changes the right-gap reply; wrong block allows three-liberty connection',()=>{
 const start=position(5);const correct=playMove(start,NET_LESSON.beats[5].choices!.find(c=>c.correct)!);
 assert.equal(getLiberties(correct.board,findGroup(correct.board,target)!.group).size,1);
 assert.equal(findGroup(correct.board,{x:5,y:5})!.group.length,1);
 const wrong=playMove(start,{x:2,y:5}),connected=playMove(wrong,{x:4,y:5});
 assert.equal(getBoardString(connected.board),getBoardString(lessonBoard(NET_LESSON,6)));
 const chain=findGroup(connected.board,target)!;assert.equal(chain.group.length,4);assert.equal(getLiberties(connected.board,chain.group).size,3);
});
test('fundamentals net closes a touching northern point and leaves two liberties after southern block',()=>{
 const lesson=SENSEI_LESSONS.find(l=>l.id==='fundamentals')!;
 const i=lesson.beats.findIndex(b=>b.title==='Block the top'),board=lessonBoard(lesson,i);
 const start={...emptyPosition(9),board,history:[getBoardString(board)]};const top=playMove(start,lesson.beats[i].taps![0]);
 assert.equal(getLiberties(top.board,findGroup(top.board,target)!.group).size,3);
 const south=playMove(top,{x:3,y:6}),closed=playMove(south,{x:3,y:7});
 assert.equal(getBoardString(closed.board),getBoardString(lessonBoard(NET_LESSON,0)));
 assert.equal(getLiberties(closed.board,findGroup(closed.board,target)!.group).size,2);
});
