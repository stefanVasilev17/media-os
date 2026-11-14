# EP003 SHOT01 — Real Render Candidate V1 (Director Review Required)

**Date:** 2026-11-14 Europe/Sofia. **Status:** REAL MP4 SAVED and FIRST-FRAME P0 PIXEL QA PASS; NOT DIRECTOR LOCKED.
**Episode:** What Happens When One Database Is No Longer Enough?
**SHOT:** 01 — The System Is Stable. But People Still Cannot Log In.

## Verified real MediaOS output

- Render ID: 078e3f41-5da0-45c2-8b6b-007e004fc491
- Director playback: https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/078e3f41-5da0-45c2-8b6b-007e004fc491/video
- Independent production DB readback: status SUCCEEDED; profile REVIEW; video/mp4; 9,968,240 stored bytes; H264 video and AAC audio; 1920x1080 @ 30fps; 2,514 frames (83.8 s).
- Render MP4 SHA-256: 30ce8db6e75fe28ee29e76e38006aeaafb5b71b82132f2797d77c8e1fc6e9489.
- Renderer source commit: db0f03a9c962e713b81b49ce5cf9e04a0d5c2346. Isolated one-shot Railway service; existing EP002 worker unchanged.
- Director-selected Slow Natural Take ID: 1bde96be-d530-4ccc-ae0f-3bea138879d7, 83.28 s real measured audio. Delivery mode ELEVEN_V4_AUTO_SLOW_NATURAL_PAUSES_V1. Spoken Script Pass v0.4 SHA-256: e968e089fc981e7cf99e426721f1c3524b630131513a3c7f5854a7c9d58e808e. No voice regeneration.
- HEAR→SEE real ElevenLabs character timestamps gave: STABLE frame 323; UNRESOLVED 688; SHEDDING 1231; CONSEQUENCE 1937; CAPACITY 2217. No guessed audio timing.

## Exact P0 source pin and measured first-frame QA

- Original final EP002 SHOT11 render ID: 73ec0e6f-d348-4518-a32b-573bf89a8ab5; 1,572 frames at 30 fps, final frame index 1,571.
- Original actual last-frame PNG SHA-256: 9c1110155e5816c72745aaae1ec1c1ad83c6d4d85ad496d6e8a9c276a9c46365.
- Actual encoded EP003 SHOT01 MP4 first frame PSNR versus original EP002 last frame: 38.976003 dB. Required >=27 dB. This is a measured actual MP4 pixel-continuity PASS.
- P0 caveat: pixel match does NOT prove motion-phase/velocity seamlessness or text clearance in every frame. Director must review the real output and can request correction.
- Six P0 Node tests passed: exact 11 SHOT source, original EP002 living-world component, actual source-shared cubic request paths, content-fit and Phone clearance, selected Take and no guessed cues, pinned prior frame.
- TypeScript preflight confirmed zero new TypeScript errors; one documented locked EP001 legacy diagnostic accepted, matching approved worker build policy.

## Mandatory Director QA before any LOCK

1. EP003 starts naturally from the actual EP002 world; no visible change of production style, hard cut or freeze.
2. All text is inside content-fit panels; no tiny copy or container over another container, Phone, Auth, DB, queue or active path.
3. Real request/rejection particles follow the exact existing curved login paths/ports, with consistent size and speed.
4. Camera and architecture movement are smooth; transitions allow time to understand.
5. Voice is original approved Slow Natural Take, synchronized to real phrase timing.
6. SHOT01 last frame is real source for SHOT02 and must continue with identical world state, including moving packet phase and camera state.

## Next SHOT02 handoff — do not fake it

Current SHOT01 world begins at worldFrame=11978. Its last local frame index=2513, so nominal worldFrame=14491. This is a bookkeeping value only: the mandatory P0 input for SHOT02 is the REAL approved last rendered frame of MediaOS render 078e3f41-5da0-45c2-8b6b-007e004fc491, extracted from the pinned MP4 with camera/node/packet/path/overlay state. Any narrator-free seam requires living motion on both ends. If SHOT01 is edited, SHOT02 must use the newly approved pinned last frame, not this candidate.

**Truthful status:** MP4 file exists and stored DB confirms it. Automated first-frame pixel check passed. Full perceptual QA and Director creative acceptance are still pending. Never claim Director LOCK from a successful CPU render.
