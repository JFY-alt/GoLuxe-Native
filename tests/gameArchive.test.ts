import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decodeArchive,recordForArchive,editArchive,recordTitle} from '../logic/gameArchive';
import {parseSgf,serializeSgf} from '../logic/sgf';
test('saved records preserve variations, commentary, players and setup without changing the live record',()=>{
 const parsed=parseSgf('(;SZ[9]RU[Japanese]KM[6.5]PB[Teacher]PW[Student]C[Opening]AB[aa];W[dd](;B[ee]C[Main])(;B[ff]C[Try this]))');
 const root=parsed.root,selected=root.children[0].children[1],original=serializeSgf(root);
 const saved=recordForArchive(root,selected,6.5);const restored=parseSgf(saved);
 assert.equal(serializeSgf(root),original);assert.equal(restored.root.properties.PB[0],'Teacher');assert.equal(restored.root.children[0].children.length,2);assert.equal(restored.root.children[0].children[1].properties.C[0],'Try this');assert.equal(restored.root.position.board[0][0],'black');
});
test('saving final results or continuation results preserves original results and avoids duplicate comments',()=>{
 const root=parseSgf('(;SZ[9]KM[7.5]RE[W+R];B[dd]C[Interesting])').root,selected=root.children[0];
 const ended=parseSgf(recordForArchive(root,selected,0,'B+2.5')).root;assert.equal(ended.properties.RE[0],'B+2.5');assert.equal(ended.properties.KM[0],'0');assert.equal(root.properties.RE[0],'W+R');
 const continuation=parseSgf(recordForArchive(root,selected,7.5,'B+R',true)).root;assert.equal(continuation.properties.RE[0],'W+R');assert.deepEqual(continuation.children[0].properties.C,['Interesting','GoLuxe continuation result: B+R']);
 const repeated=parseSgf(recordForArchive(continuation,continuation.children[0],7.5,'B+R',true)).root;assert.equal(repeated.children[0].properties.C.length,2);
});
test('corrupt archive metadata is rejected rather than silently dropping saved records',()=>{
 assert.deepEqual(decodeArchive(null),[]);
 for(const raw of ['bad','null','{}','{"version":2,"records":[]}','{"version":1,"records":[{}]}'])assert.throws(()=>decodeArchive(raw),/preserved/);
 const entry={id:'one',title:'Match',savedAt:100,sgf:'(;SZ[9])'};assert.deepEqual(decodeArchive(JSON.stringify({version:1,records:[entry]})),[entry]);
});

test('renaming preserves every SGF byte, identifier, date, ordering and unrelated record',()=>{
 const sgf='(;SZ[9]C[Root](;B[aa]C[main])(;B[bb]C[alternate]))';
 const records=[{id:'one',title:'First',savedAt:100,sgf},{id:'two',title:'Second',savedAt:200,sgf:'(;SZ[13])'}];
 const renamed=editArchive(records,'one',{title:'  Teacher review  '});
 assert.deepEqual(renamed,[{...records[0],title:'Teacher review'},records[1]]);assert.equal(renamed[0].sgf,sgf);assert.equal(records[0].title,'First');
 assert.equal(renamed[1],records[1]);
});
test('deleting targets only the selected record and rejects stale or ambiguous identities',()=>{
 const records=[{id:'one',title:'Same name',savedAt:100,sgf:'(;SZ[9])'},{id:'two',title:'Same name',savedAt:200,sgf:'(;SZ[13])'}];
 assert.deepEqual(editArchive(records,'one',{remove:true}),[records[1]]);assert.equal(records.length,2);
 assert.throws(()=>editArchive(records,'missing',{remove:true}),/no longer/);
 assert.throws(()=>decodeArchive(JSON.stringify({version:1,records:[records[0],records[0]]})),/duplicate/);
});
test('record names require nonempty bounded text and retain international characters',()=>{
 assert.equal(recordTitle('  棋譜 · Café  '),'棋譜 · Café');
 for(const name of ['', '   ', 'x'.repeat(121)])assert.throws(()=>recordTitle(name));
 assert.equal(recordTitle('x'.repeat(120)).length,120);
});
