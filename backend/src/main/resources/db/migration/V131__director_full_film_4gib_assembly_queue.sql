-- Large continuous episodes and durable single-consumer assembly queue.
-- SHOT files keep the original 256 MiB bounded render limit.
alter table episode_director_film
    drop constraint if exists episode_director_film_byte_count_check;
alter table episode_director_film
    add constraint episode_director_film_byte_count_check
    check(byte_count between 1024 and 4294967296);

create table if not exists episode_director_film_job (
    package_id uuid primary key references episode_package_import(id) on delete restrict,
    render_ids text not null,
    status varchar(16) not null
       check(status in ('QUEUED','RUNNING','READY','ERROR')),
    attempts integer not null default 0 check(attempts between 0 and 5),
    error text,
    lease_until timestamptz,
    updated_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);
create index if not exists episode_director_film_job_pick_idx
    on episode_director_film_job(status,updated_at);
