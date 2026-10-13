insert into production_memory_rule(
  id, project_id, episode_id, scope, rule_type, severity, content, source
)
values
  (
    '90000000-0000-4000-8000-000000000027',
    '11111111-1111-1111-1111-111111111111',
    null,
    'VISUAL',
    'CONTINUITY',
    'REQUIRED',
    'Adjacent Director-LOCKED and new Remotion shots must match visually at the splice: reuse the precise last-frame primary-node layout, camera transform, request marker identity and position. Never cut or crossfade between a square legacy marker and a separate circular overlay at different coordinates. Morph one continuously positioned request marker only after the new shot begins; hidden new mini-world details must not reserve space or rearrange the opening frame.',
    'Director correction · SHOT 03 to SHOT 04 splice · 2026-10-13'
  ),
  (
    '90000000-0000-4000-8000-000000000028',
    '11111111-1111-1111-1111-111111111111',
    null,
    'VISUAL',
    'MOTION',
    'REQUIRED',
    'A moving request pulse must stay on real diagram connector paths or dock at a primary node entry or exit. During a primary-node explanation it must not travel through the node interior, label text, DNS mini-world, RTT or Jitter controls. If continuity requires moving between entry and exit, use a visible connector route outside the node perimeter. Never make an arbitrary horizontal pulse cross the center of a primary object.',
    'Director correction · SHOT 04 packet position · 2026-10-13'
  )
on conflict (id) do update
set content=excluded.content,
    severity=excluded.severity,
    source=excluded.source,
    active=true,
    updated_at=now();
