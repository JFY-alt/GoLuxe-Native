import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseBoardPreferences,DEFAULT_BOARD_PREFERENCES} from '../logic/boardPreferences';
test('display settings survive encoding without carrying game rules, hints for lessons or clocks',()=>{
 const stored={coordinates:true,moveNumbers:true,liberties:false,atari:false,lifeStatus:false,darkTheme:'midnight',lightTheme:'maple',ruleset:'japanese',komi:0};
 const restored=parseBoardPreferences(JSON.parse(JSON.stringify(stored)));
 assert.equal(restored.coordinates,true);assert.equal(restored.moveNumbers,true);assert.equal(restored.darkTheme,'midnight');assert.equal(restored.lightTheme,'maple');assert.equal(restored.liberties,false);assert.equal('ruleset' in restored,false);assert.equal('komi' in restored,false);
});
test('invalid settings recover independently without converting strings into enabled aids',()=>{
 for(const bad of [null,[],0,'true'])assert.deepEqual(parseBoardPreferences(bad),DEFAULT_BOARD_PREFERENCES);
 const result=parseBoardPreferences({coordinates:'true',moveNumbers:true,liberties:0,darkTheme:'washi',lightTheme:'midnight'});
 assert.equal(result.coordinates,false);assert.equal(result.moveNumbers,true);assert.equal(result.liberties,true);assert.equal(result.darkTheme,'classic');assert.equal(result.lightTheme,'washi');
});
