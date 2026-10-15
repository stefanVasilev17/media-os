create table if not exists episode_script_director_amendment_history (
    id uuid primary key,
    episode_id uuid not null references episode(id) on delete cascade,
    script_revision integer not null,
    amendment_version varchar(20) not null,
    payload jsonb not null,
    created_at timestamptz not null default now(),
    unique (episode_id, script_revision, amendment_version)
);

create index if not exists idx_episode_script_director_amendment_history_episode
on episode_script_director_amendment_history (episode_id, script_revision, created_at desc);
