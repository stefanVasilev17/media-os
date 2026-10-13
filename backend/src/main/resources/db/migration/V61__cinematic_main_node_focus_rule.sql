insert into production_memory_rule(
  id, project_id, episode_id, scope, rule_type, severity, content, source
)
values
  (
    '90000000-0000-4000-8000-000000000025',
    '11111111-1111-1111-1111-111111111111',
    null,
    'VISUAL',
    'CAMERA',
    'REQUIRED',
    'Architectural Thinking living architecture scenes must treat the main object being explained as the visual hero. Begin in the shared overview, smoothly and visibly zoom the camera toward the active primary node, strongly dim competing nodes and background detail without cheap blur, reveal legible secondary mini-worlds at their spoken anchors, then ease back to an overview that prepares the next primary node. Reuse the cinematic focus choreography from EP001 SHOT 04 for SHOT 05 API Gateway, SHOT 06 Load Balancer, SHOT 07 Auth Service, SHOT 08 User Database and following episodes. Do not modify prior Director-LOCKED shots.',
    'Director approval · SHOT 04 cinematic-focus pass · 2026-10-13'
  ),
  (
    '90000000-0000-4000-8000-000000000026',
    '11111111-1111-1111-1111-111111111111',
    null,
    'VISUAL',
    'MOTION',
    'REQUIRED',
    'Active requests travelling between Architectural Thinking nodes must use a small circular green-cyan luminous pulse with subtle glow, centered on their actual connector paths and moving deterministically with spoken semantic anchors. Never use a detached rectangular or square request indicator. Preserve exact opening-frame continuity with the previous Director-LOCKED shot, including a short crossfade from any legacy marker.',
    'Director approval · SHOT 04 request-marker correction · 2026-10-13'
  )
on conflict (id) do update
set content=excluded.content,
    severity=excluded.severity,
    source=excluded.source,
    active=true,
    updated_at=now();
