create table if not exists studio_shot (
    id uuid primary key,
    episode_id uuid not null references episode(id) on delete cascade,
    shot_number integer not null check (shot_number > 0),
    title varchar(240) not null,
    visual_prompt text not null default '',
    visual_revision integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (episode_id, shot_number)
);

create table if not exists studio_clip (
    id uuid primary key,
    shot_id uuid not null references studio_shot(id) on delete cascade,
    sequence integer not null check (sequence > 0),
    narration text not null,
    voice_direction text not null default '',
    script_revision integer not null default 1,
    locked_at timestamptz,
    generated_audio bytea,
    generated_audio_content_type varchar(120),
    generated_alignment jsonb,
    generation_revision integer not null default 0,
    generated_at timestamptz,
    approved_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (approved_at is null or (locked_at is not null and generated_at is not null)),
    unique (shot_id, sequence)
);

create table if not exists studio_clip_revision_history (
    id uuid primary key,
    clip_id uuid not null references studio_clip(id) on delete cascade,
    script_revision integer not null,
    snapshot jsonb not null,
    audio bytea,
    archived_at timestamptz not null default now(),
    unique (clip_id, script_revision)
);

create table if not exists studio_visual_revision_history (
    id uuid primary key,
    shot_id uuid not null references studio_shot(id) on delete cascade,
    visual_revision integer not null,
    prompt text not null,
    archived_at timestamptz not null default now(),
    unique (shot_id, visual_revision)
);

create index if not exists idx_studio_shot_episode on studio_shot(episode_id,shot_number);
create index if not exists idx_studio_clip_shot on studio_clip(shot_id,sequence);
