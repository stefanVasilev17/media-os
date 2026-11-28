-- Preserve every existing revision and hash. Extend only the image MIME allowlist.
do $$
declare
    old_constraint text;
    matching_count integer;
begin
    select count(*),min(conname::text) into matching_count,old_constraint
    from pg_constraint
    where conrelid='episode_publishing_revision'::regclass
      and contype='c'
      and pg_get_constraintdef(oid) like '%object_type%'
      and pg_get_constraintdef(oid) like '%object_key%';
    if matching_count<>1 then
        raise exception 'Expected one existing publishing thumbnail manifest constraint, found %',matching_count;
    end if;
    execute format('alter table episode_publishing_revision drop constraint %I',old_constraint);
end $$;
alter table episode_publishing_revision
    add constraint episode_publishing_thumbnail_manifest_check
    check ((object_key is null and object_sha256 is null and object_bytes is null and object_type is null)
      or (field_key='THUMBNAIL_ASSET' and object_key is not null and object_sha256 ~ '^[a-f0-9]{64}$'
        and object_bytes between 1 and 2097152 and object_type in ('image/png','image/jpeg','image/webp')));
