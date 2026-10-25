# Architectural Thinking — EP001 SHOT 09 — V2 premium living architecture execution (2026-10-25)

**Director request:** V1 looked acceptable but was too static. Explicit changes: (1) make every scene significantly more modern and animated; (2) open on the **entire master living architecture diagram** and camera-enter the current focus; (3) place substantially more useful information inside the panels. Director explicitly authorized direct implementation and rendering with existing GitHub and Railway access.

**Status:** V2 code implemented and committed, deployment/render submission in progress; **NOT DIRECTOR LOCKED**. V1 preserved as historic draft.

## Production implementation
- New isolated Remotion source: `remotion-engine/src/episodes/ep001/live-diagram/Shot09DirectorVoiceV2.tsx`. Separate `EP001-Shot09-DirectorVoiceV2` composition registered in `remotion-engine/src/Root.tsx` and `backend/src/main/java/com/architecturalthinking/mediaos/remotion/RemotionRenderController.java`.
- Build commits: `bbc614ff716338c20c45df051170ea10f7b99a8d` (V2 scene), `aa8a06ae39308893b6bca4084e10b375d3502016` (Root registration), `4680efabe05c24bc39c5988d450cbef3272d781e` (Backend render registration).
- All original SHOT09-C01–C04 approved ElevenLabs voice tracks retained **bit-for-bit by referencing original production voice clip assets**, generation revision 1; starts [18,1104,2051,3031], durations [1074,935,968,966] at 30fps; total 4090 frames / 136.333s. No narration changes, no TTS regeneration.
- SHOT01–07 native Director locks and QA are protected, approved SHOT08 exact MP4 render `9c9e98ca-4ebd-4da9-b7e2-e328a44a9109` protected, existing eight-shot combined MP4 `8bb127a5-3a9e-4bc1-aa5e-4a224c80193b` stays unchanged.

## V2 visual choreography

- 0–10.5s: **Full architectural map**, nodes PHONE → API GATEWAY → LOAD BALANCER → AUTH SERVICE ↔ USER DATABASE plus AUTH STATE below; previous lookup return highlighted, inactive nodes dimmed, active cyan/mint packet animation, camera zoom/pan toward AUTH SERVICE. Detail surface inherits this transition rather than entering as isolated full-screen slides.
- 7.5–38.7s: three-column verification surface; masked submitted Login Request `alex@example.com`; protected account metadata ID 0042, ACTIVE, PROTECTED HASH, SALT; animated secured verification center with processing bars, trail packets, educational steps. Never depict decrypted stored password or readable plaintext match.
- 34.6–70.3s: richer verification decision board with visible checks, progressive mint confirmations, authenticated identity, conditional additional factor disclosure (only if required).
- 66.3–104.4s: modern Authentication vs Authorization split with permission-policy examples MEMBER vs ADMIN and stronger Aha takeaway. Keep distinction factually sound and avoid implying correct password equals administrative access.
- 100.8–136.3s: animated data handoff to AUTHENTICATION STATE, dynamic transit packet, retained waiting phone state, explicit clear distinction that state/session/token **is not yet created** at end of SHOT09.

Design: dark navy, cyan/mint/violet family, living map depth, ambient glow, visual progress, moving processing/travel signals, restrained typography aligned and centered, no overlap, no unexplained KDF/Argon2id jargon. All V2 elements native Remotion/React and deterministic from current frame.

## Acceptance checks
1. Railway Backend provider status includes `EP001-Shot09-DirectorVoiceV2` and engine version begins with `AT_REMOTION_4680efabe05c`.
2. Railway Worker current service deployment contains composition V2 source (root registered at commit aa8a06ae or newer). Worker must not render V2 using old build.
3. Issue a new `FAST_PREVIEW` 1280×720/30fps/4090f render with exactly four original approved clip URLs.
4. Confirm MediaOS render status `READY`, nonempty playable MP4 (video/mp4 and valid ftyp header), no worker render error. Visually inspect map entry, text positioning and stage handoffs. Keep `DIRECTOR REVIEW`, not LOCKED.
5. Never auto-append V2 to combined video without explicit Director creative approval.
