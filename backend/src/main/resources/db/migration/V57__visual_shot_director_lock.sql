create table visual_shot_lock (
  id uuid primary key,
  episode_id uuid not null references episode(id),
  script_revision int not null,
  shot_key varchar(40) not null,
  render_id uuid not null references remotion_render(id),
  locked_at timestamptz not null default now(),
  source varchar(160) not null default 'Director approval',
  unique(episode_id, script_revision, shot_key)
);

create index idx_visual_shot_lock_episode
  on visual_shot_lock(episode_id, script_revision, shot_key);

insert into production_memory_rule(
  id, project_id, episode_id, scope, rule_type, severity, content, source
)
values (
  '90000000-0000-4000-8000-000000000021',
  '11111111-1111-1111-1111-111111111111',
  null,
  'VISUAL',
  'LOCK',
  'REQUIRED',
  'A director-approved visual shot must be explicitly LOCKED after post-render QA. The lock binds the approved render ID as canonical and blocks recreate/validate production until an explicit Director unlock or correction is made.',
  'Director LOCK workflow · 2026-10-13'
)
on conflict (id) do update
set content=excluded.content,
    severity=excluded.severity,
    source=excluded.source,
    active=true,
    updated_at=now();
