# EP001 — SHOT 10 — V7 HEAR / SEE / ElevenLabs

Status: **DIRECTOR REVIEW — NOT LOCKED**. Current short 72-second successful-login SHOT 10 (not the historical failed-login SHOT 10). Preserve all approved SHOT 01–09 audio and visuals.
Voice: creator's established ElevenLabs clone, calm senior architect; simple natural English, story-first documentary performance. Never generate a trailer voice or alter these draft lines without director approval.
V7 composition: `EP001-Shot10-SessionCreationShortV7`. Working target 2160 frames at 30fps. Final timing requires actual ElevenLabs word-level alignment. No approved SHOT 10 audio files have been established by the GitHub project records.

## C01 — 00:00–00:22 approx — `EP001_SHOT10_C01`

**HEAR — exact draft text (paste into ElevenLabs):**

> The password check has succeeded, but the phone is still waiting. That is because proving a login once is not the same as remembering it. The verified identity now reaches Authentication State, where the system can create proof it will recognize on later requests.

**SEE:** Keep the original Auth Service Living Architecture Map for the opening (~0–8.5 seconds), with the phone still waiting. Verified-decision capsule travels into Authentication State, then a faceted mint 3D reusable-proof core forms on an isometric technical pedestal. No Dashboard yet.

## C02 — 00:22–00:46 approx — `EP001_SHOT10_C02`

**HEAR — exact draft text (paste into ElevenLabs):**

> One design stores a session on the server and gives the client a Session ID. Another design can issue a signed token. These are alternatives, not two steps every login performs. Either way, the password itself does not need to travel with every future request.

**SEE:** Left: layered isometric SERVER SESSION rack, Session ID reference. Right: sculpted beveled SIGNED TOKEN proof object; JWT is only one possible format. Large OR between branches; highlight left then right. Never portray both as required successive login steps.

## C03 — 00:46–01:12 approx — `EP001_SHOT10_C03`

**HEAR — exact draft text (paste into ElevenLabs):**

> And that proof has a limited lifetime. When it expires, the system must check trust again. For now, Authentication State has created the proof, and the successful response can carry it back toward the client. There is still one final visible step: the phone must receive that response and leave the login screen.

**SEE:** TTL / expiry as amber orbital lifetime ring, no permanent trust. Proof moves to Response Prep, then an isometric packet travels toward Phone. End in WAITING; Dashboard handoff is reserved for SHOT 11.

## Binding / production gate

- Generate 3 audio clips independently in ElevenLabs and listen/approve each before voice lock.
- Use the existing `audioClips` prop with approved URLs and measured `fromFrame`/`durationInFrames`; V7 currently defaults to an empty array and does not invent voices.
- Word-level timestamps override these approximate shot windows. Adjust events to narration, not narration to the visual.
- For voice and SFX review, keep speech intelligible and the SFX subtle; do not auto-append into the approved SHOT 01–09 cumulative.
- Reference plan: `docs/episode-memory/plans/2026-10-25-ep001-shot10-short-session-creation-director-draft.md`.