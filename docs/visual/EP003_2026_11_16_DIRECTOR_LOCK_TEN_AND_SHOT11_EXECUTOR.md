# EP003 — Director LOCK SHOT01–10 + SHOT11 human-first finale implementation (2026-11-16)

## Director authority and persistent requirements

The Director watched **the verified corrected full ten-shot film** and explicitly approved: "ТОчно така! Харесва ми! Това търсим! ЛОКВАМЕ!" This is an explicit final visual **Director LOCK** for SHOT01–10, including SHOT08 V4, SHOT09 V3 and SHOT10 V2. The creator is Director and only reviews/corrects/LOCKs; the AI Executor codes, renders, runs QA and publishes candidate video review to MediaOS.

Non-negotiable for every future SHOT:
- **One World. One Living Map.** Use the exact existing Phone, Gateway, Load Balancer, Auth Service, SHARD A/B, Replica A/B layout and approved color/typography/route primitives.
- No container inside/over another unrelated container. On-screen labels must remain fully **inside their own safe containers**, with measured text widths, and never touch architecture nodes. A recap card at x560,y777 with max width <=830 and max right x1390 is established and safe, outside the Phone x55–500 and the Owners/Replicas x1550+.
- Moving request dots MUST be sampled by `premiumRoutePoint` from the identical `premiumRouteD` centerline on the visible path, with **no independent or hand-drawn off-rail trajectories**. SHOT11 reuses the inherited SHOT09/10 route-based dots, and adds no new moving dots.
- **No visible SHOT cuts:** new SHOT begins with the actual last decoded preceding MP4 frame (no approximate SVG still), with exact SHA256-verified preceding MP4 and a brief live-world fade only after source frame 0. Encoded first-frame PSNR>=27dB, at least 18/23 early moving steps, controlled first step >0.12 and <4.5. For SHOT11, the composited 8-frame blend is derived from the SHOT10 V2 successful approach.
- Original selected Director-approved Slow Natural voice only; real word-level timing from stored ElevenLabs alignment, never guessed time or silent/AI narration substitution. No paid regeneration.
- Each unapproved new SHOT has a separate composition, worker, SHA-pinned render and protected MediaOS preview. Older locked sources remain immutable. QA PASS does not itself confer Director LOCK.

## Official locked SHOT01–10 master — completed

Historical older 9-SHOT manifest and its MP4 were preserved unchanged in `remotion-engine/ep003-director-locked-visual-sequence.json`.

New immutable ten-shot approved manifest: `remotion-engine/ep003-director-locked-visual-sequence-10.json`. Separate assembler: `cumulative-engine/ep003-assemble-master-10-locked.mjs`, test `...test.mjs`, Dockerfile `Dockerfile.ep003-cumulative-master-10-locked-once`.

**Verified official ten-shot render:** `a8124e83-6fb2-4017-9592-f7f776dac862`, SHA256 `3de44ac60a707ada94671d1c044d0e4641ce2c6172b632da75ec805c27cf9a7e`, 142,114,861 bytes, 35,489 frames at 30fps, 1920x1080 H264/AAC, **19:42.9667**. Original voice preserved; source stream copy with no audio regeneration and no video re-encode. All **9/9** decoded joins PASS, all actual PSNR 42.83–44.64 dB, exact adjacent source/master pixel matches 100 dB.

Official video should be visible in existing MediaOS `#/ep003/full` via `EP003_CUMULATIVE_LOCKED_SHOTS_01_TO_10` exact render. Old 9-SHOT master remains an archived separate asset.

Exact corrected locked predecessors:
- SHOT08 V4 render `07207345-1350-4e82-aea2-3c369160f653` SHA `88505c6482bfe929a42ca4c8313a22e8b7ed072563958990e9d5725fbf28895b`.
- SHOT09 V3 render `53ac60b4-346e-400b-8dec-7932ef2de94d` SHA `be4b6cd623ab01ef199e4fba312ced36d26cc6edf21aab62c17f2ebadb3a00cf`.
- SHOT10 V2 render `174c8a8b-3202-4067-95ef-7dab1de11aa3` SHA `7c1a2a783a8c4a157d82c16b29628301e734bc9b125fad827765a95d4a5e1c43` (4,016 frames; decoded last frame SHA `90bdedae663d796e11264af15f0f9b05949390bca83587a7f7de0db50d52fdad`).

## SHOT11 V1 — currently an UNLOCKED candidate

Editorial: "What One Login Teaches Us About Architecture" (original Director-approved script v0.4), a quiet human-first retrospective. Continue the actual SHOT10 ending, do not construct a new architecture view.

Saved existing Slow Natural selected voice Take `5c3435f6-ae66-4ec3-a6b0-bf1cc8207486`; duration 100.96s; existing audio 1,616,291 bytes; actual normalized character-level alignment 1860 chars; source text SHA matches, paid calls made 0. Verified by `cumulative-engine/ep003-shot11-voice-preflight-once.mjs`.

New scene: `remotion-engine/src/episodes/ep003/Shot11HumanFirstFinaleV1.tsx`. Reuses `Ep003Shot09FinalWorldForShot10V2` with inherited worldFrame 47457, precise continuationFrameOffset=7159. First frame is the **actual decoded final SHOT10 image**, 8-frame source blend and shared premium routes. It retains previous title "PROVE THE ARCHITECTURE WORKS" at first, gracefully fades to "WHAT ONE LOGIN TEACHES US". Six mutually exclusive, content-measured recap cards use exactly the previously approved SHOT09/10 visual family and occupy the same safe region. No new fake request dots.

24 real voice cues from `remotion-engine/ep003-shot11-real-cue-anchors.json` and `cueFramesFromRealVoice`. All cue phrase texts are literal substrings of the Director-approved narration. Actual measured cue frames and voice choice are recorded at runtime. Nominal duration 3,104 frames, 103.4667s including the two-second lead-in.

Isolated worker `remotion-engine/ep003-shot11-human-finale-v1-render-once.mjs`; Dockerfile `Dockerfile.ep003-shot11-human-finale-v1-once`; tests `remotion-engine/ep003-shot11-human-finale-v1-p0.test.mjs`. **Immutable current worker source** `140398af1c5b153132448e025359a26a26bb0897`; expected engine `EP003_SHOT11_PIN_140398af1c5b`, render key `EP003_SHOT11_FINALE_V1`, composition `EP003-SHOT11-FINALE-V1-DIRECTOR-CANDIDATE`. Railway existing preflight worker service `579c5605-d976-46a7-b8bf-90fd9faf7b92`, deployment `023fe144-fa21-42c1-93d4-5302d894f789`.

Pre-render preflight from live logs: SHOT10 V2 exact MP4/SHA verified, saved original voice/cues verified, still first frame PSNR=100 dB. **COMPLETED**. Production event `EP003_SHOT11_V1_REAL_MP4_SAVED` confirmed at 14:34:42Z on 2026-11-16. Saved render ID `80dcf256-5cf3-4b38-8517-19dcff7a6ac9`, SHA256 `cdbde7240e05705e39e553cf5a63ee336fb40e0bacdd535c298d90ccc635aa67`, 9,912,043 bytes, **3,104 frames / 103.466667s**, 1920x1080@30 H264/AAC. Exact decoded SHOT10 V2 final frame→SHOT11 V1 first encoded frame: **44.642372 dB PSNR**, required >=27 dB. Early motion **23/23** meaningful moving steps (required >=18), first-step 0.72722 (valid interval 0.12–4.5), early ten mean 0.45958. All P0 gates PASS. Original Slow Natural audio and 24 real cues preserved; no paid calls or voice regeneration. Status **READY FOR DIRECTOR REVIEW** but **NOT LOCKED**. Exact MediaOS protected playback: `https://media-os-backend-production.up.railway.app/#/ep003/shot11/v1`.

Protected MediaOS endpoint `/api/v1/remotion/renders/ep003/shot11/v1/latest-successful` and frontend `Ep003Shot11V1DirectorReview.tsx`; direct review route `https://media-os-backend-production.up.railway.app/#/ep003/shot11/v1`. Requires exact source engine, selected take, SHOT10 predecessor, frame count, saved video; no stale fallback. Embedded in EP003 workspace above other review. Director approval/LOCK for SHOT11 is **pending**.

## Distinct backlog

Historical SHOT03–07 still have old cubic replica rails. Do not silently retouch locked videos. Their versioned correction plan is in `docs/visual/EP003_LOCKED_SHOTS_ROUTING_CONSISTENCY_AUDIT_2026_11_16.md`, and requires separate render/review/Director LOCK.
