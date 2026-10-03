# Current web-look sync — 2026-10-03

Branch: sync-current-web-look. Contains the current web appearance and the iPhone preview fixes approved during testing.

Reference: GoLuxe-Official main 8838330, plus the approved once-per-session home behavior on home-intro-once-per-session. The native repository's newer main adds a bundled home film; this local preview instead uses the current web film URLs so all seven scenes match the web sources.

Updated home film/reveal at five seconds, immediate blurred home menu on return, a retained home player that pauses off-screen and resumes without reloading, full-video looping from 0:00 without a fade to black, menu title/button appearance, mode/AI/pass-and-play/timed/study/What-is-Go film backgrounds, fixed dark cinematic menu treatment, and current setup typography/spacing. App sessions use an in-memory flag rather than persistent storage, so a fresh app launch can play the opening again. Changing a film only requires changing its source; changing the introduction length also requires adjusting revealAtSeconds in config/homeCinema.ts.

Videos stream from goluxe.vercel.app with native caching enabled. This avoids adding seven duplicated film files to the preview but depends on the existing asset host for initial playback. Missing media leaves a usable menu. Native blur approximates the web's CSS blur. Backgrounds extend behind the status bar and home indicator; safe-area spacing applies to controls. Navigation fades without scaling the background. The tutorial and study lessons also draw their backgrounds edge to edge.

Checks: TypeScript, 14 existing logic tests, native cinema controller lifecycle checks (cue/return/resume/duration clamp/background/error/stall/cleanup), production exports for iOS/Android/web, and an exported-bundle navigation/game interaction smoke check. The simulated DOM needs a browser-compatibility correction for isEqualNode(null); native media playback itself was mocked in the controller check. Native player and blur rendering are not certified by a DOM/controller test.

Start outputs/GoLuxe-Start.command, keep its terminal open, and scan its QR in Expo Go on the same Wi-Fi as the Mac. The QR is generated after the server is ready. Stop the previous Expo process first if port 8081 is already occupied. Watch mode remains disabled in this environment; restart the launcher after code edits.
