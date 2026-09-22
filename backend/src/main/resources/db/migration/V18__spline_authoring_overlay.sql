create table spline_authoring_overlay (
  id uuid primary key,
  project_id uuid not null references project(id),
  scene_fingerprint varchar(64) not null,
  slot_registry_id uuid not null references spline_scene_slot_registry(id) on delete cascade,
  slot_key varchar(180) not null,
  object_uuid varchar(240) not null,
  object_name text not null,
  editor_path text,
  status varchar(64) not null default 'PENDING_DISCOVERY',
  semantic_role varchar(64) not null default 'UNCLASSIFIED',
  requested_label_variable varchar(120) not null,
  label_target_path text,
  label_current_text text,
  state_definitions jsonb not null default '[]'::jsonb,
  action_graph jsonb not null default '[]'::jsonb,
  event_bindings jsonb not null default '[]'::jsonb,
  discovered_by varchar(120),
  discovered_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(project_id, scene_fingerprint, slot_key)
);

create index idx_spline_authoring_overlay_scene
  on spline_authoring_overlay(project_id, scene_fingerprint);

create index idx_spline_authoring_overlay_status
  on spline_authoring_overlay(project_id, status);
