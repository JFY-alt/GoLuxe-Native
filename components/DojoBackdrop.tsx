import React, {useEffect} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import Svg, {Defs, Filter, FeColorMatrix, Image as SvgImage} from 'react-native-svg';
import Animated, {useSharedValue, useAnimatedStyle, withDelay, withTiming} from 'react-native-reanimated';
import {LinearGradient} from 'expo-linear-gradient';

const dojo = require('../assets/dojo-bg.jpg');
/** The web's empty dojo: monochrome at entry, then a three-second color bloom. */
export default function DojoBackdrop() {
  const monochrome = useSharedValue(1);
  const style = useAnimatedStyle(() => ({opacity: monochrome.value}));
  useEffect(() => {monochrome.value = withDelay(1500, withTiming(0, {duration:3000}));}, []);
  return <View pointerEvents="none" accessible={false} style={[StyleSheet.absoluteFill,{backgroundColor:'#000'}]}>
    <Image source={dojo} resizeMode="cover" style={StyleSheet.absoluteFill}/>
    <Animated.View style={[StyleSheet.absoluteFill,style]}>
      <Svg width="100%" height="100%">
        <Defs><Filter id="dojo-monochrome"><FeColorMatrix type="saturate" values="0"/></Filter></Defs>
        <SvgImage href={dojo} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" filter="url(#dojo-monochrome)"/>
      </Svg>
    </Animated.View>
    <View style={[StyleSheet.absoluteFill,{backgroundColor:'rgba(0,0,0,.55)'}]}/>
    <LinearGradient colors={['rgba(0,0,0,.40)','transparent','rgba(0,0,0,.60)']} style={StyleSheet.absoluteFill}/>
  </View>;
}
