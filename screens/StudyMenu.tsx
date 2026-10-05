import {SafeAreaView} from 'react-native-safe-area-context';
import MenuBackdrop from '../components/MenuBackdrop';
import {MENU_VIDEOS} from '../config/homeCinema';
import { Pressable, ScrollView, StatusBar, Text, View } from '../ui';
import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle } from 'react-native-svg';
import { SENSEI_LESSONS } from '../data/senseiLessons';
import { C, SERIF } from '../theme';

export const SENSEI_PROGRESS_KEY = 'goluxe-sensei-progress';

export async function getSenseiProgress(): Promise<Record<string, number>> {
  try {
    return JSON.parse((await AsyncStorage.getItem(SENSEI_PROGRESS_KEY)) || '{}');
  } catch {
    return {};
  }
}

export async function saveSenseiProgress(lessonId: string, beatIndex: number) {
  try {
    const p = await getSenseiProgress();
    p[lessonId] = Math.max(p[lessonId] || 0, beatIndex);
    await AsyncStorage.setItem(SENSEI_PROGRESS_KEY, JSON.stringify(p));
  } catch {}
}

export const SENSEI_TOPICS = [
    { id: 'fundamentals', title: '9×9 Fundamentals', desc: 'Liberties, tactics & counting' },
    { id: 'shape', title: 'Shape', desc: 'Good shape vs bad: bamboo, ponnuki, triangles' },
    { id: 'howtothink', title: 'How to Think', desc: 'The 4-step checklist for every move' },
    { id: 'opening', title: '9×9 Opening', desc: 'First moves on the small board' },
    { id: 'opening13', title: '13×13 Opening', desc: 'The bridge: corners, sides, faster fighting' },
    { id: 'opening19', title: '19×19 Opening', desc: 'Full board: joseki, tenuki, influence' },
    { id: 'mistakes', title: 'Common Mistakes', desc: 'Dead stones, empty peeps, first-line fever' },
    { id: 'balances', title: 'The Balances', desc: 'High & low, thick & thin, sente & gote, connection & cutting' },
    { id: 'strategies', title: 'Ko & Direction', desc: 'Ko fighting, direction of play, probing' },
    { id: 'endgame', title: 'Endgame', desc: 'Final points and reduction' },
    { id: 'moves', title: 'Essential Moves', desc: 'Bonus: monkey jump, hane, peep, attachment' },
    { id: 'finishing', title: 'Finishing & Scoring', desc: 'Passing, counting, komi, seki & handicap' },
  ];

// Beat counts mirror the web SENSEI_LESSONS (verified against data/senseiLessons.ts).
export const SENSEI_BEAT_COUNTS: Record<string, number> = Object.fromEntries(SENSEI_LESSONS.map(l => [l.id, l.beats.length]));

const ProgressRing: React.FC<{ percent: number }> = ({ percent }) => {
  const r = 13;
  const c = 2 * Math.PI * r;
  const filled = (Math.min(100, Math.max(0, percent)) / 100) * c;
  return (
    <View style={{ width: 32, height: 32 }}>
      <Svg width={32} height={32} viewBox="0 0 32 32" style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={16} cy={16} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={3} />
        <Circle
          cx={16}
          cy={16}
          r={r}
          fill="none"
          stroke="#fcd34d"
          strokeWidth={3}
          strokeDasharray={`${filled} ${c}`}
          strokeLinecap="round"
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill,{alignItems:'center',justifyContent:'center'}]}>
        <Text style={styles.ringText}>{Math.round(percent)}%</Text>
      </View>
    </View>
  );
};

interface StudyMenuProps {
  onSelect: (topic: string) => void;
  onBack: () => void;
}

/** Matches the web StudyMenu: 6 cards with progress rings, persisted via AsyncStorage. */
const StudyMenu: React.FC<StudyMenuProps> = ({ onSelect, onBack }) => {
  const [page,setPage]=useState(0);
  const perPage=6,totalPages=Math.ceil(SENSEI_TOPICS.length/perPage);
  const [progress, setProgress] = useState<Record<string, number>>({});

  const load = useCallback(() => {
    getSenseiProgress().then(setProgress);
  }, []);

  // Reload progress whenever the screen regains focus (no react-navigation here;
  // parent re-mounts on screen change, but keep the hook cheap and safe).
  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <MenuBackdrop source={MENU_VIDEOS.study}/>
      <SafeAreaView style={{flex:1}} edges={['top','right','bottom','left']}>
      <ScrollView contentContainerStyle={styles.center} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Study Room</Text>
        <View style={styles.cards}>
          {SENSEI_TOPICS.slice(page*perPage,(page+1)*perPage).map((topic) => {
            const total = SENSEI_BEAT_COUNTS[topic.id] || 1;
            const reached = progress[topic.id];
            const percent = reached === undefined ? 0 : Math.min(100, ((reached + 1) / total) * 100);
            return (
              <Pressable key={topic.id} onPress={() => onSelect(topic.id)} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{topic.title}{reached!==undefined&&reached<total-1&&<Text style={styles.resume}>  Resume</Text>}</Text>
                  <Text style={styles.cardSub}>{topic.desc}</Text>
                </View>
                <ProgressRing percent={percent} />
              </Pressable>
            );
          })}
        </View>
        <View style={styles.pageDots}>{Array.from({length:totalPages},(_,i)=><Pressable key={i} accessibilityLabel={`Page ${i+1}`} accessibilityState={{selected:page===i}} onPress={()=>setPage(i)} hitSlop={10} style={[styles.pageDot,{backgroundColor:page===i?'#fcd34d':C.white20}]}/>)}</View>
        <View style={styles.footer}>{page>0&&<Pressable onPress={()=>setPage(page-1)}><Text style={styles.backText}>← Prev</Text></Pressable>}
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        {page<totalPages-1&&<Pressable onPress={()=>setPage(page+1)}><Text style={styles.backText}>Next →</Text></Pressable>}</View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  resume:{fontSize:9,color:'rgba(252,211,77,.70)',textTransform:'uppercase',letterSpacing:1},
  pageDots:{flexDirection:'row',gap:12,marginTop:20},pageDot:{width:8,height:8,borderRadius:4},footer:{flexDirection:'row',gap:24,alignItems:'center',marginTop:16},
  root: { flex: 1, backgroundColor: '#000' },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  heading: { fontFamily: SERIF, fontSize: 24, color: C.amber50, letterSpacing: -0.5, marginBottom: 20 },
  cards: { width: '100%', maxWidth: 420, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.white10,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardPressed: { backgroundColor: C.white05 },
  cardText: { flex: 1, paddingRight: 16 },
  cardTitle: { fontFamily: SERIF, fontSize: 16, color: C.amber50, letterSpacing: 0.5, textAlign: 'left' },
  cardSub: { fontSize: 10, color: C.white30, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4, textAlign: 'left' },
  ringText: {
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 7,
    fontWeight: '700',
    color: 'rgba(254,243,199,0.80)',
  },
  backBtn: { marginTop: 28, padding: 8 },
  backText: { fontFamily: SERIF, fontSize: 12, color: C.white30, textTransform: 'uppercase', letterSpacing: 3 },
});

export default StudyMenu;
