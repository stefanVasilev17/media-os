-- Director-controlled shot script, voice, and visual revision proposals.
-- Does not update legacy EP001 SCRIPT, voice, video, render, or LOCK tables.
create table episode_shot_revision (
  id uuid primary key,
  episode_id uuid not null references episode(id),
  shot_key varchar(40) not null,
  revision int not null check (revision > 0),
  based_on_script_revision int not null check (based_on_script_revision > 0),
  is_current boolean not null default true,
  status varchar(24) not null check (status in ('DRAFT','LOCKED')),
  narration text not null,
  voice_direction text not null default '',
  visual_direction text not null default '',
  change_summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  locked_at timestamptz,
  director_note text,
  unique (episode_id, shot_key, revision)
);
create unique index idx_episode_shot_revision_current
  on episode_shot_revision(episode_id, shot_key) where is_current;
create index idx_episode_shot_revision_lock
  on episode_shot_revision(episode_id, shot_key, revision desc)
  where status='LOCKED';

create table episode_shot_revision_message (
  id uuid primary key,
  episode_id uuid not null references episode(id),
  shot_key varchar(40) not null,
  sender varchar(16) not null check (sender in ('USER','AGENT','SYSTEM')),
  content text not null,
  source varchar(20) not null check (source in ('MANUAL','OPENAI','DIRECTOR_LOCK')),
  created_at timestamptz not null default now()
);
create index idx_episode_shot_revision_message
  on episode_shot_revision_message(episode_id, shot_key, created_at);
