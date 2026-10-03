import {SafeAreaView} from 'react-native-safe-area-context';
import GuideActions from '../components/GuideActions';
import GuideHeader from '../components/GuideHeader';
import { useWindowDimensions } from 'react-native';
import { useTheme } from '../ui';
import { Pressable, ScrollView, StatusBar, Text, View, LinearGradient, AnimatedView } from '../ui';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Modal, StyleSheet } from 'react-native';

import Animated, { SlideInRight, ZoomIn } from 'react-native-reanimated';
import Board from '../components/Board';
import Ishi, { IshiMood } from '../components/Ishi';
import { renderMarkup } from '../components/Markup';
import {
  checkCaptures,
  createEmptyBoard,
  findGroup,
  getAtariPoints,
  getBoardString,
  getLiberties,
  isSelfCapture,
} from '../logic/goEngine';
import { Intersection, Player, Point } from '../types';
import { C, SERIF } from '../theme';



// ---- Board setups, ported verbatim from the web tutorial ----
type Setup = { p: Point; c: Player }[];
const TUT_CAPTURE_SETUP: Setup = [
  { p: { x: 4, y: 4 }, c: 'white' },
  { p: { x: 3, y: 4 }, c: 'black' }, { p: { x: 4, y: 3 }, c: 'black' }, { p: { x: 4, y: 5 }, c: 'black' },
];
const TUT_CUT_SETUP: Setup = [
  { p: { x: 3, y: 4 }, c: 'white' }, { p: { x: 5, y: 4 }, c: 'white' },
  { p: { x: 4, y: 3 }, c: 'black' },
];
const TUT_ENCLOSURE_SETUP: Setup = [
  { p: { x: 3, y: 4 }, c: 'white' }, { p: { x: 5, y: 4 }, c: 'white' },
  { p: { x: 4, y: 3 }, c: 'white' }, { p: { x: 4, y: 5 }, c: 'white' },
  { p: { x: 2, y: 4 }, c: 'black' }, { p: { x: 6, y: 4 }, c: 'black' },
  { p: { x: 4, y: 2 }, c: 'black' }, { p: { x: 4, y: 6 }, c: 'black' },
  { p: { x: 3, y: 3 }, c: 'black' }, { p: { x: 5, y: 3 }, c: 'black' },
  { p: { x: 3, y: 5 }, c: 'black' }, { p: { x: 5, y: 5 }, c: 'black' },
];
const TUT_CONNECT_SETUP: Setup = [
  { p: { x: 3, y: 4 }, c: 'black' }, { p: { x: 5, y: 4 }, c: 'black' },
  { p: { x: 4, y: 6 }, c: 'white' },
];
const TUT_LIBERTY_DEMO_SETUP: Setup = [
  { p: { x: 4, y: 4 }, c: 'black' },
  { p: { x: 4, y: 0 }, c: 'black' },
  { p: { x: 0, y: 8 }, c: 'black' },
];
const TUT_KO_SETUP: Setup = [
  { p: { x: 3, y: 4 }, c: 'black' }, { p: { x: 5, y: 4 }, c: 'black' }, { p: { x: 4, y: 3 }, c: 'black' },
  { p: { x: 4, y: 4 }, c: 'white' },
  { p: { x: 3, y: 5 }, c: 'white' }, { p: { x: 5, y: 5 }, c: 'white' }, { p: { x: 4, y: 6 }, c: 'white' },
];
const TUT_SUICIDE_SETUP: Setup = [
  { p: { x: 3, y: 4 }, c: 'white' }, { p: { x: 5, y: 4 }, c: 'white' },
  { p: { x: 4, y: 3 }, c: 'white' }, { p: { x: 4, y: 5 }, c: 'white' },
];
const TUT_TERRITORY_SETUP: Setup = [
  { p: { x: 0, y: 4 }, c: 'black' }, { p: { x: 0, y: 5 }, c: 'black' }, { p: { x: 0, y: 6 }, c: 'black' },
  { p: { x: 0, y: 7 }, c: 'black' }, { p: { x: 0, y: 8 }, c: 'black' },
  { p: { x: 1, y: 8 }, c: 'black' }, { p: { x: 2, y: 8 }, c: 'black' }, { p: { x: 3, y: 8 }, c: 'black' },
  { p: { x: 4, y: 8 }, c: 'black' }, { p: { x: 4, y: 7 }, c: 'black' }, { p: { x: 4, y: 6 }, c: 'black' },
  { p: { x: 4, y: 5 }, c: 'black' },
  { p: { x: 1, y: 4 }, c: 'black' }, { p: { x: 2, y: 4 }, c: 'black' }, { p: { x: 3, y: 4 }, c: 'black' },
  { p: { x: 8, y: 5 }, c: 'white' }, { p: { x: 8, y: 6 }, c: 'white' }, { p: { x: 8, y: 7 }, c: 'white' },
  { p: { x: 8, y: 8 }, c: 'white' }, { p: { x: 7, y: 8 }, c: 'white' }, { p: { x: 6, y: 8 }, c: 'white' },
  { p: { x: 5, y: 8 }, c: 'white' }, { p: { x: 5, y: 7 }, c: 'white' }, { p: { x: 5, y: 6 }, c: 'white' },
  { p: { x: 6, y: 5 }, c: 'white' }, { p: { x: 7, y: 5 }, c: 'white' },
];
const TUT_TERRITORY_WALL_SETUP: Setup = [
  { p: { x: 5, y: 0 }, c: 'black' }, { p: { x: 5, y: 1 }, c: 'black' }, { p: { x: 5, y: 2 }, c: 'black' },
  { p: { x: 5, y: 3 }, c: 'black' }, { p: { x: 5, y: 4 }, c: 'black' },
  { p: { x: 6, y: 4 }, c: 'black' }, { p: { x: 7, y: 4 }, c: 'black' }, { p: { x: 8, y: 4 }, c: 'black' },
  { p: { x: 1, y: 7 }, c: 'white' }, { p: { x: 2, y: 7 }, c: 'white' },
];

const setupToBoard = (setup: Setup): Intersection[][] => {
  const b = createEmptyBoard(9);
  setup.forEach(({ p, c }) => { b[p.y][p.x] = c; });
  return b;
};

const computeTerritoryRegions = (board: Intersection[][]): { black: Point[]; white: Point[] } => {
  const size = board.length;
  const black: Point[] = [];
  const white: Point[] = [];
  const seen = new Set<string>();
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board[y][x] !== null || seen.has(`${x},${y}`)) continue;
      const queue: Point[] = [{ x, y }];
      const region: Point[] = [];
      const border = new Set<string>();
      seen.add(`${x},${y}`);
      while (queue.length) {
        const p = queue.pop()!;
        region.push(p);
        for (const [dx, dy] of dirs) {
          const nx = p.x + dx, ny = p.y + dy;
          if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue;
          if (board[ny][nx] === null) {
            if (!seen.has(`${nx},${ny}`)) { seen.add(`${nx},${ny}`); queue.push({ x: nx, y: ny }); }
          } else {
            border.add(board[ny][nx] as string);
          }
        }
      }
      if (border.size === 1) {
        if (border.has('black')) black.push(...region);
        else white.push(...region);
      }
    }
  }
  return { black, white };
};

interface Chip { label: string; value: string | number; tone: 'amber' | 'sky' }
interface TutCardData {
  title: string;
  mood: IshiMood;
  text: string;
  chips?: Chip[];
  buttonLabel?: string;
  onButton?: () => void;
}

interface TutorialScreenProps {
  onExit: () => void;
  onFirstGame: () => void;
  onStudy: () => void;
}

const TutorialScreen: React.FC<TutorialScreenProps> = ({ onExit, onFirstGame, onStudy }) => {
  const { width, height } = useWindowDimensions();
  const BOARD_PX = Math.max(1, Math.min(width*.86, height-440));
  const { mode: themeMode } = useTheme();
  const [board, setBoard] = useState<Intersection[][]>(() => createEmptyBoard(9));
  const [history, setHistory] = useState<string[]>(() => [getBoardString(createEmptyBoard(9))]);
  const [tutStep, setTutStep] = useState(0);
  const [tutPhase, setTutPhase] = useState('intro');
  const [tutTarget, setTutTarget] = useState<Point | null>(null);
  const [tutPlaced, setTutPlaced] = useState<Point | null>(null);
  const [tutTerritory, setTutTerritory] = useState<{ black: Point[]; white: Point[] } | null>(null);
  const [tutReveal, setTutReveal] = useState(0);
  const [tutNudge, setTutNudge] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const nudgeTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashNotice = (msg: string) => {
    setNotice(msg);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 2600);
  };

  const tutSetBoard = (setup: Setup) => {
    const nb = setupToBoard(setup);
    setBoard(nb);
    setHistory([getBoardString(nb)]);
  };

  const setupTutStep = (step: number) => {
    setTutTarget(null); setTutTerritory(null); setTutNudge(null); setTutReveal(0);
    if (step === 0) { tutSetBoard([]); setTutPhase('intro'); }
    else if (step === 1) { tutSetBoard([]); setTutPlaced(null); setTutPhase('await-stone'); setTutTarget({ x: 4, y: 4 }); }
    else if (step === 2) {
      tutSetBoard(tutPlaced ? [{ p: tutPlaced, c: 'black' }] : []);
      setTutPhase('liberties');
    }
    else if (step === 3) { tutSetBoard(TUT_CAPTURE_SETUP); setTutPhase('await-capture'); setTutTarget({ x: 5, y: 4 }); }
    else if (step === 4) { tutSetBoard(TUT_CUT_SETUP); setTutPhase('await-cut'); setTutTarget({ x: 4, y: 4 }); }
    else if (step === 5) { tutSetBoard(TUT_CONNECT_SETUP); setTutPhase('await-connect'); setTutTarget({ x: 4, y: 4 }); }
    else if (step === 6) {
      tutSetBoard(TUT_TERRITORY_SETUP);
      setTutTerritory(computeTerritoryRegions(setupToBoard(TUT_TERRITORY_SETUP)));
      setTutPhase('goal');
    }
    else if (step === 7) {
      tutSetBoard(TUT_TERRITORY_SETUP);
      setTutTerritory(computeTerritoryRegions(setupToBoard(TUT_TERRITORY_SETUP)));
      setTutPhase('counting');
    }
    else if (step === 8) { setTutPhase('await-pass'); }
    else if (step === 9) { tutSetBoard(TUT_KO_SETUP); setTutPhase('await-ko'); setTutTarget({ x: 4, y: 5 }); }
    else if (step === 10) { tutSetBoard(TUT_SUICIDE_SETUP); setTutPhase('await-suicide'); setTutTarget({ x: 4, y: 4 }); }
    else if (step === 11) { tutSetBoard([]); setTutPhase('graduation'); }
    setTutStep(step);
  };

  useEffect(() => { setupTutStep(0); return ()=>{if(nudgeTimer.current)clearTimeout(nudgeTimer.current);if(noticeTimer.current)clearTimeout(noticeTimer.current);}; }, []);

  // Animated territory counting on step 7: reveal one point at a time.
  useEffect(() => {
    if (tutStep !== 7 || tutPhase !== 'counting' || !tutTerritory) return;
    const total = tutTerritory.black.length + tutTerritory.white.length;
    if (tutReveal >= total) return;
    const t = setTimeout(() => setTutReveal((r) => Math.min(total, r + 1)), 320);
    return () => clearTimeout(t);
  }, [tutStep, tutPhase, tutTerritory, tutReveal]);

  const tutPlace = (p: Point, color: Player = 'black') => {
    const temp = board.map((row) => [...row]);
    temp[p.y][p.x] = color;
    const { newBoard } = checkCaptures(temp, p, color);
    const bs = getBoardString(newBoard);
    setBoard(newBoard);
    setHistory((h) => [...h, bs]);
  };

  const validateTut = (p: Point, color: Player): string | null => {
    if (board[p.y][p.x]) return 'Occupied';
    if (isSelfCapture(board, p, color)) return 'Suicide move not allowed';
    const temp = board.map((row) => [...row]);
    temp[p.y][p.x] = color;
    const { newBoard } = checkCaptures(temp, p, color);
    const bs = getBoardString(newBoard);
    if (history.length >= 2 && bs === history[history.length - 2]) return 'Ko — play elsewhere first';
    return null;
  };

  const nudge = (msg: string) => {
    setTutNudge(msg);
    if(nudgeTimer.current)clearTimeout(nudgeTimer.current);nudgeTimer.current=setTimeout(() => setTutNudge(null), 2500);
  };

  const onBoardTap = (p: Point) => {
    setTutNudge(null);
    if (tutStep === 1 && tutPhase === 'await-stone') {
      if (board[p.y][p.x]) { nudge('That point is taken — tap an empty one.'); return; }
      tutPlace(p, 'black');
      setTutPlaced(p);
      setTutPhase('placed');
      setTutTarget(null);
      return;
    }
    if (tutStep === 3 && tutPhase === 'await-capture') {
      if (p.x === 5 && p.y === 4) { tutPlace(p, 'black'); setTutPhase('captured'); setTutTarget(null); }
      else nudge('Not quite — tap the glowing point.');
      return;
    }
    if (tutStep === 3 && tutPhase === 'await-enclosure') {
      if (p.x === 4 && p.y === 4) { tutPlace(p, 'black'); setTutPhase('enclosure-captured'); setTutTarget(null); }
      else nudge('Not quite — tap the glowing point.');
      return;
    }
    if (tutStep === 4 && tutPhase === 'await-cut') {
      if (p.x === 4 && p.y === 4) { tutPlace(p, 'black'); setTutPhase('cut-done'); setTutTarget(null); }
      else nudge('Not quite — tap the glowing point.');
      return;
    }
    if (tutStep === 5 && tutPhase === 'await-connect') {
      if (p.x === 4 && p.y === 4) { tutPlace(p, 'black'); setTutPhase('connect-done'); setTutTarget(null); }
      else nudge('Not quite — tap the glowing point.');
      return;
    }
    if (tutStep === 9 && tutPhase === 'await-ko') {
      if (p.x === 4 && p.y === 5) { tutPlace(p, 'black'); setTutPhase('ko-captured'); setTutTarget({ x: 4, y: 4 }); }
      else nudge('Not quite — tap the glowing point.');
      return;
    }
    if (tutStep === 9 && tutPhase === 'ko-captured') {
      if (p.x === 4 && p.y === 4) {
        const err = validateTut(p, 'white');
        if (err) flashNotice(err);
        setTutPhase('ko-done'); setTutTarget(null);
      } else nudge('Tap the glowing point to try the take-back.');
      return;
    }
    if (tutStep === 10 && tutPhase === 'await-suicide') {
      if (p.x === 4 && p.y === 4) {
        const err = validateTut(p, 'black');
        if (err) flashNotice(err);
        setTutPhase('suicide-done'); setTutTarget(null);
      } else nudge('Tap the glowing point — I dare you.');
      return;
    }
    // The web leaves non-interactive lesson taps unchanged.
  };

  const onPassPress = () => {
    if (tutStep === 8 && tutPhase === 'await-pass') {
      setTutPhase('passed');
    } else {
      nudge('Not yet — the Pass button gets its moment soon.');
    }
  };

  // ---- Card content, 1:1 with the web getTutCard ----
  const getCard = (): TutCardData | null => {
    if (tutStep >= 11) return null;
    const go = (s: number) => () => setupTutStep(s);
    if (tutStep === 0) return {
      title: 'Meet Ishi', mood: 'happy',
      text: `Hey! I'm **Ishi**, your corner coach. I'll teach you Go right here on a real board — same tools the pros get. First rule: **Black always moves first**, and that's you.`,
      buttonLabel: "Let's go!", onButton: go(1),
    };
    if (tutStep === 1) {
      if (tutPhase === 'placed') return {
        title: 'Your first stone', mood: 'excited',
        text: `Nice! Now look closely at your stone — see the **glowing dots** around it? Those are its liberties.`,
        buttonLabel: 'What are liberties?', onButton: go(2),
      };
      return {
        title: 'Your first stone', mood: 'happy',
        text: `Tap any empty intersection to place your first stone. (The middle is the honest move — I marked it for you.)`,
      };
    }
    if (tutStep === 2) {
      if (tutPhase === 'liberties-edge') return {
        title: 'Where you stand matters', mood: 'happy',
        text: `Same stone, three spots: the middle has **4** liberties, the edge **3**, the corner just **2**. Count the dots. Edge and corner stones are easier to capture — keep that in mind.`,
        chips: [
          { label: 'Middle', value: 4, tone: 'amber' },
          { label: 'Edge', value: 3, tone: 'amber' },
          { label: 'Corner', value: 2, tone: 'amber' },
        ],
        buttonLabel: 'Got it', onButton: go(3),
      };
      let libCount = 0;
      if (tutPlaced && board[tutPlaced.y]?.[tutPlaced.x] === 'black') {
        const g = findGroup(board, tutPlaced);
        if (g) libCount = getLiberties(board, g.group).size;
      }
      return {
        title: 'Liberties', mood: 'happy',
        text: `Empty points touching your stone — yours has **${libCount}**. Fill every liberty of an enemy stone and you capture it. The board always shows them for you.`,
        chips: [{ label: 'Liberties', value: libCount, tone: 'amber' }],
        buttonLabel: "Where's safest?",
        onButton: () => { tutSetBoard(TUT_LIBERTY_DEMO_SETUP); setTutPhase('liberties-edge'); },
      };
    }
    if (tutStep === 3) {
      if (tutPhase === 'enclosure-captured') return {
        title: 'The whole shape!', mood: 'excited',
        text: `Four stones, one move. When you've surrounded the enemy down to a single liberty, the killing blow lands — captures lift first, so it's never suicide.`,
        buttonLabel: 'Teach me to fight', onButton: go(4),
      };
      if (tutPhase === 'await-enclosure') return {
        title: 'The tricky one', mood: 'happy',
        text: `These four white stones are completely surrounded — the !!pulsing red marker!! is their only liberty, right in the middle. Playing there looks like suicide for Black (an illegal move) — but captured stones lift first, so it's legal. Tap the glowing point and take the whole shape.`,
      };
      if (tutPhase === 'captured') return {
        title: 'Captured!', mood: 'excited',
        text: `Off the board! One liberty left is called **atari** — say it like you mean it. But captures come in bigger sizes, too…`,
        buttonLabel: 'Show me',
        onButton: () => { tutSetBoard(TUT_ENCLOSURE_SETUP); setTutPhase('await-enclosure'); setTutTarget({ x: 4, y: 4 }); },
      };
      return {
        title: 'Your first capture', mood: 'happy',
        text: `This white stone has one liberty left — the !!pulsing red marker!! means it's in atari, in danger. Tap the glowing point to take it.`,
      };
    }
    if (tutStep === 4) {
      if (tutPhase === 'cut-done') return {
        title: 'The cut', mood: 'excited',
        text: `That's a **cut**! Those white stones can't link up directly anymore — divided stones can't share liberties, so surround them and they run out of air fast.`,
        buttonLabel: 'How do I defend?', onButton: go(5),
      };
      return {
        title: 'Offense: the cut', mood: 'happy',
        text: `See those two white stones with a gap between them? If they connect, they become one strong group. Tap the glowing point to wedge between them.`,
      };
    }
    if (tutStep === 5) {
      if (tutPhase === 'connect-done') return {
        title: 'Connected!', mood: 'proud',
        text: `Linked stones **share liberties** — one strong group instead of two weak ones. And when a group is low on air, **extend** outward: more room, more liberties. Spot a __green__ dot? That's a liberty touching both colors — shared ground.`,
        buttonLabel: "So what's the goal?", onButton: go(6),
      };
      return {
        title: 'Defense: connect', mood: 'happy',
        text: `Your two stones have a gap — White would love to cut there. Tap the glowing point to link them into a single group before that happens.`,
      };
    }
    if (tutStep === 6) {
      if (tutPhase === 'goal-2') return {
        title: 'Walls count too', mood: 'happy',
        text: `No box needed — Black's wall plus the board's edge seal off those gold points. The edge counts as a wall. And the rest? Not fully surrounded, so no wash: **only sealed points count**. Let's go back to the first example and count it up.`,
        buttonLabel: 'Count the first example', onButton: go(7),
      };
      return {
        title: 'The real goal', mood: 'happy',
        text: `So why all the fighting? Capturing, cutting, connecting — none of that is the point. They're **tools**. The goal is **territory**: empty points your stones surround. Every attack should grow yours or shrink theirs. The empty points inside each stone enclosure are those stones' territory.`,
        buttonLabel: 'See another',
        onButton: () => {
          tutSetBoard(TUT_TERRITORY_WALL_SETUP);
          setTutTerritory(computeTerritoryRegions(setupToBoard(TUT_TERRITORY_WALL_SETUP)));
          setTutPhase('goal-2');
        },
      };
    }
    if (tutStep === 7) {
      const b = tutTerritory?.black.length ?? 0;
      const w = tutTerritory?.white.length ?? 0;
      const total = b + w;
      const bShown = Math.min(tutReveal, b);
      const wShown = Math.max(0, tutReveal - b);
      const done = tutReveal >= total && total > 0;
      if (tutPhase === 'counting-3') return {
        title: 'Komi', mood: 'happy',
        text: `Black moves first — that's a real edge. So White gets **komi**: bonus points (usually 7.5) to even things out. Watch what it does to our example: Black leads in territory, 9 to 4 — but 4 + 7.5 is 11.5, so ~~White wins~~. Add it all up — territory, captures, komi — and you have the final score.`,
        chips: [
          { label: 'Black', value: b, tone: 'amber' },
          { label: 'White', value: `${w} + 7.5`, tone: 'sky' },
        ],
        buttonLabel: 'Two ways to count', onButton: () => setTutPhase('counting-4'),
      };
      if (tutPhase === 'counting-4') return {
        title: 'Japanese vs Chinese', mood: 'happy',
        text: `What we just did is **Japanese** counting: territory + captures — the stones on the board don't score, only the empty points they surround. ~~Chinese~~ counting is different: every stone on the board is worth a point, plus territory — captures don't matter, they're already off the board. Same game, same winner, just different arithmetic. You can pick your ruleset in GoLuxe's settings.`,
        chips: [
          { label: 'Japanese', value: 'Territory + captures', tone: 'amber' },
          { label: 'Chinese', value: 'Stones + territory', tone: 'sky' },
        ],
        buttonLabel: 'How does it end?', onButton: go(8),
      };
      if (tutPhase === 'counting-2') return {
        title: 'Captures count too', mood: 'happy',
        text: `Territory is only half the score. Every stone you **captured** is worth a point as well — and anything left sitting inside enemy territory at the end is dead: lifted off and counted as captured, no fight needed.`,
        chips: [
          { label: 'Black', value: b, tone: 'amber' },
          { label: 'White', value: w, tone: 'sky' },
        ],
        buttonLabel: 'What about komi?', onButton: () => setTutPhase('counting-3'),
      };
      return {
        title: 'Counting', mood: 'happy',
        text: done
          ? `Black **${b}**, White ~~${w}~~. That's the heart of it — surround more than your opponent.`
          : `Watch the points count up — Black first, then White…`,
        chips: [
          { label: 'Black', value: bShown, tone: 'amber' },
          { label: 'White', value: wShown, tone: 'sky' },
        ],
        buttonLabel: done ? 'What else counts?' : undefined,
        onButton: done ? () => setTutPhase('counting-2') : undefined,
      };
    }
    if (tutStep === 8) {
      if (tutPhase === 'passed') return {
        title: 'Well passed', mood: 'proud',
        text: `That's exactly it. If White passes too, you'd count the territory — just like we did.`,
        buttonLabel: 'One more rule', onButton: go(9),
      };
      return {
        title: 'Passing', mood: 'happy',
        text: `See the **Pass** button under the board? That's the real one. When nothing's left worth playing, both players pass — two in a row ends the game. Go ahead, press it.`,
      };
    }
    if (tutStep === 9) {
      if (tutPhase === 'ko-done') return {
        title: 'Ko — no take-backs', mood: 'happy',
        text: `Blocked! That's **ko**: no instant take-backs, or the game would loop forever. White must play elsewhere first. You'll feel it in real games.`,
        buttonLabel: 'Got it', onButton: go(10),
      };
      if (tutPhase === 'ko-captured') return {
        title: 'Ko — no take-backs', mood: 'happy',
        text: `Now White wants revenge. Tap the glowing point to take it straight back.`,
      };
      return {
        title: 'Ko — no take-backs', mood: 'happy',
        text: `One tricky rule. Tap the glowing point to capture that white stone.`,
      };
    }
    if (tutStep === 10) {
      if (tutPhase === 'suicide-done') return {
        title: 'Every stone needs air', mood: 'happy',
        text: `Blocked! A stone needs at least one liberty — no suicide moves. The one exception: if your move **captures something first**, it's legal.`,
        buttonLabel: "I'm ready", onButton: go(11),
      };
      return {
        title: 'Every stone needs air', mood: 'happy',
        text: `Last rule. Tap the glowing point — I dare you.`,
      };
    }
    return null;
  };

  const card = getCard();
  const showWash = tutTerritory && (tutStep === 6 || tutStep === 7);
  const countOrdered = tutTerritory
    ? [...tutTerritory.black.map((p) => ({ ...p, c: 'b' as const })), ...tutTerritory.white.map((p) => ({ ...p, c: 'w' as const }))]
    : null;
  const targetOnAtari = !!(tutTarget && getAtariPoints(board).has(`${tutTarget.x},${tutTarget.y}`));

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
      <SafeAreaView style={{flex:1}} edges={['top','right','bottom','left']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <GuideHeader/>
        <View style={styles.boardPad}>
          <Board
            board={board}
            lastMove={null}
            onIntersectionPress={onBoardTap}
            turn="black"
            boardPx={BOARD_PX}
            interactive={tutStep < 11}
            hideAtari={false}
            theme={themeMode === 'light' ? 'washi' : 'classic'}
            targets={tutTarget && !targetOnAtari ? [tutTarget] : []}
            showLiberties
            territoryWash={showWash ? tutTerritory : null}
            countBadges={tutStep === 7 ? countOrdered : null}
            countShown={tutReveal}
          />
        </View>

        {notice && (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        )}

        {/* Ishi lesson card — below the board, never covering it */}
        {card && (
          <View style={[styles.cardWrap,{width:BOARD_PX}]}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ishi mood={card.mood} size={28} />
                <View style={styles.cardHeadText}>
                  <Text style={styles.partLabel}>Lesson {tutStep + 1} of 12</Text>
                  <Text style={styles.cardTitle} numberOfLines={1}>{card.title}</Text>
                </View>
                <Pressable onPress={() => setShowExitConfirm(true)} style={styles.exitBtn} accessibilityLabel="Exit tutorial">
                  <Text style={styles.exitText}>✕</Text>
                </Pressable>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${((tutStep + 1) / 12) * 100}%` }]} />
              </View>
              <AnimatedView key={`${tutStep}-${tutPhase}`}  style={styles.cardBody}>
                <Text style={styles.cardText}>{renderMarkup(card.text)}</Text>
                {tutNudge && <Text style={styles.nudge}>{tutNudge}</Text>}
                {card.chips && (
                  <View style={styles.chips}>
                    {card.chips.map((c) => (
                      <View key={c.label} style={[styles.chip, c.tone === 'sky' ? styles.chipSky : styles.chipAmber]}>
                        <Text style={[styles.chipText, c.tone === 'sky' ? styles.chipTextSky : styles.chipTextAmber]}>
                          {c.label} <Text style={styles.chipValue}>{c.value}</Text>
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </AnimatedView>
              <View style={styles.btnRow}>
                {tutStep > 0 && tutStep < 11 && (
                  <Pressable onPress={() => setupTutStep(tutStep - 1)} style={styles.backCardBtn}>
                    <Text style={styles.backCardText}>← Back</Text>
                  </Pressable>
                )}
                {card.buttonLabel && (
                  <Pressable onPress={card.onButton} style={styles.nextBtn}>
                    <Text style={styles.nextText}>{card.buttonLabel}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        )}
        <GuideActions width={BOARD_PX} onPass={onPassPress}/>
      </ScrollView>
      </SafeAreaView>

      {/* Graduation modal — web: animate-in zoom-in duration-300 */}
      <Modal visible={tutStep === 11} transparent animationType="fade">
        <View style={styles.modalBg}>
          <AnimatedView entering={ZoomIn.duration(300)} style={styles.modalCard}>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Ishi mood="proud" size={76} />
            </View>
            <Text style={styles.modalTitle}>You know enough to start playing.</Text>
            <Text style={styles.modalPara}>
              Liberties, captures, cutting, connecting, territory, passing, ko, and the no-air rule — you now have an idea of what this game is about.
            </Text>
            <Text style={[styles.modalPara, { marginBottom: 16 }]}>
              But there's so much more. My sensei is waiting in the Study Room to teach you the rest — joseki, life and death, real fighting strategy. Or dive straight into your first 9×9 game against the Learning AI.
            </Text>
            <View style={styles.modalProgressTrack}>
              <View style={[styles.modalProgressFill, { width: '100%' }]} />
            </View>
            <View style={{ gap: 10 }}>
              <Pressable onPress={onFirstGame} style={styles.modalCta}>
                <Text style={styles.modalCtaText}>Play your first game</Text>
              </Pressable>
              <Pressable onPress={onStudy} style={styles.modalCta}>
                <Text style={styles.modalCtaText}>Visit the Study Room</Text>
              </Pressable>
              <Pressable onPress={onExit} style={{ paddingVertical: 8 }}>
                <Text style={styles.modalBackText}>Back to menu</Text>
              </Pressable>
            </View>
          </AnimatedView>
        </View>
      </Modal>

      {/* Exit confirm */}
      <Modal visible={showExitConfirm} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.confirmCard}>
            <Text style={styles.modalTitle}>Exit to Main Menu?</Text>
            <Text style={[styles.modalPara, { marginBottom: 24 }]}>Your current game progress will be lost.</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={() => setShowExitConfirm(false)} style={[styles.confirmBtn, styles.confirmCancel]}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={() => { setShowExitConfirm(false); onExit(); }} style={[styles.confirmBtn, styles.confirmDanger]}>
                <Text style={styles.confirmDangerText}>Exit</Text>
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
  scroll: { flexGrow: 1, alignItems: 'center', paddingTop: 14, paddingBottom: 32, paddingHorizontal: 16 },
  kicker: {
    color: 'rgba(255,255,255,0.30)', fontSize: 9, letterSpacing: 4,
    textTransform: 'uppercase', fontWeight: '500', marginBottom: 10,
  },
  boardPad: { padding: 2 },
  noticeBox: { minHeight: 28, justifyContent: 'center', marginTop: 6, paddingHorizontal: 16 },
  noticeText: { color: '#fde68a', fontSize: 13, textAlign: 'center' },
  passBtn: {
    marginTop: 8, paddingHorizontal: 40, paddingVertical: 10, borderRadius: 12,
    backgroundColor: C.white05, borderWidth: 1, borderColor: C.white10,
  },
  passText: { fontFamily: SERIF, color: 'rgba(255,255,255,0.70)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },

  cardWrap: { width: '100%', maxWidth: 420, marginTop: 8 },
  card: {
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(253,230,138,0.20)',
    backgroundColor: 'rgba(20,20,20,0.95)', paddingHorizontal: 10, paddingVertical: 6,
    shadowColor: '#000', shadowOpacity: 0.7, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardHeadText: { flex: 1, minWidth: 0 },
  partLabel: {
    fontSize: 8, textTransform: 'uppercase', letterSpacing: 1.5,
    color: 'rgba(253,230,138,0.70)', fontWeight: '700', marginBottom: 2,
  },
  cardTitle: { fontFamily: SERIF, fontSize: 10, color: C.amber100, lineHeight: 13.75 },
  exitBtn: { padding: 4 },
  exitText: { color: C.white40, fontSize: 14 },
  progressTrack: { height: 2, borderRadius: 1, backgroundColor: C.white10, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: '100%', backgroundColor: 'rgba(252,211,77,0.80)', borderRadius: 1 },
  cardBody: { paddingTop: 4 },
  cardText: { fontFamily: SERIF, fontSize: 11, lineHeight: 15.125, color: 'rgba(255,251,235,0.85)' },
  nudge: { fontSize: 10, color: 'rgba(253,230,138,0.80)', fontStyle: 'italic', marginTop: 4 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  chip: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  chipAmber: { borderColor: 'rgba(253,230,138,0.30)', backgroundColor: 'rgba(252,211,77,0.10)' },
  chipSky: { borderColor: 'rgba(186,230,253,0.30)', backgroundColor: 'rgba(186,230,253,0.10)' },
  chipText: { fontSize: 11, fontWeight: '700' },
  chipTextAmber: { color: '#fde68a' },
  chipTextSky: { color: '#bae6fd' },
  chipValue: { fontVariant: ['tabular-nums'] },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  backCardBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
    backgroundColor: C.white05, borderWidth: 1, borderColor: C.white10,
  },
  backCardText: { color: 'rgba(255,255,255,0.60)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  nextBtn: {
    flex: 1, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12,
    backgroundColor: 'rgba(253,230,138,0.15)', borderWidth: 1, borderColor: 'rgba(253,230,138,0.30)',
    alignItems: 'center',
  },
  nextText: { color: C.amber100, fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.70)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: {
    backgroundColor: '#151515', borderWidth: 1, borderColor: 'rgba(253,230,138,0.20)',
    borderRadius: 24, padding: 24, width: '100%', maxWidth: 360,
    shadowColor: '#000', shadowOpacity: 0.8, shadowRadius: 24, elevation: 16,
  },
  modalTitle: { fontFamily: SERIF, fontSize: 22, color: C.amber50, textAlign: 'center', marginBottom: 10, letterSpacing: -0.5 },
  modalPara: { fontFamily: SERIF, color: 'rgba(255,255,255,0.50)', fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 6 },
  modalProgressTrack: { height: 6, borderRadius: 3, backgroundColor: C.white10, overflow: 'hidden', marginBottom: 20 },
  modalProgressFill: { height: '100%', backgroundColor: 'rgba(252,211,77,0.90)', borderRadius: 3 },
  modalCta: {
    paddingVertical: 14, borderRadius: 16, backgroundColor: '#fde68a', alignItems: 'center',
  },
  modalCtaText: { color: '#000', fontFamily: SERIF, fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
  modalBackText: { color: C.white40, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center' },
  confirmCard: {
    backgroundColor: '#151515', borderWidth: 1, borderColor: C.white10,
    borderRadius: 16, padding: 24, width: '100%', maxWidth: 320,
  },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  confirmCancel: { borderColor: C.white10 },
  confirmCancelText: { color: C.white40, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 },
  confirmDanger: { borderColor: 'rgba(239,68,68,0.30)', backgroundColor: 'rgba(239,68,68,0.10)' },
  confirmDangerText: { color: '#fecaca', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
});

export default TutorialScreen;
