# Publishing Studio V1 — implementation and verification

2026-11-27. Phase 1 implemented and deployed. Production backend pin: `148f31ce6f697e5fe7de8a25d7be9e63b9527d8a`. Railway deployment `7c4ba11e-7c25-4ee8-9f55-c221673e4f94` SUCCESS, 14:35:09 UTC. Existing render worker and PostgreSQL remain online. No new services or external publishing.

## Scope
- Native Publishing tab in the existing Director episode workspace; editor, copy/export, history, combined YouTube description.
- Title, thumbnail design and image, description, chapters, SEO tags, hashtags, sources, disclaimer, pinned comment, upload settings, audio direction, English transcript and synchronized SRT import/validation/export; distinct technical and editorial QA gates.
- Per-field immutable revisions; optimistic expected revision; package owner identity; existing audited preflight. Existing private object storage for bounded, namespaced PNG/JPEG, image validation and SHA-256 verified readback. No public image bucket or new infrastructure.
- Approval/QA tied to master SHA and relevant field revisions. Actual technical evidence is required; release gate never invokes YouTube.

## Verification
Frontend 117/117 PASS; production build PASS. Backend Maven test report 619 tests, zero failures/errors, one skipped (618 passed); isolated PostgreSQL publishing integration test PASS; new publishing unit and route tests PASS. Production startup confirmed source pin PASS, Flyway validated 132 migrations and applied V132, health check succeeded. Flyway warns PostgreSQL 18.6 is newer than its tested support; migration itself succeeded.

## EP004
Migration V132 conditionally seeds the already approved package metadata only when the exact expected package ID and master SHA match. Package `d11d02a2-b649-44c9-a022-4405149f675e`; film `040d0fd7-ebb3-3b99-838a-005bc23122cd`; SHA-256 `d93801a75e6cd3d691c3e764cb8874e66bb8ef8d4acf178d8e16e920304dfd9c`. Production seed row contents have not been independently queried through an authenticated Director session. Transcript is a draft from locked script, not a synchronized SRT.

Original approved PNG identified, SHA-256 `28654ed2519d21311f060c38d4b355fd3cbd73ee6b0aa317c5325e845964de15`; image archive remains to be uploaded through authenticated Director UI. No live image write/readback or authenticated browser interaction was exercised by Executor. Open the episode and select Publishing to review. Final factual/rights checks, audio, synchronized captions, private upload and explicit Director release still pending. No new rendering or voice generation; locked media unchanged.

Phase 2 direct extracts, Phase 3 distribution and Phase 4 review/learning are separate. AT-PUB-0001/0002 and AT-DIST-0001/0002 govern future implementation.

## 2026-11-27 — Director feedback: quiet Publishing Studio V2 interface

Director rejected V1 as chaotic and difficult to understand. The correction keeps the existing publishing service, V132 database, security, revision history, master lineage and approval gates unchanged. Use a single full-width, content-first page, ordered like a real YouTube upload: (1) title and thumbnail, (2) assembled description with one copy button, (3) tags and pinned comment, (4) subtitles and upload settings, (5) final review. Hide the SHOT sidebar only while Publishing is active; keep simple Shots / Full Video / Publishing navigation. Show saved content before editor controls. Use on-demand native modal editors with discard confirmation; version history, technical evidence and raw lineage remain available but not dominant. Show human-readable pending/approved/stale labels, not database keys. Do not equate editorial approval with actual technical QA or release readiness.

Source candidate `ea9227be314b92c289b8126cbaf75ace22c44c84`; frontend 120/120 regression tests passed and production frontend build succeeded. Exact backend deployment requested; runtime verification and Director visual acceptance remain separate. No migration, locked-media modification, new infrastructure, rendering, TTS, or external publishing. The exact five-section grouping and modal approach are Executor UX decisions pending Director review, not a Director lock.
