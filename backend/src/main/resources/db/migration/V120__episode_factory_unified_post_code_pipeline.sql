create table episode_factory_production_run (
    id uuid primary key,
    request_id uuid not null unique,
    package_id uuid not null references episode_package_import(id),
    handoff_id uuid not null unique references episode_codex_cloud_handoff(id),
    episode_key varchar(24) not null,
    original_manifest_sha256 char(64) not null,
    original_readiness_fingerprint char(64) not null,
    asset_catalog_sha256 char(64) not null,
    state varchar(48) not null default 'WAITING_FOR_CODE_VERIFICATION'
      check (state in ('WAITING_FOR_CODE_VERIFICATION','PR_SOURCE_SCOPED_BUILD_PENDING',
                       'DIRECTOR_FEEDBACK_OPEN','RENDER_REVIEW_READY','RENDER_QUEUED','SHOT_REVIEW_READY',
                       'EPISODE_REVIEW_READY','FINAL_DIRECTOR_APPROVED')),
    verified_pr_number integer,
    verified_pr_commit char(40),
    verified_git_main_head char(40),
    verified_source_digest char(64),
    code_verified_at timestamptz,
    render_approval_at timestamptz,
    rendered_source_digest char(64),
    director_issuer text not null,
    director_subject text not null,
    preflight_audit_id uuid not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check ((verified_pr_number is null and verified_pr_commit is null
                 and verified_source_digest is null and code_verified_at is null)
           or (verified_pr_number is not null and verified_pr_commit is not null
                 and verified_source_digest is not null and code_verified_at is not null))
);

create table episode_factory_shot (
    id uuid primary key,
    run_id uuid not null references episode_factory_production_run(id),
    shot_key varchar(6) not null,
    shot_index integer not null check (shot_index between 1 and 40),
    narration_revision integer not null check (narration_revision > 0),
    selected_take_id uuid not null references episode_package_voice_take(id),
    duration_frames integer not null check (duration_frames between 1 and 108000),
    expected_code_path text not null,
    source_path_git_blob_sha char(40),
    source_code_dependency_sha256 char(64),
    last_requested_render uuid references remotion_render(id),
    last_successful_render uuid references remotion_render(id),
    last_render_input_sha256 char(64),
    last_reviewed_at timestamptz,
    director_approved boolean not null default false,
    unique(run_id,shot_key),
    unique(run_id,shot_index)
);
create index episode_factory_shot_run on episode_factory_shot(run_id,shot_index);

create table episode_factory_director_feedback (
    id uuid primary key,
    request_id uuid not null unique,
    run_id uuid not null references episode_factory_production_run(id),
    shot_key varchar(6),
    change_area varchar(30) not null
      check (change_area in ('CAMERA','MOTION','LAYOUT','COLOR','TEXT','TIMING',
                            'AUDIO','TRANSITION','OTHER')),
    feedback text not null check (length(trim(feedback)) between 12 and 4000),
    source_manifest_sha256 char(64) not null,
    source_commit char(40),
    state varchar(28) not null default 'OPEN_FOR_CODEX'
      check (state in ('OPEN_FOR_CODEX','RESOLVED_BY_NEW_RELEASE')),
    director_issuer text not null,
    director_subject text not null,
    created_at timestamptz not null default now(),
    resolved_at timestamptz
);
create index episode_factory_feedback_by_run
  on episode_factory_director_feedback(run_id,created_at desc);

create table episode_factory_output_plan (
    id uuid primary key,
    run_id uuid not null references episode_factory_production_run(id),
    kind varchar(12) not null check (kind in ('MASTER','SHORT')),
    ordinal integer not null check (ordinal between 0 and 3),
    start_frame integer not null check (start_frame >= 0),
    end_frame integer not null check (end_frame > start_frame),
    source_plan_sha256 char(64) not null,
    render_id uuid references remotion_render(id),
    review_state varchar(30) not null default 'PLANNED_NOT_RENDERED'
      check (review_state in ('PLANNED_NOT_RENDERED','QUEUED',
                              'RENDERED_PENDING_DIRECTOR','DIRECTOR_APPROVED')),
    approved_at timestamptz,
    unique(run_id,kind,ordinal),
    check ((kind='MASTER' and ordinal=0)
       or (kind='SHORT' and ordinal between 1 and 3))
);
create index episode_factory_output_by_run
  on episode_factory_output_plan(run_id,kind,ordinal);


create table episode_factory_worker_capability (
    worker_id varchar(160) primary key,
    source_commit char(40) not null check (source_commit ~ '^[a-f0-9]{40}$'),
    bundled_scenes jsonb not null,
    build_checked boolean not null default false,
    last_heartbeat_at timestamptz not null default now()
);
create index episode_factory_worker_recent
  on episode_factory_worker_capability(last_heartbeat_at desc);

create table episode_factory_cpu_authorization (
    id uuid primary key,
    request_id uuid not null unique,
    run_id uuid not null references episode_factory_production_run(id),
    kind varchar(12) not null check(kind in ('SHOTS','MASTER','SHORTS')),
    original_manifest_sha256 char(64) not null,
    verified_source_digest char(64) not null,
    worker_source_commit char(40) not null,
    maximum_frames integer not null check(maximum_frames between 1 and 150000),
    requested_frames integer not null check(requested_frames between 1 and maximum_frames),
    status varchar(20) not null default 'CONSUMED_QUEUED'
      check(status in ('CONSUMED_QUEUED','REVOKED')),
    director_issuer text not null,
    director_subject text not null,
    preflight_audit_id uuid not null,
    created_at timestamptz not null default now(),
    unique(run_id,kind,request_id)
);

create table episode_factory_code_revision (
    id uuid primary key,
    request_id uuid not null unique,
    run_id uuid not null references episode_factory_production_run(id),
    pull_request_number integer not null check (pull_request_number > 0),
    pull_request_url text not null,
    expected_previous_source_digest char(64) not null,
    expected_manifest_sha256 char(64) not null,
    state varchar(28) not null default 'PR_LINKED_UNVERIFIED'
      check(state in ('PR_LINKED_UNVERIFIED','MERGED_SOURCE_SCOPED')),
    merged_commit char(40),
    verified_source_digest char(64),
    verified_at timestamptz,
    director_issuer text not null,
    director_subject text not null,
    preflight_audit_id uuid not null,
    created_at timestamptz not null default now(),
    unique(run_id,pull_request_number)
);
create index episode_factory_revision_by_run
  on episode_factory_code_revision(run_id,created_at desc);

create table episode_factory_shot_review_approval (
    id uuid primary key,
    request_id uuid not null unique,
    run_id uuid not null references episode_factory_production_run(id),
    verified_source_digest char(64) not null,
    approved_render_digest char(64) not null,
    shot_count integer not null check(shot_count between 1 and 40),
    director_issuer text not null,
    director_subject text not null,
    preflight_audit_id uuid not null,
    approved_at timestamptz not null default now(),
    unique(run_id,verified_source_digest,approved_render_digest)
);

create table episode_factory_final_review_approval (
    id uuid primary key,
    request_id uuid not null unique,
    run_id uuid not null references episode_factory_production_run(id),
    verified_source_digest char(64) not null,
    review_master_render_id uuid not null references remotion_render(id),
    short1_render_id uuid not null references remotion_render(id),
    short2_render_id uuid not null references remotion_render(id),
    short3_render_id uuid not null references remotion_render(id),
    director_issuer text not null,
    director_subject text not null,
    preflight_audit_id uuid not null,
    approved_at timestamptz not null default now(),
    unique(run_id,verified_source_digest)
);
