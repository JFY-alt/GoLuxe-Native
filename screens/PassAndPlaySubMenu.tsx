import React from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, SERIF } from '../theme';

interface PassAndPlaySubMenuProps {
  onSelectSubMode: (mode: 'casual' | 'timed') => void;
  onBack: () => void;
}

/** Matches the web PassAndPlaySubMenu. */
const PassAndPlaySubMenu: React.FC<PassAndPlaySubMenuProps> = ({ onSelectSubMode, onBack }) => {
  const items = [
    { id: 'casual' as const, title: 'Casual Go', sub: 'Practice & Exploration' },
    { id: 'timed' as const, title: 'Timed Go', sub: 'Official Clocks' },
  ];
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
        <Text style={styles.heading}>Pass & Play</Text>
        <View style={styles.cards}>
          {items.map((it) => (
            <Pressable key={it.id} onPress={() => onSelectSubMode(it.id)} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
              <View>
                <Text style={styles.cardTitle}>{it.title}</Text>
                <Text style={styles.cardSub}>{it.sub}</Text>
              </View>
              <View style={styles.cardIcon}>
                <Text style={styles.cardIconText}>›</Text>
              </View>
            </Pressable>
          ))}
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
  heading: { fontFamily: SERIF, fontSize: 30, color: C.amber50, letterSpacing: -0.5, marginBottom: 32 },
  cards: { width: '100%', maxWidth: 420, gap: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
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
  cardTitle: { fontFamily: SERIF, fontSize: 18, color: C.amber50, letterSpacing: 0.5 },
  cardSub: { fontSize: 10, color: C.white30, textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 },
  cardIcon: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: C.white10,
    alignItems: 'center', justifyContent: 'center',
  },
  cardIconText: { color: C.white40, fontSize: 18, marginTop: -2 },
  backBtn: { marginTop: 40, padding: 8 },
  backText: { fontFamily: SERIF, fontSize: 12, color: C.white30, textTransform: 'uppercase', letterSpacing: 3 },
});

export default PassAndPlaySubMenu;
