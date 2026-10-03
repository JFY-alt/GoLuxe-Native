import React,{useEffect,useRef,useState} from 'react';
import {AppState,StyleSheet,View} from 'react-native';
import {BlurView,BlurTargetView} from 'expo-blur';
import {useVideoPlayer,VideoView,VideoSource} from 'expo-video';
import Animated,{useSharedValue,useAnimatedStyle,withTiming} from 'react-native-reanimated';
/** Quiet, always-blurred film behind immediately available menu controls. */
export default function MenuBackdrop({source,light=false,videoOpacity=.5}:{source:VideoSource;light?:boolean;videoOpacity?:number}){
 const target=useRef<View|null>(null),[frame,setFrame]=useState(false);const opacity=useSharedValue(0);
 const player=useVideoPlayer(source,p=>{p.muted=true;p.loop=true;p.staysActiveInBackground=false;});
 const style=useAnimatedStyle(()=>({opacity:opacity.value}));
 useEffect(()=>{player.play();const status=player.addListener('statusChange',({status})=>{if(status==='error'){opacity.value=withTiming(0,{duration:300});player.pause();}});const app=AppState.addEventListener('change',s=>{if(s==='active')player.play();else player.pause();});return()=>{status.remove();app.remove();};},[player]);
 return <View accessible={false} pointerEvents="none" style={[StyleSheet.absoluteFill,{backgroundColor:'#000'}]}><Animated.View style={[StyleSheet.absoluteFill,{transform:[{scale:1.05}]},style]}><BlurTargetView ref={target} style={StyleSheet.absoluteFill}><VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} allowsPictureInPicture={false} fullscreenOptions={{enable:false}} playsInline surfaceType="textureView" onFirstFrameRender={()=>{setFrame(true);opacity.value=withTiming(light?.22:videoOpacity,{duration:1500});}}/></BlurTargetView></Animated.View>{frame&&<BlurView pointerEvents="none" blurTarget={target} blurMethod="dimezisBlurViewSdk31Plus" intensity={32} tint={light?'light':'dark'} style={StyleSheet.absoluteFill}/>}<View style={[StyleSheet.absoluteFill,{backgroundColor:light?'rgba(250,250,249,.70)':'rgba(0,0,0,.45)'}]}/></View>;
}
