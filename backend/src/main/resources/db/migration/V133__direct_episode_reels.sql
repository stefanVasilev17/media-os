-- Direct Full Video extracts only; private MP4s remain in existing object storage.
create table episode_reel (
    id uuid primary key,
    package_id uuid not null references episode_package_import(id),
    film_id uuid not null,
    master_sha256 varchar(64) not null check(master_sha256 ~ '^[a-f0-9]{64}$'),
    title varchar(160) not null,
    start_frame integer not null check(start_frame>=0),
    end_frame integer not null check(end_frame>start_frame and end_frame-start_frame<=5400),
    state varchar(12) not null check(state in ('QUEUED','RUNNING','READY','FAILED','LOCKED')),
    audit_id uuid not null,
    actor varchar(256) not null,
    object_key varchar(240),
    sha256 varchar(64),
    byte_count bigint,
    method varchar(24),
    issue varchar(400),
    lease_until timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    locked_at timestamptz,
    unique(package_id,film_id,start_frame,end_frame),
    check ((state in ('READY','LOCKED') and object_key is not null and sha256 ~ '^[a-f0-9]{64}$'
         and byte_count between 1024 and 134217728 and method in ('STREAM_COPY','TECHNICAL_ENCODE'))
       or (state in ('QUEUED','RUNNING','FAILED') and object_key is null and sha256 is null and byte_count is null)),
    check ((state='LOCKED') = (locked_at is not null))
);
create index episode_reel_package_idx on episode_reel(package_id,film_id,start_frame);
-- One active extraction globally, not a per-episode clip-count quota.
create unique index episode_reel_single_active on episode_reel ((1)) where state='RUNNING';
