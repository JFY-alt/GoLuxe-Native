# Verification and parity status — 2026-10-02

See BASELINE-AUDIT.md for the complete 33-file baseline review, findings, corrections, and known remaining differences.

Passed: TypeScript; Expo dependency compatibility check; 14 automated logic/presentation tests; all 26 tutorial card-state comparisons and nine tutorial setup comparisons; all six lessons through the exported native web bundle (106 parts, 31 board taps); game navigation/preview/commit/undo/pass/scoring/resume/reset-cancel smoke test; timed setup and live Official Time panel interaction test; production exports for iOS, Android, and web. DOM testing mocks font loading and does not certify native rendering.

The owner confirmed Expo Go opens on the physical iPhone after Expo CLI login as j_fett92. Every latest screen, animation, native file operation, and clock background transition still needs device review. Exact one-to-one parity remains open for the specific UI differences listed in BASELINE-AUDIT.md.

The repository contains source and test documentation. Signed binaries, EAS update publication, and GitHub release automation remain unconfigured. Expo Go is the available test route without paid Apple signing.

The owner subsequently authorized a new cinematic home design. Baseline parity statements describe the earlier migration; the home no longer aims to duplicate the web home. The video is not yet supplied, so native playback, blur, intro timing, and long-stay repetition still require verification with the finished MP4.
