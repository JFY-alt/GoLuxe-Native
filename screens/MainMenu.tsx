import React from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, SERIF } from '../theme';

interface MainMenuProps {
  onPlay: () => void;
  onWhatIsGo: () => void;
  onHowToPlay: () => void;
  onStudy: () => void;
}

/**
 * Home screen matching the web MainMenu:
 * black backdrop, giant serif GoLuxe title, "STRATEGIC PURITY" letterspaced
 * subtitle, ghost buttons (border-white/10, serif uppercase tracking).
 */
const MainMenu: React.FC<MainMenuProps> = ({ onPlay, onWhatIsGo, onHowToPlay, onStudy }) => {
  const btns: { label: string; fn: () => void }[] = [
    { label: 'What is Go?', fn: onWhatIsGo },
    { label: 'How to Play', fn: onHowToPlay },
    { label: 'Study', fn: onStudy },
    { label: 'Play', fn: onPlay },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      {/* deep dark backdrop with a faint amber wash from the top, like the web menus */}
      <LinearGradient
        colors={['#141210', '#0d0d0d', '#000000']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(254,243,199,0.06)', 'rgba(254,243,199,0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.45 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.center}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>GoLuxe</Text>
          <Text style={styles.subtitle}>Strategic Purity</Text>
        </View>
        <View style={styles.buttons}>
          {btns.map((b) => (
            <Pressable key={b.label} onPress={b.fn} style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
              <Text style={styles.btnText}>{b.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  titleBlock: { alignItems: 'center', marginBottom: 56 },
  title: {
    fontFamily: SERIF,
    fontSize: 76,
    color: C.amber50,
    letterSpacing: -2,
    lineHeight: 80,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  subtitle: {
    color: 'rgba(254,243,199,0.60)',
    fontWeight: '300',
    fontSize: 12,
    letterSpacing: 9,
    textTransform: 'uppercase',
    marginTop: 10,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  buttons: { width: '100%', gap: 18, alignItems: 'center' },
  btn: {
    paddingHorizontal: 32,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.white10,
    backgroundColor: 'rgba(0,0,0,0.30)',
    minWidth: 220,
    alignItems: 'center',
  },
  btnPressed: { backgroundColor: C.white05 },
  btnText: {
    fontFamily: SERIF,
    color: C.white40,
    fontSize: 12,
    letterSpacing: 3.2,
    textTransform: 'uppercase',
  },
});

export default MainMenu;
