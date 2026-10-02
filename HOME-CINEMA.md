# GoLuxe — the opening game

## Creative direction

Create a quiet, cinematic, vertical monochrome film for the GoLuxe app home screen. Two seasoned Go masters meet across a floor-standing goban in a traditional Japanese dojo, with a small audience seated behind them. An empty board, a mutual bow, and their first reach toward the stone bowls establish respect, concentration, and the start of the game. The game continues at a measured pace while the app blurs the moving background and fades in its title and menu.

The atmosphere is an old film reel: silver-rich black and white, soft highlights, restrained grain, slight gate weave, occasional fine dust and scratches, and gentle exposure variation. Make the scene feel like an archival observation of a real game. The players are dignified, individual people rather than caricatures. Their movements are natural and unhurried. The audience quietly observes.

Deliver **three minutes of continuous-looking footage**. The first twelve seconds form the introduction; the remaining footage provides a long, evolving background. The application supplies the black fade, blur, title, and menu. Do not bake those effects or text into the film.

## Composition

- Portrait 9:16 throughout. Establish one stable, slightly elevated three-quarter camera angle that includes both players, their bowls, the board, and the audience.
- Put the players on opposite sides of a genuine **19×19 Go board** with two bowls of loose black and white stones. The board has intersections and star points; it has no checkerboard squares or chess pieces.
- Frame the masters and board in the lower and middle portions, with the seated audience visible above and behind. Reserve the central visual area for the app's title and menu through calm composition and moderate contrast. The app will add blur and darkening for legibility.
- Keep hands, wrists, faces, stone bowls, clothing, grid geometry, and room details consistent across every shot or extension. Preserve a credible scale between hands, stones, and board.
- Use a mostly locked camera. A nearly imperceptible inward drift is acceptable. Avoid dramatic reframing, crash zooms, and camera changes that compete with the menu.

## Timing and action

| Film time | Action | App treatment |
|---|---|---|
| 0–2 s | Both masters are already seated across the empty board, hands resting. Audience still and attentive. | Fade from black over approximately 1.8 seconds after the first frame is ready. |
| 2–6 s | Both masters perform a synchronized, respectful seated bow toward each other across the board. | Clear monochrome footage; no title or menu. |
| 6–9 s | They return upright and exchange a brief, composed glance. | Clear footage continues. |
| 9–12 s | Each master reaches toward their own bowl. Black prepares the first move; White waits. | Clear footage continues until the gesture is established. |
| 12–14 s | Black places the first stone; White begins their response. | The app gradually blurs/darkens the film and fades in GoLuxe, Strategic Purity, and the four existing menu actions over roughly 1.6 seconds. |
| 14–180 s | Black and White alternate individual moves, usually about 4–7 seconds apart. Include pauses to study the position and quiet reaction from the audience. | Video continues behind a stationary, readable title and menu. |

The finished bow and first reach determine the final reveal cue. If the production timing differs, provide the exact cue time so the app can be adjusted. No replay of the bow within the three-minute film.

## Go and movement continuity

Black moves first; each player places one stone before the other plays. A stone is held between the fingers, brought down to an intersection, released, and left on the board. Hands then withdraw naturally. Stones do not slide into positions, duplicate, change color, disappear between frames, or land inside grid squares. Do not let both players move simultaneously.

Prefer a believable, simple opening with gradual board development over a complicated tactical sequence. The first moves should be near corners and side approaches. A separate 32-move legal example accompanies this brief to help maintain board continuity; a Go adviser may supply another equally valid sequence. Pause and observe rather than manufacturing a new move every second. Keep spectators' reactions subtle and infrequent.

## Ready-to-use generation prompt

> A continuous-looking three-minute vertical 9:16 archival-style black-and-white film of two dignified, seasoned Japanese Go masters seated across a traditional floor-standing 19×19 goban in a quiet wooden dojo with tatami flooring. A small audience sits respectfully behind them and watches in silence. Stable, slightly elevated three-quarter composition, both masters, their hands, both stone bowls, the board, and spectators visible. Soft window light, silver-rich monochrome photography, restrained old film grain, subtle gate weave, occasional fine dust and scratches, gentle exposure breathing, natural human movement. At the beginning the Go board is completely empty. The two seated masters make a synchronized respectful bow across the empty board, slowly return upright, then reach toward their own stone bowls. Black prepares and plays first, White responds. They continue alternating single stone placements at a thoughtful, measured pace, with several seconds of observation between moves. Each stone is placed on a real grid intersection and remains there. Consistent hands, faces, clothing, bowls, board geometry, and stone positions across the entire film. The audience remains quietly attentive. Maintain a calm, mostly locked portrait composition suitable for a title and menu layered over the center. No on-screen text, logo, subtitles, app interface, baked-in blur, or baked-in fade. No rapid cuts, simultaneous moves, board resets, duplicated hands, floating stones, or looping bow.

## If using short generated clips

Build the opening as its own 12–14-second sequence. Continue the game using supported clip extensions or matched takes, retaining the same reference frame, camera, players, room, and tracked stone position. Assemble a real three-minute timeline; do not stretch one short clip with repeated playback or slow the whole film to an unnatural pace.

Review hands and every stone placement, especially across joins. Keep the first twelve seconds especially clean because the app displays them in focus. Later joins can be placed during a pause with both hands withdrawn; the app's blur will soften small photographic differences but will not repair physical continuity.

## Delivery files

1. `dojo-reel-master.mp4`: 1080×1920, H.264, progressive 24 fps, monochrome, silent, three minutes. Keep an editable high-quality master if available.
2. `dojo-reel.mp4`: mobile copy, 720×1280, H.264, 24 fps, yuv420p, fast-start metadata. Target 1.2–1.8 Mbps and approximately 27–41 MB for three minutes; assess grain quality and increase bitrate if necessary.
3. An opening still and a cue sheet confirming when the bow finishes and when the first reach/placement occurs.

Avoid letterboxing, watermarks, burned-in menus, soundtracks, flickering strobes, and heavy damage that obscures the players. The app plays the film muted. Any chosen soundtrack would be a separate future decision.

## Long-stay replay behavior

The app shows the opening once per app session. When someone returns to the home screen, it starts in the ongoing-game portion with the menu already available. If someone stays past the end of the film, the background restarts from the ongoing-game section rather than repeating the bow or hiding the menu. A brief background fade masks the edit. Three minutes delays the first repeat; it is still a finite film.

## App integration status

The home theme toggle has been removed. Home uses a fixed dark treatment and the game settings retain their existing theme control. The video player, playback-driven reveal cue, blur layer, foreground menu, and pause/error handling are wired using Expo's video and blur APIs. No dojo footage has been generated or supplied yet. Until `dojo-reel.mp4` is supplied and attached, the app presents a usable dark menu without a video.

After receiving the finished film, place it under native `assets/dojo-reel.mp4` and set `HOME_REEL_SOURCE` in `config/homeCinema.ts` to `require('../assets/dojo-reel.mp4')`. Match `revealAtSeconds` to the final cue sheet and `repeatFromSeconds` to the continuing-game section. Verify the full film on the iPhone, including backgrounding, returning home, the end-of-film transition, and offline startup.

API references: [Expo Video, SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/video/) and [Expo BlurView, SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/blur-view/).
