create table mediaos_worker_credential (
    id uuid primary key,
    worker_id varchar(180) not null,
    token_hash char(64) not null unique,
    scope varchar(24) not null check (scope in (
        'RUNNER', 'SPLINE', 'SPLINE_SHOT', 'SPLINE_SNAPSHOT',
        'REMOTION_CPU', 'REMOTION_GPU', 'SPLINE_GPU')),
    job_id uuid,
    active boolean not null default false,
    expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    last_used_at timestamptz,
    constraint mediaos_gpu_worker_is_job_scoped check (
        scope not in ('REMOTION_GPU', 'SPLINE_GPU') or job_id is not null)
);
create index mediaos_worker_credential_active_idx
    on mediaos_worker_credential (scope, worker_id, expires_at)
    where active = true;
