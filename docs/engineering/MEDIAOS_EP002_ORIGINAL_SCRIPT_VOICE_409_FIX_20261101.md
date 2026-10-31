# EP002 — Initial Voice 409 correction (QA only)

**Date:** 2026-11-01, Europe/Sofia.  
**Episode:** EP002 `95b8a4a2-728e-47fe-ad4c-a16748773588`.  
**Original Script:** Native SCRIPT LOCKED revision 1 with exactly SHOT01–SHOT11.  
**Visual:** Native SCENE LOCKED revision 1, original Director-approved v1.0 blob `5c43c7fd3bd66b5899f0956a9cfd80bdead834f1`.  
**Root-cause evidence:** Railway proxy event on 2026-10-31T23:29:22.710Z showed **GET /api/v1/episodes/{EP002}/shot-revisions/SHOT 01/voice → 409**. The adjacent **GET /shot-revisions/SHOT 01 → 200** proves the Revision Chat itself was reachable.

## Root cause

The original `EpisodeRevisionVoiceService.state()` called `requiredLockedRevision()`, which rejected any SHOT without a **separate** `episode_shot_revision` record. That was valid for revised takes but not for initial source narration. The Director already approved the locked *episode Script* and *Visual Pass*, with no narration corrections, so creating 11 artificial shot revisions would wrongly duplicate approvals and obscure source attribution.

## Fix

- Migration `V105__episode_locked_script_voice_takes.sql` creates isolated `episode_locked_script_voice_take`, keyed by `episode_id` + canonical `shot_key` + native `script_revision`; stores SHA-256 of exact source narration and the ElevenLabs returned audio/alignment. An approved-take uniqueness constraint applies per shot/script version.
- `EpisodeLockedScriptVoiceService` uses the existing authenticated, audited episode-specific Voice endpoints. GET reads exactly the current Director-LOCKED Script and approved Scene, and returns `shotRevision=0` to identify original (not revised) narration. It **never creates** `episode_shot_revision` and never generates audio during GET.
- POST Generate is an explicit Director browser action; it verifies source, safe state, configuration, and existing approval before billing, and checks that the source has not changed before saving generated audio. Native Voice approval is a **separate explicit** Director action that applies to one selected take.
- Existing `EpisodeRevisionVoiceService` retains its original behavior for genuine separately Director-LOCKED SHOT revisions, delegates original Script take requests only for revision 0, and retrieves original audio using its separate scoped store.
- `EpisodeDirectorOverviewController` counts approved original-script Voice takes without bypassing the independent voice-approval gate, without modifying EP001 assets or original Script/Scene artifacts.
- `EpisodeRevisionVoiceController` now accepts the sentinel original `expectedRevision=0`, keeping the existing Spring Security and creation preflight requirements.

## Safety / constraints

- **NO ElevenLabs generation or billing occurred while fixing this bug**; existing voice takes, renders and approvals are not touched.
- QA does **not** currently include the required `ELEVENLABS_*` environment variables; the Voice page can show source narration but **Generate with ElevenLabs remains disabled** until an authorized separate credential connection. Do not copy production secrets into QA without permission.
- Source text is **not rewritten** or AI-generated. A safe v4 performance tag may be applied by the existing ElevenLabs client only when the Director explicitly starts generation.
- The 11 base shots can become visible in Director Overview as `0 of 11 Voice locked` (pending) until real takes are explicitly approved. A native Episode-level SCENE lock does not imply each SHOT's Voice or Video is approved.
- EP001 production and protected voice data are untouched.

## Verification

Isolated QA Maven compilation and JUnit checks at `0bef27b35ef2ab2c2622894e2e0022eeae2d877e`: **9 tests, 0 failures**, covering initial original Script GET without fake revisions, deliberate Generate and Approve delegation, hash integrity, canonical SHOT keys and legacy revision preview contract. This test suite performs **zero** paid TTS operations. Deployment status and QA DB migration must be separately verified after publication.

## Director follow-up

Open the normal EP002 Director page; choose **Voice** on SHOT 01 (not Edit/Revision Chat). Expected: source text loads without 409, Voice Pending, ElevenLabs not connected on QA. Do not ask the Director to edit or unlock the approved Script as a workaround.

**Production remains NO-GO.** This is an episode-aware QA Voice infrastructure fix only.
