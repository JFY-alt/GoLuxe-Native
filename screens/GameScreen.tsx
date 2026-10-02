import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
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
  findGroup,
  getBoardString,
  isSelfCapture,
} from '../logic/goEngine';
import { getBestMove } from '../logic/simpleAi';
import { GameState, Intersection, Player, Point } from '../types';
import { AiConfig } from './AiSetupMenu';
import { clockAfterMove, clockDisplay, createClock, tickClock } from '../logic/clocks';
import { PlayerClock, TimeSettings } from '../types';
import { C, SERIF } from '../theme';

const KOMI = 7.5;
const AI_DELAY_MS = 750;

const { width: SW, height: SH } = Dimensions.get('window');
const BOARD_PX = Math.min(SW * 0.9, SH * 0.52, 400);
const BOARD_SIZES = [9, 13, 19];

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
  timeSettings: TimeSettings | null;
  onExit: () => void;
}

/**
 * Game screen matching the web GameSession mobile layout:
 * serif GoLuxe header + subtitle row, score strip (black | status | white),
 * espresso board, notice line, Undo/Pass/Resign/Refresh action row.
 */
const GameScreen: React.FC<GameScreenProps> = ({ mode, aiConfig, timeSettings, onExit }) => {
  const [boardSize, setBoardSize] = useState(9);
  const [ruleset, setRuleset] = useState<'japanese' | 'chinese'>('japanese');
  const [sizeArmed, setSizeArmed] = useState<number | null>(null);
  const [board, setBoard] = useState<Intersection[][]>(() => createEmptyBoard(9));
  const [turn, setTurn] = useState<Player>('black');
  const [captures, setCaptures] = useState({ black: 0, white: 0 });
  const [history, setHistory] = useState<string[]>(() => [getBoardString(createEmptyBoard(boardSize))]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [lastMove, setLastMove] = useState<Point | null>(null);
  const [passes, setPasses] = useState(0);
  const [phase, setPhase] = useState<'play' | 'scoring' | 'ended'>('play');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [finalScore, setFinalScore] = useState<{ black: number; white: number } | null>(null);
  const [deadStones, setDeadStones] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [passNotice, setPassNotice] = useState<string | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [resignArmed, setResignArmed] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timed mode clocks
  const [blackClock, setBlackClock] = useState<PlayerClock>(() =>
    createClock(timeSettings, (timeSettings?.mainTimeMinutes || 30) * 60000));
  const [whiteClock, setWhiteClock] = useState<PlayerClock>(() =>
    createClock(timeSettings, (timeSettings?.mainTimeMinutes || 30) * 60000));
  const [gameStarted, setGameStarted] = useState(!timeSettings);
  const lastTick = useRef(Date.now());

  const handleTimeOut = (player: Player) => {
    if (phase !== 'play') return;
    setWinner(player === 'black' ? 'white' : 'black');
    setPhase('ended');
    setFinalScore(null);
    setShowResults(true);
    showNotice(`${player === 'black' ? 'Black' : 'White'} ran out of time`);
  };
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const turnRef = useRef(turn);
  turnRef.current = turn;

  // Clock ticking
  useEffect(() => {
    if (!timeSettings || !gameStarted || phase !== 'play') return;
    lastTick.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTick.current;
      lastTick.current = now;
      if (delta <= 0) return;
      const active = turnRef.current;
      const setClock = active === 'black' ? setBlackClock : setWhiteClock;
      let timedOut = false;
      setClock((prev) => {
        const r = tickClock(prev, timeSettings, delta);
        if (r.timedOut) timedOut = true;
        return r.clock;
      });
      if (timedOut && phaseRef.current === 'play') handleTimeOut(active);
    }, 250);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeSettings, gameStarted, phase]);

  const bumpClockAfterMove = (player: Player) => {
    if (!timeSettings) return;
    const setClock = player === 'black' ? setBlackClock : setWhiteClock;
    setClock((prev) => clockAfterMove(prev, timeSettings));
    lastTick.current = Date.now();
  };

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
    bumpClockAfterMove(player);
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
      // Enter scoring phase — tap groups to mark dead/alive, then finalize.
      setPhase('scoring');
      setDeadStones(new Set());
      setPassNotice(null);
      showNotice('Scoring — tap any group to mark it dead or alive');
    } else {
      setTurn(player === 'black' ? 'white' : 'black');
      const label = player === 'black' ? 'Black passed' : 'White passed';
      setPassNotice(label);
      showNotice(label);
      bumpClockAfterMove(player);
    }
  };

  const toggleDeadGroup = (p: Point) => {
    if (!board[p.y][p.x]) return;
    const groupInfo = findGroup(board, p);
    if (!groupInfo) return;
    setDeadStones((prev) => {
      const next = new Set(prev);
      const firstKey = `${groupInfo.group[0].x},${groupInfo.group[0].y}`;
      const isDead = next.has(firstKey);
      groupInfo.group.forEach((gp) => {
        const k = `${gp.x},${gp.y}`;
        if (isDead) next.delete(k);
        else next.add(k);
      });
      return next;
    });
  };

  const finalizeScore = () => {
    const sc = calculateScores(board, captures, KOMI, 0, deadStones, ruleset, new Set(), true, 0, 0, true);
    setFinalScore({ black: sc.black.total, white: sc.white.total });
    setWinner(sc.black.total > sc.white.total ? 'black' : sc.white.total > sc.black.total ? 'white' : 'draw');
    setPhase('ended');
    setShowResults(true);
  };

  const resumePlay = () => {
    setPhase('play');
    setPasses(0);
    setDeadStones(new Set());
    setPassNotice(null);
    showNotice('Resumed — play on');
  };

  const onIntersectionPress = (p: Point) => {
    if (phase === 'scoring') {
      toggleDeadGroup(p);
      return;
    }
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

  const onSizeTabPress = (size: number) => {
    if (size === boardSize) return;
    if (sizeArmed !== size) {
      setSizeArmed(size);
      showNotice(`Tap ${size}×${size} again to start a new ${size}×${size} game`);
      return;
    }
    setSizeArmed(null);
    const b = createEmptyBoard(size);
    setBoardSize(size);
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
    setDeadStones(new Set());
    setShowResults(false);
    setNotice(null);
    setPassNotice(null);
    setAiThinking(false);
    setResignArmed(false);
  };

  const toggleRuleset = () => {
    setRuleset((r) => (r === 'japanese' ? 'chinese' : 'japanese'));
    showNotice(`Ruleset: ${ruleset === 'japanese' ? 'Chinese' : 'Japanese'}`);
  };

  const onRefreshPress = () => {
    const b = createEmptyBoard(boardSize);
    const mainMs = (timeSettings?.mainTimeMinutes || 30) * 60000;
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
    setDeadStones(new Set());
    setShowResults(false);
    setBlackClock(createClock(timeSettings, mainMs));
    setWhiteClock(createClock(timeSettings, mainMs));
    setGameStarted(!timeSettings);
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
        ruleset,
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

  const scoreDetail = useMemo(() => {
    const includeTerritory = phase !== 'play';
    return calculateScores(board, captures, KOMI, 0, deadStones, ruleset, new Set(), true, 0, 0, includeTerritory);
  }, [board, captures, deadStones, phase]);
  const scores = useMemo(
    () => ({ black: scoreDetail.black.total, white: scoreDetail.white.total }),
    [scoreDetail],
  );

  const statusText = useMemo(() => {
    if (phase === 'ended') return 'End';
    if (phase === 'scoring') return 'Scoring';
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
          <Pressable onPress={toggleRuleset}>
            <Text style={[styles.subText, styles.rulesText]}>{ruleset === 'japanese' ? 'Japanese' : 'Chinese'} Rules</Text>
          </Pressable>
        </View>

        {/* Board size tabs */}
        <View style={styles.sizeRow}>
          {BOARD_SIZES.map((s) => (
            <Pressable key={s} onPress={() => onSizeTabPress(s)} style={styles.sizeTab}>
              <Text style={[styles.sizeText, boardSize === s && styles.sizeTextActive]}>
                {s}×{s}
              </Text>
              {boardSize === s && <View style={styles.sizeUnderline} />}
            </Pressable>
          ))}
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
            {timeSettings ? (
              <Text style={styles.clockText}>
                <Text style={turn === 'black' && phase === 'play' ? styles.clockActive : styles.clockIdle}>
                  {clockDisplay(blackClock, timeSettings)}
                </Text>
                <Text style={styles.clockSep}> | </Text>
                <Text style={turn === 'white' && phase === 'play' ? styles.clockActive : styles.clockIdle}>
                  {clockDisplay(whiteClock, timeSettings)}
                </Text>
              </Text>
            ) : (
              <Text style={styles.statusText}>{statusText}</Text>
            )}
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
            interactive={phase !== 'ended' && (timeSettings ? gameStarted : true) && !(mode === 'ai' && aiConfig && phase === 'play' && (turn !== aiConfig.userColor || aiThinking))}
            showLiberties={phase === 'play'}
            hideAtari={phase === 'scoring'}
            deadStones={phase === 'scoring' ? deadStones : null}
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
        {timeSettings && !gameStarted && phase === 'play' ? (
          <Pressable onPress={() => { setGameStarted(true); lastTick.current = Date.now(); }} style={styles.startGameBtn}>
            <Text style={styles.startGameText}>Start Game</Text>
          </Pressable>
        ) : phase === 'play' ? (
          <View style={styles.actionRow}>
            {actionBtn('Undo', onUndoPress, { disabled: snapshots.length === 0 || aiThinking || !!timeSettings })}
            {actionBtn('Pass', onPassPress, { disabled: aiThinking })}
            {actionBtn(resignArmed ? 'Confirm?' : 'Resign', onResignPress, { danger: true })}
            {actionBtn('Refresh', onRefreshPress)}
          </View>
        ) : phase === 'scoring' ? (
          <View style={styles.actionRow}>
            {actionBtn('Resume Play', resumePlay)}
            <Pressable onPress={finalizeScore} style={styles.finalizeBtn}>
              <Text style={styles.finalizeText}>Finalize Score</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.actionRow}>
            <Pressable onPress={onRefreshPress} style={styles.playAgainBtn}>
              <Text style={styles.playAgainText}>Play Again</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Final results modal */}
      <Modal visible={showResults && phase === 'ended'} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {winner === 'draw' ? 'Draw' : 'Match Conclusion'}
            </Text>
            <Text style={styles.modalRules}>{ruleset} rules</Text>
            <View style={styles.resultRow}>
              {(['black', 'white'] as const).map((color) => {
                const d = color === 'black' ? scoreDetail.black : scoreDetail.white;
                const isWinner = winner === color;
                return (
                  <View key={color} style={[styles.resultCard, isWinner ? styles.resultCardWinner : styles.resultCardLoser]}>
                    <View style={styles.resultHead}>
                      <View style={[styles.miniStone, color === 'black'
                        ? { backgroundColor: '#000', borderColor: 'rgba(255,255,255,0.20)' }
                        : { backgroundColor: '#fff', borderColor: 'rgba(255,255,255,0.20)' }]} />
                      <Text style={styles.resultName}>{color === 'black' ? 'Black' : 'White'}</Text>
                      {isWinner && <Text style={styles.winnerBadge}>Winner</Text>}
                    </View>
                    <View style={styles.resultLine}>
                      <Text style={styles.resultLabel}>Territory</Text>
                      <Text style={styles.resultValue}>+{d.territory}</Text>
                    </View>
                    <View style={styles.resultLine}>
                      <Text style={styles.resultLabel}>{ruleset === 'japanese' ? 'Prisoners' : 'Stones'}</Text>
                      <Text style={styles.resultValue}>+{ruleset === 'japanese' ? d.captures : d.stones}</Text>
                    </View>
                    <View style={styles.resultLine}>
                      <Text style={styles.resultLabel}>{color === 'black' ? 'Comp.' : 'Komi'}</Text>
                      <Text style={styles.resultValue}>+{color === 'black' ? d.reverseKomi : d.komi}</Text>
                    </View>
                    <View style={styles.resultTotal}>
                      <Text style={styles.resultTotalLabel}>Total</Text>
                      <Text style={styles.resultTotalValue}>{d.total.toFixed(1)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={onRefreshPress} style={[styles.modalBtn, styles.modalBtnGold]}>
                <Text style={styles.modalBtnGoldText}>New Game</Text>
              </Pressable>
              <Pressable onPress={() => setShowResults(false)} style={[styles.modalBtn, styles.modalBtnGhost]}>
                <Text style={styles.modalBtnGhostText}>Return to Board</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  sizeRow: { flexDirection: 'row', gap: 28, justifyContent: 'center', marginBottom: 10 },
  sizeTab: { alignItems: 'center', paddingVertical: 4, minWidth: 56 },
  sizeText: {
    fontFamily: SERIF,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.20)',
  },
  sizeTextActive: { color: C.amber100 },
  sizeUnderline: {
    marginTop: 3,
    height: 2,
    width: '100%',
    backgroundColor: 'rgba(254,243,199,0.30)',
    shadowColor: '#fef3c7',
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

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
  clockText: { fontSize: 11, fontVariant: ['tabular-nums'], textAlign: 'center' },
  clockActive: { color: '#fff' },
  clockIdle: { color: 'rgba(255,255,255,0.50)' },
  clockSep: { color: 'rgba(255,255,255,0.30)' },
  passNotice: { fontSize: 8, color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase', letterSpacing: 2 },
  startGameBtn: {
    width: '100%',
    maxWidth: 420,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(16,185,129,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.30)',
    alignItems: 'center',
    marginTop: 4,
  },
  startGameText: { color: '#a7f3d0', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 },

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
  finalizeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(254,243,199,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.30)',
    alignItems: 'center',
  },
  finalizeText: {
    fontFamily: SERIF,
    color: C.amber100,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.60)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: {
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: C.white10,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 420,
  },
  modalTitle: { fontFamily: SERIF, fontSize: 20, color: C.amber50, textAlign: 'center', letterSpacing: 0.5 },
  modalRules: { fontSize: 8, color: C.white20, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginTop: 4, marginBottom: 12 },
  resultRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  resultCard: { flex: 1, padding: 14, borderRadius: 16, borderWidth: 1 },
  resultCardWinner: { backgroundColor: 'rgba(254,243,199,0.03)', borderColor: 'rgba(253,230,138,0.20)' },
  resultCardLoser: { backgroundColor: 'rgba(0,0,0,0.20)', borderColor: C.white05, opacity: 0.6 },
  resultHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  resultName: { fontSize: 10, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: 2 },
  winnerBadge: {
    marginLeft: 'auto',
    fontSize: 8,
    color: '#fde68a',
    backgroundColor: 'rgba(253,230,138,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.20)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
    overflow: 'hidden',
  },
  resultLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  resultLabel: { fontSize: 11, color: 'rgba(255,255,255,0.30)' },
  resultValue: { fontSize: 11, color: C.amber100, fontVariant: ['tabular-nums'] },
  resultTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderTopWidth: 1,
    borderTopColor: C.white05,
    paddingTop: 10,
    marginTop: 6,
  },
  resultTotalLabel: { fontSize: 9, color: C.white20, textTransform: 'uppercase', fontFamily: SERIF },
  resultTotalValue: { fontSize: 24, color: C.amber50, fontVariant: ['tabular-nums'] },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  modalBtnGold: { backgroundColor: 'rgba(254,243,199,0.10)', borderColor: 'rgba(253,230,138,0.20)' },
  modalBtnGoldText: { color: C.amber100, fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  modalBtnGhost: { borderColor: C.white10 },
  modalBtnGhostText: { color: C.white30, fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 },
});

export default GameScreen;
