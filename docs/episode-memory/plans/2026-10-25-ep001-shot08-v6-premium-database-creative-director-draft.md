# SHOT 08 v6 — Premium Database Lookup — Director Review

**Status:** Implemented, NOT Director LOCKED. Script narration pending a revised approved voice pack. Based on Director feedback on v5.1, which approved map→table storyline but requested less irritating Database node scan, no PowerPoint-like window growth, more premium workspace, and a complete stop on Account 0042.

## Native preservation
- No edits to SHOT 01–07 source, voice or locks. Reuses exact terminal frame 4881 of SHOT07 via `Sequence from={-4881}` on the original locked `AuthServiceTier2V10YoutubePreview`, with locked alignment anchors. Cumulative 12:18.1 preview remains `1fcb24e2-99bc-4e97-85f1-cbafcfc4e94c`.
- New versioned component `remotion-engine/src/episodes/ep001/live-diagram/UserDatabaseV6Premium.tsx` and isolated composition `EP001-Shot08-PremiumV6` (55s, 30fps, 1920x1080 logical canvas; 1280x720 FAST_PREVIEW).

## Director changes
1. **Exterior scanner**: only one restrained cyan perimeter draw with three short horizontal data pulse bands. Eliminates the rapidly looping scan-line sweep and hard jump. The node remains original.
2. **Transition**: deletes animated expanding rectangle/mask from v5.1. Uses a softened, dimmed and subtly magnified external architecture map under a restrained, short-opacity-plus-19px-workspace-settle transition. This is a content activation, not a faux window scaling. The existing map remains as backdrop during the transfer of attention.
3. **Internal design**: bespoke premium observability palette with header `USER DATABASE / IDENTITY STORE / USERS`, chips `READ ACCESS / INDEX ACTIVE / QUERY 001`, structured indexed email query, strong results typography, thin column separators, understated role/status micro-tags. Not generic administrative cards.
4. **Correct-result stop**: query scan passes only rows 0, 1, 2; at `ACCOUNT 0042` scanner fades to zero and is never rendered on 0047/0052. Other rows dim; precise cyan geometry isolates selected row; success applies to *identifier match only*. The original green Login Request remains waiting.
5. **Result beat**: selected row lifts slightly. Compact lower `MATCH FOUND 0042 / IDENTIFIER alex@example.com / NEXT CREDENTIAL CHECK` surface reveals. No token issuance, no login-authenticated claim, and no iPhone Dashboard (later shots).

## Provisional 55-second deterministic beats
| Beat | Default video-local timestamp (s) | Cue anchor |
| --- | ---: | --- |
| DB node scanner start | 2.4 | implicit |
| Workspace reveal start | 8.7 | `DB_TABLE_OPEN` |
| Rows appear | 13.4 | `DB_ROWS_START` |
| Candidate scan starts | 20.0 | `DB_ROW_SCAN` |
| Last candidate is ACCOUNT 0042 | 24.85 | within row scan |
| **Stop on account 0042** | 28.5 | `DB_ACCOUNT_MATCH` |
| Hero isolation/lift | 32.1 | `DB_MATCH_HERO` |
| Context/result strip | 38.3 | `DB_RESULT_REVEAL` |
| Final hold | 43–55 | — |

**Narration status:** No Director-approved revised SHOT08 voice recording exists. These are visual-directing cues, not claims of achieved word-aligned audio sync. When recorded narration is available, align `DB_ACCOUNT_MATCH` exactly to spoken "found the right account" beat. Match SFX / sound design may be composed only after visual director acceptance. Current Remotion preview does not contain narrator or SFX.

## QA gates
- Bun TSX parse: PASS 13,831 bytes source.
- Render v6 separately; inspect encoded frames 0, 6, 9, 11, 18, 23, 26, 29, 34, 41 and 50 seconds for premium look, legibility, overlap, 0042 stop, continuity, and unaltered former locks.
- Remain NOT LOCKED pending Director's visual approval.

## Optimized V6 render and native MP4 QA — 2026-10-24

- New optimized source commit `1368a3ab4fe5c4d0dfbb1fb44d53b79bb49260fd`. This selectively stops rendering the expensive original SHOT07 Living Architecture Map component once the Database workspace visually covers it (at `DB_TABLE_OPEN + 3.5s`). Also removes premature visual differentiation of record 0042 before the match event and reduces map blur.
- Both Railway Remotion worker and backend deployed the optimized source with `SUCCESS`; backend provider engine `AT_REMOTION_1368a3ab4fe5_20261024222527`.
- **Canonical v6 review render:** `e2692e30-14f0-477a-902e-6cab835af993`, composition `EP001-Shot08-PremiumV6`, `FAST_PREVIEW`, `READY`, 1650 frames (55 seconds), 1280×720, 30 FPS, 1,957,937 bytes; completed 2026-10-24T22:30:57Z.
- **Playable MP4:** https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/e2692e30-14f0-477a-902e-6cab835af993/video
- HTTP delivery independently checked: **206 Partial Content**, `video/mp4`, valid 128-byte range with `ftyp` MP4 signature, exact file size.
- Independent frame capture from encoded MP4 successfully extracted and visually inspected frames at **0s, 5s, 9s, 11s, 18s, 22s, 26s, 29s, 34s, 42s, 50s**. Key outcomes: opening continues the real locked SHOT07 main Living Architecture Map; 5s database remains source of scene attention; 9–11s new activation-based fade/blur workspace transition; 18s full modern table with status and role chips; 22s scan on initial row; 26s scanner at ACCOUNT 0042; 29s row 0042 visually identified; 34s correct row isolated and other rows dim; 42/50s result panel `MATCH FOUND 0042 / IDENTIFIER alex@example.com / NEXT CREDENTIAL CHECK` holds without scanning a later row.
- One-shot native MediaOS QA confirmed **SHOT01–07 all remain `locked` and `QA PASS`** with unchanged locked render IDs; Director-approved cumulative preview render id remains exactly `1fcb24e2-99bc-4e97-85f1-cbafcfc4e94c`.
- **No Director creative approval or SHOT08 native lock yet**. This is an actual, fully encoded **silent visual-only review draft**, not a voice-synced master. New beat anchors are wired and will be adjusted to actual word timings after the approved revised SHOT08 voice track is supplied; do not claim completed audio sync.
- Previous first V6 pre-optimization render `7a9944d3-155a-4cdf-9320-aba8c357d414` is an obsolete slow candidate and should not be presented as the latest preview.
