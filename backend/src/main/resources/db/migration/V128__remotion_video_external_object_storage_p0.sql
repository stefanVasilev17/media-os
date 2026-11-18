-- V128: metadata-only new Remotion video objects. Keep every legacy MP4 byte untouched.
alter table remotion_render
    add column video_object_key text,
    add column video_sha256 char(64),
    add column video_object_bytes bigint,
    add column video_storage_verified_at timestamptz,
    add column video_retention_class varchar(32),
    add column video_expires_at timestamptz;

alter table remotion_render
    add constraint remotion_video_storage_exclusive_ck check (
        (video_object_key is null and video_sha256 is null
         and video_object_bytes is null and video_storage_verified_at is null
         and video_retention_class is null and video_expires_at is null)
        or
        (video_data is null
         and video_object_key ~ '^mediaos/media/video/v1/[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}\\.mp4$'
         and video_sha256 ~ '^[a-f0-9]{64}$'
         and video_object_bytes between 1024 and 268435456
         and video_storage_verified_at is not null
         and video_retention_class in ('DIRECTOR_REVIEW_PROTECTED','DIRECTOR_LOCKED','TEMPORARY')
         and (video_retention_class <> 'TEMPORARY' or video_expires_at is not null))
    );

create unique index remotion_video_object_key_unique
    on remotion_render(video_object_key)
    where video_object_key is not null;

-- A legacy release binary can no longer insert a new video BYTEA row.
-- Updating unrelated metadata on grandfathered renders is allowed.
create or replace function reject_new_remotion_video_bytea()
returns trigger language plpgsql as $$
begin
    if TG_OP = 'INSERT' and NEW.video_data is not null then
        raise exception 'P0_VIDEO_OBJECT_STORAGE_REQUIRED: new MP4 BYTEA is forbidden'
            using errcode='23514';
    end if;
    if TG_OP = 'UPDATE' and NEW.video_data is not null
        and NEW.video_data is distinct from OLD.video_data then
        raise exception 'P0_VIDEO_OBJECT_STORAGE_REQUIRED: MP4 BYTEA replacement forbidden'
            using errcode='23514';
    end if;
    return NEW;
end;
$$;

create trigger remotion_no_new_video_bytea
before insert or update of video_data on remotion_render
for each row execute function reject_new_remotion_video_bytea();
