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