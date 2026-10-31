create table mediaos_local_login_throttle (
    bucket_hash char(64) primary key,
    attempts integer not null check (attempts >= 0),
    window_started_at timestamptz not null,
    updated_at timestamptz not null default now()
);

create index mediaos_local_login_throttle_updated_idx
    on mediaos_local_login_throttle (updated_at);
