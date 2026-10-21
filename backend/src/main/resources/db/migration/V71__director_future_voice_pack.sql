create table if not exists episode_director_voice_pack (
  episode_id uuid not null references episode(id),
  script_revision integer not null,
  schema_version varchar(80) not null,
  source_version varchar(80) not null,
  narration_sha256 char(64) not null,
  payload_sha256 char(64) not null,
  payload jsonb not null,
  locked_at timestamptz not null default now(),
  primary key (episode_id, script_revision)
);
