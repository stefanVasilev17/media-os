# EP003 Premium Routing — Visual Contract v1

**Status:** Proposed Director correction. Implementation lives in `remotion-engine/ep003-premium-routing.mjs`. Source-of-truth code is preferred over this document. Not a Director LOCK until review of SHOT08 V3 and SHOT09 V2.

## Design identity

The persistent 1920×1080 Architectural Thinking Living Architecture World remains unchanged. The premium routes replace decorative, freehand-looking cubic arcs with structured technical data rails. Rails have straight travel corridors and controlled 12–24px rounded corner transitions. Use stable node entrance and departure points. Avoid looping around service labels, arbitrary S-curves or visually unrelated arrows. The route must carry engineering meaning.

## Allowed named routes

| Route | Start | End | Purpose |
|---|---|---|---|
| AUTH_A | (1460,523) | (1574,523) | Account request to Shard A |
| AUTH_B | (1460,523) | (1738,523) | Account request to Shard B, via restrained upper corridor |
| REPLICA_A | (1606,667) | (1690,709) | Read-copy/replication toward Replica A |
| REPLICA_B | (1771,667) | (1803,909) | Replica B through independent external right rail |
| RECOVERY_A | (1460,523) | (1578,775) | Controlled failover route from Auth decision to promoted former Replica A |

These coordinates intentionally preserve established Shard A/B and Replica A/B positions. Only approved redesign should move their anchors.

## Rendering and motion

A route is declared once as a start point and ordered `L` and `Q` segments. `premiumRouteD` draws the SVG. `premiumRoutePoint` evaluates a packet on the same segments using arc-length approximation. Do not introduce separate packet curves, free-floating dots or independently calculated visual paths. `premiumPacketPoint` is the canonical time→position adapter.

Active stroke: 2.6px. Under-rail: 5.4px at 0.3 opacity. Packet radius: 3.7px. Packet glow: 5px. Favor subtle cyan/mint with the existing failure red/amber semantic logic. Keep previously accepted canonical node colors and fonts. Only brighten the path that currently explains a request or ownership transfer.

## Review gates

1. Auth packets must connect to real Shard A/B paths, not travel in the whitespace.
2. Replica A/B packets must follow the exact visible rail. B must remain outside the A card.
3. No route or packet may cover OWNER A/B, replica titles, or other labels at any focus scale.
4. No new container within a container and no label outside its own bounding card.
5. For SHOT09 recovery, the old Primary becomes unavailable. New traffic cannot use the failed writer. The recovery rail becomes active only at the legitimate ownership cue, not earlier.
6. SHOT08 V3 starts from locked SHOT07 V3's exact decoded last frame. SHOT09 V2 starts from the actual saved SHOT08 V3 candidate's exact decoded last frame. Enforce encoded PSNR≥27dB and moving first frames. Never substitute a different parent source.
7. Original selected Slow Natural voice tracks and all real voice cues remain immutable.
8. EP003 SHOT10 must import the same route contract from `Shot10PremiumRoutingContractV1.ts`. New routes require new tested names and explicit Director approval. SHOT10 is not yet rendered.
9. Keep old Director-LOCKED SHOT08 V2 and official 8-shot master intact until the Director accepts and explicitly locks replacements.

See `AT-VIS-0003` in `CODEX_VISUAL_LESSONS_LEDGER.md`.
