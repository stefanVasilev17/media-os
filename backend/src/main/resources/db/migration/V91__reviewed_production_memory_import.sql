-- Staging import is inert. Only individually reviewed candidates can become active
-- Production Memory rules; archived attempts retain their original source and decisions.
create table production_memory_import_batch (
  id uuid primary key,
  project_id uuid not null references project(id),
  file_sha256 char(64) not null,
  source_label varchar(180) not null,
  schema_version varchar(140) not null,
  candidate_count int not null check(candidate_count between 1 and 500),
  created_at timestamptz not null default now(),
  unique (project_id, file_sha256)
);

create table production_memory_import_candidate (
  id uuid primary key,
  batch_id uuid not null references production_memory_import_batch(id),
  candidate_key varchar(90) not null,
  target_episode varchar(16) not null,
  target_episode_id uuid references episode(id),
  scope varchar(20) not null check(scope in ('ALL','SCRIPT','VOICE','VISUAL')),
  rule_type varchar(20) not null check(rule_type in ('LOCK','QA','CORRECTION','PREFERENCE')),
  severity varchar(20) not null check(severity in ('REQUIRED','PREFERENCE')),
  proposed_rule text not null,
  source_file varchar(260) not null,
  source_line int not null check(source_line > 0),
  source_excerpt text not null,
  declared_source_sha256 char(64) not null,
  source_verification varchar(30) not null default 'DECLARED_UNVERIFIED',
  status varchar(25) not null default 'PENDING'
    check(status in ('PENDING','ACTIVATED','EXISTING','REJECTED')),
  activated_rule_id uuid references production_memory_rule(id),
  review_note text,
  reviewed_by varchar(120),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(batch_id,candidate_key),
  check ((target_episode = 'GLOBAL' and target_episode_id is null)
         or (target_episode <> 'GLOBAL')),
  check ((status='ACTIVATED' and activated_rule_id is not null)
         or (status<>'ACTIVATED'))
);
create index idx_pm_import_batch_status on production_memory_import_candidate(batch_id,status);

create table production_memory_import_review_audit (
  id uuid primary key,
  candidate_id uuid not null references production_memory_import_candidate(id),
  action varchar(30) not null,
  compared_fingerprint char(64) not null,
  review_note text not null,
  reviewer varchar(120) not null,
  resulting_rule_id uuid references production_memory_rule(id),
  created_at timestamptz not null default now()
);
