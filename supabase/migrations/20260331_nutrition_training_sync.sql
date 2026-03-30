-- Nutrition × Training sync
-- Links a nutrition plan to a training program so macros can be synchronised
-- when the program goal changes

alter table nutrition_plans_v2
  add column if not exists linked_program_id uuid references programs(id) on delete set null,
  add column if not exists sync_notes        text,
  add column if not exists last_synced_at    timestamptz;

create index if not exists nutrition_plans_linked_program_idx
  on nutrition_plans_v2(linked_program_id)
  where linked_program_id is not null;

-- View that joins each client's active nutrition plan with their active program
-- so the API can read "program goal → current macros" in a single query
create or replace view client_nutrition_program_view as
  select
    np.id                as nutrition_plan_id,
    np.client_id,
    np.coach_id,
    np.name              as plan_name,
    np.calories_target,
    np.protein_target,
    np.carbs_target,
    np.fat_target,
    np.fibre_target,
    np.linked_program_id,
    np.last_synced_at,
    p.id                 as program_id,
    p.name               as program_name,
    p.goal               as program_goal,
    p.duration_weeks,
    p.days_per_week,
    p.status             as program_status
  from nutrition_plans_v2 np
  left join programs p
    on  p.client_id = np.client_id
    and p.status    = 'active'
  where np.status = 'published';
