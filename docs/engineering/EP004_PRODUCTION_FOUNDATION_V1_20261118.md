# EP004 — Director-LOCKED Episode-Level Production Foundation v1

**Director decision:** 2026-11-18. **Episode:** EP004, `Why Microsoft 365 Went Down — And Why Failover Made It Worse`.
**Creative status:** SCRIPT V1 and EPISODE-LEVEL VISUAL STORYTELLING V1 are DIRECTOR-LOCKED. SHOT-LEVEL animation timing, layout coordinates, real Take selection and rendered media are NOT YET locked or created.
**Scope:** episode-specific nonpaid preparation. No infrastructure creation, TTS, Remotion render, storage migration or deployment authorized by this document.

## Canonical startup sources — READ BEFORE ANY EP004 CHANGE

1. `AGENTS.md` and `PROJECT_STATE.md` on **current main**; check merged PRs and actual deployed branch versus main.
2. `docs/engineering/MEDIAOS_ROADMAP_V1_DIRECTOR_LOCK_20261102.md` plus current technical handoff and `docs/engineering/MEDIAOS_PERMANENT_LEAN_INFRA_AND_STORAGE_POLICY_20261117.md`.
3. **Immutable English narration**: `docs/episode-memory/plans/2026-11-18-ep004-script-v1-director-locked.md`. Source SHA256 `14c61a7d26f2be23ca30fef2280a4b13ad7ab110fadf32018b2ece6d59cb40a6`.
4. **Episode-level approved paragraph-by-paragraph visual direction**: `docs/visual/EP004_VISUAL_STORYTELLING_V1_DIRECTOR_LOCKED_20261118.md`. Original visual-pass SHA256 `4f5f6a3c4b03e45f169222bf26fbc00b76dbdb88f6931fc0048153f4b19e3620`; canonical Git copy adds only an approval preface.
5. Cross-SHOT continuity, global motion/visual QA, only-spoken-term glossary cards, text dwell, content-fit and no-still-cover policies linked at the top of AGENTS.md.
6. Existing reusable Remotion code and live registry; check **actual** package/module availability and current production branch before describing anything as reusable/DEPLOYED.

**Authority order:** Director's newest explicit approval and P0 safety > EP004 locked exact narration/visual story > engineering episode contract > older historical planning. If a proposed code implementation disagrees with locked source, FAIL CLOSED and create a separate V2 proposal. Never silently rewrite a canonical source.

## Exact narrative inventory and frame contract

- **15 SHOTs, 51 narration paragraphs**, semantic IDs `SHOT01_P01` through `SHOT15_P03`. SHOT paragraph distribution: **3,4,3,4,4,4,3,4,5,2,3,4,2,3,3**. These are source-derived counts; verify against both locked documents whenever preparing an import or scene revision.
- Exactly three candidate direct-cut Reel arcs: **SHOT07** backup cascade, **SHOT10** restarting is not recovery, **SHOT13** apparent high availability versus usable service. Vertical 9:16 center-safe geometry is QA, not guaranteed by 16:9 source.
- 1920×1080, 30fps production grammar. Approximate 00:00–20:00 storyboard timestamps are **editorial only**. Authoritative SHOT durations, semantic cue frames and 2s-ish narrator-free moving breathing require a selected Director-approved Slow Natural Take and genuine character/word-level alignment. Never invent timing or trim locked narration to fit a drawing.
- Every new SHOT must begin at the **actual decoded last encoded frame** of its pinned predecessor, including camera, path geometry, in-flight packet IDs and normalized progress, light, health state, labels and pressure values. First visible frame must match; frame 1 onward must actually move. No 55-frame PNG overlay or freeze; check first 20–30 decoded frames and entire seam.

## One-world geography and causal graph

**Persistent identities:** `human-outlook` and `client-teams` on the left; `traffic-router` centrally; `primary-gateway` and `alternative-gateway` in separate corridors; `exchange-online` and `teams-destination` at the right. Within the primary gateway, reusable conceptual focus layers `gateway-fleet`, `connection-handling`, `shared-resource`, `regional-partitions` and `returning-workload` emerge through continuous camera moves. **No nested decorative containers, new isolated presentation slide or teleportation between layers.**

**Route semantics:** Outlook → Router → Primary Gateway → Exchange Online. Teams → Router → Alternative Gateway → Teams destination, then Teams → Router → Primary Gateway (documented handoff). Subsequent failover redistributes *new* requests among reachable primary fleet endpoints. Explicitly draw a route **before** moving a packet along it. Response returns on the same authorized geometry in reverse. Layout coordinates and Bézier control points remain separately reviewable SHOT-level implementations, not asserted Microsoft topology.

**Visual identity:** background near `#010711`/`#020811`; Outlook cyan; Teams violet; inactive blue-gray; waiting amber; unreachable/failed red; completed-request green. Keep source traffic identity and current state separate. A node can be alive but without enough headroom. Capacity available, offered load, health and contention are distinct metrics; do not collapse into a fictitious single 100% health meter.

**Audience learning sequence:** 01 human failure → 02 successful generic failover → 03 Teams reroutes to the primary → 04 July latent lock contention, powerful production vs weaker lab → 05 ~14% unavailable capacity without invented server count → 06 traffic mix crosses hidden concurrency conditions → 07 alternative destinations share failure mode → 08 region boundaries fail to contain → 09 alive versus ready → 10 restart and overload recurrence → 11 grounded incident timeline → 12 known-good software path + traffic controls → 13 general design alternatives → 14 simultaneous locally valid routing and globally failed outcome → 15 human mailbox recovery and unresolved design question.

## Incident truth and animation limits

Factual source: Microsoft's **preliminary** Nov 2026 PIR, subject to final PIR check immediately before publication. Its published facts include July gateway-specific defect, contention and multi-core test mismatch, 01:07 UTC Teams failover, nearly 14% unavailable primary capacity, >80% unresponsive affected gateway servers, regional containment issue, repeated recovery overload, active impact ending Nov 13 16:10 UTC. The conceptual map does **not** assert Microsoft node counts, packet routing protocol, actual queues/threads, physical regions, health probes, threshold numbers, allocation algorithms or exact debugging controls. Engineering alternatives in SHOT13 are labelled GENERAL DESIGN PRINCIPLE, not reported Microsoft implementation.

Every paragraph visual carries an evidence class: `PIR_FACT`, `SCHEMATIC_EXPLANATION` or `GENERAL_DESIGN_PRINCIPLE`. Percentages/timestamps are factual callouts linked to their actual denominator/context, not created from the number of illustrative rectangles.

## P0 visual and interaction acceptance

- **No container-on-container:** architecture objects are actual spatial entities; reserved negative space used only for necessary glossary when exactly spoken and defined. No generic stats, slogans, redundant narration text, semicolon-separated explanatory sentences or recurring overlay HUD. At most one glossary definition except explicitly paired terms.
- **No clipped text:** 1080p minimum nominal primary 20px / secondary 18px, content-measured width and height, safe video margins, no icon/label collision, intermediate-state checks, no quickly flashing captions. A two-line glossary wants about 5.5 seconds visible and approximately 4 seconds fully readable; otherwise omit. Node focus usually 3–4 seconds where narration permits.
- **No packet drift:** the rendered connector and particle sample the same authoritative typed geometry, including Bezier controls and source/target ports; track progress continuously under camera transforms. New requests use a newly selected path; previously dispatched requests never teleport.
- **No inexplicable colors:** reserve red for actual failure and amber for waiting/pressure; do not show whole Microsoft 365 down when only some products/functions were impacted; never use a factual label on an illustrative server count.
- **No fake QA:** test source geometry, text bounds and metadata before paid operation. True visual LOCK additionally requires actual encoded MP4, decoded first/last frames, first 20–30 movement frames, safe text and route QA, authenticated Director preview and **explicit Director approval**.

## Production deliverables and gates

**Gate A — Director source integrity (THIS DOC/PACKET):** exact immutable narration, approved visual plan, paragraph-to-beat index, topology ontology, three Reels and unambiguous P0 preflight pointers in repo.

**Gate B — SHOT-level technical scene plan:** real layout/CameraRig/connector geometry in a narrowly scoped EP004 source proposal, frame and state model, explicit camera path, packet trajectories, text bounding boxes, concept-to-narration events and an actual source-versioned seam contract. Director reviews candidates; locked A remains untouched.

**Gate C — Voice readiness:** selected genuine Slow Natural original Take, measured duration, correct text hash and source-aligned HEAR→SEE anchors; explicit paid request permission required if not already produced. No speculative sound or timecode as substitute.

**Gate D — Media storage and operations:** existing Railway production **exactly 3 services** (backend, render worker, Postgres); worker costly render concurrency max 1; bounded jobs and explicit spend. All EP004+ MP4/audio/frame outputs MUST use approved secure object storage (not PostgreSQL bytea). Streamed writer/read, SHA256, authenticated range playback, TTL/protected retention, artifact audit and real 50/65/75% PG + Railway volume gates must be implemented/tested/deployed before paid media work. Current policy does not prove code readiness. Existing approved EP001–003 masters are immutable grandfathered exceptions.

**Gate E — Authorized visual vertical slice:** first review 20–30 sec of SHOT07 cascade with actual shared-path packet motion, clear failover headroom, real seam and text QA. This is the most demanding interaction; **planning is authorized, paid render is not**.

**Gate F — Full episode and Shorts:** scoped versioned SHOT candidates, authenticated cumulative full-film review after each Director SHOT visual LOCK, source/hash-pinned stream-copy reuse, final explicit Director full-film approval, then separate safe 9:16 Reel exports.

## Actual next engineering work

1. Reconcile main vs production code branches; don't overwrite newer deployed EP003 functionality.
2. Implement/test missing **P0 storage and resource safety** on existing backend/worker as a separate scoped engineering milestone before EP004 media-producing execution. No new Railway service, volume or bucket.
3. Validate EP004 route geometry and SHOT07 vertical slice as a code-only isolated proposal; no paid render until Gate D complete and Director approves.
4. Update `PROJECT_STATE.md` on the current working branch with only verified evidence, then Director reviews PR/merge.

**Milestone classification:** Episode Level Visual Lock/production preflight specification may be DONE as repository source; EP004 source scene code, chosen Take, production render, reliable object-store media pipeline and Director visual SHOT locks remain NOT DONE until separately tested and approved.
