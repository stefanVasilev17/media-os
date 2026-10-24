# Architectural Thinking — EP001 SHOT 08 — Director Review V2

**Status:** VISUAL DRAFT V2 — NOT LOCKED. **Date:** 2026-10-24. **Master protection:** SHOT 01–07 remain native LOCKED, 7/7 QA PASS. The 12:18.1, 22,143-frame Director-approved EP001 preview remains exact render `1fcb24e2-99bc-4e97-85f1-cbafcfc4e94c`.

## Four Director-requested corrections (source: visual-review screenshots)

1. **Opening centering must be fixed.** V1 used a shifted/nested 1920x1080 source map translated far left, visibly cropping the scene and producing a hard background edge. V2 draws a native, full-frame, deliberately centered and evenly spaced architecture overview. No horizontal dead field, no hard 1920px canvas cutoff, no camera teleport.
2. **Remove SETTINGS.** Replace this module with `ACCOUNT STATUS`, relevant to the successful-login story: `STATUS · ACTIVE`, `EMAIL · VERIFIED`, `TIER · STANDARD`. These are illustrative attributes of the fictional user account, not universal backend requirements.
3. **ACCESS RIGHTS completely new composition.** Preserve `ROLE — MEMBER`, but make it a visual connected graph, with a purple role hub and three individually connected capability nodes `PROFILE`, `ORDERS`, `SUPPORT`. Remove `SCOPES · Profile read` and all explanatory sentence text from this panel. Capabilities are fictional examples, not a claim of universal access semantics.
4. **STORED CREDENTIAL VERIFIER concept kept, examples changed.** Show only `KDF — Argon2id`, `SALT — 6f4c…91a2`, `DIGEST — b81e…c5d0`, as illustrative non-sensitive string fragments. No algorithm/salt/hash bars, no long explanatory footer, no plaintext password, no extra text. Verifier represents material used by Auth Service to check a password, not authentication success.

## Exact 1920×1080 layout

### A. Opening / return — centered map

- **Background:** full 1920×1080, radial navy gradient from `#103253` to `#081B34`; never position a smaller background layer at the left.
- **Four cards:** upper-left `(196,340)` API Gateway; `(616,340)` Load Balancer; `(1036,340)` Auth Service; `(1456,340)` User Database. Each `337×314`; total horizontal envelope x=196–1793 (center=994.5, giving approximately 200px margin each side). All cards aligned y=340–654, with 83px between. The central focus stays on Auth Service and User Database. No sidebar crop.
- API Gateway and Load Balancer remain subdued; Auth Service keeps green/mint original Login Request, visibly `WAITING`. The DB cylinder stack is bright cyan with a moving scan beam. Separate cyan lookup does **not** mean authentication success.
- Camera only applies mild, centered zoom, approximately `1.0 → 1.07`; close-up is introduced with opacity overlap, no sudden large translation.
- Return animation routes a **cyan reply** from DB toward Auth Service, with one original green login request preserved in place. Final frame still represents **pending credential verification**, not successful login.

### B. Database close-up

- **Outer architectural panel**: `x=91 y=68 w=1738 h=948`; title USER DATABASE at `(181,142)`; plain, minimal heading with no top-right READ ONLY label.
- **Left record list** `x=201 y=300 w=646 h=467` (selection rows at x232, y326/458/590, each 575×102); fictional accounts 041/042/043. Matched account 042 — `alex@example.com` uses cyan outline; other rows remain readable, lower-intensity. One scan beam, no flashing status explosion.
- **Right USER DATA** `x=931 y=220 w=790 h=171`: name `Alex Morgan`, compact `ACCOUNT · 0042` capsule, no sentence microcopy.
- **Right PROFILE** `x=931 y=414 w=374 h=218`: `alex@example.com` and `Alex Morgan`, no verbose subheadings.
- **Right ACCOUNT STATUS** `x=1326 y=414 w=395 h=218`: three paired labels/values, with thin separators and `ACTIVE` / `VERIFIED` / `STANDARD`. No Settings module.
- **Lower active module** `x=931 y=664 w=790 h=234`: access-rights graph at approximately 37–55 seconds, crossfades to verifier around 57–63 seconds. Top and middle panels do not jump or change scale.

### C. Access Rights visual geometry

- Outer `ACCESS RIGHTS` purple border. Left role capsule `x=961 y=744 w=215 h=112`, ROLE label and MEMBER value. Connected path starts at `(1184,800)`, branches vertically along `x=1227`, then feeds three rows `x=1255 y=731/786/841 w=427 h=45`.
- Capability row text: PROFILE, ORDERS, SUPPORT. No `Scopes` sentence; no icon-only abstract blocks; no false bright green authenticated indication.

### D. Credential verifier geometry

- Same outer lower zone `x=931 y=664 w=790 h=234` so it replaces rather than collides with Access Rights. Fields: x964,1211,1458; each 214×71, y780. Labels at y762.
- Meaningful but intentionally illustrative examples: KDF=Argon2id, SALT=`6f4c…91a2`, DIGEST=`b81e…c5d0`. No bottom explanatory text, no extra microcopy.
- Never show a plaintext password, never show Match / Verified / Success inside this module.

## Animation timing reference (visual-only, not final voice timings)

| Local time | Visual |
| --- | --- |
| 0:00–0:12 | Full centered architecture map; DB scan active; Auth Service original request waiting |
| 0:12–0:19 | Controlled close-up onto database |
| 0:19–0:35 | Account rows scanned and #042 selected |
| 0:35–0:37 | Profile and Account Status settle into view |
| 0:37–0:55 | Access Rights role/capabilities architecture |
| 0:55–1:15 | Stored Credential Verifier replaces Access Rights |
| 1:15–1:27 | Pull out to centered full map |
| 1:27–1:35 | Cyan account-facts reply moves DB → Auth Service; green request remains waiting |

## Revised English VO intention (not generated, not Director LOCKED)

C01: “The User Lookup reaches the User Database. This is not a second login. Auth Service is still holding the original request while it asks for the account linked to the submitted email. Nothing has been authenticated yet.”

C02: “The database finds the matching account. Its profile tells us which account we are dealing with, and its account status tells us whether that record is active and how it is configured. Finding an account is not the same as proving who is using it.”

C03: “The account can also carry a role, such as Member, and permissions for areas of the product. We can see examples here: Profile, Orders and Support. Those rights can shape what happens after login, but none of them proves that this password belongs to the account.”

C04: “Next comes the stored credential verifier. In this example, the password verification record includes an algorithm, a salt, and a derived digest. It is not a readable copy of the original password. Auth Service needs that information to perform the verification step, but that step has not happened yet.”

C05: “The database sends the account facts back to Auth Service. The cyan reply travels in the opposite direction from the lookup, while the original green Login Request still waits. We have found an account. Now Auth Service has to verify the credentials.”

## Implementation and release rules

- v2 code path: `remotion-engine/src/episodes/ep001/live-diagram/UserDatabaseHappyPathV2.tsx`. Independent Remotion composition: `EP001-Shot08-VisualDraft-V2`, 1920×1080 design coordinates, `FAST_PREVIEW` 1280×720, 30 fps, 2,850 frames (95 seconds).
- Older `EP001-Shot08-VisualDraft` v1 remains available for reference. Do not overwrite it. No voice generated or altered by standalone preview. No active SHOT08 native render registration yet.
- Director must review the new v2 output before we call the visual LOCK or produce locked synchronized voice.

## Implementation & render submission checkpoint — 2026-10-24

- V2 visual component `UserDatabaseHappyPathV2.tsx` committed, with native four-card SVG map and no nested/shifted v1 backdrop. Independent Bun TSX compilation test succeeded (15,617 bytes source); required v2 content checks passed, old `SETTINGS` text absent.
- Remotion composition: `EP001-Shot08-VisualDraft-V2` (independent from original `EP001-Shot08-VisualDraft`). Backend render profile registered as `EP001_SHOT08_VISUAL_DRAFT_V2`.
- Railway worker commit `c727c399` and backend commit `35521c9f` successfully deployed and composition availability independently confirmed.
- **V2 95-second visual-only FAST_PREVIEW queued:** render ID `06c6fee5-6918-45dc-8d0d-0435d9e80cd5`, 1280×720 at 30 FPS, 2850 frames; claimed by Railway worker at 2026-10-24T19:03:44Z. Do not claim a ready playable MP4 until the worker completes and HTTP video delivery is checked.
- Before submitting the V2 draft, MediaOS confirmed SHOT 01–07 are all native LOCKED with QA PASS and the exact previous 12:18 cumulative Director LOCK preview remained `1fcb24e2-99bc-4e97-85f1-cbafcfc4e94c`. V2 preview input intentionally omits `shotKey`/`scriptRevision` to prevent accidental native SHOT08 master mutation. No voice generation or locked-source rewrite performed.
- **Status: SHOT08 V2 VISUAL-ONLY DIRECTOR REVIEW, NOT LOCKED.**

## Implementation and native preview submission — 2026-10-24

- V2 visual code is committed at `remotion-engine/src/episodes/ep001/live-diagram/UserDatabaseHappyPathV2.tsx`. Root composition `EP001-Shot08-VisualDraft-V2` is registered separately from v1, and a matching backend composition profile has been deployed successfully.
- Bun TSX syntax transpilation passed; old SETTINGS, SCOPES microcopy, and verifier explanatory footer are not present in the new component.
- Backend `AT_REMOTION_35521c9f55f4_20261024185858` confirmed v2 composition available before accepting a render.
- **Accepted visual-only V2 render ID:** `f06fef7e-99b2-4186-91ab-8bebfd8a6be2`, `FAST_PREVIEW` 1280×720, 2,850 frames / 95 seconds @30 fps. At this writing it was **QUEUED**, not yet confirmed READY or delivered over HTTP. Do not link as a completed MP4 until independent completion/delivery QA passes.
- Seven native Director LOCKs and cumulative preview `1fcb24e2-99bc-4e97-85f1-cbafcfc4e94c` were verified unchanged. No SHOT08 voice was generated and no SHOT08 native Director LOCK was applied.

## Verified completed V2 preview — 2026-10-24

- Railway Remotion worker successfully completed V2 visual-only preview `06c6fee5-6918-45dc-8d0d-0435d9e80cd5` at **2026-10-24T19:13:21Z**.
- Render `READY`, composition `EP001-Shot08-VisualDraft-V2`, `FAST_PREVIEW`, 1280×720, 30 fps, 2,850 frames, **95 seconds**, **4,132,090 bytes**.
- Direct video: https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/06c6fee5-6918-45dc-8d0d-0435d9e80cd5/video
- Independent MediaOS network verification: HTTP **206**, `video/mp4`, `Content-Range: bytes 0-127/4132090`, valid `ftyp` MP4 header.
- Native SHOT01–07 remain **LOCKED** with all **QA PASS**, and the same immutable cumulative preview ID `1fcb24e2-99bc-4e97-85f1-cbafcfc4e94c`.
- **Next:** Director visually assesses V2 composition before any creative lock or voice synchronization. This preview is **visual-only, NOT LOCKED**.
