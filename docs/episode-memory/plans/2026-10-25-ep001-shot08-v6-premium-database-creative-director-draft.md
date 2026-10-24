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
