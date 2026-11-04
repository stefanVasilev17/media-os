create table episode_multi_shot_director_start (
    id uuid primary key,
    request_id uuid not null unique,
    job_id uuid not null unique references episode_multi_shot_execution_job(id),
    package_id uuid not null references episode_package_import(id),
    authorization_id uuid not null references episode_ai_production_authorization(id),
    original_source_sha256 char(64) not null,
    readiness_fingerprint char(64) not null,
    production_input_sha256 char(64) not null,
    pinned_git_commit char(40) not null,
    dependency_sha256 char(64) not null,
    asset_catalog_sha256 char(64) not null,
    expected_shot_count integer not null check (expected_shot_count between 1 and 40),
    director_issuer text not null,
    director_subject text not null,
    preflight_audit_id uuid not null,
    state varchar(36) not null default 'APPROVED_NO_DISPATCH'
        check (state in ('APPROVED_NO_DISPATCH','REVOKED')),
    approved_at timestamptz not null default now(),
    revoked_at timestamptz,
    check ((state='REVOKED') = (revoked_at is not null))
);

create index episode_multi_shot_director_start_package
    on episode_multi_shot_director_start(package_id,approved_at desc);
