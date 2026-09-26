update spline_shot_render
set status = 'QUEUED',
    progress = 0,
    worker_id = null,
    error = null,
    claimed_at = null,
    started_at = null,
    finished_at = null,
    updated_at = now()
where status = 'FAILED'
  and error like 'ffmpeg exited null:%';
