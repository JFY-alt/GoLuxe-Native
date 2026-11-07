import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Pressable, ScrollView, StatusBar, Text, View, StyleSheet} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {useSharedValue,useAnimatedStyle,withTiming} from 'react-native-reanimated';
import HomeCinema from '../components/HomeCinema';
import {HOME_REEL_SOURCE,HOME_CINEMA} from '../config/homeCinema';

interface MainMenuProps {active?:boolean;onPlay:()=>void;onWhatIsGo:()=>void;onHowToPlay:()=>void;onStudy:()=>void;introSeen?:boolean;onIntroSeen?:()=>void;onResume?:()=>void;recoveryError?:string|null;}
/** Fixed dark cinema, independent of the theme selected inside a game. */
export default function MainMenu({onPlay,onWhatIsGo,onHowToPlay,onStudy,active=true,introSeen=false,onIntroSeen,onResume,recoveryError}:MainMenuProps){
 const skipOpening=useRef(introSeen).current;
 const insets=useSafeAreaInsets();const [exiting,setExiting]=useState(false);
 const [menuReady,setMenuReady]=useState(!HOME_REEL_SOURCE||introSeen);
 const opacity=useSharedValue(menuReady?1:0),offset=useSharedValue(menuReady?0:8);
 const menuStyle=useAnimatedStyle(()=>({opacity:opacity.value,transform:[{translateY:offset.value}]}));
 const reveal=useCallback(()=>{setMenuReady(true);onIntroSeen?.();},[onIntroSeen]);
 useEffect(()=>{if(menuReady){opacity.value=withTiming(1,{duration:HOME_CINEMA.menuFadeMs});offset.value=withTiming(0,{duration:HOME_CINEMA.menuFadeMs});}},[menuReady]);
 useEffect(()=>{if(active)setExiting(false);},[active]);
 const navigate=(fn:()=>void)=>{if(exiting)return;setExiting(true);fn();};
 const buttons=[{label:'What is Go?',fn:onWhatIsGo},{label:'How to Play',fn:onHowToPlay},{label:'Study',fn:onStudy},{label:'Play',fn:onPlay},...(onResume?[{label:recoveryError?'Retry Recovery':'Resume Game',fn:onResume}]:[])];
 return <View style={styles.root}>{active&&<StatusBar barStyle="light-content"/>}{HOME_REEL_SOURCE&&<HomeCinema source={HOME_REEL_SOURCE} skipOpening={skipOpening} active={active&&!exiting} onMenuReady={reveal}/>}
 <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,.40)','rgba(0,0,0,.40)']} style={StyleSheet.absoluteFill}/>
 <Animated.View pointerEvents={menuReady?'auto':'none'} accessibilityElementsHidden={!menuReady} importantForAccessibility={menuReady?'auto':'no-hide-descendants'} style={[{flex:1},menuStyle]}><ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.center,{paddingTop:insets.top+24,paddingBottom:insets.bottom+24}]}><View style={styles.titleBlock}><Text style={styles.title}>GoLuxe</Text><Text style={styles.subtitle}>Strategic Purity</Text></View><View style={styles.buttons}>{buttons.map(b=><Pressable accessibilityRole="button" key={b.label} onPress={()=>b.fn===onResume?b.fn():navigate(b.fn)} disabled={exiting} style={({pressed})=>[styles.btn,pressed&&styles.btnPressed]}><Text style={styles.btnText}>{b.label}</Text></Pressable>)}</View></ScrollView></Animated.View>
 </View>;
}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:'#000'},center:{flexGrow:1,alignItems:'center',justifyContent:'center',paddingHorizontal:40},titleBlock:{alignItems:'center',marginBottom:40},title:{fontFamily:'CormorantGaramond_400',fontSize:72,lineHeight:72,color:'#fffbeb',letterSpacing:-3.6,textShadowColor:'rgba(0,0,0,.8)',textShadowOffset:{width:0,height:2},textShadowRadius:24},subtitle:{fontFamily:'Inter_300',color:'rgba(254,243,199,.60)',fontSize:12,letterSpacing:9.6,textTransform:'uppercase',marginTop:8,textShadowColor:'rgba(0,0,0,.8)',textShadowOffset:{width:0,height:1},textShadowRadius:12},buttons:{width:'100%',gap:24,alignItems:'center'},btn:{width:224,minHeight:44,paddingHorizontal:20,alignItems:'center',justifyContent:'center',borderRadius:12},btnPressed:{backgroundColor:'rgba(255,255,255,.05)'},btnText:{fontFamily:'CormorantGaramond_400',fontSize:12,color:'rgba(255,255,255,.60)',textTransform:'uppercase',letterSpacing:3}});
