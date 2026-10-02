import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Player } from '../types';

interface StoneProps {
  color: Player;
  size: number;
}

/**
 * Go stone matching the web Stone.tsx:
 * radial-ish gradient (faked with a diagonal linear gradient) +
 * glossy surface highlight at top-left.
 */
const Stone: React.FC<StoneProps> = ({ color, size }) => {
  const isBlack = color === 'black';
  const r = size / 2;
  const hl = size * 0.25; // highlight dot: 25% of stone, at 18%/18%

  return (
    <View style={[styles.base, { width: size, height: size, borderRadius: r }]}>
      <LinearGradient
        colors={isBlack ? ['#4a4a4a', '#1a1a1a', '#000000'] : ['#ffffff', '#fefefe', '#e8e8e8']}
        start={{ x: 0.35, y: 0.35 }}
        end={{ x: 0.9, y: 0.9 }}
        style={[StyleSheet.absoluteFill, { borderRadius: r }]}
      />
      {/* Surface highlight */}
      <View
        style={{
          position: 'absolute',
          top: size * 0.18,
          left: size * 0.18,
          width: hl,
          height: hl,
          borderRadius: hl / 2,
          backgroundColor: isBlack ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.70)',
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});

export default Stone;
