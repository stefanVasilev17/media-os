# EP001 — Sound Design V1 — Technical QA Passed / Director Review Pending

**Date:** 2026-10-27, Europe/Sofia.

**Status:** Separate **UNLOCKED** sound-design review candidate. **The previously Director-LOCKED Audio Master and all 12 original shot masters remain immutable.** User asked to start the next Sound Design production phase; that is **not** an approval/LOCK of the resulting mix or of the full episode.

## Exact candidate and immutable source

- Source **Director-LOCKED Audio Master** UUID: `96699a27-7615-4ce1-a092-53cdf1e9d1af` (−16.31 LUFS, −1.76 dBTP). Source availability preflight: READY, HTTP 200, 94,183,474 bytes via both public and Railway-internal URLs.
- **New derived Sound Design V1** UUID: `904b3075-c5ee-49a3-9d3b-7d4a36f8fbf8`.
- MP4: https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/904b3075-c5ee-49a3-9d3b-7d4a36f8fbf8/video
- Worker log: `Completed cumulative preview 904b3075-c5ee-49a3-9d3b-7d4a36f8fbf8: 94164846 bytes`.
- Final artifact: 1920×1080 H264/AAC, 30fps, 37,703 frames, 1256.766667 seconds (20:56.767), 94,164,846 bytes.
- Engine implementation: `remotion-engine/cpu-worker.mjs`, commits `a8259ef5e36857147e332d787a400fd325b891d6` → `921992a3e39f895be508290572148e223056d325` → `a7c978c5d5a568439c07de20cb40a0c933994ac9`. Source URL restricted to the exact locked UUID; Railway backend internal URL aliases the public source; first external-URL submission was intentionally rejected by guard, second submission passed after source length/identity preflight.

## Sound design philosophy

Consistent with Architectural Thinking Core Production Bible v2.3: *technical, restrained, documentary*. Silence is useful; do not make architecture sound like a video game. Accordingly **no music bed**, no copyright-dependent asset, and no change to source voice cadence/approved narration.

Nine original synthesized tonal accents plus four quiet airy textures:

| Episode timestamp | Meaning | Sonic intent |
|---|---|---|
| 02:55.000 | request assembly / dispatch | quiet travel activation |
| 03:38.400 | DNS resolution completed | short restrained resolution cue |
| 04:46.200 | API gateway receives request | low dispatch marker |
| 09:06.000 | Load Balancer selection | short directional pulse |
| 11:38.000 | database account lookup | subtle lookup activity |
| 16:36.000 | credentials verified | unobtrusive affirmative accent |
| 17:47.000 | authentication state created | quiet confirmation texture |
| 19:06.000 | protected route decision | small authorization accent |
| 20:37.000 | Dashboard/private data reveal | warm resolved payoff |

Each cue has approx. 0.48–0.93s lifetime and gain ~0.014–0.022 peak before processing. Four airy original PCM textures accompany request/movement cues. Implementation uses a deterministic sparse mono 48kHz 16-bit PCM cue track mixed into original locked master; `-c:v copy` preserves the original video bitstream. Original ElevenLabs voice was not regenerated; voice is re-encoded **only in this separate sound-design derivative**, preserving original source and timing. No cues are placed in the Network/Transit 04:36.400–04:38.400 pause or the ~6.8-second SHOT10 silence.

## Independent technical QA

Source: direct MediaOS MP4 range read and FFmpeg EBU-R128 measurement from new **actual rendered** MP4 (not just configured target values).

- Video MP4 `stsz` = 37,703 samples, `stts` = 37,703 samples; **30.000fps** and **1256.7666667 seconds** exact. PASS.
- AAC MP4 audio: 58,932 samples, **1256.788 seconds** (21.3 milliseconds AAC encoder tail), PASS.
- Actual post-render loudness: **−16.32 LUFS integrated**, **−1.78 dBTP true peak**, **4.30 LU loudness range**. PASS; reference Director-LOCKED Audio Master: −16.31 LUFS / −1.76 dBTP. New sound layer did not materially disturb broadcast mix.
- Spot-checked output audio near 03:38, 09:06, 16:36, 20:37 and planned silent passage 17:29; silence sample at 17:29 registered −91.0 dBFS. Presence of MP4 audio is verified; listening-quality and musical perception must be reviewed by Director.
- **No claim** of frame-by-frame, every-SFX audible-quality or clip boundary subjective review. Cue timestamps are initial editorial hypotheses for approval; if sound does not coincide with the true visual event during playback, adjust only derived SFX timing in a separate V2.

## Retention and Director gate

- A **provisional retention safeguard** excludes the exact Sound Design V1 review UUID from both candidate SELECT and UPDATE cleanup queries with bound parameters, commit `67cc8dfaba569c0b0ac1eaa7b4de625d70cf1cc9`. This is preservation for review, **not** creative approval. Confirm successful Railway backend deployment before calling the guard live.
- Future Sound Design revisions must not rewrite locked `96699a27...`; render independent variants.
- **Next:** Director listens to SFX under narration and checks event sync, loudness and any overly electronic effects; explicitly approves or requests changes. Then YouTube thumbnail/title, metadata, captions and at least three Shorts. **FULL EP001 DIRECTOR LOCK is still pending.**
