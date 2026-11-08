# EP002 SHOT02 V7 — Director Visual LOCK

**Director explicit approval date:** 2026-11-08 (Europe/Sofia).  
**Status:** DIRECTOR_LOCKED — actual SHOT02 V7 MP4 reviewed and approved by the Director in this conversation. This is an explicit SHOT-level visual lock, distinct from the existing global Tier++ art-direction lock.

## Approved render identity and evidence

- Episode: EP002 — Why Login Fails Even When the Server Is Healthy
- Shot: SHOT02 — 9:00 AM: The Ticket Sale Opens
- Composition ID: `EP002-SHOT02-CANDIDATE`
- Historical actual V7 Render ID: `59567d1a-6a45-4e48-b390-8ae583f30171`
- Render Worker source SHA for that V7 MP4: `be142b2573b190e3f70fab5586da6825a7a479d2`
- Verified completed MP4 in Railway 2026-11-07 at 23:39:28 UTC; 6,060,569 bytes
- Output: 1920×1080, 30 fps, 1522 total frames (1462 approved source voice frames + exactly 60 authorized post-voice visual-hold frames)
- Existing approved ElevenLabs Slow Natural selected audio/Takes and real 5 HEAR→SEE beats + 7 spoken-term cues are preserved. This lock does not authorize any new TTS.
- Source family: `remotion-engine/src/episodes/ep002/Shot02DirectorVisualV5.tsx`, `Shot02PressureVisuals.ts`, SHOT02-only tests and exact underlying commit history in draft PRs #195, #196, #197.
- Global visual bar: `docs/visual/AT_TIER_PLUS_PLUS_VISUAL_RENDER_STANDARD_V1.md` in draft PR #198, not yet merged to `main` at the time of this lock.
- Current deployed Tier++ monitoring Worker at the time of lock: `d6b19101c41c809d2ede4bdf0db42119362d498c` (a later build than the V7 MP4). No post-monitoring MP4/technical QA log receipt is claimed by this approval.

## Locked visual outcome

The approved V7 version has one continuous Living Architecture world, readable 09 : 00 ticket-sale hero, one canonical mint-green request particle family across phone → Gateway → Balancer → three independent Auth replicas → shared Database, healthy cool DB before spoken pressure, semantic gradual amber/orange pressure only after the approved User Database cue, consistent three-to-one routing, legible safe-area placement, rising Arrival Rate counter and elevated non-colliding closing title. Preserve the original selected voice and the approved two-second visual tail. This is a concrete visual reference for future SHOTs, not a command to copy SHOT02-specific geometry, event content or timing into them.

## Change protection

1. No silent modification of SHOT02 V7 source behavior, audio, visual output, selected take, cue frame map or approved rendered artifact. Any change requires an explicit Director unlock and a new reviewed version; never rewrite the locked version.
2. No unlock of protected EP001 or EP002 SHOT01. The global Tier++ style rule remains separate from the final SHOT02 visual lock.
3. Existing draft PRs remain separate unmerged engineering work. This documentation-only lock does not certify that all dependent feature branches are merged to main or that a new MP4 passed the later Tier++ runtime instrumented QA.
4. No automatic TTS, paid render, provider API, GitHub Actions or broadened worker claims are granted by a creative LOCK.

## Next approved production step

Proceed to EP002 SHOT03 **voice preparation first**. Use the current Director-saved narration revision and current approved creator-clone voice identity inside MediaOS; the archived locked v4.0 source is a reference, not permission to overwrite a newer working draft. Every new ElevenLabs generation requires the existing separate authenticated Director paid-confirmation flow. After a selected Take and real voice timing exist, propose SHOT03 Tier++ visuals and scene-specific tests with SHOT02 continuity. See `docs/episode-memory/EP002_SHOT03_VOICE_PREPARATION_20261108.md`.
