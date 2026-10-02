# GoLuxe baseline audit — 2026-10-02

The audit covers every one of the **33 tracked files at native revision `1faccb9`**, before our changes. The reference is the owner-supplied `GoLuxe-Official-main-2` snapshot. Its copy was used directly; this is not a claim about a newer private GitHub revision. A baseline copy was preserved for comparison.

The earlier native port contained changes to artwork, layout, animation, guide controls, and board presentation. Corrections are now in the local native project. Four shared files were already byte-identical to the web source and remain so: rules engine, AI engine, lesson data, and shared types. Platform/build files must use Expo equivalents rather than web build code.

## Every original file

| Original native file | Web reference / purpose | Review and corrections |
|---|---|---|
| `.gitignore` | Build tooling | Reviewed native dependency/cache exclusions; no product behavior. |
| `App.tsx` | App.tsx navigation; index.html transitions | Restored route zoom direction and home fade; theme, fonts, safe areas, and back handling remain native adaptations. |
| `README.md` | Documentation | Rewritten to explain verified behavior, testing, and delivery limits. |
| `app.json` | Expo configuration | Reviewed orientation, name, icon, identifiers. Native configuration has no web duplicate. |
| `babel.config.js` | Expo/Reanimated configuration | Reviewed Babel preset and animation integration; exports pass. |
| `components/Board.tsx` | components/Board.tsx | Corrected 13×13 visual stars, atari connectors, eye/seki overlays, scoring markers, dead-stone crosses, target timing, textures; removed invented stone spring. |
| `components/GearIcon.tsx` | App.tsx gear artwork | Retained SVG geometry; corrected light-theme color. |
| `components/Ishi.tsx` | components/Ishi.tsx | Replaced simplified artwork with reference SVG and reference motion. |
| `components/Markup.tsx` | App.tsx tutorial/Sensei text markup | Restored inherited font styles; kept guide-specific markup rules. |
| `components/ScreenFade.tsx` | App.tsx route transitions | Removed compounded animation wrapper; navigation owns the transition. |
| `components/Sensei.tsx` | components/Sensei.tsx | Replaced simplified artwork with reference SVG and reference motion. |
| `components/Sidebar.tsx` | App.tsx Sidebar/help articles | Restored section order, theme labels, immediate komi updates, and full-page help layout. |
| `components/Stone.tsx` | components/Stone.tsx; App.tsx chapter stones | Restored game gradients/theme variants; chapter artwork uses its separate reference gradients. |
| `data/senseiLessons.ts` | senseiLessons.ts | Byte-identical before and after our work; all six lessons exercised. |
| `index.js` | Expo entry point | Reviewed standard root registration; native adaptation. |
| `logic/clocks.ts` | App.tsx clock state/update logic | Ported all six systems; corrected elapsed-time/overtime handling; automated coverage. |
| `logic/goEngine.ts` | logic/goEngine.ts | Byte-identical before and after our work. Fixed-handicap star positions intentionally preserved. |
| `logic/simpleAi.ts` | logic/simpleAi.ts | Byte-identical before and after our work; game controller uses the original AI. |
| `package-lock.json` | Native dependency graph | Regenerated with compatible Expo dependencies; not expected to equal the web dependency graph. |
| `package.json` | Native dependency/runtime configuration | Reviewed/upgraded Expo runtime, fonts, file sharing, updates, and test commands. |
| `screens/AiSetupMenu.tsx` | App.tsx AiSetupMenu | Confirmed default options/ranges; corrected reference spacing and typography. |
| `screens/GameModeMenu.tsx` | App.tsx GameModeMenu | Replaced generic chevrons with exact reference SVG icons; restored spacing and unavailable Online Play. |
| `screens/GameScreen.tsx` | App.tsx game controller and overlays | Rebuilt core state/operations; restored confirmations, pass gating, seki diagnostics, AI timing/error choices, score panel, and Play Again. Restored live Official Time panel and source-style SGF navigation/variation toggle. Remaining UI differences are recorded below. |
| `screens/MainMenu.tsx` | App.tsx MainMenu | Removed invented stagger/spring/shadows; restored reference text tracking, spacing, and fade. |
| `screens/PassAndPlaySubMenu.tsx` | App.tsx PassAndPlaySubMenu | Restored original coffee/clock icons, labels, and spacing. |
| `screens/SenseiScreen.tsx` | App.tsx Sensei guide | Restored header, disabled controls, practice aids, card metrics, and markup; removed invented slide transition. |
| `screens/StudyMenu.tsx` | App.tsx StudyMenu | Restored topic counts, progress ring alignment, and reference typography/spacing. |
| `screens/TimedSetupMenu.tsx` | App.tsx TimedSetupMenu | Compared nine preset/default/range groups with source; corrected typography, spacing, preset emphasis. |
| `screens/TutorialScreen.tsx` | App.tsx tutorial | Restored header/actions, card dimensions, pass behavior, target interaction, and transition behavior. All 26 card states compared with reference. |
| `screens/WhatIsGoMenu.tsx` | App.tsx WhatIsGoMenu; index.html animations | Restored entry offsets, original chapter stone gradients/delays, brush easing, and CTA metrics. |
| `theme.ts` | index.html theme styles | Reviewed reference dark/light palette and font mapping; native semantic theme adaptation. |
| `tsconfig.json` | Native TypeScript configuration | Reviewed native type configuration; compilation passes. |
| `types.ts` | types.ts | Byte-identical before and after our work. |

## Evidence

- TypeScript compilation passed.
- 14 automated tests passed: board/star/atari/seki presentation, SGF parsing/export/replay/branches/captures, ko rules, passing, handicap, clock behavior, and lesson diagrams.
- All 26 tutorial card states matched the actual reference functions for title, visible text, mascot mood, and action labels; all nine tutorial board setups matched.
- All six lessons completed through the exported native web bundle: 106 parts and 31 board taps. The test reads the official lesson data as its oracle.
- Game interaction smoke test passed: home/mode navigation, preview/commit, undo, pass confirmation, two-pass scoring, resume, and cancellation preserving the played board.
- Timed-game interaction check passed: setup, starting play, opening the source-style Official Time panel, live countdown updates, and closing it.
- iOS, Android, and web production bundles exported with reference fonts/assets. These are not signed app binaries.
- The owner confirmed the prior Expo preview launches on their physical iPhone. This does not validate every updated screen or function.

The bundle interaction checks use a simulated DOM with font loading mocked. They verify rendered text/state/actions, not pixels, UIKit, gestures, animation frames, or native Files/share sheets.

## Still open before claiming one-to-one parity

Exact visual and device parity is **not certified**. A rendered side-by-side comparison was unavailable here: browser process access is restricted and there is no iOS simulator. Native shadows, blur, gradients, safe-area fit, touch gestures, and animation frames need inspection on the iPhone against the web reference.

Specific refinements remain: some generic confirmation/error overlays do not yet reproduce every web-specific icon/layout; atari connectors and virtual-stone accents now pulse using the source animation definition, with actual frames still requiring device comparison. Score modal closing behavior still uses a native fade rather than the web's full exit zoom. These are recorded rather than treated as completed parity.

Native file import/export and real clock backgrounding still need device checks. No live backend, online-play feature, or additional workflow was invented; Online Play remains unavailable as in the reference.

## Delivery

This report describes the local audit before repository publication. Expo Go provides the current phone test route. Signed standalone iPhone distribution and its update prompt require the Apple signing setup discussed separately; they are not enabled by this audit.
