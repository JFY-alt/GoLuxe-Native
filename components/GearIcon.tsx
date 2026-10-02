import {useTheme} from '../ui';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const GEAR_PATH =
  'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z ' +
  'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z';

/**
 * The GoLuxe settings gear — three interlocking gears exactly as in the
 * web app. On toggle each gear rotates (260° / -260° / 300°) over 1500ms
 * ease-in-out, matching the web's transition-transform duration-[1500ms].
 */
const GearIcon: React.FC<{ open: boolean; color?: string }> = ({ open, color }) => {
  const {mode}=useTheme(); color=color||(mode==='light'?'#78716c':'#ffffff');
  const r1 = useSharedValue(0);
  const r2 = useSharedValue(0);
  const r3 = useSharedValue(0);

  useEffect(() => {
    const cfg = { duration: 1500, easing: Easing.inOut(Easing.ease) };
    r1.value = withTiming(open ? 260 : 0, cfg);
    r2.value = withTiming(open ? -260 : 0, cfg);
    r3.value = withTiming(open ? 300 : 0, cfg);
  }, [open, r1, r2, r3]);

  const s1 = useAnimatedStyle(() => ({ transform: [{ rotate: `${r1.value}deg` }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ rotate: `${r2.value}deg` }] }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ rotate: `${r3.value}deg` }] }));

  return (
    <View style={styles.box} pointerEvents="none">
      <Animated.View style={[styles.g1, s1]}>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.85} strokeLinecap="round" strokeLinejoin="round">
          <Path d={GEAR_PATH} />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.g2, s2]}>
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.05} strokeLinecap="round" strokeLinejoin="round">
          <Path d={GEAR_PATH} />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.g3, s3]}>
        <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.15} strokeLinecap="round" strokeLinejoin="round">
          <Path d={GEAR_PATH} />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  box: { position: 'relative', width: 36, height: 36 },
  g1: { position: 'absolute', top: 2, left: 2 },
  g2: { position: 'absolute', top: 3, left: 16 },
  g3: { position: 'absolute', top: 13, left: 11 },
});

export default GearIcon;
