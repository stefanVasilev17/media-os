create table if not exists episode_script_director_amendment (
    id uuid primary key,
    episode_id uuid not null references episode(id) on delete cascade,
    script_revision integer not null,
    payload jsonb not null,
    created_at timestamptz not null default now(),
    unique (episode_id, script_revision)
);
