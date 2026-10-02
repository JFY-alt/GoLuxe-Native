import MenuIcon from '../components/MenuIcon';
import { Pressable, ScrollView, StatusBar, Text, View, LinearGradient } from '../ui';
import React from 'react';
import { StyleSheet } from 'react-native';

import { C, SERIF } from '../theme';

export type GameMode = 'passPlay' | 'vsAI';

interface GameModeMenuProps {
  onSelectMode: (mode: GameMode) => void;
  onBack: () => void;
}

/** Matches the web GameModeMenu: dark bg, amber wash, large option cards. */
const GameModeMenu: React.FC<GameModeMenuProps> = ({ onSelectMode, onBack }) => {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0d0d0d', '#0d0d0d']} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(254,243,199,0.05)', 'rgba(254,243,199,0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <ScrollView contentContainerStyle={styles.center} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Select Mode</Text>
        <View style={styles.cards}>
          <Pressable onPress={() => onSelectMode('passPlay')} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
            <View>
              <Text style={styles.cardTitle}>Pass & Play</Text>
              <Text style={styles.cardSub}>Local Multiplayer / Practice</Text>
            </View>
            <View style={styles.cardIcon}>
              <MenuIcon kind="phone" />
            </View>
          </Pressable>
          <Pressable onPress={() => onSelectMode('vsAI')} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
            <View>
              <Text style={styles.cardTitle}>Vs. AI</Text>
              <Text style={styles.cardSub}>Challenge the Digital Sage</Text>
            </View>
            <View style={styles.cardIcon}>
              <MenuIcon kind="robot" />
            </View>
          </Pressable>
          <View style={[styles.card, styles.cardDisabled]}>
            <View>
              <Text style={[styles.cardTitle, { color: C.white20 }]}>Online Play</Text>
              <Text style={[styles.cardSub, { color: C.white10 }]}>Coming Soon</Text>
            </View>
            <View style={[styles.cardIcon, { borderColor: C.white05 }]}>
              <MenuIcon kind="globe" disabled />
            </View>
          </View>
        </View>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  heading: { fontFamily: SERIF, fontSize: 30, color: C.amber50, letterSpacing: -0.5, marginBottom: 48 },
  cards: { width: '100%', maxWidth: 420, gap: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.white10,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardPressed: { backgroundColor: C.white05 },
  cardDisabled: { backgroundColor: '#111', borderColor: C.white05, opacity: 0.5 },
  cardTitle: { fontFamily: SERIF, fontSize: 18, color: C.amber50, letterSpacing: 0.5 },
  cardSub: { fontSize: 10, color: C.white30, textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.white10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: { color: C.white40, fontSize: 18, marginTop: -2 },
  backBtn: { marginTop: 64, padding: 8 },
  backText: { fontFamily: SERIF, fontSize: 12, color: C.white30, textTransform: 'uppercase', letterSpacing: 3 },
});

export default GameModeMenu;
