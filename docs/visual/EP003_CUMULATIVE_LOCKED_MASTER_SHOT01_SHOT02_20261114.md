# EP003 — FIRST REAL CUMULATIVE DIRECTOR-LOCKED FULL VIDEO — SHOT01 V2 → SHOT02 V3

**Date:** 2026-11-14 Europe/Sofia. **Production result: REAL SAVED MP4 + tested continuous seam + production MediaOS Full Video player live.** This is the **full assembled film so far** (2/11 planned SHOTs), not an assertion that all eleven SHOTs are complete.

## Confirmed Director visual locks, exact immutable source bytes

| Sequence | LOCKED shot | MediaOS render ID | Exact source MP4 SHA256 | Frames @30fps |
| --- | --- | --- | --- | ---: |
| 1 | EP003 SHOT01 V2 | `b6fd7f30-7c78-414b-a88c-387c0ee8c43a` | `da6d3cbc77dc3a0dc5374aec4a7ba8beb97739d4c5facffdf36d1585e7587c08` | 2514 |
| 2 | EP003 SHOT02 V3 | `8598d156-438f-4614-a9dd-ce6172233d9b` | `eee2308b3f8150ac9ac49db6b0a257374e40fbbf8ddf6b1245ae58d5400ff471` | 3443 |

**SHOT02 V3 Director LOCK issued explicitly 2026-11-14.** It includes exactly 2 seconds / 60 frames of continuously animated Living Architecture World before its original narrator, and LATENCY/THROUGHPUT simultaneously explained with spaced cards. No source video or locked Slow Natural Take was regenerated or retimed. SHOT02 V1/V2 NOT locked and MUST NEVER substitute into this film.

## Actual saved first MediaOS complete EP003 film

- **Exact real cumulative render ID:** `bf0f2871-b276-44b2-ac39-13a42fb3a5e1`.
- **Watch directly:** https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/bf0f2871-b276-44b2-ac39-13a42fb3a5e1/video
- **EP003 in MediaOS / new latest Full Video player:** https://media-os-backend-production.up.railway.app/#/episode-packages/import?ep003=1
- **MediaOS DB:** `composition_id=EP003-CUMULATIVE-DIRECTOR-MASTER`, `render_key=EP003_CUMULATIVE_LOCKED_SHOTS_01_TO_02`, `status=SUCCEEDED`, `profile=REVIEW`, with `input_props.directorLocked=true`, `input_props.verified=true`, SHA-pinned ordered `sequence[]`, actual seam QA and immutable hash.
- **Final MP4 SHA-256:** `d4d754aa2f6c300743a89f717515bd8aa053fb4790876f83786f011a09a88db2`.
- **Actual MP4 size:** `23,369,344` bytes.
- **Format and length:** **H.264/AAC**, 1920×1080, 30fps, **5957 frames = 198.5666667 seconds = 03:18.57**. SHOT01 frames **0–2513**, SHOT02 frames **2514–5956**.
- **Creation method:** FFmpeg concat demuxer **stream copy (`-c copy`)**, absolutely no reencoding of Director-LOCKED source video, no new or resynthesized voice, no added extra 2s pause. SHOT02 V3 already owns its own 2s voice lead-in.
- **Real seam QA measured on actual encoded MP4:** preceding last frame **2513** vs succeeding first frame **2514** PSNR **44.652046 dB**, ≥27 PASS. Both selected source frames were independently compared with their matching actual complete-video decoded frames and yielded **100 dB (infinite/effectively identical)**. Same Living Architecture World, camera and on-path request motion continue. Numeric QA is not a substitute for reviewing real viewer-perceived motion.
- **Production worker:** `ep003-cumulative-director-master-once`, verified Railway deployment `4dfd06e2-5f1c-46f9-9bcf-38d642b6f54d` `SUCCESS`, pinned commit `ad0612a703083139b8662b6c0d04d5fd85e469af`. Seven specific manifest/QA unit tests **7 pass / 0 fail**. Worker source [PR #292](https://github.com/stefanVasilev17/media-os/pull/292) merged `main`.
- **MediaOS backend + frontend:** Railway deployment `eb63b5d3-9e4b-4dfa-b413-c2e66d32a15c` `SUCCESS`, commit `e02e8f4e9df40b216445ea0910b7c69ba276e0ca`; 532 Java tests (0 fail, 0 errors, 1 skipped), frontend successful test/build and green actuator healthcheck. The [UI PR #293](https://github.com/stefanVasilev17/media-os/pull/293) is merged to its MediaOS feature branch; do NOT imply it was merged to `main` (large longstanding branch divergence; production uses explicitly pinned successful commit).
- **Safety:** `EP003_CUMULATIVE_MASTER_ASSEMBLY_APPROVED` reset to `false` after successful saved video, with `skipDeploys=true`; no accidental reassembly, retries or paid TTS. New cumulative builds require new Director-approved manifest and Executor-authorized deployment. Backend retention explicitly protects SHOT01 V2, SHOT02 V3 and all EP003 cumulative master MP4s.

## Permanent next SHOT workflow (every EP, every approved new SHOT)

1. Render SHOT N from its selected original voice and exactly preceding locked source's real last encoded frame; ensure timeline, text-fit, source paths, stable animation, and 2-second breathing at approved joins. Present its candidate MP4.
2. **Director review of candidate inside the entire film is valuable:** once a next candidate SHOT exists, the Executor should prepare a **clearly labeled NOT-LOCKED cumulative review preview** comprising locked SHOT01…N−1 plus that newest candidate (without changing the current locked master). This editorial workflow rule is now recorded, but the separate unapproved-candidate preview assembler is NOT yet production-enforced; implement and verify it with the first next candidate SHOT03. Do not pretend the existing locked-only assembler automatically covers unapproved candidates.
3. On Director explicit LOCK of SHOT N, pin its true MP4 ID/hash and append exactly the new sequential entry to `remotion-engine/ep003-director-locked-visual-sequence.json`. Trigger the **same** idempotent worker with renewed explicit authorization; it checks exact original MP4 blobs and every decoded seam, then writes a new uniquely keyed `EP003-CUMULATIVE-DIRECTOR-MASTER`. Source clips and previous masters remain untouched.
4. MediaOS **EP003 · Full Video (latest)** automatically selects the verified saved master with the largest contiguous approved shot count, instead of the latest unrelated SHOT render. The Director can play it at any time, even if a new render is running or fails. The editor never has to manually concatenate files.
5. After SHOT02 V3, SHOT03 MUST start at actual last encoded frame **3442** of SHOT02 V3, continuing Living Architecture world **17933**; do not use original V1/V2 or this cumulative master's final frame as substitutes without proving identity.

**Status:** both selected source SHOTs DIRECTOR LOCKED. Full EP003 film with 2/11 shots SAVED and production player LIVE. SHOT03 remains unrendered/unlocked; no future work is being performed without a new request. [Global cumulative rule](../engineering/AT_DIRECTOR_P0_EPISODE_CUMULATIVE_MASTER_ALWAYS_AVAILABLE_20261114.md).
