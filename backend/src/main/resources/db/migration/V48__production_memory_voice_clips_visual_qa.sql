create table production_memory_rule (
  id uuid primary key,
  project_id uuid not null references project(id),
  episode_id uuid references episode(id),
  scope varchar(40) not null,
  rule_type varchar(40) not null,
  severity varchar(20) not null default 'REQUIRED',
  content text not null,
  source varchar(120) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_production_memory_rule_scope
  on production_memory_rule(project_id, episode_id, scope, active, created_at desc);

create table production_preflight_audit (
  id uuid primary key,
  episode_id uuid not null references episode(id),
  scope varchar(40) not null,
  action_key varchar(100) not null,
  rule_count int not null,
  rule_ids jsonb not null,
  passed boolean not null,
  created_at timestamptz not null default now()
);

create index idx_production_preflight_audit_episode
  on production_preflight_audit(episode_id, created_at desc);

create table voice_clip_workflow (
  id uuid primary key,
  episode_id uuid not null references episode(id),
  script_revision int not null,
  shot_key varchar(40) not null,
  clip_key varchar(80) not null,
  sequence_no int not null,
  start_second int not null,
  end_second int not null,
  narration text not null,
  voice_direction text not null default '',
  generated_audio bytea,
  generated_audio_content_type varchar(120),
  generated_audio_file_name varchar(255),
  generated_alignment jsonb,
  generated_voice_id varchar(255),
  generated_model_id varchar(255),
  generation_revision int not null default 0,
  voice_generated_at timestamptz,
  voice_approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(episode_id, script_revision, clip_key)
);

create index idx_voice_clip_workflow_shot
  on voice_clip_workflow(episode_id, script_revision, shot_key, sequence_no);

create table visual_shot_qa (
  id uuid primary key,
  episode_id uuid not null references episode(id),
  script_revision int not null,
  shot_key varchar(40) not null,
  render_id uuid references remotion_render(id) on delete set null,
  phase varchar(30) not null,
  status varchar(30) not null,
  checks jsonb not null,
  memory_rule_count int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_visual_shot_qa_shot
  on visual_shot_qa(episode_id, script_revision, shot_key, created_at desc);

insert into production_memory_rule(id, project_id, episode_id, scope, rule_type, severity, content, source)
values
  ('90000000-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111',null,'ALL','LOCK','REQUIRED','Remotion-first production is canonical. Spline is optional/special-case tooling and must not be the default production engine.','Creator correction · 2026-10-11'),
  ('90000000-0000-4000-8000-000000000002','11111111-1111-1111-1111-111111111111',null,'VISUAL','QA','REQUIRED','Every visual shot must pass memory preflight and deterministic QA before it is accepted into the current episode preview.','Creator correction · 2026-10-11'),
  ('90000000-0000-4000-8000-000000000003','11111111-1111-1111-1111-111111111111',null,'VISUAL','PREFERENCE','REQUIRED','The Visual Agent shows one cumulative episode video built from contiguous approved shots; individual shot videos are implementation detail, not the primary review surface.','Creator correction · 2026-10-11'),
  ('90000000-0000-4000-8000-000000000004','11111111-1111-1111-1111-111111111111',null,'VOICE','PREFERENCE','REQUIRED','Generate narration as smaller voice clips so a weak delivery can be regenerated without replacing an entire shot.','Creator correction · 2026-10-11'),
  ('90000000-0000-4000-8000-000000000005','11111111-1111-1111-1111-111111111111',null,'SCRIPT','LOCK','REQUIRED','Once the current episode Script is LOCKED, Script Agent is read-only and shows exact timeline narration plus voice direction; voice and visuals belong to downstream agents.','Creator correction · 2026-10-11'),
  ('90000000-0000-4000-8000-000000000006','11111111-1111-1111-1111-111111111111',null,'ALL','CORRECTION','REQUIRED','Every creator correction that changes production behavior must be stored as durable production memory and consulted before future script, voice, shot, render, and QA work.','Creator correction · 2026-10-11'),
  ('90000000-0000-4000-8000-000000000007','11111111-1111-1111-1111-111111111111',null,'VISUAL','LOCK','REQUIRED','Preserve LOCKED visual output unless explicitly unlocked. Refactors may change implementation but not approved appearance or teaching meaning.','Canonical production rule'),
  ('90000000-0000-4000-8000-000000000008','11111111-1111-1111-1111-111111111111',null,'VISUAL','QA','REQUIRED','Reject generic dashboard/slideshow output, decorative motion, equal-brightness architecture, early full-map reveal, unreadable typography, and color-only state communication.','Canonical visual QA'),
  ('90000000-0000-4000-8000-000000000009','11111111-1111-1111-1111-111111111111',null,'VOICE','LOCK','REQUIRED','Voice timing wins. Remotion events bind to approved semantic word timing rather than forcing narration into old approximate script seconds.','Canonical voice timing'),
  ('90000000-0000-4000-8000-000000000010','11111111-1111-1111-1111-111111111111',null,'VISUAL','PREFERENCE','REQUIRED','Motion explains causality. Camera moves when meaning/focus changes and holds during reasoning or waiting.','Canonical visual grammar');

insert into production_stage(id, episode_id, stage_key, agent_key, display_name, sequence_no, route, status, summary, next_action, artifact, readiness)
values
  ('88888888-aaaa-4444-8888-000000000009','22222222-2222-2222-2222-222222222222','VOICE',null,'Voice',30,'#/agents/voice','ACTIVE','Voice production consumes only the LOCKED Script and produces approved small narration clips with exact timing.','Generate and approve the next voice clip.',null,'{"ready":false,"remainingTasks":[]}'::jsonb),
  ('88888888-aaaa-4444-8888-000000000010','22222222-2222-2222-2222-222222222222','VISUAL',null,'Visual',40,'#/agents/visual','ACTIVE','Remotion-first visual production consumes approved voice timing, runs QA, and maintains one cumulative episode preview.','Render the next voice-ready shot through QA.',null,'{"ready":false,"remainingTasks":[]}'::jsonb)
on conflict (episode_id, stage_key) do update
set route=excluded.route,
    display_name=excluded.display_name,
    sequence_no=excluded.sequence_no,
    summary=excluded.summary,
    next_action=excluded.next_action,
    updated_at=now();
