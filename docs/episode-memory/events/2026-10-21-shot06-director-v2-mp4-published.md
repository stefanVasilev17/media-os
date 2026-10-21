# EP001 — SHOT 06 / Load Balancer — Director v2 MP4 published and technically verified

**Production status:** **VIDEO READY FOR DIRECTOR REVIEW. SHOT 06 NOT VISUAL LOCKED.**

**Source:** exact Remotion HEAD at revision `0aa83c84af84df002a088b8d210c9a2ca58dcee1` (plus workflow changes only). This revision contains the five explicit 2026-10-21 Director corrections: native map-level colored packet-dash animations, green wire ending at Load Balancer ingress, Round Robin navigation, detailed traffic bursts and healthy instance handoff, typography/zone box containment.

**Full voice-synced H.264/AAC MP4 file**:
https://github.com/stefanVasilev17/media-os/releases/download/shot06-director-v2-2026-10-21/SHOT06_LoadBalancer_Director_v2.mp4

**Director-only prerelease**:
https://github.com/stefanVasilev17/media-os/releases/tag/shot06-director-v2-2026-10-21

**Downloadable GitHub Action artifact with MP4, smoke still and approved inputProps**:
https://github.com/stefanVasilev17/media-os/actions/runs/39592721958/artifacts/12343580030

**Video facts, verified from original 12,245,045-byte file by independent GH Actions QA:**
- 1280 × 720 at 30 FPS, H.264 video and AAC audio
- 5137 frames, MP4 duration 171.243s (2m51.243s), matching expected 171.233s composition duration
- original seven separately approved ElevenLabs voice clips used unchanged, with six 60-frame comprehension holds and 90-frame final hold
- 14 representative video frames successfully decoded with ffmpeg across 8–169 seconds
- GH Actions independent verification/publishing **SUCCESS**: https://github.com/stefanVasilev17/media-os/actions/runs/39593890135

**Distribution note:** Rendered on GitHub Actions from current Remotion source because Railway automatically skipped recent deployments and reported `Deploys have been paused temporarily` on explicit source reconnect. This is the actual revised video, not an illustrative still or an old MediaOS render. **MediaOS's old render-worker service remains on the previously deployed source until Railway deployments resume.** Do not claim that the MediaOS in-app current render/episode preview has updated. Future deployment should synchronize this exact source, then optionally create and register a MediaOS-native preview. Do not replace earlier locked SHOT01–05 canonical renders or alter approved voice.

**Director review is still mandatory**: Source/build/codec and sampled frame validation cannot guarantee that every animated transition is flawless. Request explicit director corrections or LOCK decision after the user watches the whole 2:51 video.
