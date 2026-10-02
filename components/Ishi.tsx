import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';

export type IshiMood = 'happy' | 'excited' | 'sad' | 'proud';

interface IshiProps {
  mood?: IshiMood;
  size?: number;
}

/**
 * Ishi (石) — the living go-stone tutorial companion.
 * Smooth polished amber, chibi, sleepy-happy closed eyes, blush, stubby arms.
 * Ported 1:1 from the web Ishi.tsx SVG.
 */
const Ishi: React.FC<IshiProps> = ({ mood = 'happy', size = 80 }) => {
  const eyes =
    mood === 'sad' ? (
      <>
        <Path d="M31 50 q8 6 16 0" stroke="#5a3c10" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <Path d="M53 50 q8 6 16 0" stroke="#5a3c10" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </>
    ) : (
      <>
        <Path d="M31 48 q8 -8 16 0" stroke="#5a3c10" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <Path d="M53 48 q8 -8 16 0" stroke="#5a3c10" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </>
    );

  const mouth =
    mood === 'sad' ? (
      <Path d="M42 66 q8 -6 16 0" stroke="#5a3c10" strokeWidth="3" fill="none" strokeLinecap="round" />
    ) : mood === 'excited' || mood === 'proud' ? (
      <Path d="M38 60 q12 12 24 0 q-2 10 -12 10 q-10 0 -12 -10" fill="#7a4a1a" />
    ) : (
      <Path d="M42 62 q8 7 16 0" stroke="#5a3c10" strokeWidth="3" fill="none" strokeLinecap="round" />
    );

  const arms =
    mood === 'excited' || mood === 'proud' ? (
      <>
        <Ellipse cx="16" cy="34" rx="7" ry="12" fill="#e0aa45" transform="rotate(35 16 34)" />
        <Ellipse cx="84" cy="34" rx="7" ry="12" fill="#e0aa45" transform="rotate(-35 84 34)" />
      </>
    ) : (
      <>
        <Ellipse cx="17" cy="62" rx="7.5" ry="12" fill="#e0aa45" transform="rotate(18 17 62)" />
        <Ellipse cx="83" cy="62" rx="7.5" ry="12" fill="#e0aa45" transform="rotate(-18 83 62)" />
      </>
    );

  return (
    <View style={{ width: size, height: size }}>
      <Svg viewBox="0 0 100 100" width={size} height={size}>
        <Defs>
          <RadialGradient id="ishi-body" cx="35%" cy="28%" r="85%">
            <Stop offset="0%" stopColor="#ffedb8" />
            <Stop offset="45%" stopColor="#f7cd74" />
            <Stop offset="100%" stopColor="#c68f2c" />
          </RadialGradient>
        </Defs>
        {arms}
        <Ellipse cx="50" cy="54" rx="34" ry="31" fill="url(#ishi-body)" />
        <Ellipse cx="37" cy="38" rx="10" ry="6" fill="#ffffff" opacity="0.38" transform="rotate(-24 37 38)" />
        {eyes}
        <Ellipse cx="29" cy="59" rx="5.5" ry="3.6" fill="#e8825a" opacity="0.5" />
        <Ellipse cx="71" cy="59" rx="5.5" ry="3.6" fill="#e8825a" opacity="0.5" />
        {mouth}
      </Svg>
    </View>
  );
};

export default Ishi;
