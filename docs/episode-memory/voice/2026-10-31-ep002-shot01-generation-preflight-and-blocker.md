# EP002 SHOT01 v1.4 — ElevenLabs Generation Preflight

**Date:** 2026-10-31  
**Status:** GENERATION REQUESTED BY DIRECTOR; **NOT EXECUTED / NO AUDIO GENERATED**  
**Scope:** Exactly SHOT01 only; 92 words; approved original voice, English calm documentary mood. Script source: `EP002_FullScript_v4_0_ElevenLabs_VoiceInput_LOCKED.json` and exact ready-to-copy text `EP002_SHOT01_v1_4_ELEVENLABS_EXACT_INPUT.txt`.  
**Full script:** EP002 v4.0 explicit Director LOCK on 2026-10-31.

## Verified existing integration

- Production Railway `media-os-backend` has environment variable **names** `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL_ID`, `ELEVENLABS_OUTPUT_FORMAT`, `ELEVENLABS_SPEED`, `ELEVENLABS_STABILITY`, `ELEVENLABS_SIMILARITY_BOOST`, `ELEVENLABS_STYLE`, `ELEVENLABS_USE_SPEAKER_BOOST`. Values are redacted through the connected Railway tool. **Do not guess actual values or copy/share secrets.**
- `ElevenLabsTextToSpeechService.java` implements official `POST /v1/text-to-speech/{voice_id}/with-timestamps`; returns generated MP3 and alignment, using approved configured voice/model/settings.
- **Hard safety blocker:** `VoiceProductionController.java` uses fixed `ProductionOverviewService.EPISODE_ID` (legacy EP001) and `ElevenLabsTextToSpeechService.java` constructs filenames beginning `EP001_`. Never call EP001 `/api/v1/voice/shots/{shotKey}/generate-voice` to produce EP002; this would cross an episode boundary and potentially modify/overwrite protected EP001 voice state.
- The 2026-10-31 direct read-only PostgreSQL audit found only EP001 in the production `episode` table. There is no registered EP002 workspace to receive generated clips.
- No direct ElevenLabs plugin/app tool is connected; the current tools cannot perform a secure, existing-scope production voice write. Do **not** bypass the Director authenticated backend or create silent production changes.
- Official manual ElevenLabs generation route, if desired: https://elevenlabs.io/docs/eleven-creative/playground/text-to-speech . Use the already owned cloned creator voice and existing EP001 actual voice settings visible to the creator in their account; paste only the locked SHOT01 narration, generate a *new EP002-owned file*, and export audio and timing metadata (if provided).

## Safe EP002-native automation requirement

1. Register EP002 using the established Director-audited episode creation API, subject to separately explicit permission and applicable Research/Script stage assertions. Avoid writing EP001 tables/IDs.
2. Extend voice generation to require `episodeId` and scoped `shotRevision`, load locked EP002 narration *from the EP002 source of truth*, and enforce exact provenance checks rather than accepting client-submitted text silently.
3. Generate audio via existing secure Railway-held ElevenLabs identity only after verifying voice and model settings are correct, and save it in EP002-only storage with separate artifact IDs (never `EP001_` output). Require Director approval to move from generated → approved; do not silently overwrite.
4. Preserve provider alignment, audio duration, output format, request ID, model and exact-script fingerprint. Prefer high quality `mp3_44100_128` or the already approved configuration, not newly guessed overrides.
5. First test **only SHOT01**, review pacing/voice fidelity, then authorize remaining shots. No full batch before listening to first test.
6. No unsolicited production deployments, ElevenLabs credit use, voice profile switching or EP001 changes.

## Current Director-visible completion

- FULL SCRIPT v4.0 Director-LOCKED in GitHub: yes.
- SHOT01 exact source text ready for provider: yes.
- ElevenLabs API TTS and backend configuration present: yes, values redacted.
- Provider generation request submitted: **no**.
- EP002 SHOT01 MP3 and alignment file exist: **no**.
- Production MediaOS or Railway modified in this voice preflight: **no**.

**Purpose:** prevent subsequent assistants/agents from claiming a SHOT01 generation or calling the EP001-only voice endpoint.
