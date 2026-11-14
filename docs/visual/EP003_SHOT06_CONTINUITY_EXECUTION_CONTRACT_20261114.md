# EP003 SHOT06 — Correctness Before Speed (Director Candidate V1)
Date: 2026-11-14. **Production state: SHOT01–SHOT05 Director-LOCKED; SHOT06 NOT LOCKED.**

## Exact approved predecessor
SHOT05 V1 MP4 UUID `04b9f55a-7705-4f23-b9f7-a0103e8c955b`, source SHA-256 `9520b347778413b3a4e9cbeed8eda513102c9f03eecf423638a4406d88841d62`, 3001 frames at 1920×1080 / 30fps. SHOT06 **frame 0 is the actual decoded SHOT05 frame 3000**, with byte-pinned source verification; SHOT06 frame 1 continues the same Living Architecture World. SHOT05 worldStartFrame 24852 → last frame world tick 27852; SHOT06 starts world tick **27852**, never reset to tick 0. Remotion scene `Shot06CorrectnessBeforeSpeedV1.tsx` retains the exact same background, camera transform `translate3d(-7px,0,0) scale(1.007)`, `Shot07CleanArchitectureWorld` props, two cylindrical replicas, source coordinates and query topology.

## Motion phase and display state must never jump at shot boundary
- Existing replicated-flow particle cubic Bezier phase uses `age=3080-1+3841-1+3001-1+shot06Frame-1199`; particles must remain on the actual replication line.
- Existing Auth query-path dash offset `-(3080+3841-1+3001-1+shot06Frame)*.74`.
- At frame zero inherited header: `THE REPLICA GIVES A WRONG ANSWER`; inherited labels: `PRIMARY STATUS: LOCKED` and `REPLICA A: MAY CATCH UP`. New header `CORRECTNESS BEFORE SPEED` fades in only with the authentic spoken `FASTEST` cue; do not use a clock-only cut.
- Never add a secondary container over any existing architecture node, free-floating Login request dots, unsupported connection lines, camera reset, frozen cover, clipped callout text, or UI presentation slide.

## Director-selected voice and semantics
Source-of-truth script `SHOT06 — Correctness Before Speed` in `backend/src/main/resources/ep003-director-locked-voice-package-v1.json` (v0.4, no rewrites). Original selected ElevenLabs Slow Natural Take `ff8ed53c-f405-43d5-82d9-33cac97cd811`, verified from MediaOS, duration **117.52s**, lead-in 60 frames, intended actual render **3601 frames**. Choreography triggers are 22 *real* word-level alignment cues, not guessed timestamps. Narration is NEVER auto-regenerated.

Primary security read must use information with guarantees required by the security policy; replica version checking is an alternate design pattern, not a demonstrated universal capability. Inability to verify account state may cause fail-closed rejection. Show trade-offs of waiting (latency), Primary fallback (bottleneck pressure) and rejection (availability), never imply using Primary alone gives full consistency guarantees.

## Director visual QA
Single measured teaching-card lane at left 560, top 771, width 320–900, height 133; deterministic `shot10TextWidth`, no nested boxes, 16:9 safe area. Colors navy/cyan/mint/amber. All eight design callouts map to real narration. P0 QA gates: selected original script + voice, immutable SHOT05 source SHA, actual first-frame PSNR >=27 dB, 23-step moving-frame continuity check, real H264/AAC 1080p 30fps, no free-moving request particle, content-fit/no collisions.

Official latest Full Video contains exactly five locked shots (15879 frames, 8:49.30) and only ONE latest master player in MediaOS. A six-shot combined film is **WIP ONLY** until the Director explicitly locks SHOT06. Six-shot WIP, once created, should run stream-copy and verify all FIVE actual encoded joins with source pixel identity >=50 dB. If Director locks SHOT06, update immutable manifest, then emit new official master. Next SHOT07 must inherit SHOT06 actual locked last decoded frame and fully continuous animation phase.
