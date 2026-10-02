import { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, cancelAnimation } from 'react-native-reanimated';
export { Animated };
export function useCharacterMotion(animation: 'bounce'|'celebrate'|'none', size: number) {
  const y=useSharedValue(0),angle=useSharedValue(0);
  useEffect(()=> {cancelAnimation(y);cancelAnimation(angle); y.value=0;angle.value=0;
    if(animation==='bounce')y.value=withRepeat(withSequence(withTiming(-size*.07,{duration:1200,easing:Easing.inOut(Easing.ease)}),withTiming(0,{duration:1200,easing:Easing.inOut(Easing.ease)})),-1);
    if(animation==='celebrate') {y.value=withRepeat(withSequence(withTiming(-size*.14,{duration:225}),withTiming(0,{duration:225}),withTiming(-size*.14,{duration:225}),withTiming(0,{duration:225})),-1);angle.value=withRepeat(withSequence(withTiming(-6,{duration:225}),withTiming(0,{duration:225}),withTiming(6,{duration:225}),withTiming(0,{duration:225})),-1);}
    return ()=>{cancelAnimation(y);cancelAnimation(angle);};
  },[animation,size]);
  return useAnimatedStyle(()=>({transform:[{translateY:y.value} as {translateY:number},{rotate:`${angle.value}deg`} as {rotate:`${number}deg`}]}));
}
