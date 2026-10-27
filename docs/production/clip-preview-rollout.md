# MediaOS bounded CLIP_PREVIEW design

CLIP_PREVIEW is a new explicit opt-in render profile for a 960×540 video covering only a selected part of a Remotion composition. It is independent of DRAFT / FAST_PREVIEW / REVIEW and will not displace an existing full-scene latest preview. No approved MP4, LOCKED source, or full-scene behavior is modified.

POST /api/v1/remotion/renders/compositions/{compositionId}

Request example:

    {
      "profile": "CLIP_PREVIEW",
      "startFrame": 240,
      "endFrame": 389,
      "inputProps": {"showGuides": false}
    }

Ranges are zero-based and inclusive. The example renders 150 frames, or 5 seconds at 30 FPS, from 00:08.000 to just before 00:13.000. Both fields must be present; start must be >=0; end must be less than the source composition's total duration. Maximum clip is 30 seconds (900 frames). The source composition's full duration is not shortened: absolute `useCurrentFrame()` values and motion timing are preserved via Remotion `frameRange`.

The backend injects a reserved `__mediaOsClipRange` map into stored input props; it is included in the render hash, ensuring clips from different frame ranges do not share MP4s. Clients cannot directly supply the reserved key. Worker strips metadata before passing props to the composition, validates bounds again, and uses the original composition duration. The API response returns the real output `durationInFrames` and `durationMs`, while exposing `sourceDurationInFrames`, `startFrame`, and `endFrame` for clips.

For compatibility and sound safety, `EP001-Voice-CurrentPreview` (FFmpeg cumulative assembler) and `EP001-Shot10-SessionCreationShortV6` (special 72-second soundtrack postprocessing) are excluded until a dedicated audio-range design is approved. Standard composition audio still needs listening QA for nonzero start offsets. No full-episode recompilation should be triggered just to review 5 seconds, and CLIP_PREVIEW should not be used as a final Director-LOCKed artifact.

The implementation is a stacked Draft PR based on PR #97. No production deployment is authorized by this PR alone. Before merging: check Java/JS unit tests, 10-second clip at a nonzero start frame, frame count and duration via ffprobe, unchanged FAST_PREVIEW output, backend latest(profile=FAST_PREVIEW), and rollback instructions. GitHub Actions remain disabled.
