import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ENDGAME_LESSON} from '../data/endgameLesson';
import {lessonBoard} from '../logic/study';
import {calculateScores,findGroup,getLiberties,getBoardString,getAllGroups,getImmortalPoints} from '../logic/goEngine';
import {emptyPosition,playMove} from '../logic/sgf';
const base=()=>({...emptyPosition(9),board:lessonBoard(ENDGAME_LESSON,1)});
const score=(board:ReturnType<typeof base>['board'],rules:'chinese'|'japanese')=>calculateScores(board,{black:0,white:0},0,0,new Set(),rules);
test('endgame counting diagram has two connected living groups, three eyes each and exact totals',()=>{
 const b=base().board;assert.equal(getAllGroups(b).length,2);assert.equal(getImmortalPoints(b).size,74);
 for(const color of ['black','white'] as const){assert.equal(score(b,'chinese')[color].stones,37);assert.equal(score(b,'chinese')[color].territory,3);assert.equal(score(b,'chinese')[color].total,40);assert.equal(score(b,'japanese')[color].total,3);}
});
test('taking the neutral point gains one area point, zero territory points, without capture',()=>{
 const next=playMove(base(),{x:4,y:4});assert.equal(next.captures.black,0);
 assert.equal(score(next.board,'chinese').black.total,41);assert.equal(score(next.board,'chinese').white.total,40);
 assert.equal(score(next.board,'japanese').black.total,3);assert.equal(score(next.board,'japanese').white.total,3);
});
test('filling own territory preserves area but costs territory; other two eyes remain',()=>{
 const next=playMove(base(),{x:1,y:1});assert.equal(score(next.board,'chinese').black.total,40);assert.equal(score(next.board,'japanese').black.total,2);
 assert.ok(getImmortalPoints(next.board).has("1,1"));assert.equal(next.board[1][3],null);assert.equal(next.board[1][5],null);
 // Playing inside the other side is not a useful alternative: White has three real eyes.
 assert.throws(()=>playMove(base(),{x:3,y:7}),/suicide|self.capture/i);
});
test('atari demonstration proves capture if ignored and three liberties after the saving reply',()=>{
 const b=lessonBoard(ENDGAME_LESSON,4);const initial={...emptyPosition(9),board:b,history:[getBoardString(b)]};
 assert.equal(getLiberties(b,findGroup(b,{x:4,y:4})!.group).size,2);
 const atari=playMove(initial,{x:5,y:4});assert.equal(getLiberties(atari.board,findGroup(atari.board,{x:4,y:4})!.group).size,1);
 assert.deepEqual(atari.board,lessonBoard(ENDGAME_LESSON,5));
 const ignored=playMove(atari,{x:8,y:8});const captured=playMove(ignored,{x:4,y:5});assert.equal(captured.captures.black,1);
 const saved=playMove(atari,{x:4,y:5});const group=findGroup(saved.board,{x:4,y:4})!;assert.equal(group.group.length,2);assert.equal(getLiberties(saved.board,group.group).size,3);assert.equal(saved.turn,'black');
});
