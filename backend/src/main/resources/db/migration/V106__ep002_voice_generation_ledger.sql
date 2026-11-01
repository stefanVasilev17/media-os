create table ep002_voice_generation_ledger (
    request_id uuid primary key,
    episode_id uuid not null references episode(id),
    shot_key varchar(40) not null,
    revision int not null check (revision >= 0),
    narration_sha256 char(64) not null,
    actor_issuer varchar(255) not null,
    actor_subject varchar(255) not null,
    status varchar(20) not null check (status in ('IN_FLIGHT', 'UNCERTAIN', 'COMPLETED')),
    started_at timestamptz not null default now(),
    completed_at timestamptz,
    check ((status = 'COMPLETED' and completed_at is not null)
       or (status <> 'COMPLETED' and completed_at is null))
);
create unique index ep002_voice_one_unresolved_request_per_shot
    on ep002_voice_generation_ledger (episode_id, shot_key)
    where status in ('IN_FLIGHT', 'UNCERTAIN');
create index ep002_voice_generation_history
    on ep002_voice_generation_ledger (episode_id, shot_key, started_at desc);
