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

## SHOT11 V1 — Director LOCKED and appended to official 11-SHOT master

Editorial: "What One Login Teaches Us About Architecture" (original Director-approved script v0.4), a quiet human-first retrospective. Continue the actual SHOT10 ending, do not construct a new architecture view.

Saved existing Slow Natural selected voice Take `5c3435f6-ae66-4ec3-a6b0-bf1cc8207486`; duration 100.96s; existing audio 1,616,291 bytes; actual normalized character-level alignment 1860 chars; source text SHA matches, paid calls made 0. Verified by `cumulative-engine/ep003-shot11-voice-preflight-once.mjs`.

New scene: `remotion-engine/src/episodes/ep003/Shot11HumanFirstFinaleV1.tsx`. Reuses `Ep003Shot09FinalWorldForShot10V2` with inherited worldFrame 47457, precise continuationFrameOffset=7159. First frame is the **actual decoded final SHOT10 image**, 8-frame source blend and shared premium routes. It retains previous title "PROVE THE ARCHITECTURE WORKS" at first, gracefully fades to "WHAT ONE LOGIN TEACHES US". Six mutually exclusive, content-measured recap cards use exactly the previously approved SHOT09/10 visual family and occupy the same safe region. No new fake request dots.

24 real voice cues from `remotion-engine/ep003-shot11-real-cue-anchors.json` and `cueFramesFromRealVoice`. All cue phrase texts are literal substrings of the Director-approved narration. Actual measured cue frames and voice choice are recorded at runtime. Nominal duration 3,104 frames, 103.4667s including the two-second lead-in.

Isolated worker `remotion-engine/ep003-shot11-human-finale-v1-render-once.mjs`; Dockerfile `Dockerfile.ep003-shot11-human-finale-v1-once`; tests `remotion-engine/ep003-shot11-human-finale-v1-p0.test.mjs`. **Immutable current worker source** `140398af1c5b153132448e025359a26a26bb0897`; expected engine `EP003_SHOT11_PIN_140398af1c5b`, render key `EP003_SHOT11_FINALE_V1`, composition `EP003-SHOT11-FINALE-V1-DIRECTOR-CANDIDATE`. Railway existing preflight worker service `579c5605-d976-46a7-b8bf-90fd9faf7b92`, deployment `023fe144-fa21-42c1-93d4-5302d894f789`.

Pre-render preflight from live logs: SHOT10 V2 exact MP4/SHA verified, saved original voice/cues verified, still first frame PSNR=100 dB. **COMPLETED**. Production event `EP003_SHOT11_V1_REAL_MP4_SAVED` confirmed at 14:34:42Z on 2026-11-16. Saved render ID `80dcf256-5cf3-4b38-8517-19dcff7a6ac9`, SHA256 `cdbde7240e05705e39e553cf5a63ee336fb40e0bacdd535c298d90ccc635aa67`, 9,912,043 bytes, **3,104 frames / 103.466667s**, 1920x1080@30 H264/AAC. Exact decoded SHOT10 V2 final frame→SHOT11 V1 first encoded frame: **44.642372 dB PSNR**, required >=27 dB. Early motion **23/23** meaningful moving steps (required >=18), first-step 0.72722 (valid interval 0.12–4.5), early ten mean 0.45958. All P0 gates PASS. Original Slow Natural audio and 24 real cues preserved; no paid calls or voice regeneration. Status **DIRECTOR LOCKED** after explicit positive visual review on 2026-11-16. Exact MediaOS protected playback: `https://media-os-backend-production.up.railway.app/#/ep003/shot11/v1`.

Protected MediaOS endpoint `/api/v1/remotion/renders/ep003/shot11/v1/latest-successful` and frontend `Ep003Shot11V1DirectorReview.tsx`; direct review route `https://media-os-backend-production.up.railway.app/#/ep003/shot11/v1`. Requires exact source engine, selected take, SHOT10 predecessor, frame count, saved video; no stale fallback. Embedded in EP003 workspace above other review. Director approval/LOCK for SHOT11 is **GRANTED**. Approved SHOT11 MP4 and all previously locked SHOT01–10 sources are immutable.

## Distinct backlog

Historical SHOT03–07 still have old cubic replica rails. Do not silently retouch locked videos. Their versioned correction plan is in `docs/visual/EP003_LOCKED_SHOTS_ROUTING_CONSISTENCY_AUDIT_2026_11_16.md`, and requires separate render/review/Director LOCK.


## Final official 11-SHOT film — COMPLETED and stored in production

Director explicitly watched SHOT11 V1 and said: **"Това търсим! ЛОКВАМЕ!"** followed by the instruction to append it to the full film. The Executor created a separate immutable append-only manifest, assembled with FFmpeg stream copy, verified the actual decoded seams for every boundary and saved the full video to the real production DB.

- Manifest: `remotion-engine/ep003-director-locked-visual-sequence-11.json`; first 10 entries byte-for-byte equal to previously Director LOCKED `...-10.json`. Original historical 9-shot and 10-shot MP4s are preserved; no source videos changed.
- Worker: `cumulative-engine/ep003-assemble-master-11-locked.mjs`, tests `...test.mjs`, Dockerfile `Dockerfile.ep003-cumulative-master-11-locked-once`; source pinned at `c1f38f9029e2c18a99aa5fa67ddacead5f5e66dc`; Railway worker deployment `d4683c84-0f86-4084-b402-e8f8c0b21fcc`.
- **Official stored 11-SHOT master render ID:** `63827ce6-2ea8-4853-a61b-8549fe8db967`; SHA-256 `1560d46f8067c735a2578d769bfcda465f651e46babdf4bd7dfa1090f6ce8ff6`; `render_key=EP003_CUMULATIVE_LOCKED_SHOTS_01_TO_11`; composition `EP003-CUMULATIVE-DIRECTOR-MASTER`; verified true, Director locked true.
- **Exact duration:** 38,593 frames at 30 fps, 1,286.433333 seconds = **21:26.4333**; 1920 × 1080 H264/AAC, 152,025,545 bytes. All original selected Slow Natural voice is preserved. No fresh voice generation, no video re-encode during concatenation.
- **All 10/10 actual decoded video seams PASS** (minimum PSNR=27dB), measured in order: 44.319888, 44.244846, 44.155357, 43.760053, 42.833128, 43.199819, 43.647755, 44.365580, 44.643326, **44.642372** dB. All individual rendered source frames vs master positions matched at **100dB**.
- New SHOT10→SHOT11 boundary exactly at left frame **35488** and right frame **35489**, actual SHOT10 V2 decoded final pixel SHA256 `90bdedae663d796e11264af15f0f9b05949390bca83587a7f7de0db50d52fdad`.
- **Official playback (one full-film MediaOS player):** `https://media-os-backend-production.up.railway.app/#/ep003/full`. The backend `GET /api/v1/remotion/renders/ep003/cumulative/latest-successful` selects the latest `EP003_CUMULATIVE_LOCKED_SHOTS_01_TO_11` by highest shot count and verified true. The old 10-SHOT WIP still has an archival direct route, but it is removed from the main workspace to avoid two competing full-video players.
- `EP003` has completed its **video-render / visual-editing stage as Director-LOCKED 11-SHOT master**. Publishing, title/thumbnail, caption/QC and promotion are separate tasks if requested; do not imply those are automatically complete.

Persistent rule: New video/shots must preserve every approved locked source and exact previous last-frame → new first-frame identity; no container over container, no clipped texts, and every request particle uses the exact visible route.


## Director asset-retention policy — 2026-11-16 (ACTIVE)

New explicit Director request: "Не искам всичките отделни шотове да ги виждам в MediaOS. След като са локнати или съм поискал нова версия, нека старите да се ИЗТРИВАТ. Не искам да заемат място."

**UI rule:** a completed episode must show **ONE** main player for the latest verified fully Director-LOCKED continuous master. Individual SHOT review players, old versions and former full-film WIPs must never render in the completed episode workspace. Old EP003 SHOT and corrected-ten deep links now redirect to `#/ep003/full` in `frontend/src/App.tsx`. The prior JSX is permanently disabled rather than mounted or fetched, in `frontend/src/pages/EpisodePackageImportPage.tsx`.

**MP4 retention rule:** after an approved new version is stored and its exact source identity and seam QA have passed, release the superseded MP4 payloads from storage, not merely hide their cards. Once the latest complete episode master is verified and Director LOCKED, only that canonical full master needs to remain playable in the database. Preserve the source GitHub code, approved scripts, selected original Slow Natural voice and alignment records, Director lock/provenance hashes, media metadata and QA evidence; **never delete** the final master or media from other episodes. Historical standalone source video may need new rendering if future reassembly is requested; a GitHub manifest alone is not a backup MP4.

**Production cleanup 2026-11-16:** one-time fail-closed worker `cumulative-engine/ep003-final-master-only-prune-once.mjs` with explicit `EP003_FINISHED_MASTER_PRUNE_CONFIRMED=true`, independent pinned Railway source, exact final-master ID/SHA, all 11 source IDs and 10 decoded QA checks; it blocks real in-flight renders and protected assets. Initial audit identified **43 superseded EP003 MP4 payloads, 1,573.27 MiB** total, of which 26 were individual SHOTs (342.52 MiB) and 17 were old whole-film WIPs/masters (1,230.75 MiB). Two unchanged 0%-progress SHOT09 V1 rows created 2026-11-15 were classified as abandoned; live work remains a blocker.

**Confirmed deletion:** three guarded batches released video_data on **33 superseded EP003 rows**: 18 rows / 207.68 MiB, then 11 rows / 201.35 MiB, then 4 rows / 166.43 MiB; total **575.46 MiB logically released**. Metadata and original audio remain; the current verified 11-SHOT full master row `63827ce6-2ea8-4853-a61b-8549fe8db967` still contains its original 152,025,545-byte video, SHA metadata and verified status. **10 obsolete payloads remain, 997.80 MiB**. They were **not** erased, because the live PostgreSQL volume was about **4.53GB of a 5GB volume** and PostgreSQL MVCC/WAL temporarily grew during deletion. The operator disabled further automatic cleanup (`EP003_FINISHED_MASTER_PRUNE_CONFIRMED=false`) to prevent a database-out-of-space incident. Do not claim all 43 were deleted. Logical payload removal does NOT immediately lower PostgreSQL allocated relation bytes or physical disk usage; disk-aware VACUUM/reorganization requires its own safe headroom and deployment plan. Never run VACUUM FULL against this near-full production database or blindly increase user billing.

**Future Executor action:** enforce same master-only UI as soon as each episode is fully locked, and plan storage deletion **only** after verifying replacement approved video and adequate actual Railway free disk. In-progress newest SHOT candidates must remain playable until the next approved replacement/full master is saved. The user is Director: no paid rerendering or destructive deletion of the canonical master without explicit approval.

**MediaOS production verification:** deployed source `68812ecad5524d533f09a9cde9cdfb85a1595b0f`, Railway deployment `7786c7ee-23e9-4d29-a4bf-bf886354bfb3` SUCCESS, frontend 78/78 and backend 532 test cases without failures (1 skipped). Latest full video `https://media-os-backend-production.up.railway.app/#/ep003/full` remains the single visible complete player.
