-- Client intelligence: computes engagement and health signals per client
-- Called by the /api/intelligence route; no persistent state needed (computed fresh)

-- ─── Signal computation function ─────────────────────────────────────────────
-- Returns one row per client with all signal data the UI needs
create or replace function get_client_signals(p_coach_id uuid)
returns table (
  client_id             uuid,
  full_name             text,
  avatar_url            text,
  days_since_checkin    integer,
  checkins_last_14d     integer,
  avg_energy_last_7d    numeric,
  avg_energy_prev_7d    numeric,
  avg_stress_last_7d    numeric,
  avg_sleep_last_7d     numeric,
  days_since_message    integer,
  has_active_program    boolean,
  latest_bodyweight_kg  numeric,
  prev_bodyweight_kg    numeric,
  bodyweight_delta_kg   numeric
)
language sql
stable
security definer
as $$
  with clients as (
    select id, full_name, avatar_url
    from profiles
    where coach_id = p_coach_id
      and role = 'client'
  ),

  -- Last check-in date and count in past 14 days
  checkin_recency as (
    select
      ci.client_id,
      max(ci.created_at)                                        as last_checkin_at,
      count(*) filter (where ci.created_at >= now() - interval '14 days') as checkins_14d
    from check_ins ci
    join clients c on c.id = ci.client_id
    where ci.submitted = true
    group by ci.client_id
  ),

  -- Rolling averages for energy/stress/sleep
  score_windows as (
    select
      ci.client_id,
      avg(ci.energy)  filter (where ci.created_at >= now() - interval '7 days')  as energy_7d,
      avg(ci.energy)  filter (where ci.created_at >= now() - interval '14 days'
                                and ci.created_at <  now() - interval '7 days')  as energy_prev_7d,
      avg(ci.stress)  filter (where ci.created_at >= now() - interval '7 days')  as stress_7d,
      avg(ci.sleep_quality) filter (where ci.created_at >= now() - interval '7 days') as sleep_7d
    from check_ins ci
    join clients c on c.id = ci.client_id
    where ci.submitted = true
    group by ci.client_id
  ),

  -- Last message date
  message_recency as (
    select
      m.client_id,
      max(m.created_at) filter (where m.sender_role = 'client') as last_client_message_at
    from messages m
    join clients c on c.id = m.client_id
    group by m.client_id
  ),

  -- Active program flag
  active_programs as (
    select distinct client_id, true as has_active
    from workout_programs
    where is_active = true
      and client_id in (select id from clients)
  ),

  -- Most recent two bodyweights for trend
  bw_ranked as (
    select
      wl.client_id,
      wl.weight_kg,
      row_number() over (partition by wl.client_id order by wl.date desc) as rn
    from weight_logs wl
    join clients c on c.id = wl.client_id
    where wl.weight_kg is not null
  ),
  bodyweight as (
    select
      client_id,
      max(weight_kg) filter (where rn = 1) as latest_bw,
      max(weight_kg) filter (where rn = 2) as prev_bw
    from bw_ranked
    where rn <= 2
    group by client_id
  )

  select
    c.id                                                        as client_id,
    c.full_name::text,
    c.avatar_url::text,
    coalesce(
      extract(day from now() - cr.last_checkin_at)::integer,
      999
    )                                                           as days_since_checkin,
    coalesce(cr.checkins_14d, 0)::integer                      as checkins_last_14d,
    round(sw.energy_7d, 1)                                     as avg_energy_last_7d,
    round(sw.energy_prev_7d, 1)                                as avg_energy_prev_7d,
    round(sw.stress_7d, 1)                                     as avg_stress_last_7d,
    round(sw.sleep_7d, 1)                                      as avg_sleep_last_7d,
    coalesce(
      extract(day from now() - mr.last_client_message_at)::integer,
      999
    )                                                           as days_since_message,
    coalesce(ap.has_active, false)                             as has_active_program,
    bw.latest_bw                                               as latest_bodyweight_kg,
    bw.prev_bw                                                 as prev_bodyweight_kg,
    bw.latest_bw - bw.prev_bw                                  as bodyweight_delta_kg
  from clients c
  left join checkin_recency  cr on cr.client_id = c.id
  left join score_windows    sw on sw.client_id = c.id
  left join message_recency  mr on mr.client_id = c.id
  left join active_programs  ap on ap.client_id = c.id
  left join bodyweight       bw on bw.client_id = c.id
  order by c.full_name;
$$;
