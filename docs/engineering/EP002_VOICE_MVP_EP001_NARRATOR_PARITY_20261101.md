# EP002 Voice MVP — EP001 narrator continuity contract

**Status:** Implementation candidate / QA only. **Never change EP001 locks, generated audio or assets.** No paid ElevenLabs generation is authorized by this document.

## Canonical source
The Architectural Thinking Core Production Bible v2.3 defines the EP001 narrator as the creator's **ElevenLabs cloned voice** and locks the delivery style: **calm senior architect, natural English, documentary authority, curiosity/story-first, controlled pauses, technical precision, never textbook/trailer voice**. EP002 is a continuation of the *same narrator*, not a fresh synthetic speaker or accent.

### Immutable identity rules
1. Use the **same ElevenLabs voice ID and model ID** as EP001's final approved voice (not merely a similar preset name). No EP002-specific voice ID, model, language, dialect, cloned voice or emotional preset is allowed.
2. For EP002, the backend reads *only* the approved EP001 voice clip metadata and compares the configured ElevenLabs voice/model before spending credits. If reference metadata is missing, ambiguous or mismatched, generation is blocked and the Voice page explains why. The reference query never writes EP001 rows. The older shot-level approved voice metadata is used only when clip-level metadata is absent. If EP001 had multiple historical approved voice/model identities, the Director must identify the final published reference rather than silently picking one.
3. The same existing `ElevenLabsTextToSpeechService` is used for EP001 and EP002. It reads common Railway `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL_ID`, `ELEVENLABS_OUTPUT_FORMAT`, `ELEVENLABS_STABILITY`, `ELEVENLABS_SIMILARITY_BOOST`, `ELEVENLABS_SPEED`, `ELEVENLABS_STYLE` and `ELEVENLABS_USE_SPEAKER_BOOST`. Do not add episode-specific overrides. The existing v4-safe performance tag `calm, conversational, confident` is one shared constant. Shot-level visual tension is not an instruction to change accent, speed, dialect or vocal persona.
4. Keep the approved EP002 narration **byte-for-byte** unchanged. The optional ElevenLabs performance tag is sent only as a TTS prompt prefix; it is not saved back to the canonical Script. The currently stored `voiceDirection` is editorial metadata and is not used to silently replace the canonical TTS performance prefix.
5. The backend does **not** have a saved copy of every numeric EP001 synthesis setting tied to the final published audio. Voice ID/model equality plus shared runtime settings do **not** guarantee identical intonation or dialect across independently generated takes. Before approving EP002 SHOT 01, do an actual A/B listen to the final EP001 narration and generated EP002 SHOT 01, at matching perceived loudness. Check accent, pronunciation, sentence rhythm, pauses, speed, warmth and technical-term consistency. Reject and regenerate rather than accepting a foreign accent or changed persona.

## Minimum usable production workflow

1. Director reviews and locks exact EP002 Research, Script v4.0 (11 SHOTs), and Scene/Hear-See artifacts in the native episode workspace; GitHub creative locks do not secretly become MediaOS stage locks.
2. Production deploy uses a verified Director identity and EP002-scoped authorization, with a successful release-specific backup/restore and rollback path. **Do not bypass login** to turn on `MEDIAOS_EPISODES_WRITES_ENABLED`: the flag currently enables many episode mutations, not only Voice.
3. Load EP002 SHOT 01 Voice. The server reports voice identity verification, immutable narration, pending takes and truthful blocked reasons without making an external paid request.
4. After explicit Director-approved paid scope/budget, request **one** TTS take with timestamps; store audio and alignment under EP002's episode/shot/revision. Do not alter EP001. Listen, compare against final EP001 reference, approve only the selected take. Never approve automatically.
5. Reload and replay the approved take; verify persistence, episode isolation, checksum and worker-independent delivery. Repeat the process for SHOT 02 before enabling the remaining nine.

## Security and operational stop conditions

- Missing identity or OAuth secrets, missing stage LOCK, ambiguous EP001 voice metadata, modified narration hash, mismatched voice/model, unverified Director, duplicate/in-flight paid request, absent budget authorization, stale revision or wrong episode: **NO-GO**.
- Current EP002 write gates are broader than Voice. Follow-up engineering must introduce narrower EP002-only voice-write authorization and idempotency/concurrency protection for chargeable calls before exposing the button on public production.
- Google login configuration is deliberately deferred at the Director's request. Do not merge the whole release to `main` while identity is unconfigured; its `lockedWithoutIdentity` behavior denies protected API routes.
- Remotion/GPU worker rollout is **not required** for the initial ElevenLabs Voice milestone. It belongs to a later Video milestone.

## Acceptance evidence already available

- Previous isolated PostgreSQL 18 candidate build, production-schema-copy V85→V105 rehearsal, and retained verified private recovery snapshot have passed.
- This voice continuity change is checked in a separate QA build-only environment with no paid provider calls and no production deploy. **It does not prove a real EP002 ElevenLabs audio take or acoustic match.**

## Actual production EP001 voice identity inspection — PASS (2026-11-01)

Executed a one-time **private, read-only** verification service against the live production PostgreSQL. PostgreSQL session used `default_transaction_read_only=on`, query timeout and only `SELECT` statements. It compared the exact current production backend `ELEVENLABS_VOICE_ID` and `ELEVENLABS_MODEL_ID` (from Railway variable references) against distinct final approved EP001 voice/model metadata, **without printing any credential or identifier**. Observed:
- `EP001_APPROVED_VOICE_PROFILES=1`
- `EP001_VOICE_MATCHES_RUNTIME=YES`
- `EP001_VOICE_REFERENCE_READ_ONLY_CHECK=COMPLETE`

The one-time service was removed after observing the result and had no attached volumes or public domain. Production EP001 and backend were not modified. This verifies exactly **voice identity and model identity**; it does not prove the saved EP001 clip used the currently configured numeric stability/similarity settings and cannot prove identical acoustic accent or rhythm. Keep mandatory final-EP001/first-EP002 A/B listening before the first paid EP002 take approval.

The isolated PostgreSQL 18 + frontend build for the implementation passed **242 Java tests, 0 failures, 0 errors, 1 opt-in skipped**; frontend TypeScript/Vite and Vitest **15/15 PASS**. The source commit containing the voice backend and tests was `07b18b5991dd4844badb142991b5d73e36bd2231`; the later UI label and runbook also passed a pinned build at `1552d7a07b7e61ebf5a6e15a9bc0e819033c84d4`. The two subsequent operational-only files are a read-only audit script/Dockerfile and do not change runtime backend semantics.
