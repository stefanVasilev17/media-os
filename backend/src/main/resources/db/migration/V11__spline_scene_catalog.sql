create table spline_scene_catalog (
  id uuid primary key,
  project_id uuid not null references project(id),
  scene_name varchar(240) not null,
  object_count integer not null default 0,
  root_section_count integer not null default 0,
  worker_id varchar(160) not null,
  catalog jsonb not null,
  synced_at timestamptz not null default now()
);

create index idx_spline_scene_catalog_project_synced
  on spline_scene_catalog(project_id, synced_at desc);
