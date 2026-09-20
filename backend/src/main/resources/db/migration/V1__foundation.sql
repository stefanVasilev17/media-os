create table project (
  id uuid primary key,
  name varchar(160) not null,
  slug varchar(120) not null unique,
  status varchar(40) not null
);

create table episode (
  id uuid primary key,
  project_id uuid not null references project(id),
  episode_number varchar(32) not null,
  title varchar(260) not null,
  current_stage varchar(80) not null,
  status varchar(40) not null,
  source_of_truth_version varchar(40),
  unique(project_id, episode_number)
);

create table agent_profile (
  id uuid primary key,
  agent_key varchar(80) not null unique,
  name varchar(120) not null,
  instructions_version varchar(40) not null,
  permission_level varchar(40) not null,
  enabled boolean not null default true
);

create table agent_thread (
  id uuid primary key,
  episode_id uuid not null references episode(id),
  agent_profile_id uuid not null references agent_profile(id),
  status varchar(40) not null,
  created_at timestamptz not null default now()
);

create table agent_message (
  id uuid primary key,
  thread_id uuid not null references agent_thread(id),
  sender varchar(20) not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table proposal (
  id uuid primary key,
  thread_id uuid not null references agent_thread(id),
  title varchar(200) not null,
  summary text not null,
  risk_level varchar(20) not null,
  confidence numeric(5,4) not null,
  status varchar(40) not null,
  affected_objects jsonb not null default '[]'::jsonb,
  proposed_operations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table approval_decision (
  id uuid primary key,
  proposal_id uuid not null references proposal(id),
  decision varchar(40) not null,
  creator_comment text,
  created_at timestamptz not null default now()
);

create table correction (
  id uuid primary key,
  proposal_id uuid not null references proposal(id),
  context_type varchar(80) not null,
  original_proposal text not null,
  creator_correction text not null,
  approved_result text,
  generalized_rule_candidate text,
  status varchar(40) not null,
  created_at timestamptz not null default now()
);

insert into project(id,name,slug,status) values
('11111111-1111-1111-1111-111111111111','Architectural Thinking','architectural-thinking','ACTIVE');

insert into episode(id,project_id,episode_number,title,current_stage,status,source_of_truth_version) values
('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','EP001','What Really Happens When You Click Login?','SPLINE_BUILD','IN_PRODUCTION','v2.5');

insert into agent_profile(id,agent_key,name,instructions_version,permission_level,enabled) values
('33333333-3333-3333-3333-333333333333','SPLINE_AGENT','Spline Agent','0.1','LEVEL_1',true);

insert into agent_thread(id,episode_id,agent_profile_id,status) values
('44444444-4444-4444-4444-444444444444','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','READY_FOR_REVIEW');

insert into agent_message(id,thread_id,sender,content) values
('55555555-5555-5555-5555-555555555551','44444444-4444-4444-4444-444444444444','AGENT','I reviewed the approved Session Restore flow. I can reproduce the next animation using existing components only.'),
('55555555-5555-5555-5555-555555555552','44444444-4444-4444-4444-444444444444','SYSTEM','Master scene is protected. Execution will target a sandbox copy.');

insert into proposal(id,thread_id,title,summary,risk_level,confidence,status,affected_objects,proposed_operations) values
('66666666-6666-6666-6666-666666666666','44444444-4444-4444-4444-444444444444','Restore Session Flow','Reuse the approved restore path and camera grammar without introducing new hero components.','LOW',0.9200,'READY_FOR_REVIEW',
 '["SessionRestore_ICON","RestoreToAuthState_PATH","AuthState"]'::jsonb,
 '["Keep image assets static","Animate the restore flow only","Reuse the approved camera behavior","Generate a review preview before any master change"]'::jsonb);
