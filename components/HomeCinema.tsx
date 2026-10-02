import React, {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, StyleSheet, View} from 'react-native';
import {BlurView, BlurTargetView} from 'expo-blur';
import {useVideoPlayer, VideoView, VideoSource} from 'expo-video';
import Animated, {Easing, useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import {HOME_CINEMA as timing} from '../config/homeCinema';

type Props={source:VideoSource;skipOpening:boolean;active:boolean;onMenuReady:()=>void};
/** One silent player; playback time, rather than a wall-clock timer, cues the menu. */
export default function HomeCinema({source,skipOpening,active,onMenuReady}:Props){
 const loopTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const target=useRef<View|null>(null),ready=useRef(false),revealed=useRef(false),failed=useRef(false);
 const callback=useRef(onMenuReady);callback.current=onMenuReady;
 const [hasFrame,setHasFrame]=useState(false);
 const videoOpacity=useSharedValue(0),blurOpacity=useSharedValue(0);
 const videoStyle=useAnimatedStyle(()=>({opacity:videoOpacity.value}));
 const blurStyle=useAnimatedStyle(()=>({opacity:blurOpacity.value}));
 const player=useVideoPlayer(source,p=>{p.muted=true;p.loop=false;p.timeUpdateEventInterval=.1;p.staysActiveInBackground=false;});
 const reveal=useCallback(()=>{if(revealed.current)return;revealed.current=true;blurOpacity.value=withTiming(1,{duration:timing.blurFadeMs});callback.current();},[blurOpacity]);
 const fallback=useCallback(()=>{if(failed.current)return;failed.current=true;player.pause();videoOpacity.value=withTiming(0,{duration:300});reveal();},[player,reveal,videoOpacity]);
 const firstFrame=()=>{if(ready.current||failed.current)return;ready.current=true;setHasFrame(true);videoOpacity.value=withTiming(1,{duration:timing.openingFadeMs,easing:Easing.inOut(Easing.ease)});if(skipOpening)reveal();};
 useEffect(()=>{
  const time=player.addListener('timeUpdate',({currentTime})=>{if(ready.current&&currentTime>=timing.revealAtSeconds)reveal();});
  const status=player.addListener('statusChange',({status})=>{if(status==='error')fallback();});
  const end=player.addListener('playToEnd',()=>{if(failed.current)return;reveal();videoOpacity.value=withTiming(0,{duration:280});loopTimer.current=setTimeout(()=>{if(failed.current)return;const start=player.duration>timing.repeatFromSeconds+1?timing.repeatFromSeconds:0;player.currentTime=start;if(active&&AppState.currentState==='active')player.play();videoOpacity.value=withTiming(1,{duration:900});},300);});
  const app=AppState.addEventListener('change',state=>{if(state==='active'&&active&&!failed.current)player.play();else player.pause();});
  const watchdog=setTimeout(()=>{if(!ready.current)fallback();},timing.loadingTimeoutMs);
  const stalledIntro=setTimeout(()=>{if(!revealed.current)fallback();},30000);
  if(skipOpening)player.currentTime=timing.repeatFromSeconds;
  if(active&&!failed.current)player.play();else player.pause();
  return()=>{clearTimeout(watchdog);clearTimeout(stalledIntro);if(loopTimer.current)clearTimeout(loopTimer.current);time.remove();status.remove();end.remove();app.remove();};
 },[player,active,skipOpening,reveal,fallback,videoOpacity]);
 return <View pointerEvents="none" style={StyleSheet.absoluteFill} accessible={false}><Animated.View style={[StyleSheet.absoluteFill,videoStyle]}><BlurTargetView ref={target} style={StyleSheet.absoluteFill}><VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} allowsPictureInPicture={false} fullscreenOptions={{enable:false}} playsInline surfaceType="textureView" onFirstFrameRender={firstFrame}/></BlurTargetView></Animated.View>{hasFrame&&<Animated.View style={[StyleSheet.absoluteFill,blurStyle]}><BlurView blurTarget={target} blurMethod="dimezisBlurViewSdk31Plus" intensity={48} tint="dark" style={StyleSheet.absoluteFill}/><View style={[StyleSheet.absoluteFill,{backgroundColor:'rgba(0,0,0,.24)'}]}/></Animated.View>}</View>;
}
