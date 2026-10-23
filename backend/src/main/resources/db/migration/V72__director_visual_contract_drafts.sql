create table if not exists episode_director_visual_contract (
    episode_id uuid not null references episode(id),
    script_revision integer not null,
    shot_key varchar(16) not null,
    voice_pack_sha256 char(64) not null,
    payload_sha256 char(64) not null,
    payload jsonb not null,
    updated_at timestamptz not null default now(),
    primary key (episode_id, script_revision, shot_key)
);
