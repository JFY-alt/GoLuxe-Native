import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SENSEI_LESSONS,type SenseiLesson} from '../data/senseiLessons';
import {decodeViewedProgress,lessonSignature,recordViewed,viewedState} from '../logic/viewedProgress';
const lesson=SENSEI_LESSONS.find(l=>l.id==='mistakes')!;
const clone=():SenseiLesson=>JSON.parse(JSON.stringify(lesson));
test('legacy bookmarks are retained as earlier evidence, never assigned to unverified current content',()=>{
 const legacy={mistakes:8};const state=viewedState({},legacy,[lesson]);
 assert.deepEqual(state.current,{});assert.equal(state.earlier.mistakes,true);assert.deepEqual(legacy,{mistakes:8});
});
test('current content resumes its high-water bookmark, while semantic changes require review',()=>{
 const progress=recordViewed({},lesson,4);
 assert.equal(viewedState(progress,{},[lesson]).current.mistakes,4);
 for(const change of [
  (l:SenseiLesson)=>{l.beats.reverse();},
  (l:SenseiLesson)=>{l.beats[0].text+=' Revised instruction.';},
  (l:SenseiLesson)=>{l.beats[0].studentColor='white';},
  (l:SenseiLesson)=>{l.beats[0].board=['X........',...Array(8).fill('.........')];},
  (l:SenseiLesson)=>{l.boardSize=13;},
  (l:SenseiLesson)=>{l.beats[0].taps=[{x:1,y:1}];},
 ]){
  const revised=clone();change(revised);assert.notEqual(lessonSignature(revised),lessonSignature(lesson));
  const state=viewedState(progress,{},[revised]);assert.equal(state.current.mistakes,undefined);assert.equal(state.earlier.mistakes,true);
 }
});
test('viewing a new revision preserves earlier revisions and unrelated lessons without carrying its old index',()=>{
 const revised=clone();revised.beats[0].text+=' Updated.';
 const other=SENSEI_LESSONS.find(l=>l.id==='shape')!;
 const progress=recordViewed(recordViewed({},lesson,8),other,2);
 const next=recordViewed(progress,revised,1);
 assert.equal(next.mistakes.length,2);assert.equal(viewedState(next,{},[revised]).current.mistakes,1);
 assert.equal(viewedState(next,{},[lesson]).current.mistakes,8);assert.equal(viewedState(next,{},[other]).current.shape,2);
 assert.equal(recordViewed(next,revised,0).mistakes.find(r=>r.signature===lessonSignature(revised))!.index,1);
 assert.equal(progress.mistakes.length,1);
});
test('malformed revision storage and invalid bookmark indexes are rejected rather than silently overwritten',()=>{
 for(const raw of ['broken','null','[]','{"mistakes":{}}','{"mistakes":[{"signature":"x","index":-1}]}','{"mistakes":[{"signature":"x","index":1.5}]}'])assert.throws(()=>decodeViewedProgress(raw));
 assert.deepEqual(decodeViewedProgress(null),{});
 for(const index of [-1,NaN,1.5,lesson.beats.length])assert.throws(()=>recordViewed({},lesson,index));
 const encoded=JSON.stringify(recordViewed({},lesson,3));assert.equal(viewedState(decodeViewedProgress(encoded),{},[lesson]).current.mistakes,3);
});
