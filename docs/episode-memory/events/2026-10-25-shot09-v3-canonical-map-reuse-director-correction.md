# EP001 SHOT 09 — DIRECTOR CORRECTION: REUSE THE EXISTING ARCHITECTURE MAP

Date: 2026-10-25
Director comment (in Bulgarian): "Вече имаме изградена диаграма. Нека започнем с нея . Защо си създал друга диаграма?"

**Director instruction is binding:** Future scenes must not redraw/reinvent a second simplified global login architecture map. Opening wide shots must use the canonical diagram/component already used by Director-approved prior shots, preserving exact node design, relative positions, style and meaningful connections. Use camera movement and an additional local focus overlay rather than inventing new phone/gateway/balancer/auth/database rectangles.

## Diagnosis

SHOT 09 DirectorVoiceV2 added its own independent `overviewNodes` array and a custom `Overview` SVG. This made its opening look different from the known approved map. It was wrong in principle even if it was visually legible.

## Verified correct source

- Approved SHOT 08 enters the original Living Architecture Map via `UserDatabaseV8Premium`'s `OriginalMap`.
- `OriginalMap` reuses `AuthServiceTier2Shot08BridgeV8` with `<Sequence from={-4881}>`, the original SHOT07 configuration `ANCHORS`/`STARTS` and its real map.
- `AuthServiceTier2Shot08BridgeV8` itself renders `NetworkTransitYoutubePreview` → `ReadyNotSentYoutubePreview`, the same diagram lineage throughout earlier episodes.
- SHOT 09 DirectorVoiceV3 imports that same `AuthServiceTier2Shot08BridgeV8` and passes the copied **exact original approved** anchor/start values; it does NOT create fresh diagram nodes or redraw architecture.
- It animates camera pan/zoom toward the actual Auth Service position (~x1480 y610 in the approved scene), leaves User Database nearby, and transitions at ~8–11 seconds to the separate rich verification screens from V2.
- Normal continuation includes password verification, success decision, authentication vs authorization and authentication-state handoff; those are detailed local-inspection panels, not substitute global diagrams.
- Original SHOT09 C01–C04 ElevenLabs clips remain immutable, 4090 frames/30fps for V3, original voice starts [18,1104,2051,3031], clip frames [1074,935,968,966].
- Do not change SHOT01–08 or their original rendered MP4s; SHOT09 V3 remains Director Review Draft until explicit approval.

## Source changes

`remotion-engine/src/episodes/ep001/live-diagram/Shot09DirectorVoiceV3.tsx` — canonical map reuse and camera composition;
`remotion-engine/src/Root.tsx` — independent `EP001-Shot09-DirectorVoiceV3` composition;
`backend/src/main/java/com/architecturalthinking/mediaos/remotion/RemotionRenderController.java` — V3 render registration.

**Permanent rule:** When narration returns to the architecture-wide view, locate the exact locked-map component from previously approved material, reuse that source and update *camera focus / state overlays only*. If an existing source cannot represent a necessary change, propose a minimal extension of the canonical map instead of building a second visual architecture. This applies to SHOT 09 and all later episodes and automation agents.
