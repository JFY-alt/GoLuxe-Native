import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PRACTICE_LESSON} from '../data/practiceLessons';
import {recordPracticeSolve,practiceSummary,sanitizePracticeProgress,sanitizeViewedProgress} from '../logic/practiceProgress';
test('viewing lessons does not produce evidence of independent solutions',()=>{
 assert.deepEqual(practiceSummary(PRACTICE_LESSON,{}),{total:4,solved:0,latestFirstTry:0});
 assert.deepEqual(sanitizeViewedProgress({practice:5}),{practice:5});
});
test('practice records distinguish first-try solves from answers after wrong attempts and repetitions',()=>{
 let evidence=recordPracticeSolve({},PRACTICE_LESSON,1,2);
 assert.deepEqual(practiceSummary(PRACTICE_LESSON,evidence),{total:4,solved:1,latestFirstTry:0});
 evidence=recordPracticeSolve(evidence,PRACTICE_LESSON,2,1);
 assert.deepEqual(practiceSummary(PRACTICE_LESSON,evidence),{total:4,solved:2,latestFirstTry:1});
 evidence=recordPracticeSolve(evidence,PRACTICE_LESSON,1,1);
 assert.equal(evidence['practice/1'].solves,2);assert.equal(evidence['practice/1'].firstTrySolves,1);
 assert.deepEqual(practiceSummary(PRACTICE_LESSON,evidence),{total:4,solved:2,latestFirstTry:2});
});
test('changing an exercise invalidates its old solve evidence while leaving other exercises intact',()=>{
 let evidence=recordPracticeSolve({},PRACTICE_LESSON,1,1);evidence=recordPracticeSolve(evidence,PRACTICE_LESSON,2,1);
 const revised={...PRACTICE_LESSON,beats:PRACTICE_LESSON.beats.map((b,i)=>i===1?{...b,text:'A different task'}:b)};
 assert.deepEqual(practiceSummary(revised,evidence),{total:4,solved:1,latestFirstTry:1});
 evidence=recordPracticeSolve(evidence,revised,1,3);assert.equal(evidence['practice/1'].solves,1);assert.equal(evidence['practice/1'].firstTrySolves,0);
});
test('corrupt stored progress and invalid attempt counts do not become mastery evidence',()=>{
 for(const malformed of [null,[],false,3,'finished']){assert.deepEqual(sanitizePracticeProgress(malformed),{});assert.deepEqual(sanitizeViewedProgress(malformed),{});}
 assert.deepEqual(sanitizeViewedProgress({good:3,negative:-1,decimal:.5,invalid:Infinity,wrong:'3'}),{good:3});
 assert.deepEqual(sanitizePracticeProgress({bad:{signature:'x',solves:1,lastAttempts:0,firstTrySolves:2}}),{});
 for(const invalid of [0,-1,NaN,Infinity,.5])assert.deepEqual(recordPracticeSolve({},PRACTICE_LESSON,1,invalid),{});
 assert.deepEqual(recordPracticeSolve({},PRACTICE_LESSON,0,1),{});
 const valid=recordPracticeSolve({},PRACTICE_LESSON,1,1);assert.deepEqual(sanitizePracticeProgress(JSON.parse(JSON.stringify(valid))),valid);
});
