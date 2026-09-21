create table runner_heartbeat (
  worker_id varchar(180) primary key,
  hostname varchar(180) not null,
  status varchar(80) not null,
  runner_version varchar(80) not null,
  worker_version varchar(80) not null,
  production_commit varchar(80) not null,
  last_error text,
  last_seen timestamptz not null default now()
);

create index idx_runner_heartbeat_last_seen
  on runner_heartbeat(last_seen desc);
