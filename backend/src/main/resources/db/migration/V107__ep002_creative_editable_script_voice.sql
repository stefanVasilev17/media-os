create table ep002_creative_script_revision (
    id uuid primary key,
    shot_key varchar(16) not null,
    revision integer not null check (revision > 0),
    narration text not null check (length(narration) between 1 and 5000),
    voice_direction text not null default '',
    actor_issuer text not null,
    actor_subject text not null,
    saved_at timestamptz not null default now(),
    unique (shot_key,revision)
);

create table ep002_creative_voice_take (
    id uuid primary key,
    shot_key varchar(16) not null,
    revision integer not null,
    take_number integer not null check (take_number > 0),
    narration_sha256 char(64) not null,
    audio bytea not null,
    content_type varchar(80) not null,
    model_id text not null,
    voice_id text not null,
    generated_at timestamptz not null default now(),
    approved_at timestamptz,
    approved_actor_issuer text,
    approved_actor_subject text,
    unique (shot_key,take_number),
    foreign key (shot_key,revision)
        references ep002_creative_script_revision(shot_key,revision)
);

create unique index ep002_creative_single_approved_take_per_revision
on ep002_creative_voice_take(shot_key,revision) where approved_at is not null;

create table ep002_creative_voice_request (
    request_id uuid primary key,
    shot_key varchar(16) not null,
    revision integer not null,
    narration_sha256 char(64) not null,
    status varchar(16) not null check (status in ('IN_FLIGHT','COMPLETED','UNCERTAIN')),
    actor_issuer text not null,
    actor_subject text not null,
    started_at timestamptz not null default now(),
    completed_at timestamptz,
    foreign key (shot_key,revision)
        references ep002_creative_script_revision(shot_key,revision)
);

create unique index ep002_creative_single_unresolved_paid_request
on ep002_creative_voice_request(shot_key)
where status in ('IN_FLIGHT','UNCERTAIN');
