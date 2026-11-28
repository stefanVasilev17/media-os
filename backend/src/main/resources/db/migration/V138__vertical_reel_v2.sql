-- Preserve every V1 artifact and permit separate V2 jobs for the same locked source.
alter table episode_reel_vertical drop constraint episode_reel_vertical_pkey;
alter table episode_reel_vertical drop constraint episode_reel_vertical_template_version_check;
alter table episode_reel_vertical add primary key (reel_id,template_version);
alter table episode_reel_vertical add constraint episode_reel_vertical_template_version_check
    check(template_version in ('AT_VERTICAL_V1','AT_VERTICAL_V2'));
alter table episode_reel_vertical add column focus_start_frame integer;
alter table episode_reel_vertical add constraint episode_reel_vertical_focus_check
    check(focus_start_frame is null or (template_version='AT_VERTICAL_V2' and focus_start_frame between 0 and 5399));
