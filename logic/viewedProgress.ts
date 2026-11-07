import type {SenseiLesson} from '../data/senseiLessons';

export interface ViewedRevision {signature:string;index:number}
export type ViewedProgress = Record<string,ViewedRevision[]>;
export interface ViewedState {current:Record<string,number>;earlier:Record<string,boolean>;readFailed:boolean}

/** Exact content identity avoids treating a revised diagram or instruction as already viewed. */
export function lessonSignature(lesson:SenseiLesson):string {
 return JSON.stringify({title:lesson.title,size:lesson.boardSize||9,beats:lesson.beats});
}
export function decodeViewedProgress(raw:string|null):ViewedProgress {
 if(raw===null)return {};
 const value=JSON.parse(raw);
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid viewed progress');
 const clean:ViewedProgress={};
 for(const [id,records] of Object.entries(value)){
  if(!Array.isArray(records))throw Error('Invalid lesson revisions');
  clean[id]=records.map(record=>{
   if(!record||typeof record!=='object'||typeof record.signature!=='string'||!record.signature||!Number.isSafeInteger(record.index)||record.index<0)throw Error('Invalid lesson bookmark');
   return {signature:record.signature,index:record.index};
  });
 }
 return clean;
}
export function recordViewed(progress:ViewedProgress,lesson:SenseiLesson,index:number):ViewedProgress {
 if(!Number.isSafeInteger(index)||index<0||index>=lesson.beats.length)throw Error('Invalid lesson bookmark index');
 const signature=lessonSignature(lesson),records=progress[lesson.id]||[];
 const prior=records.find(r=>r.signature===signature);
 const updated={signature,index:Math.max(prior?.index??0,index)};
 return {...progress,[lesson.id]:[...records.filter(r=>r.signature!==signature),updated]};
}
export function viewedState(progress:ViewedProgress,legacy:Record<string,number>,lessons:SenseiLesson[]):ViewedState {
 const current:Record<string,number>={},earlier:Record<string,boolean>={};
 for(const lesson of lessons){
  const records=progress[lesson.id]||[],signature=lessonSignature(lesson);
  const match=records.find(r=>r.signature===signature&&r.index<lesson.beats.length);
  if(match)current[lesson.id]=match.index;
  else if(records.length||legacy[lesson.id]!==undefined)earlier[lesson.id]=true;
 }
 return {current,earlier,readFailed:false};
}
