create table episode_multi_shot_execution_job (
    id uuid primary key,
    request_id uuid not null unique,
    authorization_id uuid not null unique references episode_ai_production_authorization(id),
    package_id uuid not null references episode_package_import(id),
    episode_key varchar(24) not null,
    source_sha256 char(64) not null,
    readiness_fingerprint char(64) not null,
    input_manifest jsonb not null,
    repository_full_name varchar(180) not null,
    code_path_prefix varchar(240) not null,
    state varchar(40) not null default 'PREPARED_NO_DISPATCH'
        check (state in ('PREPARED_NO_DISPATCH','CANCELLED',
                         'STOPPED_BUDGET','STOPPED_UNCERTAIN',
                         'RUNNING','AWAITING_DIRECTOR_REVIEW','FAILED','COMPLETED')),
    max_budget_usd numeric(8,2) not null check (max_budget_usd between 1 and 50),
    max_total_tokens integer not null check (max_total_tokens between 1000 and 1000000),
    max_attempts integer not null check (max_attempts between 1 and 10),
    director_issuer text not null,
    director_subject text not null,
    preflight_audit_id uuid not null,
    created_at timestamptz not null default now(),
    cancelled_at timestamptz,
    check ((state = 'CANCELLED') = (cancelled_at is not null))
);

create unique index episode_multi_shot_one_prepared_job_per_package
    on episode_multi_shot_execution_job(package_id)
    where state = 'PREPARED_NO_DISPATCH';

create index episode_multi_shot_execution_job_package
    on episode_multi_shot_execution_job(package_id,created_at desc,id desc);

create table episode_multi_shot_execution_task (
    id uuid primary key,
    job_id uuid not null references episode_multi_shot_execution_job(id),
    shot_key varchar(6) not null,
    shot_index integer not null check (shot_index between 1 and 40),
    narration_revision integer not null check (narration_revision > 0),
    approved_take_id uuid not null references episode_package_voice_take(id),
    measured_audio_seconds numeric(12,3) not null check (measured_audio_seconds > 0),
    verified_cues jsonb not null,
    original_visual_story jsonb not null,
    task_state varchar(45) not null default 'AWAITING_AGENT_IMPLEMENTATION'
        check (task_state in ('AWAITING_AGENT_IMPLEMENTATION','PENDING',
                             'RUNNING','PROPOSAL_READY','BLOCKED','CANCELLED')),
    created_at timestamptz not null default now(),
    unique(job_id,shot_key),
    unique(job_id,shot_index)
);

create index episode_multi_shot_execution_task_job
    on episode_multi_shot_execution_task(job_id,shot_index);

create table episode_multi_shot_openai_usage (
    request_id uuid primary key,
    job_id uuid not null references episode_multi_shot_execution_job(id),
    attempt_number integer not null check (attempt_number between 1 and 10),
    shot_key varchar(6) not null,
    reserved_usd numeric(10,4) not null check (reserved_usd > 0),
    reserved_tokens integer not null check (reserved_tokens > 0),
    measured_usd numeric(10,4) check (measured_usd >= 0),
    measured_tokens integer check (measured_tokens >= 0),
    provider_request_id text,
    status varchar(25) not null
        check (status in ('RESERVED','SETTLED','UNCERTAIN','NO_CHARGE')),
    created_at timestamptz not null default now(),
    reconciled_at timestamptz,
    unique(job_id,attempt_number),
    check ((status in ('SETTLED','NO_CHARGE')) =
           (measured_usd is not null and measured_tokens is not null
            and reconciled_at is not null))
);

create unique index episode_multi_shot_one_unresolved_openai_attempt
    on episode_multi_shot_openai_usage(job_id)
    where status in ('RESERVED','UNCERTAIN');

create index episode_multi_shot_openai_usage_history
    on episode_multi_shot_openai_usage(job_id,attempt_number);
