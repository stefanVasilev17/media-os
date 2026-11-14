# EP003 / SHOT05 — Stale Read, Replication Lag (Execution Contract)
**Date:** 2026-11-14  
**Status:** Director Review candidate V1; **NOT Director-LOCKED** until the Director explicitly watches and approves.  
**Canonical references:** Architectural Thinking Core Production Bible v2.3; Remotion Agent Visual System v1.0; the already Director-LOCKED SHOT04 V1 and three predecessors.

## Immutable predecessor (P0)
- SHOT04 V1 H.264/AAC: `4079729b-c1b3-405c-9a83-1ace0ef25641`
- Source MP4 SHA-256: `61fd35dc6662b259818b6d29379b39948a7239fa6588f7c23a010b97a7a5a5f3`
- Frames: `3841`, worldStartFrame: `21012`, last world frame: `24852`.
- SHOT05 frame **0** must be exact last *decoded pixel frame* of source SHOT04. Frame **1** resumes live same-world animation at `24853` without opaque 55-frame hold, camera reset or scene cut. Use raw final-frame extraction and first-frame PSNR at least 27 dB. All first 23 temporal steps should move.
- Preserve `translate3d(-7px,0,0) scale(1.007)`; `Shot07CleanArchitectureWorld` props, consistent camera and background; Auth, Phone, Primary and two smaller cylindrical DB replicas in unchanged coordinates.
- Preserve the replica A/B particle phase inherited from SHOT03/SHOT04: age `3080-1 +3841-1 + localFrame -1199`; particle positions on existing cubic Bezier replication paths only.
- Preserve query-path dash phase `-(3080+3841-1+localFrame)*.74`. No new free-moving Login particle or invented request shortcut. Existing Auth→Primary and Auth→replica query paths are not topology changes.

## Approved story and locked source voice
- Exact script: `SHOT05 — The Replica That Gives the Wrong Answer` in `backend/src/main/resources/ep003-director-locked-voice-package-v1.json`; no editorial rewrite.
- Selected original Slow Natural Take: `da70458f-6728-4437-953c-58113c8aae8d` (as verified against MediaOS DB); duration 97.52s, lead-in 60 frames, 3001-frame render.
- Narration anchors are taken **only from actual word-level timing**. No guessed timing, no TTS regeneration.

## Visible semantic beats
- First: same image/world as SHOT04 ending, then fade heading `WHO CHOOSES THE DATABASE?` into `THE REPLICA GIVES A WRONG ANSWER`, without a location jump.
- Primary authoritatively writes the account lock; legend `PRIMARY STATUS: LOCKED`. Replica A may still show older account status; legend `REPLICA A: OLDER STATUS` and later `REPLICA A: MAY CATCH UP` (do not claim instant catch-up).
- If showing unsafe routing to Replica A, mark the *existing query curve* as a **hypothetical error**, not a new Login path and not a moving request dot. Critical authentication decisions still require appropriately current authoritative information.
- Reusable educational card lane is `left=560 top=771`. Each two-line glossary card is measured with `shot10TextWidth`, with no word wrap or text overflowing the card. Card width constrained 320–900px. No database overlaps, no cards inside other containers.
- Card sequence: `ACCOUNT STATUS CHANGE`, `REPLICATION LAG`, `STALE READ`, `EVENTUAL CONSISTENCY`, `SECURITY FIRST`, `FAST DOES NOT MEAN CORRECT`.
- Original SHOT04-like dark navy/cyan/mint/amber Living Architecture style, exact original database cylinder icons, original typography and paths.

## Release and full-film policy
- Isolated Remotion composition: `EP003-SHOT05-STALE-READ-V1-DIRECTOR-CANDIDATE`; render key `EP003_SHOT05_STALE_READ_V1`.
- Original SHOT01–04 become an immutable 4-SHOT Director-LOCKED official master only. Latest official full-video MediaOS player is singular (one newest official full film).
- Assemble optional separate 5-SHOT **WIP** from four locked source MP4s and SHOT05 candidate. Stream-copy H.264/AAC; validate *all four* actual pixel seams, including SHOT04→SHOT05. Show WIP as review only; do not auto-promote it into official master.
- Director alone may LOCK SHOT05 after watching actual exported MP4 and WIP. SHOT06 must inherit the final world frame of whatever SHOT05 version gets LOCKED.
