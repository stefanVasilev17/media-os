# EP001 — SHOT 06 — Director video LOCK / single-video final voice review

**Decision:** 2026-10-21 Director explicitly said "Video lock" and requested the voices be included for final review; then clarified "Publish it as one video, not separate videos."

## Authoritative Director LOCK and final voice review media

- **Visual decision:** SHOT 06 Director VIDEO LOCK applies to exactly the v3 Clean Layout MP4 and its approved visual design. No visual revisions without another Director request.
- **Final Director voice approval:** **PENDING**. Do not interpret prior individual source-clip production approvals as final Director voice sign-off.
- **ONE playable final-review video:** https://github.com/stefanVasilev17/media-os/releases/download/shot06-director-v3-clean-layout-2026-10-21/SHOT06_LoadBalancer_Director_v3_CleanLayout.mp4
- Release: https://github.com/stefanVasilev17/media-os/releases/tag/shot06-director-v3-clean-layout-2026-10-21
- Release asset checksum (SHA-256): `834e984d6f42b12f89e305ae779b6fbb7fd6655f4bf25e843de5e1e451418ab9`
- Asset size: 12,326,125 bytes. Length: 171.243 seconds (5137 frames), 1280×720, 30 fps, H.264 video and AAC audio.
- Independent release QA: https://github.com/stefanVasilev17/media-os/actions/runs/39602383030
- Remotion source fix: commit `a09fe07c96f2cf0c0341f5c0495b3f5ac7461c58`.
- Video carries all seven original Director-approved-for-production voice clips **C01–C07** as a single synchronized audio timeline, with original speech, semantic anchors, six 60-frame comprehension holds, and final 90-frame hold.
- SHOT 01–05 original Director locks, media and audio remain untouched.

## Non-negotiable publishing and review rule

**Do not publish separate C01–C07 video reviews or voice-only videos for this sign-off.** The Director wants one contiguous shot video containing original audio and matching motion. Reuse this exact verified MP4 for the final combined review. Do not call text-to-speech again, add new audio layers, split the MP4 into seven files, or rebuild the video merely for voice review.

Review voice qualities **in the context of the picture**: pronunciation, clarity, pace, emphasis, quiet pauses, relative audio level, alignment of spoken words and motion, and handoff. Ask for either clip-specific corrections or an explicit final `VOICE LOCK C01–C07`.

## MediaOS synchronization boundary

**Source-of-truth status:** `DIRECTOR_VIDEO_LOCKED_V3` and `FINAL_DIRECTOR_VOICE_APPROVAL_PENDING`. The published artifact is a 720p review render released through GitHub Actions. It is not proof that the MediaOS database `visual_shot_lock` contains this render. The native MediaOS `/api/v1/visual/lock` endpoint requires an exact current native render ID and successful post-render QA (including 1920×1080 output), while Railway deployments have been skipped. Do not mark an older or different MediaOS render as the locked v3. Only synchronize a matching native video after its proper checks; never silently overwrite prior locked shots.

## Director-approved layout details

- No overlap between LOGIN REQUEST label and LOAD BALANCER card.
- No ZONE B header / Instance B card overlap.
- Enhanced Auth Service instance cards and Load Balancer details.
- Original green canonical login request preserved and distinct from example packets; Round Robin, hash-key, health probe and Auth Service handoff still follow the original synchronized voice.
