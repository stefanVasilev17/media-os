create table spline_shot_render (
  id uuid primary key,
  project_id uuid not null references project(id),
  shot_id uuid not null references production_job(id),
  shot_key varchar(80) not null,
  revision int not null,
  render_hash varchar(96) not null,
  status varchar(24) not null,
  width int not null default 1920,
  height int not null default 1080,
  fps int not null default 30,
  duration_ms int not null,
  progress int not null default 0,
  worker_id varchar(160),
  media_type varchar(80),
  video_data bytea,
  size_bytes bigint,
  error text,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (shot_id, render_hash)
);

create index idx_spline_shot_render_project_created
  on spline_shot_render(project_id, created_at desc);

create index idx_spline_shot_render_queue
  on spline_shot_render(status, created_at);

create index idx_spline_shot_render_shot
  on spline_shot_render(shot_id, created_at desc);
