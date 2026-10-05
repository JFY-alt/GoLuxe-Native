import React from 'react';
import {StyleSheet,View} from 'react-native';
import {BlurView} from 'expo-blur';
import {useTheme} from '../ui';
/** Shared frosted surface for the web's translucent lesson cards and dialogs. */
export default function GlassBackdrop() {
  const {mode}=useTheme();
  return <View pointerEvents="none" accessible={false} style={[StyleSheet.absoluteFill,{borderRadius:16,overflow:'hidden'}]}>
    <BlurView intensity={32} tint={mode==='light'?'light':'dark'} style={StyleSheet.absoluteFill}/>
    <View style={[StyleSheet.absoluteFill,{backgroundColor:mode==='light'?'rgba(255,255,255,.70)':'rgba(255,255,255,.03)'}]}/>
  </View>;
}
