# MediaOS — EP002 Align Existing Take: Code Handoff and Release Gate

## Incident update — 2026-11-03: proven pre-network alignment error FIXED and deployed

**Director screenshot:** EP002 SHOT01 `Take 1 · text v1` is already PREFERRED. Instead of `Align Existing Take`, the UI displayed "An earlier paid alignment request needs reconciliation. Do not retry."

**Observed backend evidence:** at 2026-11-03T11:37:21Z Railway received one HTTP **POST to MediaOS** `.../SHOT01/align-existing-take` (status 403). Java logged `NoClassDefFoundError: org/reactivestreams/Publisher` at `ElevenLabsForcedAlignmentService.java:66`, executing `new MultipartBodyBuilder()` before the later `RestClient.post()` method call that sends to ElevenLabs. Because the exception was an `Error` not caught by `catch(Exception)`, a previously committed paid-request ledger row remained `IN_FLIGHT`. This confirms a local pre-network failure for this specific POST; it does **not** imply the Director's whole ElevenLabs account has no other charges.

**Fixes and release:**
- [PR #150](https://github.com/stefanVasilev17/media-os/pull/150): replace reactive `MultipartBodyBuilder` with synchronous blocking multipart `MultiValueMap` + `HttpEntity<ByteArrayResource>`; mock HTTP server regression test; Flyway V111 narrowly targeted reconciliation preserving original request/actor history.
- [PR #151](https://github.com/stefanVasilev17/media-os/pull/151): stream Maven compilation/test logs. [PR #152](https://github.com/stefanVasilev17/media-os/pull/152): correct `.body(body)` in `RestClient`. [PR #153](https://github.com/stefanVasilev17/media-os/pull/153): change reconciliation status to `NOT_SENT` (the original long status exceeded the existing `varchar(16)` schema).
- **Backend deployment `c59804b9-faff-4cbf-b632-90fe09ba7d51` SUCCESS**, commit `9dd305c9004e2d2ed89335a5931eba3e29fda565`. Frontend PASS; Java Maven **282 tests / 0 failures / 0 errors / 37 skipped**, including mock transport test. Flyway **V111 applied**, Spring Boot started; Backend and Render Worker both Online / SUCCESS, 0 warnings/critical at final check.
- V111 marks **at most one** SHOT01 `IN_FLIGHT` request created between 11:37:19 and 11:37:23 UTC on 2026-11-03, with no saved alignment, as `NOT_SENT`, preserving it and adding `LOCAL_MULTIPART_CLASSLOAD_BEFORE_HTTP` failure reason. Other `IN_FLIGHT` or `UNCERTAIN` rows remain blocked. It makes **no** outbound ElevenLabs request or automatic paid retry.

**Remaining acceptance gate:** Flyway V111 success is verified, but affected-row count and authenticated screenshot state were **not read back**. Director should use the existing EP002 SHOT01 preferred Take 1 panel, press **Refresh**, and verify whether the earlier warning is replaced with an explicit local pre-dispatch failure and a fresh `Align Existing Take` option. This new option remains a separately **billable** call with two-step confirmation and must not be triggered by the assistant. The first real matched-cue SHOT01 MP4 is also still unverified; Stage 3 is not complete.

---


## Release update — 2026-11-02: DEPLOYED / DIRECTOR ACTION PENDING

This section **supersedes the earlier build-blocked snapshot below**. Keep the original failure history for audit.

- Java 21 compiler error identified: `ElevenLabsForcedAlignmentService.alignSavedAudio` rethrew a broad checked `Exception` from a catch block while the method declared no checked exception. Reproduced with Java 21 `javac`, fixed using pattern-based narrowing for the two unchecked exception classes.
- Source fix: [PR #148](https://github.com/stefanVasilev17/media-os/pull/148), merged commit `1a8657531521d6b53e84e6754782c7ad646d6e9f`.
- Controlled Railway backend deployment **`33c8f4d1-0f33-43c2-b087-24fd5f768947` SUCCESS** on that exact commit.
- Frontend `tsc --noEmit && vite build` PASS. Maven `BUILD SUCCESS`, **280 tests, 0 failures, 0 errors, 37 skipped** (243 non-skipped).
- Flyway **V110 successfully applied** to PostgreSQL production: migration output explicitly says `Successfully applied 1 migration ... now at version v110`. Spring Boot `Started MediaOsApplication`.
- Backend **Online / SUCCESS** and Remotion Worker **Online / SUCCESS**, zero warning/critical Railway issues at last status check.
- **No ElevenLabs paid call made.** The code, endpoint and UI are deployed but the authenticated Director has not yet used the button or approved a paid alignment request. A real aligned SHOT01 MP4 with the existing preferred take has not yet been verified. **Roadmap Stage 3 still requires selected-voice render and Director QA.**
- Next: Director opens `https://media-os-backend-production.up.railway.app/#/library/EP002`, selects SHOT01 and checks the preferred take panel. If alignment is missing, **Align Existing Take** prompts for explicit paid confirmation. User decides whether to pay. Afterwards verify five speech cue anchors, Remotion frames and an actual MP4 preview. Do not trigger paid requests without a separate explicit Director click.

---


**Date:** 2026-11-02 (Europe/Sofia)
**Status:** **Implemented and merged, but NOT deployed or verified.** The first Railway backend build failed during Java compilation. Production remains on previously successful release; no paid ElevenLabs request was made.

## What is implemented in GitHub

- [PR #145](https://github.com/stefanVasilev17/media-os/pull/145), merged commit `21f925d07c3fcd58632df80e981f4f24273c76ef`.
- Additive Flyway `V110__ep002_existing_voice_paid_alignment_ledger.sql`: preserves per-take source provenance and records each paid request `request_id`, current revision, take ID, actor, timestamp, status `IN_FLIGHT|COMPLETED|UNCERTAIN`. Partial unique index blocks concurrent/uncertain replay per take.
- Existing provider `ElevenLabsForcedAlignmentService` can now send **saved MP3 bytes** with current revision's exact transcript; it does not call TTS and does not generate new voice.
- `Ep002ForcedAlignmentNormalizer` converts the official forced-alignment response `characters:[{text,start,end}]` to the existing `normalized_alignment` arrays and keeps the original provider payload.
- `Ep002SavedTakeAlignmentService` and `Controller`: current-preferred-take GET status and separate explicit-confirmation paid POST. Server verifies Director identity, enabled writes, selected take, narration hash/revision, audio presence, UUID request uniqueness, and no existing alignment **before** paid API. In-flight/uncertain results are never retried automatically. Result is committed to the existing immutable MP3 take, not a new take.
- EP002 Creative Shot Editor: preferred take shows **Align Existing Take**, then a second, explicit **Yes, align this existing take (paid)** confirmation. No paid call on page load or Save. On successful response refreshes production contract and voice timing. Older recordings remain unchanged until Director triggers the paid action.
- Unit tests for provider response normalization and invalid request rejection. No actual provider request has been performed, and the new UI has **not** been browser-verified.

## Deployment blocking issue — factual evidence

- First backend Railway deployment `dad118f8-5fb7-4c61-a8a4-3dbcaa24f881` at `21f925d07c3fcd58632df80e981f4f24273c76ef` **FAILED** during Maven javac build. Frontend TypeScript/Vite build passed. Railway build logs did not contain actionable compiler diagnostics, only the failed Docker RUN.
- [PR #146](https://github.com/stefanVasilev17/media-os/pull/146), merged `8efc33179e7152cf3229553b27be7384f564505f`, modifies build diagnostics only: captures Maven output, emits up to 200 lines on failure and prints the test summary on success. It is not a functional fix.
- A backend-only Railway source update to `8efc33179e7152cf3229553b27be7384f564505f` was staged without destructive changes, but the final release action was **not authorized/completed**. Do not claim it was deployed. Investigate compiler failure and obtain an authorized deployment step before the production release.
- Last verified successful backend remains deployment `06206ba5-6c2c-4801-8e69-ac92bdbbe045` (PR #143, Flyway V109), worker `96d26be8-1d75-4300-9f81-1bd2e0d8c0d4`, both previously online. Verify live statuses again before acting.
- **Flyway V110 not applied**, and the new alignment endpoint and button are **not live**.

## Required next actions

1. Get the exact Java compile error from a controlled CI or diagnostic Maven build. Do not speculate or treat the merged PR as passing.
2. Fix the actual Java build defect in a reviewed PR; run all Maven tests and frontend TypeScript/Vite checks. Verify Flyway V110 applies.
3. Deploy the corrected backend through authorized Railway deployment and check readiness/health, including existing EP001/EP002 regression behavior.
4. Director opens current preferred EP002 SHOT01 take and confirms whether `Align Existing Take` is offered. **Do not click paid confirmation for the user**.
5. Only after the Director explicitly confirms the paid API call in MediaOS: verify provider normalization -> saved timestamps -> five approved 30fps visual cues -> first selected-voice MP4 preview. If result `UNCERTAIN`, reconcile ledger before any retry.
6. Keep Roadmap Stage 3 as **in progress / first selected-voice MP4 Director QA pending**. Stage 4 AI Director Revision Loop remains planned.

This is a status handoff, not a claim of successful release.
