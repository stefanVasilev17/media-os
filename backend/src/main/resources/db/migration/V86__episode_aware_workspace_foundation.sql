-- Episode-aware workspaces are isolated from EP001 legacy production data.
-- These tables contain *references* to approved reusable assets and auditable
-- Director decisions; they do not duplicate or mutate the locked EP001 media.
create table episode_asset_reference (
  episode_id uuid not null references episode(id) on delete cascade,
  project_id uuid not null references project(id),
  asset_key varchar(120) not null,
  reference_type varchar(40) not null default 'APPROVED_REUSE',
  notes text not null default '',
  created_at timestamptz not null default now(),
  primary key (episode_id, asset_key),
  foreign key (project_id, asset_key) references production_asset_catalog(project_id, asset_key)
);

create index idx_episode_asset_reference_project on episode_asset_reference(project_id, episode_id);

create table episode_workspace_event (
  id uuid primary key,
  episode_id uuid not null references episode(id) on delete cascade,
  stage_key varchar(60),
  event_type varchar(60) not null,
  revision integer,
  note text not null default '',
  preflight_audit_id uuid references production_preflight_audit(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_episode_workspace_event_episode_created
  on episode_workspace_event(episode_id, created_at desc);
-- Don't invent a LOCK or an episode during migration. EP002–EP005 may only be
-- created through the authenticated Director workflow in a later release.
