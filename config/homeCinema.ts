import type {VideoSource} from 'expo-video';
/** The current official web films. Change these sources when the web assets change. */
const film=(name:string):VideoSource=>({uri:`https://goluxe.vercel.app/${name}.mp4`,useCaching:true});
// Version the updated film so native caches do not retain the previous web reel.
export const HOME_REEL_SOURCE:VideoSource={uri:'https://goluxe.vercel.app/dojo-reel.mp4?v=b57e666',useCaching:true};
export const MENU_VIDEOS={modes:film('dojo-genkan'),aiSetup:film('dojo-robot'),passPlaySub:film('dojo-tapestry'),timedSetup:film('dojo-clocks'),study:film('dojo-study'),whatIsGo:film('dojo-wall')} as const;
export const HOME_CINEMA={revealAtSeconds:5,repeatFromSeconds:5,openingFadeMs:1800,blurFadeMs:1600,menuFadeMs:1600,loadingTimeoutMs:8000} as const;
