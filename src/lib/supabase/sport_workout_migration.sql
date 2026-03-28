-- ─── Sport-Specific Workout System Migration ────────────────────────────────
-- Run this in the Supabase SQL editor to add sport/format support.
-- All ALTER TABLE statements are idempotent (safe to run multiple times).

-- 1. Add sport_category and format to program_workouts
alter table public.program_workouts
  add column if not exists sport_category text not null default 'strength',
  add column if not exists format         text not null default 'straight_sets';

-- 2. Create workout_sections table (blocks within a session)
create table if not exists public.workout_sections (
  id                  uuid         default gen_random_uuid() primary key,
  workout_id          uuid         not null references public.program_workouts(id) on delete cascade,
  title               text,
  format              text         not null default 'straight_sets',
  rounds              integer,
  time_limit_seconds  integer,
  work_seconds        integer,
  rest_seconds        integer,
  order_index         integer      not null default 0,
  created_at          timestamptz  not null default now()
);

create index if not exists idx_workout_sections_workout on public.workout_sections(workout_id);

alter table public.workout_sections enable row level security;

create policy "Access workout sections"
  on public.workout_sections for all
  using (
    exists (
      select 1
      from public.program_workouts pw
      join public.programs p on p.id = pw.program_id
      where pw.id = workout_id
        and (
          p.coach_id = auth.uid()
          or (p.client_id = auth.uid() and p.status in ('active', 'completed'))
        )
    )
  );

-- 3. Add section_id to program_workout_exercises (optional FK — null = legacy/no section)
alter table public.program_workout_exercises
  add column if not exists section_id       uuid references public.workout_sections(id) on delete set null,
  add column if not exists duration_seconds integer,
  add column if not exists distance_meters  numeric(10, 2),
  add column if not exists pace             text,
  add column if not exists heart_rate_zone  integer check (heart_rate_zone between 1 and 5),
  add column if not exists calories         integer,
  add column if not exists coach_notes      text;

-- Note: rpe and tempo columns already exist on program_workout_exercises.
-- Note: reps_min / reps_max are int; for flexible reps (e.g. "8-12", "AMRAP") use notes/coach_notes.
