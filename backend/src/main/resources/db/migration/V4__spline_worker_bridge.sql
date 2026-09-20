create table production_job (
  id uuid primary key,
  project_id uuid not null references project(id),
  task_id uuid references task(id),
  agent_key varchar(120) not null,
  task_type varchar(80) not null,
  target varchar(200) not null,
  instructions text not null,
  permissions jsonb not null default '[]'::jsonb,
  protected_objects jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  status varchar(40) not null,
  worker_id varchar(160),
  claimed_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_production_job_queue
  on production_job(agent_key, status, created_at);

update task
set sequence_no = 5
where id = '88888888-8888-8888-8888-888888888884';

insert into task(id, job_id, name, task_type, status, sequence_no)
values (
  '88888888-8888-8888-8888-888888888885',
  '77777777-7777-7777-7777-777777777777',
  'Spline MCP connectivity proof',
  'SPLINE_MCP',
  'PENDING',
  4
);

insert into production_job(
  id, project_id, task_id, agent_key, task_type, target, instructions,
  permissions, protected_objects, payload, status
)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  '11111111-1111-1111-1111-111111111111',
  '88888888-8888-8888-8888-888888888885',
  'SPLINE_AGENT',
  'CONNECTIVITY_PROOF',
  'FOCUSED_SPLINE_3D_TAB',
  'Use Spline MCP on the currently focused Spline 3D tab. Create a small cube named MEDIA_OS_CONNECTION_TEST. Place it away from existing architecture so it does not overlap existing objects. Give it a clearly visible cyan-like material. Do not delete, rename, move, recolor, resize, or otherwise modify any existing object. If MEDIA_OS_CONNECTION_TEST already exists, do not create a duplicate; instead make a harmless visible change only to that test object. Return a concise report of the exact Spline changes performed.',
  '["READ_SCENE","CREATE_TEST_OBJECT","EDIT_TEST_OBJECT"]'::jsonb,
  '["ALL_EXISTING_OBJECTS"]'::jsonb,
  '{"proof":"media-os-to-spline-mcp","safeSandboxRequired":true}'::jsonb,
  'QUEUED'
);

insert into event(id, project_id, job_id, task_id, event_type, message, payload)
values (
  '99999999-9999-9999-9999-999999999994',
  '11111111-1111-1111-1111-111111111111',
  '77777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888885',
  'SPLINE_JOB_QUEUED',
  'Spline MCP connectivity proof is queued and waiting for a production worker.',
  '{"productionJobId":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"}'::jsonb
);
