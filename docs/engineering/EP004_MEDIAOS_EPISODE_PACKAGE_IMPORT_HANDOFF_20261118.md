# EP004 — MediaOS Episode Package v1: Import-Ready Source + Director-Only Import Handoff

**Date:** 2026-11-18. **Status:** PACKAGE SOURCE READY AND VERIFIED. **LIVE MEDIAOS IMPORT NOT YET EXECUTED OR VERIFIED.**
**Source authority:** Director-LOCKED English Script V1 and Episode-Level Visual Storytelling V1 (2026-11-18), in canonical GitHub sources listed below.
**No provider spending:** preparation and the existing source-only importer must cause **zero** ElevenLabs requests, OpenAI usage, media renders or new Railway infrastructure.

## The artifact to import

**Authoritative JSON path:** `docs/episode-memory/plans/2026-11-18-ep004-mediaos-episode-package-v1-director-locked.json`

- **SHA-256:** `a47b5d2af200014828089bcfb0812017970a8ecfe623cefc67456359af4fe365`
- **Git blob SHA:** `338486d3900cb91bf34811e55d817232ead416af`
- **UTF-8 bytes:** 128,073 (below MediaOS 524,288-byte ceiling)
- **Schema:** `mediaos.episode-package.v1`, repository reference `docs/contracts/mediaos-episode-package-v1.schema.json`
- **Identity:** `EP004`; `Why Microsoft 365 Went Down — And Why Failover Made It Worse`; English; editorial 1,200 seconds / 20 minutes, pending measured takes
- **Inventory:** 15 contiguous SHOTs, 51 spoken paragraphs, 128 literal ordered HEAR → SEE beat anchors, three independent Reel candidates `SHOT07`, `SHOT10`, `SHOT13`
- **Longest SHOT narration:** 1,318 characters, below current single ElevenLabs 5,000-character text cap
- **Approved reusable asset identities:** `ATBackground`, `ATCameraRig`, `ATPrimaryNode`, `ATConnectionPath`, `ATFlowArrow`. All are sourced from the existing 15-component reusable asset registry on main; pins MUST be revalidated against checkout before any code generation. Episode-specific Gateway/Contention/Region components are proposal-only and not falsely declared as installed.
- **No fake alignment:** editorial duration and cue anchors are not actual ElevenLabs audio times; every cue is literal narration content and must be mapped only after genuine provider character timing.
- **No loss of approved words:** original script remains exactly immutable in `docs/episode-memory/plans/2026-11-18-ep004-script-v1-director-locked.md` (SHA256 `14c61a7d26f2be23ca30fef2280a4b13ad7ab110fadf32018b2ece6d59cb40a6`). Package narration removes only Markdown `**` emphasis and editorial `[REEL START/END]` notes; the actual spoken words and paragraph order are byte-for-byte equivalent to their plain-text form.
- **Approved directions:** `docs/visual/EP004_VISUAL_STORYTELLING_V1_DIRECTOR_LOCKED_20261118.md`, original visual-body SHA256 `4f5f6a3c4b03e45f169222bf26fbc00b76dbdb88f6931fc0048153f4b19e3620`. All 51 paragraph-direction bodies are wholly covered by 128 event-phase directions, with no Director-approved wording omitted.

## Tests already performed (real, source-only)

- JSON parsed; passes a reconstructed Draft 2020-12 representation of repository v1 schema and the additional server-side structural constraints from actual `EpisodePackageValidator.java` (contiguous shot IDs, literal cue inclusion, editorial sum ±30s, 512 KiB, Shorts refs and Director approval).
- **Executed** Node 22 `scripts/verify-ep004-episode-package.mjs` against exact locally mounted original script, visual source and generated package: **PASS**. This checks exact SHA256 pins, 15/51/128/3 counts, ordered literal narration cue offsets, each SHOT narration against the approved script word-for-word after editorial markup stripping, reconstructs all 51 original visual paragraphs from phase directions, validates Shorts spoken hooks and TTS per-shot limits.
- GitHub package was fetched after write and byte-for-byte compared with uploaded Library snapshot; Git blob `338486...` equals `git hash-object` of locally validated original file.
- Full GitHub repo Java Maven / frontend and runtime Director-browser import were **not** executed. The test is robust source-integrity QA, not a production API import success receipt.

## Existing MediaOS import path (confirmed in main frontend/backend)

**Director UI:** `https://media-os-backend-production.up.railway.app/#/episode-packages/import`
**UI component:** `frontend/src/pages/EpisodePackageImportPage.tsx`.
**Backend:** `POST /api/v1/episode-packages/import` / `EpisodePackageImportController.java` / `EpisodePackageImportService.java`.

Only the **logged-in Director session** can perform the import through the authorized browser workflow. The UI calculates the JSON SHA256, displays episode/SHOT/beat preview, asks for the **immutable source import** checkbox, then requires browser confirmation. The backend requires authenticated Director identity, `MEDIA_OS_CREATION_PREFLIGHT` audit ID, unique request UUID, matching expected SHA and `confirmSourceImport=true`, and persists the source and `episode_package_shot` + revision rows transactionally. Duplicate EP004/native episodes are rejected rather than overwritten. A GitHub connection or Railway deployment connection is **not** an authenticated MediaOS Director browser session.

**Expected successful live evidence:** GET `/api/v1/episode-packages` under same Director session shows a single `EP004` item with `shotCount=15`, `beatCount=128`, and `sourceSha256=a47b5...`; opening details yields `SHOT01..SHOT15` exactly, each initially `PENDING_VOICE` and with `Open Voice Studio`. Store returned `packageId` and `importedAt` in `PROJECT_STATE.md` **ONLY AFTER reading the actual authenticated response.** This response is currently unavailable, so **do not mark imported or ready to generate**.

## Why automatic import was not performed through GitHub/Railway connections

The connected GitHub tool manages repo files and PRs; Railway tools inspect and manage deployment infrastructure. Neither provides a scoped authenticated POST for the independent MediaOS Director API with its audited preflight and browser session. A network-inspection reader cannot substitute for Director OAuth. Do not bypass the backend audit gate, inject a database row directly, add an unauthenticated import endpoint, or deploy a one-off job simply to make a green status. Preserve the user’s control of authenticated source acceptance.

## Import acceptance after Director upload

1. Verify the browser preview says `EP004`, **15 SHOTs / 128 HEAR → SEE beats**, source hash `a47b5d2af200014828089bcfb0812017970a8ecfe623cefc67456359af4fe365`; if mismatched **stop, do not import**.
2. Select the explicit immutable-source checkbox and confirm **Import all SHOTs · No paid calls**. This is source approval only, **not paid TTS/render approval**.
3. Open the imported EP004 record and verify all 15 `PENDING_VOICE` tasks; store actual package ID and hash evidence.
4. **STOP before Generate:** existing Voice Studio v1’s `episode_package_voice_take.audio bytea` is prohibited for newly created EP004 audio by the 2026-11-17 P0 lean-storage policy. Migrate or implement an approved secure external media writer/reader/retention and a hard new-binary-write guard in existing backend/worker; deploy and test with no new Railway services/volumes/buckets, then only on Director's fresh explicit paid-TTS consent use the Slow Natural first take. The `voiceDirection` JSON field remains editorial guidance and does not by itself override provider voice settings.

## Next ownership and audit

- **Source package and checks:** DONE as GitHub source-only PR candidate, 2026-11-18.
- **Actual authenticated UI import:** NOT DONE, awaiting valid Director browser session/explicit completed POST; cannot assume success without returned package ID.
- **Safe EP004 voice generation:** BLOCKED until object-store-based EP004 audio handling is deployed and independently verified.
- **Next verified milestone to record:** actual MediaOS `EP004` imported package `packageId`, immutable source SHA, 15 voice tasks, and 0 external paid API calls.
