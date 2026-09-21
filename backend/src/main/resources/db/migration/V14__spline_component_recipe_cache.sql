create table spline_component_recipe (
  id uuid primary key,
  project_id uuid not null references project(id),
  reference_object_name varchar(180) not null,
  recipe_version integer not null default 1,
  recipe jsonb not null,
  source_worker_id varchar(180),
  learned_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, reference_object_name)
);

create index idx_spline_component_recipe_project_reference
  on spline_component_recipe(project_id, reference_object_name);
