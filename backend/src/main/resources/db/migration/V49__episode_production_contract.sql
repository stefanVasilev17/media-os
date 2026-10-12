create table episode_production_contract (
  id uuid primary key,
  episode_id uuid not null references episode(id),
  script_revision int not null,
  schema_version varchar(80) not null,
  source_type varchar(40) not null,
  payload jsonb not null,
  payload_sha256 varchar(64) not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index idx_episode_production_contract_active
  on episode_production_contract(episode_id, script_revision)
  where active;

create index idx_episode_production_contract_created
  on episode_production_contract(episode_id, script_revision, created_at desc);
