create table episode_ai_production_authorization (
    id uuid primary key,
    request_id uuid not null unique,
    package_id uuid not null references episode_package_import(id),
    source_sha256 char(64) not null,
    readiness_fingerprint char(64) not null,
    shot_keys jsonb not null,
    repository_full_name varchar(180) not null,
    code_path_prefix varchar(240) not null,
    purpose varchar(40) not null
        check (purpose = 'SCOPED_REMOTION_SCENE_PROPOSALS'),
    max_budget_usd numeric(8,2) not null
        check (max_budget_usd >= 1.00 and max_budget_usd <= 50.00),
    max_total_tokens integer not null
        check (max_total_tokens between 1000 and 1000000),
    max_attempts integer not null
        check (max_attempts between 1 and 10),
    validity_minutes integer not null
        check (validity_minutes between 15 and 240),
    state varchar(35) not null
        check (state in ('AUTHORIZED_PENDING_EXECUTOR','REVOKED','EXPIRED','CONSUMED')),
    director_issuer text not null,
    director_subject text not null,
    preflight_audit_id uuid not null,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null,
    revoked_at timestamptz,
    consumed_at timestamptz,
    check (expires_at > created_at),
    check (expires_at <= created_at + interval '4 hours'),
    check ((state = 'REVOKED') = (revoked_at is not null)),
    check ((state = 'CONSUMED') = (consumed_at is not null))
);

create unique index episode_ai_one_pending_authorization_per_package
    on episode_ai_production_authorization(package_id)
    where state = 'AUTHORIZED_PENDING_EXECUTOR';

create index episode_ai_authorization_history
    on episode_ai_production_authorization(package_id, created_at desc);
