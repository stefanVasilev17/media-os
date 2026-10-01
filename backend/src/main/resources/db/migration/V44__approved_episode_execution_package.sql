create table episode_execution_package (
    id uuid primary key,
    episode_id uuid not null references episode(id),
    schema_version varchar(80) not null,
    package_version varchar(40) not null,
    filename varchar(255) not null,
    content_hash varchar(64) not null,
    payload jsonb not null,
    status varchar(24) not null,
    preview_expires_at timestamptz,
    applied_at timestamptz,
    created_at timestamptz not null default now(),
    constraint episode_execution_package_status_chk check (status in ('PREVIEWED','APPLIED','SUPERSEDED')),
    unique(episode_id, content_hash)
);

create index episode_execution_package_episode_created_idx
    on episode_execution_package(episode_id, created_at desc);

create unique index episode_execution_package_current_idx
    on episode_execution_package(episode_id)
    where status='APPLIED';
