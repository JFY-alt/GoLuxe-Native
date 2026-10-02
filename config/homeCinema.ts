import type {VideoSource} from 'expo-video';

/** Add the finished film here: require('../assets/dojo-reel.mp4').
 * A null source deliberately keeps the home usable until the actual footage exists.
 * The app owns fade/blur/title effects; deliver clean monochrome footage.
 */
export const HOME_REEL_SOURCE: VideoSource = null;
export const HOME_CINEMA = {
  revealAtSeconds: 12,
  repeatFromSeconds: 14,
  openingFadeMs: 1800,
  blurFadeMs: 1600,
  menuFadeMs: 1600,
  loadingTimeoutMs: 8000,
} as const;
