import type {VideoSource} from 'expo-video';

/** The finished dojo film — two Go masters, vertical B&W old-reel style. */
export const HOME_REEL_SOURCE: VideoSource = require('../assets/dojo-reel.mp4');
export const HOME_CINEMA = {
  revealAtSeconds: 12,
  repeatFromSeconds: 14,
  openingFadeMs: 1800,
  blurFadeMs: 1600,
  menuFadeMs: 1600,
  loadingTimeoutMs: 8000,
} as const;
