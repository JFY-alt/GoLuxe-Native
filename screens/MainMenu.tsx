import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Pressable, StatusBar, Text, View, StyleSheet} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {useSharedValue,useAnimatedStyle,withTiming} from 'react-native-reanimated';
import HomeCinema from '../components/HomeCinema';
import {HOME_REEL_SOURCE,HOME_CINEMA} from '../config/homeCinema';

interface MainMenuProps {active?:boolean;onPlay:()=>void;onWhatIsGo:()=>void;onHowToPlay:()=>void;onStudy:()=>void;introSeen?:boolean;onIntroSeen?:()=>void;}
/** Fixed dark cinema, independent of the theme selected inside a game. */
export default function MainMenu({onPlay,onWhatIsGo,onHowToPlay,onStudy,active=true,introSeen=false,onIntroSeen}:MainMenuProps){
 const skipOpening=useRef(introSeen).current;
 const insets=useSafeAreaInsets();const [exiting,setExiting]=useState(false);
 const [menuReady,setMenuReady]=useState(!HOME_REEL_SOURCE||introSeen);
 const opacity=useSharedValue(menuReady?1:0),offset=useSharedValue(menuReady?0:8);
 const menuStyle=useAnimatedStyle(()=>({opacity:opacity.value,transform:[{translateY:offset.value}]}));
 const reveal=useCallback(()=>{setMenuReady(true);onIntroSeen?.();},[onIntroSeen]);
 useEffect(()=>{if(menuReady){opacity.value=withTiming(1,{duration:HOME_CINEMA.menuFadeMs});offset.value=withTiming(0,{duration:HOME_CINEMA.menuFadeMs});}},[menuReady]);
 useEffect(()=>{if(active)setExiting(false);},[active]);
 const navigate=(fn:()=>void)=>{if(exiting)return;setExiting(true);fn();};
 const buttons=[{label:'What is Go?',fn:onWhatIsGo},{label:'How to Play',fn:onHowToPlay},{label:'Study',fn:onStudy},{label:'Play',fn:onPlay}];
 return <View style={styles.root}>{active&&<StatusBar barStyle="light-content" backgroundColor="#000"/>}{HOME_REEL_SOURCE&&<HomeCinema source={HOME_REEL_SOURCE} skipOpening={skipOpening} active={active&&!exiting} forceReveal={menuReady} onMenuReady={reveal}/>}
 {!menuReady&&<Pressable accessibilityRole="button" onPress={reveal} style={[styles.skipIntro,{bottom:insets.bottom+32}]}><Text style={styles.skipText}>Skip Intro</Text></Pressable>}
 <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,.40)','rgba(0,0,0,.40)']} style={StyleSheet.absoluteFill}/>
 <Animated.View pointerEvents={menuReady?'auto':'none'} accessibilityElementsHidden={!menuReady} importantForAccessibility={menuReady?'auto':'no-hide-descendants'} style={[styles.center,{paddingTop:insets.top+24,paddingBottom:insets.bottom+24},menuStyle]}><View style={styles.titleBlock}><Text style={styles.title}>GoLuxe</Text><Text style={styles.subtitle}>Strategic Purity</Text></View><View style={styles.buttons}>{buttons.map(b=><Pressable accessibilityRole="button" key={b.label} onPress={()=>navigate(b.fn)} disabled={exiting} style={({pressed})=>[styles.btn,pressed&&styles.btnPressed]}><Text style={styles.btnText}>{b.label}</Text></Pressable>)}</View></Animated.View>
 </View>;
}
const styles=StyleSheet.create({skipIntro:{position:'absolute',right:32,zIndex:2,borderWidth:1,borderColor:'rgba(255,255,255,.20)',borderRadius:12,paddingHorizontal:24,paddingVertical:8},skipText:{fontFamily:'CormorantGaramond_400',color:'rgba(255,255,255,.60)',fontSize:10,letterSpacing:2,textTransform:'uppercase'},root:{flex:1,backgroundColor:'#000'},center:{flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:40},titleBlock:{alignItems:'center',marginBottom:40},title:{fontFamily:'CormorantGaramond_400',fontSize:72,lineHeight:72,color:'#fffbeb',letterSpacing:-3.6,textShadowColor:'rgba(0,0,0,.8)',textShadowOffset:{width:0,height:2},textShadowRadius:24},subtitle:{fontFamily:'Inter_300',color:'rgba(254,243,199,.60)',fontSize:12,letterSpacing:9.6,textTransform:'uppercase',marginTop:8,textShadowColor:'rgba(0,0,0,.8)',textShadowOffset:{width:0,height:1},textShadowRadius:12},buttons:{width:'100%',gap:24,alignItems:'center'},btn:{paddingHorizontal:32,paddingVertical:12,borderRadius:12,borderWidth:1,borderColor:'rgba(255,255,255,.10)',backgroundColor:'transparent',alignItems:'center'},btnPressed:{backgroundColor:'rgba(255,255,255,.05)'},btnText:{fontFamily:'CormorantGaramond_400',color:'rgba(255,255,255,.40)',fontSize:12,letterSpacing:2.4,textTransform:'uppercase'}});
