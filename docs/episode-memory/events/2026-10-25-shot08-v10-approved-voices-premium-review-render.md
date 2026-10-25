# EP001 — SHOT08 v10 original Director-approved voice — Director Review (2026-10-25)

**Status:** v10 isolated voice-synced MP4 READY; native/Director creative LOCK **NOT** applied. Does not alter SHOT01–07 or cumulative 7-shot preview.

## Original Director-approved voice assets preserved
- Using script revision 3 `SHOT 08-C01`, `SHOT 08-C02`, `SHOT 08-C03`, `SHOT 08-C04`, all `approved=true`, `generated=true`, ElevenLabs `eleven_v4`. **No new voice, no voice text edits, no old audio overwritten.**
- Durations: 31.621s, 32.42s, 55.701s, 31.7s. Timeline starts frame 18, 982, 1972, 3659 at 30fps; 4690 total frames (156.333s). Word alignment inspected: matching account during C01, stored verifier in C02, salt/how hashes differ + work-factor in C03, return to Auth Service in C04.
- v8 approved lookup visual retained and expanded to three-premium-stage story: database lookup → protected credential representation + password KDF/salt/work factor → returned account data and waiting Auth Service.
- `remotion-engine/src/episodes/ep001/live-diagram/Shot08ApprovedVoiceV10.tsx` commit `d7d50944d50785e5e2bd83f6cf61e5465d625662`. Subsequent Remotion root and backend registration commits `41a1f6d11296f2080eeddce4f2f7f9f1dbe8b5d1` and `d2a92b363bb78d126653158ed9ecfa4b1a3bf042`.

## Video result
- Canonical **v10 director-review render**: `7f6a7858-ba77-4e21-aea7-d7a678886c97`
- Video: https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/7f6a7858-ba77-4e21-aea7-d7a678886c97/video
- Composition: `EP001-Shot08-DirectorVoiceV10`
- Status `READY`, 4690 frames, 30fps, 1280×720 FAST_PREVIEW, MP4 file 11,120,529 bytes (finalized 2026-10-25T08:04:50Z).
- HTTP partial content `206`, MP4 header `ftyp`, `Content-Type: video/mp4`; independently downloaded and tested.
- Media streams: H264 video + AAC stereo 48kHz audio. Voice RMS evidence at 10s=0.05859, 40s=0.04672, 70s=0.05754, 100s=0.04056, 140s=0.07418 (not silent).
- Inspected encoded video still frames at 0, 23, 29, 35, 53, 71, 79, 82, 85, 89, 96, 99, 100, 103, 113, 115, 129, 145, 153 seconds.
- **v9 defect corrected:** hash/salt/cost and attack-panel typography no longer paints visibly on top of subsequent diagram text at 82s or 100s. Crossfades include an intentional short near-empty stage (~99s); Director to evaluate pacing and continuity. Keep the review candidate **NOT LOCKED**.
- Native MediaOS original SHOT01–07 guard `true`: all 7 `locked=true` + `qaStatus=PASS` + unchanged `lockedRenderId`. Existing cumulative approved preview ID `1fcb24e2-99bc-4e97-85f1-cbafcfc4e94c` unaffected.
- Existing v9 `5a598032-ff94-4396-8dcb-3da6b124e732` remains historical first voice candidate with text ghosting; present v10 for Director review, not v9.
