import Svg, {Line} from 'react-native-svg';
import {boardPresentation,displayHoshiPoints,atariConnections} from '../logic/boardPresentation';
import React, { useEffect, useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Intersection, Point, Player } from '../types';
import Stone from './Stone';
import { useTheme } from '../ui';
import {
  getAllGroups,
  getAtariPoints,
  getHoshiPoints,
  getImmortalEyePoints,
  getImmortalPoints,
  getLiberties,
} from '../logic/goEngine';

interface BoardProps {
  board: Intersection[][];
  previewPoint?: Point | null;
  sekiPoints?: Set<string>;
  reviewedPoints?: Set<string>;
  virtualStone?: { x: number; y: number; color: Player } | null;
  isScoringMode?: boolean;
  ruleset?: 'japanese'|'chinese';
  lastMove: Point | null;
  onIntersectionPress: (p: Point) => void;
  turn: Player;
  boardPx: number;
  interactive?: boolean;
  /** Board theme, matching the web BoardTheme options. */
  theme?: 'espresso' | 'classic' | 'midnight' | 'washi' | 'maple' | 'riverstone';
  /** Sensei/lesson overlays */
  targets?: Point[];
  marks?: { x: number; y: number; c?: 'black' | 'white' }[];
  lines?: { axis: 'row' | 'col'; index: number }[];
  hideAtari?: boolean;
  /** Practice aid: glowing liberty dots (amber=black, sky=white, emerald=shared). */
  showLiberties?: boolean;
  /** Practice aid: purple life-status rings (web Board.tsx). */
  showLifeStatus?: boolean;
  /** Tutorial: gold/sky wash over territory points. */
  territoryWash?: { black: Point[]; white: Point[] } | null;
  /** Tutorial step 7: numbered counting badges, revealed progressively. */
  countBadges?: { x: number; y: number; c: 'b' | 'w' }[] | null;
  countShown?: number;
  /** Scoring mode: stones marked dead render dimmed with a red X. */
  deadStones?: Set<string> | null;
  /** Stones currently fading out after capture. */
  fading?: { x: number; y: number; color: Player; key: string }[];
}

/* ------------------------- small animated pieces ------------------------- */

const PulseView: React.FC<{children?: React.ReactNode;style?: any}> = ({children,style}) => {
  const opacity=useSharedValue(1);
  useEffect(()=>{opacity.value=withRepeat(withTiming(.5,{duration:1000,easing:Easing.bezier(.4,0,.6,1)}),-1,true);},[]);
  const animated=useAnimatedStyle(()=>({opacity:opacity.value}));
  return <Animated.View pointerEvents="none" style={[style,animated]}>{children}</Animated.View>;
};

/** Tailwind animate-pulse: two seconds, half opacity at midpoint. */
const AtariDot: React.FC<{ d: number }> = ({ d }) => {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(withTiming(.5, { duration: 1000, easing: Easing.bezier(.4,0,.6,1) }), -1, true);
  }, [o]);
  const s = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      style={[
        {
          width: d,
          height: d,
          borderRadius: d / 2,
          backgroundColor: 'rgba(220,38,38,0.80)',
          shadowColor: '#dc2626',
          shadowOpacity: 0.6,
          shadowRadius: 8,
        },
        s,
      ]}
    />
  );
};

/** Amber tap-target ping ring — web: animate-ping on the outer halo. */
const TargetPing: React.FC = () => {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }), -1, false);
  }, [p]);
  const s = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + p.value * 0.9 }],
    opacity: 0.4 * (1 - p.value),
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: -17,
          top: -17,
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: '#fcd34d',
        },
        s,
      ]}
    />
  );
};

/** Stone wrapper that pops (scale 0.6 → 1 with spring overshoot) whenever popKey changes. */
/* --------------------------------- board --------------------------------- */

/**
 * Go board matching the web Board.tsx:
 * per-size padding (9:8% / 13:6% / 19:4%), 0.3%-width grid lines at 50%
 * opacity, hoshi dots (1.2% diameter, 70% opacity), stone diameter 94% of
 * step, radial-gradient stones, last-move marker, atari pulse, liberty dots,
 * life-status rings.
 */
const Board: React.FC<BoardProps> = ({
  board,
  previewPoint = null,
  sekiPoints = new Set(),
  reviewedPoints = new Set(),
  virtualStone = null,
  isScoringMode = false,
  ruleset = 'chinese',
  lastMove,
  onIntersectionPress,
  turn,
  boardPx,
  interactive = true,
  targets = [],
  marks = [],
  lines = [],
  hideAtari = false,
  showLiberties = false,
  showLifeStatus = false,
  territoryWash = null,
  countBadges = null,
  countShown = 0,
  deadStones = null,
  fading = [],
  theme = 'classic',
}) => {
  const { mode: themeMode } = useTheme();
  const size = board.length;

  const themeColors = {
    espresso: { bg: ['#3d2b1f', '#2a1b12', '#1a110b'] as const, line: '#000000' },
    classic: { bg: ['#e3c19a', '#d2b48c', '#b89a6f'] as const, line: '#5d4037' },
    midnight: { bg: ['#2a2a2a', '#1a1a1a', '#0d0d0d'] as const, line: '#ffffff' },
    washi: { bg: ['#f2ead8', '#e9dec7', '#dfd0b3'] as const, line: '#5b4d3d' },
    maple: { bg: ['#ead8bb', '#d8bf99', '#c6a77a'] as const, line: '#4d3f2f' },
    riverstone: { bg: ['#dde1e7', '#cfd5dd', '#bcc4cf'] as const, line: '#4a5565' },
  }[theme];

  // Web: margins shrink as the board grows (8% / 6% / 4%).
  const padFrac = size === 9 ? 0.08 : size === 13 ? 0.06 : 0.04;
  const pad = boardPx * padFrac;
  const usable = boardPx - pad * 2;
  const step = usable / (size - 1);
  const pointXY = (i: number) => pad + i * step;
  // Web: strokeWidth 0.3 in a 100-unit viewBox = 0.3% of board width.
  const lineW = boardPx * 0.003;
  // Web: hoshi r=0.6 in 100-unit viewBox → 1.2% diameter.
  const hoshiD = boardPx * 0.012;

  const hoshi = useMemo(()=>displayHoshiPoints(size),[size]);
  const info=useMemo(()=>boardPresentation(board,isScoringMode,sekiPoints,virtualStone),[board,isScoringMode,sekiPoints,virtualStone]);
  const atariPoints=hideAtari?new Set<string>():info.atari;
  const immortalPoints=info.immortal,immortalEyes=info.eyes;
  const liberties={bLibs:info.bLibs,wLibs:info.wLibs};

  const renderGrid = () => {
    const els = [];
    for (let i = 0; i < size; i++) {
      const pos = pointXY(i);
      const span = step * (size - 1);
      els.push(
        <View key={`v${i}`} style={[styles.gridLine, { backgroundColor: themeColors.line, left: pos - lineW / 2, top: pad, width: lineW, height: span }]} />,
      );
      els.push(
        <View key={`h${i}`} style={[styles.gridLine, { backgroundColor: themeColors.line, top: pos - lineW / 2, left: pad, height: lineW, width: span }]} />,
      );
    }
    return els;
  };

  const renderPoints = () => {
    const els = [];
    const stoneD = step * 0.94;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cx = pointXY(x);
        const cy = pointXY(y);
        const key = `${x},${y}`;
        const stone = board[y][x];
        const isLast = lastMove?.x === x && lastMove?.y === y;

        // Invisible generous touch target over every intersection
        els.push(
          <Pressable
            key={`t${key}`}
            accessibilityRole="button"
            accessibilityLabel={`Intersection ${x + 1},${y + 1}, ${stone || 'empty'}`}
            accessibilityState={{ disabled: !interactive }}
            testID={`intersection-${x}-${y}`}
            disabled={!interactive}
            onPress={() => interactive && onIntersectionPress({ x, y })}
            style={{
              position: 'absolute',
              left: cx - step / 2,
              top: cy - step / 2,
              width: step,
              height: step,
              zIndex: 30,
            }}
          />,
        );

        if (stone) {
          const isDead = !!deadStones?.has(key);
          const isImmortal = showLifeStatus && immortalPoints.has(key);
          const isSeki = isScoringMode && info.sekiStones.has(key);
          els.push(
            <View
              pointerEvents="none"
              key={key}
              style={{
                position: 'absolute',
                left: cx - stoneD / 2,
                top: cy - stoneD / 2,
                zIndex: 20,
                opacity: isDead ? 0.4 : 1,
              }}
            >
              {(isImmortal || isSeki) && (
                <View
                  style={{
                    position: 'absolute',
                    left: -stoneD * 0.1,
                    top: -stoneD * 0.1,
                    width: stoneD * 1.2,
                    height: stoneD * 1.2,
                    borderRadius: stoneD * 0.6,
                    borderWidth: 2,
                    borderColor: isSeki ? 'rgba(52,211,153,.50)' : isScoringMode?'rgba(192,132,252,.20)':'rgba(192,132,252,.40)',
                    shadowColor: '#c084fc',
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                  }}
                />
              )}
              <Stone color={stone} size={stoneD} />
              {isDead && (
                <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                  <Svg width={stoneD*.6} height={stoneD*.6} viewBox="0 0 24 24" stroke="rgba(239,68,68,.80)" strokeWidth={3} strokeLinecap="round"><Line x1={18} y1={6} x2={6} y2={18}/><Line x1={6} y1={6} x2={18} y2={18}/></Svg>
                </View>
              )}
              {!isDead && isLast && !isScoringMode && (
                <View
                  style={[
                    styles.lastMove,
                    {
                      left: stoneD / 2 - stoneD * 0.12,
                      top: stoneD / 2 - stoneD * 0.12,
                      width: stoneD * 0.24,
                      height: stoneD * 0.24,
                      borderRadius: stoneD * 0.12,
                      borderWidth: 2,
                      borderColor: stone === 'black' ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.20)',
                      backgroundColor: stone === 'black' ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.40)',
                    },
                  ]}
                />
              )}
            </View>,
          );
        } else if (!previewPoint || previewPoint.x!==x || previewPoint.y!==y) {
          if(virtualStone?.x===x && virtualStone?.y===y)continue;
          const shared=liberties.bLibs.has(key)&&liberties.wLibs.has(key);
          const sekiPoint=isScoringMode&&sekiPoints.has(key)&&ruleset==='japanese';
          const center=(d:number,style:any)=><View pointerEvents="none" key={`aid-${key}-${d}`} style={{position:'absolute',left:cx-d/2,top:cy-d/2,width:d,height:d,borderRadius:d/2,zIndex:10,...style}}/>;
          if(showLifeStatus&&immortalEyes.has(key)){
            els.push(center(16,{borderWidth:2,borderColor:'rgba(192,132,252,.60)',backgroundColor:'rgba(168,85,247,.10)',shadowColor:'#c084fc',shadowOpacity:.5,shadowRadius:8}));
          }else{
            if(!hideAtari&&atariPoints.has(key)){
              els.push(<View pointerEvents="none" key={`atari-${key}`} style={{position:'absolute',left:cx-6.4,top:cy-6.4,zIndex:10}}><AtariDot d={12.8}/></View>);
              for(const dir of atariConnections(info.atariBoard,{x,y})){
                els.push(<PulseView key={`connector-${key}-${dir.x}-${dir.y}`} style={{position:'absolute',left:dir.x<0?cx-step/2:dir.x>0?cx:cx-1,top:dir.y<0?cy-step/2:dir.y>0?cy:cy-1,width:dir.x?step/2:2,height:dir.y?step/2:2,backgroundColor:'rgba(220,38,38,.60)',zIndex:9}}/>);
              }
            }
            if(sekiPoint)els.push(<View pointerEvents="none" key={`seki-${key}`} style={{position:'absolute',left:cx-9.6,top:cy-9.6,width:19.2,height:19.2,borderRadius:9.6,borderWidth:1.5,borderColor:'rgba(255,255,255,.20)',backgroundColor:'rgba(255,255,255,.05)',alignItems:'center',justifyContent:'center',zIndex:10}}><View style={{width:4,height:4,borderRadius:2,backgroundColor:'rgba(255,255,255,.20)'}}/></View>);
            if(showLiberties&&!sekiPoint&&(shared||!isScoringMode&&(liberties.bLibs.has(key)||liberties.wLibs.has(key)))){
              const color=shared?'#34d399':liberties.bLibs.has(key)?'#fde68a':'#38bdf8';
              els.push(center(6,{backgroundColor:color,opacity:shared&&reviewedPoints.has(key)?.2:1,shadowColor:color,shadowOpacity:.8,shadowRadius:8}));
            }
          }
        }
      }
    }
    // Captured stones fading out (removed from board state, animated away)
    for (const f of fading) {
      const stoneD = step * 0.94;
      els.push(
        <Animated.View
          key={f.key}
          exiting={FadeOut.duration(300)}
          style={{
            position: 'absolute',
            left: pointXY(f.x) - stoneD / 2,
            top: pointXY(f.y) - stoneD / 2,
            zIndex: 20,
          }}
        >
          <Stone color={f.color} size={stoneD} />
        </Animated.View>,
      );
    }
    return els;
  };

  const renderOverlays = () => {
    const els: React.ReactNode[] = [];
    if (previewPoint && !isScoringMode) {
      const d = step * .94;
      els.push(<View pointerEvents="none" key="preview" style={{ position: 'absolute', left: pointXY(previewPoint.x)-d/2, top: pointXY(previewPoint.y)-d/2, width:d,height:d,opacity:.60,zIndex:28 }}><Stone color={turn} size={d}/><View style={{position:'absolute',left:d*.325,top:d*.325,width:d*.35,height:d*.35,borderRadius:d*.175,borderWidth:2,borderColor:'rgba(255,255,255,.20)'}}/></View>);
    }
    if (virtualStone) {
      const d = step * .85;
      els.push(<View pointerEvents="none" key="virtual" style={{ position:'absolute',left:pointXY(virtualStone.x)-d/2,top:pointXY(virtualStone.y)-d/2,opacity:.8,zIndex:28 }}><PulseView style={{position:'absolute',width:d,height:d,borderRadius:d/2,borderWidth:2,borderColor:'rgba(253,230,138,.20)'}}/><Stone color={virtualStone.color} size={d}/></View>);
    }
    // Amber pulsing tap targets (web: animate-ping halo + solid core)
    targets.forEach((t, i) => {
      const cx = pointXY(t.x);
      const cy = pointXY(t.y);
      els.push(
        <View pointerEvents="none" key={`tg${i}`} style={{ position: 'absolute', left: cx, top: cy, width: 0, height: 0, zIndex: 25 }}>
          <TargetPing />
          <View
            style={{
              position: 'absolute',
              left: -7,
              top: -7,
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: '#fcd34d',
              shadowColor: '#fcd34d',
              shadowOpacity: 0.9,
              shadowRadius: 8,
            }}
          />
        </View>,
      );
    });
    // Ghost markers (translucent dots)
    marks.forEach((m, i) => {
      const cx = pointXY(m.x);
      const cy = pointXY(m.y);
      const white = m.c === 'white';
      els.push(
        <View key={`mk${i}`} style={{ position: 'absolute', left: cx, top: cy, width: 0, height: 0, zIndex: 15 }}>
          <View
            style={{
              position: 'absolute',
              left: -9,
              top: -9,
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: white ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
              borderWidth: 1,
              borderColor: white ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.40)',
            }}
          />
        </View>,
      );
    });
    // Highlighted board lines with index labels
    lines.forEach((l, i) => {
      const pos = pointXY(l.index);
      if (l.axis === 'row') {
        els.push(
          <View key={`ln${i}`} style={{ position: 'absolute', left: pad, right: pad, top: pos, height: 0, zIndex: 5 }}>
            <View style={{ position: 'absolute', left: 0, right: 0, top: -2, height: 4, backgroundColor: '#fcd34d' }} />
            <View style={{ position: 'absolute', left: -22, top: -10, backgroundColor: 'rgba(0,0,0,0.60)', borderRadius: 4, paddingHorizontal: 4 }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{l.index + 1}</Text>
            </View>
          </View>,
        );
      } else {
        els.push(
          <View key={`ln${i}`} style={{ position: 'absolute', top: pad, bottom: pad, left: pos, width: 0, zIndex: 5 }}>
            <View style={{ position: 'absolute', top: 0, bottom: 0, left: -2, width: 4, backgroundColor: '#fcd34d' }} />
            <View style={{ position: 'absolute', top: -26, left: -8, backgroundColor: 'rgba(0,0,0,0.60)', borderRadius: 4, paddingHorizontal: 4 }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{l.index + 1}</Text>
            </View>
          </View>,
        );
      }
    });
    // Tutorial territory wash (gold for black's, sky for white's)
    if (territoryWash) {
      const sq = step;
      territoryWash.black.forEach((p, i) => {
        els.push(
          <View
            key={`twb${i}`}
            style={{
              position: 'absolute',
              left: pointXY(p.x) - sq / 2,
              top: pointXY(p.y) - sq / 2,
              width: sq,
              height: sq,
              borderRadius: 3,
              backgroundColor: 'rgba(252,211,77,0.20)',
              zIndex: 8,
            }}
          />,
        );
      });
      territoryWash.white.forEach((p, i) => {
        els.push(
          <View
            key={`tww${i}`}
            style={{
              position: 'absolute',
              left: pointXY(p.x) - sq / 2,
              top: pointXY(p.y) - sq / 2,
              width: sq,
              height: sq,
              borderRadius: 3,
              backgroundColor: 'rgba(186,230,253,0.20)',
              zIndex: 8,
            }}
          />,
        );
      });
    }
    // Tutorial counting badges (numbered, revealed progressively)
    if (countBadges) {
      let bn = 0;
      let wn = 0;
      const totalShown = Math.min(countShown, countBadges.length);
      countBadges.slice(0, totalShown).forEach((p, i) => {
        const n = p.c === 'b' ? ++bn : ++wn;
        const isLatest = i === totalShown - 1;
        const d = 20;
        els.push(
          <View
            key={`cb${i}`}
            style={{
              position: 'absolute',
              left: pointXY(p.x) - d / 2,
              top: pointXY(p.y) - d / 2,
              width: d,
              height: d,
              borderRadius: d / 2,
              backgroundColor: p.c === 'b' ? '#fcd34d' : '#bae6fd',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 26,
              borderWidth: isLatest ? 2 : 0,
              transform:[{scale:isLatest?1.1:1}],
              borderColor: 'rgba(255,255,255,0.70)',
              shadowColor: '#000',
              shadowOpacity: 0.4,
              shadowRadius: 4,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#000' }}>{n}</Text>
          </View>,
        );
      });
    }
    return els;
  };

  return (
    <View testID="go-board" style={[styles.shell, { width: boardPx, height: boardPx, borderRadius: 2, borderColor: themeMode === 'light' ? 'rgba(120,113,108,.38)' : 'rgba(255,255,255,.06)', shadowOpacity: themeMode === 'light' ? .24 : .8 }]}>
      <LinearGradient
        colors={[themeColors.bg[0], themeColors.bg[1], themeColors.bg[2]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 2 }]}
      />
      {/* inner vignette — web: inset 0 0 120px rgba(0,0,0,0.7) */}
      <LinearGradient
        colors={[`rgba(0,0,0,${theme === 'midnight' || theme === 'espresso' ? .35 : .06})`, 'rgba(0,0,0,0)', `rgba(0,0,0,${theme === 'midnight' || theme === 'espresso' ? .35 : .06})`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 2 }]}
        pointerEvents="none"
      />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}><Image source={require('../assets/dark-wood.png')} resizeMode="repeat" style={[StyleSheet.absoluteFill, { opacity: themeMode==='light'?Math.min({espresso:.04,classic:.1,midnight:.02,washi:.06,maple:.07,riverstone:.04}[theme],.05):{espresso:.04,classic:.1,midnight:.02,washi:.06,maple:.07,riverstone:.04}[theme] }]} /></View>
      {renderGrid()}
      {hoshi.map((p) => (
        <View
          key={`h${p.x},${p.y}`}
          style={{
            position: 'absolute',
            width: hoshiD,
            height: hoshiD,
            borderRadius: hoshiD / 2,
            backgroundColor: themeColors.line,
            opacity: 0.7,
            left: pointXY(p.x) - hoshiD / 2,
            top: pointXY(p.y) - hoshiD / 2,
          }}
        />
      ))}
      {renderOverlays()}
      {renderPoints()}
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.8,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 25 },
    elevation: 12,
  },
  gridLine: {
    position: 'absolute',
    opacity: 0.5,
  },
  lastMove: {
    position: 'absolute',
  },
});

export default Board;
