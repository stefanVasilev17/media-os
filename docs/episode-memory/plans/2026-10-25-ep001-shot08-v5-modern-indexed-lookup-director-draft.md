# EP001 SHOT 08 — V5 Modern User Database Indexed Lookup — Director DRAFT

**Director instruction:** Return to established Living Architecture Map with original User Database scanning and, during scan, open modern working-database screen with logical rows and columns. Animate selected account on the corresponding narration beat.

## Narrative and visual timeline

- 0–8.5s — exact frozen SHOT07 terminal frame 4881, native map unchanged and active cyan scan overlay in original User Database node (1733,613). Original mint login waits in Auth Service.
- 8.5–11.9s — DB-origin expanding rectangular reveal, deliberate new data-table screen opening while original map remains visible beneath. No detached arbitrary camera dive.
- 11–17s — 5-column USERS database table header: USER ID, EMAIL, DISPLAY NAME, STATUS, ROLE. Five clear legible fictional logical rows.
- 19–31s — cyan scan/search animation keyed to lookup of alex@example.com. The search illustrates logical record selection; an indexed query is not literally a full physical table scan.
- 31–36s — highlight USER ID 0042 and alex@example.com in matching row, dim other rows.
- 36–46s — selected row lifts out into elevated detail and record 0042 detail ribbon; the role can be Member, but no successful authentication is implied.
- 46–55s — selection holds for comprehension; next step is separate credential verification, not Session Restore or iPhone Dashboard.

## Production identity

- File: remotion-engine/src/episodes/ep001/live-diagram/UserDatabaseV5ModernTable.tsx
- Composition ID: EP001-Shot08-TableLookup-V5; duration 1650 frames / 55 sec at 30 FPS (FAST_PREVIEW 1280x720).
- Color language: navy #081B34, cyan #45DFFF, mint original login waiting, clean technical typography, thin grid and purposeful highlighting.
- Cue anchors DB_SCAN and DB_TABLE_OPEN; once actual Director-approved SHOT08 voice exists, re-align all search/match/reveal moments to word-timed voice. CURRENT V5 IS A SILENT VISUAL DRAFT: do not claim existing approved audio or fake audio sync.
- Protect locked SHOT01–07, existing exact render IDs, QA PASS and approved 12:18.1 cumulative MP4 render 1fcb24e2-99bc-4e97-85f1-cbafcfc4e94c.
- V1–V4 remain archived/rejected; do not overwrite. V5 must undergo Director Review before any LOCK.
## 2026-10-25 visual QA correction and re-render

- Initial 55-sec v5 render `800b1cd3-8ed6-439f-84cb-9a32f133d05d` completed READY, but frame-by-frame sampled QA revealed **wrong opening frame** (Auth Service detail screen, not living architecture map). Therefore **rejected as Director-ready despite valid video.**
- Cause: wrapping the SHOT07 scene in `<Freeze frame={4881}>` did not produce the intended last-frame render in this nested context. Fixed source in commit `5ddc11ad` using `<Sequence from={-4881}>` so this scene's local `useCurrentFrame()` is evaluated as the correct SHOT07 final frame.
- Independent 2-sec opening QA render `44a901c9-4628-45f5-9e55-6d2bab12623a` rendered successfully and sampled frames at seconds 0 and 1. **Visually confirmed** first frame displays original full Living Architecture Map with gateway/balancer/auth/database, green Login Waiting, and DB cyan storage scan; no Auth Service detail card.
- Corrected full 55-second v5 preview `23e4b4b1-b4b2-4a9d-b4ca-82d99d45da3d` was accepted as **QUEUED** at `2026-10-24T21:59:44.750555Z`, composition `EP001-Shot08-TableLookup-V5`, FAST_PREVIEW 1280×720, 1650 frames at 30fps, `engineVersion AT_REMOTION_5ddc11adfd4e_20261024214235`.
- Protected SHOT01–07 native locks and existing approved 12:18 montage remained unchanged at submission. No SHOT08 native or Director LOCK.
- New output status must be verified READY and playable before presenting as finished. It is a **silent** visual-only preview; no approved revised SHOT08 voice exists, and no audio/SFX has actually been mixed into this output yet.
## V5.1 director preview visual QA — 2026-10-24

- V5 initial 55-second render `800b1cd3-8ed6-439f-84cb-9a32f133d05d` completed READY (1,650 frames; 1280×720). Frame extraction at 0/5/9/12/16/24/34/42/50 seconds showed the **wrong opening** (Auth Service phone detail screen) caused by Remotion `Freeze` rendering context; rows and match visualization were visually intact. Therefore this candidate is **rejected, NOT LOCKED, NOT RELEASED**.
- Fixed v5 component uses `Sequence from={-4881}` of the exact source SHOT07 v10 and aligned fixed anchor props, preserving original map. New code commit `5ddc11adfd4e50fd28ff9990991e8f00e1c75cd5`; deployment verified on both worker and backend.
- **Isolated 2-second opening QA render:** `44a901c9-4628-45f5-9e55-6d2bab12623a`, READY. Independently extracted actual MP4 still frames 0 and 1. The frames visibly show the *real main architecture map* including Request Assembly, Network / Transit, API Gateway, Load Balancer, Auth Service, User Database, original mint `LOGIN WAITING`, and User Database scanning. This validates the corrected opening; it does not yet validate the remaining 55-second corrected render.
- **Corrected V5.1 55s full visual-only render submitted:** `41864a99-2211-420b-b9b5-fca1fbe706fe`. Rendered using `EP001-Shot08-TableLookup-V5` 1280×720 30fps FAST_PREVIEW, 1650 frames. Initial worker progress 20% as of 2026-10-24T22:02:49Z. Separate from v5 first bad candidate.
- Both v5 preview job submissions were guarded by MediaOS verification of 7 previously director-LOCKED/QA PASS shot masters and cumulative preview id `1fcb24e2-99bc-4e97-85f1-cbafcfc4e94c` unchanged.
- **IMPORTANT:** v5.1 is a silent visual-only review candidate, NO approved SHOT08 voice pack or synchronized narration exists. Prior chat comments about a completed sound design do not establish audio in the encoded MP4; no audio has been mixed yet. The row-scan cues are provisional until approved voice/audio is obtained.
- **Next:** after corrected render reports READY, check HTTP partial MP4 delivery and extract at least 0/9/12/24/34/42/50s frames. Only then share corrected review link. Director must approve before creative/native LOCK or adding to cumulative preview.
