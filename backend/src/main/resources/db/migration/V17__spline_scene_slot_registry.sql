create table spline_scene_slot_registry (
  id uuid primary key,
  project_id uuid not null references project(id),
  scene_fingerprint varchar(64) not null,
  capability_catalog_id uuid not null references spline_capability_catalog(id) on delete cascade,
  slot_key varchar(180) not null,
  object_uuid varchar(240) not null,
  object_name text not null,
  editor_path text,
  candidate_kind varchar(64) not null,
  status varchar(64) not null,
  semantic_role varchar(64) not null,
  address_strategy varchar(64) not null,
  placement_strategy varchar(64) not null,
  visibility_strategy varchar(64) not null,
  label_strategy varchar(64) not null,
  behavior_strategy varchar(64) not null,
  clone_strategy varchar(64) not null,
  evidence jsonb not null,
  updated_at timestamptz not null default now(),
  unique(project_id, scene_fingerprint, slot_key)
);

create index idx_spline_scene_slot_registry_scene
  on spline_scene_slot_registry(project_id, scene_fingerprint);

create index idx_spline_scene_slot_registry_name
  on spline_scene_slot_registry(project_id, object_name);
