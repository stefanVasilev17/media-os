create table if not exists episode_shot05_voice_revision_archive (
    id uuid primary key,
    episode_id uuid not null references episode(id) on delete cascade,
    script_revision integer not null,
    source_version varchar(12) not null,
    record_type varchar(12) not null,
    record_key varchar(80) not null,
    snapshot jsonb not null,
    audio bytea,
    remotion_render_id uuid,
    archived_at timestamptz not null default now(),
    unique (episode_id, script_revision, source_version, record_type, record_key)
);

create index if not exists idx_shot05_voice_revision_render_pin
on episode_shot05_voice_revision_archive (remotion_render_id)
where remotion_render_id is not null;
