create table spline_capability_catalog (
  id uuid primary key,
  project_id uuid not null references project(id),
  scene_blueprint_id uuid not null references spline_scene_blueprint(id) on delete cascade,
  schema_version integer not null,
  scene_fingerprint varchar(64) not null,
  object_count integer not null,
  summary jsonb not null,
  catalog jsonb not null,
  built_at timestamptz not null default now(),
  unique(project_id, scene_fingerprint)
);

create index idx_spline_capability_catalog_project_built
  on spline_capability_catalog(project_id, built_at desc);
