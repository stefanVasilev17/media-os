# EP001 SHOT01–12 — 20:54.8 Full Episode — Exact-Frame Cumulative QA PASS

**Date:** 2026-10-27. **Status:** TECHNICAL MP4 QA PASSED, DIRECTOR REVIEW PENDING; the derived full episode is NOT Director-LOCKED. All individual SHOT01–12 Director creative LOCKs preserved unchanged.

## Approved exact source manifest
1. SHOT01–09 repaired aggregate: `fd1046d0-6b20-4267-8135-8b67add2ca33` — **30,924 actual frames** (MediaOS row says 30,923, do not use that metadata to calculate the timeline), 1920×1080 at 30fps.
2. SHOT10 V8: `7e55c59a-3102-4d4c-b23e-96c68ad1f286` — 2,160 frames / 72s, 1280×720.
3. SHOT11 V5: `3a09dbd5-7ef8-4c0e-9621-12ca8a4b99a0` — 2,160 frames / 72s, 1280×720.
4. SHOT12 V5: `5d8c7db2-b34e-4781-af1a-2aa236691ea5` — 2,400 frames / 80s, 1280×720.

Last three sources were normalized to 1920×1080 in derived intermediate files only; no original locked source altered. Combined planned frames 30,924+2,160+2,160+2,400 = **37,644**, 30fps => **1254.800s**.

## Exact passing preview
- **Render UUID:** `8e4e9da0-f114-4a34-a491-cb9c3ca99c20`
- **Full episode playback:** https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/8e4e9da0-f114-4a34-a491-cb9c3ca99c20/video
- Composition `EP001-Voice-CurrentPreview`, profile REVIEW, 1920×1080, metadata READY, byte count 112,394,457 bytes.
- Independent MP4 container parse via live Railway Function (not merely MediaOS planned metadata):
  - Movie duration **1254.800s**
  - H.264 video handler `vide`, `stsz.sample_count=37644`, `stts.sample_count=37644`
  - Video stream duration **1254.800s**, average **exactly 30 fps**.
  - AAC audio handler `soun`, sample count **58,838**, duration **1254.784667s** (15ms difference).
  - `EP001_FINAL_12_SHOT_MP4_INDEPENDENT_QA.pass=true`.
- Rendering worker log: `Completed cumulative preview 8e4e9da0-f114-4a34-a491-cb9c3ca99c20: 112394457 bytes`. Input was surviving valid earlier `73332292-fbc3-40f0-a767-06aa8adfae01` combined preview; `retimeVideoTo30fps:true` plus `strictFrameCap:true` applied and original audio was passed via `-c:a copy`. Opt-in strict frame cap implemented in `remotion-engine/cpu-worker.mjs` commit `b9edebc26a7b78b2878fbbf948be2bf415eab527`.
- Previous failed/mismatched intermediates `fe5ee035-...`, `73332292-...`, `b0ea9583-...` are historical and must not be presented as final.

## SHOT12 source preservation
Exact Director-LOCKED SHOT12 V5 MP4 `5d8c7db2-b34e-4781-af1a-2aa236691ea5` must not be removed by retention. GitHub commit `18df7b49d9d4aefca166ca8b6ceb70f454b23f48` added a hardcoded UUID keep-exception to both retention SELECT and UPDATE filters, with complete JdbcClient parameter bindings. **Confirm the corresponding Railway backend deployment is SUCCESS before claiming the safeguard is live**. Source inspection confirms both conditions and both parameter bindings.

## Director gate
User should review exact 20:54.8 combined video for pacing, transitions and perceived audiovisual sync, especially at shot boundaries and the final Dashboard. The 12 underlying SHOTs remain LOCKED; the aggregate is merely a review derivative until explicit Director LOCK. Do not rerender any approved voice or alter visual states to accomplish assembly.
