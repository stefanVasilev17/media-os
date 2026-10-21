# EP001 SHOT 06 — Director v4 +1.5s opening animation — review candidate

**Director change request (2026-10-21):** "Само една корекция - искам още секунда и половина за началната анимация на load balancer преди да влезем в екрана му."

**Implemented:** `LoadBalancerYoutubePreview.tsx` uses exactly `INTRO_EXTRA_FRAMES=45` at 30 FPS to delay entering the internal Load Balancer panel from the opening map by +1.500s. Entrance tween and navigation fade-in are delayed by 45 frames; on-map opening camera motion and route traffic animation are extended smoothly. No frozen filler; no other shot animation changes.

**Source commit:** `331bacf40fb74a0304ef266560cbd950c01acfb3`

**GitHub Action:** https://github.com/stefanVasilev17/media-os/actions/runs/39608796667 — SUCCESS, full 171-second H.264/AAC render and QA.

**Review-only Release:** https://github.com/stefanVasilev17/media-os/releases/tag/shot06-director-v4-extended-intro-2026-10-21

**Exact video:** https://github.com/stefanVasilev17/media-os/releases/download/shot06-director-v4-extended-intro-2026-10-21/SHOT06_LoadBalancer_Director_v4_IntroPlus1p5s.mp4

**MP4 SHA-256:** `d3284946ef524bb33b6576a0f44ec849119cb23531caa413bf93467657a29842`, 12,687,410 bytes.

## Immutable constraints verified

- 5137 frames; 171.243 seconds; 1280x720, 30 FPS.
- Same seven approved C01–C07 audio clips, same audio source URLs, timestamps and six comprehension holds as Director v3; `shot06-director-v4-props.json` and `shot06-director-v3-props.json` compare *exactly identical*.
- Independently decoded AAC waveform MD5 in v3 and v4 is *exactly the same*: `31735113f53d5989a0fc7bbdeae6fc10`.
- Visual QA sampled t=4 sec (still on full architecture map with glowing Load Balancer route) and t=6 sec (complete internal panel).
- `LOGIN REQUEST`, `ZONE B`, Auth cards, label spacing and all previous Director v3 corrections preserved.
- SHOT 01–05 remain Director LOCKED and untouched.
- **v3 remains Director VIDEO LOCKED**. v4 is a focused Director correction candidate, **not yet separately locked** until Director approves the timing; final voice sign-off remains pending.
- Do not change native MediaOS locked render pointer to an unrelated old render. GitHub release stands separately from MediaOS-native QA/lock while Railway deployments are skipped.

## Director next action

Review the one full 2:51 v4 video with original sound; either approve v4 entrance timing (then promote the Director locked reference) or request another precise visual correction. Do not generate new voice.
