create table episode_source_snapshot (
  id uuid primary key,
  episode_id uuid not null references episode(id),
  version varchar(40) not null,
  source_type varchar(60) not null,
  payload jsonb not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  unique(episode_id, version)
);

create unique index idx_episode_source_snapshot_current
  on episode_source_snapshot(episode_id)
  where is_current;

create table production_stage (
  id uuid primary key,
  episode_id uuid not null references episode(id),
  stage_key varchar(60) not null,
  agent_key varchar(80),
  display_name varchar(120) not null,
  sequence_no int not null,
  route varchar(180),
  status varchar(40) not null,
  summary text not null default '',
  next_action text not null default '',
  artifact jsonb,
  artifact_schema_version varchar(40) not null default '1.0',
  current_revision int not null default 0,
  readiness jsonb not null default '{"ready":false,"remainingTasks":[]}'::jsonb,
  locked_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(episode_id, stage_key)
);

create index idx_production_stage_episode_sequence
  on production_stage(episode_id, sequence_no);

create table production_stage_revision (
  id uuid primary key,
  production_stage_id uuid not null references production_stage(id) on delete cascade,
  revision int not null,
  artifact jsonb not null,
  summary text not null default '',
  change_summary text not null default '',
  created_by varchar(40) not null,
  created_at timestamptz not null default now(),
  unique(production_stage_id, revision)
);

create table agent_memory (
  id uuid primary key,
  episode_id uuid not null references episode(id),
  agent_key varchar(80) not null,
  memory_type varchar(40) not null,
  content text not null,
  source_message_id uuid references agent_message(id),
  source_stage_revision_id uuid references production_stage_revision(id),
  created_at timestamptz not null default now()
);

create index idx_agent_memory_episode_agent_created
  on agent_memory(episode_id, agent_key, created_at desc);

create table agent_handoff (
  id uuid primary key,
  episode_id uuid not null references episode(id),
  source_stage_key varchar(60) not null,
  target_stage_key varchar(60) not null,
  source_revision int not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique(episode_id, source_stage_key, source_revision, target_stage_key)
);

create index idx_agent_handoff_target_created
  on agent_handoff(episode_id, target_stage_key, created_at desc);

insert into agent_profile(id, agent_key, name, instructions_version, permission_level, enabled)
values
  ('33333333-3333-3333-3333-333333333335', 'SCRIPT_AGENT', 'Script Agent', '1.0', 'LEVEL_1', true),
  ('33333333-3333-3333-3333-333333333336', 'SCENE_AGENT', 'Scene Agent', '1.0', 'LEVEL_1', true)
on conflict (agent_key) do update
set name=excluded.name,
    instructions_version=excluded.instructions_version,
    permission_level=excluded.permission_level,
    enabled=excluded.enabled;

insert into agent_thread(id, episode_id, agent_profile_id, status)
select '44444444-4444-4444-4444-444444444446', '22222222-2222-2222-2222-222222222222', ap.id, 'ACTIVE'
from agent_profile ap
where ap.agent_key='SCRIPT_AGENT'
  and not exists (
    select 1 from agent_thread t
    where t.episode_id='22222222-2222-2222-2222-222222222222'
      and t.agent_profile_id=ap.id
  );

insert into agent_thread(id, episode_id, agent_profile_id, status)
select '44444444-4444-4444-4444-444444444447', '22222222-2222-2222-2222-222222222222', ap.id, 'WAITING'
from agent_profile ap
where ap.agent_key='SCENE_AGENT'
  and not exists (
    select 1 from agent_thread t
    where t.episode_id='22222222-2222-2222-2222-222222222222'
      and t.agent_profile_id=ap.id
  );

insert into episode_source_snapshot(id, episode_id, version, source_type, payload, is_current)
values (
  '77777777-aaaa-4444-8888-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'v2.5',
  'CORE_PRODUCTION_BIBLE',
  $$
  {
    "title":"What Really Happens When You Click Login?",
    "centralQuestion":"How does a system turn submitted credentials into trusted, remembered authentication state?",
    "finalLesson":"Login is not a password check. It is a distributed journey that turns a human claim into trusted system state.",
    "targetDurationSeconds":{"min":780,"max":960},
    "narration":{"language":"English","wordsPerMinute":{"min":130,"max":145},"style":["clear","simple","professional","causal","human-focused","senior reasoning","no hype"]},
    "storyGrammar":["Cold Open / Human Hook","Question and Promise","Entry into the System","Journey Through Major Layers","Central Deep Dive","Failure / Trade-off Branch","Resolution / Return Path","Final Zoom-out / Architectural Lesson"],
    "truthPath":["User / Phone","Client Boundary","Network / Transit","API Gateway","Load Balancer","Auth Service","User Database","Authentication State / Session-Token Boundary","Response","Client","Logged-in UI"],
    "ahaMoments":[
      "The user clicked Login, but the meaningful backend request may still not have left the client.",
      "The Auth Service can be locally healthy while login is broken because a dependency such as the User Database is slow.",
      "Correct credentials are not enough. The system must create or issue authentication state that future requests can use as proof."
    ],
    "reelMoments":[
      "Your login request may still be inside the client.",
      "This service is healthy. Login is still broken.",
      "A correct password does not log you in."
    ],
    "failureBranch":"Auth Service is locally operational, but User Database is slow. User Lookup waits, the dependency response is delayed, the time budget falls, and the human still sees a spinner or timeout. Local health is not end-to-end health.",
    "dataTruth":"Do not imply the User Database returns the original plaintext password. Use a conceptual account record with identity, stored credential representation, account status, and relevant security metadata.",
    "visualRules":[
      "One world. One living map. Many engineering stories.",
      "Phone is the human anchor; client/browser context stays compact.",
      "Backend services and dependencies become visually dominant after the request leaves the client.",
      "Move the camera when focus changes and hold still during reasoning.",
      "Use controlled shot segments rather than one uninterrupted episode animation.",
      "On-screen text is orientation only; narration carries reasoning."
    ],
    "outOfScope":["TLS internals","OAuth","OIDC","SAML","social login","passkeys","MFA implementation","password reset","refresh token internals","JWT internals","hashing algorithm deep dive","replication deep dive","authorization deep dive","Redis deep dive"]
  }
  $$::jsonb,
  true
)
on conflict (episode_id, version) do update
set payload=excluded.payload,
    source_type=excluded.source_type,
    is_current=true;

insert into production_stage(id, episode_id, stage_key, agent_key, display_name, sequence_no, route, status, summary, next_action, artifact, readiness)
values
  ('88888888-aaaa-4444-8888-000000000001','22222222-2222-2222-2222-222222222222','RESEARCH',null,'Research & Truth',10,null,'LOCKED','Canonical EP001 truth and scope are available as the current source snapshot.','Script must consume the locked truth without widening the scope.','{"sourceVersion":"v2.5","truthLocked":true}'::jsonb,'{"ready":true,"remainingTasks":[]}'::jsonb),
  ('88888888-aaaa-4444-8888-000000000002','22222222-2222-2222-2222-222222222222','SCRIPT','SCRIPT_AGENT','Script',20,'#/agents/script','ACTIVE','The formal timecoded narration contract has not been locked yet.','Create the complete 13–16 minute script, voice direction, and Scene handoff.',null,'{"ready":false,"remainingTasks":["Generate the complete timecoded script contract."]}'::jsonb),
  ('88888888-aaaa-4444-8888-000000000003','22222222-2222-2222-2222-222222222222','SCENE','SCENE_AGENT','Scenes',30,'#/agents/scene','WAITING','Scene choreography waits for the locked Script contract.','Lock Script first, then combine narration, scene moves, camera, and shot decomposition.',null,'{"ready":false,"remainingTasks":["Waiting for locked Script handoff."]}'::jsonb),
  ('88888888-aaaa-4444-8888-000000000004','22222222-2222-2222-2222-222222222222','SPLINE','SPLINE_AGENT','Spline',40,'#/agents/spline','ACTIVE','Existing Spline runtime work predates the formal Script and Scene contracts and remains available.','Continue current Spline work, then consume future locked Scene shot prompts without changing the Spline workspace foundation.',null,'{"ready":false,"remainingTasks":[]}'::jsonb),
  ('88888888-aaaa-4444-8888-000000000005','22222222-2222-2222-2222-222222222222','RENDER',null,'Render',50,null,'WAITING','GPU rendering follows prepared Spline shots.','Render approved shots when their Spline revisions are ready.',null,'{"ready":false,"remainingTasks":[]}'::jsonb),
  ('88888888-aaaa-4444-8888-000000000006','22222222-2222-2222-2222-222222222222','QA',null,'QA',60,null,'WAITING','Render QA starts after shot renders are ready.','Review technical correctness, framing, pacing, readability, and render quality.',null,'{"ready":false,"remainingTasks":[]}'::jsonb),
  ('88888888-aaaa-4444-8888-000000000007','22222222-2222-2222-2222-222222222222','EDIT',null,'Edit & Sound',70,null,'WAITING','Editorial assembly follows approved shot renders.','Assemble shots, final narration, sound, captions, pacing, and transitions.',null,'{"ready":false,"remainingTasks":[]}'::jsonb),
  ('88888888-aaaa-4444-8888-000000000008','22222222-2222-2222-2222-222222222222','PUBLISH',null,'Publish',80,null,'WAITING','Publishing is the final episode gate.','Run final QA, package title/thumbnail/description, and publish.',null,'{"ready":false,"remainingTasks":[]}'::jsonb)
on conflict (episode_id, stage_key) do nothing;

update production_stage
set locked_at=coalesce(locked_at, now())
where episode_id='22222222-2222-2222-2222-222222222222'
  and stage_key='RESEARCH'
  and status='LOCKED';

delete from agent_message
where id='55555555-5555-5555-5555-555555555561';
