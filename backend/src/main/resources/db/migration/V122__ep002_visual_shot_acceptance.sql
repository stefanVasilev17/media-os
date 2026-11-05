create table ep002_visual_shot_acceptance (
    id uuid primary key,
    request_id uuid not null unique,
    shot_key varchar(6) not null
      check (shot_key ~ '^SHOT(0[2-9]|1[01])$'),
    episode_input_fingerprint char(64) not null
      check (episode_input_fingerprint ~ '^[a-f0-9]{64}$'),
    narration_revision integer not null check(narration_revision > 0),
    narration_sha256 char(64) not null
      check (narration_sha256 ~ '^[a-f0-9]{64}$'),
    preferred_take_id uuid not null references ep002_creative_voice_take(id),
    remotion_render_id uuid not null references remotion_render(id),
    verified_source_commit char(40) not null
      check (verified_source_commit ~ '^[a-f0-9]{40}$'),
    verified_source_blob_sha char(40) not null
      check (verified_source_blob_sha ~ '^[a-f0-9]{40}$'),
    verified_policy_sha256 char(64) not null
      check (verified_policy_sha256 ~ '^[a-f0-9]{64}$'),
    source_pr_number integer not null check (source_pr_number > 0),
    director_issuer text not null,
    director_subject text not null,
    preflight_audit_id uuid not null,
    created_at timestamptz not null default now(),
    unique(shot_key,episode_input_fingerprint)
);

create index ep002_visual_acceptance_current
    on ep002_visual_shot_acceptance (episode_input_fingerprint,shot_key,created_at desc);
