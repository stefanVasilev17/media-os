create table spline_director_memory (
  id uuid primary key,
  project_id uuid not null references project(id),
  scope varchar(40) not null,
  shot_key varchar(80),
  source_production_job_id uuid references production_job(id),
  feedback text not null,
  created_at timestamptz not null default now()
);

create index idx_spline_director_memory_project_created
  on spline_director_memory(project_id, created_at desc);

create index idx_spline_director_memory_shot_created
  on spline_director_memory(project_id, shot_key, created_at desc);
