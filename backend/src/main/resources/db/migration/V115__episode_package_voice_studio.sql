create table episode_package_shot_revision (
    id uuid primary key,
    shot_id uuid not null references episode_package_shot(id),
    revision integer not null check (revision > 0),
    narration text not null check (length(trim(narration)) between 20 and 5000),
    voice_direction text not null check (length(trim(voice_direction)) between 8 and 1200),
    actor_issuer text not null,
    actor_subject text not null,
    created_at timestamptz not null default now(),
    unique (shot_id, revision)
);

insert into episode_package_shot_revision (
    id,shot_id,revision,narration,voice_direction,actor_issuer,actor_subject
)
select gen_random_uuid(),s.id,1,s.original_narration,s.original_voice_direction,
       p.director_issuer,p.director_subject
from episode_package_shot s
join episode_package_import p on p.id=s.package_id;

create table episode_package_voice_request (
    request_id uuid primary key,
    shot_id uuid not null references episode_package_shot(id),
    revision integer not null check (revision > 0),
    narration_sha256 char(64) not null,
    actor_issuer text not null,
    actor_subject text not null,
    status varchar(20) not null check (status in ('IN_FLIGHT','UNCERTAIN','COMPLETED')),
    provider_request_id text,
    started_at timestamptz not null default now(),
    completed_at timestamptz,
    check ((status='COMPLETED' and completed_at is not null)
        or (status<>'COMPLETED' and completed_at is null))
);

create unique index episode_package_voice_one_unresolved
    on episode_package_voice_request(shot_id)
    where status in ('IN_FLIGHT','UNCERTAIN');
create index episode_package_voice_request_history
    on episode_package_voice_request(shot_id,started_at desc);

create table episode_package_voice_take (
    id uuid primary key,
    shot_id uuid not null references episode_package_shot(id),
    revision integer not null check (revision > 0),
    take_number integer not null check (take_number > 0),
    audio bytea not null,
    content_type varchar(100) not null,
    file_name varchar(220) not null,
    model_id varchar(120) not null,
    voice_id varchar(255) not null,
    output_format varchar(80) not null,
    provider_request_id text,
    generated_alignment jsonb not null default '{}'::jsonb,
    duration_seconds numeric(12,3) check (duration_seconds > 0),
    generated_at timestamptz not null default now(),
    unique (shot_id,revision,take_number)
);
create index episode_package_voice_take_recent
    on episode_package_voice_take(shot_id,revision,take_number desc);

create table episode_package_voice_choice (
    id uuid primary key,
    shot_id uuid not null references episode_package_shot(id),
    revision integer not null check (revision > 0),
    take_id uuid not null references episode_package_voice_take(id),
    actor_issuer text not null,
    actor_subject text not null,
    selected_at timestamptz not null default now()
);
create index episode_package_voice_choice_recent
    on episode_package_voice_choice(shot_id,revision,selected_at desc,id desc);
