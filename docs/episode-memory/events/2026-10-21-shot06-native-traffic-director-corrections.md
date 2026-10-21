# EP001 SHOT06 — Director Visual Corrections: Native Traffic, Round Robin and Clean Handoff

**Date:** 2026-10-21. **Status:** Implemented in Remotion source, awaiting Director MP4 review. NOT VISUAL LOCKED.

Director explicitly rejected the preceding SHOT 06 preview as too static/basic. Five exact corrections:

1. The **native original Load Balancer card** on the Living Architecture Map must contain detailed animated multi-colored cyan/blue/violet/mint packet dashes along its own ingress and three branches. The green connection from API Gateway terminates exactly at the balancer entry; do not draw a straight green line visually passing through the balancer and directly to Auth Service.
2. Persistent left navigation uses **Round Robin**, not **Route Mode**. It never unmounts or reappears between subtopics. Only central focus and navigation highlight transition.
3. Interior three-instance diagram must have clearly animated examples with differentiated diagnostic colors and deliberate sequential motion, not static lines or generic cards. One canonical green login request remains distinct from blue examples and amber health probes.
4. Contain all text within each frame/card. Revised Auth instance dimensions, font sizes, status placement and responsive SVG scaling must prevent overflow, including Zone B near lower boundary. Do not add noisy microtext.
5. On exit, a selected **healthy Instance B** sends the green request through the Load Balancer and onward to the original Auth Service. Secondary blue/cyan dashes can illustrate activity from eligible instances; unhealthy Instance C must not emit packets. Animate the handoff continuously, never flash the UI or jump back to Round Robin.

**Implementation commits:** native animated SVG `0723d7c4`, continuous green inlet and Auth handoff `7f4e7adb`, native prop plumbing `a516485b`, contained cards/labels `3c463975`, detailed interior flowing event dashes `88dbe59d`, original map opt-in motion `645e6950`, native one-packet continuity `51416877`, exact incoming streaks `a06dc32f`.

**Safety invariants:** Remotion original-map extensions all opt-in. All Director-LOCKED SHOT 01–05 outputs and seven approved SHOT 06 ElevenLabs voice clips untouched. Six 60-frame comprehension holds + 90-frame ending hold. SHOT 06 is NOT locked until Director approves corrected preview. Final 1080p master follows director acceptance.

**Render environment blocker:** Railway temporarily refuses GitHub deployments with `Deploys have been paused temporarily`, so the existing MediaOS render-worker binary cannot yet load these changed files. A GitHub Actions fallback workflow `.github/workflows/shot06-director-v2-github-video-render.yml` performs the full voice-synced render from current GitHub source, independently validates metadata and sampled frames, and uploads Director-only MP4 to a clearly labeled prerelease and workflow artifact. This is a fallback distribution, not a MediaOS canonical visual lock. Sync new code to Railway when deployments resume; do not claim MediaOS render updated before then.
