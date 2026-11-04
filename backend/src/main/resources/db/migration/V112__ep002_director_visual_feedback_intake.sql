create table ep002_director_visual_feedback (
    id uuid primary key,
    episode_key varchar(8) not null default 'EP002' check (episode_key = 'EP002'),
    shot_key varchar(8) not null check (shot_key = 'SHOT01'),
    source_render_id uuid not null references remotion_render(id),
    scene_contract_id text not null,
    preferred_take_id uuid not null references ep002_creative_voice_take(id),
    script_revision integer not null check (script_revision > 0),
    dependency_sha256 char(64) not null,
    change_area varchar(24) not null check (change_area in (
        'LAYOUT','CAMERA','MOTION','COLOR','TEXT','TIMING','OTHER'
    )),
    feedback_text text not null check (char_length(feedback_text) between 12 and 3000),
    status varchar(32) not null default 'PENDING_AGENT_REVIEW'
        check (status in ('PENDING_AGENT_REVIEW','UNDER_REVIEW','CLOSED')),
    actor_issuer text not null,
    actor_subject text not null,
    created_at timestamptz not null default now()
);

create index ep002_director_visual_feedback_recent
    on ep002_director_visual_feedback(shot_key, created_at desc, id desc);
