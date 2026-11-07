# Professional SGF toolkit — implementation and acceptance ledger

User requirement: all SGF tools experienced players expect, executed exceptionally well on a phone. This is an active requirement, not a completed feature claim. Preserve the luxury visual/motion design, titles-and-circles Study cards, offline operation and user's saved data. Online play remains deferred.

Primary references: [SGF FF4 properties](https://www.red-bean.com/sgf/properties.html), [Go playback semantics](https://www.red-bean.com/sgf/go.html), [SGF authoring guide](https://cvsbook.red-bean.com/sgf/user_guide/index.html), [Sabaki editor](https://sabaki.yichuanshen.de/). Revisit exact property semantics and actual professional workflows as each feature is implemented. This ledger is a minimum audit checklist, not an assertion that it exhausts every professional's needs.

| Area | Current evidence | Required next work / acceptance |
| --- | --- | --- |
| Move navigation | Start/previous/next/end, selected-node numbering; disabled endpoints tested | Move slider/jump, move/position/comment search, next/previous fork and annotated/hotspot navigation; avoid accidental moves |
| Variations | All siblings at every selected-path fork, third/nested branches, commentary and saved-selection restoration tested | Inspectable tree, branch promote/reorder, clone/cut/copy/paste/delete with undo/redo; stable selection and data preservation |
| Legal continuations | Engine enforces configured live rules; imported branches preserved | Explicit edit/play modes, clear playback vs analysis distinction, rule provenance and custom rule options |
| SGF replay | Dedicated FF4 overwrite/opponent-capture/self-capture playback; ko diagrams now accepted in worktree | Extended interoperability corpus; malformed-property diagnostics, move number overrides, PL/setup semantics and inherited properties |
| Comments / node names | Imported C/N retained and comments displayed; branch names shown | Add/edit C/N, comfortable native keyboard and long-form reading; undo, cancellation, persistence/export |
| Shape markup | Unknown properties retained in SGF text | Render/edit TR/SQ/CR/MA/SL, compressed points, visibility controls; contrast on Black/White/wood, no collisions with last-move/numbers |
| Labels | LB retained but not displayed | Render/edit Unicode/text and auto letter/number labels; composed-value escaping and large-font accessibility |
| Lines / arrows | AR/LN retained but not displayed | Touch-friendly two-endpoint creation/edit/delete; directionality, legibility on stones, cancel/undo and reliable serialization |
| Dim / view region | DD/VW retained only | Correct inheritance, clearing and cropping/zoom semantics; preserve complete board for play and exports |
| Setup positions | AB/AW/AE and compressed rectangles import; handicap setup works | Author arbitrary problem positions without prisoners, choose PL; avoid mixing setup with move properties; descendants must remain coherent |
| Game information | Imported properties preserved; root komi/rules/size interpreted | Edit/display players/ranks/teams, event/round/place/date, game title/comment/source/copyright, result, handicap, rules/time info; truthful unsupported-rule handling |
| Move/position annotations | Retained only | Display/edit BM/TE/DO/IT/HO/GB/GW/DM/UC/V with correct exclusivity and optional navigation; never invent engine evaluations |
| Time metadata | Imported timing properties retained; live clocks separately durable | Display BL/WL/OB/OW, TM/OT; SGF export of accurate live clock settings/snapshots; distinguish annotations from active timers |
| Score / territory | Manual agreed dead/seki scoring; imported TB/TW retained | Render/edit TB/TW safely, rule-specific claims, carry authored markings; real dead/seki explanations and exceptional adjudication fidelity |
| Record library | Durable local save, names/dates, rename, confirmed delete, read/write failure preservation tested | Search/filter/sort, metadata previews, backup/restore/bulk operations, duplicates strategy, safe stale-file changes |
| Import formats | One UTF-8 SGF game, boards9/13/19, bounded file/tree sizes | SGF collections/game chooser, CA encodings, broader square/rectangular sizes and legacy interoperability; expose unsupported formats rather than silently corrupt |
| Export/share | Full tree/properties, setup/comments/results, native share/web file; nonmutation tested | Main line / selected variation / subtree export, collection/backup export, diagram image/vector/print, redaction options; reimport round-trip checks |
| Editor undo/redo | Game undo and preserved variations | Separate durable editing command history, grouped gestures, undo for every destructive operation; cancel-safe dialogs and recovery |
| Analysis | Offline heuristic/MCTS gameplay, no calibrated rank claim | Real analysis-engine interface, multiple candidate lines, ownership/score uncertainty, visits/provenance and explicit availability; phone constraints and offline strategy require design/verification |
| Training from records | Study lessons and unmarked local exercises | Guess-the-next-move, hide/reveal continuation, problem authoring/reply trees, assessment evidence; avoid conflating guided playback with mastery |
| Native quality | Simulated exported runtime and pure tests | iPhone touch/keyboard/safe-area/landscape/large-font/VoiceOver, big records, frame-rate/memory, force-close/relaunch and updates; independent Go expert review |

Completion requires evidence for the actual full scope, including compatibility fixtures and physical phone workflows. Parsing and retaining a property is not evidence that users can see or edit it. Passing engine tests is not proof of a professional-quality editor or rank strength. Do not declare this ledger or the broader goal complete while these gaps remain.
