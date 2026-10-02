import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import MainMenu from './screens/MainMenu';
import GameModeMenu, { GameMode } from './screens/GameModeMenu';
import AiSetupMenu, { AiConfig } from './screens/AiSetupMenu';
import PassAndPlaySubMenu from './screens/PassAndPlaySubMenu';
import WhatIsGoMenu from './screens/WhatIsGoMenu';
import StudyMenu from './screens/StudyMenu';
import GameScreen from './screens/GameScreen';
import { C } from './theme';

type Screen =
  | 'menu'
  | 'modes'
  | 'aiSetup'
  | 'passPlaySub'
  | 'whatIsGo'
  | 'howToPlay'
  | 'study'
  | 'sensei'
  | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [mode, setMode] = useState<'ai' | '2p'>('2p');
  const [aiConfig, setAiConfig] = useState<AiConfig | null>(null);
  const [senseiTopic, setSenseiTopic] = useState<string>('fundamentals');
  const [gameKey, setGameKey] = useState(0);

  const startGame = (m: 'ai' | '2p', cfg: AiConfig | null) => {
    setMode(m);
    setAiConfig(cfg);
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
        <MainMenu
          onPlay={() => setScreen('modes')}
          onWhatIsGo={() => setScreen('whatIsGo')}
          onHowToPlay={() => setScreen('howToPlay')}
          onStudy={() => setScreen('study')}
        />
      )}
      {screen === 'modes' && (
        <GameModeMenu onSelectMode={handleSelectMode} onBack={() => setScreen('menu')} />
      )}
      {screen === 'aiSetup' && (
        <AiSetupMenu
          onStart={(cfg) => startGame('ai', cfg)}
          onBack={() => setScreen('modes')}
        />
      )}
      {screen === 'passPlaySub' && (
        <PassAndPlaySubMenu
          onSelectSubMode={() => startGame('2p', null)}
          onBack={() => setScreen('modes')}
        />
      )}
      {screen === 'whatIsGo' && (
        <WhatIsGoMenu
          onBack={() => setScreen('menu')}
          onBegin={() => setScreen('modes')}
          onHowToPlay={() => setScreen('howToPlay')}
        />
      )}
      {screen === 'study' && (
        <StudyMenu
          onSelect={(topic) => {
            setSenseiTopic(topic);
            setScreen('sensei');
          }}
          onBack={() => setScreen('menu')}
        />
      )}
      {screen === 'game' && (
        <GameScreen key={gameKey} mode={mode} aiConfig={aiConfig} onExit={() => setScreen('menu')} />
      )}
      {/* howToPlay + sensei screens land in the next increment */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
});
