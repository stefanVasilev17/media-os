-- Add external-media references without deleting or rewriting any legacy Take.
-- All new voice inserts must use verified S3 object metadata, never BYTEA.
alter table episode_package_voice_take
    alter column audio drop not null,
    add column audio_object_key text,
    add column audio_sha256 char(64),
    add column audio_size_bytes bigint,
    add column storage_status varchar(20) not null default 'LEGACY_DB';

alter table episode_package_voice_take
    add constraint episode_voice_take_storage_exclusive_ck check (
        (storage_status = 'LEGACY_DB'
         and audio is not null and audio_object_key is null
         and audio_sha256 is null and audio_size_bytes is null)
        or
        (storage_status = 'OBJECT_VERIFIED'
         and audio is null and audio_object_key is not null
         and audio_object_key like 'mediaos/media/voice/v1/%'
         and audio_sha256 ~ '^[a-f0-9]{64}$'
         and audio_size_bytes between 1 and 25165824)
    );

create unique index episode_package_voice_object_key_uniq
    on episode_package_voice_take(audio_object_key)
    where audio_object_key is not null;

alter table episode_package_voice_request
    add column uploaded_object_key text,
    add column uploaded_object_sha256 char(64),
    add column uploaded_object_bytes bigint;

alter table episode_package_voice_request
    add constraint episode_voice_request_uploaded_object_manifest_ck check (
        (uploaded_object_key is null and uploaded_object_sha256 is null
            and uploaded_object_bytes is null)
        or
        (uploaded_object_key like 'mediaos/media/voice/v1/%'
            and uploaded_object_sha256 ~ '^[a-f0-9]{64}$'
            and uploaded_object_bytes between 1 and 25165824)
    );

-- A database-side admission guard protects against old application binaries
-- accidentally writing new voice binary rows even when a backend gate is misconfigured.
create or replace function reject_new_episode_voice_bytea()
returns trigger language plpgsql as $$
begin
    if NEW.audio is not null then
        raise exception 'P0_VOICE_OBJECT_STORAGE_REQUIRED: new voice BYTEA is forbidden'
            using errcode = '23514';
    end if;
    return NEW;
end;
$$;

create trigger episode_package_voice_no_new_binary
before insert on episode_package_voice_take
for each row execute function reject_new_episode_voice_bytea();

create trigger episode_package_voice_no_audio_rewrite
before update of audio on episode_package_voice_take
for each row execute function reject_new_episode_voice_bytea();
