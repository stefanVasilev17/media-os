alter table studio_shot
  add column if not exists director_visual_plan jsonb,
  add column if not exists director_visual_plan_revision integer,
  add column if not exists director_visual_voice_signature varchar(64),
  add column if not exists director_visual_created_at timestamptz;

comment on column studio_shot.director_visual_plan is
  'Director storyboard JSON produced only for the editable Studio shot. Original EP001 Remotion footage and Director locks are not updated.';

create table if not exists studio_director_visual_plan_history (
  id uuid primary key,
  shot_id uuid not null references studio_shot(id) on delete cascade,
  visual_revision integer not null,
  voice_signature varchar(64) not null,
  plan jsonb not null,
  created_at timestamptz not null default now(),
  unique(shot_id,visual_revision,voice_signature)
);
