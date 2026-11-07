import {useEffect,useRef,useState} from 'react';
import {BoardPreferences,DEFAULT_BOARD_PREFERENCES} from '../logic/boardPreferences';
import {loadBoardPreferences,saveBoardPreferences} from '../storage/boardPreferences';
export function useBoardPreferences(){
 const [preferences,setPreferences]=useState<BoardPreferences>({...DEFAULT_BOARD_PREFERENCES});
 const [saveFailed,setSaveFailed]=useState(false);
 const current=useRef(preferences),alive=useRef(false),dirty=useRef<Partial<BoardPreferences>>({});
 const persist=(next:Partial<BoardPreferences>)=>{void saveBoardPreferences(next).then(saved=>{if(alive.current)setSaveFailed(!saved);});};
 useEffect(()=>{
  alive.current=true;
  void loadBoardPreferences().then(saved=>{
   if(!alive.current)return;
   const next={...saved,...dirty.current};current.current=next;setPreferences(next);
  });
  return()=>{alive.current=false;};
 },[]);
 const update=(patch:Partial<BoardPreferences>)=>{
  dirty.current={...dirty.current,...patch};const next={...current.current,...patch};current.current=next;setPreferences(next);
  persist(patch);
 };
 return {preferences,update,saveFailed};
}
