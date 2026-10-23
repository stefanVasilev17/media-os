# EP001 SHOT 07 — Tier++ Director Visual Remake (2026-10-24)

## Creative issue and final direction
Director rejected previous SHOT07 review as visually noisy, abstract, text-heavy, unengaging, and amateurish; the large-map User Lookup was especially unacceptable. New visual must make Auth Service obvious from first glance, incorporate a comprehensible mini phone, and teach with physical changes instead of word-heavy dashboard cards.

## Immutable editorial gates
- Do not change any of five already Director-LOCKED C01–C05 voice clips, narration, voice directions, ElevenLabs alignments, or their order.
- Do not alter SHOT01–06; SHOT06 Director-approved v5 original is separate from pending native MediaOS QA/LOCK.
- SHOT07 remains VISUAL_DRAFT and may be Director LOCKED only after Director watches the new MP4 and native QA passes. This change is never an automatic approval.
- No failures, retrials, sessions or login-success visuals in SHOT07; Auth is not permitted to claim successful identity verification.
- SHOT08 continues from a cyan User Lookup approaching User Database, with original green Login Request still in Auth.

## Tier++ living-map teaching design
1. **C01:** preserve map geography from SHOT06, trace existing mint Login Request into Auth; large spatial question mark: routing selection is not identity verification.
2. **C02:** teaching inset mini phone shows fictional alex@example.com and masked password as an explanatory recap, not a new login event. Transfer into exactly two oversized Auth data tiles: Account Identifier and Submitted Secret; receive != verify.
3. **C03:** three distinct oversized visual demonstrations: both fields present, email @ syntax, illustrative input-size bar. Progress by word-level anchors; a structurally valid request explicitly does not equal successful login.
4. **C04:** tangible distinction between submitted account claim and still-missing stored account facts; elegant magnifier precedes creation of User Lookup.
5. **C05:** smoothly reopen the regional architecture. One small cyan service-to-service tracer travels via existing Auth outgoing port to Database input; original mint Login Request stays in Auth. Editorial payload inset shows only the fictional email, no password. Avoid giant text panels over the map.

## Implementation and reproducibility
- Preserved previous visual source: `remotion-engine/src/episodes/ep001/live-diagram/AuthServiceYoutubePreview.tsx`.
- New isolated visuals: `remotion-engine/src/episodes/ep001/live-diagram/AuthServiceTier2YoutubePreview.tsx`.
- `VoiceSyncedShot.tsx` now imports the new visuals only for SHOT07; SHOT01–06 compositions unmodified.
- Visual v3 imported via safe, idempotent Flyway V75 migration; preserves all HEAR voice fields and safety checks; requires no existing SHOT07 video lock.
- GitHub CI TypeScript passed for new composition; Railway render worker successfully deployed.
- One-shot script: `ops/shot07/render_director_review_once.py`, guarded by voice SHA, exact draft source, approved five clips, 30 unique aligned semantic anchors and storage health.
- Initial old review ID: `37a47af3-a8fe-4fc5-b421-398f10380f7b`; do not present this as Tier++.
- **New Tier++ Remotion preview ID:** `8fcc80df-4299-42ce-b458-8b1d1d4b7373`, composition `EP001-Shot07-VoiceSynced`, 1920×1080 @30fps, 4882 frames. Submitted to CPU queue on 2026-10-23 22:37 UTC; render success must be confirmed before declaring it ready.
- Media URL when SUCCEEDED: `https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/8fcc80df-4299-42ce-b458-8b1d1d4b7373/video`.

## Director QA criteria
- The viewer immediately knows what the phone illustrates and what Auth is actually receiving.
- Email and password have unmistakably different roles; password stays masked and never appears in lookup.
- Checks are shown physically, not merely labeled; progression follows spoken voice anchors.
- "REQUEST VALID" does not imply authentication success.
- Exactly one mint original request persists, exactly one cyan outgoing lookup appears. Topology matches SHOT06.
- 1080p-safe text and icon legibility, restrained lighting, camera motion and negative space.
- Director reviews full video before any native Visual QA/LOCK promotion.
