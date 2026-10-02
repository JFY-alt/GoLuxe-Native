# GoLuxe Native

React Native/Expo port of GoLuxe Official. Reference snapshot: `GoLuxe-Official-main-2`, supplied by the owner. Native starting revision: `1faccb9`.

```sh
npm ci
npm run check
npm run test:phone
```

Use Expo SDK 57-compatible Expo Go. See [PHONE-TESTING.md](PHONE-TESTING.md) for account login, iPhone testing, signed builds, and update prompts.

The port includes persistent dark/light styling and board themes, reference fonts and mascot SVGs, chapter animation/swiping, tutorial and all six lessons, practice aids, AI, 9/13/19 boards, Chinese/Japanese rules, handicap/komi, six clock systems, confirmations, scoring review/seki diagnostics, and SGF import/export with replay and variations.

Build and logic verification passed. Exact visual parity and physical iPhone behavior are still under review; see [VERIFICATION.md](VERIFICATION.md). Signed builds and EAS update publication remain unconfigured.

Home design now intentionally differs from the original web reference: a fixed dark cinematic home with the theme control only in game settings. The cinema player is wired, but its video source remains null until the commissioned dojo film is delivered. See HOME-CINEMA.md.
