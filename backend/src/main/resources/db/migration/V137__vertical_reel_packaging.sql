-- Immutable separate technical 9:16 derivative of an already LOCKED direct reel.
create table episode_reel_vertical (
    reel_id uuid primary key references episode_reel(id),
    source_sha256 varchar(64) not null check(source_sha256 ~ '^[a-f0-9]{64}$'),
    template_version varchar(32) not null check(template_version='AT_VERTICAL_V1'),
    state varchar(12) not null check(state in ('QUEUED','RUNNING','READY','FAILED','LOCKED')),
    audit_id uuid not null,
    actor varchar(256) not null,
    object_key varchar(240),
    sha256 varchar(64),
    byte_count bigint,
    issue varchar(400),
    lease_until timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    locked_at timestamptz,
    check ((state in ('READY','LOCKED') and object_key is not null and sha256 ~ '^[a-f0-9]{64}$'
        and byte_count between 1024 and 134217728)
        or (state in ('QUEUED','RUNNING','FAILED') and object_key is null and sha256 is null and byte_count is null)),
    check ((state='LOCKED')=(locked_at is not null))
);
create unique index episode_reel_vertical_single_active on episode_reel_vertical ((1)) where state='RUNNING';
