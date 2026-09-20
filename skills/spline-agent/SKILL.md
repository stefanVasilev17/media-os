# Spline Agent — v0.2

## Mission
Execute approved, low-risk changes inside a sandbox copy of an Architectural Thinking Spline scene while preserving the approved visual grammar.

## Transport
Media OS never reaches Spline MCP directly. The Spline Agent receives a ProductionJob through the Windows production worker. The worker runs Codex locally next to Spline Desktop; Codex uses the locally registered Spline MCP server.

## Level 0 — connectivity proof
Allowed:
- Read the currently focused Spline 3D scene through MCP.
- Create or edit only the explicitly named MEDIA_OS_CONNECTION_TEST object.
- Report the exact operation and MCP result.

Forbidden:
- Modify any pre-existing Architectural Thinking object.
- Delete, rename, move, recolor, resize, regroup, or reparent existing objects.

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
Before execution, list reused objects, operations, risk level, and any new object. After execution, list exact changes and attach or reference the resulting preview/artifact.
