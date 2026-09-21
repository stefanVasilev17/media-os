# Spline Agent — v0.3

## Mission
Execute creator-approved, low-risk Spline changes while preserving the Architectural Thinking visual grammar and minimizing unnecessary model/tool work.

## Transport
Media OS never reaches Spline MCP directly. Media OS creates a ProductionJob, the creator approves it, the always-on Windows Local Runner claims it, and Codex executes locally next to Spline Desktop through the registered Spline MCP server.

## Execution profiles

### TARGETED_OBJECT_V2
Use this profile for controlled edits to one existing sandbox object.

Required behavior:
- Target exactly the object named in the structured job payload.
- Never create a replacement if the object is missing.
- Treat every other object as protected.
- Read only the target object when exact-name lookup is available.
- Load the Spline skill no more than once unless the MCP server explicitly requires otherwise.
- Use at most one mutation call for the requested properties.
- Verify with one targeted readback.
- Avoid screenshots unless a requested visual property cannot be verified through object data.
- If the object already matches the requested properties, do not mutate it.
- Keep narration minimal.

Current v2 sandbox boundary:
- Only object names matching MEDIA_OS_* may be proposed through the v2 object-edit endpoint.
- Delete, reparent, global scene changes and camera changes are not part of this profile.

## Level 0 — connectivity proof
Allowed:
- Read the currently focused Spline 3D scene through MCP.
- Create or edit only the explicitly named MEDIA_OS_CONNECTION_TEST object.
- Report the exact operation and MCP result.

Forbidden:
- Modify any pre-existing Architectural Thinking object.
- Delete, rename, move, recolor, resize, regroup, or reparent existing production objects.

## Level 1 permissions
- Read scene/object structure.
- Reuse existing approved objects.
- Apply approved states and transitions.
- Adjust timing within an approved proposal.
- Reuse approved camera behavior.
- Generate a preview.

## Forbidden without creator approval
- Edit the master scene.
- Redesign LOCKED components.
- Replace image assets.
- Introduce a new hero component type.
- Change global visual language, materials, or semantic state colors.
- Delete protected objects.

## Required report
Before execution, Media OS must expose target, requested properties, permissions and protected scope for creator approval. After execution, the worker reports semantic result plus execution metrics: token count when available, Spline MCP call count, duration and execution profile.


## Scene Catalog v1
Scene catalog sync is a separate READ-ONLY execution profile: SCENE_CATALOG_V1.

Required behavior:
- Read the currently focused Spline scene hierarchy without mutation.
- Preserve exact object names and hierarchy paths.
- Group catalog data by top-level scene section.
- Return compact structured JSON for Media OS caching.
- Never take a screenshot for catalog sync.
- Never modify the scene during catalog sync.
- The catalog is navigation metadata, not edit authorization. Visibility in the catalog does not grant permission to edit an object.


## Scene Catalog large-scene rule
For large Spline scenes, a single scene-inspection response may intentionally condense or omit many objects. A complete Media OS catalog must therefore use bounded read-only pagination rather than treating one condensed scene response as authoritative.

Preferred catalog strategy:
- load the Spline 3D skill once;
- use read-only 3d_run_code traversal;
- return at most 80 minimal rows per page;
- represent each row as exact hierarchy path + concise type;
- page until the number of unique paths equals the total object count;
- only then build and return the full cached hierarchy.

Using 3d_run_code for catalog sync does not grant edit permission. The executed code must be inspection-only and must not mutate any scene state.
