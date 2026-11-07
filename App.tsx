import React, { useState, useRef, useEffect } from 'react';
import { ThemeProvider, ThemeScope, useTheme, View, StatusBar } from './ui';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BackHandler, ActivityIndicator, StatusBar as NativeStatusBar } from 'react-native';
import { useFonts } from 'expo-font';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import MainMenu from './screens/MainMenu';
import GameModeMenu, { GameMode } from './screens/GameModeMenu';
import AiSetupMenu, { AiConfig } from './screens/AiSetupMenu';
import PassAndPlaySubMenu from './screens/PassAndPlaySubMenu';
import TimedSetupMenu from './screens/TimedSetupMenu';
import WhatIsGoMenu from './screens/WhatIsGoMenu';
import StudyMenu from './screens/StudyMenu';
import SenseiScreen from './screens/SenseiScreen';
import TutorialScreen from './screens/TutorialScreen';
import GameScreen from './screens/GameScreen';
import { ScreenFade } from './components/ScreenFade';
import { C } from './theme';
import UpdatePrompt from './components/UpdatePrompt';
import { TimeSettings } from './types';
import {LiveSession} from './logic/gameSession';
import {loadSession} from './storage/gameSession';
import Dialog,{DialogState} from './components/Dialog';

type Screen =
  | 'menu'
  | 'modes'
  | 'aiSetup'
  | 'passPlaySub'
  | 'timedSetup'
  | 'whatIsGo'
  | 'howToPlay'
  | 'study'
  | 'sensei'
  | 'game';

function Navigator() {
  const { mode: themeMode } = useTheme();
  const opacity = useSharedValue(0);
  // Keep full-screen video and blur at the viewport size throughout navigation.
  const routeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [screen, changeScreen] = useState<Screen>('menu');
  const introSeen=useRef(false);
  const cinemaMenu=['menu','modes','aiSetup','passPlaySub','timedSetup','study'].includes(screen);
  const setScreen = (next: Screen) => {
    if (navTimer.current) return;
    opacity.value = withTiming(0, { duration: 500 });
    navTimer.current = setTimeout(() => {
      changeScreen(next);
      navTimer.current = null;
    }, 500);
  };
  // Start the incoming fade after the new route has committed, not while the
  // outgoing route is still mounted at the end of the navigation timer.
  useEffect(() => { opacity.value = withTiming(1, { duration: screen==='menu'?700:500 }); }, [screen]);
  useEffect(() => () => { if (navTimer.current) clearTimeout(navTimer.current); }, []);
  useEffect(() => {
    const back: Partial<Record<Screen, Screen>> = { modes: 'menu', aiSetup: 'modes', passPlaySub: 'modes', timedSetup: 'passPlaySub', whatIsGo: 'menu', howToPlay: 'menu', study: 'menu', sensei: 'study' };
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (['game','sensei','howToPlay'].includes(screen)) return false; // Each session owns its exit confirmation.
      if (!back[screen]) return false;
      setScreen(back[screen]!); return true;
    });
    return () => subscription.remove();
  }, [screen]);
  const [mode, setMode] = useState<'ai' | '2p'>('2p');
  const [aiConfig, setAiConfig] = useState<AiConfig | null>(null);
  const [timeSettings, setTimeSettings] = useState<TimeSettings | null>(null);
  const [senseiTopic, setSenseiTopic] = useState<string>('fundamentals');
  const [gameKey, setGameKey] = useState(0);
  const [savedSession,setSavedSession]=useState<LiveSession|null>(null);
  const [initialSession,setInitialSession]=useState<LiveSession|null>(null);
  const [recoveryError,setRecoveryError]=useState<string|null>(null);
  const [recoveryDialog,setRecoveryDialog]=useState<DialogState|null>(null);
  useEffect(()=>{
    if(screen!=='menu')return;
    let live=true;
    loadSession().then(s=>{if(live){setSavedSession(s);setRecoveryError(null);}},()=>{if(live)setRecoveryError('Could not read game recovery. Saved data has been preserved.');});
    return()=>{live=false;};
  },[screen]);
  const resumeGame=async()=>{
    try {
      const s=await loadSession();if(!s){setSavedSession(null);return;}
      setInitialSession(s);setMode(s.mode);setAiConfig(s.aiConfig);setTimeSettings(s.timeSettings);
      setGameKey(k=>k+1);setRecoveryError(null);setScreen('game');
    }catch{setRecoveryDialog({title:'Could Not Recover Game',description:'The saved session could not be read. Its data has been preserved.'});}
  };

  const beginNewGame = (m: 'ai' | '2p', cfg: AiConfig | null, ts: TimeSettings | null = null) => {
    setInitialSession(null);
    setMode(m);
    setAiConfig(cfg);
    setTimeSettings(ts);
    setGameKey((k) => k + 1);
    setScreen('game');
  };
  const startGame=async(m:'ai'|'2p',cfg:AiConfig|null,ts:TimeSettings|null=null)=>{
    try {
      const previous=await loadSession();
      if(previous)setRecoveryDialog({title:'Replace Saved Game?',description:'Starting a new game replaces the automatic recovery slot. Your manually saved records remain available. Cancel to keep the saved game, then return home to resume it.',confirmLabel:'Start New Game',danger:true,confirm:()=>beginNewGame(m,cfg,ts)});
      else beginNewGame(m,cfg,ts);
    }catch{setRecoveryDialog({title:'Could Not Read Saved Game',description:'A new game cannot replace unreadable recovery data. The saved data has been preserved.'});}
  };

  const handleSelectMode = (m: GameMode) => {
    if (m === 'vsAI') setScreen('aiSetup');
    else setScreen('passPlaySub');
  };

  return (
    <SafeAreaView edges={[]} style={[styles.root, { backgroundColor: '#000' }]}>{cinemaMenu?<NativeStatusBar barStyle="light-content"/>:<StatusBar />}<Animated.View style={[{ flex: 1 }, routeStyle]}><ThemeScope mode={cinemaMenu?'dark':themeMode}>
      <View pointerEvents={screen==='menu'?'auto':'none'} accessibilityElementsHidden={screen!=='menu'} importantForAccessibility={screen==='menu'?'auto':'no-hide-descendants'} style={[StyleSheet.absoluteFill,{opacity:screen==='menu'?1:0}]}>
        <ScreenFade key="menu">
          <MainMenu
            active={screen==='menu'}
            introSeen={introSeen.current}
            onIntroSeen={()=>{introSeen.current=true;}}
            onPlay={() => setScreen('modes')}
            onResume={savedSession||recoveryError?()=>{void resumeGame();}:undefined}
            recoveryError={recoveryError}
            onWhatIsGo={() => setScreen('whatIsGo')}
            onHowToPlay={() => setScreen('howToPlay')}
            onStudy={() => setScreen('study')}
          />
        </ScreenFade>
      </View>
      {screen === 'modes' && (
        <ScreenFade key="modes">
          <GameModeMenu onSelectMode={handleSelectMode} onBack={() => setScreen('menu')} />
        </ScreenFade>
      )}
      {screen === 'aiSetup' && (
        <ScreenFade key="aiSetup">
          <AiSetupMenu
            onStart={(cfg) => startGame('ai', cfg)}
            onBack={() => setScreen('modes')}
          />
        </ScreenFade>
      )}
      {screen === 'passPlaySub' && (
        <ScreenFade key="passPlaySub">
          <PassAndPlaySubMenu
            onSelectSubMode={(sub) => (sub === 'timed' ? setScreen('timedSetup') : startGame('2p', null))}
            onBack={() => setScreen('modes')}
          />
        </ScreenFade>
      )}
      {screen === 'timedSetup' && (
        <ScreenFade key="timedSetup">
          <TimedSetupMenu
            onStart={(settings) => startGame('2p', null, settings)}
            onBack={() => setScreen('passPlaySub')}
          />
        </ScreenFade>
      )}
      {screen === 'whatIsGo' && (
        <ScreenFade key="whatIsGo">
          <WhatIsGoMenu
            onBack={() => setScreen('menu')}
            onBegin={() => setScreen('modes')}
            onHowToPlay={() => setScreen('howToPlay')}
          />
        </ScreenFade>
      )}
      {screen === 'study' && (
        <ScreenFade key="study">
          <StudyMenu
            onSelect={(topic) => {
              setSenseiTopic(topic);
              setScreen('sensei');
            }}
            onBack={() => setScreen('menu')}
          />
        </ScreenFade>
      )}
      {screen === 'sensei' && (
        <ScreenFade key={`sensei-${senseiTopic}`}>
          <SenseiScreen key={senseiTopic} topic={senseiTopic} onExit={() => setScreen('study')} />
        </ScreenFade>
      )}
      {screen === 'howToPlay' && (
        <ScreenFade key="howToPlay">
          <TutorialScreen
            onExit={() => setScreen('menu')}
            onFirstGame={() => startGame('ai', { userColor: 'black', difficulty: 'beginner' })}
            onStudy={() => setScreen('study')}
          />
        </ScreenFade>
      )}
      {screen === 'game' && (
        <GameScreen key={gameKey} mode={mode} aiConfig={aiConfig} timeSettings={timeSettings} initialSession={initialSession} onExit={() => setScreen('menu')} />
      )}
      <Dialog dialog={recoveryDialog} onClose={()=>setRecoveryDialog(null)}/>
    </ThemeScope></Animated.View></SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
});

export default function App() {
  const [loaded, error] = useFonts({
    CormorantGaramond_300: require('@expo-google-fonts/cormorant-garamond/300Light/CormorantGaramond_300Light.ttf'),
    CormorantGaramond_400: require('@expo-google-fonts/cormorant-garamond/400Regular/CormorantGaramond_400Regular.ttf'),
    CormorantGaramond_600: require('@expo-google-fonts/cormorant-garamond/600SemiBold/CormorantGaramond_600SemiBold.ttf'),
    CormorantGaramond_300_Italic: require('@expo-google-fonts/cormorant-garamond/300Light_Italic/CormorantGaramond_300Light_Italic.ttf'),
    CormorantGaramond_400_Italic: require('@expo-google-fonts/cormorant-garamond/400Regular_Italic/CormorantGaramond_400Regular_Italic.ttf'),
    CormorantGaramond_600_Italic: require('@expo-google-fonts/cormorant-garamond/600SemiBold_Italic/CormorantGaramond_600SemiBold_Italic.ttf'),
    Inter_300: require('@expo-google-fonts/inter/300Light/Inter_300Light.ttf'), Inter_400: require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'), Inter_600: require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
    Inter_300_Italic: require('@expo-google-fonts/inter/300Light_Italic/Inter_300Light_Italic.ttf'), Inter_400_Italic: require('@expo-google-fonts/inter/400Regular_Italic/Inter_400Regular_Italic.ttf'), Inter_600_Italic: require('@expo-google-fonts/inter/600SemiBold_Italic/Inter_600SemiBold_Italic.ttf'),
  });
  if (!loaded && !error) return <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={C.amber100} /></View>;
  return <SafeAreaProvider><ThemeProvider><Navigator /><UpdatePrompt /></ThemeProvider></SafeAreaProvider>;
}
