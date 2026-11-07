import {AiConfig,GameState,PlayerClock,TimeSettings} from '../types';
import {RecordNode} from './sgf';
import {tickClock} from './clocks';

export interface LiveSession {
 version:1; savedAt:number; clockAt:number; mode:'ai'|'2p';
 game:GameState; root:RecordNode; selected:RecordNode;
 snapshots:{position:GameState;node:RecordNode}[];
 aiConfig:AiConfig|null; timeSettings:TimeSettings|null; gameStarted:boolean;
 clocks:{black:PlayerClock;white:PlayerClock}; reviewMode:boolean;
 handicapOn:boolean; handicapType:'fixed'|'free'; handicapCount:number;
 komiDirection:'standard'|'reverse'|'none'; komiValue:number; customKomi:string;
 scoringTool:'dead'|'seki';
}
const invalid=()=>{throw new Error('The recovery slot could not be read. Its saved data has been preserved.');};
const object=(v:any)=>v&&typeof v==='object'&&!Array.isArray(v);
const integer=(v:any)=>Number.isInteger(v)&&v>=0;
const finite=(v:any)=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
const player=(v:any)=>v==='black'||v==='white';
export const validPlayerClock=(v:any):v is PlayerClock=>object(v)&&
 ['mainTimeLeft','byoyomiTimeLeft','canadianTimeLeft','nhkTimeLeft'].every(k=>finite(v[k]))&&
 ['byoyomiPeriodsLeft','canadianMovesLeft','ingPeriodsLeft','nhkPeriodsLeft'].every(k=>integer(v[k]))&&typeof v.isInOvertime==='boolean';
const encodePosition=(p:GameState)=>({...p,deadStones:[...p.deadStones],sekiPoints:[...p.sekiPoints]});
function decodePosition(p:any,historyLengths=new Map<string,number>()):GameState {
 if(!object(p)||![9,13,19].includes(p.board?.length))return invalid();
 const size=p.board.length;
 if(!p.board.every((r:any)=>Array.isArray(r)&&r.length===size&&r.every((c:any)=>c===null||player(c))))return invalid();
 const point=(v:any)=>object(v)&&integer(v.x)&&integer(v.y)&&v.x<size&&v.y<size;
 if(!player(p.turn)||!object(p.captures)||!integer(p.captures.black)||!integer(p.captures.white)||
  !(p.lastMove===null||point(p.lastMove))||!Array.isArray(p.history)||!p.history.length||
  !p.history.every((h:any)=>{
   if(typeof h!=='string')return false;
   let length=historyLengths.get(h);
   if(length===undefined){if(!/^(?:black|white|\.)+$/.test(h))return false;length=h.match(/black|white|\./g)!.length;historyLengths.set(h,length);}
   return length===size*size;
  })||
  !['play','scoring','ended'].includes(p.phase)||!(p.winner===null||p.winner==='draw'||player(p.winner))||
  !(p.winReason===undefined||['time','points','resign','no-result'].includes(p.winReason))||
  (p.phase==='ended'&&(p.winner===null||p.winReason===undefined))||
  !integer(p.consecutivePasses)||!integer(p.handicapPlacementsLeft)||p.handicapPlacementsLeft>9||
  !['japanese','chinese'].includes(p.ruleset))return invalid();
 const marks=(v:any)=>Array.isArray(v)&&v.every((k:any)=>typeof k==='string'&&/^\d+,\d+$/.test(k)&&point({x:Number(k.split(',')[0]),y:Number(k.split(',')[1])}));
 if(!marks(p.deadStones)||!marks(p.sekiPoints)||p.deadStones.some((k:string)=>p.sekiPoints.includes(k)))return invalid();
 return {...p,deadStones:new Set(p.deadStones),sekiPoints:new Set(p.sekiPoints)};
}
/** A flat tree avoids JSON cycles and preserves positions that SGF alone cannot express. */
export function encodeSession(s:LiveSession):string {
 const nodes:RecordNode[]=[s.root],ids=new Map<RecordNode,number>([[s.root,0]]);
 for(let i=0;i<nodes.length;i++)for(const child of nodes[i].children){
  if(ids.has(child)||child.parent!==nodes[i])throw new Error('Invalid record tree');
  ids.set(child,nodes.length);nodes.push(child);
 }
 const id=(n:RecordNode)=>{const value=ids.get(n);if(value===undefined)throw new Error('Position is outside the record tree');return value;};
 const histories:string[]=[],historyIds=new Map<string,number>();
 const historyId=(hash:string)=>{let i=historyIds.get(hash);if(i===undefined){i=histories.length;histories.push(hash);historyIds.set(hash,i);}return i;};
 const positions:any[]=[],positionIds=new Map<GameState,number>();
 const positionId=(p:GameState)=>{
  let i=positionIds.get(p);if(i===undefined){
   i=positions.length;positionIds.set(p,i);
   positions.push({...encodePosition(p),board:p.board.map(row=>row.map(c=>c==='black'?'B':c==='white'?'W':'.').join('')).join(''),history:p.history.map(historyId)});
  }return i;
 };
 const raw={...s,root:undefined,selected:id(s.selected),game:encodePosition(s.game),
  packed:1,nodes:nodes.map(n=>({properties:n.properties,children:n.children.map(id),position:positionId(n.position),moveNumber:n.moveNumber})),
  snapshots:s.snapshots.map(v=>({node:id(v.node),position:positionId(v.position)})),positions,histories};
 const text=JSON.stringify(raw);if(text.length>16*1024*1024)throw new Error('This session is too large for automatic recovery. Save its SGF record instead.');
 return text;
}
export function decodeSession(text:string|null):LiveSession|null {
 if(text===null)return null;
 try {
  if(text.length>16*1024*1024)return invalid();
  const s=JSON.parse(text);
  if(!object(s)||s.version!==1||!finite(s.savedAt)||!finite(s.clockAt)||!['ai','2p'].includes(s.mode)||
   !Array.isArray(s.nodes)||!s.nodes.length||s.nodes.length>10000||!integer(s.selected)||s.selected>=s.nodes.length)return invalid();
  const historyLengths=new Map<string,number>(),positionCache=new Map<any,GameState>();
  const storedPosition=(p:any)=>{
   let checked=positionCache.get(p);if(!checked){checked=decodePosition(p,historyLengths);positionCache.set(p,checked);}return checked;
  };
  if(s.packed!==undefined){
   if(s.packed!==1||!Array.isArray(s.positions)||s.positions.length>20001||!Array.isArray(s.histories))return invalid();
   const positions=s.positions.map((p:any)=>{
    if(!object(p)||typeof p.board!=='string'||!/^[BW.]+$/.test(p.board)||![81,169,361].includes(p.board.length)||
      !Array.isArray(p.history)||!p.history.every((i:any)=>integer(i)&&i<s.histories.length))return invalid();
    const size=Math.sqrt(p.board.length),board=Array.from({length:size},(_,y)=>[...p.board.slice(y*size,(y+1)*size)].map(c=>c==='B'?'black':c==='W'?'white':null));
    const normalized={...p,board,history:p.history.map((i:number)=>s.histories[i])};storedPosition(normalized);return normalized;
   });
   const position=(i:any)=>{if(!integer(i)||i>=positions.length)return invalid();return positions[i];};
   s.nodes=s.nodes.map((n:any)=>({...n,position:position(n.position)}));
   if(!Array.isArray(s.snapshots))return invalid();
   s.snapshots=s.snapshots.map((v:any)=>({...v,position:position(v.position)}));
  }
  const nodes:RecordNode[]=s.nodes.map((n:any)=>{
   if(!object(n)||!object(n.properties)||!Object.entries(n.properties).every(([k,v])=>/^[A-Z]+$/.test(k)&&Array.isArray(v)&&v.every(x=>typeof x==='string'))||
    !Array.isArray(n.children)||!integer(n.moveNumber))return invalid();
   return {properties:n.properties,children:[],parent:null,position:storedPosition(n.position),moveNumber:n.moveNumber};
  });
  const claimed=new Set<number>([0]);
  s.nodes.forEach((n:any,i:number)=>n.children.forEach((j:any)=>{
   if(!integer(j)||j<=i||j>=nodes.length||claimed.has(j))return invalid();
   claimed.add(j);nodes[i].children.push(nodes[j]);nodes[j].parent=nodes[i];
  }));
  if(claimed.size!==nodes.length)return invalid();
  if(!Array.isArray(s.snapshots)||s.snapshots.length>10000)return invalid();
  const snapshots=s.snapshots.map((v:any)=>{
   if(!object(v)||!integer(v.node)||v.node>=nodes.length)return invalid();
   return {node:nodes[v.node],position:storedPosition(v.position)};
  });
  if(!object(s.clocks)||!validPlayerClock(s.clocks.black)||!validPlayerClock(s.clocks.white))return invalid();
  if(s.aiConfig!==null&&(!object(s.aiConfig)||!player(s.aiConfig.userColor)||!['beginner','intermediate','advanced','master'].includes(s.aiConfig.difficulty)))return invalid();
  if(s.timeSettings!==null){
   const t=s.timeSettings;
   if(!object(t)||!['absolute','fischer','japanese','canadian','ing','nhk'].includes(t.system)||!finite(t.mainTimeMinutes))return invalid();
   for(const key of ['byoyomiPeriods','byoyomiSeconds','canadianStones','canadianMinutes','fischerIncrement','ingPeriods','ingBlockSeconds','nhkPeriods','nhkSeconds'])if(t[key]!==undefined&&!finite(t[key]))return invalid();
   const positiveFields:Record<string,string[]>={japanese:['byoyomiPeriods','byoyomiSeconds'],canadian:['canadianStones','canadianMinutes'],ing:['ingPeriods','ingBlockSeconds'],nhk:['nhkSeconds']};
   if((positiveFields[t.system]||[]).some(k=>!(t[k]>0)))return invalid();
  }
  for(const key of ['gameStarted','reviewMode','handicapOn'])if(typeof s[key]!=='boolean')return invalid();
  if(!['fixed','free'].includes(s.handicapType)||!integer(s.handicapCount)||s.handicapCount>8||
   !['standard','reverse','none'].includes(s.komiDirection)||!finite(s.komiValue)||typeof s.customKomi!=='string'||!['dead','seki'].includes(s.scoringTool))return invalid();
  const game=storedPosition(s.game);
  if(nodes.some(n=>n.position.board.length!==game.board.length)||snapshots.some((v:any)=>v.position.board.length!==game.board.length))return invalid();
  return {...s,game,root:nodes[0],selected:nodes[s.selected],snapshots};
 }catch{return invalid();}
}
/** Timed play continues even while the process is closed; scoring/review do not consume time. */
export function recoverSession(s:LiveSession,now:number):LiveSession {
 if(!s.timeSettings||!s.gameStarted||s.game.phase!=='play')return {...s,clockAt:now};
 const active=s.game.turn,result=tickClock(s.clocks[active],s.timeSettings,Math.max(0,now-s.clockAt));
 return {...s,clockAt:now,clocks:{...s.clocks,[active]:result.clock},
  game:result.timedOut?{...s.game,phase:'ended',winner:active==='black'?'white':'black',winReason:'time'}:s.game};
}
