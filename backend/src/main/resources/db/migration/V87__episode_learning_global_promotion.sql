-- An episode correction can become a project-wide rule ONLY through reviewed promotion.
-- Never modify/delete the original episode memory. No automatic global insertion.
create table episode_learning_proposal (
  id uuid primary key,
  project_id uuid not null references project(id),
  source_episode_id uuid not null references episode(id),
  source_rule_id uuid not null references production_memory_rule(id),
  scope varchar(40) not null,
  proposed_content text not null,
  status varchar(24) not null default 'PENDING',
  classification varchar(32) not null default 'UNREVIEWED',
  rationale text not null default '',
  review_note text,
  reviewed_by varchar(120),
  reviewed_at timestamptz,
  global_rule_id uuid references production_memory_rule(id),
  preflight_audit_id uuid references production_preflight_audit(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint episode_learning_status_check check (status in ('PENDING','PROMOTED','EPISODE_ONLY','REJECTED','ALREADY_GLOBAL')),
  constraint episode_learning_scope_check check (scope in ('ALL','SCRIPT','VOICE','VISUAL')),
  constraint episode_learning_classification_check check
    (classification in ('UNREVIEWED','GLOBAL_REUSABLE','EPISODE_SPECIFIC','NOT_REUSABLE')),
  constraint episode_learning_one_proposal_per_source unique (source_rule_id)
);
create index idx_episode_learning_pending on episode_learning_proposal(project_id,status,created_at);
create index idx_episode_learning_episode on episode_learning_proposal(source_episode_id,created_at);

-- The additional unique index prevents two approvals of the same global rule
-- only when earlier duplicate global rules are already absent; enforce new
-- promotion uniqueness in service transaction instead of assuming old data is clean.
