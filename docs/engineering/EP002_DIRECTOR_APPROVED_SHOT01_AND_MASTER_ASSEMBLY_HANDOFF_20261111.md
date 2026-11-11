# EP002 — Director-Approved SHOT01 V2 and Eleven-SHOT Master Assembly

**Date:** 2026-11-11 (Europe/Sofia)  
**Status:** **CODE STAGED, NOT DEPLOYED; NO SINGLE MASTER MP4 CREATED.**  
**Branch:** `feat/ep002-shot01-v2-lock-and-master-assembly-20261111` (stacked from unmerged PR #264, exact baseline `0b1c62c4592f5cffcee9ae92ade9986e42f93530`)

## Director decision and immutable evidence

The Director explicitly replied **“Одобрен”** to SHOT01 V2 and requested **one EP002 video joining all eleven SHOTs**. The newly approved SHOT01 candidate has exact stored render ID `8f46fafd-9613-4375-bce2-ea98854e8b20`, composition `EP002-SHOT01-DRAFT`, **1920×1080 / 30 fps / 1172 frames**. Railway Worker logs on 2026-11-11 18:36 UTC prove `Completed 8f46fafd-...` (3,964,321 bytes); the backend subsequently served its MP4 via HTTP 206. Earlier Backend readiness logged genuine 5/5 aligned visual cues with no blockers. This establishes a real saved candidate, **not an independent full-frame creative review or exported EP002 master**. The Director's current explicit acceptance supplies creative approval.

The previous approved SHOT01 V3 MP4 `447f2846-3d1d-4d6c-924c-ea3918520625` (1280×720, 980 frames) must remain stored as historical provenance; do not delete or overwrite it. SHOT02–11 exact original Director-locked IDs are preserved.

## Staged changes

1. `frontend/src/components/Ep002LockedCutReviewRoom.tsx` now pins the **new SHOT01 V2** exact render ID and size, without any latest-successful fallback. Historical V3 reference remains described but is no longer active.
2. `frontend/src/components/Ep002LockedCutReviewRoom.test.ts` updates the exact source, dimension, frame count and negative archived-720p checks.
3. `EP002_DIRECTOR_LOCKED_MASTER_INPUTS_20261111.json` lists eleven approved render IDs in exact order; expected frame counts are specified only when supported by the current pinned records. Unknown expected counts are `null` and MUST be read from authentic stored MP4 ffprobe evidence.
4. `remotion-engine/ep002-locked-master-assembly.mjs` is a reusable, local-input FFmpeg **stream-copy** assembler with strong preflight, one-video/one-audio track, full HD/30fps/H264/AAC, real frame counts, matched codec parameters, immutable source files, no fallback, atomic output and explicit execution flag. It cannot fetch private media or start a cloud render on its own.
5. `remotion-engine/ep002-locked-master-assembly.test.mjs` contains Node-native source/lock/consent regression tests. **Tests and production deployment have NOT been executed by this source-only change.**

## Required remaining Stage 7 integration — NOT DONE

- Add a Director-authenticated, read-only **Master Preflight** in MediaOS that retrieves exact pinned metadata for **all eleven** stored source IDs, checks availability, video/audio codec and source lineage, and shows a locked-input manifest and honest blockers.
- Add a **separately explicitly paid** `Render full EP002` action protected by existing Director auth, CSRF, immutable input hash, idempotency/charge ledger and one-job concurrency. Opening Director Room or approving SHOT01 must never trigger paid CPU.
- Allow the existing verified Render Worker to download exact approved MP4s through scoped worker-only credentials, put them into a temporary isolated directory under their immutable UUID filenames, then call the assembler. Never use latest-successful lookups or touch source MP4 rows.
- If ffprobe detects incompatible stream copy parameters, block safely and require a separate, tested explicitly approved normalization/encoding mode; never publish a corrupted concat. Validate completed output with ffprobe, eleven continuous ordered segments, audio track, expected total frames/duration, actual playback and each of the ten visual/audio transitions.
- Store the **new** Full HD combined review MP4 and its exact eleven source IDs + immutable provenance in MediaOS with its own review status. Show it as **one real video player** and export option, not the existing multi-player Play all simulation. Director gives separate final creative LOCK after viewing it.

## Exact next gates

1. Run the new Node regression tests and existing Director Room frontend Vitest/TypeScript tests, then full relevant Java and Worker safety gates, without invoking a paid provider or video render.
2. Review/merge the scoped source change through authorized GitHub workflow; verify Railway exact SHA deployment and authenticated Director Room pinned SHOT01 V2.
3. Implement safe backend/worker Stage 7 master job and UI. Director separately confirms the actual billable CPU operation.
4. Verify a **real** single MP4 master in storage; inspect SHOT01→02 and all remaining transitions, audio and final ending. Until these gates, **do not report EP002 fully assembled**.

**Source governance:** Roadmap v1 remains unchanged. EP001 and original EP002 script/visual sources and all individual approved Takes/MP4s stay protected. No ElevenLabs TTS, Paid Alignment, OpenAI API, Railway Render, Director auto-LOCK or automatic publication is authorized by this handoff.
