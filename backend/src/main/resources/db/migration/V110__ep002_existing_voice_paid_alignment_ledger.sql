alter table ep002_creative_voice_take
  add column if not exists alignment_source varchar(48);

update ep002_creative_voice_take set alignment_source='ELEVENLABS_TTS_WITH_TIMESTAMPS'
where elevenlabs_alignment is not null and alignment_source is null;

create table ep002_creative_alignment_request (
 request_id uuid primary key,
 shot_key varchar(16) not null,
 revision integer not null,
 take_id uuid not null references ep002_creative_voice_take(id),
 narration_sha256 char(64) not null,
 actor_issuer text not null,
 actor_subject text not null,
 status varchar(16) not null check (status in ('IN_FLIGHT','COMPLETED','UNCERTAIN')),
 started_at timestamptz not null default now(),
 completed_at timestamptz,
 failure_reason varchar(120),
 foreign key (shot_key,revision) references ep002_creative_script_revision(shot_key,revision)
);

create unique index ep002_creative_alignment_single_unresolved
on ep002_creative_alignment_request(take_id) where status in ('IN_FLIGHT','UNCERTAIN');

create index ep002_creative_alignment_recent
on ep002_creative_alignment_request(shot_key,revision,started_at desc);
