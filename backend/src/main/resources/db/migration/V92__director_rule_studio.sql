-- Proposed rules are inactive. Only an authenticated Director approval
-- can publish a new Production Memory rule for future first-pass prompts.
create table production_rule_studio_proposal (
  id uuid primary key,
  project_id uuid not null references project(id),
  episode_id uuid references episode(id),
  parent_proposal_id uuid references production_rule_studio_proposal(id),
  scope varchar(20) not null
    check(scope in ('ALL','SCRIPT','VOICE','VISUAL','VOICE_VISUAL')),
  source_prompt text not null,
  proposed_rule text not null,
  explanation_bg text not null default '',
  positive_example text not null default '',
  negative_example text not null default '',
  source_kind varchar(16) not null check(source_kind in ('OPENAI','MANUAL')),
  status varchar(16) not null default 'DRAFT'
    check(status in ('DRAFT','APPROVED','REJECTED')),
  rule_fingerprint char(64) not null,
  published_memory_rule_id uuid references production_memory_rule(id),
  director_note text,
  reviewer varchar(120),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check((status='APPROVED' and published_memory_rule_id is not null)
         or (status<>'APPROVED'))
);
create index idx_rule_studio_project_history
  on production_rule_studio_proposal(project_id,created_at desc);
create index idx_rule_studio_episode_scope
  on production_rule_studio_proposal(episode_id,scope,status);

create table production_rule_studio_decision_audit (
  id uuid primary key,
  proposal_id uuid not null references production_rule_studio_proposal(id),
  decision varchar(16) not null check(decision in ('APPROVE','REJECT')),
  comparison_fingerprint char(64) not null,
  director_note text not null,
  reviewer varchar(120) not null,
  published_memory_rule_id uuid references production_memory_rule(id),
  created_at timestamptz not null default now()
);
