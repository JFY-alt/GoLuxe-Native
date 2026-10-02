import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
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
import { TimeSettings } from './types';

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

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [mode, setMode] = useState<'ai' | '2p'>('2p');
  const [aiConfig, setAiConfig] = useState<AiConfig | null>(null);
  const [timeSettings, setTimeSettings] = useState<TimeSettings | null>(null);
  const [senseiTopic, setSenseiTopic] = useState<string>('fundamentals');
  const [gameKey, setGameKey] = useState(0);

  const startGame = (m: 'ai' | '2p', cfg: AiConfig | null, ts: TimeSettings | null = null) => {
    setMode(m);
    setAiConfig(cfg);
    setTimeSettings(ts);
    setGameKey((k) => k + 1);
    setScreen('game');
  };

  const handleSelectMode = (m: GameMode) => {
    if (m === 'vsAI') setScreen('aiSetup');
    else setScreen('passPlaySub');
  };

  return (
    <SafeAreaView style={styles.root}>
      {screen === 'menu' && (
        <ScreenFade key="menu">
          <MainMenu
            onPlay={() => setScreen('modes')}
            onWhatIsGo={() => setScreen('whatIsGo')}
            onHowToPlay={() => setScreen('howToPlay')}
            onStudy={() => setScreen('study')}
          />
        </ScreenFade>
      )}
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
        <GameScreen key={gameKey} mode={mode} aiConfig={aiConfig} timeSettings={timeSettings} onExit={() => setScreen('menu')} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
});
