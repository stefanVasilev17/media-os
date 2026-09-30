create table project_creative_policy (
  project_id uuid primary key references project(id) on delete cascade,
  version varchar(40) not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table episode_topic_candidate (
  id uuid primary key,
  project_id uuid not null references project(id) on delete cascade,
  title varchar(260) not null,
  central_question text not null,
  viewer_promise text not null,
  evergreen_reason text not null,
  mass_entry text not null,
  senior_lesson text not null,
  system_boundary text not null,
  core_tension text not null,
  aha_candidates jsonb not null default '[]'::jsonb,
  failure_tradeoff text not null,
  reuse_plan text not null,
  new_assets jsonb not null default '[]'::jsonb,
  series_path text not null,
  thumbnail_idea text not null,
  estimated_complexity varchar(20) not null,
  recommended_build_minutes int not null default 20,
  status varchar(40) not null default 'READY',
  created_at timestamptz not null default now()
);

create index idx_episode_topic_candidate_project_created
  on episode_topic_candidate(project_id, created_at desc);

create table episode_build_run (
  id uuid primary key,
  episode_id uuid not null references episode(id) on delete cascade,
  topic_candidate_id uuid references episode_topic_candidate(id),
  status varchar(40) not null,
  current_step varchar(60) not null,
  progress_percent int not null default 0,
  budget_minutes int not null default 20,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_episode_build_run_episode_created
  on episode_build_run(episode_id, created_at desc);

create table episode_build_step (
  id uuid primary key,
  run_id uuid not null references episode_build_run(id) on delete cascade,
  step_key varchar(60) not null,
  sequence_no int not null,
  status varchar(40) not null,
  summary text not null default '',
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(run_id, step_key)
);

create index idx_episode_build_step_run_sequence
  on episode_build_step(run_id, sequence_no);

insert into project_creative_policy(project_id, version, payload)
values (
  '11111111-1111-1111-1111-111111111111',
  '2026-09-30',
  $$
  {
    "channel":"Architectural Thinking",
    "topicRules":[
      "Prefer evergreen topics with real search intent, a mass human entry point, and senior engineering depth.",
      "Prefer production architecture questions over technology catalogues or beginner definitions.",
      "Every topic needs one concrete central question, a visible human or business consequence, and a natural Entry to Bridge to Depth series path.",
      "Prefer system design, backend architecture, scalability, distributed systems, cloud cost, high-load systems, database performance, reliability, payments, trust, failure, and correctness when the human entry remains broad.",
      "Reject a sequel that is weak on its own merely because it fits a cluster.",
      "Prefer topics that can reuse the Living Architecture World while still adding a distinct engineering lesson."
    ],
    "qualityRules":[
      "Simple English, calm architect tone, low cognitive load, minimal jargon, linear causal progression.",
      "Working script target is about 20 minutes so the creator can cut to a strong 16–18 minute final episode.",
      "At least three genuine Aha moments and at least three reel-ready passages.",
      "Meaningful new value roughly every 45–60 seconds, micro-tension roughly every 60–90 seconds, cognitive relief every 3–4 minutes.",
      "Never introduce more than one genuinely new concept at a time.",
      "Camera movement is storytelling: move when focus changes and hold still during reasoning.",
      "Use controlled shots rather than one uninterrupted long Spline animation."
    ],
    "productionRules":[
      "Truth before beauty.",
      "Build only assets required by the story.",
      "Every downstream agent must reduce ambiguity and hand off exact timings, canonical names, dependencies, and expected outcomes.",
      "All agent work must be cloud-first and must not require a Windows machine.",
      "Autonomous initial builds never auto-lock creator decisions. The creator reviews, corrects, and explicitly locks each stage."
    ]
  }
  $$::jsonb
)
on conflict (project_id) do update
set version=excluded.version,
    payload=excluded.payload,
    updated_at=now();

insert into agent_profile(id, agent_key, name, instructions_version, permission_level, enabled)
values (
  '33333333-3333-3333-3333-333333333337',
  'EPISODE_BUILD_AGENT',
  'Episode Build Orchestrator',
  '1.0',
  'LEVEL_1',
  true
)
on conflict (agent_key) do update
set name=excluded.name,
    instructions_version=excluded.instructions_version,
    permission_level=excluded.permission_level,
    enabled=excluded.enabled;
