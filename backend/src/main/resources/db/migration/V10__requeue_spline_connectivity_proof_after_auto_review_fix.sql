update production_job
set status = 'QUEUED',
    worker_id = null,
    claimed_at = null,
    started_at = null,
    finished_at = null,
    result = null,
    error = null,
    updated_at = now()
where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
  and status = 'FAILED';

update task
set status = 'PENDING',
    updated_at = now()
where id = '88888888-8888-8888-8888-888888888885'
  and status = 'FAILED';

insert into event(id, project_id, job_id, task_id, event_type, message, payload)
values (
  '99999999-9999-9999-9999-999999999991',
  '11111111-1111-1111-1111-111111111111',
  '77777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888885',
  'SPLINE_JOB_REQUEUED',
  'Spline MCP connectivity proof was requeued after enabling Codex auto-review and semantic result handling.',
  '{"productionJobId":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1","reason":"codex-auto-review-semantic-result"}'::jsonb
);
