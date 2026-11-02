# MediaOS — EP002 ElevenLabs Voice Timestamp Sync

**Date:** 2026-11-02 (Europe/Sofia)
**Product rule:** Actual ElevenLabs audio character timestamps take precedence over proportional/editorial cue guesses for SHOT01 Remotion animation timing.

## What was proven and fixed

- Existing production `ElevenLabsTextToSpeechService.generate` already calls `/v1/text-to-speech/{voice_id}/with-timestamps`. ElevenLabs returns audio and `alignment` / `normalized_alignment` arrays with character start/end times (seconds).
- EP002 Creative Voice was **discarding** the response's `alignmentResponse()` when it stored the MP3, unlike some older voice flows. Existing EP002 takes created before this change have **no saved alignment**. Do not claim old timestamps were preserved or retrievable from the MP3 without an extra alignment process.
- [PR #143](https://github.com/stefanVasilev17/media-os/pull/143) merged as `57bcf01c897ec724c5a04b3efc27993be90696c7`. The exact TTS alignment now persists atomically with each **new** saved EP002 voice take under nullable `ep002_creative_voice_take.elevenlabs_alignment` (Flyway **V109**).
- `Ep002VoiceCueTiming` resolves five exact SHOT01 spoken phrases in order, validates timing and selected audio duration, converts seconds to 30fps cue frames (start=floor(seconds*30), end=ceil(seconds*30)), and returns **no invented timings** if a phrase/time is missing or invalid.
- Stage 1 Unified Production Data shows alignment authority, phrase timestamps, seconds and frames for the selected take. Stage 2 Remotion Scene Contract carries them as typed per-beat `startFrame/endFrame` and includes them in its contract ID. The Director-controlled render adapter sends the five `beatStartFrames` as render input props.
- Remotion `EP002-SHOT01-DRAFT` drives Login press, spinner, TimeRail, Auth health pulse/focus, Phone focus return and rewind from actual cue start frames **when available**; otherwise still uses explicitly labeled provisional editorial positions.
- Preview status and lineage reject older provisional render outputs as current when alignment is added.
- UI clearly labels whether the selected take has real ElevenLabs timestamps; the Director does not need to manually enter seconds or keyframes.

## Verified release evidence

- Production backend Railway deployment `06206ba5-6c2c-4801-8e69-ac92bdbbe045` **SUCCESS**. Flyway from V108 to **V109** successfully applied; Spring Boot started normally.
- Production Remotion Worker deployment `96d26be8-1d75-4300-9f81-1bd2e0d8c0d4` **SUCCESS**, independent Remotion TypeScript preflight **zero new errors**, Remotion bundle PASS. One previously documented EP001 locked TypeScript baseline remains unchanged.
- Both backend and worker **Online / SUCCESS**, **0 warning / 0 critical** Railway issues. Backend frontend build and Maven package build passed.
- **No** ElevenLabs TTS, forced-alignment, transcription or other paid external API request was executed during this work. No EP001/EP002 original creative-source change.

## Critical limitations / follow-up

1. **Older EP002 takes lack timestamp payload** because earlier production discarded it. The API cannot simply return missing historical metadata. Avoid regenerating the user's preferred voice just to obtain timestamps. The existing `ElevenLabsForcedAlignmentService` can, after a separate **explicit paid confirmation**, align the existing stored MP3 to the exact saved narration and write those timestamps into the same take. The ElevenLabs Forced Alignment API charges at the Speech-to-Text rate, so do not automatically call it.
2. No new paid take was created for verification; **a real voice-synced MP4 has not yet been Director-previewed**. Stage 3 creative and end-to-end playback acceptance remains pending.
3. Character alignment is provider-estimated timing, **not perfect phoneme timing**. Source anchors need to remain audibly correct, and the Director must review resulting animation pacing.
4. This implementation is deliberately scoped to the **five SHOT01** approved phrases. Future SHOT02–11 will need their own phrase anchor list or an episode-agnostic mapping strategy; do not claim fully generic synchronization.
5. Scene duration continues to come from `ffprobe`-measured selected MP3; cue timestamps are used for **local animation timing**, not as a fake substitute for the duration measurement.
6. Do not mark Stage 3 DONE until a real selected-take rendering passes video+audio QA and explicit Director review.

## Next suggested Director action

Open MediaOS `#/library/EP002` → SHOT01 → Unified Production Data / Remotion Scene Blueprint. If the current preferred take shows *no stored voice timestamps*, keep the existing recording and decide whether to add a one-time paid Forced Alignment action (with ledger, confirmation and safe retry controls). Only after this should a voice-synced preview be claimed as verified. Avoid unnecessary fresh TTS generation.
