-- AI program generation tracking
-- Adds ai_generated flag and metadata to program_templates

alter table program_templates
  add column if not exists ai_generated        boolean not null default false,
  add column if not exists ai_model            text,
  add column if not exists ai_generation_params jsonb;

create index if not exists program_templates_ai_generated_idx
  on program_templates(ai_generated)
  where ai_generated = true;
