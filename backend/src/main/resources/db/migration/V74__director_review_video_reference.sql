create table if not exists episode_director_reference_video (
  episode_id uuid not null references episode(id),
  script_revision integer not null,
  shot_key varchar(16) not null,
  version varchar(32) not null,
  content_sha256 char(64) not null,
  size_bytes bigint not null,
  media_type varchar(100) not null,
  video_data bytea not null,
  uploaded_at timestamptz not null default now(),
  primary key (episode_id,script_revision,shot_key,version)
);
