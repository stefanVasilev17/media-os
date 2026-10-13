insert into production_memory_rule(
  id, project_id, episode_id, scope, rule_type, severity, content, source
)
values
  (
    '90000000-0000-4000-8000-000000000018',
    '11111111-1111-1111-1111-111111111111',
    null,
    'VISUAL',
    'MOTION',
    'REQUIRED',
    'LOCKED: Semantic visual time must be monotonic. A transition between semantic objects must never map the canonical visual frame backward, even for comprehension holds or voice pacing adjustments.',
    'Director LOCK · 2026-10-13'
  ),
  (
    '90000000-0000-4000-8000-000000000019',
    '11111111-1111-1111-1111-111111111111',
    null,
    'VISUAL',
    'MOTION',
    'REQUIRED',
    'LOCKED: Every green ACTIVE secondary object uses local activation timing. Its travelling sweep starts at the left edge when that object becomes active, crosses the object once, and does not inherit or loop from the global frame phase. After the sweep, the object remains visibly active while it is being explained.',
    'Director LOCK · 2026-10-13'
  ),
  (
    '90000000-0000-4000-8000-000000000020',
    '11111111-1111-1111-1111-111111111111',
    null,
    'VISUAL',
    'RENDERING',
    'REQUIRED',
    'LOCKED: Remotion render cache identity must change when Remotion visual code changes. Production rendering must include the deployed source revision or equivalent engine version in the render hash so visual fixes can never silently reuse an older MP4.',
    'Director LOCK · 2026-10-13'
  )
on conflict (id) do update
set content=excluded.content,
    severity=excluded.severity,
    source=excluded.source,
    active=true,
    updated_at=now();
