create table ep002_visual_director_feedback (
    id uuid primary key,
    request_id uuid not null unique,
    episode_key varchar(8) not null default 'EP002' check (episode_key = 'EP002'),
    shot_key varchar(6) not null
      check (shot_key ~ '^SHOT(0[2-9]|1[01])$'),
    episode_input_fingerprint char(64) not null
      check (episode_input_fingerprint ~ '^[a-f0-9]{64}$'),
    script_revision integer not null check (script_revision >= 0),
    narration_sha256 char(64) not null
      check (narration_sha256 ~ '^[a-f0-9]{64}$'),
    selected_take_id uuid,
    change_area varchar(20) not null
      check (change_area in ('CAMERA','MOTION','LAYOUT','COLOR','TEXT',
                            'TIMING','AUDIO','TRANSITION','OTHER')),
    problem_observed text not null
      check (length(trim(problem_observed)) between 12 and 2000),
    requested_correction text not null
      check (length(trim(requested_correction)) between 12 and 4000),
    state varchar(48) not null default 'DIRECTOR_FEEDBACK_RECORDED'
      check (state in ('DIRECTOR_FEEDBACK_RECORDED')),
    director_issuer text not null,
    director_subject text not null,
    preflight_audit_id uuid not null,
    created_at timestamptz not null default now()
);

create index ep002_visual_feedback_by_shot
    on ep002_visual_director_feedback
       (shot_key, created_at desc, id desc);

create index ep002_visual_feedback_by_director
    on ep002_visual_director_feedback
       (director_issuer, director_subject, created_at desc);
