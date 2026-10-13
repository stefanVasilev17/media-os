insert into production_memory_rule(
  id, project_id, episode_id, scope, rule_type, severity, content, source
)
values
  (
    '90000000-0000-4000-8000-000000000023',
    '11111111-1111-1111-1111-111111111111',
    null,
    'SCRIPT',
    'DIRECTOR_EDIT',
    'REQUIRED',
    'Architectural Thinking spoken English must never contain slash-delimited names or slash-separated alternatives. Rewrite visual node names into natural, complete spoken sentences instead of saying punctuation. For SHOT 04 use "through the network", not "Network / Transit". Keep the existing LOCKED visual labels and the source Script timing/clip identities unchanged. Apply narration corrections through Director Edit before the voice clip is approved.',
    'Director correction · 2026-10-13'
  ),
  (
    '90000000-0000-4000-8000-000000000024',
    '11111111-1111-1111-1111-111111111111',
    null,
    'VOICE',
    'DELIVERY',
    'REQUIRED',
    'Never feed slash-delimited visual node titles or slash-separated alternatives into English voice synthesis. Spoken narration must be natural, with names like "Network / Transit" rewritten as "through the network". Preserve semantic anchors against the actual Director-edited spoken phrase and do not change previously LOCKED shot renderings.',
    'Director correction · 2026-10-13'
  )
on conflict (id) do update
set content=excluded.content,
    severity=excluded.severity,
    source=excluded.source,
    active=true,
    updated_at=now();
