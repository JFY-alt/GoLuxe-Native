import React,{useState} from 'react';
import Svg,{Path} from 'react-native-svg';
import {View,Text,Pressable} from '../ui';
import Dialog from './Dialog';
import {RecordNode} from '../logic/sgf';
import {variationGroups,continuationLabel} from '../logic/recordPresentation';
import {C} from '../theme';
export const variationRoot=(node:RecordNode)=>{let root:RecordNode|null=null;for(let n=node;n.parent;n=n.parent)if(n.parent.children[0]!==n)root=n;return root;};
export default function RecordControls({node,onNode,onNav,commentVisible,onComment}:{node:RecordNode;onNode:(n:RecordNode)=>void;onNav:(a:'start'|'prev'|'next'|'end')=>void;commentVisible:boolean;onComment:()=>void}){
 const [choosing,setChoosing]=useState(false);
 const branch=variationRoot(node),groups=variationGroups(node);let end=node;while(end.children.length)end=end.children[0];
 const icon=(label:string,path:string,fn:()=>void,disabled=false,selected=false)=><Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled,selected}} onPress={fn} disabled={disabled} style={{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center',borderRadius:8,backgroundColor:selected?'rgba(254,243,199,.2)':C.white05,opacity:disabled?.2:1}}><Svg width={16} height={16} viewBox="0 0 24 24"><Path d={path} fill="none" stroke={selected?C.amber100:C.white40} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></Svg></Pressable>;
 return <View style={{gap:8}}>
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8}}>
   <View style={{flexShrink:1,gap:2}}><Text style={{fontSize:10,textTransform:'uppercase',letterSpacing:1,color:C.amber200}}>{branch?'Variation':'Main Line'}</Text><Text style={{fontSize:10,color:C.white40,fontVariant:['tabular-nums']}}>Move {node.moveNumber} / {end.moveNumber}</Text></View>
   <Pressable accessibilityRole="button" accessibilityLabel="Choose record variation" accessibilityState={{disabled:!groups.length,expanded:choosing}} disabled={!groups.length} onPress={()=>setChoosing(true)} style={{minHeight:44,paddingHorizontal:12,justifyContent:'center',borderRadius:8,borderWidth:1,borderColor:C.white10,backgroundColor:C.white05,opacity:groups.length?1:.3}}><Text style={{fontSize:10,fontWeight:'700',letterSpacing:.5,color:C.amber100}}>Branches{groups.length?` · ${groups.length} ${groups.length===1?'fork':'forks'}`:''}</Text></Pressable>
  </View>
  <View style={{flexDirection:'row',justifyContent:'space-between',gap:4}}>
   {icon('Start','M19 20 9 12 19 4Z M5 19V5',()=>onNav('start'),!node.parent)}
   {icon('Previous','M15 18 9 12 15 6',()=>onNav('prev'),!node.parent)}
   {icon('Next','M9 18 15 12 9 6',()=>onNav('next'),!node.children.length)}
   {icon('End','M5 4 15 12 5 20Z M19 5V19',()=>onNav('end'),!node.children.length)}
   {icon('Commentary','M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z',onComment,!node.properties.C,commentVisible)}
  </View>
  <Dialog dialog={choosing?{title:'Record Variations',description:'Choose a continuation at any fork on this path. Existing moves and commentary are retained.',children:<View style={{gap:16}}>{groups.map((group,g)=><View key={g} style={{gap:8}}><Text style={{color:C.amber100,fontSize:12}}>After move {group.parent.moveNumber}</Text>{group.children.map((child,i)=><Pressable key={i} accessibilityRole="button" accessibilityLabel={`After move ${group.parent.moveNumber}: ${continuationLabel(child,i)}`} accessibilityState={{selected:group.selected===child}} onPress={()=>{setChoosing(false);onNode(child);}} style={{minHeight:48,padding:12,gap:4,borderRadius:10,borderWidth:1,borderColor:group.selected===child?'rgba(253,230,138,.45)':C.white10,backgroundColor:C.white05}}><Text style={{color:C.amber100,fontSize:12}}>{continuationLabel(child,i)}{group.selected===child?' · Selected':''}</Text>{child.properties.C?.[0]&&<Text numberOfLines={2} style={{color:'rgba(255,255,255,.6)',fontSize:12}}>{child.properties.C[0]}</Text>}</Pressable>)}</View>)}</View>}:null} onClose={()=>setChoosing(false)}/>
 </View>;
}
