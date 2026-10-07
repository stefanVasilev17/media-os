create table voice_shot_workflow (
  id uuid primary key,
  episode_id uuid not null references episode(id) on delete cascade,
  script_revision int not null,
  shot_key varchar(40) not null,
  shot_title varchar(180) not null,
  start_second int not null,
  end_second int not null,
  narration text not null,
  voice_direction text not null default '',
  recorded_at timestamptz,
  audio_file_name varchar(512),
  alignment jsonb,
  aligned_at timestamptz,
  visual_sync_spec jsonb,
  visual_sync_markdown text,
  visual_sync_ready_at timestamptz,
  remotion_synced_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(episode_id, script_revision, shot_key),
  check (start_second >= 0),
  check (end_second > start_second)
);

create index idx_voice_shot_workflow_episode_revision
  on voice_shot_workflow(episode_id, script_revision, start_second);
