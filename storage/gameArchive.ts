import AsyncStorage from '@react-native-async-storage/async-storage';
import {decodeArchive,SavedRecord,editArchive,recordTitle} from '../logic/gameArchive';
import {parseSgf} from '../logic/sgf';
export const GAME_ARCHIVE_KEY='goluxe-saved-records-v1';
let writes:Promise<unknown>=Promise.resolve();let sequence=0;
export async function loadSavedRecords():Promise<SavedRecord[]> {
 await writes;return decodeArchive(await AsyncStorage.getItem(GAME_ARCHIVE_KEY));
}
export function saveRecord(sgf:string,title:string):Promise<SavedRecord> {
 parseSgf(sgf);
 const entry={id:`${Date.now()}-${++sequence}-${Math.random().toString(36).slice(2,10)}`,title:recordTitle(title),savedAt:Date.now(),sgf};
 const next=writes.then(async()=>{
  const records=decodeArchive(await AsyncStorage.getItem(GAME_ARCHIVE_KEY));
  await AsyncStorage.setItem(GAME_ARCHIVE_KEY,JSON.stringify({version:1,records:[entry,...records]}));return entry;
 });
 writes=next.catch(()=>{});return next;
}

/** Serialize read-modify-write with saves; unreadable libraries and failed writes are never cleared. */
export function changeSavedRecord(id:string,edit:{title:string}|{remove:true}):Promise<SavedRecord[]> {
 const next=writes.then(async()=>{
  const records=decodeArchive(await AsyncStorage.getItem(GAME_ARCHIVE_KEY));
  const updated=editArchive(records,id,edit);
  await AsyncStorage.setItem(GAME_ARCHIVE_KEY,JSON.stringify({version:1,records:updated}));return updated;
 });
 writes=next.catch(()=>{});return next;
}
