# EP002 — Director V2 pacing and SHOT10 focus revision (2026-11-12)

## 2026-11-12 11:06 UTC — VERIFIED PRODUCTION RESULT (SUPERSEDES STAGED STEPS BELOW)

**DONE — REAL V2 MASTER IS STORED IN MEDIAOS DIRECTOR ROOM.** `6f5957be-26e4-45b8-b680-e250dcd134a0`, 74,492,108 bytes (71.0 MiB), 1920×1080 at 30fps, **24,046 verified video frames / 13:21.533 seconds by frame count**, MP4 container duration 801.664 seconds after AAC encoding (0.1307s difference). Actual Railway Worker event `EP002_DIRECTOR_V2_BREATH_MASTER_REVIEW_READY` confirms 11 exact approved source MP4s, corrected SHOT10 render `96e427d2-b518-47c0-a287-59ea42cfab52`, ten seams × sixty 30fps frames of speech rest. After rendering and FFprobe, the Worker completed the Backend storage callback successfully (`EP002 full eleven-SHOT Director review MP4 stored`). The original full master `8876235a-8037-4f19-8f5c-d2398f3ef22f` was not altered.

[Open EP002 V2 player in Director Room](https://media-os-backend-production.up.railway.app/#/library/EP002). Video path: `/api/v1/remotion/renders/6f5957be-26e4-45b8-b680-e250dcd134a0/video`. **Technical deliverable complete, final human creative visual/audio approval still pending; do not auto-LOCK.** Check all ten seamless moving-map pauses and confirm that the reduced SHOT10 labels work for a viewer.

**Production details:** Master succeeded on pinned worker source `a283e67496191d15efbdaed9b363f5fed3e32c0b` in permanent `release/ep002-v2-master-worker-pinned-a283-20261112` branch. One exact `RUNNING` master recovered after a Railway Worker replica swap using `Ep002V2InterruptedMasterRecovery`, preserving the same render ID and adding an immutable one-time recovery marker; the flag was disabled again before final stable release. The terminal render QA measured AAC audio container drift +0.1307s, within 0.4s (verified frames exact). **Historical staged/failed references lower in this document describe earlier attempts and are not the current state.** Do not change the pinned Worker source or trigger a new paid render unless the Director explicitly requests another version.


## Director feedback — exact source intent

Director reviewed original complete 11-SHOT review master `8876235a-8037-4f19-8f5c-d2398f3ef22f` and requested two changes:

1. The episode visibly sounds and feels like eleven separately produced clips joined together. Add **exactly two seconds without narration at all ten SHOT boundaries**, allowing the audience to understand the previous section before the next narration starts; **animations must remain alive** during the pause.
2. **SHOT10 — PROVE THE RECOVERY:** The rapidly changing small containers under the primary living architecture map distract more than they teach. Remove secondary/tertiary quick-changing cards; keep the main diagram, readable key evidence and genuine technical meaning.

**Important:** Feedback is approval to revise, NOT acceptance of a new visual master. Prior production MP4 is immutable and remains a valid historical Director review.

## V2 visual changes prepared

- `remotion-engine/src/episodes/ep002/Shot10DirectorVisualV1.tsx`: removed the `VoiceDrivenCard` groups (12 short-lived state cards), `VoiceMarkers` (8 rapidly cycling caption states) and standalone mini database meter. This reduces lower-map competition to **zero rotating card elements**. Retains living `Shot07CleanArchitectureWorld`, exact `lockedShot09Handoff` frame relation, gradual load-pressure recovery, existing real voice/cue contract, the main title and a single static footer: `PROVE RECOVERY: COMPLETED NEW LOGINS · ERRORS · REJECTIONS · P95 / P99`. The source SHOT10 MP4 remains untouched until a new separately approved Director preview render is produced and reviewed.
- `remotion-engine/shot10-recovery-contract.test.mjs`: replaced outdated mandatory rotating-card assertions with explicit no-card and stable-key-messaging contract tests.

## V2 audio/visual editorial design

`remotion-engine/ep002-director-breathing-master.mjs`: validates an ordered set of eleven distinct absolute-source MP4s with actual frame metadata; builds a frame-accurate FFmpeg timeline:
- For each outgoing SHOT01–10, first video `N-60` frames play unmodified in timing. The actual final **60 animated frames** are optically motion-interpolated across **120 frames**, giving a smooth four-second conclusion of the last two-second source motion.
- Existing original selected voice/audio is not regenerated, compressed in time, or shifted from source cues. The resulting outgoing video ends 60 frames later; the audio track is padded with silence, so the **final two seconds contain no new voice**.
- Incoming SHOT starts only after that two-second rest. No trailing addition after SHOT11, no new synthetic source narration.
- Eleven 1920×1080, 30fps source clips with unchanged durations would total `23,446 + (10 × 60) = 24,046` video frames and **801.533 seconds = 13:21.53**. SHOT10 corrected version should preserve its currently approved **2,360 frames**.
- Encodes a **new** high quality H.264/AAC master; output never overwrites or edits any approved input. Exact frame count, 30fps, FullHD, stream and duration are checked after FFprobe.
- If the final two seconds of a particular original SHOT contain no visible movement, it needs an explicitly animated outro from the source composition rather than an artificial frozen frame; check actual ten seam videos before accepting the new master.

## Release / verification boundary

**STAGED SOURCE WORK ONLY at first authoring.** Code revision and builder are not yet proof of a new SHOT10 MP4 or new V2 master. Do not claim v2 is in MediaOS until the actual Worker creates and stores the separate new audio/video MP4, and a Director sees the 10 transitions plus SHOT10.

**Release sequence:** (1) run full Worker/TypeScript and Java checks; (2) render new SHOT10 with same real approved Take and same 6/21 timing anchors, pinned new visual/source SHA, preserve old SHOT10; (3) inspect and approve that new SHOT10 in Director Room; (4) version a new exact 11-source master manifest with newly selected SHOT10 render ID and original 10 unchanged render IDs; (5) render the new breathing-room master using the separate, explicit CPU confirmation; (6) inspect actual silence, motion, joins, FullHD, AAC, frame count, and ensure original prior master remains intact; (7) only then consider final Director LOCK.

**Original master:** `8876235a-8037-4f19-8f5c-d2398f3ef22f` (23,446 frames, 13:01.53, stored 84,647,711 bytes). This remains unchanged in MediaOS.
