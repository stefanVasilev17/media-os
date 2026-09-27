update spline_shot_render
set status = 'QUEUED',
    progress = 0,
    worker_id = null,
    media_type = null,
    video_data = null,
    size_bytes = null,
    error = null,
    claimed_at = null,
    started_at = null,
    finished_at = null,
    updated_at = now()
where id = 'cc81d25e-bd72-4954-ae18-5184d155db95'::uuid
  and shot_key = 'SHOT_01'
  and revision = 4;
