# EP001 — SHOT 11 Presentation V5 — FINAL DIRECTOR CREATIVE LOCK

**Director's explicit approval:** **"Lock!!!"** on **2026-10-27**, in direct response to the completed SHOT 11 Presentation V5 video, after multiple Director-requested layout revisions and a final V5 review.

**Canonical creative status:** `SHOT11_PRESENTATION_V5_DIRECTOR_CREATIVE_LOCKED` — **immutable exact master**.

This is the Director's explicit **creative approval of this exact MP4**, not a claim of a legacy native 1920×1080 `visual_shot_lock` database QA transaction. Preserve the original render ID, approved voice clips, source version, visual language, composition and timeline. Do not silently re-render, regenerate, substitute, delete, trim, replace, recolor, recut, remaster or append to an existing locked master without an explicit Director unlock / new approval.

## Exact Director-approved MP4

- **Master render UUID (exact):** `3a09dbd5-7ef8-4c0e-9621-12ca8a4b99a0`
- **Playback endpoint:** https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/3a09dbd5-7ef8-4c0e-9621-12ca8a4b99a0/video
- **Composition ID:** `EP001-Shot11-RouteDecisionPresentationV5`
- **Source file:** `remotion-engine/src/episodes/ep001/live-diagram/Shot11RouteDecisionPresentationV5.tsx`
- **Approved composition-source commit:** `08ff46681270f7cbf7ceac5f565bd627675718d0`
- **Video properties:** `FAST_PREVIEW` render profile, **1280×720**, **30 fps**, **2160 frames / 72 seconds**, **5,236,262 bytes**; exact Railway Remotion Worker success line: `Completed 3a09dbd5-7ef8-4c0e-9621-12ca8a4b99a0: 5236262 bytes`.
- **Do NOT replace with V1, V2, V3 or V4**, nor a subsequently derived preview. Each earlier iteration is historical and not the Director-approved SHOT 11 master.
- **Original Studio SHOT11:** `0f164b33-bd45-4afd-abc5-90bfba735d1f`.

## Locked narration and ElevenLabs audio — unchanged

This visual lock inherits, without modifying, the independent Director-approved SHOT11 V2 narration / three recorded Studio voice clips documented in `docs/episode-memory/events/2026-10-26-ep001-shot11-v2-director-locked-narration-and-approved-voices.md`.

1. **C01** UUID `bc6cc60f-7aad-4fe9-99c9-e61942d13d1e`; Studio script revision 3, generation revision 2; original locked/approved audio. Voice starts at **frame 0 / 00:00**. Real measured 18.561 s.
2. **C02** UUID `399da60c-1e63-457f-929d-5c67374519cb`; Studio script revision 2, generation revision 1; original locked/approved audio. Voice starts at **frame 660 / 00:22**. Real measured 19.761 s.
3. **C03** UUID `4e58d6dc-0045-4d85-8381-31339a8c1ffe`; Studio script revision 2, generation revision 1; original locked/approved audio. Voice starts at **frame 1380 / 00:46**. Real measured 23.441 s.

The three slots are **0–22s**, **22–46s**, **46–72s**; silent/breathing moments are intentional. Never regenerate, retime, replace or edit the approved audio by virtue of this visual lock. No new ElevenLabs charges are required.

## Locked content and learning design

Modern Presentation Architecture: dark navy subtle grid; opaque blue panels; high-contrast cyan data flow; green for confirmed state / authorized access; purple for token alternative; amber for the not-signed-in route. Prefer readable explanations of hidden architecture rather than merely describing UI changes.

**C01 | 00–22 seconds — what the phone keeps after login.** The response reaches the phone. Show two *alternative* models: browser session cookie (stored by the browser, automatically attached to matching requests, session identifier maps to server-side session) OR token-based client (token stored/managed by the client and sent on later API requests). Show a realistic phone, a high-contrast success overlay, and legible explanation cards. Director removed a noisy subtitle, raised the headline and required the session-cookie supporting objects to add actual technical insight.

**C02 | 22–46 seconds — Route Decision.** A confirmed authentication state controls the application's navigation, not permission to read the backend. Two clear alternative mobile screens: **SIGNED IN → DASHBOARD** and **NOT SIGNED IN → LOGIN**. Larger readable smartphone mockups; no cluttered extra footnotes or unnecessary supporting labels. Not-signed-in is a branch comparison, **not an expanded failure storyline**. In the final Director V5 fix, the **Client auth state title is horizontally centered**, and the green checkmark and `Authenticated` label have separate room (no overlap).

**C03 | 46–72 seconds — protected Dashboard data.** Dashboard appears with *loading/skeleton cards*; the phone sends a separate `GET /account` request with session cookie OR bearer token as appropriate; the Protected API authenticates the proof, checks account permissions, returns only allowed private data and then the Dashboard fills. A successful login never means unlimited permission. The `GET /account` packet must remain visible **above / outside** the Protected API panel rather than slipping under it, preserving the corrected V4 position and drawing order in V5. In the final Director V5 fix, the green status indicator in the phone's **Your overview** card is shifted upward so it does not overlap the text.

## Locked source, verification and retention protection

- Existing **SHOT01–09 cumulative Director master** `fd1046d0-6b20-4267-8135-8b67add2ca33` remains untouched and immutable.
- Existing **SHOT10 Clean Presentation V8 Director master** `7e55c59a-3102-4d4c-b23e-96c68ad1f286` remains untouched and immutable.
- Exact SHOT11 V5 source and composition are saved at the original approved commit `08ff46681270f7cbf7ceac5f565bd627675718d0`; future changes to shared components or registries must not silently redefine the approved V5 master.
- Automatic Render Retention protection of **the exact SHOT11 V5 UUID** was added to **both the candidate SELECT and conditional UPDATE safety predicates**, alongside the existing SHOT01–09 and SHOT10 guards, in **retention commit** `225c54d5a3e7b5829668ef57b73a5f8545814175`. Source: `backend/src/main/java/com/architecturalthinking/mediaos/remotion/RemotionRenderRetentionService.java`. Changes to retention code require live deployment before claiming this new guard is active in the running backend.
- This is a **Director creative LOCK**, distinct from legacy `visual_shot_lock` (which has a different shot mapping / resolution flow and does not automatically cover SHOT 11). Do not record a fictitious native lock or retrofit an incompatible older QA gate.
- The exact final MP4 was confirmed as successfully completed by Railway Render Worker, not merely queued. Director provided the final explicit `Lock!!!` after V5 review.

## Next authorized work

**EP001 successful-login-only / Happy Path plan:** approximately **12 SHOTs** in current working plan (not a separately locked exact count). SHOT 11 is now immutable. Proceed to **SHOT 12 — final architectural recap / successful Login resolution**, with a fresh Studio narration draft and Director gate, consistent with the already-locked SHOT01–11. Failure/retry/recovery architecture belongs to a separate follow-up episode; do not expand EP001 into the old 16-shot failure storyline.

**Source of truth:** the Director's explicit `Lock!!!`, this event, the exact source commit + original MP4 UUID, and the independent locked C01–C03 Studio voice assets.
