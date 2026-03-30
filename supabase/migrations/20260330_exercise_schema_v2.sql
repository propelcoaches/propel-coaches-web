-- Exercise library schema v2
-- Enriches the exercises table with full coaching metadata
-- Adds progression/regression linking system
-- Expands categories to include 'running'

-- ─── DROP & RECREATE CATEGORY CONSTRAINT (adds 'running') ────────────────────
alter table exercises drop constraint if exists exercises_category_check;
alter table exercises
  add constraint exercises_category_check
    check (category in (
      'strength','cardio','running','mobility','warm_up','cool_down',
      'plyometric','rehab','functional','yoga_pilates','sport_specific'
    ));

-- ─── NEW COLUMNS ─────────────────────────────────────────────────────────────
alter table exercises
  add column if not exists subcategory        text,
  add column if not exists coaching_cues      text[] not null default '{}',
  add column if not exists progressions       text[] not null default '{}',
  add column if not exists regressions        text[] not null default '{}',
  add column if not exists tags               text[] not null default '{}',
  add column if not exists contraindications  text[] not null default '{}',
  add column if not exists force_type         text,
  add column if not exists plane_of_motion    text,
  add column if not exists is_unilateral      boolean not null default false,
  add column if not exists sets_default       integer,
  add column if not exists reps_default       integer,
  add column if not exists duration_seconds   integer,
  add column if not exists rest_seconds       integer,
  add column if not exists distance_meters    integer;

-- ─── CONSTRAINTS ─────────────────────────────────────────────────────────────
alter table exercises
  add constraint exercises_force_type_check
    check (force_type is null or force_type in ('push','pull','isometric','explosive','mixed','locomotion')),
  add constraint exercises_plane_check
    check (plane_of_motion is null or plane_of_motion in ('sagittal','frontal','transverse','multi'));

-- ─── EXERCISE PROGRESSIONS LINKING TABLE ─────────────────────────────────────
-- Links exercises into progression trees
-- progression_type: 'harder' | 'easier' | 'variation' | 'unilateral' | 'loaded'
create table if not exists exercise_progressions (
  id              uuid primary key default gen_random_uuid(),
  exercise_id     uuid not null references exercises(id) on delete cascade,
  linked_id       uuid not null references exercises(id) on delete cascade,
  link_type       text not null default 'progression'
                    check (link_type in ('progression','regression','variation','alternative')),
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  unique (exercise_id, linked_id, link_type)
);

alter table exercise_progressions enable row level security;

create policy "exercise_progressions_select" on exercise_progressions
  for select using (true);

-- ─── EXERCISE SUPERSET / PAIRING TABLE ───────────────────────────────────────
-- Allows coaches to define recommended pairings (agonist/antagonist, superset)
create table if not exists exercise_pairings (
  id              uuid primary key default gen_random_uuid(),
  exercise_id     uuid not null references exercises(id) on delete cascade,
  paired_id       uuid not null references exercises(id) on delete cascade,
  pairing_type    text not null default 'superset'
                    check (pairing_type in ('superset','antagonist','pre_exhaust','compound_set','circuit')),
  created_at      timestamptz not null default now(),
  unique (exercise_id, paired_id)
);

alter table exercise_pairings enable row level security;

create policy "exercise_pairings_select" on exercise_pairings
  for select using (true);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
create index if not exists exercises_tags_idx         on exercises using gin(tags);
create index if not exists exercises_force_type_idx   on exercises(force_type);
create index if not exists exercises_plane_idx        on exercises(plane_of_motion);
create index if not exists exercises_unilateral_idx   on exercises(is_unilateral);
create index if not exists exercises_subcategory_idx  on exercises(subcategory);
create index if not exists ex_progressions_ex_idx     on exercise_progressions(exercise_id);
create index if not exists ex_progressions_linked_idx on exercise_progressions(linked_id);
