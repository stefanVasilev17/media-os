# EP001 — SHOT 09 V6 — final Director review candidate

**Date:** 2026-10-25. **Status:** MP4 VERIFIED / DIRECTOR REVIEW / **NOT LOCKED**. Director's final requested change: now that User Database has found the record, **show the matched record in the existing main User Database node rather than continuing the scanning animation**. Do not construct another independent architecture diagram.

## Correction and non-regression
The existing canonical Living Architecture Map from SHOT07–08 is unchanged in geometry and connection routing. In `AuthServiceTier2Shot08BridgeV8.tsx`, a new **optional** `showFoundAccountRecord` prop defaults to `false`; all original callers preserve the original scanning/cylinder visual. When explicitly `true` in SHOT09 V6, the original User Database node's scan window (existing x1635–1834, y552–705 local window) instead contains a centered, high-contrast, contained match summary: **RECORD FOUND**, account **0042**, **alex@example.com**, **ACTIVE**. All facts originate from the approved SHOT08 account record. No bogus new node or unrelated floating label. This V6 variation affects SHOT09's opening camera map only; the other approved V5 shots and four original approved voice clips remain unchanged.

- Canonical map extended safely: `remotion-engine/src/episodes/ep001/live-diagram/AuthServiceTier2Shot08BridgeV8.tsx`, commit `b0a0b26ade22f37789699f2bdde5150083301f94`
- Independent review composition: `remotion-engine/src/episodes/ep001/live-diagram/Shot09DirectorVoiceV6.tsx`, commit `4a0428f27b538500837f8518ca9cc632cb2e9a6f`
- Remotion root V6 registration: `remotion-engine/src/Root.tsx`, commit `fffa075f2ffc7562ebea57669acf8fa565326ca7`
- Backend V6 registration: `backend/src/main/java/com/architecturalthinking/mediaos/remotion/RemotionRenderController.java`, commit `95ac476ee27963a7c45a79d6ac81f47b7a095c4d`

## Final review MP4
- Composition `EP001-Shot09-DirectorVoiceV6`, Render ID `533193c8-e94a-42f1-a72e-b837bbbcabe6`
- Direct MP4: https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/533193c8-e94a-42f1-a72e-b837bbbcabe6/video
- Status **READY 100%**, 12,493,291 bytes; 4090 frames; 1280×720 at 30fps, 136.33 seconds.
- Independent production audit: HTTP 206 video byte-range; `video/mp4` content type; valid MP4 `ftyp` signature; bytes range `0-127/12493291`.
- Render job submitted only after verifying exact backend engine version `AT_REMOTION_95ac476ee279_20261025155009`; Worker build contained V6. Four original SHOT09 C01–C04 voice clips are approved/generated and generation revision 1, with original start frames [18,1104,2051,3031] and clip length frames [1074,935,968,966].
- Protected invariants checked: SHOT01–07 native LOCK with QA PASS, approved SHOT08 MP4 original unchanged, existing SHOT01–08 cumulative preview render unchanged.

**Important:** These checks establish valid render and media integrity, not Director visual sign-off. Never claim Director LOCK or append SHOT09 to the combined episode until the Director explicitly approves this V6 playback. Capture the next approval as a separate durable Director LOCK event.
