create table spline_snapshot (
  id uuid primary key,
  project_id uuid not null references project(id),
  worker_id varchar(180) not null,
  content_type varchar(80) not null,
  width integer not null,
  height integer not null,
  image_data bytea not null,
  captured_at timestamptz not null default now()
);

create index idx_spline_snapshot_project_captured
  on spline_snapshot(project_id, captured_at desc);

create table spline_agent_message (
  id uuid primary key,
  project_id uuid not null references project(id),
  production_job_id uuid references production_job(id),
  role varchar(24) not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_spline_agent_message_project_created
  on spline_agent_message(project_id, created_at desc);
