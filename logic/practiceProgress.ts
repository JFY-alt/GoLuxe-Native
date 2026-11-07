import type {SenseiLesson} from '../data/senseiLessons';
export interface PracticeEvidence {signature:string; solves:number; lastAttempts:number; firstTrySolves:number}
export type PracticeProgress = Record<string,PracticeEvidence>;
export function exerciseSignature(lesson:SenseiLesson,index:number):string {
 const beat=lesson.beats[index];
 return JSON.stringify({size:lesson.boardSize||9,board:beat.board,color:beat.studentColor||'black',answers:beat.choices?.filter(c=>c.correct).map(c=>[c.x,c.y]),task:beat.text});
}
export function sanitizePracticeProgress(value:unknown):PracticeProgress {
 const clean:PracticeProgress={};
 if(!value||typeof value!=='object'||Array.isArray(value))return clean;
 for(const [key,record] of Object.entries(value)){
  if(!record||typeof record!=='object')continue;
  const r=record as PracticeEvidence;
  if(typeof r.signature==='string'&&Number.isSafeInteger(r.solves)&&r.solves>0&&Number.isSafeInteger(r.lastAttempts)&&r.lastAttempts>0&&Number.isSafeInteger(r.firstTrySolves)&&r.firstTrySolves>=0&&r.firstTrySolves<=r.solves)clean[key]={signature:r.signature,solves:r.solves,lastAttempts:r.lastAttempts,firstTrySolves:r.firstTrySolves};
 }
 return clean;
}
export function recordPracticeSolve(progress:PracticeProgress,lesson:SenseiLesson,index:number,attempts:number):PracticeProgress {
 if(!lesson.beats[index]?.unmarked||!lesson.beats[index].choices?.some(c=>c.correct)||!Number.isSafeInteger(attempts)||attempts<1)return progress;
 const key=`${lesson.id}/${index}`,signature=exerciseSignature(lesson,index),old=progress[key];
 const prior=old?.signature===signature?old:undefined;
 return {...progress,[key]:{signature,solves:(prior?.solves||0)+1,lastAttempts:attempts,firstTrySolves:(prior?.firstTrySolves||0)+(attempts===1?1:0)}};
}
export function practiceSummary(lesson:SenseiLesson,progress:PracticeProgress) {
 let total=0,solved=0,latestFirstTry=0;
 lesson.beats.forEach((beat,index)=>{
  if(!beat.unmarked||!beat.choices?.some(c=>c.correct))return;
  total++;const record=progress[`${lesson.id}/${index}`];
  if(record?.signature===exerciseSignature(lesson,index)){solved++;if(record.lastAttempts===1)latestFirstTry++;}
 });
 return {total,solved,latestFirstTry};
}
export function sanitizeViewedProgress(value:unknown):Record<string,number> {
 if(!value||typeof value!=='object'||Array.isArray(value))return {};
 return Object.fromEntries(Object.entries(value).filter(([,v])=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0));
}
