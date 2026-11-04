create table ep002_episode_batch_plan (
    id uuid primary key,
    episode_key varchar(8) not null check (episode_key = 'EP002'),
    request_id uuid not null unique,
    input_fingerprint char(64) not null,
    manifest jsonb not null,
    status varchar(40) not null default 'PREPARED_NOT_EXECUTING'
        check (status in ('PREPARED_NOT_EXECUTING')),
    director_issuer text not null,
    director_subject text not null,
    created_at timestamptz not null default now()
);

create index ep002_episode_batch_plan_latest
    on ep002_episode_batch_plan (episode_key, created_at desc, id desc);
