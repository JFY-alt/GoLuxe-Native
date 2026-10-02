import React from 'react';
import GearIcon from './GearIcon';
import {View,Text} from '../ui';
import {C,SERIF} from '../theme';
/** Web guide sessions share the game session's disabled size selector. */
export default function GuideHeader(){return <>
  <View style={{width:'100%',position:'relative',flexDirection:'row',justifyContent:'center',gap:8,paddingVertical:10,marginBottom:18,borderBottomWidth:1,borderBottomColor:C.white05}}>
    <View style={{position:'absolute',left:0,top:0,opacity:.2}}><GearIcon open={false}/></View>
    {[9,13,19].map(size=><View key={size} style={{width:72,alignItems:'center',paddingVertical:4,borderBottomWidth:size===9?2:0,borderBottomColor:'rgba(254,243,199,.30)'}}><Text style={{fontFamily:SERIF,fontSize:14,letterSpacing:2,color:size===9?C.amber100:C.white20}}>{size}x{size}</Text></View>)}
  </View>
  <View style={{alignItems:'center',marginBottom:10}}><Text style={{fontFamily:SERIF,color:C.amber50,fontSize:18,fontWeight:'600'}}>GoLuxe</Text><Text style={{fontSize:8,letterSpacing:4,color:C.white30,textTransform:'uppercase',marginTop:2}}>Strategic Purity · Chinese Rules</Text></View>
</>;}
