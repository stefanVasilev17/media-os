# EP001 SHOT 06 — FINAL DIRECTOR LOCK — 2026-10-21

## Explicit Director approval

Director's exact decision, after reviewing the **one full video with all seven original voices** and the extended Load Balancer map opening:

> "Готови сме. LOCK!!! Не забравяй след като railway оправят проблема си да пушнем тези промени."

**Status: `SHOT06_DIRECTOR_VIDEO_LOCKED_V5` and `SHOT06_DIRECTOR_VOICE_LOCKED_C01_C07`.** The approved visual timing and original seven audio clips are final. No further changes, rebuilding of narration or speculative improvements without explicit Director unlock.

## The exact reviewed-and-LOCKED video

- **Director-reviewed source-of-truth:** `SHOT06_v5_LongMapOpening_7p5_to_9p5_FULL_WITH_SOUND.mp4` (local review upload; not to be conflated with a different GitHub/Remotion encoding).
- **SHA-256 of exact reviewed MP4:** `6e96f65d27a1dfd0ea3e6dde2343c444af81900d6dc4c324c6ab78ff361a3e57`
- **Size:** `10,518,165` bytes; `171.243` sec; 1280×720; 30 FPS; H.264 + AAC stereo.
- **AAC audio stream SHA-256:** `676f4c81e4922e728516b3941c0fa0d9b6a71d00453b7d3841d4c2d136ae706b`. This is **bit-for-bit identical to the AAC stream of v3**, verified independently on 2026-10-21. The seven original C01–C07 voices, clip order, spoken words, timing and pauses were preserved.
- Mobile review encoding: `SHOT06_v5_MOBILE_NewMapHold_7p5sec_WITH_SOUND.mp4` SHA-256 `001d821f9449328fbe0a5cec5068c2317bdabcd6a7346942f05528f33a83be8a`; this is a derived preview, not the full-quality reference.
- Director-approved opening: **the living architecture map remains unobstructed until 7.5s (frame 225); screen reveal is from 7.5s to 9.5s (frames 225–285); detailed Load Balancer panel is visible at 10s.**
- All previous layout corrections (LOGIN REQUEST label, ZONE B spacing, server boxes, routing/health visuals) remain intact.
- SHOT 01–05: **Director LOCKED and immutable**.

## Canonical Remotion implementation already committed to GitHub

- Repo: `stefanVasilev17/media-os`, branch `main`.
- Scene source: `remotion-engine/src/episodes/ep001/live-diagram/LoadBalancerYoutubePreview.tsx`
- Relevant implemented code: `PANEL_REVEAL_START=225`, `PANEL_REVEAL_END=285`; `panelIn=ease(frame,PANEL_REVEAL_START,PANEL_REVEAL_END)`; adjust openingCamera/nav/route motion accordingly.
- Implementation commit: `4ad9ebc9ec8f073f83dc8917a1392f46bf8e8512`.
- Latest known HEAD before this handoff: `4e82638f8b70ad73d22b13eca127c03f53d3b75e` (v5 workflow change). Later docs commits do not change the visual scene.
- Related Remotion v5 GitHub-release build: https://github.com/stefanVasilev17/media-os/releases/tag/shot06-director-v5-map-hold-2026-10-21. **Important:** the Remotion GitHub release artifact SHA-256 is `37e423ac1bc8f399c877b344868c61f4327c05d66f4770c17f8e7b4077880c69`, i.e. **not byte-identical to the actual Director-reviewed full-quality file above**. Do not silently substitute one for the other under an exact-artifact lock. The corresponding design/timing is intended to match; visual/QA comparison is still required when completing the MediaOS-native render.

## RAILWAY DEPLOYMENT HANDOFF — MUST NOT BE LOST

**State on 2026-10-21:** Railway `production` keeps SKIPPING new builds for both `media-os-backend` and `media-os-render-worker`. Their last live successful deployments are from 2026-10-20. Railway reports `Deploys have been paused temporarily`. **GitHub changes are ALREADY PUSHED to `main`.** The pending task is a **fresh deployment of latest main** to both production services, not a git push and not a Redeploy that reuses the old image.

Railway project: `a2b47ba1-385e-4410-93ee-b2198492b724`. Production environment: `ffce6002-aa51-4a11-a23f-73c9a05d3cb1`.
- Backend service: `d28a8117-8fe2-4e9d-93ee-b2198492b724`? **NO:** exact backend service ID is `d28a8117-8fe2-4e9d-93ee-ebf936d053b9`.
- Remotion worker service ID: `e78e8e8d-9ad7-4307-aae0-e08037c30134`.
- Postgres volume must be preserved; do not redeploy/recreate Postgres, wipe tables, or change locked SHOT 01–05 artifacts.

**Upon Railway build recovery, directed and manually approved deployment:**
1. Recheck Railway build eligibility and `main` CI status. Do **not** turn on recurring Railway monitoring: the Director explicitly requested no monitoring earlier; an automation was disabled.
2. Trigger **new deployments from latest GitHub `main`** for both backend and render worker (not reuse an old cached build). Inspect logs and `/actuator/health`, confirm both deployments finish `SUCCESS` and run the expected source commit.
3. Verify SHOT 06 v5 with extended map-hold appears as a **single playable full video with all seven voices** in the intended MediaOS review surface; do not leave a link to an asset that is not served.
4. Produce/register native render of **this visual design and original approved seven voices**. MediaOS `/api/v1/visual/lock` requires a native render ID and passing post-render QA at 1920×1080. Verify this native video against Director-approved v5 before applying the already-granted Director lock to that **exact render**; never lock an older v3/v4 MediaOS render. If the native render differs materially from Director-reviewed v5, do not auto-approve it; request a visual review.
5. Rebuild cumulative preview with SHOT 01–06 only after native v5 QA PASS. Check seven voices, full duration, preview playback, protected SHOT01–05, and document completion.

**Director instructions:** No further monitoring/automation is authorized. This GitHub handoff and the corresponding open issue are durable reminders for the next session; they do not mean the assistant will work autonomously after this chat.

## Approval and locking semantics

The Director approved both the revised opening and the already-preserved original C01–C07 voices by saying LOCK after watching the combined full v5 video. **Final Director approval is recorded here as a production decision**. A native `visual_shot_lock` database row may not exist yet for the approved v5 version because production deployments and native render QA are pending. Never conflate these states.
