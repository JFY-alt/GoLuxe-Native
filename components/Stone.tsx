import React, { memo, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { Player } from '../types';

interface StoneProps {
  color: Player;
  size: number;
}

/**
 * Go stone matching the web Stone.tsx exactly:
 * radial gradient centered at 35%/35% —
 *   black: #4a4a4a 0%, #1a1a1a 45%, #000000 100%
 *   white: #ffffff 0%, #fefefe 40%, #e8e8e8 100%
 * plus the glossy top-left surface highlight (25% dot at 18%/18%).
 * Memoized: only re-renders when color/size change, so full-board
 * re-renders on each move stay cheap.
 */
const Stone: React.FC<StoneProps> = ({ color, size }) => {
  const isBlack = color === 'black';
  const gid = useId().replace(/:/g, '');
  const r = size / 2;
  const stops = isBlack
    ? [
        { offset: '0%', c: '#4a4a4a' },
        { offset: '45%', c: '#1a1a1a' },
        { offset: '100%', c: '#000000' },
      ]
    : [
        { offset: '0%', c: '#ffffff' },
        { offset: '40%', c: '#fefefe' },
        { offset: '100%', c: '#e8e8e8' },
      ];

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: r,
          shadowOpacity: isBlack ? 0.8 : 0.35,
        },
      ]}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={gid} cx="35%" cy="35%" r="75%">
            {stops.map((s) => (
              <Stop key={s.offset} offset={s.offset} stopColor={s.c} />
            ))}
          </RadialGradient>
        </Defs>
        <Circle cx={r} cy={r} r={r} fill={`url(#${gid})`} />
        {/* Surface highlight — web: 25% dot at 18%/18%, blurred 1px */}
        <Ellipse
          cx={size * 0.305}
          cy={size * 0.305}
          rx={size * 0.125}
          ry={size * 0.125}
          fill={isBlack ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.70)'}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
});

export default memo(Stone);
