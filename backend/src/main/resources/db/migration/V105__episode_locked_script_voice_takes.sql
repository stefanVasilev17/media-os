-- Initial voice takes are sourced from the native Director-LOCKED SCRIPT stage.
-- No fake episode_shot_revision is created and no legacy EP001 audio is modified.
create table episode_locked_script_voice_take (
  id uuid primary key,
  episode_id uuid not null references episode(id),
  shot_key varchar(40) not null,
  script_revision int not null check (script_revision > 0),
  narration_sha256 char(64) not null,
  take_number int not null check (take_number > 0),
  audio bytea not null,
  content_type varchar(100) not null,
  file_name varchar(250) not null,
  generated_alignment jsonb not null default '{}'::jsonb,
  model_id varchar(120),
  voice_id varchar(255),
  generated_at timestamptz not null default now(),
  approved_at timestamptz,
  unique (episode_id, shot_key, script_revision, take_number)
);
create unique index idx_episode_script_voice_one_approved
  on episode_locked_script_voice_take (episode_id, shot_key, script_revision)
  where approved_at is not null;
create index idx_episode_script_voice_history
  on episode_locked_script_voice_take (episode_id, shot_key, script_revision, generated_at desc);
