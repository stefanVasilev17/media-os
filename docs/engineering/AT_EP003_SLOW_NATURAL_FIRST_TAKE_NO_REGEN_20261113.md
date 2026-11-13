# Architectural Thinking / MediaOS — DIRECTOR RULE: Slow Intake / Slow Natural from FIRST voice Take

**Director instruction:** 2026-11-13, Europe/Sofia: “Още нещо - искам от първия път да имам slow intake voice shots! Не искам след това да regene-рирам voice shots.”
**Status:** DIRECTOR-LOCKED VOICE PRODUCTION POLICY; **documentation and preflight specification, NOT proof of implemented EP003 runtime UI enforcement, paid TTS execution or approved Voice Direction**.
**Scope:** EP003 SHOT01–11 and all subsequent episodes; applies before the *first* paid ElevenLabs request for each SHOT. Older approved/LOCKED Takes are immutable.
**Precedence:** Non-negotiable voice-spend/quality policy alongside the existing P0 invisible cross-SHOT rule; never overrides approved script text, the Director's explicit payment authorization, provider safety or system security.

## Required user experience

> **The FIRST paid voice generation for EVERY SHOT must already use the carefully prepared Slow Natural / Slow Intake mode. Never create a faster STANDARD Take as an exploratory first draft with a plan to regenerate it slower.**

Director experience should be: **Review exact LOCKED script → review voice direction and pacing/semantic pauses → deterministic zero-spend preflight → ONE explicit Director-paid “Generate (slow intake)” action → preserve generated Take → Listen → Director approves or flags issue**.

- Do not auto-generate a Take on script LOCK, library navigation, Voice Direction creation, migration, import, deployment, preflight or render queue.
- Do not produce STANDARD before SLOW_NATURAL; do not silently fall back to STANDARD if the requested provider/mode is unavailable.
- Do not auto-generate multiple options, make hidden retries, use a generic regeneration button for pacing corrections, or auto-replace the first Take.
- If a paid provider request is IN_FLIGHT, UNCERTAIN, timeout or network error, inspect existing paid-operation ledger/provider result and exact saved media before offering any new paid request. Do not mistake a slow response for a failed TTS call. Idempotent request token/source hash protects against double-click and duplicate charges.
- Existing Takes must remain versioned, audible, selectable and unchanged. If Voice QA fails, mark **REVIEW_REQUIRED** and preserve the original Take; no automatic re-generation. Only a NEW explicit human Director action could permit a replacement after examining the issue and cost, which is outside the preferred one-take workflow.
- **No TTS regeneration** to fix missing HEAR→SEE timestamps, subtitle/cue spelling, script/render metadata or a visual continuity mismatch. Use the already stored audio and only real original alignment data, or separately Director-authorized alignment of that SAME saved audio when genuinely needed. No fabricated timestamps, no manual typing of HEAR→SEE beats, no extra voice creation.

## Mandatory preflight before any paid first Take

For *each* SHOT01–SHOT11, the system must verify and display all of these fields. A failed/missing gate blocks the TTS button rather than defaulting to a fast Take:

1. **Exact immutable source:** Script Pass v0.4 original [11 SHOTs](../episode-memory/plans/2026-11-13-ep003-script-v0-4-director-locked.md), exact SHOT text and revision/SHA. No paraphrase, silent extra words, voice tag contamination, removed punctuation, SSML read aloud, or trimmed text. Later episodes use their own separately Director-LOCKED source.
2. **Approved Voice Direction:** a reviewed/LOCKED per-SHOT natural and calm narrator profile, story context, pronunciation dictionary and specific semantic pacing anchors; never use provisional v1.0 as if already accepted. The current EP003 [Voice Direction v1.0 PR #270](https://github.com/stefanVasilev17/media-os/pull/270) remains DRAFT until explicitly accepted by Director.
3. **Mode and provider:** confirmed configured ElevenLabs creator voice clone, supported model/provider with verified `SLOW_NATURAL` / “Generate (slow intake)” capability on this exact EP003 intake path. If unsupported or unavailable, **BLOCK — DO NOT USE STANDARD**. EP002 historical Slow Natural v4 pacing/pause technique is a precedent, not evidence that EP003 generation UI has shipped.
4. **Semantic pauses precomputed:** unique exact in-order narration anchor phrases, without writing pause directives into the spoken script. Prefer longer meaningful spaces after logical, self-contained assertions (numbers / trade-offs / revealing a diagram); natural shorter gaps elsewhere. Do not insert a rigid pause after every sentence. Produce a visible reviewable beat/pause map and technical-term pronunciations before the paid call.
5. **Timing realism:** full v0.4 has **2,917 words**. At a calm ~130–145 WPM this is already **~20–22.5 minutes of speech**, plus internal pauses and 10 proposed ~2-second narrator-free moving-world seams. The original 16:35 timeline is editorial only. Do not speed up to force the old duration. Director must explicitly choose current full narrative or separately approve a new script version; one-take mode does not override that choice.
6. **Pay/identity safety:** Director authenticated and authorized; explicit single confirmation of fee/estimated spend BEFORE generation; correct source hash and clone ID; account/provider capability, sufficient budget, ledger/idempotency, unresolved prior operation check. One SHOT = one intended paid generation, not one bulk paid batch without clear Director permission.
7. **Visual independence:** no need to pay for video or sound to validate draft animation flow. P0 visuals, shot-to-shot breathing and HEAR→SEE are planned independently. Audio provider pause durations are not fake frame timestamps.

## Technical / product acceptance contract (not currently declared implemented)

- EP003 Episode Package Voice Studio should default/propose **Slow Natural first** for every SHOT; disable **STANDARD paid generation** for the locked EP003 v0.4 material unless Director creates an explicit new policy version. The displayed button should be exactly and unambiguously **“Generate (slow intake)” / “Generate Slow Natural”**, with the selected mode and approval cost disclosed.
- Backend must enforce this mode, not only React UI. The existing imported episode package voice generation route has historically supported `deliveryMode=SLOW_NATURAL` according to GitHub [PR #204](https://github.com/stefanVasilev17/media-os/pull/204), while [EP002 recovery v5 PR #241](https://github.com/stefanVasilev17/media-os/pull/241) gives the closer first-Take UI precedent. Those historical source descriptions do **NOT** prove that an EP003 episode has been imported, that current runtime honors this rule, or that any paid Take was generated. Verify actual deployed branch/version/read-only Director UI before first spend.
- Mandatory audited gating in both frontend and backend: `EP003_SLOW_NATURAL_FIRST_TAKE_PRECHECK_PASSED` only after all checks, `SLOW_NATURAL_SOURCE_LOCKED`, `PAID_GENERATION_DIRECTOR_CONFIRMED`, `VOICE_TAKE_CREATED_AWAITING_HUMAN_QA`, `VOICE_TAKE_DIRECTOR_APPROVED`. On failed checks: `SLOW_NATURAL_PRECHECK_BLOCKED`. On provider uncertainty: `PROVIDER_REQUEST_UNCERTAIN_NO_RETRY`. On voice problem: `VOICE_TAKE_QA_REVIEW_REQUIRED_NO_AUTO_REGEN`. These are **specified desired statuses**, not claims of existing shipped fields.
- Once stored, read metadata: source hash, model, voice clone ID, `deliveryMode=SLOW_NATURAL`, take ID, real duration, paid operation request UUID, original waveform and any genuine alignment arrays. A take in storage is NOT assumed approved; listen and Director select/approve. Compare actual narration word-for-word and pronunciation; test that pace is naturally slow and meaningful breaks exist.
- If alignment is unavailable, recover timestamps from the current saved MP3 under separately authorized alignment policy; NEVER synthesize missing frames or regenerate voice to make scene timing appear ready. No manual beat input requested from Director if safe automatic source→actual audio timing resolution is possible.
- Any exception from the FIRST-TAKE SLOW policy must be a future explicit Director decision, not an agent default.

## First production sequence for EP003

1. Keep v0.4 Script immutable and Voice Direction v1.0 as review-only until Director acceptance.
2. Prepare exact 11 per-SHOT pacing and natural pause maps and pronunciation QA with source checks **without spending credits**.
3. Verify EP003 package/Voice Studio route and back-end SLOW_NATURAL enforcement in read-only mode; implement and test missing checks before declaring readiness, and document relevant exact deployed commit if released.
4. For each SHOT, show Director the preflight summary and **ONE** explicit paid slow-intake generation request. Do not generate from this policy document or a script/Voice Direction LOCK.
5. Director listens, reviews, approves original stored Take. Only then derive genuine HEAR→SEE timing and visual scenes; do not TTS-recreate for video timing or seam mismatches.

**This is a new strict Director rule. The actual EP003 runtime first-Take-only gate, voice cost/quality success, and UI readiness are still pending verification/implementation and are never claimed by documentation alone.**
