# MediaOS EP002 SHOT01 — EP001 Visual Continuity Pass v2

**Date:** 2026-11-04 (Europe/Sofia)
**Status:** Director-requested code candidate, not Director visually accepted until a real new preview is watched.
**Source:** Director feedback after playable EP002 SHOT01 Take 2 preview: pacing/voice workable; current scene too visually simple and not sufficiently continuous with EP001. The original approved EP002 Visual Pass v1.0 is unchanged.
**Scope:** `remotion-engine/src/episodes/ep002/Shot01LoginWaiting.tsx` only. Preserve the registered `EP002-SHOT01-DRAFT`, existing backend render contract, real Five ElevenLabs character cue frames, selected Take 2 and all protected EP001 sources.

## Identity: do not approximate EP001 with generic SVG cards

Use exact existing locked-source exports from `remotion-engine/src/components/architectural-thinking`:
- `ATBackground` and `ATControlledRealismLayer` for the EP001 dark living-world atmosphere.
- `ATPhone` for the actual EP001 premium login UI, metal bezel, glass, fields, pressed button, waiting spinner and established colors.
- `ATCameraRig` for a continuous world coordinate system and voice-driven camera focus.
- `ATBackendNode` for the familiar Auth service visual family and extremely dim contextual API Gateway / Load Balancer silhouettes.

The previous EP002 v1 source constructed a new flat Phone and Auth from primitive SVG rectangles. That is intentionally replaced for this v2 pass. No edits were made to imported LOCKED EP001 component source.

## Five source-matched beats

| Voice cue | Selected Take 2 start frame (confirmed Director screenshot) | Visual change |
|---|---:|---|
| `tap Login` | 8 | One tactile EP001 Phone press; existing spinner becomes unresolved and stays alive |
| `A few seconds pass. Then ten` | 146 | Minimal local amber time rail near Phone, no claim of actual measured backend processing time |
| `server … still running` | 386 | Same-space camera drift toward familiar Auth node; two small green shallow-probe PASS labels |
| `your login is still waiting` | 620 | Camera restores focus to still-waiting Phone; healthy Auth remains dim in same view |
| `go back to nine o’clock` | 937 | Time rail retracts, `09:00` rewind marker appears; subtle reverse camera move prepares SHOT02 |

At runtime, all five beat start frames come from `beatStartFrames` passed by the existing Remotion worker from the selected take alignment. The table documents observed Director screenshot values, not constants baked into code. Provisional fallback only applies when the existing adapter fails to provide five valid frames and is not labeled measured timing. Measured Take 2 voice duration from Director screenshots: 32.640s / 980 frames at 30fps. Original editorial target 40s is not used as an excuse to stretch audio.

## Causal and art-direction guardrails

- One persistent world: Phone foreground left, dim Gateway and Load Balancer silhouettes in the middle, Auth deep right. No flat replacement panels, abrupt scene swaps, full-map reveal, success state or premature login error.
- Connected paths are subtle *architecture context*, not proof that the user’s request traveled or completed. No fabricated processing throughput or time duration.
- Identity colors: dark navy `#010711`, Phone teal/cyan, Auth purple/violet, confirmed shallow healthy state mint green, wait/rewind restrained amber. Dim inactive middle nodes in blue-gray.
- The shallow green labels must include `Liveness: PASS` and `Readiness: PASS`, with local qualifier `ILLUSTRATIVE SHALLOW HEALTH PROBES`. They do not mean login is end-to-end healthy.
- Phone button must never show `Please try again` before SHOT06. Spinner remains unresolved through end; prepare a continuous rewind into SHOT02.
- Avoid large presentation titles, fake metrics, gratuitous particles, arbitrary camera loops, isolated slides, additional paid ElevenLabs requests and any changes to EP001.
- Motion remains deterministic and derived from Remotion frame number and recorded speech cues. Only one SHOT is changed; prior render lineage must remain in the database for comparison.

## Director review gate

1. Confirm build: Node syntax and token tests; TypeScript preflight zero **new** errors (one documented EP001 diagnostic is pre-existing); Remotion bundle success. GitHub Actions stay disabled.
2. Release worker from the tested branch commit through the existing Railway service, no new permanent QA project. Do not call ElevenLabs or render automatically.
3. In MediaOS, refresh EP002 SHOT01 and confirm preferred Take 2 + five REAL ElevenLabs timestamps. Click **Create voice-synced preview** once, explicitly accepting Railway CPU use.
4. Watch and listen to the completed MP4. Check actual EP001 component fidelity, phone framing, world depth, cue synchronization, clear shallow-probe semantics, camera/reverse movement, readable labels and no clipping at 1280×720 preview or 1920×1080 source. Report Director changes. Do not mark this visual pass locked or Stage 3 visually accepted without Director confirmation.

## Narrator continuity — tracked separately

The current preference is **preserve Take 2** while solving visual continuity. EP001 identity guard checks Voice ID + Model ID, but an A/B comparison against the actual final EP001 narration is still needed for accent, diction and pacing. The EP001 runtime notes do **not** prove that the current EP002 numeric stability/similarity settings reproduce the published EP001 acoustic performance. No regeneration/forced alignment is authorized by this v2 visual pass.
