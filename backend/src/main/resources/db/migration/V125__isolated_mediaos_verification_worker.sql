create table mediaos_verification_run (
    id uuid primary key,
    request_id uuid not null unique,
    episode_key varchar(8) not null default 'EP002'
        check (episode_key = 'EP002'),
    source_repo varchar(160) not null default 'stefanVasilev17/media-os'
        check (source_repo = 'stefanVasilev17/media-os'),
    source_branch varchar(160) not null default
        'feat/mediaos-ep002-unified-product-integration'
        check (source_branch = 'feat/mediaos-ep002-unified-product-integration'),
    source_commit char(40) not null check (source_commit ~ '^[0-9a-f]{40}$'),
    state varchar(24) not null default 'QUEUED'
        check (state in ('QUEUED','RUNNING','PASSED','FAILED','UNKNOWN','CANCELLED')),
    worker_id varchar(180),
    lease_id uuid,
    stage_results jsonb not null default '[]'::jsonb
        check (jsonb_typeof(stage_results) = 'array'),
    failure_reason varchar(160),
    director_issuer text not null,
    director_subject text not null,
    preflight_audit_id uuid not null,
    queued_at timestamptz not null default now(),
    claimed_at timestamptz,
    finished_at timestamptz,
    updated_at timestamptz not null default now(),
    constraint mediaos_verification_claim_binding check (
        (state = 'QUEUED' and worker_id is null and lease_id is null)
        or state <> 'QUEUED'
    )
);
create unique index mediaos_verification_one_active_run
    on mediaos_verification_run ((1))
    where state in ('QUEUED','RUNNING','UNKNOWN');
create index mediaos_verification_director_history
    on mediaos_verification_run (director_issuer,director_subject,queued_at desc);

create table mediaos_verification_auto_policy (
    id uuid primary key,
    request_id uuid not null unique,
    director_issuer text not null,
    director_subject text not null,
    preflight_audit_id uuid not null,
    state varchar(24) not null default 'ARMED'
        check(state in ('ARMED','PAUSED')),
    max_runs integer not null check(max_runs between 1 and 20),
    submitted_count integer not null default 0 check(submitted_count between 0 and 20),
    last_queued_commit char(40) check(last_queued_commit ~ '^[0-9a-f]{40} if exists mediaos_worker_credential_scope_check;
alter table mediaos_worker_credential
    add constraint mediaos_worker_credential_scope_check check (
        scope in ('RUNNER','SPLINE','SPLINE_SHOT','SPLINE_SNAPSHOT',
                  'REMOTION_CPU','REMOTION_GPU','SPLINE_GPU','VERIFICATION')
    );
),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create unique index mediaos_verification_one_armed_auto_policy
    on mediaos_verification_auto_policy ((1)) where state='ARMED';
alter table mediaos_verification_run
    add column auto_policy_id uuid references mediaos_verification_auto_policy(id);
alter table mediaos_verification_run
    add column cancellation_audit_id uuid;

alter table mediaos_worker_credential
    drop constraint if exists mediaos_worker_credential_scope_check;
alter table mediaos_worker_credential
    add constraint mediaos_worker_credential_scope_check check (
        scope in ('RUNNER','SPLINE','SPLINE_SHOT','SPLINE_SNAPSHOT',
                  'REMOTION_CPU','REMOTION_GPU','SPLINE_GPU','VERIFICATION')
    );
