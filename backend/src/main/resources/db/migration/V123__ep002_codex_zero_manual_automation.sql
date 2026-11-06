create table ep002_codex_automation (
    id uuid primary key,
    request_id uuid not null unique,
    episode_key varchar(8) not null default 'EP002' check(episode_key='EP002'),
    input_fingerprint char(64) not null check(input_fingerprint ~ '^[a-f0-9]{64}$'),
    max_shot_tasks integer not null default 10 check(max_shot_tasks between 1 and 20),
    state varchar(40) not null default 'ARMED_WAITING_FOR_GATES'
        check(state in ('ARMED_WAITING_FOR_GATES','PAUSED')),
    driver varchar(24) not null default 'CODEX_LOCAL_EXEC'
        check(driver in ('CODEX_CLOUD_CLI','CODEX_LOCAL_EXEC')),
    director_issuer text not null,
    director_subject text not null,
    preflight_audit_id uuid not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(director_issuer,director_subject,input_fingerprint)
);
create unique index ep002_codex_one_armed_director
    on ep002_codex_automation(director_issuer,director_subject,episode_key)
    where state='ARMED_WAITING_FOR_GATES';

create table ep002_codex_automation_task (
    id uuid primary key,
    automation_id uuid not null references ep002_codex_automation(id),
    episode_key varchar(8) not null default 'EP002' check(episode_key='EP002'),
    shot_key varchar(6) not null check(shot_key ~ '^SHOT(0[2-9]|1[01])$'),
    input_fingerprint char(64) not null check(input_fingerprint ~ '^[a-f0-9]{64}$'),
    task_input_sha256 char(64) not null check(task_input_sha256 ~ '^[a-f0-9]{64}$'),
    state varchar(30) not null default 'PENDING'
        check(state in ('PENDING','SUBMISSION_STARTED','REMOTE_CREATED',
            'REMOTE_UNKNOWN','REMOTE_FAILED','LOCAL_CODE_READY','COMPLETE_ACCEPTED','CANCELLED')),
    remote_task_id varchar(160),
    remote_task_url text,
    remote_task_status varchar(80),
    last_remote_check_at timestamptz,
    submitted_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(automation_id,shot_key,task_input_sha256)
);
create unique index ep002_codex_one_live_task_per_automation
    on ep002_codex_automation_task(automation_id)
    where state in ('PENDING','SUBMISSION_STARTED','REMOTE_CREATED','REMOTE_UNKNOWN','LOCAL_CODE_READY');
create unique index ep002_codex_one_live_task_per_episode
    on ep002_codex_automation_task(episode_key)
    where state in ('PENDING','SUBMISSION_STARTED','REMOTE_CREATED','REMOTE_UNKNOWN','LOCAL_CODE_READY');
create index ep002_codex_task_status
    on ep002_codex_automation_task(automation_id,created_at desc);
