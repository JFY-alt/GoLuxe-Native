import React, { useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Player } from '../types';
import { C, SERIF } from '../theme';

export type AiDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'master';

export interface AiConfig {
  userColor: Player;
  difficulty: AiDifficulty;
}

interface AiSetupMenuProps {
  onStart: (config: AiConfig) => void;
  onBack: () => void;
}

const DIFFICULTIES: { id: AiDifficulty; label: string; desc: string }[] = [
  { id: 'beginner', label: 'Learning', desc: 'Still learning the rules • misses tactics' },
  { id: 'intermediate', label: 'Casual', desc: 'Plays sensibly • beatable' },
  { id: 'advanced', label: 'Sharp', desc: 'Reads a few moves ahead' },
  { id: 'master', label: 'Deep', desc: 'Thinks several seconds per move • slowest, strongest' },
];

/** Matches the web AiSetupMenu: color picker, difficulty grid, gold Start button. */
const AiSetupMenu: React.FC<AiSetupMenuProps> = ({ onStart, onBack }) => {
  const [color, setColor] = useState<Player>('black');
  const [difficulty, setDifficulty] = useState<AiDifficulty>('beginner');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['rgba(254,243,199,0.05)', 'rgba(254,243,199,0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <ScrollView contentContainerStyle={styles.center} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Vs. AI Setup</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Your Color</Text>
          <View style={styles.row}>
            {(['black', 'white'] as Player[]).map((c) => {
              const active = color === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={[styles.colorBtn, active && styles.colorBtnActive]}
                >
                  <View
                    style={[
                      styles.dot,
                      c === 'black'
                        ? { backgroundColor: '#000', borderColor: 'rgba(255,255,255,0.20)' }
                        : { backgroundColor: '#fff', borderColor: 'rgba(255,255,255,0.10)' },
                    ]}
                  />
                  <Text style={[styles.colorLabel, active && styles.activeText]}>
                    {c === 'black' ? 'Black' : 'White'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Difficulty</Text>
          <View style={styles.diffGrid}>
            {DIFFICULTIES.map((d) => {
              const active = difficulty === d.id;
              return (
                <Pressable
                  key={d.id}
                  onPress={() => setDifficulty(d.id)}
                  style={[styles.diffBtn, active && styles.diffBtnActive]}
                >
                  <Text style={[styles.diffLabel, active && styles.activeText]}>{d.label}</Text>
                  <Text style={[styles.diffDesc, active && { color: 'rgba(255,251,235,0.60)' }]}>{d.desc}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable onPress={() => onStart({ userColor: color, difficulty })} style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.85 }]}>
          <Text style={styles.startText}>Start Game</Text>
        </Pressable>
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
  heading: { fontFamily: SERIF, fontSize: 30, color: C.amber50, letterSpacing: -0.5, marginBottom: 32 },
  section: { width: '100%', maxWidth: 480, marginBottom: 24 },
  label: { fontSize: 10, color: C.white40, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700', marginLeft: 4, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 16 },
  colorBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.white10,
    alignItems: 'center',
    gap: 8,
  },
  colorBtnActive: { backgroundColor: C.white10, borderColor: 'rgba(255,255,255,0.30)' },
  dot: { width: 24, height: 24, borderRadius: 12, borderWidth: 1 },
  colorLabel: { fontFamily: SERIF, fontSize: 12, color: C.white30, textTransform: 'uppercase', letterSpacing: 2 },
  activeText: { color: C.amber50 },
  diffGrid: { gap: 12 },
  diffBtn: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.white10,
  },
  diffBtnActive: { backgroundColor: C.white10, borderColor: 'rgba(255,255,255,0.30)' },
  diffLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: C.white30, marginBottom: 4 },
  diffDesc: { fontFamily: SERIF, fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  startBtn: {
    width: '100%',
    maxWidth: 480,
    paddingVertical: 16,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(254,243,199,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.20)',
    alignItems: 'center',
  },
  startText: { color: C.amber100, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 3 },
  backBtn: { marginTop: 24, padding: 8 },
  backText: { fontFamily: SERIF, fontSize: 12, color: C.white30, textTransform: 'uppercase', letterSpacing: 3 },
});

export default AiSetupMenu;
