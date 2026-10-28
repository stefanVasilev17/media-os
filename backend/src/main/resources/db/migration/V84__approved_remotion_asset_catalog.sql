-- A queryable index of canonical Remotion components, not a replacement for TS registry.
create table if not exists production_asset_catalog (
  project_id uuid not null references project(id),
  asset_key varchar(120) not null,
  status varchar(40) not null,
  source_path text not null,
  created_at timestamptz not null default now(),
  primary key (project_id, asset_key)
);

insert into production_asset_catalog(project_id,asset_key,status,source_path) values
('11111111-1111-1111-1111-111111111111','ATBackground','LOCKED','remotion-engine/src/components/architectural-thinking/registry.ts'),
('11111111-1111-1111-1111-111111111111','ATPhone','LOCKED','remotion-engine/src/components/architectural-thinking/registry.ts'),
('11111111-1111-1111-1111-111111111111','ATSecondaryStack','LOCKED','remotion-engine/src/components/architectural-thinking/registry.ts'),
('11111111-1111-1111-1111-111111111111','ATSecondarySection','LOCKED','remotion-engine/src/components/architectural-thinking/registry.ts'),
('11111111-1111-1111-1111-111111111111','ATSemanticPill','LOCKED','remotion-engine/src/components/architectural-thinking/registry.ts'),
('11111111-1111-1111-1111-111111111111','ATActiveState','LOCKED','remotion-engine/src/components/architectural-thinking/registry.ts'),
('11111111-1111-1111-1111-111111111111','ATConnector','LOCKED','remotion-engine/src/components/architectural-thinking/registry.ts'),
('11111111-1111-1111-1111-111111111111','ATCameraRig','LOCKED','remotion-engine/src/components/architectural-thinking/registry.ts'),
('11111111-1111-1111-1111-111111111111','ATPrimaryNode','LOCKED','remotion-engine/src/components/architectural-thinking/registry.ts'),
('11111111-1111-1111-1111-111111111111','ATMiniWorld','LOCKED','remotion-engine/src/components/architectural-thinking/registry.ts'),
('11111111-1111-1111-1111-111111111111','ATConnectionPath','LOCKED','remotion-engine/src/components/architectural-thinking/registry.ts'),
('11111111-1111-1111-1111-111111111111','ATFlowArrow','LOCKED','remotion-engine/src/components/architectural-thinking/registry.ts')
on conflict (project_id,asset_key) do update set status=excluded.status,source_path=excluded.source_path;

alter table production_preflight_audit
  add column if not exists policy_version varchar(160),
  add column if not exists approved_asset_count integer not null default 0;
