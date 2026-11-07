import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseSgf,serializeSgf,playMove,replaySgfMove,emptyPosition} from '../logic/sgf';
import {getBoardString} from '../logic/goEngine';
test('record playback preserves a ko illustration while new live recaptures remain illegal',()=>{
 for(const rules of ['Japanese','Chinese']){
  const record=parseSgf(`(;SZ[9]RU[${rules}]AB[ba][ab][bc]AW[ca][bb][db][cc];B[cb](;W[bb]KO[]C[illustrated recapture])(;W[hh]))`);
  const black=record.root.children[0],white=black.children[0];
  assert.throws(()=>playMove(black.position,{x:1,y:1}),/Ko/);
  assert.equal(white.position.board[1][1],'white');assert.equal(white.position.board[1][2],null);
  assert.equal(white.position.captures.black,1);assert.equal(white.position.captures.white,1);assert.equal(record.playbackWarnings,1);
  const restored=parseSgf(serializeSgf(record.root));assert.equal(restored.root.children[0].children.length,2);
  assert.deepEqual(restored.root.children[0].children[0].properties.KO,['']);assert.equal(restored.playbackWarnings,1);
 }
});
test('SGF overwrites a recorded occupied point without counting the replaced stone as a prisoner',()=>{
 const {root,playbackWarnings}=parseSgf('(;SZ[9];B[aa];W[aa]C[diagram])');const black=root.children[0],white=black.children[0];
 assert.throws(()=>playMove(black.position,{x:0,y:0}),/occupied/);assert.equal(black.position.board[0][0],'black');
 assert.equal(white.position.board[0][0],'white');assert.deepEqual(white.position.captures,{black:0,white:0});assert.equal(playbackWarnings,1);
});
test('record self-capture removes the entire own chain after opponent captures are checked',()=>{
 const {root,playbackWarnings}=parseSgf('(;SZ[9]AB[aa]AW[ba][bb][ac];B[ab])');const next=root.children[0];
 assert.equal(next.position.board[0][0],null);assert.equal(next.position.board[1][0],null);
 assert.equal(next.position.captures.white,2);assert.equal(next.position.captures.black,0);assert.equal(playbackWarnings,1);
 assert.throws(()=>playMove(root.position,{x:0,y:1}),/Suicide/);
 const capture=parseSgf('(;SZ[9]AB[ca][bb]AW[ba][ab];B[aa])');assert.equal(capture.playbackWarnings,0);assert.equal(capture.root.children[0].position.board[0][0],'black');assert.equal(capture.root.children[0].position.captures.black,1);
});
test('record replay never mutates its source position or relaxes live move legality',()=>{
 const start=emptyPosition(9);start.board[0][0]='black';const before=getBoardString(start.board);
 const replay=replaySgfMove({...start,turn:'white'},{x:0,y:0});assert.equal(replay.unusual,true);
 assert.equal(getBoardString(start.board),before);assert.deepEqual(start.captures,{black:0,white:0});
 assert.throws(()=>playMove(start,{x:0,y:0}),/occupied/);assert.throws(()=>replaySgfMove(start,{x:9,y:0}),/outside/);
});
