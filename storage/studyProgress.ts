import AsyncStorage from '@react-native-async-storage/async-storage';
import {SENSEI_LESSONS, type SenseiLesson} from '../data/senseiLessons';
import {decodeViewedProgress,recordViewed,viewedState,ViewedState} from '../logic/viewedProgress';
import {PracticeProgress,recordPracticeSolve,sanitizePracticeProgress,sanitizeViewedProgress} from '../logic/practiceProgress';
export const SENSEI_PROGRESS_KEY='goluxe-sensei-progress';
export const VIEWED_REVISIONS_KEY='goluxe-sensei-viewed-v2';
const PRACTICE_KEY='goluxe-practice-evidence-v1';
let writes:Promise<unknown>=Promise.resolve();
const enqueue=(operation:()=>Promise<void>):Promise<boolean>=>{
 const next=writes.then(operation);writes=next.catch(()=>{});return next.then(()=>true,()=>false);
};
export async function getViewedStudyProgress():Promise<ViewedState> {
 await writes;
 try{
  const [raw,legacy]=await Promise.all([AsyncStorage.getItem(VIEWED_REVISIONS_KEY),AsyncStorage.getItem(SENSEI_PROGRESS_KEY)]);
  return viewedState(decodeViewedProgress(raw),sanitizeViewedProgress(JSON.parse(legacy||'{}')),SENSEI_LESSONS);
 }catch{return {current:{},earlier:{},readFailed:true};}
}
export async function getSenseiProgress():Promise<Record<string,number>> {
 return (await getViewedStudyProgress()).current;
}
export function saveSenseiProgress(lessonId:string,beatIndex:number):Promise<boolean> {
 const lesson=SENSEI_LESSONS.find(l=>l.id===lessonId);
 if(!lesson||!Number.isSafeInteger(beatIndex)||beatIndex<0||beatIndex>=lesson.beats.length)return Promise.resolve(false);
 return enqueue(async()=>{
  // Preserve legacy bookmarks and earlier revisions; never replace unreadable stored data.
  const progress=decodeViewedProgress(await AsyncStorage.getItem(VIEWED_REVISIONS_KEY));
  await AsyncStorage.setItem(VIEWED_REVISIONS_KEY,JSON.stringify(recordViewed(progress,lesson,beatIndex)));
 });
}
export async function getPracticeProgress():Promise<PracticeProgress> {
 await writes;try{return sanitizePracticeProgress(JSON.parse((await AsyncStorage.getItem(PRACTICE_KEY))||'{}'));}catch{return {};}
}
export function savePracticeSolve(lesson:SenseiLesson,index:number,attempts:number):Promise<boolean> {
 return enqueue(async()=>{
  const raw=await AsyncStorage.getItem(PRACTICE_KEY);
  let progress:PracticeProgress={};try{progress=sanitizePracticeProgress(JSON.parse(raw||'{}'));}catch{}
  await AsyncStorage.setItem(PRACTICE_KEY,JSON.stringify(recordPracticeSolve(progress,lesson,index,attempts)));
 });
}
