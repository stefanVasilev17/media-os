-- Exact, deterministic assertions attached to Director-reviewed Production Memory rules.
-- A quality assertion inherits episode/global scope from its source memory rule.
-- AI suggestions never create or activate assertions automatically.
create table production_quality_assertion (
  id uuid primary key,
  memory_rule_id uuid not null references production_memory_rule(id),
  target varchar(24) not null check(target in ('NARRATION','VOICE_DIRECTION','VISUAL_DIRECTION')),
  predicate varchar(24) not null check(predicate in ('FORBIDDEN_LITERAL','REQUIRED_LITERAL')),
  literal_value varchar(600) not null check (length(trim(literal_value)) between 2 and 600),
  director_note varchar(1500) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(memory_rule_id, target, predicate, literal_value)
);
create index idx_production_quality_assertion_active
  on production_quality_assertion(memory_rule_id) where active;
