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
  { id: 'opening', title: 'Opening Theory', desc: 'First moves and Joseki' },
  { id: 'balances', title: 'The Balances', desc: 'High & low, thick & thin, sente & gote, connection & cutting' },
  { id: 'strategies', title: 'Other Strategies', desc: 'Ko Fighting, Direction of Play' },
  { id: 'endgame', title: 'Endgame', desc: 'Final points and reduction' },
  { id: 'moves', title: 'Essential Moves', desc: 'Bonus: monkey jump, hane, peep, attachment' },
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
          {SENSEI_TOPICS.map((topic) => {
            const total = SENSEI_BEAT_COUNTS[topic.id] || 1;
            const reached = progress[topic.id];
            const percent = reached === undefined ? 0 : Math.min(100, ((reached + 1) / total) * 100);
            return (
              <Pressable key={topic.id} onPress={() => onSelect(topic.id)} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{topic.title}</Text>
                  <Text style={styles.cardSub}>{topic.desc}</Text>
                </View>
                <ProgressRing percent={percent} />
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  heading: { fontFamily: SERIF, fontSize: 24, color: C.amber50, letterSpacing: -0.5, marginBottom: 20 },
  cards: { width: '100%', maxWidth: 420, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
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
