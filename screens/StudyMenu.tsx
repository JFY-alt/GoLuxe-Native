import {SafeAreaView} from 'react-native-safe-area-context';
import MenuBackdrop from '../components/MenuBackdrop';
import {MENU_VIDEOS} from '../config/homeCinema';
import { Pressable, ScrollView, StatusBar, Text, View } from '../ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import {getViewedStudyProgress} from '../storage/studyProgress';
export {SENSEI_PROGRESS_KEY,getSenseiProgress,saveSenseiProgress} from '../storage/studyProgress';
import Svg, { Circle } from 'react-native-svg';
import { SENSEI_LESSONS } from '../data/senseiLessons';
import { C, SERIF } from '../theme';

export const SENSEI_TOPICS = [
    {id:'practice',title:'Independent Practice',desc:'Read without hints · Black and White to play'},
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
    { id: 'ladders', title: 'Ladders & Reading', desc: 'Follow a full ladder · compare a ladder breaker' },
    { id: 'nets', title: 'Nets & Escape Routes', desc: 'Read the gaps · test captures and supporting stones' },
  ];

// Counts reflect the current native curriculum.
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
  const [transitioning,setTransitioning]=useState(false);
  const busy=useRef(false),mounted=useRef(true);
  const cardsOpacity=useRef(new Animated.Value(1)).current;
  useEffect(()=>{
    mounted.current=true;
    return ()=>{mounted.current=false;cardsOpacity.stopAnimation();};
  },[cardsOpacity]);
  // Wait for React to commit the new cards before beginning their entrance.
  useEffect(()=>{
    if(!busy.current)return;
    Animated.timing(cardsOpacity,{toValue:1,duration:550,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start(({finished})=>{
      if(finished&&mounted.current){busy.current=false;setTransitioning(false);}
    });
  },[page,cardsOpacity]);
  const perPage=6,totalPages=Math.ceil(SENSEI_TOPICS.length/perPage);
  const goToPage=(next:number)=>{
    if(next===page||next<0||next>=totalPages||busy.current)return;
    busy.current=true;setTransitioning(true);
    Animated.timing(cardsOpacity,{toValue:0,duration:350,easing:Easing.inOut(Easing.ease),useNativeDriver:true}).start(({finished})=>{
      if(finished&&mounted.current)setPage(next);
    });
  };
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [progressReadFailed,setProgressReadFailed]=useState(false);

  const load = useCallback(() => {
    getViewedStudyProgress().then(state=>{setProgress(state.current);setProgressReadFailed(state.readFailed);});
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
      <Text style={styles.heading}>Study Room</Text>
      {progressReadFailed&&<Text accessibilityRole="alert" style={{color:'rgba(255,255,255,0.7)',textAlign:'center',paddingHorizontal:20}}>Viewed bookmarks could not be loaded. Saved data has been retained.</Text>}
      <ScrollView style={{flex:1}} contentContainerStyle={styles.center} showsVerticalScrollIndicator={false}>
        <Animated.View pointerEvents={transitioning?'none':'auto'} style={[styles.cards,{opacity:cardsOpacity}]}>
          {SENSEI_TOPICS.slice(page*perPage,(page+1)*perPage).map((topic) => {
            const total = SENSEI_BEAT_COUNTS[topic.id] || 1;
            const reached = progress[topic.id];
            const percent = reached === undefined ? 0 : Math.min(100, ((reached + 1) / total) * 100);
            return (
              <Pressable key={topic.id} disabled={transitioning} onPress={() => onSelect(topic.id)} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{topic.title}</Text>
                </View>
                <View accessible accessibilityLabel={`Viewed ${Math.round(percent)} percent`}><ProgressRing percent={percent} /></View>
              </Pressable>
            );
          })}
        </Animated.View>
      </ScrollView>
        <Animated.View pointerEvents={transitioning?'none':'auto'} style={[styles.pagination,{opacity:cardsOpacity}]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous study page"
            accessibilityState={{disabled: page === 0 || transitioning}} disabled={page === 0 || transitioning}
            onPress={() => goToPage(page - 1)}
            style={({pressed}) => [styles.pageButton, page === 0 && styles.hiddenButton, pressed && styles.cardPressed]}>
            <Text style={styles.pageButtonText}>‹ Previous</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Next study page"
            accessibilityState={{disabled: page === totalPages - 1 || transitioning}} disabled={page === totalPages - 1 || transitioning}
            onPress={() => goToPage(page + 1)}
            style={({pressed}) => [styles.pageButton, page === totalPages - 1 && styles.hiddenButton, pressed && styles.cardPressed]}>
            <Text style={styles.pageButtonText}>Next ›</Text>
          </Pressable>
        </Animated.View>
        <Pressable accessibilityRole="button" onPress={onBack}
          style={({pressed}) => [styles.backBtn, pressed && styles.cardPressed]}>
          <Text style={styles.backText}>Back to menu</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  resume:{fontSize:9,color:'rgba(252,211,77,.70)',textTransform:'uppercase',letterSpacing:1},
  pagination: { width: '100%', maxWidth: 420, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'center', paddingHorizontal: 24, marginTop: 12 },
  pageButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  hiddenButton: { opacity: 0 },
  pageButtonText: { fontFamily: SERIF, fontSize: 16, color: C.amber50, letterSpacing: 0.5 },
  root: { flex: 1, backgroundColor: '#000' },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 12 },
  heading: { fontFamily: SERIF, fontSize: 24, color: C.amber50, letterSpacing: -0.5, paddingTop: 24, paddingHorizontal: 24, marginBottom: 20, textAlign: 'center' },
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
  backBtn: { alignSelf: 'center', marginBottom: 16, marginTop: 8, minHeight: 44, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  backText: { fontFamily: SERIF, fontSize: 12, color: C.white30, textTransform: 'uppercase', letterSpacing: 3 },
});

export default StudyMenu;
