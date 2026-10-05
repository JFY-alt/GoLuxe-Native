# Web-to-native sync — October 5, 2026

Reference: GoLuxe-Official main `b57e66689069f39e95b0f9f516f7da875d127f41`.
Native base: main `64ed8d998cc020b5f8446e51d2c57c0345269f16`.
Branch: `sync-web-oct5`.

## Changes adapted

- Game, How to Play, and Study lessons use the current empty-dojo artwork with the web's monochrome-to-color entrance, dark wash, and edge-to-edge background. The bundled JPEG matches the web Git blob `5725c52eab133ce96ac5817791e63475ee5aea27`.
- Lesson cards, confirmations, score panels, and help surfaces use translucent styling. Full-screen transitions retain native fade-only behavior. Practice Aids remain in the game menu; obsolete Learn and Display Mode sections were removed to match the web.
- All 12 lessons and 175 parts are ported, including Shape, How to Think, 13×13/19×19 openings, Common Mistakes, and Finishing & Scoring. Study topics paginate six per page with progress rings and Resume labels. A scroll fallback keeps all controls accessible on small phones.
- Incomplete lessons resume saved progress. Completed lessons restart from the beginning. Board size and overlays follow each lesson, and every beat resets to its own starting diagram. Lesson exits confirm before returning to Study; tutorial exits use tutorial-specific wording. Native Android Back follows these same confirmations.
- Skip Intro immediately reveals the home controls and blur. The updated streamed reel has a versioned URL so the previous native cache does not mask the replacement.
- The engine, AI, types, and lesson data match the pinned web source after whitespace normalization. This includes Benson life recognition, shared ko validation, AI tactical/resignation/komi improvements, and simplified scoring without the removed automatic seki scan or virtual diagnostic stones. Handicap games use 0.5 komi and AI remains gated during handicap placement.
- Tutorial's initial marker is the 3–3 point; its Japanese komi example is 6.5.

## Protected native behavior

The home component and player remain mounted across routes. Off-screen playback pauses and resumes without seeking or repeating its initial fade. Loops restart at 0:00 without changing video/blur opacity. The introduction stays once per app session. Backgrounds remain outside safe-area padding; controls remain inside it. Navigator transitions do not scale the screen.

## Verification

- TypeScript and Expo dependency validation pass.
- All 21 repository tests pass, including actual HomeCinema controller tests with persistent hooks, pause/resume, full-film looping, Skip Intro, and media fallback.
- Expo production exports pass for iOS, Android, and web.
- Exported app interaction checks pass for gameplay (preview/commit/undo/two-pass scoring/resume/cancel), all 12 lessons (175 parts and 41 board taps), saved 13×13 lesson resume, cancel/confirm exits, retained home video, immediate home controls, and tutorial exit context.
- Expo Go preview serves a valid iOS SDK 57 manifest over the Mac's LAN, signed in as j_fett92.

The interaction harness uses a simulated DOM and mocked media/font loading. Native blur, the dojo color transition, and actual video decoding still need visual confirmation on the owner's iPhone. Video assets continue streaming from the existing web host; the dojo still image is bundled.
