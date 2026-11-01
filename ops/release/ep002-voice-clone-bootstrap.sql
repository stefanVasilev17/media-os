-- Run ONLY against the isolated target database after restoring a read-only
-- production snapshot into its own PostgreSQL instance. Never run on live EP001.
-- psql variable 'marker' must be a new 64-character lowercase hexadecimal secret.
-- This file deliberately does not contain a real value or authorize a migration.
begin;
do $guard$
declare
  ep001_total bigint;
  ep002_total bigint;
  source_version text;
begin
  if current_setting('mediaos.ep002_voice_target_bootstrap', true) is distinct from 'confirmed' then
    raise exception 'Refusing isolated Voice bootstrap without target-only session authorization';
  end if;
  select count(*) into ep001_total from episode where episode_number='EP001';
  select count(*) into ep002_total from episode where episode_number='EP002';
  select version into source_version
    from flyway_schema_history where success=true
    order by installed_rank desc limit 1;
  if ep001_total <> 1 or ep002_total <> 0 or source_version <> '85' then
    raise exception 'Target is not the expected fresh EP001-only V85 clone';
  end if;
  if to_regclass('public.mediaos_voice_isolated_bootstrap') is not null then
    raise exception 'Voice isolation was already bootstrapped';
  end if;
end
$guard$;

create table public.mediaos_voice_isolated_bootstrap (
  singleton_id integer primary key check (singleton_id=1),
  marker char(64) not null,
  created_at timestamptz not null default now()
);
insert into public.mediaos_voice_isolated_bootstrap (singleton_id, marker)
values (1, :'marker');
commit;
