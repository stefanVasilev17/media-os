create or replace function mediaos_mark_creative_stages_for_build()
returns trigger as $$
begin
  update production_stage
  set status='BUILDING',
      summary='Autonomous initial build is preparing the first complete Script draft.',
      next_action='Wait for the cloud build to finish, then review and correct the Script.',
      readiness='{"ready":false,"remainingTasks":["Autonomous initial build is still running."]}'::jsonb,
      updated_at=now()
  where episode_id=new.episode_id
    and stage_key='SCRIPT'
    and status <> 'LOCKED';

  update production_stage
  set status='WAITING',
      summary='Scene Agent is waiting for the autonomous Script draft.',
      next_action='The autonomous build will create the provisional Scene plan after Script validation.',
      readiness='{"ready":false,"remainingTasks":["Waiting for the autonomous Script draft."]}'::jsonb,
      updated_at=now()
  where episode_id=new.episode_id
    and stage_key='SCENE'
    and status <> 'LOCKED';
  return new;
end;
$$ language plpgsql;

create trigger trg_mediaos_mark_creative_stages_for_build
after insert on episode_build_run
for each row
execute function mediaos_mark_creative_stages_for_build();

create or replace function mediaos_surface_build_failure_on_stage()
returns trigger as $$
begin
  if new.status in ('FAILED','NEEDS_REVIEW') and old.status is distinct from new.status then
    if new.current_step='TRUTH' then
      update production_stage
      set status='WAITING',
          summary='Autonomous build paused before Script because the Truth audit needs attention.',
          next_action=coalesce(new.error_message,'Review the Truth audit before retrying.'),
          readiness=jsonb_build_object('ready',false,'remainingTasks',jsonb_build_array(coalesce(new.error_message,'Review the Truth audit before retrying.'))),
          updated_at=now()
      where episode_id=new.episode_id and stage_key='SCRIPT' and status <> 'LOCKED';
    elsif new.current_step='SCRIPT' then
      update production_stage
      set status='NEEDS_ATTENTION',
          summary='Autonomous Script generation needs attention.',
          next_action=coalesce(new.error_message,'Retry the autonomous build or review the Script Agent.'),
          readiness=jsonb_build_object('ready',false,'remainingTasks',jsonb_build_array(coalesce(new.error_message,'Retry Script generation.'))),
          updated_at=now()
      where episode_id=new.episode_id and stage_key='SCRIPT' and status <> 'LOCKED';
    elsif new.current_step='SCENE' then
      update production_stage
      set status='NEEDS_ATTENTION',
          summary='Autonomous Scene generation needs attention.',
          next_action=coalesce(new.error_message,'Retry the autonomous build or regenerate Scene after Script review.'),
          readiness=jsonb_build_object('ready',false,'remainingTasks',jsonb_build_array(coalesce(new.error_message,'Retry Scene generation.'))),
          updated_at=now()
      where episode_id=new.episode_id and stage_key='SCENE' and status <> 'LOCKED';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_mediaos_surface_build_failure_on_stage
after update of status on episode_build_run
for each row
execute function mediaos_surface_build_failure_on_stage();
