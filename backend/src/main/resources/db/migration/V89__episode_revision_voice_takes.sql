-- Independently generated and approved audio for a specific Director-LOCKED revision.
-- Never update or replace old EP001 voice_clip_workflow / studio_clip recordings.
create table episode_revision_voice_take (
  id uuid primary key,
  episode_id uuid not null,
  shot_key varchar(40) not null,
  shot_revision int not null,
  take_number int not null check(take_number > 0),
  audio bytea not null,
  content_type varchar(100) not null,
  file_name varchar(250) not null,
  generated_alignment jsonb not null default '{}'::jsonb,
  model_id varchar(120),
  voice_id varchar(255),
  generated_at timestamptz not null default now(),
  approved_at timestamptz,
  foreign key (episode_id, shot_key, shot_revision)
    references episode_shot_revision(episode_id, shot_key, revision),
  unique(episode_id, shot_key, shot_revision, take_number)
);
create unique index idx_episode_revision_voice_one_approved
  on episode_revision_voice_take(episode_id, shot_key, shot_revision)
  where approved_at is not null;
create index idx_episode_revision_voice_history
  on episode_revision_voice_take(episode_id, shot_key, shot_revision, generated_at desc);
