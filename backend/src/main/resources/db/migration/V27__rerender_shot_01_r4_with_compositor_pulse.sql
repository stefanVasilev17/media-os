update spline_shot_render
set status = 'QUEUED',
    progress = 0,
    worker_id = null,
    error = null,
    video_data = null,
    size_bytes = null,
    claimed_at = null,
    started_at = null,
    finished_at = null,
    updated_at = now()
where id = 'cc81d25e-bd72-4954-ae18-5184d155db95'
  and status = 'SUCCEEDED';
