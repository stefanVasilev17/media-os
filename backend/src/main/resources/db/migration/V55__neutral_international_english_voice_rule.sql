insert into production_memory_rule(
  id, project_id, episode_id, scope, rule_type, severity, content, source
)
values
  (
    '90000000-0000-4000-8000-000000000017',
    '11111111-1111-1111-1111-111111111111',
    null,
    'VOICE',
    'DELIVERY',
    'REQUIRED',
    'Architectural Thinking narration should target neutral international English: clear vowels and consonants, measured educational cadence, and internationally understandable pronunciation. Do not deliberately imitate a British or American regional accent. Keep the proven Eleven v4 performance tag calm, conversational, confident unless the director explicitly unlocks it. Use English language context for TTS generation.',
    'Creator correction · 2026-10-13'
  )
on conflict (id) do update
set content=excluded.content,
    severity=excluded.severity,
    source=excluded.source,
    active=true,
    updated_at=now();
