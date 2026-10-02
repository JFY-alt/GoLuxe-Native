import React from 'react';
import Svg, { Path, Ellipse, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Animated, useCharacterMotion } from './CharacterMotion';

export type SenseiMood = 'happy' | 'excited' | 'sad' | 'proud';

interface SenseiProps {
  mood?: SenseiMood;
  /** bounce | celebrate | none — applied to the wrapper div (HTML transform, iOS-safe) */
  animation?: 'bounce' | 'celebrate' | 'none';
  size?: number;
}

/**
 * Iwao (巌) — "boulder". Ishi's teacher, the Study Room sensei.
 * A massive ancient jade boulder in the same chibi species as Ishi, but
 * visibly larger and calmer: serene meditating closed eyes, long white sage
 * eyebrows (the signature), faint muted blush, stubby stone arms, subtle
 * speckles and one hairline crack from centuries of wisdom.
 * The SVG itself is fully static (no internal animation) so it renders
 * identically on iOS Safari; motion is applied to the wrapper div.
 */
const Sensei: React.FC<SenseiProps> = ({ mood = 'happy', animation = 'bounce', size = 80 }) => {
  const motion = useCharacterMotion(animation, size);

  const ink = '#173b2f'; // dark jade for face lines
  const sageWhite = '#f4f1e6';

  // Serene meditating eyes — gentle downward arcs, calm in every mood.
  // The master stays serene; mood reads from brows, mouth and arms.
  const eyes =
    mood === 'sad' ? (
      <>
        <Path d="M31 52 q8 5 16 0" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
        <Path d="M53 52 q8 5 16 0" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
      </>
    ) : (
      <>
        <Path d="M30 51 q9 7 18 0" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
        <Path d="M52 51 q9 7 18 0" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
      </>
    );

  // Signature long white sage eyebrows — angled, thick, wise.
  const brows =
    mood === 'sad' ? (
      <>
        <Path d="M20 38 Q33 34 47 30" stroke={sageWhite} strokeWidth="5.5" fill="none" strokeLinecap="round" opacity="0.95" />
        <Path d="M53 30 Q67 34 80 38" stroke={sageWhite} strokeWidth="5.5" fill="none" strokeLinecap="round" opacity="0.95" />
      </>
    ) : mood === 'excited' ? (
      <>
        <Path d="M20 30 Q33 29 47 36" stroke={sageWhite} strokeWidth="5.5" fill="none" strokeLinecap="round" opacity="0.95" />
        <Path d="M53 36 Q67 29 80 30" stroke={sageWhite} strokeWidth="5.5" fill="none" strokeLinecap="round" opacity="0.95" />
      </>
    ) : (
      <>
        <Path d="M20 34 Q33 33 47 39" stroke={sageWhite} strokeWidth="5.5" fill="none" strokeLinecap="round" opacity="0.95" />
        <Path d="M53 39 Q67 33 80 34" stroke={sageWhite} strokeWidth="5.5" fill="none" strokeLinecap="round" opacity="0.95" />
      </>
    );

  // Mouth
  const mouth =
    mood === 'sad' ? (
      <Path d="M43 68 q7 -5 14 0" stroke={ink} strokeWidth="2.8" fill="none" strokeLinecap="round" />
    ) : mood === 'excited' ? (
      <Path d="M38 61 q12 12 24 0 q-2 10 -12 10 q-10 0 -12 -10" fill="#0f2c24" />
    ) : mood === 'proud' ? (
      <Path d="M40 62 q10 9 20 0" stroke={ink} strokeWidth="3.2" fill="none" strokeLinecap="round" />
    ) : (
      <Path d="M43 65 q7 5 14 0" stroke={ink} strokeWidth="2.8" fill="none" strokeLinecap="round" />
    );

  // Subtle white mustache wisps at the mouth corners — the old-master touch.
  const mustache = (
    <>
      <Path d="M38 66 q-5 1 -8 5" stroke={sageWhite} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
      <Path d="M62 66 q5 1 8 5" stroke={sageWhite} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
    </>
  );

  // Arms — chunkier than Ishi's; raised when excited/proud, drooping when sad.
  const arms =
    mood === 'excited' || mood === 'proud' ? (
      <>
        <Ellipse cx="9" cy="36" rx="8" ry="13" fill="#256049" transform="rotate(38 9 36)" />
        <Ellipse cx="91" cy="36" rx="8" ry="13" fill="#256049" transform="rotate(-38 91 36)" />
      </>
    ) : mood === 'sad' ? (
      <>
        <Ellipse cx="9" cy="70" rx="8" ry="13" fill="#256049" transform="rotate(10 9 70)" />
        <Ellipse cx="91" cy="70" rx="8" ry="13" fill="#256049" transform="rotate(-10 91 70)" />
      </>
    ) : (
      <>
        <Ellipse cx="9" cy="62" rx="8" ry="13" fill="#256049" transform="rotate(16 9 62)" />
        <Ellipse cx="91" cy="62" rx="8" ry="13" fill="#256049" transform="rotate(-16 91 62)" />
      </>
    );

  return (
    <Animated.View style={[{width:size,height:size},motion]}>
      <Svg viewBox="0 0 100 100" width={size} height={size} accessibilityLabel="Iwao the sensei boulder">
        <Defs>
          <RadialGradient id="iwao-body" cx="35%" cy="28%" r="85%">
            <Stop offset="0%" stopColor="#4a9d83" />
            <Stop offset="45%" stopColor="#2e7a60" />
            <Stop offset="100%" stopColor="#1e4d40" />
          </RadialGradient>
        </Defs>
        {arms}
        {/* Dark rim — the boulder's mass */}
        <Ellipse cx="50" cy="55" rx="42" ry="37" fill="#0e211b" />
        {/* Body — ancient jade, squashed sphere, larger than Ishi's pebble */}
        <Ellipse cx="50" cy="54" rx="40" ry="35" fill="url(#iwao-body)" />
        {/* Age: faint speckles */}
        <Circle cx="26" cy="27" r="2" fill="#8fc7ab" opacity="0.25" />
        <Circle cx="72" cy="25" r="1.4" fill="#8fc7ab" opacity="0.25" />
        <Circle cx="30" cy="81" r="1.7" fill="#8fc7ab" opacity="0.22" />
        <Circle cx="66" cy="79" r="1.3" fill="#8fc7ab" opacity="0.22" />
        {/* Age: one hairline crack */}
        <Path d="M85 56 l-5 6 l4 6" stroke="#123026" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        {/* Soft matte top-light — less glossy than Ishi's polished pebble */}
        <Ellipse cx="50" cy="24" rx="9" ry="5" fill="#ffffff" opacity="0.2" transform="rotate(-18 50 24)" />
        {brows}
        {eyes}
        {/* Blush — faint and muted, less cute than Ishi */}
        <Ellipse cx="27" cy="60" rx="5.5" ry="3.4" fill="#b98a76" opacity="0.2" />
        <Ellipse cx="73" cy="60" rx="5.5" ry="3.4" fill="#b98a76" opacity="0.2" />
        {mouth}
        {mustache}
      </Svg>
    </Animated.View>
  );
};

export default Sensei;
