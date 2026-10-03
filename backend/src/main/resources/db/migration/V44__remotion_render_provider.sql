create table remotion_render (
  id uuid primary key,
  project_id uuid not null references project(id) on delete cascade,
  episode_id uuid references episode(id) on delete cascade,
  composition_id varchar(120) not null,
  render_key varchar(120) not null,
  engine_version varchar(80) not null,
  input_props jsonb not null default '{}'::jsonb,
  render_hash varchar(96) not null,
  profile varchar(32) not null,
  status varchar(24) not null,
  width int not null,
  height int not null,
  fps int not null,
  duration_in_frames int not null,
  progress int not null default 0,
  worker_id varchar(160),
  media_type varchar(80),
  video_data bytea,
  object_url text,
  size_bytes bigint,
  error text,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint remotion_render_profile_chk check (profile in ('FAST_PREVIEW','REVIEW','MASTER','REEL')),
  constraint remotion_render_status_chk check (status in ('QUEUED','RUNNING','SUCCEEDED','FAILED')),
  unique (project_id, render_hash)
);

create index idx_remotion_render_project_created
  on remotion_render(project_id, created_at desc);

create index idx_remotion_render_queue
  on remotion_render(status, created_at);

create index idx_remotion_render_composition
  on remotion_render(project_id, composition_id, created_at desc);

insert into agent_profile(id, agent_key, name, instructions_version, permission_level, enabled)
values (
  '33333333-3333-3333-3333-333333333338',
  'REMOTION_PRODUCTION_AGENT',
  'Remotion Production Agent',
  '1.0',
  'LEVEL_1',
  false
)
on conflict (agent_key) do update
set name=excluded.name,
    instructions_version=excluded.instructions_version,
    permission_level=excluded.permission_level;
