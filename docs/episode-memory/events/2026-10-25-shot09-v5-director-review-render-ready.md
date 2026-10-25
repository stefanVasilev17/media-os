# EP001 — SHOT 09 V5 — Director Review MP4 READY

Date: 2026-10-25. Status: **DIRECTOR REVIEW / NOT LOCKED**. Do not append SHOT 09 to the approved SHOT 01–08 episode composite until the Director explicitly approves V5.

## Director-requested exact corrections
1. The `AUTHENTICATED IDENTITY` capsule almost overflowed its border. V5 preserves the exact wording and changes layout from `x=783, width=306` to `x=765, width=365`, leaving comfortable internal gutters and staying inside the handoff space.
2. The on-screen text `EXAMPLE POLICIES — DEPEND ON THE SYSTEM` was nonessential visual noise. V5 removes that label entirely from the Authentication vs Authorization scene.
3. The `STORED ACCOUNT FACTS` capsule almost overflowed. V5 preserves the exact wording and expands its width from `296` to `390` within the preexisting User Database card.

The general Director principle is **focus and typography containment over microcopy**, with minimal targeted edits. Preserve the approved Living Architecture Map component and its camera move; do not redraw architecture. Preserve existing original four approved SHOT 09 voice clips (C01–C04), segment starts and durations, and approved SHOT01–08 render sources. Do not regenerate any audio.

## Production implementation
- Independent Remotion composition: `EP001-Shot09-DirectorVoiceV5`
- Source: `remotion-engine/src/episodes/ep001/live-diagram/Shot09DirectorVoiceV5.tsx`
- Registered in `remotion-engine/src/Root.tsx` and MediaOS `RemotionRenderController.java`
- Deployed source commit `55291068931f43affe71b7465355ec3159e3760e` (Backend); Worker successfully deployed `7d84f7a430b04ff70cbcbf40faaea4822c655c96` (contains V5 composition)
- Exactly four original approved SHOT09 audio clips checked before accepting render, generation revision 1, frame starts 18/1104/2051/3031 and voice segment lengths 1074/935/968/966 frames
- Existing SHOT01–07 native LOCK and QA PASS checked, SHOT08 approved render and 8-shot composite checked unchanged

## Ready preview
- **Render ID:** `d5f96536-d67f-4c4f-a182-f330e939eeb5`
- **Video:** https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/d5f96536-d67f-4c4f-a182-f330e939eeb5/video
- **Status:** READY 100%, 12,499,127 bytes; 4090 frames at 30fps = 136.333s; 1280×720 FAST_PREVIEW
- **Media integrity QA:** HTTP 206 byte-range, Content-Type video/mp4, `ftyp` MP4 header, Content-Range `bytes 0-127/12499127`, confirmed by independent production audit
- This is *technical file QA*, not a claim of comprehensive human visual/frame review, nor a Director creative LOCK. Await Director playback/approval.
