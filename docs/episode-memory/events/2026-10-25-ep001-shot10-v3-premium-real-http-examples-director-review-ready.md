# EP001 — SHOT 10 V3 · Premium practical auth examples — Director Review READY

Date: 2026-10-25. **Status: NOT LOCKED / SILENT VISUAL PREVIEW.** The Director requested a more detailed, more modern and less static SHOT 10 featuring real-life technical examples, while keeping it *short* because the approved SHOT01–09 composite has already reached ~17:11.

## Correct final visual
- **Final preview render ID: `37e4c5c8-cf43-44af-baa2-c13774b5e75e`.**
- Playable MP4: https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/37e4c5c8-cf43-44af-baa2-c13774b5e75e/video
- Component `EP001-Shot10-SessionCreationShortV3`, source `remotion-engine/src/episodes/ep001/live-diagram/Shot10SessionCreationShortV3.tsx`. Exact final source patch commit `e20574e1cff6bcaedb7a224156f4e4a5b7126190`. Composition registered in `remotion-engine/src/Root.tsx` and Backend `RemotionRenderController`.
- **72s exactly, 2160 frames at 30 FPS, 1280×720 FAST_PREVIEW, 8,547,955 bytes.**
- 100% `READY`, byte-range HTTP 206 header `ftyp`, FFprobe `duration=72.000000`, video frame count 2160, exact 30/1 FPS. Independently decoded JPEG frames at 7, 17, 35, 52 and 68 seconds; visibly inspected after last patch. No audio intentionally (director narration/voice not yet approved/generated); do not auto-append to locked episode.

## Timed motion and technical examples
- **0–12s** reuse *original* SHOT08/09 canonical Living Architecture Map and verified account 0042 inside User Database, camera push toward auth. Do not redraw alternate map.
- **8–26s** Auth Service success feeds verified account 0042 / alex@example.com into Authentication State. Digital packet moves along connector; `CREATE REUSABLE LOGIN PROOF` lights up; safe, clean typography.
- **23–44s** concrete **server-held session** path: server session store maps demonstrative `sid=s_9K2F...` to account 0042; response has `Set-Cookie: sid=s_9K2F...` with example flags `HttpOnly · Secure · SameSite=Lax`; another request `GET /account` sends `Cookie: sid=s_9K2F...`. All values *illustrative*, not real secrets or a description of every app.
- **41–61s** **alternative signed access token**, not simultaneous cookie + bearer requirements. Illustrative subject 0042 and 15-minute expiry; next request `GET /api/me` sends `Authorization: Bearer eyJ...`; checks signature **and** expiry before trusting token. Minimal two-column contrast and violet motion accents.
- **58–72s** bounded trust lifetime / response preparation (HTTP 200 example), proof ready; phone still waiting for response. SHOT11 is the phone/dashboard payoff. No failures/MFA/expired-token detour in EP001.

## Director visual QA revisions
- V2 `2e26cd9d-22ef-4c72-a0dc-4aed7634c02c`: actual video verified but UI `BELONGS TO` and account ID collided; `CREATE PROOF...` almost touched boundary.
- First V3 render `3fe63552-5067-41e0-85ae-84ec87de7dea`: replaced session overlap and shortened label, added GET requests and subtle scene camera push, but `EXPIRES AFTER` and `15 MIN / EXAMPLE` collided in token claims.
- **Final V3 render `37e4c5c8-...`**: independent code patch uses `EXPIRY` with separate right-aligned `15 MIN` within illustrative-token card and shortens `SERVER STORES THE LOGIN`. Verified screenshots at 35s and 52s show no collisions; 68s phone handoff legible. This **is the version to show Director**, not either earlier test.

## Boundaries / future steps
- Original approved EP001 SHOT01–09 1080p cumulative `fd1046d0-6b20-4267-8135-8b67add2ca33` is Director LOCKED and remains unchanged.
- No SHOT10 creative LOCK, no native database LOCK, no approved or generated SHOT10 voice, and no combination with the locked episode until Director explicitly approves visual and narration.
- Historic revision-3 SHOT10 failure/invalid-session clips are **not** valid for successful-login SHOT10 and must not be reused/replaced.
- The revised next voice pass should be a separately versioned ~72s / 4-part script aligned with scenes and real-world cookie/token demonstration; Director must approve before generation.
- Reusable principle for future OS agents: concrete real requests, physical packet flow, dynamic focus, minimal distracting labels, never allow content to touch capsule borders; QA animated states at actual playback size, not just static code.
