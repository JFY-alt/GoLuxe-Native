import React, {useCallback, useEffect, useRef} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import Animated, {cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming} from 'react-native-reanimated';
import {LinearGradient} from 'expo-linear-gradient';

const dojo = require('../assets/dojo-bg.jpg');
// Derived from the same decoded pixels with Rec.709 grayscale coefficients.
const monochromeDojo = require('../assets/dojo-bg-monochrome.png');

/** Identical native image geometry: only saturation changes, never the crop. */
export default function DojoBackdrop() {
  const loaded = useRef({color: false, monochrome: false, started: false});
  const monochromeOpacity = useSharedValue(1);
  const visible = useSharedValue(0);
  const imageStyle = useAnimatedStyle(() => ({opacity: visible.value}));
  const monochromeStyle = useAnimatedStyle(() => ({opacity: monochromeOpacity.value}));
  const imageReady = useCallback((kind: 'color' | 'monochrome') => {
    loaded.current[kind] = true;
    if (!loaded.current.color || !loaded.current.monochrome || loaded.current.started) return;
    loaded.current.started = true;
    // Neither layer is exposed while its counterpart is still decoding.
    visible.value = withTiming(1, {duration: 500});
    // Blending grayscale with its exact original is a saturation interpolation.
    monochromeOpacity.value = withDelay(1500, withTiming(0, {
      duration: 3000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }));
  }, [visible, monochromeOpacity]);
  useEffect(() => () => {
    cancelAnimation(visible);
    cancelAnimation(monochromeOpacity);
  }, [visible, monochromeOpacity]);

  return <View pointerEvents="none" accessible={false} style={[StyleSheet.absoluteFill,{backgroundColor:'#000'}]}>
    <Animated.View style={[StyleSheet.absoluteFill,imageStyle]}>
      <Image source={dojo} resizeMode="cover" fadeDuration={0} style={StyleSheet.absoluteFill}
        onLoad={() => imageReady('color')}/>
      <Animated.View style={[StyleSheet.absoluteFill,monochromeStyle]}>
        <Image source={monochromeDojo} resizeMode="cover" fadeDuration={0} style={StyleSheet.absoluteFill}
          onLoad={() => imageReady('monochrome')}/>
      </Animated.View>
    </Animated.View>
    <View style={[StyleSheet.absoluteFill,{backgroundColor:'rgba(0,0,0,.55)'}]}/>
    <LinearGradient colors={['rgba(0,0,0,.40)','transparent','rgba(0,0,0,.60)']} style={StyleSheet.absoluteFill}/>
  </View>;
}
