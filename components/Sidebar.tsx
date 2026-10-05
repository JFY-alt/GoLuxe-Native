import GlassBackdrop from './GlassBackdrop';
import { ThemeToggle, useTheme, TextInput } from '../ui';
import { Pressable, ScrollView, Text, View, LinearGradient, AnimatedView } from '../ui';
import React, { useState } from 'react';
import { Modal, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { C, SERIF } from '../theme';

export type BoardTheme = 'espresso' | 'classic' | 'midnight' | 'washi' | 'maple' | 'riverstone';
export type KomiDirection = 'standard' | 'reverse' | 'none';
export type HandicapType = 'fixed' | 'free';

export const BOARD_THEMES: BoardTheme[] = ['espresso', 'classic', 'midnight', 'washi', 'maple', 'riverstone'];
const SWATCH: Record<BoardTheme, string> = {
  espresso: '#3d2b1f',
  classic: '#d2b48c',
  midnight: '#1a1a1a',
  washi: '#efe7d2',
  maple: '#d9c3a2',
  riverstone: '#c9ced6',
};

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  onExitToMenu: () => void;
  showLiberties: boolean;
  setShowLiberties: (v: boolean) => void;
  showAtariWarning: boolean;
  setShowAtariWarning: (v: boolean) => void;
  showLifeStatus: boolean;
  setShowLifeStatus: (v: boolean) => void;
  ruleset: 'japanese' | 'chinese';
  onRuleset: (r: 'japanese' | 'chinese') => void;
  handicapOn: boolean;
  onToggleHandicap: () => void;
  handicapType: HandicapType;
  onHandicapType: (t: HandicapType) => void;
  handicapCount: number;
  onHandicapCount: (n: number) => void;
  maxHandicap: number;
  komiDirection: KomiDirection;
  setKomiDirection: (d: KomiDirection) => void;
  komiValue: number;
  setKomiValue: (v: number) => void;
  boardTheme: BoardTheme;
  setBoardTheme: (t: BoardTheme) => void;
  onExportSgf: () => void;
  onImportSgf: () => void;
}

/* ---------------------------------- bits ---------------------------------- */

const SectionTitle: React.FC<{ children: string; onHelp?: () => void }> = ({ children, onHelp }) => (
  <View style={styles.secHead}>
    <Text style={styles.secTitle}>{children}</Text>
    {onHelp && (
      <Pressable onPress={onHelp} style={styles.helpBtn} hitSlop={8}>
        <Text style={styles.helpGlyph}>?</Text>
      </Pressable>
    )}
  </View>
);

const ToggleRow: React.FC<{ label: string; value: boolean; onToggle: () => void }> = ({ label, value, onToggle }) => (
  <Pressable onPress={onToggle} style={[styles.toggleRow, value && styles.toggleRowOn]}>
    <Text style={[styles.toggleLabel, value && styles.toggleLabelOn]}>{label}</Text>
    <View style={[styles.switch, value && styles.switchOn]}>
      <View style={[styles.knob, value ? { left: 20 } : { left: 4 }]} />
    </View>
  </Pressable>
);

const HelpModal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({
  title,
  onClose,
  children,
}) => (
  <Modal visible transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.helpBg}>
      <AnimatedView entering={FadeIn.duration(500)} style={styles.helpCard}><GlassBackdrop/>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:24,paddingTop:80,paddingBottom:128,alignItems:'center'}}>
          <Text style={styles.helpTitle}>{title}</Text>
          <View style={{width:'100%',maxWidth:672}}>{children}</View>
          <Pressable onPress={onClose} style={styles.helpAction}><Text style={styles.helpActionText}>{title==='Go Fundamentals'||title==='Important Concepts'?'Close':'Understood'}</Text></Pressable>
        </ScrollView>

      </AnimatedView>
    </View>
  </Modal>
);

const H4: React.FC<{ children: string }> = ({ children }) => <Text style={styles.h4}>{children}</Text>;
const P: React.FC<{ children: React.ReactNode }> = ({ children }) => <Text style={styles.p}>{children}</Text>;
const B: React.FC<{ children: string }> = ({ children }) => <Text style={styles.b}>{children}</Text>;

/* --------------------------------- sidebar --------------------------------- */

const Sidebar: React.FC<SidebarProps> = (p) => {
  const { mode: themeMode } = useTheme();
  const visibleThemes = themeMode === 'light' ? ['washi','maple','riverstone'] : ['espresso','classic','midnight'];
  const [customKomi, setCustomKomi] = useState('');
  const [help, setHelp] = useState<null | 'fundamentals' | 'concepts' | 'practice' | 'handicap' | 'sgf'>(null);
  const [confirmHandicap, setConfirmHandicap] = useState(false);
  if (!p.visible) return null;

  const stepKomi = (d: number) => {
    const v = Math.max(0, Math.round((p.komiValue + d) * 2) / 2);
    p.setKomiValue(v);setCustomKomi('');
  };

  return (
    <AnimatedView entering={FadeIn.duration(500)} exiting={FadeOut.duration(500)} style={styles.overlay}>
      {/* tap outside content to close — web: overlay onClick closes */}
      <Pressable style={StyleSheet.absoluteFill} onPress={p.onClose} />
      {/* amber wash + texture, like the web sidebar */}
      <LinearGradient
        colors={['rgba(254,243,199,0.05)', 'rgba(254,243,199,0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.nav}>
          {/* Practice Aids */}
          <View style={styles.section}>
            <SectionTitle onHelp={() => setHelp('practice')}>Practice Aids</SectionTitle>
            <View style={{ gap: 8 }}>
              <ToggleRow label="Liberties" value={p.showLiberties} onToggle={() => p.setShowLiberties(!p.showLiberties)} />
              <ToggleRow label="Atari Warning" value={p.showAtariWarning} onToggle={() => p.setShowAtariWarning(!p.showAtariWarning)} />
              <ToggleRow label="Alive Status" value={p.showLifeStatus} onToggle={() => p.setShowLifeStatus(!p.showLifeStatus)} />
            </View>
          </View>

          {/* Ruleset */}
          <View style={styles.section}>
            <SectionTitle>Ruleset</SectionTitle>
            <View style={styles.segRow}>
              {(['japanese', 'chinese'] as const).map((rs) => (
                <Pressable
                  key={rs}
                  onPress={() => p.onRuleset(rs)}
                  style={[styles.segBtn, p.ruleset === rs && styles.segBtnOn]}
                >
                  <Text style={[styles.segText, p.ruleset === rs && styles.segTextOn]}>{rs}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.finePrint}>
              {p.ruleset === 'chinese'
                ? 'Area Rules: Points = Territory + Stones on Board.'
                : 'Territory Rules: Points = Territory + Prisoners.'}
            </Text>
          </View>

          {/* Handicap & Balance */}
          <View style={styles.section}>
            <SectionTitle onHelp={() => setHelp('handicap')}>Handicap & Balance</SectionTitle>
            <ToggleRow label="Handicap Stones" value={p.handicapOn} onToggle={() => setConfirmHandicap(true)} />
            {p.handicapOn && (
              <AnimatedView entering={FadeIn.duration(300)} style={styles.handicapBody}>
                <View style={styles.segRow}>
                  {(['fixed', 'free'] as const).map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => p.onHandicapType(t)}
                      style={[styles.miniSeg, p.handicapType === t && styles.miniSegOn]}
                    >
                      <Text style={[styles.miniSegText, p.handicapType === t && styles.miniSegTextOn]}>{t}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.countRow}>
                  <Text style={styles.countLabel}>Extra Stones (+{p.handicapCount})</Text>
                  <Text style={styles.countTotal}>Total {p.handicapCount + 1}</Text>
                </View>
                <View style={styles.stepper}>
                  <Pressable onPress={() => p.onHandicapCount(Math.max(1, p.handicapCount - 1))} style={styles.stepBtn}>
                    <Text style={styles.stepGlyph}>−</Text>
                  </Pressable>
                  <Text style={styles.stepValue}>{p.handicapCount}</Text>
                  <Pressable onPress={() => p.onHandicapCount(Math.min(p.maxHandicap, p.handicapCount + 1))} style={styles.stepBtn}>
                    <Text style={styles.stepGlyph}>+</Text>
                  </Pressable>
                </View>
              </AnimatedView>
            )}
            <View style={[styles.komiBlock, p.handicapOn && { opacity: 0.4 }]}>
              <View style={styles.komiHead}>
                <Text style={styles.komiTitle}>Komi</Text>
                {p.handicapOn ? (
                  <Text style={styles.komiLocked}>Locked — handicap replaces komi</Text>
                ) : (
                  p.komiDirection === 'none' && <Text style={styles.komiLocked}>Tie-Breaker (0.5)</Text>
                )}
              </View>
              <View style={styles.segBox} pointerEvents={p.handicapOn ? 'none' : 'auto'}>
                {(['reverse', 'none', 'standard'] as const).map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => p.setKomiDirection(d)}
                    style={[styles.komiSeg, p.komiDirection === d && styles.komiSegOn]}
                  >
                    <Text style={[styles.komiSegText, p.komiDirection === d && styles.komiSegTextOn]}>
                      {d === 'none' ? 'None' : d === 'reverse' ? 'Reverse' : 'Standard'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {p.komiDirection !== 'none' && !p.handicapOn && (
                <AnimatedView entering={FadeIn.duration(300)} style={{ gap: 8 }}>
                  <View style={styles.segRow}>
                    {[6.5, 7.5].map((v) => (
                      <Pressable
                        key={v}
                        onPress={() => p.setKomiValue(v)}
                        style={[styles.miniSeg, p.komiValue === v && styles.miniSegOn]}
                      >
                        <Text style={[styles.miniSegText, p.komiValue === v && styles.miniSegTextOn]}>{v}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <TextInput accessibilityLabel="Custom komi" value={customKomi} onChangeText={text=>{setCustomKomi(text);const n=parseFloat(text);p.setKomiValue(Number.isFinite(n)?Math.max(0,n):0);}} placeholder="Custom" keyboardType="decimal-pad" style={{padding:12,borderWidth:1,borderColor:C.white10,borderRadius:8,color:C.amber50}} />
                </AnimatedView>
              )}
            </View>
          </View>

          {/* Board Aesthetic */}
          <View style={styles.section}>
            <SectionTitle>Board Aesthetic</SectionTitle>
            <View style={styles.swatchGrid}>
              {BOARD_THEMES.filter(t => visibleThemes.includes(t)).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => p.setBoardTheme(t)}
                  style={[styles.swatchBtn, p.boardTheme === t && styles.swatchBtnOn]}
                >
                  <View style={[styles.swatch, { backgroundColor: SWATCH[t] }]} />
                  <Text style={[styles.swatchLabel, p.boardTheme === t && styles.swatchLabelOn]}>
                    {t === 'riverstone' ? 'River Stone' : t}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Game Record */}
          <View style={styles.section}>
            <SectionTitle onHelp={() => setHelp('sgf')}>Game Record</SectionTitle>
            <View style={{ gap: 8 }}>
              <Pressable onPress={p.onExportSgf} style={styles.recordBtn}>
                <Text style={styles.recordText}>Export SGF</Text>
                <Text style={styles.recordGlyph}>↑</Text>
              </Pressable>
              <Pressable onPress={p.onImportSgf} style={styles.recordBtn}>
                <Text style={styles.recordText}>Import SGF</Text>
                <Text style={styles.recordGlyph}>↓</Text>
              </Pressable>
            </View>
          </View>

          {/* Exit */}
          <View style={styles.exitWrap}>
            <Pressable onPress={p.onExitToMenu} style={({ pressed }) => [styles.exitBtn, pressed && { transform: [{ scale: 0.95 }] }]}>
              <Text style={styles.exitText}>Back to Main Menu</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* handicap confirm */}
      <Modal visible={confirmHandicap} transparent animationType="fade" onRequestClose={() => setConfirmHandicap(false)}>
        <View style={styles.confirmBg}>
          <AnimatedView entering={FadeIn.duration(200)} style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Change handicap?</Text>
            <Text style={styles.confirmDesc}>Toggling handicap stones starts a new game — the current board will be cleared.</Text>
            <View style={styles.confirmRow}>
              <Pressable onPress={() => setConfirmHandicap(false)} style={styles.confirmGhost}>
                <Text style={styles.confirmGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setConfirmHandicap(false);
                  p.onToggleHandicap();
                }}
                style={styles.confirmGold}
              >
                <Text style={styles.confirmGoldText}>{p.handicapOn ? 'Remove Handicap' : 'Start Handicap Game'}</Text>
              </Pressable>
            </View>
          </AnimatedView>
        </View>
      </Modal>

      {/* help modals */}
      {help === 'fundamentals' && (
        <HelpModal title="Go Fundamentals" onClose={() => setHelp(null)}>
          <H4>The Objective</H4>
          <P>Go is a game of surrounding. The goal is to control more <B>Territory</B>—empty intersections—than your opponent at the end of the journey.</P>
          <H4>The Stones</H4>
          <P><B>Black</B> always plays first. Stones are placed on the intersections of the grid. Once a stone is placed, it does not move unless it is <B>Captured</B>.</P>
          <H4>Liberties & Capture</H4>
          <P>A stone needs <B>Liberties</B>—orthogonally adjacent empty points—to breathe. If all liberties of a stone or group are filled by the opponent, the group is removed as Prisoners.</P>
          <H4>Ending the Game</H4>
          <P>The game ends when both players <B>Pass</B> consecutively. Points are then calculated: <B>Territory + Captured Prisoners</B> (Japanese) or <B>Territory + Stones on Board</B> (Chinese).</P>
        </HelpModal>
      )}
      {help === 'concepts' && (
        <HelpModal title="Important Concepts" onClose={() => setHelp(null)}>
          <H4>Mastering the Grid</H4>
          <P>Beyond the simple rules of capture lie the strategic pillars that define a master's play. These concepts represent the higher dialogue of the stones.</P>
          {[
            ['1. Iki-shini (Life & Death)', 'The most vital concept. A group is only truly alive if it can secure two separate \'eyes\'. Without two eyes, a group is dead even if it still has liberties.'],
            ['2. Sente & Gote (Initiative)', 'Sente is a move that requires a response, keeping the initiative. Gote ends the sequence. Mastering this \'flow\' is key to high-level play.'],
            ['3. Renraku & Kiri (Connection & Cutting)', 'Stones are stronger when linked. \'Cutting\' separates weak groups to attack, while \'Connecting\' ensures your own structural survival.'],
            ['4. Ji & Moyo (Territory & Influence)', 'Ji represents immediate, secured points. Moyo represents potential territory built from influence, creating a powerful zone for later control.'],
            ['5. Atsumi (Thickness & Power)', 'Strong, wall-like formations without weaknesses. Thick groups act as stationary fortresses, making nearby enemy stones feel heavy and vulnerable.'],
            ['6. Miai (Strategic Balance)', 'A state where two equally beneficial points exist. If the opponent takes one, you take the other, ensuring efficiency through balanced alternatives.'],
            ['7. Aji (Latent Potential)', 'Literally \'taste.\' Refers to lingering possibilities left behind by \'dead\' or suppressed stones. A master uses Aji to force reactions in settled areas.'],
            ['8. Tesuji (Tactical Genius)', 'A \'clever move\' that finds the most efficient local play, often saving a group or capturing an opponent in a way they didn\'t anticipate.'],
            ['9. Sabaki (Resilience)', 'The art of making a light, flexible shape for a weak group in enemy areas to settle efficiently without surrendering territory or profit.'],
            ['10. Katachi (Shape)', 'The geometry of efficiency. Good shape allows stones to work together naturally, maximizing liberties and the potential to create eyes.'],
            ['11. Seki (Mutual Life)', 'A unique stalemate where two opposing groups share liberties, but neither can fill them without being captured. Both groups remain alive on the board.'],
            ['12. Ko (The Rule of Repetition)', 'A law preventing infinite loops. If a capture results in the same board state as the last turn, you must play elsewhere first, forcing global strategic trades.'],
          ].map(([t, d]) => (
            <View key={t} style={styles.concept}>
              <Text style={styles.conceptTitle}>{t}</Text>
              <Text style={styles.conceptDesc}>{d}</Text>
            </View>
          ))}
        </HelpModal>
      )}
      {help === 'practice' && (
        <HelpModal title="Practice Aids" onClose={() => setHelp(null)}>
          <H4>Liberties (Breathing Space)</H4>
          <P>Stones exist only as long as they can "breathe." Amber and blue dots visualize these liberties. Green dots represent shared breathing space between both players.</P>
          <H4>Atari (Danger of Capture)</H4>
          <P>When a group is reduced to a single liberty, it is in Atari. A pulsing red circle warns you that the group is in immediate danger of being captured on the next turn.</P>
          <H4>Life Status</H4>
          <P>The secret to survival is creating two "eyes." Small purple rings on empty intersections identify these vital eyes. When a group looks completely safe, a protective shield (ring) appears around the stones. This is the app's best guess at "alive" — not a verdict. During scoring, your judgment is final: tap any group to mark it dead or alive.</P>
        </HelpModal>
      )}
      {help === 'handicap' && (
        <HelpModal title="Handicap & Balance" onClose={() => setHelp(null)}>
          <H4>Fine-Tuning the Balance</H4>
          <P>Go provides powerful tools to equalize the board between players of different strengths. These mechanisms ensure that every game is a competitive dialogue, regardless of the skill gap.</P>
          <H4>1. Handicap Stones</H4>
          <P>The primary tool for balance. Black is allowed to place multiple stones before White makes their first move.</P>
          <P><B>Fixed Placement:</B> Stones must be placed on the traditional 'Hoshi' (star points). This provides a structured, geometrically balanced defense.</P>
          <P><B>Free Placement:</B> Black may place their handicap stones anywhere on the board, allowing for specialized aggressive or defensive setups.</P>
          <H4>2. Komi (Compensation)</H4>
          <P>A point-based compensation given to the second player (White) to offset Black's 'first-move' initiative.</P>
          <P><B>Standard Komi:</B> Usually 6.5 or 7.5 points added to White's final total. The .5 ensures no draws (Jigo) occur.</P>
          <P><B>Reverse Komi:</B> Points given back to Black. This is a precision tool used when Black requires a handicap that falls between standard stone increments.</P>
        </HelpModal>
      )}
      {help === 'sgf' && (
        <HelpModal title="Game Records (SGF)" onClose={() => setHelp(null)}>
          <H4>Smart Game Format (SGF)</H4>
          <P>SGF is the universal standard for digital Go records. It preserves not just the moves, but the branching history, commentary, and metadata of a game.</P>
          <H4>Importing Games</H4>
          <P>Load professional games or your own past matches to review them on the board. The viewer supports navigating through the main line as well as alternate "variation" paths.</P>
          <H4>Exporting Your Art</H4>
          <P>Save your current session to a file. This creates a permanent record of your strategic dialogue, which can be opened in GoLuxe or any other modern Go software.</P>
        </HelpModal>
      )}
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 300,
    backgroundColor: 'rgba(0,0,0,.75)',
  },
  scroll: { paddingTop: 80, paddingBottom: 48, alignItems: 'center' },
  nav: { width: '100%', maxWidth: 420, paddingHorizontal: 24, gap: 40 },
  section: {},
  secHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  secTitle: {
    fontFamily: SERIF,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 3,
    color: 'rgba(254,243,199,0.40)',
    fontWeight: '700',
  },
  helpBtn: { padding: 4 },
  helpGlyph: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.40)',
    color: 'rgba(253,230,138,0.60)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    overflow: 'hidden',
  },
  learnBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.white10,
    backgroundColor: 'transparent',
  },
  learnText: { fontFamily: SERIF, fontSize: 14, color: C.white40, letterSpacing: 0.5 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.white10,
    backgroundColor: 'transparent',
  },
  toggleRowOn: {
    backgroundColor: C.white05,
    borderColor: 'rgba(255,255,255,0.20)',
    shadowColor: '#fff',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  toggleLabel: { fontFamily: SERIF, fontSize: 12, color: C.white40, letterSpacing: 0.5 },
  toggleLabelOn: { color: C.amber50 },
  switch: { width: 32, height: 16, borderRadius: 8, backgroundColor: C.white10, position: 'relative' },
  switchOn: { backgroundColor: C.amber100 },
  knob: {
    position: 'absolute',
    top: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0d0d0d',
  },
  segRow: { flexDirection: 'row', gap: 8 },
  segBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.white10,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  segBtnOn: { backgroundColor: C.white05, borderColor: 'rgba(255,255,255,0.20)' },
  segText: { fontFamily: SERIF, fontSize: 12, color: C.white40, textTransform: 'capitalize', letterSpacing: 1 },
  segTextOn: { color: C.amber50 },
  finePrint: { fontFamily: SERIF, fontSize: 9, color: C.white20, lineHeight: 14, paddingHorizontal: 4, marginTop: 12 },
  handicapBody: { marginTop: 12, gap: 12, paddingHorizontal: 4 },
  miniSeg: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.white10,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  miniSegOn: { backgroundColor: C.white05, borderColor: 'rgba(255,255,255,0.20)' },
  miniSegText: { fontSize: 10, color: C.white40, textTransform: 'uppercase', letterSpacing: 2 },
  miniSegTextOn: { color: C.amber50 },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  countLabel: { fontSize: 9, color: C.white30, textTransform: 'uppercase', letterSpacing: 1 },
  countTotal: { fontSize: 11, color: C.amber200, fontVariant: ['tabular-nums'] },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.white10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepGlyph: { color: C.amber100, fontSize: 20, lineHeight: 22 },
  stepValue: { fontSize: 16, color: C.amber50, fontVariant: ['tabular-nums'], minWidth: 70, textAlign: 'center' },
  komiBlock: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.white05, gap: 8 },
  komiHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 4 },
  komiTitle: { fontFamily: SERIF, fontSize: 10, color: C.white40, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 },
  komiLocked: { fontSize: 9, color: C.white30, fontVariant: ['tabular-nums'] },
  segBox: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.20)', borderRadius: 12, borderWidth: 1, borderColor: C.white10, padding: 4 },
  komiSeg: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  komiSegOn: { backgroundColor: C.white05, borderColor: 'rgba(255,255,255,0.20)' },
  komiSegText: { fontSize: 10, color: C.white40, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '500' },
  komiSegTextOn: { color: C.amber50 },
  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatchBtn: {
    width: '31%',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.white10,
    backgroundColor: 'transparent',
  },
  swatchBtnOn: { backgroundColor: C.white05, borderColor: 'rgba(255,255,255,0.20)' },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: C.white10 },
  swatchLabel: { fontFamily: SERIF, fontSize: 10, color: C.white40, textTransform: 'capitalize', letterSpacing: 0.5 },
  swatchLabelOn: { color: C.amber50 },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.white10,
    backgroundColor: 'transparent',
  },
  recordText: { fontFamily: SERIF, fontSize: 12, color: C.white40, letterSpacing: 0.5 },
  recordGlyph: { color: C.white20, fontSize: 14 },
  exitWrap: { borderTopWidth: 1, borderTopColor: C.white10, paddingTop: 32, alignItems: 'center' },
  exitBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.white10,
  },
  exitText: { fontFamily: SERIF, fontSize: 12, color: C.white40, textTransform: 'uppercase', letterSpacing: 3 },
  confirmBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.70)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  confirmCard: { backgroundColor: 'rgba(255,255,255,.03)', borderWidth: 1, borderColor: C.white10, borderRadius: 16, padding: 24, width: '100%' },
  confirmTitle: { fontFamily: SERIF, fontSize: 18, color: C.amber50, textAlign: 'center', marginBottom: 8 },
  confirmDesc: { fontSize: 13, color: C.white40, textAlign: 'center', lineHeight: 19, marginBottom: 20 },
  confirmRow: { flexDirection: 'row', gap: 10 },
  confirmGhost: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: C.white10, alignItems: 'center' },
  confirmGhostText: { color: C.white30, fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 },
  confirmGold: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(254,243,199,0.10)', borderWidth: 1, borderColor: 'rgba(253,230,138,0.20)', alignItems: 'center' },
  confirmGoldText: { color: C.amber100, fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700', textAlign: 'center' },
  helpBg: {flex:1,backgroundColor:'rgba(0,0,0,.85)'},
  helpCard: {flex:1,backgroundColor:'transparent',width:'100%'},
  helpTitle: { fontFamily: SERIF, fontSize: 48, color: C.amber50, textAlign: 'center', marginBottom: 64, letterSpacing: -2.4 },
  helpAction: {marginTop:80,paddingVertical:12,alignItems:'center'},
  helpActionText: {fontFamily:SERIF,color:C.white30,fontSize:12,textTransform:'uppercase',letterSpacing:1.2},
  h4: { fontFamily: SERIF, fontSize: 24, color: C.amber100, marginTop: 48, marginBottom: 16, letterSpacing: -0.3 },
  p: { fontFamily: SERIF, fontSize: 18, color: 'rgba(255,255,255,0.60)', lineHeight: 29.25, marginBottom: 8 },
  b: { color: C.amber50, fontWeight: '400' },
  concept: { borderLeftWidth: 1, borderLeftColor: 'rgba(253,230,138,0.20)', paddingLeft: 16, marginTop: 20 },
  conceptTitle: { fontFamily: SERIF, fontSize: 17, color: C.amber50, marginBottom: 6 },
  conceptDesc: { fontSize: 14, color: C.white40, lineHeight: 21 },
});

export default Sidebar;
