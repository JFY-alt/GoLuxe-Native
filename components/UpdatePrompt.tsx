import React, { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Updates from 'expo-updates';
import Dialog from './Dialog';
export default function UpdatePrompt() {
  const [available,setAvailable]=useState(false),[downloading,setDownloading]=useState(false),[error,setError]=useState<string|null>(null);
  const checking=useRef(false),dismissed=useRef<string|null>(null),availableId=useRef<string|null>(null);
  useEffect(()=>{
    // Expo Go receives development changes from Metro. EAS Update runs in signed release/preview builds.
    if(__DEV__ || !Updates.isEnabled)return;
    const check=async()=> { if(checking.current)return;checking.current=true;
      try {const result=await Updates.checkForUpdateAsync();if(result.isAvailable){const id=String((result.manifest as any)?.id || 'available');if(dismissed.current!==id){availableId.current=id;setAvailable(true);};}}
      catch { /* Keep the installed offline version when the update server is unavailable. */ }
      finally {checking.current=false;}
    };
    check();const sub=AppState.addEventListener('change',s=>{if(s==='active')check();});return()=>sub.remove();
  },[]);
  const install=async()=> {setDownloading(true);setError(null);try {await Updates.fetchUpdateAsync();await Updates.reloadAsync();}catch(e){setError('The update could not download. Try again when you are online.');setDownloading(false);}};
  return <Dialog dialog={available?{title:downloading?'Downloading Update…':'New Version Available',description:error||'Download the latest GoLuxe update and restart? Finish your current game first; restarting clears the board.',confirmLabel:downloading?undefined:'Download & Restart',confirm:downloading?undefined:install,noCancel:downloading,closeOnConfirm:false}:null} onClose={()=>{if(!downloading){dismissed.current=availableId.current;setAvailable(false);}}}/>;
}
