# EP001 SHOT 12 — V4 voice-synced Director review MP4 READY (2026-10-27)

**Status:** Renderer READY; technical MP4/track QA PASS; DIRECTOR REVIEW PENDING; **NOT** Director LOCKED.

## Director-requested changes

Screenshot IMG_4892 and Director feedback:
1. CREDENTIALS VERIFIED pill visibly extended beyond Auth Service and must be contained.
2. Protected API not quite centered below Phone; oversized green dot to be reduced.
3. Animated actions seemed jerky and should become smoother.

Implementation in independent source `remotion-engine/src/episodes/ep001/live-diagram/Shot12CompleteLoginRecapV4.tsx`:
- Contained `CREDENTIALS VERIFIED` pill x=1318, width=234, size 18, inside Auth Service x=1310..1560.
- Protected API moved from x=138 to x=122 (280 wide), center=262 under the Phone's final approximately x=261 screen-center, and adjusted curved return path; green UI-node indicator r=3.5 and green verification check r=12, bottom progress-dot radius reduced 8 to 5.25.
- Swapped smoothstep to quintic smootherstep for zero acceleration at boundaries; replaced snap-to-color threshold on node focus with continuous hex color interpolation; softened/overlapped path reveal intervals with cyan/green light outline; crossfaded title switch and login button text instead of hard jumps.
- No change to original 80-second voice tracks C01–C03, user-approved narration, or locked SHOT01–11 masters. V1, V2, V3 remain untouched and registered.
- Remotion composition: `EP001-Shot12-CompleteLoginRecapV4`, 2400 frames, 30fps, 1920×1080 source / 1280×720 FAST_PREVIEW.
- Source commits: V4 new scene `56f96b9eb0ef020f76298ce94abb49dc2cbbb3a0`; Root composition `e973a53ca6001b6ea39946cfe4440fbb0b661cde`; backend allowlist `7864b9d67e51fea0a95e98f093f3bbf4878ad958`.

## Verified actual render

- Exact render ID: `452d7ad2-2b18-4229-9c83-5983f6d6c62b`.
- Direct preview video:
  https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/452d7ad2-2b18-4229-9c83-5983f6d6c62b/video
- Engine version: `AT_REMOTION_7864b9d67e51_20261027130119`.
- Worker `Completed 452d7ad2-2b18-4229-9c83-5983f6d6c62b: 4892096 bytes`.
- Railway runner live QA: status READY; 1280×720; 30fps; 2400 frames (80s); file 4,892,096 bytes; valid `ftyp` MP4 header, `vide` video handler and `soun` audio handler, `mp4a` AAC track; `passed=true`.
- MP4 QA is technical. Director still needs to personally judge pacing and subjective motion smoothness in actual playback. Do not infer Director approval/LOCK from an apparently smoother source code.

Next authorized step: Director reviews V4 with the same voice-over and explicitly approves/requests corrections. Never overwrite previously locked shots without separate instruction.
