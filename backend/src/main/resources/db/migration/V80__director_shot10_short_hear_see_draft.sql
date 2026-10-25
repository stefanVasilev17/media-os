create table if not exists episode_director_shot_draft (
    episode_id uuid not null references episode(id),
    shot_key varchar(16) not null,
    schema_version varchar(90) not null,
    status varchar(32) not null,
    payload_sha256 char(64) not null,
    payload jsonb not null,
    studio_shot_id uuid references studio_shot(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (episode_id, shot_key),
    constraint director_shot_draft_status_check check (status = 'DIRECTOR_REVIEW')
);

create unique index if not exists uq_director_shot_draft_studio_link
    on episode_director_shot_draft(studio_shot_id) where studio_shot_id is not null;
