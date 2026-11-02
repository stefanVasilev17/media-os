alter table ep002_creative_voice_take add column if not exists duration_seconds numeric(12,3) check (duration_seconds > 0 and duration_seconds < 86400);

create table if not exists episode_shot_render_lineage (
 id uuid primary key,
 episode_key varchar(16) not null,
 shot_key varchar(16) not null,
 script_revision integer not null check (script_revision > 0),
 script_sha256 char(64) not null,
 preferred_take_id uuid not null references ep002_creative_voice_take(id),
 visual_source_git_blob_sha char(40) not null,
 dependency_sha256 char(64) not null,
 remotion_render_id uuid not null,
 remotion_commit_sha varchar(64) not null,
 render_status varchar(24) not null check (render_status in ('QUEUED','RENDERING','SUCCEEDED','FAILED')),
 created_at timestamptz not null default now(),
 completed_at timestamptz,
 unique (episode_key,shot_key,dependency_sha256,remotion_render_id)
);
create index if not exists episode_shot_render_lineage_lookup on episode_shot_render_lineage(episode_key,shot_key,dependency_sha256,created_at desc);
