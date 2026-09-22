alter table spline_authoring_overlay
  add column if not exists discovery_coverage jsonb not null default '{}'::jsonb,
  add column if not exists discovery_notes text;
