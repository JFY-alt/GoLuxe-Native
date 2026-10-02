import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  calculateScores,
  checkCaptures,
  createEmptyBoard,
  getAtariPoints,
  getBoardString,
  getHoshiPoints,
  isSelfCapture,
} from './logic/goEngine';
import { getBestMove } from './logic/simpleAi';
import { GameState, Intersection, Player, Point } from './types';

const BOARD_N = 9;
const KOMI = 7.5;
const AI_DIFFICULTY = 'intermediate' as const;
const AI_DELAY_MS = 750;

const screenW = Dimensions.get('window').width;
const BOARD_PX = Math.min(screenW - 24, 420);
const CELL = BOARD_PX / BOARD_N;
const pointXY = (i: number) => CELL / 2 + i * CELL;

type Screen = 'home' | 'game';
type Mode = 'ai' | '2p';
type Phase = 'play' | 'ended';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [mode, setMode] = useState<Mode>('2p');

  const [board, setBoard] = useState<Intersection[][]>(() => createEmptyBoard(BOARD_N));
  const [turn, setTurn] = useState<Player>('black');
  const [captures, setCaptures] = useState({ black: 0, white: 0 });
  const [history, setHistory] = useState<string[]>(() => [getBoardString(createEmptyBoard(BOARD_N))]);
  const [lastMove, setLastMove] = useState<Point | null>(null);
  const [passes, setPasses] = useState(0);
  const [phase, setPhase] = useState<Phase>('play');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [finalScore, setFinalScore] = useState<{ black: number; white: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 2200);
  };

  const startGame = (m: Mode) => {
    const b = createEmptyBoard(BOARD_N);
    setMode(m);
    setBoard(b);
    setTurn('black');
    setCaptures({ black: 0, white: 0 });
    setHistory([getBoardString(b)]);
    setLastMove(null);
    setPasses(0);
    setPhase('play');
    setWinner(null);
    setFinalScore(null);
    setNotice(null);
    setAiThinking(false);
    setScreen('game');
  };

  const newGame = () => startGame(mode);
  const goHome = () => {
    setAiThinking(false);
    setScreen('home');
  };

  const validateMove = (
    p: Point,
    player: Player,
    curBoard: Intersection[][],
    curHistory: string[],
  ): { valid: boolean; reason?: string; newBoard?: Intersection[][]; captureCount?: number } => {
    if (curBoard[p.y][p.x]) return { valid: false, reason: 'Occupied' };
    if (isSelfCapture(curBoard, p, player)) return { valid: false, reason: 'Suicide move not allowed' };
    const temp = curBoard.map((row) => [...row]);
    temp[p.y][p.x] = player;
    const { newBoard, captureCount } = checkCaptures(temp, p, player);
    const boardStr = getBoardString(newBoard);
    // Simple ko: may not recreate the position from two moves ago.
    if (curHistory.length >= 2 && boardStr === curHistory[curHistory.length - 2]) {
      return { valid: false, reason: 'Ko — play elsewhere first' };
    }
    return { valid: true, newBoard, captureCount };
  };

  const applyMove = (p: Point, player: Player): boolean => {
    const { valid, reason, newBoard, captureCount } = validateMove(p, player, board, history);
    if (!valid || !newBoard || captureCount === undefined) {
      if (player === 'black' || mode === '2p') showNotice(reason || 'Illegal move');
      return false;
    }
    setBoard(newBoard);
    setCaptures((c) => ({ ...c, [player]: c[player] + captureCount }));
    setHistory((h) => [...h, getBoardString(newBoard)]);
    setLastMove(p);
    setTurn(player === 'black' ? 'white' : 'black');
    setPasses(0);
    return true;
  };

  const applyPass = (player: Player) => {
    const next = passes + 1;
    setPasses(next);
    setLastMove(null);
    if (next >= 2) {
      const s = calculateScores(board, captures, KOMI, 0, new Set(), 'japanese', new Set(), true, 0, 0, true);
      setFinalScore({ black: s.black.total, white: s.white.total });
      setWinner(s.black.total > s.white.total ? 'black' : s.white.total > s.black.total ? 'white' : 'draw');
      setPhase('ended');
    } else {
      setTurn(player === 'black' ? 'white' : 'black');
      showNotice(`${player === 'black' ? 'Black' : 'White'} passed`);
    }
  };

  const onBoardPress = (e: any) => {
    if (phase !== 'play') return;
    if (mode === 'ai' && (turn !== 'black' || aiThinking)) return;
    const { locationX, locationY } = e.nativeEvent;
    const i = Math.round((locationX - CELL / 2) / CELL);
    const j = Math.round((locationY - CELL / 2) / CELL);
    if (i < 0 || i >= BOARD_N || j < 0 || j >= BOARD_N) return;
    applyMove({ x: i, y: j }, turn);
  };

  const onPassPress = () => {
    if (phase !== 'play') return;
    if (mode === 'ai' && (turn !== 'black' || aiThinking)) return;
    applyPass(turn);
  };

  // AI opponent: user is Black, AI is White.
  useEffect(() => {
    if (screen !== 'game' || mode !== 'ai' || phase !== 'play' || turn !== 'white') return;
    setAiThinking(true);
    const t = setTimeout(() => {
      const gs: GameState = {
        board,
        turn: 'white',
        captures,
        lastMove,
        history,
        phase: 'play',
        winner: null,
        consecutivePasses: passes,
        handicapPlacementsLeft: 0,
        deadStones: new Set<string>(),
        sekiPoints: new Set<string>(),
        reviewedPoints: new Set<string>(),
        ruleset: 'japanese',
      };
      let move: Point | 'pass' | 'resign';
      try {
        move = getBestMove(gs, AI_DIFFICULTY);
      } catch {
        move = 'pass';
      }
      if (move === 'resign') {
        setWinner('black');
        setPhase('ended');
        showNotice('White resigns — Black wins');
      } else if (move === 'pass') {
        applyPass('white');
      } else {
        const ok = applyMove(move, 'white');
        if (!ok) applyPass('white');
      }
      setAiThinking(false);
    }, AI_DELAY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, mode, phase, turn, board]);

  const atari = useMemo(() => (phase === 'play' ? getAtariPoints(board) : new Set<string>()), [board, phase]);
  const hoshi = useMemo(() => getHoshiPoints(BOARD_N), []);

  const renderGrid = () => {
    const lines = [];
    for (let i = 0; i < BOARD_N; i++) {
      const pos = pointXY(i);
      const span = CELL * (BOARD_N - 1);
      lines.push(
        <View key={`v${i}`} style={[styles.gridLine, { left: pos - 0.5, top: CELL / 2, width: 1, height: span }]} />,
      );
      lines.push(
        <View key={`h${i}`} style={[styles.gridLine, { top: pos - 0.5, left: CELL / 2, height: 1, width: span }]} />,
      );
    }
    return lines;
  };

  const renderStones = () => {
    const els = [];
    for (let y = 0; y < BOARD_N; y++) {
      for (let x = 0; x < BOARD_N; x++) {
        const stone = board[y][x];
        if (!stone) continue;
        const cx = pointXY(x);
        const cy = pointXY(y);
        const d = CELL * 0.94;
        els.push(
          <View
            key={`${x},${y}`}
            style={[
              styles.stone,
              {
                left: cx - d / 2,
                top: cy - d / 2,
                width: d,
                height: d,
                borderRadius: d / 2,
                backgroundColor: stone === 'black' ? '#1a1a1a' : '#f5f0e6',
              },
            ]}
          />,
        );
        if (atari.has(`${x},${y}`)) {
          els.push(
            <View
              key={`a${x},${y}`}
              style={[
                styles.atariRing,
                { left: cx - d / 2 - 3, top: cy - d / 2 - 3, width: d + 6, height: d + 6, borderRadius: (d + 6) / 2 },
              ]}
            />,
          );
        }
      }
    }
    if (lastMove) {
      const cx = pointXY(lastMove.x);
      const cy = pointXY(lastMove.y);
      els.push(
        <View key="last" style={[styles.lastMove, { left: cx - 4, top: cy - 4 }]} />,
      );
    }
    return els;
  };

  if (screen === 'home') {
    return (
      <SafeAreaView style={styles.homeRoot}>
        <StatusBar barStyle="light-content" />
        <View style={styles.homeCenter}>
          <Text style={styles.homeTitle}>GoLuxe</Text>
          <Text style={styles.homeSubtitle}>STRATEGIC PURITY</Text>
          <View style={styles.homeButtons}>
            <Pressable onPress={() => startGame('ai')} style={styles.menuButton}>
              <Text style={styles.menuButtonText}>PLAY VS AI</Text>
            </Pressable>
            <Pressable onPress={() => startGame('2p')} style={styles.menuButton}>
              <Text style={styles.menuButtonText}>TWO PLAYERS</Text>
            </Pressable>
          </View>
          <Text style={styles.homeHint}>You play Black against the AI</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topBar}>
        <Pressable onPress={goHome} style={styles.backButton}>
          <Text style={styles.backText}>‹ Home</Text>
        </Pressable>
        <Text style={styles.title}>GoLuxe</Text>
        <View style={styles.backButton} />
      </View>
      <Text style={styles.modeLabel}>{mode === 'ai' ? 'VS AI (INTERMEDIATE)' : 'TWO PLAYERS'}</Text>

      <View style={styles.scoreRow}>
        <View style={[styles.scoreCard, turn === 'black' && phase === 'play' && styles.activeCard]}>
          <Text style={styles.scoreLabel}>BLACK{mode === 'ai' ? ' (YOU)' : ''}</Text>
          <Text style={styles.scoreValue}>{captures.black} cap</Text>
        </View>
        <View style={styles.turnBadge}>
          <Text style={styles.turnText}>
            {phase === 'ended'
              ? 'Game over'
              : aiThinking
                ? 'AI thinking…'
                : turn === 'black'
                  ? '● to play'
                  : '○ to play'}
          </Text>
        </View>
        <View style={[styles.scoreCard, turn === 'white' && phase === 'play' && styles.activeCard]}>
          <Text style={styles.scoreLabel}>WHITE{mode === 'ai' ? ' (AI)' : ''}</Text>
          <Text style={styles.scoreValue}>{captures.white} cap</Text>
        </View>
      </View>

      <View style={styles.boardWrap}>
        <Pressable onPress={onBoardPress} style={[styles.board, { width: BOARD_PX, height: BOARD_PX }]}>
          {renderGrid()}
          {hoshi.map((p) => (
            <View
              key={`h${p.x},${p.y}`}
              style={[styles.hoshi, { left: pointXY(p.x) - 3, top: pointXY(p.y) - 3 }]}
            />
          ))}
          {renderStones()}
        </Pressable>
      </View>

      <View style={styles.noticeBox}>
        <Text style={styles.noticeText}>
          {phase === 'ended' && winner
            ? winner === 'draw'
              ? 'Draw game'
              : `${winner === 'black' ? 'Black' : 'White'} wins ${finalScore ? `(${finalScore.black.toFixed(1)} – ${finalScore.white.toFixed(1)})` : ''}`
            : notice || (passes === 1 ? 'One pass — one more ends the game' : ' ')}
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          onPress={onPassPress}
          disabled={phase !== 'play' || aiThinking}
          style={[styles.button, (phase !== 'play' || aiThinking) && styles.disabled]}
        >
          <Text style={styles.buttonText}>Pass</Text>
        </Pressable>
        <Pressable onPress={newGame} style={styles.button}>
          <Text style={styles.buttonText}>New Game</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const AMBER = '#fcd34d';
const AMBER_DIM = '#fde68a';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0d0d', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
    marginTop: 4,
  },
  backButton: { minWidth: 64, paddingVertical: 8 },
  backText: { color: '#ffffff66', fontSize: 15 },
  title: { color: '#faf3e3', fontSize: 26, fontWeight: '700', letterSpacing: 2 },
  modeLabel: { color: '#ffffff33', fontSize: 10, letterSpacing: 3, marginTop: 2 },

  homeRoot: { flex: 1, backgroundColor: '#0d0d0d' },
  homeCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  homeTitle: { color: '#faf3e3', fontSize: 64, fontWeight: '700', letterSpacing: 4 },
  homeSubtitle: { color: '#fcd34d66', fontSize: 12, letterSpacing: 8, marginTop: 8, fontWeight: '300' },
  homeButtons: { marginTop: 48, width: '100%', gap: 14 },
  menuButton: {
    borderWidth: 1,
    borderColor: '#ffffff1a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#ffffff08',
  },
  menuButtonText: { color: AMBER_DIM, fontSize: 14, letterSpacing: 3, fontWeight: '600' },
  homeHint: { color: '#ffffff33', fontSize: 12, marginTop: 24 },

  scoreRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 12 },
  scoreCard: {
    backgroundColor: '#151515',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
    minWidth: 96,
  },
  activeCard: { borderColor: AMBER },
  scoreLabel: { color: '#888', fontSize: 10, letterSpacing: 2 },
  scoreValue: { color: '#faf3e3', fontSize: 16, marginTop: 2 },
  turnBadge: { paddingHorizontal: 6, minWidth: 90, alignItems: 'center' },
  turnText: { color: AMBER, fontSize: 14 },
  boardWrap: { marginTop: 18, padding: 6, backgroundColor: '#151515', borderRadius: 14 },
  board: { backgroundColor: '#c9a35f', borderRadius: 8, position: 'relative', overflow: 'hidden' },
  gridLine: { position: 'absolute', backgroundColor: '#5b4426' },
  hoshi: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: '#5b4426' },
  stone: { position: 'absolute', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  atariRing: { position: 'absolute', borderWidth: 2, borderColor: '#e11d48' },
  lastMove: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: AMBER },
  noticeBox: { height: 30, justifyContent: 'center', marginTop: 10 },
  noticeText: { color: AMBER, fontSize: 14 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  button: {
    backgroundColor: '#fcd34d22',
    borderWidth: 1,
    borderColor: '#fcd34d55',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  disabled: { opacity: 0.35 },
  buttonText: { color: AMBER_DIM, fontSize: 14, fontWeight: '700', letterSpacing: 1 },
});
