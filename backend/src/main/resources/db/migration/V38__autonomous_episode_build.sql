create table episode_build_run (
  id uuid primary key,
  episode_id uuid not null references episode(id) on delete cascade,
  status varchar(40) not null,
  current_step varchar(60) not null,
  progress_percent int not null default 0,
  budget_minutes int not null default 20,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_episode_build_run_episode_created
  on episode_build_run(episode_id, created_at desc);

create table episode_build_step (
  id uuid primary key,
  run_id uuid not null references episode_build_run(id) on delete cascade,
  step_key varchar(60) not null,
  sequence_no int not null,
  status varchar(40) not null,
  summary text not null default '',
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(run_id, step_key)
);

create index idx_episode_build_step_run_sequence
  on episode_build_step(run_id, sequence_no);

insert into agent_profile(id, agent_key, name, instructions_version, permission_level, enabled)
values (
  '33333333-3333-3333-3333-333333333337',
  'EPISODE_BUILD_AGENT',
  'Episode Build Orchestrator',
  '1.0',
  'LEVEL_1',
  true
)
on conflict (agent_key) do update
set name=excluded.name,
    instructions_version=excluded.instructions_version,
    permission_level=excluded.permission_level,
    enabled=excluded.enabled;
