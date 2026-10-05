import React, {useCallback, useEffect, useRef} from 'react';
import {AppState, StyleSheet, View} from 'react-native';
import {BlurView, BlurTargetView} from 'expo-blur';
import {useVideoPlayer, VideoView, VideoSource} from 'expo-video';
import Animated, {Easing, useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import {HOME_CINEMA as timing} from '../config/homeCinema';

let homePlaybackTime:number=timing.repeatFromSeconds;

type Props={source:VideoSource;skipOpening:boolean;active:boolean;onMenuReady:()=>void};
/** The already-blurred film fades from black before the menu is introduced. */
export default function HomeCinema({source,skipOpening,active,onMenuReady}:Props){
 const activeRef=useRef(active);activeRef.current=active;
 const resumeTime=useRef(skipOpening?Math.max(timing.repeatFromSeconds,homePlaybackTime):0);
 const target=useRef<View|null>(null),ready=useRef(false),revealed=useRef(false),failed=useRef(false);
 const callback=useRef(onMenuReady);callback.current=onMenuReady;
 const menuTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const videoOpacity=useSharedValue(0);
 const videoStyle=useAnimatedStyle(()=>({opacity:videoOpacity.value}));
 const player=useVideoPlayer(source,p=>{p.muted=true;p.loop=false;p.timeUpdateEventInterval=.1;p.staysActiveInBackground=false;});
 const reveal=useCallback(()=>{if(revealed.current)return;revealed.current=true;callback.current();},[]);
 const fallback=useCallback(()=>{if(failed.current)return;failed.current=true;player.pause();videoOpacity.value=withTiming(0,{duration:300});reveal();},[player,reveal,videoOpacity]);
 const firstFrame=()=>{if(ready.current||failed.current)return;ready.current=true;videoOpacity.value=withTiming(1,{duration:timing.openingFadeMs,easing:Easing.inOut(Easing.ease)});if(skipOpening)reveal();else if(!revealed.current)menuTimer.current=setTimeout(reveal,timing.openingFadeMs+timing.menuDelayMs);};
 useEffect(()=>{
  const time=player.addListener('timeUpdate',({currentTime})=>{homePlaybackTime=currentTime;});
  const status=player.addListener('statusChange',({status})=>{if(status==='error')fallback();else if(status==='readyToPlay'&&skipOpening&&!ready.current){player.currentTime=Math.min(resumeTime.current,Math.max(0,player.duration-.1));}});
  // Seek immediately while keeping the rendered video and blur fully visible.
  const end=player.addListener('playToEnd',()=>{if(failed.current)return;reveal();player.currentTime=0;homePlaybackTime=0;if(activeRef.current&&AppState.currentState==='active')player.play();});
  const app=AppState.addEventListener('change',state=>{if(state==='active'&&activeRef.current&&!failed.current)player.play();else player.pause();});
  const watchdog=setTimeout(()=>{if(!revealed.current)reveal();},timing.loadingTimeoutMs);
  const stalledIntro=setTimeout(()=>{if(!revealed.current)fallback();},30000);
  if(skipOpening){player.currentTime=resumeTime.current;reveal();}
  if(activeRef.current&&AppState.currentState==='active'&&!failed.current)player.play();else player.pause();
  return()=>{if(menuTimer.current)clearTimeout(menuTimer.current);clearTimeout(watchdog);clearTimeout(stalledIntro);time.remove();status.remove();end.remove();app.remove();};
 },[player,skipOpening,reveal,fallback,videoOpacity]);
 useEffect(()=>{if(active&&AppState.currentState==='active'&&!failed.current)player.play();else player.pause();},[player,active]);
 // Blur mounts before the first video frame. Fade the composite, never a sharp frame.
 return <View pointerEvents="none" style={StyleSheet.absoluteFill} accessible={false}>
  <Animated.View style={[StyleSheet.absoluteFill,videoStyle]}>
   <BlurTargetView ref={target} style={StyleSheet.absoluteFill}>
    <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} allowsPictureInPicture={false} fullscreenOptions={{enable:false}} playsInline surfaceType="textureView" onFirstFrameRender={firstFrame}/>
   </BlurTargetView>
   <BlurView blurTarget={target} blurMethod="dimezisBlurViewSdk31Plus" intensity={48} tint="dark" style={StyleSheet.absoluteFill}/>
  </Animated.View>
 </View>;
}
