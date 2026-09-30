alter table ai_call_ledger
    add column if not exists cached_input_tokens integer,
    add column if not exists reasoning_tokens integer;
