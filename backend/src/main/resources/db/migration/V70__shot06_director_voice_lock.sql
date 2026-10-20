create table if not exists shot06_director_voice_lock (
  episode_id uuid not null,
  script_revision integer not null,
  shot_key varchar(16) not null default 'SHOT 06',
  version varchar(32) not null,
  narration_sha256 varchar(64) not null,
  payload jsonb not null,
  locked_at timestamptz not null default now(),
  primary key (episode_id, script_revision, shot_key),
  constraint shot06_director_voice_lock_only_shot06 check (shot_key='SHOT 06')
);
