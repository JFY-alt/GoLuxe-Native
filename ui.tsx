import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import * as Native from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import { LinearGradient as ExpoGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERIF } from './theme';

export type ThemeMode = 'dark' | 'light';
const ThemeContext = createContext({ mode: 'dark' as ThemeMode, toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [ready, setReady] = useState(false);
  const [fading, setFading] = useState(false);
  useEffect(() => { AsyncStorage.getItem('goluxe-theme-mode').then(v => {
    if (v === 'light') setMode('light');
  }).catch(() => {}).finally(() => setReady(true)); }, []);
  const toggle = useCallback(() => { setMode(m => {
    const next = m === 'dark' ? 'light' : 'dark';
    AsyncStorage.setItem('goluxe-theme-mode', next).catch(() => {});
    return next;
  }); setFading(true); }, []);
  useEffect(() => { if (!fading) return; const t = setTimeout(() => setFading(false), 420); return () => clearTimeout(t); }, [fading]);
  const value = useMemo(() => ({ mode, toggle }), [mode, toggle]);
  if (!ready) return null;
  return <ThemeContext.Provider value={value}>{children}{fading && <Animated.View pointerEvents="none" exiting={FadeOut.duration(420)} style={[Native.StyleSheet.absoluteFill, { backgroundColor: mode === 'light' ? '#fafaf9' : '#0d0d0d', zIndex: 2000 }]} />}</ThemeContext.Provider>;
}
// Matches the web theme-light CSS. Artwork and board surfaces use native components directly.
function lightColor(value: any, key: string) {
  if (typeof value !== 'string') return value;
  const c = value.toLowerCase().replace(/\s/g, '');
  if (key === 'color') {
    if (['#fffbeb','#ffffff','#fff','white'].includes(c)) return '#1c1917';
    if (c === '#fef3c7') return '#b45309';
    if (['#fde68a','#fcd34d'].includes(c)) return '#92400e';
    const white = c.match(/^rgba\(255,(?:255,255|251,235),([\d.]+)\)$/);
    if (white) return Number(white[1]) <= .25 ? '#a8a29e' : Number(white[1]) <= .4 ? '#78716c' : '#57534e';
    if (/^rgba\((254,243,199|253,230,138|252,211,77),/.test(c)) return '#92400e';
    if (['#a7f3d0','#34d399'].includes(c)) return '#047857';
    if (['#bae6fd','#7dd3fc'].includes(c)) return '#0369a1';
    if (['#6ee7b7'].includes(c)) return '#047857';
    if (['#fca5a5','#fecaca'].includes(c)) return '#b91c1c';
  }
  if (key.toLowerCase().includes('border')) {
    if (/rgba\(255,255,255,/.test(c)) return 'rgba(41,37,36,0.20)';
    if (/rgba\((254,243,199|253,230,138|252,211,77),/.test(c)) return 'rgba(180,83,9,0.35)';
  }
  if (key === 'backgroundColor' || key === 'gradient') {
    if (c === '#0d0d0d' || c === '#141210') return '#fafaf9';
    if (['#151515','#1a1a1a','#111'].includes(c)) return '#f5f5f4';
    if (/^rgba\(20,20,20,/.test(c)) return 'rgba(255,255,255,.95)';
    const white = c.match(/^rgba\(255,255,255,([\d.]+)\)$/);
    if (white) return `rgba(0,0,0,${Number(white[1]) >= .1 ? .08 : .05})`;
    const black = c.match(/^rgba\(0,0,0,([\d.]+)\)$/);
    if (black && Number(black[1]) <= .4) return 'rgba(255,255,255,0.72)';
    if (/^rgba\((254,243,199|253,230,138),/.test(c)) return c.replace(/254,243,199|253,230,138/, '180,83,9');
  }
  return value;
}
function mapStyle(style: any, mode: ThemeMode, text = false) {
  const flat = Native.StyleSheet.flatten(style) || {};
  const mapped: any = { ...flat };
  if (mode === 'light') for (const key of Object.keys(mapped)) mapped[key] = lightColor(mapped[key], key);
  if (text) {
    const weight = String(flat.fontWeight || '400');
    const family = flat.fontFamily || 'Inter';
    if (family === SERIF || family === 'Inter') {
      const w = Number(weight) >= 600 || weight === 'bold' ? '600' : Number(weight) <= 300 ? '300' : '400';
      mapped.fontFamily = `${family}_${w}${flat.fontStyle === 'italic' ? '_Italic' : ''}`;
      mapped.fontWeight = 'normal';
      mapped.fontStyle = 'normal';
    }
  }
  return mapped;
}
const TextTypography = createContext<any>({fontFamily:'Inter',fontWeight:'400'});
export const Text = React.forwardRef<any, Native.TextProps>((p,ref)=>{
  const {mode}=useTheme();const inherited=useContext(TextTypography);const own=Native.StyleSheet.flatten(p.style)||{};
  const typography={fontFamily:own.fontFamily||inherited.fontFamily,fontWeight:own.fontWeight||inherited.fontWeight,fontStyle:own.fontStyle||inherited.fontStyle};
  return <TextTypography.Provider value={typography}><Native.Text {...p} ref={ref} style={mapStyle([typography,p.style],mode,true)}/></TextTypography.Provider>;
});
export const TextInput = React.forwardRef<any, Native.TextInputProps>((p, ref) => { const { mode } = useTheme(); return <Native.TextInput {...p} ref={ref} placeholderTextColor={mode === 'light' ? '#a8a29e' : p.placeholderTextColor} style={mapStyle(p.style, mode, true)} />; });
function Texture({style,mode}:{style:any;mode:ThemeMode}) { const f=Native.StyleSheet.flatten(style)||{};if(f.flex!==1 || f.backgroundColor!=='#0d0d0d')return null;return <Native.View pointerEvents="none" style={Native.StyleSheet.absoluteFill}><Native.Image source={require('./assets/dark-wood.png')} resizeMode="repeat" style={[Native.StyleSheet.absoluteFill,{opacity:mode==='light'?.06:.10}]}/></Native.View>; }
export const View = React.forwardRef<any, Native.ViewProps>((p, ref) => { const { mode } = useTheme(); return <Native.View {...p} ref={ref} style={mapStyle(p.style, mode)}><Texture style={p.style} mode={mode}/>{p.children}</Native.View>; });
export const ScrollView = React.forwardRef<any, Native.ScrollViewProps>((p, ref) => { const { mode } = useTheme(); return <Native.ScrollView {...p} ref={ref} style={mapStyle(p.style, mode)} contentContainerStyle={mapStyle(p.contentContainerStyle, mode)} />; });
export const Pressable = React.forwardRef<any, Native.PressableProps>((p, ref) => { const { mode } = useTheme(); return <Native.Pressable accessibilityRole="button" {...p} ref={ref} style={state => mapStyle(typeof p.style === 'function' ? p.style(state) : p.style, mode)} />; });
export const AnimatedView = React.forwardRef<any, any>((p, ref) => { const { mode } = useTheme(); return <Animated.View {...p} ref={ref} style={mapStyle(p.style, mode)}><Texture style={p.style} mode={mode}/>{p.children}</Animated.View>; });
export function StatusBar(_: Native.StatusBarProps) { const { mode } = useTheme(); return <Native.StatusBar barStyle={mode === 'light' ? 'dark-content' : 'light-content'} backgroundColor={mode === 'light' ? '#fafaf9' : '#0d0d0d'} />; }
export function LinearGradient(p: React.ComponentProps<typeof ExpoGradient>) { const { mode } = useTheme(); return <ExpoGradient {...p} colors={p.colors.map(c => mode === 'light' ? lightColor(c, 'gradient') : c) as any} />; }
export function ThemeToggle() { const { mode, toggle } = useTheme(); return <Pressable onPress={toggle} accessibilityLabel="Toggle light and dark theme" style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,.10)', backgroundColor: 'rgba(255,255,255,.05)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fef3c7', fontSize: 22 }}>{mode === 'dark' ? '☼' : '☾'}</Text></Pressable>; }
