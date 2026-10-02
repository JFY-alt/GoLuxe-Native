import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Keyframe } from 'react-native-reanimated';

/**
 * Screen transition matching the web app: every screen enters with
 * `animate-in fade-in zoom-in duration-500`.
 */
const enter = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.97 }] },
  100: { opacity: 1, transform: [{ scale: 1 }] },
}).duration(500);

export const ScreenFade: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Animated.View entering={enter} style={styles.fill}>
    {children}
  </Animated.View>
);

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
