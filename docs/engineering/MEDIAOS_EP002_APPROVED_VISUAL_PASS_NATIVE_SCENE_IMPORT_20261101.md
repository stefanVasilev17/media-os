# EP002 — Approved Visual Pass v1.0 → Native MediaOS SCENE DRAFT

**Episode:** `EP002` — Why Login Fails Even When the Server Is Healthy  
**QA episode ID:** `95b8a4a2-728e-47fe-ad4c-a16748773588`  
**Director creative decision:** "Харесва ми! Локвд" (2026-11-01)  
**Creative approval event:** `docs/episode-memory/events/2026-11-01-ep002-visual-pass-v1-0-approval.md`  
**Original approved plan:** `docs/episode-memory/plans/2026-11-01-ep002-new-scene-visual-pass-director-review-v1-0.md`  
**Git source blob SHA:** `5c43c7fd3bd66b5899f0956a9cfd80bdead834f1`  
**Native MediaOS state at preparation:** SCRIPT LOCKED revision 1; SCENE WAITING revision 0 (read-only QA check on 2026-11-01). Do not claim a successful write without post-action read-back.

## Exact material, no generative changes

- `frontend/src/data/EP002_VisualPass_v1_0_DIRECTOR_APPROVED.md` is a byte-for-byte Git blob identical copy of the approved original, **Git blob SHA verified equal**.
- `frontend/src/lib/ep002ApprovedVisualPassImport.ts` performs fail-closed validation of the source and parses exactly **11 SHOT sections** and **59 numbered HEAR → SEE actions**, using the original source substrings for every shot. The entire raw Markdown is also included in the final JSON artifact under `originalApprovedVisualPassMarkdown` to preserve overview, cross-shot continuity and production instructions in addition to shot breakdown.
- `frontend/src/api/episodePreparationApi.ts` submits the artifact to the **pre-existing authenticated native endpoint** `POST /api/v1/episodes/{id}/stages/scene/draft`. The native service requires SCRIPT to be LOCKED, a nonempty artifact, current optimistic revision matching, Director security preflight and audited trace. It sets the new stage to `READY_FOR_REVIEW` but does **not** grant a native `SCENE LOCK`.
- `frontend/src/pages/EpisodePreparationPage.tsx` provides an EP002-only `Import approved EP002 Visual Pass v1.0 (no AI cost)` action **only when** the prior stage is LOCKED and the native SCENE revision is zero; on-page visit alone does not save anything.
- On the post-import review page, each of the 11 SHOTs includes collapsible, original source-exact camera/asset/visual choreography; the full structured artifact is also inspectable.

## Verification

- Isolated `Dockerfile.ep002-script-import-qa-ci` built the frontend and ran **15/15 Vitest tests** without failures, including 2 new Scene tests proving exact raw markdown match, all 11 original shot sections round-trip without character loss, 59 HEAR → SEE beats, and complete per-shot camera/assets/continuity directions.
- CI commit: `9618361acb7b296050b14a1cc459e2305dc965b4`. App rollout is intentionally QA-only and pinned to that commit, not the moving branch HEAD.
- No ElevenLabs call, no paid AI generation, no EP001 asset changes, no production deployment.
- A real Director user must explicitly click the import action in their own authenticated Safari session. The agent does not possess their Safari session cookies, cannot claim the native stage import already happened, and must not impersonate their identity.

## Director action and confirmation

1. Open https://qa-media-os-backend-qa.up.railway.app/#/episodes/95b8a4a2-728e-47fe-ad4c-a16748773588/prepare in the Safari session previously established with the private owner invitation.
2. Under **Video Plan / SCENE** click **Import approved EP002 Visual Pass v1.0 (no AI cost)** once. Do not use `Generate Draft (paid AI)`.
3. After page refresh, verify **SCENE READY_FOR_REVIEW revision 1**, 11 full SHOT plans, 59 visual actions and the original source hash `5c43c7fd3bd66b5899f0956a9cfd80bdead834f1`.
4. Because the user already explicitly granted the separate GitHub creative approval, the Director may independently use the native audited **Review & Lock** if the imported artifact is source-exact. This must be a real Director action, not an automated fake.
5. After native SCENE LOCK, proceed into voice-generation review/actual per-shot timings, maintaining all native Voice and Shot approvals, not by bypassing QA render gates.

**Interpretation:** GitHub creative LOCK is an approval of the new visual plan. The separate MediaOS native SCENE state remains pending until the user imports and explicitly locks it. This ensures clear audit separation.
