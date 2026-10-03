# EP001 Memory Event — Diagram Object Truth Correction

Date: 2026-10-03
Episode: EP001 — What Really Happens When You Click Login?
Status: ACTIVE CREATOR CORRECTION

The creator corrected an important mismatch between narration terminology and the actual Spline diagram.

## Correction

- There is no `Client Boundary` object in the current Spline diagram.
- Future narration, shot contracts, sync anchors, production instructions, and Approved Episode Package data must not invent or reference a `Client Boundary` object unless the creator explicitly adds such an object later.
- Script terminology must follow the actual active object names that exist in the current Spline world.

## Current visible main path from the creator-provided diagram

`LOGIN / Phone -> REQUEST ASSEMBLY -> Network / Transit -> API Gateway -> Load Balancer -> Auth Service -> USER DB -> Authentication State -> logged-in Phone / Dashboard`

## Current visible supporting objects / groups

Top/supporting regions include labels such as `Login Intent`, `Headers`, `DNS Resolution`, `Routing`, `Traffic Distribution`, `Validation Steps`, `User Data`, `Session Creation`, and `Route Decision`.

Failure / recovery region includes `Expired Session`, `Invalid Token`, `Account Status`, `Access Denied`, `Failure Response`, and `Session Restore Flow`.

## Narration strategy impact

- Explain each active object in simple language first, then mention its exact diagram label when useful.
- Do not introduce architecture terms or object names that do not exist in the current Spline diagram.
- For the opening sequence, use `Request Assembly` and `Network / Transit` as the real transition from the Phone into the backend journey.
- The previously proposed revised SHOT 01–04 text containing `Client Boundary` is rejected and must be rewritten before any new lock.
