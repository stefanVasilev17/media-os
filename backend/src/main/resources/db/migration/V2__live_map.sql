create table job (
  id uuid primary key,
  project_id uuid not null references project(id),
  name varchar(200) not null,
  job_type varchar(80) not null,
  status varchar(40) not null,
  progress integer not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table task (
  id uuid primary key,
  job_id uuid not null references job(id),
  parent_task_id uuid references task(id),
  name varchar(220) not null,
  task_type varchar(80) not null,
  status varchar(40) not null,
  sequence_no integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table agent_run (
  id uuid primary key,
  task_id uuid not null references task(id),
  agent_key varchar(120) not null,
  status varchar(40) not null,
  started_at timestamptz,
  finished_at timestamptz
);

create table artifact (
  id uuid primary key,
  task_id uuid not null references task(id),
  agent_run_id uuid references agent_run(id),
  artifact_type varchar(80) not null,
  name varchar(220) not null,
  uri text,
  status varchar(40) not null,
  created_at timestamptz not null default now()
);

create table approval (
  id uuid primary key,
  task_id uuid not null references task(id),
  agent_run_id uuid references agent_run(id),
  status varchar(40) not null,
  comment text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table event (
  id uuid primary key,
  project_id uuid not null references project(id),
  job_id uuid references job(id),
  task_id uuid references task(id),
  agent_run_id uuid references agent_run(id),
  event_type varchar(100) not null,
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_job_project on job(project_id);
create index idx_task_job on task(job_id);
create index idx_agent_run_task on agent_run(task_id);
create index idx_event_project_created on event(project_id, created_at desc);

insert into job(id, project_id, name, job_type, status, progress)
values (
  '77777777-7777-7777-7777-777777777777',
  '11111111-1111-1111-1111-111111111111',
  'Media OS Bootstrap',
  'PLATFORM_SETUP',
  'RUNNING',
  75
);

insert into task(id, job_id, name, task_type, status, sequence_no) values
('88888888-8888-8888-8888-888888888881','77777777-7777-7777-7777-777777777777','Railway infrastructure','INFRASTRUCTURE','COMPLETED',1),
('88888888-8888-8888-8888-888888888882','77777777-7777-7777-7777-777777777777','Spring Boot backend','BACKEND','COMPLETED',2),
('88888888-8888-8888-8888-888888888883','77777777-7777-7777-7777-777777777777','Live Map foundation','LIVE_MAP','RUNNING',3),
('88888888-8888-8888-8888-888888888884','77777777-7777-7777-7777-777777777777','Orchestrator integration','ORCHESTRATOR','PENDING',4);

insert into event(id, project_id, job_id, task_id, event_type, message) values
('99999999-9999-9999-9999-999999999991','11111111-1111-1111-1111-111111111111','77777777-7777-7777-7777-777777777777','88888888-8888-8888-8888-888888888881','TASK_COMPLETED','Railway infrastructure is online.'),
('99999999-9999-9999-9999-999999999992','11111111-1111-1111-1111-111111111111','77777777-7777-7777-7777-777777777777','88888888-8888-8888-8888-888888888882','TASK_COMPLETED','Spring Boot backend is deployed and connected to PostgreSQL.'),
('99999999-9999-9999-9999-999999999993','11111111-1111-1111-1111-111111111111','77777777-7777-7777-7777-777777777777','88888888-8888-8888-8888-888888888883','TASK_STARTED','Live Map foundation implementation started.');
