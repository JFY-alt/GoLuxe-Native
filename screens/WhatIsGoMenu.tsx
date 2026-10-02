import React, { useState } from 'react';
import { Dimensions, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Line, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import Stone from '../components/Stone';
import { C, SERIF } from '../theme';

interface WhatIsGoMenuProps {
  onBack: () => void;
  onBegin: () => void;
  onHowToPlay: () => void;
}

interface ChapterDef {
  kicker: string;
  title: string;
  body: string;
  stones: { gx: number; gy: number; color: 'black' | 'white' }[];
  qi?: boolean;
}

const CHAPTERS: ChapterDef[] = [
  {
    kicker: 'Chapter 01 · Origins',
    title: 'Four thousand years in the making.',
    body: "Born in China as Weiqi, Go is the oldest strategy game still played today. Legend says Emperor Yao invented it to teach his son balance and strategy — not merely a game, but a shared meditation between minds.",
    stones: [{ gx: 4, gy: 4, color: 'black' }, { gx: 5, gy: 3, color: 'white' }],
  },
  {
    kicker: 'Chapter 02 · Philosophy',
    title: 'Not annihilation. Dialogue.',
    body: 'Unlike chess, Go is a game of construction and coexistence. Two players build living structures from nothing — a dialogue of stone and wood, where the goal is to share the board more profitably than your opponent.',
    stones: Array.from({ length: 9 }).map((_, i) => ({
      gx: i,
      gy: 4 + Math.round(2.2 * Math.sin(i * 0.85)),
      color: (i % 2 === 0 ? 'black' : 'white') as 'black' | 'white',
    })),
  },
  {
    kicker: 'Chapter 03 · The Four Arts',
    title: 'A mirror of the mind.',
    body: "In ancient China, mastery of Go stood among the Four Arts of the Scholar, alongside calligraphy, painting, and music — a path to understanding one's own nature through the placement of stones.",
    qi: true,
    stones: [],
  },
  {
    kicker: 'Chapter 04 · Complexity',
    title: 'Simple enough for a child. Deeper than the universe.',
    body: 'The rules fit on a page, yet the number of possible board configurations exceeds the number of atoms in the observable universe. A universe on a grid — infinite in possibility, profound in depth.',
    stones: Array.from({ length: 81 })
      .map((_, k) => ({ gx: k % 9, gy: Math.floor(k / 9), k }))
      .filter(({ gx, gy }) => (gx * 7 + gy * 13 + 3) % 10 < 6)
      .map(({ gx, gy }) => ({ gx, gy, color: ((gx * 3 + gy * 5) % 2 === 0 ? 'black' : 'white') as 'black' | 'white' })),
  },
];

/** Decorative mini board visual for What-Is-Go chapters, matching the web DecoGrid. */
const DecoVisual: React.FC<{ chapter: number }> = ({ chapter }) => {
  const c = CHAPTERS[chapter];
  const size = Math.min(Dimensions.get('window').width * 0.58, 240);
  const cell = size / 9;
  const stoneD = cell * 0.92;

  if (c.qi) {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} viewBox="0 0 109 109">
          <Defs>
            <SvgLinearGradient id="inkGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#f7e8bd" />
              <Stop offset="55%" stopColor="#e8c876" />
              <Stop offset="100%" stopColor="#a8843c" />
            </SvgLinearGradient>
          </Defs>
          <View style={{ position: 'absolute' }}>
            <Text style={{ fontSize: size * 0.86, color: 'rgba(232,200,118,0.55)', fontFamily: SERIF }}>棋</Text>
          </View>
        </Svg>
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {Array.from({ length: 9 }).map((_, i) => {
          const p = cell / 2 + i * cell;
          return (
            <React.Fragment key={i}>
              <Line x1={p} y1={cell / 2} x2={p} y2={size - cell / 2} stroke="rgba(254,243,199,0.16)" strokeWidth={0.5} />
              <Line x1={cell / 2} y1={p} x2={size - cell / 2} y2={p} stroke="rgba(254,243,199,0.16)" strokeWidth={0.5} />
            </React.Fragment>
          );
        })}
      </Svg>
      {c.stones.map((s, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: cell / 2 + s.gx * cell - stoneD / 2,
            top: cell / 2 + s.gy * cell - stoneD / 2,
          }}
        >
          <Stone color={s.color} size={stoneD} />
        </View>
      ))}
    </View>
  );
};

/** Matches the web WhatIsGoMenu: 4 swipeable chapters, dots, gold CTA on last chapter. */
const WhatIsGoMenu: React.FC<WhatIsGoMenuProps> = ({ onBack, onBegin, onHowToPlay }) => {
  const [chapter, setChapter] = useState(0);
  const goTo = (i: number) => setChapter(Math.max(0, Math.min(3, i)));
  const c = CHAPTERS[chapter];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['rgba(254,243,199,0.05)', 'rgba(254,243,199,0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.topBtn}>
          <Text style={styles.topBtnText}>‹ Menu</Text>
        </Pressable>
        <Text style={styles.counter}>
          0{chapter + 1} <Text style={{ color: C.white20 }}>/ 04</Text>
        </Text>
      </View>

      <View style={styles.body}>
        <DecoVisual chapter={chapter} />
        <Text style={styles.kicker}>{c.kicker}</Text>
        <Text style={styles.title}>{c.title}</Text>
        <View style={styles.rule} />
        <Text style={styles.paragraph}>{c.body}</Text>
        {chapter === 3 && (
          <View style={styles.ctaBlock}>
            <Pressable onPress={onBegin} style={styles.cta}>
              <Text style={styles.ctaText}>Begin Playing</Text>
            </Pressable>
            <Pressable onPress={onHowToPlay} style={styles.cta}>
              <Text style={styles.ctaText}>How to Play</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.bottomBar}>
        <Pressable onPress={() => goTo(chapter - 1)} disabled={chapter === 0} style={[styles.arrow, chapter === 0 && { opacity: 0.2 }]}>
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <View style={styles.dots}>
          {CHAPTERS.map((_, i) => (
            <Pressable key={i} onPress={() => goTo(i)} style={[styles.dot, i === chapter ? styles.dotActive : styles.dotIdle]} />
          ))}
        </View>
        <Pressable onPress={() => goTo(chapter + 1)} disabled={chapter === 3} style={[styles.arrow, chapter === 3 && { opacity: 0.2 }]}>
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 24 },
  topBtn: { padding: 8 },
  topBtnText: { color: C.white40, fontSize: 12, fontFamily: SERIF, letterSpacing: 3, textTransform: 'uppercase' },
  counter: { color: 'rgba(254,243,199,0.40)', fontSize: 12, fontFamily: SERIF, letterSpacing: 4 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  kicker: { color: 'rgba(254,243,199,0.40)', fontWeight: '300', fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', marginTop: 20, marginBottom: 12, textAlign: 'center' },
  title: { fontFamily: SERIF, fontSize: 30, color: C.amber50, letterSpacing: -0.5, textAlign: 'center', marginBottom: 12, maxWidth: 340 },
  rule: { height: 1, width: 64, backgroundColor: 'rgba(254,243,199,0.15)', marginBottom: 12 },
  paragraph: { color: 'rgba(255,255,255,0.55)', fontWeight: '300', fontSize: 14, lineHeight: 22, textAlign: 'center', maxWidth: 360 },
  ctaBlock: { marginTop: 24, marginBottom: 12, gap: 10, alignItems: 'center' },
  cta: {
    width: 224,
    paddingVertical: 12,
    borderRadius: 28,
    backgroundColor: 'rgba(253,230,138,0.90)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  ctaText: { color: '#000', fontFamily: SERIF, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase' },
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32, paddingBottom: 28 },
  arrow: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: C.white10,
    alignItems: 'center', justifyContent: 'center',
  },
  arrowText: { color: 'rgba(255,255,255,0.50)', fontSize: 22, marginTop: -2 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { borderRadius: 2 },
  dotActive: { width: 32, height: 3, backgroundColor: 'rgba(253,230,138,0.90)' },
  dotIdle: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' },
});

export default WhatIsGoMenu;
