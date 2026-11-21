-- One-time, fail-closed settlement of the exact Director-approved EP004 SHOT01
-- job that rendered video frames but could not read the selected private S3 Take
-- because the worker voice GET route was absent from the workload allowlist.
-- Railway worker log: EP004_SELECTED_TAKE_NOT_AVAILABLE 403 at 2026-11-19T15:25:27Z.
-- Its /fail callback was also rejected by the episode identity preflight.
--
-- This migration does NOT enqueue CPU work, regenerate TTS, delete voice/media,
-- or rewrite any other render. A NEW explicit Director CPU authorization is required
-- for any further attempt. Restrict to the exact immutable job, selected source,
-- expected V3 worker and absence of a successful external MP4 manifest.
update remotion_render
   set status='FAILED', progress=0,
       error='EP004_SHOT01_ORIGINAL_TAKE_MUX_403_WORKER_CALLBACK_DENIED_NO_AUTOMATIC_RETRY',
       finished_at=now(), updated_at=now()
 where id='e7e0a1ea-b9f3-4686-9fb6-41ef074659a6'::uuid
   and project_id='11111111-1111-1111-1111-111111111111'::uuid
   and episode_id is null
   and composition_id='EP004-SHOT01-ORDINARY-WORKDAY-V1-VISUAL'
   and profile='REVIEW'
   and status='RUNNING'
   and width=1920 and height=1080 and fps=30 and duration_in_frames=2001
   and input_props->>'expectedSourceCommit'='26e71933a66fa36566b720e149cc1ada56b1c27b'
   and input_props->>'sourceSha256'='a47b5d2af200014828089bcfb0812017970a8ecfe623cefc67456359af4fe365'
   and input_props->>'directorCpuApproved'='true'
   and input_props->>'previewOnly'='false'
   and input_props->>'voiceTakeId' is not null
   and input_props->>'renderRequestId' is not null
   and video_object_key is null
   and coalesce(size_bytes,0)=0
   and started_at < '2026-11-19T15:26:00Z'::timestamptz;
