import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Board from '../components/Board';
import Stone from '../components/Stone';
import {
  calculateScores,
  checkCaptures,
  createEmptyBoard,
  getBoardString,
  isSelfCapture,
} from '../logic/goEngine';
import { getBestMove } from '../logic/simpleAi';
import { GameState, Intersection, Player, Point } from '../types';
import { AiConfig } from './AiSetupMenu';
import { C, SERIF } from '../theme';

const BOARD_N = 9;
const KOMI = 7.5;
const AI_DELAY_MS = 750;

const { width: SW, height: SH } = Dimensions.get('window');
const BOARD_PX = Math.min(SW * 0.9, SH * 0.52, 400);

interface Snapshot {
  board: Intersection[][];
  turn: Player;
  captures: { black: number; white: number };
  lastMove: Point | null;
  passes: number;
}

interface GameScreenProps {
  mode: 'ai' | '2p';
  aiConfig: AiConfig | null;
  onExit: () => void;
}

/**
 * Game screen matching the web GameSession mobile layout:
 * serif GoLuxe header + subtitle row, score strip (black | status | white),
 * espresso board, notice line, Undo/Pass/Resign/Refresh action row.
 */
const GameScreen: React.FC<GameScreenProps> = ({ mode, aiConfig, onExit }) => {
  const [board, setBoard] = useState<Intersection[][]>(() => createEmptyBoard(BOARD_N));
  const [turn, setTurn] = useState<Player>('black');
  const [captures, setCaptures] = useState({ black: 0, white: 0 });
  const [history, setHistory] = useState<string[]>(() => [getBoardString(createEmptyBoard(BOARD_N))]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [lastMove, setLastMove] = useState<Point | null>(null);
  const [passes, setPasses] = useState(0);
  const [phase, setPhase] = useState<'play' | 'ended'>('play');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [finalScore, setFinalScore] = useState<{ black: number; white: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [passNotice, setPassNotice] = useState<string | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [resignArmed, setResignArmed] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 2200);
  };

  const snapshot = (): Snapshot => ({ board, turn, captures, lastMove, passes });

  const validateMove = (
    p: Point,
    player: Player,
    curBoard: Intersection[][],
    curHistory: string[],
  ) => {
    if (curBoard[p.y][p.x]) return { valid: false as const, reason: 'Occupied' };
    if (isSelfCapture(curBoard, p, player)) return { valid: false as const, reason: 'Suicide move not allowed' };
    const temp = curBoard.map((row) => [...row]);
    temp[p.y][p.x] = player;
    const { newBoard, captureCount } = checkCaptures(temp, p, player);
    const boardStr = getBoardString(newBoard);
    if (curHistory.length >= 2 && boardStr === curHistory[curHistory.length - 2]) {
      return { valid: false as const, reason: 'Ko — play elsewhere first' };
    }
    return { valid: true as const, newBoard, captureCount };
  };

  const applyMove = (p: Point, player: Player, st?: Snapshot): boolean => {
    const s = st || snapshot();
    const { valid, reason, newBoard, captureCount } = validateMove(p, player, s.board, history);
    if (!valid || !newBoard || captureCount === undefined) {
      if (player === 'black' || mode === '2p') showNotice(reason || 'Illegal move');
      return false;
    }
    if (!st) setSnapshots((prev) => [...prev, s]);
    setBoard(newBoard);
    setCaptures({ ...s.captures, [player]: s.captures[player] + captureCount });
    setHistory((h) => [...h, getBoardString(newBoard)]);
    setLastMove(p);
    setTurn(player === 'black' ? 'white' : 'black');
    setPasses(0);
    setPassNotice(null);
    setResignArmed(false);
    return true;
  };

  const applyPass = (player: Player, st?: Snapshot) => {
    const s = st || snapshot();
    if (!st) setSnapshots((prev) => [...prev, s]);
    const next = s.passes + 1;
    setPasses(next);
    setLastMove(null);
    setResignArmed(false);
    if (next >= 2) {
      const sc = calculateScores(s.board, s.captures, KOMI, 0, new Set(), 'japanese', new Set(), true, 0, 0, true);
      setFinalScore({ black: sc.black.total, white: sc.white.total });
      setWinner(sc.black.total > sc.white.total ? 'black' : sc.white.total > sc.black.total ? 'white' : 'draw');
      setPhase('ended');
      setPassNotice(null);
    } else {
      setTurn(player === 'black' ? 'white' : 'black');
      const label = player === 'black' ? 'Black passed' : 'White passed';
      setPassNotice(label);
      showNotice(label);
    }
  };

  const onIntersectionPress = (p: Point) => {
    if (phase !== 'play') return;
    if (mode === 'ai' && aiConfig && (turn !== aiConfig.userColor || aiThinking)) return;
    applyMove(p, turn);
  };

  const onPassPress = () => {
    if (phase !== 'play') return;
    if (mode === 'ai' && aiConfig && (turn !== aiConfig.userColor || aiThinking)) return;
    applyPass(turn);
  };

  const onUndoPress = () => {
    if (snapshots.length === 0 || aiThinking) return;
    // In vs-AI mode, undo twice to get back to the user's last turn.
    let idx = snapshots.length - 1;
    let snap = snapshots[idx];
    if (mode === 'ai' && aiConfig && snap.turn !== aiConfig.userColor && idx > 0) {
      idx -= 1;
      snap = snapshots[idx];
    }
    setSnapshots((prev) => prev.slice(0, idx));
    setBoard(snap.board);
    setTurn(snap.turn);
    setCaptures(snap.captures);
    setLastMove(snap.lastMove);
    setPasses(snap.passes);
    setHistory((h) => h.slice(0, h.length - (snapshots.length - idx)));
    setResignArmed(false);
    setPassNotice(null);
  };

  const onResignPress = () => {
    if (phase !== 'play') return;
    if (!resignArmed) {
      setResignArmed(true);
      showNotice('Tap Resign again to confirm');
      return;
    }
    const loser = mode === 'ai' && aiConfig ? aiConfig.userColor : turn;
    setWinner(loser === 'black' ? 'white' : 'black');
    setPhase('ended');
    setResignArmed(false);
  };

  const onRefreshPress = () => {
    const b = createEmptyBoard(BOARD_N);
    setBoard(b);
    setTurn('black');
    setCaptures({ black: 0, white: 0 });
    setHistory([getBoardString(b)]);
    setSnapshots([]);
    setLastMove(null);
    setPasses(0);
    setPhase('play');
    setWinner(null);
    setFinalScore(null);
    setNotice(null);
    setPassNotice(null);
    setAiThinking(false);
    setResignArmed(false);
  };

  // AI opponent
  useEffect(() => {
    if (mode !== 'ai' || !aiConfig || phase !== 'play') return;
    const aiColor: Player = aiConfig.userColor === 'black' ? 'white' : 'black';
    if (turn !== aiColor) return;
    setAiThinking(true);
    const t = setTimeout(() => {
      const gs: GameState = {
        board,
        turn: aiColor,
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
        move = getBestMove(gs, aiConfig.difficulty);
      } catch {
        move = 'pass';
      }
      const s = snapshot();
      if (move === 'resign') {
        setWinner(aiConfig.userColor);
        setPhase('ended');
        showNotice(`${aiColor === 'black' ? 'Black' : 'White'} resigns`);
      } else if (move === 'pass') {
        applyPass(aiColor, s);
      } else {
        if (!applyMove(move, aiColor, s)) applyPass(aiColor, s);
      }
      setAiThinking(false);
    }, AI_DELAY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, aiConfig, phase, turn, board]);

  const scores = useMemo(() => {
    const sc = calculateScores(board, captures, KOMI, 0, new Set(), 'japanese', new Set(), false, 0, 0, true);
    return { black: sc.black.total, white: sc.white.total };
  }, [board, captures]);

  const statusText = useMemo(() => {
    if (phase === 'ended') return 'End';
    if (mode === 'ai' && aiConfig) {
      if (aiThinking) return 'Thinking…';
      return turn === aiConfig.userColor ? 'Your Turn' : 'AI Turn';
    }
    return turn === 'black' ? 'Black to play' : 'White to play';
  }, [phase, mode, aiConfig, aiThinking, turn]);

  const actionBtn = (label: string, fn: () => void, opts?: { disabled?: boolean; danger?: boolean }) => (
    <Pressable
      onPress={fn}
      disabled={opts?.disabled}
      style={[styles.actionBtn, opts?.danger && styles.actionBtnDanger, opts?.disabled && { opacity: 0.3 }]}
    >
      <Text style={[styles.actionText, opts?.danger && styles.actionTextDanger]}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['rgba(254,243,199,0.05)', 'rgba(254,243,199,0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.35 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onExit} style={styles.exitBtn}>
            <Text style={styles.exitText}>‹ Menu</Text>
          </Pressable>
          <Text style={styles.title}>GoLuxe</Text>
          <View style={styles.exitBtn} />
        </View>
        <View style={styles.subRow}>
          <Text style={styles.subText}>
            {mode === 'ai' && aiConfig ? `Vs AI (${aiConfig.difficulty})` : 'Strategic Purity'}
          </Text>
          <Text style={styles.subDot}>•</Text>
          <Text style={[styles.subText, styles.rulesText]}>Japanese Rules</Text>
        </View>

        {/* Score strip */}
        <View style={styles.scoreStrip}>
          <View style={[styles.scoreSide, turn === 'black' && phase === 'play' ? { opacity: 1 } : { opacity: 0.3 }]}>
            <View style={[styles.miniStone, { backgroundColor: '#000', borderColor: 'rgba(255,255,255,0.20)' }]} />
            <View>
              <Text style={styles.scoreLabel}>Black{mode === 'ai' && aiConfig?.userColor === 'black' ? ' · You' : ''}</Text>
              <Text style={styles.scoreValue}>{scores.black.toFixed(1)}</Text>
            </View>
          </View>
          <View style={styles.scoreCenter}>
            <Text style={styles.statusText}>{statusText}</Text>
            {passNotice && <Text style={styles.passNotice}>{passNotice}</Text>}
          </View>
          <View style={[styles.scoreSideRight, turn === 'white' && phase === 'play' ? { opacity: 1 } : { opacity: 0.3 }]}>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.scoreLabel}>White{mode === 'ai' && aiConfig?.userColor === 'white' ? ' · You' : ''}</Text>
              <Text style={styles.scoreValue}>{scores.white.toFixed(1)}</Text>
            </View>
            <View style={[styles.miniStone, { backgroundColor: '#fff', borderColor: 'rgba(255,255,255,0.20)' }]} />
          </View>
        </View>

        {/* Board */}
        <View style={styles.boardPad}>
          <Board
            board={board}
            lastMove={lastMove}
            onIntersectionPress={onIntersectionPress}
            turn={turn}
            boardPx={BOARD_PX}
            interactive={phase === 'play' && !(mode === 'ai' && aiConfig && (turn !== aiConfig.userColor || aiThinking))}
          />
        </View>

        {/* Notice / result line */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            {phase === 'ended' && winner
              ? winner === 'draw'
                ? 'Draw game'
                : `${winner === 'black' ? 'Black' : 'White'} wins${finalScore ? ` — ${finalScore.black.toFixed(1)} to ${finalScore.white.toFixed(1)}` : ''}`
              : notice || ' '}
          </Text>
        </View>

        {/* Action buttons */}
        {phase === 'play' ? (
          <View style={styles.actionRow}>
            {actionBtn('Undo', onUndoPress, { disabled: snapshots.length === 0 || aiThinking })}
            {actionBtn('Pass', onPassPress, { disabled: aiThinking })}
            {actionBtn(resignArmed ? 'Confirm?' : 'Resign', onResignPress, { danger: true })}
            {actionBtn('Refresh', onRefreshPress)}
          </View>
        ) : (
          <View style={styles.actionRow}>
            <Pressable onPress={onRefreshPress} style={styles.playAgainBtn}>
              <Text style={styles.playAgainText}>Play Again</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, alignItems: 'center', paddingTop: 12, paddingBottom: 32, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 2 },
  exitBtn: { minWidth: 64, paddingVertical: 8 },
  exitText: { color: C.white40, fontSize: 12, fontFamily: SERIF, letterSpacing: 2, textTransform: 'uppercase' },
  title: { fontFamily: SERIF, fontSize: 26, fontWeight: '600', color: C.amber50, letterSpacing: -0.5 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  subText: { color: 'rgba(255,255,255,0.30)', fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', fontWeight: '500' },
  subDot: { color: 'rgba(255,255,255,0.25)', fontSize: 9 },
  rulesText: { color: C.amber100, fontWeight: '700' },

  scoreStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 12,
    backgroundColor: C.white03,
    borderWidth: 1,
    borderColor: C.white05,
    borderRadius: 16,
  },
  scoreSide: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreSideRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniStone: { width: 14, height: 14, borderRadius: 7, borderWidth: 1 },
  scoreLabel: { fontSize: 10, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: 1 },
  scoreValue: { fontSize: 18, color: C.amber50, fontVariant: ['tabular-nums'] },
  scoreCenter: { alignItems: 'center', gap: 2, flex: 1, paddingHorizontal: 8 },
  statusText: { fontSize: 10, color: 'rgba(253,230,138,0.80)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: 1, textAlign: 'center' },
  passNotice: { fontSize: 8, color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase', letterSpacing: 2 },

  boardPad: { padding: 2 },
  noticeBox: { height: 32, justifyContent: 'center', marginTop: 8 },
  noticeText: { color: C.amber200, fontSize: 14, textAlign: 'center' },

  actionRow: { flexDirection: 'row', gap: 8, width: '100%', maxWidth: 420, marginTop: 4 },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: C.white05,
    borderWidth: 1,
    borderColor: C.white10,
    alignItems: 'center',
  },
  actionText: {
    fontFamily: SERIF,
    color: 'rgba(255,255,255,0.70)',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  actionBtnDanger: { backgroundColor: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.20)' },
  actionTextDanger: { color: '#fecaca' },
  playAgainBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(254,243,199,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.20)',
    alignItems: 'center',
  },
  playAgainText: {
    fontFamily: SERIF,
    color: 'rgba(254,243,199,0.80)',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

export default GameScreen;
