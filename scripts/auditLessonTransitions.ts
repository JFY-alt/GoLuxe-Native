/** Diagnostic report only: a following diagram may intentionally introduce a new position.
 * Review every mismatch manually before turning it into a regression assertion.
 */
import {SENSEI_LESSONS} from '../data/senseiLessons';
import {lessonBoard} from '../logic/study';
import {emptyPosition,playMove} from '../logic/sgf';
import {getBoardString} from '../logic/goEngine';
const findings:object[]=[];
for(const lesson of SENSEI_LESSONS)for(let index=0;index<lesson.beats.length;index++){
 const beat=lesson.beats[index];
 if(beat.demoWhite)continue; // Includes intentionally illegal attempts shown without placing a stone.
 const moves=beat.taps||beat.choices?.filter(c=>c.correct);
 if(!moves?.length)continue;
 const board=lessonBoard(lesson,index);
 let pos={...emptyPosition(lesson.boardSize||9),board,turn:beat.studentColor||'black',history:[getBoardString(board)]};
 try{
  for(const move of moves){pos=playMove(pos,move);pos={...pos,turn:beat.studentColor||'black'};}
  if(!beat.unmarked&&lesson.beats[index+1]?.board){
   const next=lessonBoard(lesson,index+1),changes=[];
   for(let y=0;y<next.length;y++)for(let x=0;x<next.length;x++)if(next[y][x]!==pos.board[y][x])changes.push({x,y,played:pos.board[y][x],shown:next[y][x]});
   if(changes.length)findings.push({lesson:lesson.id,index,title:beat.title,status:'review diagram change',changes});
  }
 }catch(e){findings.push({lesson:lesson.id,index,title:beat.title,status:'illegal student move',error:String(e)});}
}
console.log(JSON.stringify(findings,null,2));
