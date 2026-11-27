create table episode_distribution_revision (
    package_id uuid not null references episode_package_import(id),
    item_id uuid not null,
    revision integer not null check(revision between 1 and 100),
    platform varchar(24) not null,
    kind varchar(24) not null check(kind in ('ARTICLE','POST','RESEARCH','DISCUSSION')),
    title varchar(200) not null,
    body text not null check(octet_length(body)<=131072),
    sources text not null check(octet_length(sources)<=16384),
    assets text not null check(octet_length(assets)<=8192),
    destination varchar(300) not null,
    launch_day integer not null check(launch_day between -30 and 365),
    state varchar(24) not null check(state in ('DRAFT','APPROVED','READY_TO_PUBLISH','PUBLISHED','BLOCKED','SKIPPED')),
    evidence text not null check(octet_length(evidence)<=16384),
    published_url varchar(2048),
    published_on date,
    master_sha256 varchar(64),
    actor varchar(256) not null,
    recorded_at timestamptz not null default now(),
    primary key(package_id,item_id,revision),
    check(master_sha256 is null or master_sha256 ~ '^[a-f0-9]{64}$'),
    check((state='PUBLISHED')=(published_url is not null and published_on is not null))
);
create table episode_distribution_launch (
    package_id uuid primary key references episode_package_import(id),
    revision integer not null check(revision>0),
    video_url varchar(2048),
    launch_date date,
    actor varchar(256) not null,
    updated_at timestamptz not null default now()
);
create index episode_distribution_latest_idx on episode_distribution_revision(package_id,item_id,revision desc);
