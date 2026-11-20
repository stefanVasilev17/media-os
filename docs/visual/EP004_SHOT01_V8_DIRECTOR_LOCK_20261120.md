# Architectural Thinking / MediaOS — EP004 SHOT01 V8 — DIRECTOR VISUAL LOCK

**Director decision:** **LOCKED** — explicitly stated in the active project conversation on **2026-11-20 (Europe/Sofia)**: “Това вече ми харесва. ЛОКВАМЕ”. This approval comes **after the Director viewed the actual finished V8 MP4**, not just a screenshot, source review, native build or a technical QA report.

## Exactly what the Director approved

| Field | Approved and immutable |
| --- | --- |
| Channel | Architectural Thinking |
| Episode | EP004 |
| SHOT | SHOT01 · Ordinary Workday |
| Visual candidate | **V8 — FINAL DIRECTOR LOCKED** |
| MediaOS composition | `EP004-SHOT01-ORDINARY-WORKDAY-V1-VISUAL` |
| **Canonical render ID** | `e8f3818e-aac0-40f2-8e1a-d70e9fa108e0` |
| **Exact approved Remotion worker source SHA** | `590448542604e8308750664354bbd8dea55a53e5` |
| Source PR | [#339 — V8 removal of internal LB green moving marker](https://github.com/stefanVasilev17/media-os/pull/339) |
| Source lineage | Native-tested EP004 production branch, merge commit `b595e81313bd2acb88a37144f12c9b5444226f1c` |
| Director approval state | **VISUAL_DIRECTOR_LOCKED** — approved by human Director |
| Frame contract | **2001 frames, 1920×1080, 30 FPS** |
| Measured duration | **66.7 seconds** |
| Final format | **H.264 / AAC MP4** |
| Reported MP4 size | **6,693,892 bytes** |
| Voice | **Original Director-approved selected voice Take**; no new TTS; real audio mux QA passed |
| Video technical gate | `ACTUAL_MP4_TECHNICAL_QA_PASS` and `EP004_SHOT01_REAL_APPROVED_TAKE_MUX_QA_PASS` |
| MP4 SHA-256 | **NOT AVAILABLE from accessible evidence** — must be measured from the actual object bytes before SHA-gated master assembly |
| Runtime lock record | **NOT YET VERIFIED in MediaOS database** — this GitHub decision is NOT a claim that `visual_shot_lock` or other runtime tables were updated |

### Actual proof

1. The existing shared Railway render worker completed **render `e8f3818e-aac0-40f2-8e1a-d70e9fa108e0`** on **2026-11-20 at 14:33:09 UTC (16:33:09 Sofia)** with **2001 frames / 66.7 seconds**, H.264/AAC, 6,693,892 bytes and source `590448542604e8308750664354bbd8dea55a53e5`. Worker produced `EP004_SHOT01_REAL_APPROVED_TAKE_MUX_QA_PASS` and `ACTUAL_MP4_TECHNICAL_QA_PASS`. The production playback endpoint returned **HTTP 206** on 2026-11-20, confirming the actual protected V8 video was streamed successfully.
2. The Director explicitly reviewed the final V8 and **LOCKED it** in conversation. This is the human visual gate that earlier worker logs intentionally left `VISUAL_DIRECTOR_REVIEW_REQUIRED`; do not confuse technical runtime status at render completion with this later, separate Director decision.
3. Prior native source verification: **23/23 EP004 regressions PASS**, **173/173 worker regressions PASS**, TypeScript preflight zero new diagnostics, factory isolation and main/factory Remotion bundling PASS. Original earlier-episode source and stable EP003 native node dimensions remain untouched.

## Immutable visual and audio scope

The **V7 escalating-tension system is accepted, with only V8’s removal of the moving green marker *inside* the Load Balancer**. Keep all other objects unchanged: Microsoft 365 below Outlook with the right-side three-dot menu fully visible; living Outlook client and reconnect attempt; coherent multi-request queue; amber degraded instance and hollow reverse diagnostic pulses; healthy #03 then healthy #02 routing after authentic HEAR→SEE cues; original EP003 Load Balancer/Gateway/Outlook Service shells, port geometry and curves; tasteful mint request particles on the *external* paths; camera movements, narrator-free motion, original selected approved voice, 8/8 beat associations, exact 2001-frame timing and last-frame continuity. **Do not remove green request dots on real external paths** — V8 removes only the internally decorative moving Load Balancer marker. Do not edit or regenerate this locked SHOT to start SHOT02.

The older V4/V5/V6/V7 candidate renders stay as historical immutable comparisons and are **NOT LOCKED**. **Only V8 render ID above is canonical.** Do not replace, silently re-render, reinterpret, relabel or overwrite the V8 MP4 or original approved voice.

## Follow-through and remaining technical gates

- **Visual creative decision is final now.** Agents and production planners must treat V8 as the frozen SHOT01 baseline. Any visual or narration change requires a new explicit Director revision/unlock, distinct approved render and preserved earlier V8.
- **MediaOS persistence is a separate integration task.** GitHub access can record the human-approved source of truth, but there is no verified authenticated MediaOS `visual_shot_lock` or equivalent runtime-write result from this chat. **Do not falsely report the DB lock or full-video UI status as completed** until verified by MediaOS. The backend `visual_shot_lock` schema requires exact (episode, script revision, shot key, render ID) and authentication/auditing; never insert guessed revisions or bypass Director authorization.
- **SHA-gated media assembly:** Verify the real approved MP4 object SHA-256, actual decoded first and last frames and immutable storage before promoting a full-episode master. As SHOT01 is the only locked EP004 SHOT, it is the approved **one-shot contiguous film prefix**; registration under MediaOS **EP004 Full Video (latest)** must be separately verified, not assumed. Do not queue a new paid render or voice generation merely to record a LOCK.
- **Begin SHOT02 after the lock.** Continue the same Living Architecture world using the **actual decoded last encoded frame of SHOT01 V8 (frame index 2000)** and uninterrupted request/route/camera state. Match the approved source/cue timeline and use narrator-free living motion rather than a static photo over multiple frames. Do not invent camera/particle state without verifying the V8 source-to-video seam and SHOT02 narration plan.
- **No infrastructure proliferation:** retain exactly the existing `media-os-backend`, `media-os-render-worker` and `Postgres` Railway production services; preserve object-storage protections, no MP4 blobs in PostgreSQL and no unauthorized CPU job.

**STATUS — DIRECTOR VISUAL LOCKED (V8).** Separate runtime DB lock acknowledgement, actual MP4 SHA-256 and optional MediaOS full-film registration remain **unverified** and must be reported accurately.
