# EP002 — Director V2 pacing and SHOT10 focus revision (2026-11-12)

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
