import {test} from 'node:test';
import assert from 'node:assert/strict';
import {coordinateLabel,survivingMoveNumbers,variationGroups,continuationLabel} from '../logic/recordPresentation';
import {parseSgf,serializeSgf} from '../logic/sgf';
test('coordinates skip I and count rows upward from the lower edge for all board sizes',()=>{
 for(const size of [9,13,19]){assert.equal(coordinateLabel(0,0,size),`A${size}`);assert.equal(coordinateLabel(8,size-1,size),'J1');}
 assert.equal(coordinateLabel(18,0,19),'T19');
});
test('move labels include pass numbering, captured removal and selected variation only',()=>{
 const root=parseSgf('(;SZ[9];B[ba];W[bb];B[ab];W[hh];B[cb];W[];B[bc](;W[dd])(;W[ee]))').root;
 let n=root;while(n.children.length)n=n.children[0];
 const map=survivingMoveNumbers(n);assert.equal(map['1,1'],undefined);assert.equal(map['1,2'],7);assert.equal(map['3,3'],8);assert.equal(map['4,4'],undefined);
 const sibling=n.parent!.children[1];assert.equal(survivingMoveNumbers(sibling)['4,4'],8);assert.equal(survivingMoveNumbers(sibling)['3,3'],undefined);
 assert.equal(survivingMoveNumbers(n.parent!)['1,2'],7);
});
test('setup stones have no move labels and setup edits remove old move identities',()=>{
 const root=parseSgf('(;SZ[9]AB[aa:bb];W[dd];B[ee];AE[dd]AW[ee];W[ff])').root;let n=root;while(n.children.length)n=n.children[0];
 assert.deepEqual(survivingMoveNumbers(n),{'5,5':3});assert.deepEqual(survivingMoveNumbers(root),{});
});

test('variation chooser exposes every sibling and nested fork without mutating the record',()=>{
 const {root}=parseSgf('(;SZ[9];B[aa](;W[bb])(;W[cc](;B[dd])(;B[ee])(;B[ff]N[third]))(;W[gg]C[outer third];B[hh]))');
 const fork=root.children[0],selected=fork.children[1].children[2];
 const before=serializeSgf(root);const groups=variationGroups(selected);
 assert.equal(groups.length,2);assert.equal(groups[0].parent,fork);assert.equal(groups[0].children.length,3);assert.equal(groups[0].selected,fork.children[1]);
 assert.equal(groups[1].children.length,3);assert.equal(groups[1].selected,selected);
 assert.equal(continuationLabel(selected,2),'Variation 2 · Black F4 · third');
 assert.equal(serializeSgf(root),before);
 const third=fork.children[2];assert.equal(variationGroups(third.children[0])[0].selected,third);
 assert.equal(continuationLabel(third,2),'Variation 2 · White G3');assert.deepEqual(third.properties.C,['outer third']);
});
test('fork immediately ahead is selectable and pass/setup continuations have honest labels',()=>{
 const root=parseSgf('(;SZ[9](;B[])(;AB[cc]N[diagram])(;B[tt]))').root;
 const groups=variationGroups(root);assert.equal(groups.length,1);assert.equal(groups[0].selected,null);assert.equal(groups[0].children.length,3);
 assert.equal(continuationLabel(root.children[0],0),'Main continuation · Black pass');
 assert.equal(continuationLabel(root.children[1],1),'Variation 1 · Setup / annotation · diagram');
 assert.equal(continuationLabel(root.children[2],2),'Variation 2 · Black pass');
 assert.deepEqual(variationGroups(parseSgf('(;SZ[9];B[aa];W[bb])').root),[]);
});
