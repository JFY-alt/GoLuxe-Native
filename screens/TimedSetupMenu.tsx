import React, { useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { TimeSettings, TimeSystem } from '../types';
import { C, SERIF } from '../theme';

interface TimedSetupMenuProps {
  onStart: (settings: TimeSettings) => void;
  onBack: () => void;
}

const SYSTEMS: { id: TimeSystem; label: string }[] = [
  { id: 'absolute', label: 'Absolute' },
  { id: 'japanese', label: 'Japanese' },
  { id: 'canadian', label: 'Canadian' },
  { id: 'fischer', label: 'Fischer' },
  { id: 'ing', label: 'Ing' },
  { id: 'nhk', label: 'NHK' },
];

const SliderRow: React.FC<{
  label: string;
  display: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}> = ({ label, display, value, min, max, step = 1, onChange }) => (
  <View style={styles.sliderBlock}>
    <View style={styles.sliderHead}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <Text style={styles.sliderValue}>{display}</Text>
    </View>
    <Slider
      value={value}
      minimumValue={min}
      maximumValue={max}
      step={step}
      onValueChange={onChange}
      minimumTrackTintColor="#fde68a"
      maximumTrackTintColor="rgba(255,255,255,0.10)"
      thumbTintColor="#fde68a"
      style={styles.slider}
    />
  </View>
);

const Explainer: React.FC<{ title: string; children: string }> = ({ title, children }) => (
  <View style={styles.explainer}>
    <Text style={styles.explainerTitle}>{title}</Text>
    <Text style={styles.explainerBody}>{children}</Text>
  </View>
);

/** Matches the web TimedSetupMenu: system tabs, sliders, presets, gold Start. */
const TimedSetupMenu: React.FC<TimedSetupMenuProps> = ({ onStart, onBack }) => {
  const [system, setSystem] = useState<TimeSystem>('japanese');
  const [mainMinutes, setMainMinutes] = useState(30);
  const [byoPeriods, setByoPeriods] = useState(5);
  const [byoSeconds, setByoSeconds] = useState(30);
  const [canStones, setCanStones] = useState(25);
  const [canMinutes, setCanMinutes] = useState(10);
  const [increment, setIncrement] = useState(10);
  const [ingPeriods, setIngPeriods] = useState(3);
  const [ingBlockMinutes, setIngBlockMinutes] = useState(10);
  const [nhkPeriods, setNhkPeriods] = useState(10);
  const [nhkSeconds, setNhkSeconds] = useState(30);

  const handleStart = () => {
    const settings: TimeSettings = { system, mainTimeMinutes: system === 'nhk' ? 0 : mainMinutes };
    if (system === 'japanese') { settings.byoyomiPeriods = byoPeriods; settings.byoyomiSeconds = byoSeconds; }
    if (system === 'canadian') { settings.canadianStones = canStones; settings.canadianMinutes = canMinutes; }
    if (system === 'fischer') { settings.fischerIncrement = increment; }
    if (system === 'ing') { settings.ingPeriods = ingPeriods; settings.ingBlockSeconds = ingBlockMinutes * 60; }
    if (system === 'nhk') { settings.nhkPeriods = nhkPeriods; settings.nhkSeconds = nhkSeconds; }
    onStart(settings);
  };

  const presets = [
    { label: 'Blitz', apply: () => { setSystem('japanese'); setMainMinutes(10); setByoPeriods(3); setByoSeconds(20); } },
    { label: 'Live Standard', apply: () => { setSystem('japanese'); setMainMinutes(30); setByoPeriods(5); setByoSeconds(30); } },
    { label: 'Title Match', apply: () => { setSystem('japanese'); setMainMinutes(480); setByoPeriods(10); setByoSeconds(60); } },
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
        <Text style={styles.heading}>Timed Go Setup</Text>

        <View style={styles.tabs}>
          {SYSTEMS.map((s) => {
            const active = system === s.id;
            return (
              <Pressable key={s.id} onPress={() => setSystem(s.id)} style={[styles.tab, active && styles.tabActive]}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.panel}>
          {system !== 'nhk' && (
            <SliderRow label="Main Time" display={`${mainMinutes} min`} value={mainMinutes} min={1} max={180} onChange={setMainMinutes} />
          )}
          {system === 'absolute' && (
            <Explainer title="Sudden Death">
              The game ends immediately when your main time expires. No overtime periods are awarded.
            </Explainer>
          )}
          {system === 'japanese' && (
            <>
              <View style={styles.duo}>
                <View style={{ flex: 1 }}>
                  <SliderRow label="Overtime Periods" display={`${byoPeriods}`} value={byoPeriods} min={1} max={10} onChange={setByoPeriods} />
                </View>
                <View style={{ flex: 1 }}>
                  <SliderRow label="Seconds" display={`${byoSeconds}s`} value={byoSeconds} min={5} max={120} step={5} onChange={setByoSeconds} />
                </View>
              </View>
              <Explainer title="Standard Byoyomi">
                {`When main time runs out, you enter overtime. You have ${byoPeriods} periods of ${byoSeconds} seconds. If you move within the time, the period resets. If time expires, you lose a period. Losing all periods ends the game.`}
              </Explainer>
            </>
          )}
          {system === 'canadian' && (
            <>
              <View style={styles.duo}>
                <View style={{ flex: 1 }}>
                  <SliderRow label="Stones" display={`${canStones}`} value={canStones} min={10} max={50} step={5} onChange={setCanStones} />
                </View>
                <View style={{ flex: 1 }}>
                  <SliderRow label="Minutes" display={`${canMinutes}m`} value={canMinutes} min={1} max={20} onChange={setCanMinutes} />
                </View>
              </View>
              <Explainer title="Stone Quota">
                {`When main time runs out, you receive a new block of ${canMinutes} minutes to make ${canStones} moves. If you meet the quota, your clock resets to the full block time for the next set of stones.`}
              </Explainer>
            </>
          )}
          {system === 'fischer' && (
            <>
              <SliderRow label="Increment" display={`+${increment}s`} value={increment} min={0} max={60} onChange={setIncrement} />
              <Explainer title="Bonus Time">
                {`Common in chess. You start with main time, and ${increment} seconds are added to your clock after every move you make. Time accumulates indefinitely.`}
              </Explainer>
            </>
          )}
          {system === 'ing' && (
            <>
              <View style={styles.duo}>
                <View style={{ flex: 1 }}>
                  <SliderRow label="Penalty Periods" display={`${ingPeriods}`} value={ingPeriods} min={1} max={5} onChange={setIngPeriods} />
                </View>
                <View style={{ flex: 1 }}>
                  <SliderRow label="Period Time" display={`${ingBlockMinutes}m`} value={ingBlockMinutes} min={1} max={60} onChange={setIngBlockMinutes} />
                </View>
              </View>
              <Explainer title="Ing SST">
                {`When main time expires, a penalty period is used to buy ${ingBlockMinutes} minutes of extra time. Each period used adds time but subtracts 2 points from your score.`}
              </Explainer>
            </>
          )}
          {system === 'nhk' && (
            <>
              <View style={styles.duo}>
                <View style={{ flex: 1 }}>
                  <SliderRow label="1-Min Periods" display={`${nhkPeriods}`} value={nhkPeriods} min={1} max={20} onChange={setNhkPeriods} />
                </View>
                <View style={{ flex: 1 }}>
                  <SliderRow label="Move Time" display={`${nhkSeconds}s`} value={nhkSeconds} min={10} max={60} step={5} onChange={setNhkSeconds} />
                </View>
              </View>
              <Explainer title="NHK Cup Style">
                {`Common in professional broadcasts. Every move has a ${nhkSeconds}s base limit. If exceeded, a 1-minute thinking period is consumed. These periods do not reset and are used globally. No main time is allocated.`}
              </Explainer>
            </>
          )}
        </View>

        {system === 'japanese' && (
          <View style={styles.presets}>
            {presets.map((p) => (
              <Pressable key={p.label} onPress={p.apply} style={styles.preset}>
                <Text style={styles.presetText}>{p.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable onPress={handleStart} style={styles.startBtn}>
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
  heading: { fontFamily: SERIF, fontSize: 26, color: C.amber50, letterSpacing: -0.5, marginBottom: 20 },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    padding: 6,
    backgroundColor: C.white05,
    borderRadius: 16,
    marginBottom: 12,
    width: '100%',
    maxWidth: 480,
  },
  tab: {
    flexGrow: 1,
    flexBasis: '30%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  tabActive: { backgroundColor: 'rgba(254,243,199,0.10)', borderColor: 'rgba(253,230,138,0.10)' },
  tabText: { fontSize: 10, color: C.white30, textTransform: 'uppercase', letterSpacing: 1.5 },
  tabTextActive: { color: C.amber100 },
  panel: {
    width: '100%',
    maxWidth: 480,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: C.white05,
    borderRadius: 16,
    gap: 4,
    marginBottom: 12,
  },
  duo: { flexDirection: 'row', gap: 16 },
  sliderBlock: { marginBottom: 8 },
  sliderHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  sliderLabel: { fontSize: 10, color: C.white40, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '700' },
  sliderValue: { fontSize: 12, color: C.amber100, fontVariant: ['tabular-nums'] },
  slider: { width: '100%', height: 32 },
  explainer: {
    padding: 12,
    backgroundColor: C.white05,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.white05,
    marginTop: 4,
  },
  explainerTitle: { fontSize: 9, color: 'rgba(254,243,199,0.80)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4, fontFamily: SERIF },
  explainerBody: { fontSize: 11, color: 'rgba(255,255,255,0.50)', lineHeight: 16, fontFamily: SERIF },
  presets: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
  preset: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: C.white05 },
  presetText: { fontSize: 9, color: C.white40, textTransform: 'uppercase', letterSpacing: 1.5 },
  startBtn: {
    width: '100%',
    maxWidth: 480,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(254,243,199,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.20)',
    alignItems: 'center',
  },
  startText: { color: C.amber100, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 3 },
  backBtn: { marginTop: 20, padding: 8 },
  backText: { fontFamily: SERIF, fontSize: 12, color: C.white30, textTransform: 'uppercase', letterSpacing: 3 },
});

export default TimedSetupMenu;
