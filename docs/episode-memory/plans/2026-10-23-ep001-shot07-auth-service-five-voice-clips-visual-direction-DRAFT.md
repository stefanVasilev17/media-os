# EP001 — SHOT 07 Auth Service / Validation Steps — Director Visual Pass DRAFT

**Status: VISUAL DRAFT; not Director-approved video; do not touch or regenerate approved voice.**

**Voice input:** Director reports all thirteen SHOT 07–09 clips generated and approved/LOCKED in MediaOS, 2026-10-23. Use live stored ElevenLabs audio and real alignment timestamps as the source of truth. The Director voice pack v3 has SHOT07-C01–C05 with estimated editorial seconds 515–724; **these are advisory only**. Do not render against estimated start/end seconds, and do not modify the voice pack.

**Relationship:** Continue visually from SHOT 06 v5, where one green Login Request was routed to **Auth Service Instance B / Zone B**. SHOT 06 visual and original C01–C07 voice are Director LOCKED. All SHOT 01–06 remain unchanged. The episode itself is Director Editorial LOCKED to the successful login through Dashboard (no extended failure/retry/recovery digressions).

## SHOT 07 — five contiguous visual beats to track the five approved audio clips

### C01 — What does Auth Service actually do?

The camera begins on the existing Living Architecture Map with **one canonical green Login Request moving from the selected Load Balancer route into Auth Service Instance B**. Only then zoom into Auth Service's interior decision space, preserving spatial continuity and restrained dark-navy layout. Introduce the contrast: the balancer answered **which server handles the request**; the authentication service answers **whether the user can prove the claimed identity**. Show a distinct and clearly visible `IDENTITY UNVERIFIED` state. The mere green travelling request is *not* a green authenticated decision.

### C02 — What information does it receive?

In the focused Auth Service panel, reveal the incoming request as two logical, readable fields: `ACCOUNT IDENTIFIER` (email-shaped, fictional and nonspecific) and `PASSWORD` (masked visually, never real credentials). Explain the identifier as the account selection claim, and password as submitted proof. Show a visible separation between *input received* and *input trusted*. Use only the minimum large, legible on-screen text to make that distinction.

### C03 — Understanding Validation Steps

Expand a concise validation lane with **required fields / expected structure / acceptable input limits**. Animate checks **one at a time, aligned to the actual spoken phrases**, and then hold the result `REQUEST VALID`. Critically, `REQUEST VALID` is not `AUTHENTICATED`; show the authentication decision remaining dim/unresolved. Do **not** use a fast montage that loses the viewer. This is only structural/input validation, not password correctness, account identity proof, or an extended abuse-defense episode.

### C04 — Why do we need User Lookup?

Switch attention to the identifier field. A named account is a claim: anybody can type an address, and knowing an address cannot prove ownership. Visually reveal the missing dependency to User Database. Keep the Auth Service waiting on account data, with no account-found and no success state yet. Avoid illustrating a fake wrong-password branch in this successful-login film.

### C05 — Two requests, two different jobs

Create a **second, separate cyan/blue User Lookup packet** originating inside Auth Service and directed to User Database while the **original green Login Request remains physically at the Auth Service**. These packets represent different calls with different responsibilities. Do not clone the password into the database lookup or copy the original Login Request toward the database. End on the cyan lookup travelling into SHOT 08; camera pans so User Database is next on the path.

## Mandatory Director visual qualities

- Same cohesive premium Living Architecture Map and camera language as SHOT 05–06; no new graphic world.
- No tiny decorative telemetry, vague “SYSTEM ACTIVE” captions, unnecessary counters or footnotes.
- One meaningful architectural change per voice point, legible states and causal clear packet motion.
- Use 1920×1080 and 30 fps for native MediaOS director candidate; review a *single MP4* carrying all five approved C01–C05 voices. Any lower-res preview must be labelled as review-only.
- Every meaningful state transition bound to actual approved ElevenLabs word alignment, not guessed timestamps.
- Never replace or regenerate any Director-locked SHOT 01–09 voice recording, and never regenerate/overwrite SHOT 01–06 Director masters.
- Director must review final playback before visual LOCK; no automatic visual approval.

## Checked blockers in current repository (2026-10-23)

1. `VoiceAgentPage.tsx` merges `mediaos.director-voice-pack.v1` with script/contract, so SHOT 07–09 voice slots can be imported and approved.
2. `VisualAgentPage.tsx` still builds shot navigation from *legacy canonical Script revision 3*; it does not merge the new Director voice pack. Its on-mount `syncVoiceClips()` uses legacy contract/script shot bundles. Do not attempt SHOT07–09 production from this unmodified Visual Agent until the voice pack is included and legacy sync is blocked for them.
3. `VisualQaController.compositionFor` currently maps SHOT 01–06 only; SHOT 07 will report `REMOTION_COMPOSITION` failed.
4. `VisualQaController.preflight` requires an active validated `episode_production_contract` segment for that shot, approved semantic anchors, voice duration and contiguous previous-shot post-render QA. The new Director Voice Pack is a *voice-only import*, not a `mediaos.production-contract.v1` HEAR/SEE visual contract. A new Director addendum/HEAR-SEE path must preserve original Script revision 3 and approved audio without trying to overwrite its old narration. Do not fake old script identity/timestamps to bypass the validator.
5. SHOT 06 native post-render QA/locked render still has independent handoff [issue #89](https://github.com/stefanVasilev17/media-os/issues/89). Avoid falsely marking native SHOT 06 as PASS/locked because a separate Director-reviewed MP4 has been approved.

## Correct production order

1. Verify in MediaOS that SHOT07's five clips are each approved and accessible; fetch actual generated word alignments and clip durations via authenticated production API, not GitHub estimates. (Director says approvals complete; don't question his sign-off.)
2. Implement non-destructive Director voice-pack-aware Visual Agent and native QA contract support for the v3 approved SHOT07 script. Preserve the existing earlier six shots.
3. Register a standalone `EP001-Shot07-VoiceSynced` Remotion composition and implement a voice-driven scene with the five visual beats above.
4. Produce full reviewed MP4 with approved original C01–C05 voices, perform QA, show Director. Allow corrections to visualization only.
5. Director LOCK SHOT 07 *only after* approved preview. Then repeat for SHOT 08 User Database and SHOT 09 Credential Verification, then finish Session Creation → successful Dashboard.
