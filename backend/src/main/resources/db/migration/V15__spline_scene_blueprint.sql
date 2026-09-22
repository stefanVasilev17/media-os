create table spline_scene_blueprint (
  id uuid primary key,
  project_id uuid not null references project(id),
  schema_version integer not null,
  scene_url text not null,
  scene_fingerprint varchar(64) not null,
  object_count integer not null,
  variable_count integer not null default 0,
  event_definition_count integer not null default 0,
  capability_summary jsonb not null default '{}'::jsonb,
  blueprint jsonb not null,
  captured_at timestamptz not null default now(),
  unique(project_id, scene_fingerprint)
);

create index idx_spline_scene_blueprint_project_captured
  on spline_scene_blueprint(project_id, captured_at desc);
