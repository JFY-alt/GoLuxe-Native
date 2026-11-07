import React,{useEffect,useRef,useState} from 'react';
import {View,Text,Pressable,TextInput} from '../ui';
import Dialog from './Dialog';
import {SavedRecord} from '../logic/gameArchive';
import {changeSavedRecord,loadSavedRecords} from '../storage/gameArchive';
import {C} from '../theme';

type Props={visible:boolean;onClose:()=>void;onOpen:(record:SavedRecord)=>void};
export default function SavedRecordLibrary({visible,onClose,onOpen}:Props){
 const [records,setRecords]=useState<SavedRecord[]>([]),[selected,setSelected]=useState<SavedRecord|null>(null);
 const [mode,setMode]=useState<'list'|'rename'|'delete'>('list'),[draft,setDraft]=useState('');
 const [loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 const lock=useRef(false),generation=useRef(0);
 const refresh=async()=>{
  const request=++generation.current;setLoading(true);setError(null);
  try{const next=await loadSavedRecords();if(request===generation.current)setRecords(next);}
  catch(e){if(request===generation.current)setError((e as Error).message);}
  finally{if(request===generation.current)setLoading(false);}
 };
 useEffect(()=>{
  if(visible){setMode('list');setSelected(null);setRecords([]);void refresh();}
  return()=>{generation.current++;};
 },[visible]);
 const back=()=>{if(lock.current)return;setMode('list');setSelected(null);setError(null);};
 const close=()=>{if(lock.current)return;if(mode==='list')onClose();else back();};
 const change=async()=>{
  if(lock.current||!selected)return;lock.current=true;setBusy(true);setError(null);
  const request=generation.current;
  try{
   const next=await changeSavedRecord(selected.id,mode==='delete'?{remove:true}:{title:draft});
   if(request===generation.current){setRecords(next);setMode('list');setSelected(null);}
  }catch(e){if(request===generation.current)setError((e as Error).message);}
  finally{lock.current=false;if(request===generation.current)setBusy(false);}
 };
 const button={minHeight:44,justifyContent:'center' as const,paddingHorizontal:12,borderRadius:8,borderWidth:1,borderColor:C.white10};
 const list=<View style={{gap:12}}>
  {loading?<Text style={{color:C.amber100}}>Loading saved records…</Text>:records.map(record=><View key={record.id} style={{padding:12,gap:10,borderWidth:1,borderColor:C.white10,borderRadius:12}}>
   <Pressable accessibilityRole="button" accessibilityLabel={`Open saved record: ${record.title}`} onPress={()=>onOpen(record)} style={{minHeight:44,justifyContent:'center'}}><Text style={{color:C.amber100,fontSize:16}}>{record.title}</Text><Text style={{color:C.white40,fontSize:11,marginTop:4}}>{new Date(record.savedAt).toLocaleString()}</Text></Pressable>
   <View style={{flexDirection:'row',gap:8}}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Rename saved record: ${record.title}`} style={button} onPress={()=>{setSelected(record);setDraft(record.title);setError(null);setMode('rename');}}><Text style={{color:C.amber100,fontSize:12}}>Rename</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={`Delete saved record: ${record.title}`} style={button} onPress={()=>{setSelected(record);setError(null);setMode('delete');}}><Text style={{color:'#fca5a5',fontSize:12}}>Delete</Text></Pressable>
   </View>
  </View>)}
  {!loading&&!records.length&&!error&&<Text style={{color:C.white40}}>No saved records yet. Use Save Record to keep a match on this device.</Text>}
  {error&&<Pressable accessibilityRole="button" onPress={()=>void refresh()} style={button}><Text style={{color:C.amber100}}>Retry Loading</Text></Pressable>}
 </View>;
 return <Dialog dialog={visible?{
  title:mode==='rename'?'Rename Record':mode==='delete'?'Delete Saved Record?':'Saved Records',
  description:mode==='rename'?'Give this record a name. Its moves, variations and commentary stay intact.':mode==='delete'?`Delete “${selected?.title}” from this device? This cannot be undone. The current board and automatic recovery session stay available. Export a copy before deleting if you want a backup.`:'Open a record for review. Live clocks and scoring markings are not restored.',
  noCancel:busy,
  ...(mode!=='list'?{confirmLabel:busy?'Saving…':mode==='delete'?'Delete Record':'Save Name',confirm:()=>void change(),closeOnConfirm:false,danger:mode==='delete'}:{}),
  children:<View style={{gap:12}}>{mode==='list'?list:mode==='rename'?<TextInput accessibilityLabel="Record name" value={draft} onChangeText={setDraft} editable={!busy} maxLength={120} autoFocus style={{minHeight:48,padding:12,color:C.amber50,borderWidth:1,borderColor:C.white20,borderRadius:10}}/>:null}{error&&<Text accessibilityRole="alert" style={{color:'#fca5a5'}}>{error}</Text>}</View>,
 }:null} onClose={close}/>;
}
