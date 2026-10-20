# SHOT 06 — Voice Agent HEAR/SEE activation completed

**Director issue:** Voice Agent still displayed `ALL IMPORTED SHOTS LOCKED` and `SHOT 06 — AWAITING HEAR / SEE CONTRACT`, even after the seven Director v3 voice narration overrides were imported into the live Voice Agent database.

**Root cause:** The frontend derives its visible shot selection from the active `episode_production_contract` HEAR/SEE timeline, not all rows in `voice_clip_workflow`. The active contract contained SHOT 01–05 only. Consequently SHOT 06 voice clips already existed correctly but had no visible tab.

**Resolution completed:** Imported exactly seven SHOT 06 canonical HEAR/SEE segments using existing live `POST /api/v1/production-contract/import` API. The original locked Script v3 timeline has seven SHOT 06 slots at production absolute seconds 394–474; the import used the original canonical `hear` to satisfy strict contract validation. This **does not** replace the Director v3 voice script: the exact Director-approved narration remains in `voice_clip_workflow.director_narration_override` and is what the TTS voice generator reads, as confirmed by seven effective narration comparisons after activation.

**Successful live QA:** https://github.com/stefanVasilev17/media-os/actions/runs/39488172217

**Data validation:**
- Existing SHOT01–05 contract entries retained unchanged, all five Director-LOCKED renders and all prior voice clip texts, approvals, generation revisions, directions unchanged.
- Seven SHOT06 C01–C07 effective Director v3 narration overrides unchanged and ready for ElevenLabs, no TTS credits spent, no generated or approved SHOT06 voice audio.
- Active production contract now has 34 blocks (27 prior + 7 new SHOT 06).
- The current legacy HEAR/SEE SHOT06 block timestamps (394–474) and old `hear` wording are ONLY the original LOCKED-script compatibility layer. Never voice-generate from that `hear` or force the Director v3 audio into 80 seconds. The effective Voice Agent text is Director v3, and final timeline is aligned after audio approval.

**Next:** Director reloads Voice Agent, selects SHOT 06 and generates C01–C07 from effective approved v3 texts. Final clean LB animation remains under review and must be timed to actual approved voice.

**Implementation instruction:** A scoped voice narration import alone is insufficient to activate an absent shot in Voice Agent; every new shot also needs an active HEAR/SEE contract with matching canonical segment IDs and ranges. Always verify the Voice Agent shot tab and TTS-ready clip count after import.
