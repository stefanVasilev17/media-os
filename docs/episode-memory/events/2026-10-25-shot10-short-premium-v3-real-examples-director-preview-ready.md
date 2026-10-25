# EP001 SHOT10 — Premium session creation V3 — Director visual preview READY

**Date:** 2026-10-25. **Status: READY for Director visual review; NOT Director LOCKED and NOT appended to previously locked SHOT01–09.** Director asked for SHOT10 to remain short (the episode is already 17:11), modern, animated, technical and filled with concrete examples rather than static cards.

## Exact newest verified visual review
- Composition: `EP001-Shot10-SessionCreationShortV3`.
- **CURRENT preview render ID: `37e4c5c8-cf43-44af-baa2-c13774b5e75e`**. Supersedes prior V3 render `3fe63552-5067-41e0-85ae-84ec87de7dea` that contained overlapping expiry labels.
- Watch: https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/37e4c5c8-cf43-44af-baa2-c13774b5e75e/video
- **72.000 seconds, 2160/2160 frames, 30 FPS, 1280×720 FAST_PREVIEW, 8,547,955 bytes**.
- Validated actual video with FFprobe: single H.264 stream duration 72.000000 sec, 30/1, 2160 frames, silent (no voice). Range request returned valid MP4 `ftyp`. Independent actual frame extractions at 7, 17, 35, 52, 68 seconds succeeded.
- The token example at 52 seconds was visually reviewed after the final fix: `SUBJECT 0042`, `EXPIRY 15 MIN`, no overlap. Explicit header `TOKEN / ILLUSTRATIVE` prevents assuming all token lifetimes are 15 minutes. The server-session account reference and cookie header were checked at 35 seconds; text does not overlap.
- Visual source at `remotion-engine/src/episodes/ep001/live-diagram/Shot10SessionCreationShortV3.tsx`, typo patch commit `e20574e1cff6bcaedb7a224156f4e4a5b7126190`, registered in Root and Backend with composition and profile. Remotion Worker deployment source `e20574e1cff6`.
- Opening deliberately reuses original canonical architecture via `AuthServiceTier2Shot08BridgeV8` with `showFoundAccountRecord=true` and account `0042`, no substitute global diagram.
- Within 72s: verified identity creates login state → alternative example A server-held `sid=s_9K2F...` and `Set-Cookie` / `Cookie` on `GET /account` → alternative example B signed access token, `Authorization: Bearer eyJ...` on `GET /api/me`, expiry and signature checks → response prepared but Phone still waiting. No failure path, dashboard or unrelated MFA.
- The examples are **alternatives**, never claim every login creates both session and bearer token. All strings and account identifiers are illustrative, not credentials.
- All original SHOT01–09 Director-approved masters and nine-shot composite `fd1046d0-6b20-4267-8135-8b67add2ca33` unchanged; no prior voices edited or regenerated; **this MP4 is intentionally silent**.
- Prior V1 visual V1 `1f343c04-4cb9-4d2e-b9f7-3f4d98921cdc`, V2 `2e26cd9d-22ef-4c72-a0dc-4aed7634c02c`, and V3-before-fix `3fe63552-5067-41e0-85ae-84ec87de7dea` are historical non-approved drafts; do not accidentally send those as current.
- **Next step:** Director reviews exact newest V3; prepare/approve updated standalone 72s narration and synced original voice separately. Never auto-lock this preview.
