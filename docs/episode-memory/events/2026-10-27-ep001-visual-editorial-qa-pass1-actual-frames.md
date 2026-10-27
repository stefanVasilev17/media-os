# EP001 — Final Visual & Editorial QA — Pass 1 (actual MP4 frame review)

Date: 2026-10-27. **Director composite remains UNLOCKED.** The individual SHOT 01–12 source masters remain Director LOCKED. This is an evidence-driven review of the previously technical-passing composite, not final human creative approval.

## Exact analyzed source
- Full EP001 derived master reviewed: `08fbfdb5-58a8-40bf-b7ed-cc33742750fe`, 115,654,047 bytes, 1920×1080, exact 37,703 video frames, 30fps, 20:56.7667, AAC narration. Original technical atom-level CFR QA passed.
- Used a read-only Railway Function with `ffmpeg-static` to download **that exact original MP4** and extract 36 time-stamped sample frames in three 12-frame contact sheets, plus four large targeted stills at 03:38, 03:43, 07:55 and 11:40. No renders modified during frame review.
- Actual frames confirmed the beginning, Network/Transit → API Gateway, Load Balancer, Auth Service, Database, successful verification, Authentication State, Route Decision, Protected API and final Dashboard/recap are present.
- These are sampled stills; do not claim continuous-motion/frame-by-frame inspection or exact visual synchronization for every second.

## Issue VQA-001 — P1 / BLOCKER for Final LOCK: DNS HUD caption clipped
At approx. **03:38–03:43 (absolute episode time 218–223 seconds)** the line `DNS lookup complete · destination found` is visibly clipped by the frame's lower edge. This reproduces Director's prior concern. Existing derived `NetworkTransitFinalPolish.tsx` placed the caption inside the zooming `ATCameraRig` at local `top:784`, causing camera zoom to push the label below the visible region.
**Fix implemented, final render verification pending:** isolated new component `remotion-engine/src/episodes/ep001/live-diagram/NetworkTransitScreenSafePolish.tsx` (commit `d3a2773ca78393bb631d5af2e470bf66bddc182b`). The DNS caption is a camera-independent 1080p HUD, centered, bottom 158px, width 830px, font size 28 with solid backdrop. Secondary cache / latency notes are also positioned within frame. `FinalPolishSourceShots.tsx` switches SHOT04 derivative to this component in commit `caef37dcd53e64fb353a951e7beae5ef9f83aa21`. Wait for Railway worker image deploying `caef37...`, rerender **new derivative** SHOT04 (2601 frames) and validate actual still at 218–223 seconds before final aggregate revision. Do NOT alter old Director-LOCKED SHOT04 or older full aggregate source.

## Audio / editorial metrics (read-only from actual full MP4)
- Integrated loudness **-22.32 LUFS** (FFmpeg EBU R128 loudnorm measurement input_i).
- Maximum true peak **-3.54 dBTP**, loudness range **5.00 LU**. No reported full-film true peak overload.
- Between **04:15–04:36**, speech/audio is present: mean volume -24.8 dBFS, maximum -4.0 dBFS.
- **Audio mastering action**: current mix is quieter than the proposed documentary publishing target approx. **-16 LUFS integrated**, **true peak at or below -1.5 dBTP**; perform a separate transparent audio master after visual issues are fixed, compare perceived clarity and any SFX/music. Do not edit or regenerate the approved source voice clips. -16/-1.5 are proposal targets, not claimed mandatory YouTube standards.

## Visual editorial observations (sampled frames)
- **PASS sampled stills**: SHOT06 green LOGIN REQUEST appears above the balancer; Hash Key is within its UI control at 07:55. SHOT07 Submitted and Account facts needed cards are legible in 11:40 still, USER LOOKUP CREATED appears centered below the pair. SHOT08 Account/database views, SHOT09 Identity Verified, SHOT10/11 authentication/route decisions, SHOT12 Dashboard and proof path appear in final frames. The final recap does not cut to a blank frame at 20:54.
- **WATCH, not conclusively a defect**: the broad Architecture Map is held prominently around 04:16–04:36, immediately before the explicitly requested 2-second freeze at 04:36.4–04:38.4; verify editorial pace and whether the continuing narration benefits from stronger camera activity. Independent sampled frame hashes vary across 255/260/266/273 seconds, so do NOT claim pixel-perfect static video for that whole stretch.
- **NOT YET VERIFIED**: continuous non-teleport movement of green dot between Auth and User DB (needs viewing moving frames, not 1 still), every clip-to-clip perceived pacing cut, all readable text over their full animated life, audio dialogue intonation/sync, copyright/rights, captions.
- Two-second visual hold confirmed placed at **04:36.400–04:38.400**; holds do not constitute narration regeneration.

## Exact editorial timeline (absolute full episode)
SHOT01 00:00.000–00:53.433; SHOT02 00:53.433–02:23.900; SHOT03 02:23.900–03:09.700; SHOT04 03:09.700–04:36.400; silent 2s visual hold 04:36.400–04:38.400; SHOT05 04:38.400–06:46.133; SHOT06 06:46.133–09:37.367; SHOT07 09:37.367–12:20.100; SHOT08 12:20.100–14:56.433; SHOT09 14:56.433–17:12.767; SHOT10 17:12.767–18:24.767; SHOT11 18:24.767–19:36.767; SHOT12 19:36.767–20:56.767. Timings use exact frozen 30fps 37,703-frame manifest.

## Production gates / next actions
1. Finish Railway deployment of new screen-safe SHOT04 derived source.
2. Rerender **only** isolated corrected SHOT04 with original audio; sample actual 03:38–03:43 frames. Keep the previous render immutable for comparison.
3. Rebuild 12-shot aggregate with new SHOT04 + original approved remaining 11 derivatives, +60 frame silent hold, then CFR exact frame cap and independent H264/AAC track QA. This is a **new final review candidate**, not an automatic Director LOCK.
4. Run audio mastering as a **separate derivative**, target loudness subject to final Director listening, then produce captions, final thumbnails, chapter timestamps and Shorts.
5. Director final review of continuous play before explicit LOCK.

**Source authority**: Actual MP4 frame/audio sampling and the GitHub Remotion source paths above; prior LOCK decisions preserved unchanged.
