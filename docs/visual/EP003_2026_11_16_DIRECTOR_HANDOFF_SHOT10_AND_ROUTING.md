# EP003 — Director handoff, 2026-11-16

## Locked source decisions

Director explicitly approved **SHOT08 V3** and **SHOT09 V2**, Premium Routing revisions, in chat. All historical old renders remain preserved.

- SHOT08 V3: render `d67eec72-66bb-427b-bdb9-0d4043ed5dd2`, SHA256 `270744ad8a3fc0bd0aee2ea65fbdd83b887eb59dab05a7a369aaefe553a96bc1`, 5372 frames, original selected Slow Natural voice.
- SHOT09 V2: render `b3a3912f-79ee-4c72-b313-cbe09f950a5e`, SHA256 `f80a362e0b805edf7eee045e11d5c6492280fdea997eb9a9204ce5f5c458dc7f`, 3145 frames, original selected Slow Natural voice.
- Official locked manifest `remotion-engine/ep003-director-locked-visual-sequence.json` contains SHOT01–09, all Director-LOCKED. Preserves SHOT01–07 exact IDs and SHAs and uses SHOT08 V3 and SHOT09 V2.
- Official 9-SHOT full film: render `f2d433f5-3d3e-481e-ab2a-e843ab31e4ef`, SHA256 `88349289e064ba90c5b7927a1f0f2dfbdc1b4e95c797c22347e2affd4912df30`, 31,473 frames, 1049.1s = **17:29.10**, 1920×1080 @30fps H264/AAC, stored MP4 with all **8/8 decoded joins PASS**, actual PSNR from 42.833128 to 44.366317dB, every master-to-source frame at joins exactly 100dB. Source stream-copy without audio regeneration/reencoding.
- Official link (signed-in MediaOS): `https://media-os-backend-production.up.railway.app/#/ep003/full`.

## SHOT10 V1 successfully rendered, NOT Director-LOCKED

- Original approved script **Prove the Architecture Works**, selected existing Slow Natural Take `0168eb87-538f-49d8-9c79-132d822bdb60` (131.36 seconds), genuine aligned source, zero paid TTS calls.
- Remotion composition `EP003-SHOT10-MEASUREMENT-V1-DIRECTOR-CANDIDATE`. Source worker commit pin `0fc02175a4ea411a27528df6a35065709a35d6c6`.
- Distinct saved review MP4 render `ae6e5d7b-1b0d-45b1-9d20-564cbc9000d9`, SHA `3b795fd9a7d0090f8ef58075912bcf027b794b05ec5101072d476f73dc47555f`, 4016 frames = **2:13.8667**, 1920×1080@30fps, H264/AAC, 12,480,726 bytes.
- Exact last decoded frame of SHOT09 V2 is frame 3144, SHA `f19d84de6b968283b1e1e0e9f299d2b3dd6ea30aebbd61a97d734af74ace109f`; source pre-render still P0 100dB. Final encoded SHOT09→SHOT10 first frame **44.49354dB PASS** (threshold 27dB), early-motion 23/23 moving steps PASS.
- SHOT10 V1 uses 25 actual aligned voice cues, content-fitted cards for SLI, SLO, p95, rejected requests, database load, shard overload, failover, RTO/RPO and user journey correctness. It reuses the Premium Routing paths and forks the SHOT09 final Living World so there is no architecture reset at SHOT boundary.
- Build 9/9 isolated tests pass, one unrelated longstanding EP001 TS preflight error displayed but build succeeded.
- Railway deployment `3dbeb562-4ab5-4c92-ad5e-0456b45d9350` produced `EP003_SHOT10_P0_REAL_SEAM_AND_MOTION_QA` and `EP003_SHOT10_V1_REAL_MP4_SAVED`. MediaOS production backend deploy `14c7c8d5-16e7-4ae0-91bd-17ee7f6a70fc` SUCCESS with 532 Java tests 0 failures/errors, frontend tests pass. Exact protected GET endpoint `/api/v1/remotion/renders/ep003/shot10/v1/latest-successful` is pinned to engine `EP003_SHOT10_PIN_0fc02175a4ea`, 4016 frames, status SUCCEEDED & stored MP4, with directorLocked=false. Review route `https://media-os-backend-production.up.railway.app/#/ep003/shot10/v1`.
- **NOT LOCKED. Do not append to official master until Director visual approval.**

## Important unresolved visual inconsistency in historic shots

The Director explicitly requires no visible line style differences between SHOT01–10. Inspecting actual code confirmed **SHOT03–07 still use independent, loose cubic Bezier replica lines**. SHOT04–07 also have three cubic `QUERY_PATHS`. The newer SHOT08 V3 and SHOT09 V2 rely on shared, deterministic, engineered Premium Routing. SHOT10 V1 uses same Premium Routing inherited from SHOT09. SHOT01–02 occur before replicas so geography differs.

This discrepancy is **NOT RESOLVED IN THE OLD RENDERED VIDEO**. The 8/8 seam PASS in the nine-shot master verifies boundary continuity only, not stylistic uniformity inside the shots. Do not tell Director all earlier lines were changed. Preserve historical Director LOCKs and render IDs. Created a proposed versioned compatibility primitive `remotion-engine/ep003-legacy-premium-routing.mjs`, tests `remotion-engine/ep003-legacy-premium-routing.test.mjs`, and specific audit `docs/visual/EP003_LOCKED_SHOTS_ROUTING_CONSISTENCY_AUDIT_2026_11_16.md`. These are groundwork ONLY. No replacement renders/Director approvals for SHOT03–07 yet. Requires distinct source revisions and sequential re-render/re-review to guarantee correct existing predecessor shot boundaries.

## Source of truth and next actions

Working branch `feat/ep003-lock-premium-08-09-shot10-sli-slo-20261116`, draft PR [#304](https://github.com/stefanVasilev17/media-os/pull/304). Visual standards `docs/visual/EP003_PREMIUM_ROUTING_VISUAL_CONTRACT_V1.md`, `docs/visual/CODEX_VISUAL_LESSONS_LEDGER.md` AT-VIS-0003, `AGENTS.md`.

1. Director reviews SHOT10 V1 inside protected MediaOS and provides corrections or explicit LOCK.
2. Separate versioned upgrades for SHOT03–07 are needed to resolve Director's line consistency requirement. Preserve previous LOCKED MP4s. Then approve, sequentially stitch, and repeat all real decoded seam checks.
3. Only after explicit SHOT10 LOCK append SHOT10 to the official master. It is currently the 9-SHOT locked master.
