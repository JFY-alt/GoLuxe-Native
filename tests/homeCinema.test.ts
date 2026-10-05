import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Execute the real controller with persistent hooks and a controlled native player.
function cinema() {
  let index=0;
  const hooks:any[]=[], pending:(()=>void)[]=[], values:any[]=[], timers:any[]=[];
  const app:any={currentState:'active',listener:null,addEventListener(_:string,listener:any){this.listener=listener;return {remove:()=>{this.listener=null;}};}};
  const player:any={duration:30,currentTime:0,plays:0,pauses:0,listeners:{},play(){this.plays++;},pause(){this.pauses++;},addListener(name:string,fn:any){this.listeners[name]=fn;return {remove:()=>delete this.listeners[name]};}};
  const depsEqual=(a:any[],b:any[])=>a&&b&&a.length===b.length&&a.every((v,i)=>v===b[i]);
  const react={
    useRef(value:any){const i=index++;return hooks[i]??(hooks[i]={current:value});},
    useState(value:any){const i=index++;if(!hooks[i])hooks[i]={value:typeof value==='function'?value():value};return [hooks[i].value,(next:any)=>{hooks[i].value=typeof next==='function'?next(hooks[i].value):next;}];},
    useCallback(fn:any,deps:any[]){const i=index++;if(!hooks[i]||!depsEqual(hooks[i].deps,deps))hooks[i]={fn,deps};return hooks[i].fn;},
    useEffect(fn:any,deps:any[]){const i=index++;if(!hooks[i]||!depsEqual(hooks[i].deps,deps)){const old=hooks[i];hooks[i]={deps};pending.push(()=>{old?.cleanup?.();hooks[i].cleanup=fn();});}},
    createElement(type:any,props:any,...children:any[]){return {type,props:props||{},children};}
  };
  const exports:any={};
  const timing={revealAtSeconds:5,repeatFromSeconds:5,openingFadeMs:1800,blurFadeMs:1600,loadingTimeoutMs:8000};
  const source=fs.readFileSync(new URL('../components/HomeCinema.tsx',import.meta.url),'utf8');
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,{
    exports,require:(name:string)=>name==='react'?react:name==='react-native'?{AppState:app,StyleSheet:{absoluteFill:{}},View:'View'}:name==='expo-blur'?{BlurView:'Blur',BlurTargetView:'Target'}:name==='expo-video'?{useVideoPlayer:(source:any,init:any)=>{const i=index++;if(!hooks[i]){hooks[i]={player};init(player);}return hooks[i].player;},VideoView:'Video'}:name==='react-native-reanimated'?{default:{View:'Animated'},Easing:{inOut:(fn:any)=>fn,ease:()=>{}},useSharedValue:(value:any)=>{const i=index++;if(!hooks[i]){hooks[i]={value};values.push(hooks[i]);}return hooks[i];},useAnimatedStyle:(fn:any)=>{index++;return fn();},withTiming:(value:any)=>value}:{HOME_CINEMA:timing},
    setTimeout:(fn:any,ms:number)=>{const t={fn,ms};timers.push(t);return t;},clearTimeout:(timer:any)=>{if(timer)timer.cancelled=true;}
  });
  let calls=0;
  const props:any={source:'film.mp4',skipOpening:false,active:true,onMenuReady:()=>calls++};
  const render=(next:any={})=>{Object.assign(props,next);index=0;const tree=exports.default(props);pending.splice(0).forEach(fn=>fn());return tree;};
  const find=(tree:any,type:string):any=>{if(!tree||typeof tree!=='object')return null;if(tree.type===type)return tree;for(const child of tree.children.flat()){const result=find(child,type);if(result)return result;}return null;};
  return {render,find,player,app,values,timers,get calls(){return calls;},cleanup:()=>hooks.forEach(h=>h?.cleanup?.())};
}

test('home pauses off-screen and resumes the same loaded player without re-seeking or fading',()=>{
  const c=cinema();let tree=c.render();c.find(tree,'Video').props.onFirstFrameRender();c.player.currentTime=9.3;c.player.listeners.timeUpdate({currentTime:9.3});tree=c.render();
  assert.equal(c.calls,1);assert.ok(c.find(tree,'Blur'));
  const visibleOpacity=c.values[0].value,playCount=c.player.plays;
  c.render({active:false});assert.ok(c.player.pauses);assert.equal(c.player.currentTime,9.3);assert.equal(c.values[0].value,visibleOpacity);
  c.render({active:true});assert.ok(c.player.plays>playCount);assert.equal(c.player.currentTime,9.3);assert.equal(c.values[0].value,visibleOpacity);assert.equal(c.calls,1);
  c.player.listeners.playToEnd();assert.equal(c.player.currentTime,0);assert.equal(c.values[0].value,visibleOpacity);assert.equal(c.values[1].value,1);assert.equal(c.calls,1);
  c.app.currentState='background';c.app.listener('background');const paused=c.player.pauses;
  c.app.currentState='active';c.app.listener('active');assert.ok(c.player.pauses>=paused);assert.ok(c.player.plays>playCount);
  c.cleanup();assert.equal(Object.keys(c.player.listeners).length,0);
});
test('Skip Intro applies blur immediately; unavailable media still reveals the controls',()=>{
  const c=cinema();c.render();c.render({forceReveal:true});assert.equal(c.calls,1);assert.equal(c.values[1].value,1);c.cleanup();
  const stalled=cinema();stalled.render();stalled.timers.find(t=>t.ms===8000).fn();assert.equal(stalled.calls,1);stalled.cleanup();
  const failed=cinema();failed.render();failed.player.listeners.statusChange({status:'error'});assert.equal(failed.calls,1);assert.ok(failed.player.pauses);failed.cleanup();
});
