import {savePracticeSolve} from '../storage/studyProgress';
import GlassBackdrop from '../components/GlassBackdrop';
import Dialog from '../components/Dialog';
import DojoBackdrop from '../components/DojoBackdrop';
import {resumeBeat,lessonBoard} from '../logic/study';
import {BackHandler} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import GuideActions from '../components/GuideActions';
import GuideHeader from '../components/GuideHeader';
import { useWindowDimensions } from 'react-native';
import { useTheme } from '../ui';
import { Pressable, ScrollView, StatusBar, Text, View, LinearGradient, AnimatedView } from '../ui';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet } from 'react-native';

import Animated, { SlideInRight } from 'react-native-reanimated';
import Board from '../components/Board';
import Sensei, { SenseiMood } from '../components/Sensei';
import { renderMarkup } from '../components/Markup';
import { SENSEI_LESSONS, SenseiBeat, parseSenseiBoard } from '../data/senseiLessons';
import { checkCaptures, createEmptyBoard, getBoardString, isSelfCapture } from '../logic/goEngine';
import { Intersection, Point } from '../types';
import { getViewedStudyProgress, saveSenseiProgress } from '../storage/studyProgress';
import { C, SERIF } from '../theme';



interface SenseiScreenProps {
  topic: string;
  onExit: () => void;
}

/** Mini-markup: **bold** -> amber, *italic* -> italic (shared). */
const renderSenseiText = renderMarkup;

/**
 * Study Room lesson engine, 1:1 with the web isSensei GameSession:
 * board + Sensei card below it, sequential tap targets (never two stones at
 * once), choices, marks, lines, Back restores the beat's starting board.
 */
const SenseiScreen: React.FC<SenseiScreenProps> = ({ topic, onExit }) => {
  const { width, height } = useWindowDimensions();
  const BOARD_PX = Math.max(1, Math.min(width*.86, height-440));
  const { mode: themeMode } = useTheme();
  const lesson = SENSEI_LESSONS.find((l) => l.id === topic);

  const [ready,setReady]=useState(false);
  const [bookmarkNotice,setBookmarkNotice]=useState<string|null>(null);
  const [confirmExit,setConfirmExit]=useState(false);
  const [bookmarkStatus,setBookmarkStatus]=useState<'none'|'saving'|'saved'|'failed'>('none');
  const bookmarkRevision=useRef(0),finishing=useRef(false);
  const [board, setBoard] = useState<Intersection[][]>(() => createEmptyBoard(9));
  const [history, setHistory] = useState<string[]>(() => [getBoardString(createEmptyBoard(9))]);
  const [beatIdx, setBeatIdx] = useState(0);
  const [solved,setSolved]=useState(false);
  const [tapIdx, setTapIdx] = useState(0);
  const [nudge, setNudge] = useState<string | null>(null);
  const [targets, setTargets] = useState<Point[]>([]);
  const [marks, setMarks] = useState<{ x: number; y: number; c?: 'black' | 'white' }[]>([]);
  const [lines, setLines] = useState<{ axis: 'row' | 'col'; index: number }[]>([]);
  const attempts=useRef(0);
  const solvedRef=useRef(false);
  const activeBeat=useRef(-1);

  const beat: SenseiBeat | undefined = lesson?.beats[beatIdx];

  const setupBeat = (idx: number) => {
    if (!lesson) return;
    const bt = lesson.beats[idx];
    if (!bt) return;
    const b=lessonBoard(lesson,idx);
    setBoard(b);setHistory([getBoardString(b)]);
    setBeatIdx(idx);activeBeat.current=idx;attempts.current=0;solvedRef.current=false;
    setTapIdx(0);setSolved(false);
    setNudge(null);
    if(bt.unmarked)setTargets([]);
    else if (bt.choices) setTargets(bt.choices.map((c) => ({ x: c.x, y: c.y })));
    else if (bt.taps && bt.taps.length > 0) setTargets([bt.taps[0]]);
    else setTargets([]);
    setMarks((bt.marks || []).map((m) => ({ x: m.x, y: m.y, c: m.c || 'black' })));
    setLines(bt.lines || []);
  };

  useEffect(() => {
    let cancelled=false;
    setReady(false);setBookmarkNotice(null);setBookmarkStatus('none');finishing.current=false;
    getViewedStudyProgress().then(state=>{if(cancelled||!lesson)return;setupBeat(resumeBeat(lesson,state.current[topic]));setBookmarkNotice(state.readFailed?'Your viewed bookmark could not be loaded. Starting at the beginning; existing saved data has been retained.':state.earlier[topic]?'This lesson has changed, or its earlier version cannot be verified. Starting at the beginning; your earlier bookmark is retained.':null);setReady(true);});
    return ()=>{cancelled=true;activeBeat.current=-1;bookmarkRevision.current++;};
  }, [topic]);
  useEffect(()=>{const subscription=BackHandler.addEventListener('hardwareBackPress',()=>{setConfirmExit(true);return true;});return()=>subscription.remove();},[]);

  const wrongTap = (msg: string) => {
    setNudge(msg);
    // Keep the explanation visible until the learner answers or changes beat.
  };

  const advance = () => {
    if (!ready||!lesson||finishing.current) return;
    const final=beatIdx+1>=lesson.beats.length;
    const next=final?lesson.beats.length-1:beatIdx+1;
    const revision=++bookmarkRevision.current;
    setBookmarkStatus('saving');
    if(final)finishing.current=true;
    else setupBeat(next);
    void saveSenseiProgress(topic,next).then(saved=>{
      if(activeBeat.current<0||revision!==bookmarkRevision.current)return;
      setBookmarkStatus(saved?'saved':'failed');
      if(final){
        finishing.current=false;
        if(saved)onExit();
        else setNudge('This device could not save your lesson bookmark. Tap the button to retry, or use Exit Lesson to leave without saving it.');
      }
    });
  };

  const placeStudent = (p: Point): boolean => {
    if (board[p.y][p.x]) return false;
    if (isSelfCapture(board, p, beat?.studentColor||'black')) return false;
    const temp = board.map((row) => [...row]);
    temp[p.y][p.x] = beat?.studentColor||'black';
    const { newBoard, captureCount } = checkCaptures(temp, p, beat?.studentColor||'black');
    void captureCount;
    const boardStr = getBoardString(newBoard);
    if (history.includes(boardStr)) return false; // ko
    setBoard(newBoard);
    setHistory((h) => [...h, boardStr]);
    return true;
  };

  const onBoardTap = (p: Point) => {
    if (!ready||!beat||solvedRef.current) return;
    if (beat.choices) {
      if(beat.unmarked)attempts.current++;
      const choice = beat.choices.find((c) => c.x === p.x && c.y === p.y);
      if (choice && choice.correct) {
        if (!placeStudent(p)) {
          wrongTap('Hmm, that move is not legal here.');
          return;
        }
        if(beat.unmarked){
          solvedRef.current=true;setSolved(true);setNudge(null);
          const index=beatIdx;
          void savePracticeSolve(lesson!,index,attempts.current).then(saved=>{if(!saved&&activeBeat.current===index)setNudge('Solved, but this device could not save the practice record.');});
        }else advance();
      } else if (choice) {
        wrongTap(choice.nudge || 'Not quite — look again.');
      } else {
        wrongTap(beat.unmarked?'Read the requested local result and count the relevant liberties. Try another point.':beat.nudge || 'Tap one of the glowing points.');
      }
      return;
    }
    if (beat.taps && beat.taps.length > 0) {
      const t = beat.taps[tapIdx];
      if (t && p.x === t.x && p.y === t.y) {
        if (beat.demoWhite) {
          advance(); // demo: the next beat's diagram shows White's move
          return;
        }
        if (!placeStudent(p)) {
          wrongTap('Hmm, that move is not legal here.');
          return;
        }
        const ni = tapIdx + 1;
        if (ni >= (beat.taps?.length || 0)) advance();
        else {
          setTapIdx(ni);
          setTargets([beat.taps[ni]]);
        }
      } else {
        wrongTap(beat.nudge || 'Not quite — tap the glowing point.');
      }
      return;
    }
    // Say beats: taps do nothing.
  };

  if (!lesson || !beat) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={{flex:1}} edges={['top','right','bottom','left']}>
        <Text style={styles.error}>Lesson not found.</Text>
        <Pressable onPress={onExit} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  const isInteractive = !solved && !!((beat.taps && beat.taps.length > 0) || beat.choices);
  const buttonLabel = isInteractive ? undefined : beat.button === null ? undefined : beat.button || 'Next';
  const mood: SenseiMood = beat.mood;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <DojoBackdrop/>
      <SafeAreaView style={{flex:1}} edges={['top','right','bottom','left']}>
      <ScrollView style={{opacity: ready ? 1 : 0}} pointerEvents={ready ? 'auto' : 'none'} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <GuideHeader boardSize={lesson.boardSize||9}/>
        {bookmarkNotice&&<Text accessibilityRole="alert" style={{color:'rgba(255,255,255,0.7)',textAlign:'center',paddingHorizontal:20,paddingBottom:10}}>{bookmarkNotice}</Text>}
        <View style={styles.boardPad}>
          <Board
            board={board}
            lastMove={null}
            onIntersectionPress={onBoardTap}
            turn={beat.studentColor||'black'}
            boardPx={BOARD_PX}
            interactive={ready}
            showLiberties={!beat.unmarked}
            showLifeStatus={!beat.unmarked}
            hideAtari={!!beat.unmarked}
            theme={themeMode === 'light' ? 'washi' : 'classic'}
            targets={targets}
            marks={marks}
            lines={lines}
          />
        </View>

        {/* Sensei card — below the board, never covering it */}
        <View style={[styles.cardWrap,{width:BOARD_PX}]}>
          <View style={styles.card}><GlassBackdrop/>
            <View style={styles.cardHeader}>
              <Sensei mood={mood} size={28} />
              <View style={styles.cardHeadText}>
                <Text style={styles.partLabel}>
                  Part {beatIdx + 1} of {lesson.beats.length} · {lesson.title}
                </Text>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {beat.title}
                </Text>
              </View>
              <Pressable onPress={()=>setConfirmExit(true)} style={styles.exitBtn} accessibilityLabel="Exit lesson">
                <Text style={styles.exitText}>✕</Text>
              </Pressable>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${((beatIdx + 1) / lesson.beats.length) * 100}%` }]} />
            </View>
            {/* Beat text transitions: fade+slide on every beat change */}
            <AnimatedView key={beatIdx}  style={styles.cardBody}>
              <Text style={styles.cardText}>{renderMarkup(solved&&beat.feedback?beat.feedback:beat.text,'sensei')}</Text>
              {solved&&beat.unmarked&&<Text style={styles.nudge}>Solved · {attempts.current} {attempts.current===1?'attempt':'attempts'}</Text>}
              {nudge && <Text accessibilityLiveRegion="polite" style={styles.nudge}>{nudge}</Text>}
              {beat.chips && (
                <View style={styles.chips}>
                  {beat.chips.map((c) => (
                    <View key={c.label} style={styles.chip}>
                      <Text style={styles.chipText}>
                        {c.label} <Text style={styles.chipValue}>{c.value}</Text>
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </AnimatedView>
            <View style={styles.btnRow}>
              {beatIdx > 0 && (
                <Pressable onPress={() => setupBeat(beatIdx - 1)} style={styles.backCardBtn}>
                  <Text style={styles.backCardText}>← Back</Text>
                </Pressable>
              )}
              {buttonLabel && (
                <Pressable onPress={advance} style={styles.nextBtn}>
                  <Text style={styles.nextText}>{buttonLabel}</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
        <GuideActions width={BOARD_PX}/>
      </ScrollView>
      </SafeAreaView>
      {bookmarkStatus==='failed'&&<Text accessibilityRole="alert" style={{color:'#fcd34d',textAlign:'center',paddingHorizontal:20,paddingVertical:6}}>Lesson bookmark could not be saved on this device.</Text>}
      <Dialog dialog={confirmExit?{title:'Exit Lesson?',description:bookmarkStatus==='saved'?'Your viewed bookmark is saved on this device. Independent practice results are saved separately.':bookmarkStatus==='saving'?'Your viewed bookmark is still being saved. Leaving now may lose the latest bookmark.':bookmarkStatus==='failed'?'This device could not save your latest viewed bookmark. Exiting may lose it; previously saved progress is retained.':'There is no newly saved viewed bookmark for this visit. You can exit or continue the lesson.',confirmLabel:'Exit Lesson',danger:true,confirm:onExit}:null} onClose={()=>setConfirmExit(false)}/>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, alignItems: 'center', paddingTop: 14, paddingBottom: 32, paddingHorizontal: 16 },
  kicker: {
    color: 'rgba(255,255,255,0.30)',
    fontSize: 9,
    letterSpacing: 4,
    textTransform: 'uppercase',
    fontWeight: '500',
    marginBottom: 10,
  },
  boardPad: { padding: 2 },
  error: { color: C.amber100, fontSize: 16, textAlign: 'center', marginTop: 60 },
  backBtn: { marginTop: 24, padding: 8, alignSelf: 'center' },
  backText: { fontFamily: SERIF, fontSize: 12, color: C.white30, textTransform: 'uppercase', letterSpacing: 3 },

  cardWrap: { width: '100%', maxWidth: 420, marginTop: 8 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(254,243,199,.15)',
    backgroundColor: 'rgba(255,255,255,.03)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.7,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardHeadText: { flex: 1, minWidth: 0 },
  partLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: 'rgba(253,230,138,0.70)',
    fontWeight: '700',
    marginBottom: 2,
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
  chip: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.white10,
    backgroundColor: 'rgba(252,211,77,0.10)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { fontSize: 11, fontWeight: '700', color: '#fde68a' },
  chipValue: { fontVariant: ['tabular-nums'] },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  backCardBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: C.white05,
    borderWidth: 1,
    borderColor: C.white10,
  },
  backCardText: { color: 'rgba(255,255,255,0.60)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  nextBtn: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: C.white05,
    borderWidth: 1,
    borderColor: C.white10,
    alignItems: 'center',
  },
  nextText: { color: 'rgba(255,255,255,.60)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
});

export default SenseiScreen;
