-- Make key verified Director decisions queryable to runtime agents.
-- This does not alter approved assets, scene files or immutable source MP4s.
insert into production_memory_rule (id,project_id,episode_id,scope,rule_type,severity,content,source)
values
('90000000-0000-4000-8000-000000009113','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','ALL','LOCK','REQUIRED',
 'EP001 STORY LOCK (2026-10-21): The episode follows ONE successful Login end-to-end, ending at the logged-in Dashboard. Failure/slow dependency teaching belongs to EP002; do not reintroduce deferred failure scenes or refresh/restore branches into locked EP001.',
 'docs/episode-memory/events/2026-10-21-ep001-successful-login-only-ep002-failure-architecture-editorial-lock.md'),
('90000000-0000-4000-8000-000000009114','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','VOICE','LOCK','REQUIRED',
 'EP001 AUDIO MASTER DIRECTOR LOCK (2026-10-27): Canonical MP4 96699a27-7615-4ce1-a092-53cdf1e9d1af, 37703 frames, original approved narration and timing immutable. Separate Sound Design derivatives require Director review. Do not silently replace this source.',
 'docs/episode-memory/events/2026-10-27-ep001-audio-master-director-lock.md'),
('90000000-0000-4000-8000-000000009115','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','VISUAL','LOCK','REQUIRED',
 'EP001 THUMBNAIL A V2 DIRECTOR LOCK (2026-10-28): Preserve the exact PNG/SVG with fixed ACTIVE REQUEST label, ONE CLICK. MANY SYSTEMS. headline. No silent regeneration, replacement or recoloring. Full episode final release lock is still separate.',
 'docs/episode-memory/events/2026-10-28-ep001-thumbnail-a-v2-director-lock.md'),
('90000000-0000-4000-8000-000000009116','11111111-1111-1111-1111-111111111111',null,'VISUAL','QA','REQUIRED',
 'Before generating new Remotion assets inspect and reuse the approved EP001 Living Technical Interface: Phone, Network, API Gateway, Load Balancer, Auth Service, User Database, request/response paths, scene components and camera rules. Creating replacements merely for cosmetic novelty is prohibited; use a separately versioned component for genuine new behavior.',
 'Architectural Thinking Core Production Bible v2.3 / 2026-10-28 Director rule'),
('90000000-0000-4000-8000-000000009117','11111111-1111-1111-1111-111111111111',null,'SCRIPT','PREFERENCE','REQUIRED',
 'NEW EPISODE CREATIVE DIRECTION (2026-10-28): prioritize shorter self-contained technical storytelling, normally 12-14 minutes with a 15-minute ceiling, interview-grade engineering questions embedded naturally in a realistic story. This is Director feedback and a DRAFT direction, not permission to revise locked EP001.',
 'docs/episode-memory/plans/2026-10-28-compact-deep-engineering-storytelling-DRAFT.md')
on conflict (id) do nothing;
