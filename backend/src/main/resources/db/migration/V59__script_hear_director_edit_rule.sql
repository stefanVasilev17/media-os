insert into production_memory_rule(
  id, project_id, episode_id, scope, rule_type, severity, content, source
)
values (
  '90000000-0000-4000-8000-000000000022',
  '11111111-1111-1111-1111-111111111111',
  null,
  'SCRIPT',
  'DIRECTOR_EDIT',
  'REQUIRED',
  'LOCKED Script structure, shot/clip identity, and timing remain immutable, but WHAT YOU HEAR may receive an explicit Director narration edit before the corresponding voice clip is approved. Saving that edit becomes the effective downstream narration, invalidates stale unapproved generated audio for that clip, and routes directly to the matching Voice Generation target. Approved/LOCKED voice clips must not be silently overwritten.',
  'Director workflow correction · 2026-10-13'
)
on conflict (id) do update
set content=excluded.content,
    severity=excluded.severity,
    source=excluded.source,
    active=true,
    updated_at=now();
