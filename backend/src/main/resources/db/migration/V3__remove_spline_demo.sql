delete from approval_decision where proposal_id = '66666666-6666-6666-6666-666666666666';
delete from correction where proposal_id = '66666666-6666-6666-6666-666666666666';
delete from proposal where id = '66666666-6666-6666-6666-666666666666';
delete from agent_message where thread_id = '44444444-4444-4444-4444-444444444444';
delete from agent_thread where id = '44444444-4444-4444-4444-444444444444';
delete from agent_profile where id = '33333333-3333-3333-3333-333333333333';

update episode
set current_stage = 'LIVE_MAP'
where id = '22222222-2222-2222-2222-222222222222'
  and current_stage = 'SPLINE_BUILD';
