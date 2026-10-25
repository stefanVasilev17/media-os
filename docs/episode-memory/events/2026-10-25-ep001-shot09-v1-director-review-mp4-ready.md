# EP001 — SHOT 09 — Director Review V1 MP4 READY (2026-10-25)

**Status:** `SHOT09_DIRECTOR_REVIEW_V1` — **NOT DIRECTOR LOCKED**, **NOT appended** to 8-shot cumulative episode video. This is a review candidate only.

## Exact render

- Composition: `EP001-Shot09-DirectorVoiceV1`.
- MediaOS render ID: `9427cbd7-7071-4a4c-84a9-f8e94f1aab5e`.
- Video: https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/9427cbd7-7071-4a4c-84a9-f8e94f1aab5e/video
- MediaOS independently audited metadata: `READY`, 1280×720 `FAST_PREVIEW`, 30fps, 4090 frames (136.333 seconds), 8,735,969 bytes.
- Media byte-range audit: HTTP `206`, Content-Type `video/mp4`, valid `ftyp` file signature, response Content-Range `bytes 0-127/8735969`.
- Exactly 4 original previously approved/generated clips SHOT09-C01–C04 checked, generation revision 1; no voice regeneration or narration changes.
- Existing SHOT01–07 native locks and QA PASS confirmed unchanged. The eight-shot cumulative render `8bb127a5-3a9e-4bc1-aa5e-4a224c80193b` remained `READY` and unchanged.

## Current scene and approved editorial scope

Unlike the obsolete historical SHOT09 failure-path scene deferred to EP002, this is the **successful-login Auth Service / Credential Verification**:

1. Two separate readable inputs: masked submitted password and protected stored verifier, entering the password-verification routine; no plaintext comparison/decryption narrative.
2. Successful verification; active account; all required authentication checks; additional factor only when required by a system.
3. Authentication versus authorization split; user versus admin permissions.
4. Authenticated decision passed forward to Authentication State; phone is still waiting for persistent login state.

Source: `remotion-engine/src/episodes/ep001/live-diagram/Shot09DirectorVoiceV1.tsx`.
Registered composition: `remotion-engine/src/Root.tsx`; backend `RemotionRenderController.java`.
Plan: `docs/episode-memory/plans/2026-10-25-ep001-shot09-credential-verification-director-visual-draft-v1.md`.

## What QA confirms and does not

MediaOS verified the artifact's existence, status, frame dimensions/timing and MP4 header, along with original source voice approval records and prior lock invariants. This **does not** mean a human/Director has reviewed all visual frames or approved the creative direction. The Director must watch the MP4 and request corrections or explicitly approve LOCK. Do not automatically append SHOT09 to the cumulative video until explicit creative LOCK.
