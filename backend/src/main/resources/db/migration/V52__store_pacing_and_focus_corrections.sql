insert into production_memory_rule(
  id, project_id, episode_id, scope, rule_type, severity, content, source
)
values
  (
    '90000000-0000-4000-8000-000000000011',
    '11111111-1111-1111-1111-111111111111',
    null,
    'VISUAL',
    'PREFERENCE',
    'REQUIRED',
    'Green semantic focus states must use a slower travelling highlight and remain visually dominant while the corresponding concept is spoken. Prefer semantic voice anchors over approximate fixed seconds.',
    'Creator correction · 2026-10-12'
  ),
  (
    '90000000-0000-4000-8000-000000000012',
    '11111111-1111-1111-1111-111111111111',
    null,
    'VOICE',
    'PACING',
    'REQUIRED',
    'Final narration pacing must not contain silent gaps longer than 1.0 second unless the director explicitly approves the pause. Prefer meaningful added narration and measured delivery over stretching visuals across silence.',
    'Creator correction · 2026-10-12'
  ),
  (
    '90000000-0000-4000-8000-000000000013',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'VISUAL',
    'BEHAVIOR',
    'REQUIRED',
    'In EP001, pressing the Login action must immediately transition the button into a visible working state with a rotating spinner until the UI reaches Waiting.',
    'Creator correction · 2026-10-12'
  )
on conflict (id) do update
set content=excluded.content,
    severity=excluded.severity,
    source=excluded.source,
    active=true,
    updated_at=now();
