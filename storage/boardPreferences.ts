import AsyncStorage from '@react-native-async-storage/async-storage';
import {BoardPreferences,parseBoardPreferences} from '../logic/boardPreferences';
export const BOARD_PREFERENCES_KEY='goluxe-board-preferences-v1';
let writes:Promise<unknown>=Promise.resolve();
export async function loadBoardPreferences():Promise<BoardPreferences> {
 await writes;try{return parseBoardPreferences(JSON.parse((await AsyncStorage.getItem(BOARD_PREFERENCES_KEY))||'null'));}catch{return parseBoardPreferences(null);}
}
export function saveBoardPreferences(patch:Partial<BoardPreferences>):Promise<boolean> {
 const next=writes.then(async()=>{
  let previous:BoardPreferences=parseBoardPreferences(null);
  const raw=await AsyncStorage.getItem(BOARD_PREFERENCES_KEY);
  try{previous=parseBoardPreferences(JSON.parse(raw||'null'));}catch{}
  await AsyncStorage.setItem(BOARD_PREFERENCES_KEY,JSON.stringify(parseBoardPreferences({...previous,...patch})));
 });
 writes=next.catch(()=>{});return next.then(()=>true,()=>false);
}
