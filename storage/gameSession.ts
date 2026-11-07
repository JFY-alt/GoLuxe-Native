import AsyncStorage from '@react-native-async-storage/async-storage';
import {decodeSession,encodeSession,LiveSession,validPlayerClock} from '../logic/gameSession';
export const GAME_SESSION_KEY='goluxe-live-session-v1';
export const GAME_CLOCK_CHECKPOINT_KEY='goluxe-live-clock-v1';
let writes:Promise<unknown>=Promise.resolve();
let sequence=0;
let lastValidatedSlot:string|null=null;
function decodeCheckpoint(raw:string|null){
 if(raw===null)return null;
 try{
  const c=JSON.parse(raw),finite=(v:any)=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
  if(!c||typeof c.revision!=='string'||!finite(c.clockAt)||!finite(c.savedAt)||!validPlayerClock(c.clocks?.black)||!validPlayerClock(c.clocks?.white))throw new Error();
  return c;
 }catch{throw new Error('The clock recovery data could not be read. Its saved data has been preserved.');}
}
function decodeSlot(raw:string|null):{revision:string;session:LiveSession}|null{
 if(raw===null)return null;
 try {
  const slot=JSON.parse(raw);if(slot.version!==1||typeof slot.revision!=='string'||typeof slot.session!=='string')throw new Error();
  const session=decodeSession(slot.session);if(!session)throw new Error();
  return {revision:slot.revision,session};
 }catch{throw new Error('The recovery slot could not be read. Its saved data has been preserved.');}
}
export async function loadSession(){
 await writes;const raw=await AsyncStorage.getItem(GAME_SESSION_KEY),slot=decodeSlot(raw);lastValidatedSlot=raw;if(!slot)return null;
 // Clock writes are small and independent. A checkpoint from another board revision is never applied.
 const c=decodeCheckpoint(await AsyncStorage.getItem(GAME_CLOCK_CHECKPOINT_KEY));
 if(c&&c.revision===slot.revision){
   if(c.clockAt>=slot.session.clockAt){
    const candidate={...slot.session,savedAt:c.savedAt,clockAt:c.clockAt,clocks:c.clocks};
    return decodeSession(encodeSession(candidate));
   }
 }
 return slot.session;
}
export function saveSession(text:string):Promise<string>{
 decodeSession(text);
 const revision=`${Date.now()}-${++sequence}-${Math.random().toString(36).slice(2)}`;
 const raw=JSON.stringify({version:1,revision,session:text});
 const next=writes.then(async()=>{
  // A failed read or malformed slot must never cause the old recovery data to be replaced.
  const previous=await AsyncStorage.getItem(GAME_SESSION_KEY);
  if(previous!==lastValidatedSlot)decodeSlot(previous);
  decodeCheckpoint(await AsyncStorage.getItem(GAME_CLOCK_CHECKPOINT_KEY));
  await AsyncStorage.setItem(GAME_SESSION_KEY,raw);lastValidatedSlot=raw;return revision;
 });
 writes=next.catch(()=>{});return next;
}
export function saveClockCheckpoint(revision:string,clockAt:number,clocks:LiveSession['clocks']):Promise<void>{
 const text=JSON.stringify({revision,clockAt,clocks,savedAt:Date.now()});
 const next=writes.then(async()=>{
  decodeCheckpoint(await AsyncStorage.getItem(GAME_CLOCK_CHECKPOINT_KEY));
  await AsyncStorage.setItem(GAME_CLOCK_CHECKPOINT_KEY,text);
 });
 writes=next.catch(()=>{});return next;
}
