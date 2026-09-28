insert into agent_profile(id, agent_key, name, instructions_version, permission_level, enabled)
values (
  '33333333-3333-3333-3333-333333333334',
  'DIRECTOR_AGENT',
  'MediaOS Director',
  '1.0',
  'LEVEL_1',
  true
)
on conflict (agent_key) do update
set name = excluded.name,
    instructions_version = excluded.instructions_version,
    permission_level = excluded.permission_level,
    enabled = excluded.enabled;

insert into agent_thread(id, episode_id, agent_profile_id, status)
select
  '44444444-4444-4444-4444-444444444445',
  '22222222-2222-2222-2222-222222222222',
  ap.id,
  'ACTIVE'
from agent_profile ap
where ap.agent_key = 'DIRECTOR_AGENT'
  and not exists (
    select 1
    from agent_thread t
    where t.episode_id = '22222222-2222-2222-2222-222222222222'
      and t.agent_profile_id = ap.id
  );

insert into agent_message(id, thread_id, sender, content)
select
  '55555555-5555-5555-5555-555555555561',
  t.id,
  'AGENT',
  'Director Room is ready. Bring me an idea, a concern, a scene, or a production decision. I will challenge weak assumptions, trace downstream impact, and keep discussion separate from locked production decisions.'
from agent_thread t
join agent_profile ap on ap.id = t.agent_profile_id
where ap.agent_key = 'DIRECTOR_AGENT'
  and t.episode_id = '22222222-2222-2222-2222-222222222222'
  and not exists (
    select 1 from agent_message m where m.thread_id = t.id
  );

create index if not exists idx_agent_message_thread_created
  on agent_message(thread_id, created_at);

create index if not exists idx_proposal_thread_created
  on proposal(thread_id, created_at desc);
