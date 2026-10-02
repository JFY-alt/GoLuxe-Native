import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Intersection, Point, Player } from '../types';
import Stone from './Stone';
import { getAllGroups, getAtariPoints, getHoshiPoints, getLiberties } from '../logic/goEngine';

interface BoardProps {
  board: Intersection[][];
  lastMove: Point | null;
  onIntersectionPress: (p: Point) => void;
  turn: Player;
  boardPx: number;
  interactive?: boolean;
  /** Sensei/lesson overlays */
  targets?: Point[];
  marks?: { x: number; y: number; c?: 'black' | 'white' }[];
  lines?: { axis: 'row' | 'col'; index: number }[];
  hideAtari?: boolean;
  /** Practice aid: glowing liberty dots (amber=black, sky=white, emerald=shared). */
  showLiberties?: boolean;
  /** Tutorial: gold/sky wash over territory points. */
  territoryWash?: { black: Point[]; white: Point[] } | null;
  /** Tutorial step 7: numbered counting badges, revealed progressively. */
  countBadges?: { x: number; y: number; c: 'b' | 'w' }[] | null;
  countShown?: number;
}

/**
 * Espresso-theme board matching the web Board.tsx default theme:
 * dark wood gradient, black grid lines, hoshi points, red atari dots on
 * empty atari points, amber last-move marker.
 */
const Board: React.FC<BoardProps> = ({
  board,
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
  territoryWash = null,
  countBadges = null,
  countShown = 0,
}) => {
  const size = board.length;

  const pad = boardPx * 0.08; // web: 8% padding for 9x9
  const usable = boardPx - pad * 2;
  const step = usable / (size - 1);
  const pointXY = (i: number) => pad + i * step;

  const hoshi = useMemo(() => getHoshiPoints(size), [size]);
  const atariPoints = useMemo(() => (hideAtari ? new Set<string>() : getAtariPoints(board)), [board, hideAtari]);

  const liberties = useMemo(() => {
    if (!showLiberties) return null;
    const bLibs = new Set<string>();
    const wLibs = new Set<string>();
    for (const g of getAllGroups(board)) {
      if (g.group.length === 0 || !board[g.group[0].y][g.group[0].x]) continue;
      const libs = getLiberties(board, g.group);
      libs.forEach((l) => (g.color === 'black' ? bLibs : wLibs).add(l));
    }
    return { bLibs, wLibs };
  }, [board, showLiberties]);

  const renderGrid = () => {
    const els = [];
    for (let i = 0; i < size; i++) {
      const pos = pointXY(i);
      const span = step * (size - 1);
      els.push(
        <View key={`v${i}`} style={[styles.gridLine, { left: pos - 0.5, top: pad, width: 1, height: span }]} />,
      );
      els.push(
        <View key={`h${i}`} style={[styles.gridLine, { top: pos - 0.5, left: pad, height: 1, width: span }]} />,
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

        // Invisible generous touch target over every intersection
        els.push(
          <Pressable
            key={`t${key}`}
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
          els.push(
            <View
              key={key}
              style={{ position: 'absolute', left: cx - stoneD / 2, top: cy - stoneD / 2, zIndex: 20 }}
            >
              <Stone color={stone} size={stoneD} />
              {lastMove?.x === x && lastMove?.y === y && (
                <View
                  style={[
                    styles.lastMove,
                    {
                      left: stoneD / 2 - stoneD * 0.12,
                      top: stoneD / 2 - stoneD * 0.12,
                      width: stoneD * 0.24,
                      height: stoneD * 0.24,
                      borderRadius: stoneD * 0.12,
                      backgroundColor: stone === 'black' ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.40)',
                    },
                  ]}
                />
              )}
            </View>,
          );
        } else if (!hideAtari && atariPoints.has(key)) {
          // Web renders a pulsing red dot on empty atari points
          const d = 10;
          els.push(
            <View
              key={key}
              style={{
                position: 'absolute',
                left: cx - d / 2,
                top: cy - d / 2,
                width: d,
                height: d,
                borderRadius: d / 2,
                backgroundColor: 'rgba(220,38,38,0.85)',
                zIndex: 10,
                shadowColor: '#dc2626',
                shadowOpacity: 0.6,
                shadowRadius: 6,
              }}
            />,
          );
        } else if (showLiberties && liberties && !stone) {
          // Practice aid: liberty dots (web Board.tsx)
          const keyStr = `${x},${y}`;
          const isB = liberties.bLibs.has(keyStr);
          const isW = liberties.wLibs.has(keyStr);
          if (isB || isW) {
            const d = 6;
            const shared = isB && isW;
            els.push(
              <View
                key={`lib${key}`}
                style={{
                  position: 'absolute',
                  left: cx - d / 2,
                  top: cy - d / 2,
                  width: d,
                  height: d,
                  borderRadius: d / 2,
                  backgroundColor: shared ? '#34d399' : isB ? '#fde68a' : '#38bdf8',
                  zIndex: 10,
                  shadowColor: shared ? '#34d399' : isB ? '#fbbf24' : '#38bdf8',
                  shadowOpacity: 0.8,
                  shadowRadius: 6,
                }}
              />,
            );
          }
        }
      }
    }
    return els;
  };

  const renderOverlays = () => {
    const els: React.ReactNode[] = [];
    // Amber pulsing tap targets
    targets.forEach((t, i) => {
      const cx = pointXY(t.x);
      const cy = pointXY(t.y);
      els.push(
        <View key={`tg${i}`} style={{ position: 'absolute', left: cx, top: cy, width: 0, height: 0, zIndex: 25 }}>
          <View
            style={{
              position: 'absolute',
              left: -17,
              top: -17,
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: 'rgba(252,211,77,0.40)',
            }}
          />
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
    <View style={[styles.shell, { width: boardPx, height: boardPx, borderRadius: 4 }]}>
      <LinearGradient
        colors={['#3d2b1f', '#2a1b12', '#1a110b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 4 }]}
      />
      {/* inner vignette */}
      <LinearGradient
        colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.35)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 4 }]}
        pointerEvents="none"
      />
      {renderGrid()}
      {hoshi.map((p) => (
        <View
          key={`h${p.x},${p.y}`}
          style={[styles.hoshi, { left: pointXY(p.x) - 2, top: pointXY(p.y) - 2 }]}
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
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#000000',
    opacity: 0.5,
  },
  hoshi: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#000000',
    opacity: 0.7,
  },
  lastMove: {
    position: 'absolute',
  },
});

export default Board;
