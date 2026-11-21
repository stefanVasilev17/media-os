-- Director-owned immutable SHOT MP4 selections and latest continuous episode film.
-- Editing narration never removes or rewrites an already locked asset.
create table if not exists episode_director_shot_lock (
    package_id uuid not null references episode_package_import(id) on delete restrict,
    shot_key varchar(8) not null
      check(shot_key ~ '^SHOT(0[1-9]|[123][0-9]|40)$'),
    render_id uuid not null references remotion_render(id) on delete restrict,
    locked_at timestamptz not null default now(),
    primary key(package_id,shot_key)
);
create index if not exists episode_director_shot_lock_render_idx
    on episode_director_shot_lock(render_id);

create table if not exists episode_director_film (
    package_id uuid primary key references episode_package_import(id) on delete restrict,
    film_id uuid not null unique,
    object_key text not null,
    sha256 varchar(64) not null,
    byte_count bigint not null check(byte_count >= 1024 and byte_count <= 268435456),
    shot_count integer not null check(shot_count between 1 and 40),
    render_ids text not null,
    duration_in_frames integer not null check(duration_in_frames > 0),
    created_at timestamptz not null default now()
);
