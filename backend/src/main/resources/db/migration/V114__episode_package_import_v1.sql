create table episode_package_import (
    id uuid primary key,
    request_id uuid not null unique,
    episode_key varchar(24) not null unique,
    title varchar(180) not null,
    schema_version varchar(80) not null check (schema_version='mediaos.episode-package.v1'),
    source_file_name varchar(140) not null,
    source_sha256 char(64) not null,
    original_source_text text not null,
    source_document jsonb not null,
    shot_count integer not null check (shot_count between 1 and 40),
    beat_count integer not null check (beat_count > 0),
    status varchar(32) not null default 'VOICE_TASKS_READY'
        check (status='VOICE_TASKS_READY'),
    director_issuer text not null,
    director_subject text not null,
    imported_at timestamptz not null default now()
);

create table episode_package_shot (
    id uuid primary key,
    package_id uuid not null references episode_package_import(id),
    shot_key varchar(6) not null,
    shot_index integer not null check (shot_index between 1 and 40),
    title varchar(180) not null,
    original_narration text not null,
    original_voice_direction varchar(1200) not null,
    original_visual_story jsonb not null,
    editorial_seconds integer not null check (editorial_seconds between 3 and 400),
    voice_task_status varchar(32) not null default 'PENDING_VOICE'
        check (voice_task_status='PENDING_VOICE'),
    created_at timestamptz not null default now(),
    unique(package_id,shot_key),
    unique(package_id,shot_index)
);

create index episode_package_shot_by_package
    on episode_package_shot(package_id,shot_index);
