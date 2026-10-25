# EP001 SHOT 08 v8 — Director Review Implementation

## Director instructions (2026-10-25)
- **Green dot:** in the final SHOT07-style main architecture map at the start of SHOT08, the mint waiting signal must leave the center of Auth Service and barely touch the left edge of User Database.
- **Email focus box:** during indexed lookup, move the animated focus rectangle left so that the first character of `alex@example.com` has comfortable internal padding and no border intersects the text.
- Preserve SHOT08 v7 premium navy/cyan visual design, modern stationary-focus search, selected record `0042`, and `MATCH FOUND` summary.
- Director explicitly requested GitHub commits and a direct rendered video, not a manual patch.

## v8 files and numerical geometry
- Original **Director-locked SHOT07 v10 remains untouched** at `remotion-engine/src/episodes/ep001/live-diagram/AuthServiceTier2V10YoutubePreview.tsx`.
- New isolated copy `remotion-engine/src/episodes/ep001/live-diagram/AuthServiceTier2Shot08BridgeV8.tsx`: waiting dot center from (1483,613) to (1612,613), core radius 8.5, glow radius 13. Database exterior begins x=1622, so core right edge x=1620.5 is **1.5 logical px** away from touching the main Database border.
- New `remotion-engine/src/episodes/ep001/live-diagram/UserDatabaseV8Premium.tsx`: imports isolated bridge. Email focus bounds from x=393 width=501 to **x=360 width=534** (right edge remains x=894). Text `alex@example.com` begins at x=392, leaving **32 logical px** of breathing room. Inner translucent focus field x=373 width=510 and left-bracket line x=378 align to new frame. Right-side indicator stays in place.
- New Remotion composition `EP001-Shot08-PremiumV8`, 1650 frames, 55s, 1920x1080 logical; FAST_PREVIEW 1280x720 30 FPS.
- New MediaOS backend profile `EP001_SHOT08_PREMIUM_V8`.
- Commits: bridge `38dbf5076a4ee3eb2a9f9f5a7b26d8bf95ae0912`; scene `bc8c3af4183c22ceb3cdeb48a8ca043e03649dc1`; Remotion root `8dfa210f08edda850f489b0ead423cbe9f69ec00`; backend profile `6cc8f818cfcf383451bd5d8173019509f721cf34`.

## Pre-render safety and QA
- Independent Bun transpiler **PASS** for both new TSX files; geometry guards PASS.
- Backend and worker source deployments are correct for the v8 composition. MediaOS guarded render request confirmed SHOT01–07 all native LOCKED with QA PASS and unchanged cumulative preview `1fcb24e2-99bc-4e97-85f1-cbafcfc4e94c`.
- Review render `19d15beb-dd5f-4986-be58-2a75c6bb5ffb` (`EP001-Shot08-PremiumV8`) submitted 2026-10-25T07:10:25Z. **Do not call READY until MP4 metadata and HTTP delivery are independently validated.**
- After render: capture true MP4 frames at first architectural map, 3–6 seconds waiting dot, search focus at 21–26 seconds, match/hold at 29–50 seconds, confirm readability and transitions. V8 remains **NOT LOCKED** until Director approval. No new Director-approved SHOT08 voice pack was supplied, so no narration-sync claim.

## V8 ready MP4 and encoded-frame QA — October 25, 2026

- Final isolated v8 render: `19d15beb-dd5f-4986-be58-2a75c6bb5ffb`, `EP001-Shot08-PremiumV8`, `FAST_PREVIEW`, 1650 frames / 55 sec, 1280×720, 30fps, **READY**, file size **1,676,493 bytes**, completed `2026-10-25T07:13:28Z`.
- **Direct playable video:** https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/19d15beb-dd5f-4986-be58-2a75c6bb5ffb/video
- Independent MediaOS QA: valid MP4 `ftyp`, `Content-Type: video/mp4`, tested HTTP 206 Partial Content `bytes 0-127/1676493`, exact byte-size match.
- Thirteen native encoded-frame screenshots captured and inspected at 0s, 3s, 6s, 9s, 11s, 17s, 21s, 24s, 26s, 29s, 34s, 43s, 50s. **Visual evidence:** main architecture map at 0–6s, waiting mint dot near database node's left edge, modern database table transition, new left-inset email search frame on each candidate including Alex at 26s, correctly stopped and selected `0042` at 34s, crisp `MATCH FOUND` context strip staying inside boundaries at 50s. All previous saturation and restrained modern lookup design preserved.
- The protected cumulative Director-approved preview remains exactly `1fcb24e2-99bc-4e97-85f1-cbafcfc4e94c`. Native MediaOS guard **PASS**: SHOT01–07 all locked with `qaStatus=PASS` and exact previous locked render ids unchanged.
- **Director creative approval still pending.** v8 is a **silent, visual-only Director Review**, not a voice-synced or publication master. No v8 native SHOT08 lock or cumulative-preview append was requested/performed.
