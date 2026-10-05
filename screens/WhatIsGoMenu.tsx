import {SafeAreaView} from 'react-native-safe-area-context';
import MenuBackdrop from '../components/MenuBackdrop';
import {MENU_VIDEOS} from '../config/homeCinema';
import { AnimatedView } from '../ui';
import { useWindowDimensions } from 'react-native';
import { FadeIn, FadeInDown, Easing, FadeInRight, FadeInLeft, useSharedValue, useAnimatedProps, withDelay, withTiming } from 'react-native-reanimated';
import { Pressable, ScrollView, StatusBar, Text, View } from '../ui';
import React, { useState, useRef } from 'react';
import { Dimensions, StyleSheet } from 'react-native';

import Animated from 'react-native-reanimated';
import { useTheme } from '../ui';
import Svg, { Mask, Path, Defs, Line, Circle, RadialGradient, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
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

const QI_STROKES: string[] = [
  "M12.53,38.47c2.1,0.66,4.99,0.43,6.48,0.19c5.44-0.86,14.6-3.04,20.47-4.04c1.02-0.17,2.15-0.25,3.04-0.25",
  "M30.98,16.5c1.01,1.01,1.39,2.5,1.39,4.17c0,3.63-0.06,48.72-0.08,66.83c0,3.52-0.01,6.02-0.01,7",
  "M31.35,38.03c0,1.84-1.5,4.92-2.23,6.58c-5.02,11.45-9.5,18.64-17.62,29.26",
  "M34.75,45.12c2.78,1.69,6.31,6.1,8.65,9.38",
  "M47.63,36.59c2.43,0.22,4.45,0.13,6.88-0.25c8.84-1.4,24.46-3.38,33.1-4.17c1.89-0.17,3.71-0.42,5.56,0.09",
  "M56.57,20.03c0.95,0.95,1.28,2.22,1.28,3.61c0,0.97,0,43.02-0.17,48.99",
  "M77.72,16.25c0.89,0.89,1.29,2,1.29,3.36c0,0.97,0.08,43.52,0.08,50.36",
  "M59.12,47.25C62,47.04,75.11,45.2,77.8,44.99",
  "M59.12,59.88c4.62-0.5,14.5-1.75,18.99-2.11",
  "M43.48,74.18c2.77,0.32,5.25,0.17,7.9-0.13c9.12-1.05,28.34-3.5,39.12-4.11c2.28-0.13,4.54-0.25,6.77,0.38",
  "M57.98,80.21c0.12,0.95-0.36,1.81-0.93,2.57c-2.67,3.34-7.42,7.59-14.79,11.97",
  "M76,78.75c6.51,2.78,16.81,11.41,18.44,15.73"
];
const STROKE_LENGTHS=[30.452662339052658,78.34220214103209,41.24316780466825,12.826276602935652,45.86427313179787,52.926295742222266,54.06062159744187,18.8172772510385,19.107520461045247,54.07429171564804,21.926126138424287,24.585729463872685];
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedGlyph = Animated.createAnimatedComponent(SvgText);
function BrushStroke({d,index}:{d:string;index:number}) {
  const length=STROKE_LENGTHS[index];
  const offset=useSharedValue(length);
  React.useEffect(()=>{offset.value=withDelay(600+index*240,withTiming(0,{duration:700,easing:Easing.bezier(.42,0,.58,1)}));},[]);
  const props=useAnimatedProps(()=>({strokeDashoffset:offset.value}));
  return <AnimatedPath d={d} fill="none" stroke="#fff" strokeWidth={14} strokeLinecap="round" strokeDasharray={length} animatedProps={props} />;
}
function FinalGlyph(){
  const opacity=useSharedValue(0);React.useEffect(()=>{opacity.value=withDelay(4200,withTiming(1,{duration:900}));},[]);
  const props=useAnimatedProps(()=>({opacity:opacity.value}));
  return <AnimatedGlyph x="54.5" y="56" textAnchor="middle" alignmentBaseline="central" fontSize="94" fontFamily="Hiragino Mincho ProN" fill="url(#inkGold)" animatedProps={props}>棋</AnimatedGlyph>;
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
  const {mode}=useTheme(); const isLight=mode==='light';
  const { width, height } = useWindowDimensions();
  const size = Math.min(width * .58, height * .30, 240);
  const cell = size * .1;
  const stoneD = cell * 0.92;

  if (c.qi) {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} viewBox="0 0 109 109">
          <Defs>
            <SvgLinearGradient id="inkGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={isLight ? "#d99a3d" : "#f7e8bd"} />
              <Stop offset="55%" stopColor={isLight ? "#a86a1f" : "#e8c876"} />
              <Stop offset="100%" stopColor={isLight ? "#7c4a12" : "#a8843c"} />
            </SvgLinearGradient>
          <Mask id="qiMask" maskUnits="userSpaceOnUse" x="0" y="0" width="109" height="109">{QI_STROKES.map((d,i)=><BrushStroke key={i} d={d} index={i}/>)}</Mask>
          </Defs>
          <SvgText x="54.5" y="56" textAnchor="middle" alignmentBaseline="central" fontSize="94" fontFamily="Hiragino Mincho ProN" fill={isLight ? "rgba(168,106,31,.12)" : "rgba(232,200,118,.10)"}>棋</SvgText>
          <SvgText x="54.5" y="56" textAnchor="middle" alignmentBaseline="central" fontSize="94" fontFamily="Hiragino Mincho ProN" fill="url(#inkGold)" mask="url(#qiMask)">棋</SvgText>
          <FinalGlyph/>
        </Svg>
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {Array.from({ length: 9 }).map((_, i) => {
          const p = cell + i * cell;
          return (
            <React.Fragment key={i}>
              <Line x1={p} y1={cell} x2={p} y2={size - cell} stroke={isLight ? "rgba(101,67,33,.38)" : "rgba(254,243,199,.16)"} strokeWidth={0.5} />
              <Line x1={cell} y1={p} x2={size - cell} y2={p} stroke={isLight ? "rgba(101,67,33,.38)" : "rgba(254,243,199,.16)"} strokeWidth={0.5} />
            </React.Fragment>
          );
        })}
      </Svg>
      {c.stones.map((s, i) => (
        <AnimatedView entering={FadeIn.duration(1000).delay(chapter===0 ? (i===0?600:1600) : chapter===1 ? 500+i*160 : 500+(s.gx+s.gy)*110)}
          key={i}
          style={{
            position: 'absolute',
            left: cell + s.gx * cell - stoneD / 2,
            top: cell + s.gy * cell - stoneD / 2,
          }}
        >
          <View style={{width:stoneD,height:stoneD,borderRadius:stoneD/2,shadowColor:isLight?'#3c2d14':'#000',shadowOpacity:isLight?.4:.55,shadowRadius:8,shadowOffset:{width:0,height:3}}}><Svg width={stoneD} height={stoneD}><Defs><RadialGradient id={`deco-${i}`} cx="35%" cy="30%" r="75%"><Stop offset="0" stopColor={s.color==='black'?'#6b6b6b':'#ffffff'}/><Stop offset={s.color==='black'?'45%':'55%'} stopColor={s.color==='black'?'#232323':isLight?'#ddd6c7':'#e8e4da'}/><Stop offset="100%" stopColor={s.color==='black'?'#050505':isLight?'#8f8578':'#b8b2a4'}/></RadialGradient></Defs><Circle cx={stoneD/2} cy={stoneD/2} r={stoneD/2} fill={`url(#deco-${i})`}/></Svg></View>
        </AnimatedView>
      ))}
    </View>
  );
};

/** Matches the web WhatIsGoMenu: 4 swipeable chapters, dots, gold CTA on last chapter. */
const WhatIsGoMenu: React.FC<WhatIsGoMenuProps> = ({ onBack, onBegin, onHowToPlay }) => {
  const light=useTheme().mode==='light';
  const [chapter, setChapter] = useState(0);
  const [direction, setDirection] = useState(1);
  const touchX = useRef<number | null>(null);
  const goTo = (i: number) => { const n=Math.max(0,Math.min(3,i)); if(n===chapter)return;setDirection(n>chapter?1:-1);setChapter(n); };
  const c = CHAPTERS[chapter];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <MenuBackdrop source={MENU_VIDEOS.whatIsGo} light={light} videoOpacity={.55}/>
      <SafeAreaView style={{flex:1}} edges={['top','right','bottom','left']}>

      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.topBtn}>
          <Text style={styles.topBtnText}>‹ Menu</Text>
        </Pressable>
        <Text style={styles.counter}>
          0{chapter + 1} <Text style={{ color: C.white20 }}>/ 04</Text>
        </Text>
      </View>

      <View style={styles.chapterFrame}>
      <AnimatedView key={chapter} entering={(direction>0?FadeInRight:FadeInLeft).duration(700).withInitialValues({transform:[{translateX:direction*40}]})} style={styles.body} onTouchStart={(e:any)=>{touchX.current=e.nativeEvent.pageX;}} onTouchEnd={(e:any)=>{if(touchX.current===null)return;const dx=e.nativeEvent.pageX-touchX.current;touchX.current=null;if(dx < -60)goTo(chapter+1);else if(dx > 60)goTo(chapter-1);}}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.chapterContent}>
        <DecoVisual chapter={chapter} />
        <AnimatedView entering={FadeInDown.duration(700).delay(150).withInitialValues({transform:[{translateY:8}]})}><Text style={styles.kicker}>{c.kicker}</Text></AnimatedView>
        <AnimatedView entering={FadeInDown.duration(700).delay(300).withInitialValues({transform:[{translateY:16}]})}><Text style={[styles.title,{fontSize:chapter===3?24:30}]}>{c.title}</Text></AnimatedView>
        <AnimatedView entering={FadeIn.duration(700).delay(450)} style={styles.rule} />
        <AnimatedView entering={FadeInDown.duration(700).delay(550).withInitialValues({transform:[{translateY:16}]})}><Text style={styles.paragraph}>{c.body}</Text></AnimatedView>
        {chapter === 3 && (
          <AnimatedView entering={FadeInDown.duration(700).delay(800).withInitialValues({transform:[{translateY:16}]})} style={styles.ctaBlock}>
            <Pressable onPress={onBegin} style={styles.cta}>
              <Text style={styles.ctaText}>Begin Playing</Text>
            </Pressable>
            <Pressable onPress={onHowToPlay} style={styles.cta}>
              <Text style={styles.ctaText}>How to Play</Text>
            </Pressable>
          </AnimatedView>
        )}
        </ScrollView>
      </AnimatedView>
      <Pressable accessibilityRole="button" accessibilityLabel="Previous chapter" accessibilityState={{disabled:chapter===0}}
        onPress={() => goTo(chapter - 1)} disabled={chapter === 0} style={[styles.arrow, styles.leftArrow, chapter === 0 && { opacity: 0.2 }]}>
        <Text style={styles.arrowText}>‹</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Next chapter" accessibilityState={{disabled:chapter===CHAPTERS.length-1}}
        onPress={() => goTo(chapter + 1)} disabled={chapter === CHAPTERS.length-1} style={[styles.arrow, styles.rightArrow, chapter === CHAPTERS.length-1 && { opacity: 0.2 }]}>
        <Text style={styles.arrowText}>›</Text>
      </Pressable>
      </View>

      <View style={styles.bottomBar}>
        <View style={styles.dots}>
          {CHAPTERS.map((_, i) => (
            <Pressable key={i} accessibilityLabel={`Chapter ${i+1}`} onPress={() => goTo(i)} style={[styles.dot, i === chapter ? styles.dotActive : styles.dotIdle]} />
          ))}
        </View>
      </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 24 },
  topBtn: { padding: 8 },
  topBtnText: { color: C.white40, fontSize: 12, fontFamily: SERIF, letterSpacing: 2.2, textTransform: 'uppercase' },
  counter: { color: 'rgba(254,243,199,0.40)', fontSize: 12, fontFamily: SERIF, letterSpacing: 3.6 },
  chapterFrame: { flex: 1, overflow: 'hidden' },
  body: { flex: 1 },
  chapterContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 56, paddingVertical: 16 },
  leftArrow: { position: 'absolute', left: 6, top: '50%', marginTop: -22, zIndex: 10 },
  rightArrow: { position: 'absolute', right: 6, top: '50%', marginTop: -22, zIndex: 10 },
  kicker: { color: 'rgba(254,243,199,0.40)', fontWeight: '300', fontSize: 10, letterSpacing: 4.5, textTransform: 'uppercase', marginTop: 20, marginBottom: 12, textAlign: 'center' },
  title: { fontFamily: SERIF, fontSize: 30, color: C.amber50, letterSpacing: -0.5, textAlign: 'center', marginBottom: 12, maxWidth: 340 },
  rule: { height: 1, width: 64, backgroundColor: 'rgba(254,243,199,0.15)', marginBottom: 12 },
  paragraph: { color: 'rgba(255,255,255,0.55)', fontWeight: '300', fontSize: 14, lineHeight: 22, textAlign: 'center', maxWidth: 360 },
  ctaBlock: { marginTop: 24, marginBottom: 24, gap: 10, alignItems: 'center' },
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
  ctaText: { color: '#000', fontFamily: SERIF, fontSize: 11, letterSpacing: 2.2, textTransform: 'uppercase' },
  bottomBar: { alignItems: 'center', paddingTop: 12, paddingBottom: 24 },
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
