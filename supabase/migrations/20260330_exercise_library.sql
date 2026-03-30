-- Exercise library — system seed + schema
-- 350+ exercises covering all major categories for Propel Coaches

-- ─── TABLE ───────────────────────────────────────────────────────────────────
create table if not exists exercises (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null,
  primary_muscle_group    text not null,
  secondary_muscle_groups text[] not null default '{}',
  muscle_groups           text[] not null default '{}',   -- legacy flat array (API compat)
  category                text not null,
  movement_type           text not null default 'isolation',
  equipment               text[] not null default '{}',
  difficulty_level        text not null default 'intermediate',
  is_compound             boolean not null default false,
  instructions            text,
  common_mistakes         text,
  demo_video_url          text,
  demo_image_url          text,
  is_system               boolean not null default false,
  created_by              uuid references auth.users(id) on delete set null,
  created_at              timestamptz not null default now()
);

-- ─── CONSTRAINTS ─────────────────────────────────────────────────────────────
alter table exercises
  add constraint exercises_difficulty_check
    check (difficulty_level in ('beginner','intermediate','advanced')),
  add constraint exercises_category_check
    check (category in (
      'strength','cardio','mobility','warm_up','cool_down',
      'plyometric','rehab','functional','yoga_pilates','sport_specific'
    ));

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
create index if not exists exercises_category_idx       on exercises(category);
create index if not exists exercises_primary_muscle_idx on exercises(primary_muscle_group);
create index if not exists exercises_is_system_idx      on exercises(is_system);
create index if not exists exercises_name_idx           on exercises using gin(to_tsvector('english', name));
create index if not exists exercises_muscle_groups_idx  on exercises using gin(muscle_groups);
create index if not exists exercises_equipment_idx      on exercises using gin(equipment);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table exercises enable row level security;

-- Coaches can read all system exercises + their own custom ones
create policy "exercises_select" on exercises
  for select using (is_system = true or created_by = auth.uid());

-- Coaches can insert their own custom exercises
create policy "exercises_insert" on exercises
  for insert with check (created_by = auth.uid() and is_system = false);

-- Coaches can update only their own custom exercises
create policy "exercises_update" on exercises
  for update using (created_by = auth.uid() and is_system = false);

-- Coaches can delete only their own custom exercises
create policy "exercises_delete" on exercises
  for delete using (created_by = auth.uid() and is_system = false);

-- ─── SEED ────────────────────────────────────────────────────────────────────
-- All system exercises: created_by = null, is_system = true

insert into exercises (name, primary_muscle_group, secondary_muscle_groups, muscle_groups, category, movement_type, equipment, difficulty_level, is_compound, instructions, common_mistakes, is_system) values

-- ══════════════════════════════════════════════════════════════════════════════
-- CHEST (20)
-- ══════════════════════════════════════════════════════════════════════════════
('Barbell Bench Press', 'chest', array['triceps','front_deltoid'], array['chest','triceps','front_deltoid'], 'strength', 'horizontal_push', array['barbell','bench'], 'intermediate', true,
 'Lie on bench, grip barbell slightly wider than shoulder width. Lower bar to mid-chest under control, then press back to full extension. Keep feet flat, back slightly arched, shoulder blades retracted.',
 'Flaring elbows too wide, bouncing bar off chest, not retracting shoulder blades, lifting hips off bench.', true),

('Dumbbell Bench Press', 'chest', array['triceps','front_deltoid'], array['chest','triceps','front_deltoid'], 'strength', 'horizontal_push', array['dumbbells','bench'], 'beginner', true,
 'Lie on bench holding dumbbells at chest level, palms facing forward. Press dumbbells up and slightly inward until arms are extended. Lower with control to starting position.',
 'Letting dumbbells drift too far apart at top, pressing unevenly, losing wrist alignment.', true),

('Incline Barbell Bench Press', 'chest', array['front_deltoid','triceps'], array['chest','front_deltoid','triceps'], 'strength', 'horizontal_push', array['barbell','bench'], 'intermediate', true,
 'Set bench to 30-45°. Unrack barbell, lower to upper chest, press back up. Keep shoulder blades pinched and core tight throughout.',
 'Setting incline too steep (becomes shoulder press), not touching upper chest, cutting range of motion short.', true),

('Incline Dumbbell Press', 'chest', array['front_deltoid','triceps'], array['chest','front_deltoid','triceps'], 'strength', 'horizontal_push', array['dumbbells','bench'], 'beginner', true,
 'Set bench to 30-45°. Press dumbbells from upper chest to full extension. Controlled descent, slight inward arc at top.',
 'Excessive shoulder elevation, pressing dumbbells straight up instead of arcing, using too much weight.', true),

('Decline Bench Press', 'chest', array['triceps','front_deltoid'], array['chest','triceps','front_deltoid'], 'strength', 'horizontal_push', array['barbell','bench'], 'intermediate', true,
 'Set bench to -15° to -30°. Unrack barbell and lower to lower chest. Press back to lockout. Secure feet under pads.',
 'Losing shoulder blade retraction, pressing unevenly, neglecting to lock feet securely.', true),

('Push-Up', 'chest', array['triceps','front_deltoid','core'], array['chest','triceps','front_deltoid','core'], 'strength', 'horizontal_push', array['bodyweight'], 'beginner', true,
 'Start in plank position, hands slightly wider than shoulders. Lower chest to floor keeping body rigid. Press back up to full arm extension.',
 'Sagging hips, flaring elbows excessively, looking up rather than down, partial range of motion.', true),

('Wide-Grip Push-Up', 'chest', array['front_deltoid','triceps'], array['chest','front_deltoid','triceps'], 'strength', 'horizontal_push', array['bodyweight'], 'beginner', true,
 'Place hands wider than shoulder width. Perform push-up focusing on chest stretch at bottom. Keep core engaged throughout.',
 'Placing hands too wide causing wrist strain, losing neutral spine.', true),

('Diamond Push-Up', 'triceps', array['chest','front_deltoid'], array['triceps','chest','front_deltoid'], 'strength', 'horizontal_push', array['bodyweight'], 'intermediate', false,
 'Form diamond shape with hands under chest. Lower chest toward hands keeping elbows tracking back. Press up.',
 'Hands too far forward, wrists caving, not maintaining straight body line.', true),

('Cable Chest Fly', 'chest', array['front_deltoid'], array['chest','front_deltoid'], 'strength', 'isolation', array['cable_machine'], 'beginner', false,
 'Stand between cable towers with handles at chest height. With slight elbow bend, bring hands together in arc motion in front of chest. Slowly return with control.',
 'Bending elbows excessively (becomes press), using momentum, leaning too far forward.', true),

('Dumbbell Chest Fly', 'chest', array['front_deltoid'], array['chest','front_deltoid'], 'strength', 'isolation', array['dumbbells','bench'], 'beginner', false,
 'Lie on bench, dumbbells above chest with slight elbow bend. Lower arms in wide arc until chest stretches. Bring back together like hugging a tree.',
 'Straightening arms completely (shoulder injury risk), dropping too fast, excessive weight.', true),

('Pec Deck Machine', 'chest', array['front_deltoid'], array['chest','front_deltoid'], 'strength', 'isolation', array['machine'], 'beginner', false,
 'Sit upright, place forearms on pads. Bring arms together in front of chest. Squeeze pecs at peak contraction. Slowly return.',
 'Using momentum to slam pads together, hyperextending elbows, not adjusting seat height properly.', true),

('Cable Cross-Over', 'chest', array['front_deltoid'], array['chest','front_deltoid'], 'strength', 'isolation', array['cable_machine'], 'intermediate', false,
 'Set cables high, stand in center. With slight elbow bend pull handles down and together crossing at bottom. Squeeze chest at bottom.',
 'Crossing arms too much causing shoulder impingement, not controlling return phase.', true),

('Chest Dip', 'chest', array['triceps','front_deltoid'], array['chest','triceps','front_deltoid'], 'strength', 'horizontal_push', array['dip_bars','bodyweight'], 'intermediate', true,
 'Grip parallel bars, lean forward 15-30°. Lower until shoulders below elbows. Press back up focusing on chest squeeze at top.',
 'Staying too upright (becomes tricep focus), not leaning forward, going too deep causing shoulder strain.', true),

('Landmine Press', 'chest', array['front_deltoid','triceps'], array['chest','front_deltoid','triceps'], 'strength', 'horizontal_push', array['barbell','landmine'], 'intermediate', true,
 'Hold end of angled barbell at shoulder. Press up and away following the arc. Lower back to shoulder level with control.',
 'Pressing straight up instead of following arc, losing core stability.', true),

('Svend Press', 'chest', array['front_deltoid'], array['chest','front_deltoid'], 'strength', 'isolation', array['weight_plate'], 'beginner', false,
 'Hold plate between palms at chest, pressing hands together. Extend arms straight forward, maintaining squeeze. Return slowly.',
 'Losing hand tension, letting elbows drop, using too heavy a plate.', true),

('Bosu Push-Up', 'chest', array['triceps','core','front_deltoid'], array['chest','triceps','core'], 'strength', 'horizontal_push', array['bosu_ball','bodyweight'], 'intermediate', true,
 'Place hands on edges of Bosu ball dome-side down. Perform push-up while stabilizing the ball throughout.',
 'Gripping too narrow on ball, letting ball rock side to side, sagging hips.', true),

('TRX Push-Up', 'chest', array['triceps','core','front_deltoid'], array['chest','triceps','core'], 'strength', 'horizontal_push', array['trx'], 'intermediate', true,
 'Hold TRX handles facing down. Lower chest between handles keeping body rigid. Press back up to full extension.',
 'Handles at uneven heights, excessive hip drop, not engaging core.', true),

('Machine Chest Press', 'chest', array['triceps','front_deltoid'], array['chest','triceps','front_deltoid'], 'strength', 'horizontal_push', array['machine'], 'beginner', true,
 'Sit with back against pad, handles at chest level. Press handles forward to full extension. Return with control.',
 'Arching excessively off pad, using momentum, uneven pressing.', true),

('Close-Grip Bench Press', 'triceps', array['chest','front_deltoid'], array['triceps','chest','front_deltoid'], 'strength', 'horizontal_push', array['barbell','bench'], 'intermediate', true,
 'Grip barbell shoulder-width or slightly narrower. Lower to lower chest keeping elbows close to body. Press back up.',
 'Gripping too narrow causing wrist strain, flaring elbows out.', true),

('Resistance Band Chest Press', 'chest', array['triceps','front_deltoid'], array['chest','triceps','front_deltoid'], 'strength', 'horizontal_push', array['resistance_bands'], 'beginner', true,
 'Anchor band behind you at chest height. Hold handles, step forward for tension. Press hands forward to full extension. Return with control.',
 'Insufficient band tension, arms drifting too wide, losing posture.', true),

-- ══════════════════════════════════════════════════════════════════════════════
-- BACK (20)
-- ══════════════════════════════════════════════════════════════════════════════
('Barbell Deadlift', 'lower_back', array['hamstrings','glutes','traps','lats'], array['lower_back','hamstrings','glutes','traps','lats'], 'strength', 'hip_hinge', array['barbell'], 'intermediate', true,
 'Stand with bar over mid-foot, hip-width stance. Hinge at hips, grip just outside legs. Brace core, chest up, push floor away. Lock hips and shoulders together at top.',
 'Rounding lower back, jerking bar off floor, bar drifting away from body, hyperextending at lockout.', true),

('Romanian Deadlift', 'hamstrings', array['glutes','lower_back','lats'], array['hamstrings','glutes','lower_back'], 'strength', 'hip_hinge', array['barbell'], 'intermediate', true,
 'Stand holding bar at hips. Push hips back while lowering bar along legs. Feel hamstring stretch at bottom. Drive hips forward to return.',
 'Bending knees too much (becomes conventional deadlift), rounding back, not maintaining bar close to body.', true),

('Pull-Up', 'lats', array['biceps','rear_deltoid','core'], array['lats','biceps','rear_deltoid'], 'strength', 'vertical_pull', array['pull_up_bar','bodyweight'], 'intermediate', true,
 'Hang from bar with overhand grip wider than shoulders. Pull chest to bar initiating with shoulder blades, then lats. Lower fully under control.',
 'Not achieving full range of motion, kipping/swinging, pulling with arms only rather than lats.', true),

('Chin-Up', 'lats', array['biceps','rear_deltoid'], array['lats','biceps','rear_deltoid'], 'strength', 'vertical_pull', array['pull_up_bar','bodyweight'], 'intermediate', true,
 'Hang with underhand shoulder-width grip. Pull chin over bar driving elbows to hips. Fully extend at bottom between reps.',
 'Half reps, using momentum, not engaging shoulder blades at initiation.', true),

('Barbell Bent-Over Row', 'lats', array['rhomboids','rear_deltoid','biceps','lower_back'], array['lats','rhomboids','rear_deltoid','biceps'], 'strength', 'horizontal_pull', array['barbell'], 'intermediate', true,
 'Hinge at hips 45°, keep back flat. Pull bar to lower chest/upper abdomen. Lead with elbows, squeeze shoulder blades together.',
 'Rounding lower back, using momentum by swinging torso, pulling to wrong height.', true),

('Dumbbell Single-Arm Row', 'lats', array['rhomboids','rear_deltoid','biceps'], array['lats','rhomboids','rear_deltoid','biceps'], 'strength', 'horizontal_pull', array['dumbbells','bench'], 'beginner', true,
 'Brace one knee and hand on bench. Hang other arm with dumbbell. Pull elbow up past torso, rotating slightly at top. Lower under control.',
 'Rotating torso too much, pulling with bicep instead of back, not achieving full stretch at bottom.', true),

('Seated Cable Row', 'lats', array['rhomboids','rear_deltoid','biceps'], array['lats','rhomboids','rear_deltoid'], 'strength', 'horizontal_pull', array['cable_machine'], 'beginner', true,
 'Sit upright, slight knee bend, feet on platform. Pull handle to abdomen retracting shoulder blades. Hold briefly at peak, return with control.',
 'Rounding forward at return phase, using legs/back momentum, pulling too wide.', true),

('Lat Pulldown', 'lats', array['biceps','rear_deltoid'], array['lats','biceps','rear_deltoid'], 'strength', 'vertical_pull', array['cable_machine'], 'beginner', true,
 'Grip bar wider than shoulders, sit with thighs under pads. Pull bar to upper chest leading with elbows. Squeeze lats at bottom, control ascent.',
 'Leaning back excessively, pulling behind neck (injury risk), using too much weight with partial reps.', true),

('T-Bar Row', 'lats', array['rhomboids','rear_deltoid','biceps','lower_back'], array['lats','rhomboids','rear_deltoid'], 'strength', 'horizontal_pull', array['barbell','t_bar_row'], 'intermediate', true,
 'Straddle bar, hinge at hips. Pull bar to chest keeping back flat. Squeeze shoulder blades together at top.',
 'Rounding back, jerking weight, not achieving full range.', true),

('Face Pull', 'rear_deltoid', array['rhomboids','traps','external_rotators'], array['rear_deltoid','rhomboids','traps'], 'strength', 'horizontal_pull', array['cable_machine'], 'beginner', false,
 'Set cable at face height with rope attachment. Pull rope toward face, flaring elbows high. Externally rotate at end to pull hands apart. Control return.',
 'Not flaring elbows high enough, using too much weight, not achieving full external rotation.', true),

('Inverted Row', 'lats', array['rhomboids','rear_deltoid','biceps','core'], array['lats','rhomboids','rear_deltoid'], 'strength', 'horizontal_pull', array['barbell','rack','bodyweight'], 'beginner', true,
 'Lie under bar, grip wider than shoulders, body straight. Pull chest to bar retracting shoulder blades. Lower under control.',
 'Letting hips sag, not retracting shoulder blades, insufficient range.', true),

('Meadows Row', 'lats', array['rhomboids','rear_deltoid','biceps'], array['lats','rhomboids'], 'strength', 'horizontal_pull', array['barbell','landmine'], 'intermediate', true,
 'Stand perpendicular to landmine, staggered stance. Hold end of barbell, row to hip level driving elbow back and high.',
 'Rotating torso excessively, pulling to wrong height.', true),

('Dumbbell Pullover', 'lats', array['chest','serratus','triceps'], array['lats','chest','serratus'], 'strength', 'vertical_pull', array['dumbbells','bench'], 'intermediate', false,
 'Lie perpendicular on bench, dumbbell held with both hands above chest. Lower behind head keeping slight elbow bend. Stretch lats fully then pull back over.',
 'Bending elbows too much, going past comfortable shoulder range.', true),

('Straight-Arm Pulldown', 'lats', array['serratus','triceps'], array['lats','serratus'], 'strength', 'vertical_pull', array['cable_machine'], 'beginner', false,
 'Face high cable, hold bar with straight arms. Pull bar down to hips maintaining arm position. Squeeze lats at bottom.',
 'Bending elbows excessively, leaning forward to assist.', true),

('Good Morning', 'lower_back', array['hamstrings','glutes'], array['lower_back','hamstrings','glutes'], 'strength', 'hip_hinge', array['barbell'], 'intermediate', true,
 'Place barbell on upper back. Hinge at hips keeping back flat and slight knee bend. Lower torso until parallel to floor. Drive hips forward to return.',
 'Rounding lower back, bending knees too much, going too heavy.', true),

('Rack Pull', 'lower_back', array['traps','lats','glutes','hamstrings'], array['lower_back','traps','lats'], 'strength', 'hip_hinge', array['barbell','rack'], 'intermediate', true,
 'Set pins at knee height. Deadlift from this shortened range. Focus on lockout and upper back engagement.',
 'Using it as an ego lift without proper technique, not achieving full lockout.', true),

('Superman Hold', 'lower_back', array['glutes','rear_deltoid'], array['lower_back','glutes'], 'rehab', 'hip_hinge', array['bodyweight'], 'beginner', false,
 'Lie face down, arms extended overhead. Simultaneously lift arms, chest, and legs off floor. Hold 2-3 seconds, lower with control.',
 'Overextending neck, holding breath, lifting too high causing strain.', true),

('Resistance Band Pull-Apart', 'rear_deltoid', array['rhomboids','traps'], array['rear_deltoid','rhomboids','traps'], 'strength', 'horizontal_pull', array['resistance_bands'], 'beginner', false,
 'Hold band at shoulder height with arms extended. Pull band apart horizontally retracting shoulder blades. Return with control.',
 'Elevating shoulders during movement, using too heavy a band.', true),

('Cable Single-Arm Pulldown', 'lats', array['biceps','rear_deltoid'], array['lats','biceps'], 'strength', 'vertical_pull', array['cable_machine'], 'beginner', false,
 'Hold single handle overhead with one hand. Pull down and across body driving elbow to hip. Feel lat stretch at top.',
 'Rotating excessively, pulling across midline too aggressively.', true),

('Wide-Grip Seated Row', 'rhomboids', array['rear_deltoid','traps','lats'], array['rhomboids','rear_deltoid','traps'], 'strength', 'horizontal_pull', array['cable_machine'], 'beginner', true,
 'Use wide bar attachment on low cable. Pull to lower chest flaring elbows wide. Squeeze shoulder blades at peak.',
 'Rounding forward on return, leaning back excessively.', true),

-- ══════════════════════════════════════════════════════════════════════════════
-- SHOULDERS (15)
-- ══════════════════════════════════════════════════════════════════════════════
('Barbell Overhead Press', 'front_deltoid', array['lateral_deltoid','triceps','traps'], array['front_deltoid','lateral_deltoid','triceps'], 'strength', 'vertical_push', array['barbell'], 'intermediate', true,
 'Stand with bar at shoulder level, grip just outside shoulders. Press overhead to full lockout. Lower to clavicle level. Keep core braced, avoid excessive lean back.',
 'Excessive lumbar hyperextension, bar path forward instead of straight up, not achieving full lockout.', true),

('Dumbbell Shoulder Press', 'front_deltoid', array['lateral_deltoid','triceps'], array['front_deltoid','lateral_deltoid','triceps'], 'strength', 'vertical_push', array['dumbbells'], 'beginner', true,
 'Sit or stand with dumbbells at shoulder height, palms forward. Press to lockout. Lower to 90° at elbows.',
 'Flaring elbows forward, not pressing in neutral path, arching back.', true),

('Arnold Press', 'front_deltoid', array['lateral_deltoid','triceps'], array['front_deltoid','lateral_deltoid','triceps'], 'strength', 'vertical_push', array['dumbbells'], 'intermediate', true,
 'Start with palms facing you at shoulder height. Rotate palms outward as you press overhead. Reverse on the way down.',
 'Rotating too fast, losing control at transition point, excessive weight.', true),

('Lateral Raise', 'lateral_deltoid', array['traps','supraspinatus'], array['lateral_deltoid','traps'], 'strength', 'isolation', array['dumbbells'], 'beginner', false,
 'Stand with dumbbells at sides. Raise arms to shoulder height with slight forward angle and thumbs slightly down. Control descent.',
 'Using momentum, shrugging traps, going above shoulder height, internal rotation (thumbs down).', true),

('Cable Lateral Raise', 'lateral_deltoid', array['traps'], array['lateral_deltoid','traps'], 'strength', 'isolation', array['cable_machine'], 'beginner', false,
 'Stand beside low cable, hold handle across body. Raise arm out to side to shoulder height maintaining slight elbow bend.',
 'Leaning away from cable to use momentum, not controlling the return.', true),

('Front Raise', 'front_deltoid', array['lateral_deltoid'], array['front_deltoid','lateral_deltoid'], 'strength', 'isolation', array['dumbbells'], 'beginner', false,
 'Stand with dumbbells in front of thighs. Raise one or both arms to shoulder height with straight arms. Lower with control.',
 'Swinging torso, going above shoulder height, not controlling eccentric.', true),

('Rear Delt Fly', 'rear_deltoid', array['rhomboids','traps'], array['rear_deltoid','rhomboids','traps'], 'strength', 'isolation', array['dumbbells'], 'beginner', false,
 'Hinge at hips 45° or lie on incline bench. Raise dumbbells out to sides with slight elbow bend, leading with elbows.',
 'Using momentum by swinging torso, bending elbows too much.', true),

('Seated Machine Shoulder Press', 'front_deltoid', array['lateral_deltoid','triceps'], array['front_deltoid','lateral_deltoid','triceps'], 'strength', 'vertical_push', array['machine'], 'beginner', true,
 'Adjust seat so handles align with shoulders. Press to lockout. Lower to shoulder level. Keep back against pad.',
 'Not adjusting seat height, arching off pad, using momentum.', true),

('Upright Row', 'lateral_deltoid', array['traps','biceps','front_deltoid'], array['lateral_deltoid','traps','biceps'], 'strength', 'vertical_pull', array['barbell'], 'intermediate', true,
 'Grip bar inside shoulder width. Pull to chin level leading with elbows. Elbows should be above wrists throughout.',
 'Using wide grip (shoulder impingement risk), pulling too high, using momentum.', true),

('Cable Face Pull', 'rear_deltoid', array['rhomboids','traps','external_rotators'], array['rear_deltoid','rhomboids','traps'], 'strength', 'horizontal_pull', array['cable_machine'], 'beginner', false,
 'Set rope at face height. Pull toward face with elbows high, externally rotating at end. Control return.',
 'Elbows too low, not completing external rotation, weight too heavy.', true),

('Pike Push-Up', 'front_deltoid', array['lateral_deltoid','triceps'], array['front_deltoid','lateral_deltoid','triceps'], 'strength', 'vertical_push', array['bodyweight'], 'beginner', true,
 'Start in downdog position. Bend elbows to lower head toward floor. Press back to starting position.',
 'Not getting into true pike position, head touching floor rather than just lowering toward it.', true),

('Handstand Push-Up', 'front_deltoid', array['lateral_deltoid','triceps','traps'], array['front_deltoid','lateral_deltoid','triceps'], 'strength', 'vertical_push', array['bodyweight'], 'advanced', true,
 'Kick into handstand against wall. Bend elbows to lower head to floor. Press back to full lockout. Keep core tight.',
 'Not using wall for safety, improper head placement, kipping when form breaks.', true),

('Dumbbell Shrug', 'traps', array['rear_deltoid'], array['traps','rear_deltoid'], 'strength', 'isolation', array['dumbbells'], 'beginner', false,
 'Stand holding dumbbells at sides. Shrug shoulders straight up toward ears. Pause at top, lower with control.',
 'Rolling shoulders forward or back, using too much weight, bending elbows.', true),

('Band Pull-Apart', 'rear_deltoid', array['rhomboids','traps','external_rotators'], array['rear_deltoid','rhomboids'], 'warm_up', 'horizontal_pull', array['resistance_bands'], 'beginner', false,
 'Hold band at shoulder height, arms extended. Pull band apart squeezing shoulder blades. Return under control.',
 'Letting shoulders elevate, insufficient range, using too strong a band.', true),

('Leaning Lateral Raise', 'lateral_deltoid', array['traps'], array['lateral_deltoid'], 'strength', 'isolation', array['dumbbells'], 'intermediate', false,
 'Hold fixed object with one hand, lean away. Raise dumbbell in free hand to shoulder height. This allows greater range of motion.',
 'Leaning too far reducing stability, using momentum.', true),

-- ══════════════════════════════════════════════════════════════════════════════
-- BICEPS (12)
-- ══════════════════════════════════════════════════════════════════════════════
('Barbell Curl', 'biceps', array['brachialis','brachioradialis'], array['biceps','brachialis'], 'strength', 'isolation', array['barbell'], 'beginner', false,
 'Stand with barbell, shoulder-width underhand grip. Curl to shoulder level without swinging. Lower with control.',
 'Swinging torso, not fully extending at bottom, wrists bending back.', true),

('Dumbbell Curl', 'biceps', array['brachialis','brachioradialis'], array['biceps','brachialis'], 'strength', 'isolation', array['dumbbells'], 'beginner', false,
 'Stand or sit, dumbbells at sides. Curl alternating or simultaneously. Supinate wrist at top. Lower fully.',
 'Not supinating at top, partial reps, leaning back.', true),

('Hammer Curl', 'brachialis', array['biceps','brachioradialis'], array['brachialis','biceps'], 'strength', 'isolation', array['dumbbells'], 'beginner', false,
 'Neutral grip (thumbs up) throughout. Curl dumbbells to shoulder without rotating wrists. Lower with control.',
 'Swinging, not maintaining neutral wrist, partial range.', true),

('Incline Dumbbell Curl', 'biceps', array['brachialis'], array['biceps','brachialis'], 'strength', 'isolation', array['dumbbells','bench'], 'intermediate', false,
 'Sit on incline bench (45-60°), arms hanging behind torso. Curl without letting upper arms swing forward. Excellent stretch at bottom.',
 'Swinging upper arms forward, not achieving full stretch at bottom.', true),

('Cable Curl', 'biceps', array['brachialis'], array['biceps','brachialis'], 'strength', 'isolation', array['cable_machine'], 'beginner', false,
 'Stand at low cable with straight bar or EZ bar. Curl to chin height maintaining constant cable tension.',
 'Leaning back, swinging, not using full range.', true),

('Concentration Curl', 'biceps', array['brachialis'], array['biceps','brachialis'], 'strength', 'isolation', array['dumbbells'], 'beginner', false,
 'Sit, brace upper arm against inner thigh. Curl dumbbell to shoulder. Squeeze at top. Fully extend at bottom.',
 'Shoulder assisting, not bracing properly, swinging.', true),

('EZ-Bar Curl', 'biceps', array['brachialis','brachioradialis'], array['biceps','brachialis'], 'strength', 'isolation', array['ez_bar'], 'beginner', false,
 'Use angled EZ bar for reduced wrist strain. Curl from full extension to chin height.',
 'Same as barbell curl but grip issues are common — use wrist-friendly grip position.', true),

('Preacher Curl', 'biceps', array['brachialis'], array['biceps','brachialis'], 'strength', 'isolation', array['barbell','preacher_bench'], 'intermediate', false,
 'Rest upper arm on preacher pad. Curl bar from full extension to chin. Do not hyperextend at bottom.',
 'Hyperextending elbow at bottom, bouncing off pad, incomplete range.', true),

('Zottman Curl', 'biceps', array['brachialis','brachioradialis'], array['biceps','brachialis','brachioradialis'], 'strength', 'isolation', array['dumbbells'], 'intermediate', false,
 'Curl with supinated grip. At top, rotate to pronated (palms down). Lower in that position. Rotate back at bottom.',
 'Rotating at wrong point in movement, using too heavy weights.', true),

('Cable Hammer Curl', 'brachialis', array['biceps','brachioradialis'], array['brachialis','biceps'], 'strength', 'isolation', array['cable_machine'], 'beginner', false,
 'Attach rope to low cable. Curl with neutral grip keeping palms facing each other throughout.',
 'Letting hands rotate, using momentum.', true),

('Resistance Band Curl', 'biceps', array['brachialis'], array['biceps','brachialis'], 'strength', 'isolation', array['resistance_bands'], 'beginner', false,
 'Stand on band, hold handles with supinated grip. Curl to shoulder level controlling the band tension.',
 'Using too light band, not controlling eccentric.', true),

('Reverse Curl', 'brachioradialis', array['biceps','brachialis'], array['brachioradialis','biceps'], 'strength', 'isolation', array['barbell'], 'beginner', false,
 'Overhand grip on barbell. Curl from full extension to shoulder level. Keeps forearms working hard.',
 'Wrists breaking, not maintaining full range.', true),

-- ══════════════════════════════════════════════════════════════════════════════
-- TRICEPS (12)
-- ══════════════════════════════════════════════════════════════════════════════
('Tricep Dip', 'triceps', array['chest','front_deltoid'], array['triceps','chest','front_deltoid'], 'strength', 'vertical_push', array['dip_bars','bodyweight'], 'intermediate', true,
 'Grip parallel bars, stay upright to emphasize triceps. Lower until elbows reach 90°. Press back to full lockout.',
 'Leaning forward (shifts to chest), not reaching full range, not locking out.', true),

('Skull Crusher', 'triceps', array['front_deltoid'], array['triceps'], 'strength', 'isolation', array['barbell','bench'], 'intermediate', false,
 'Lie on bench, barbell overhead with narrow grip. Bend elbows lowering bar toward forehead. Extend back to lockout.',
 'Flaring elbows, dropping bar too fast, using elbows as pivot point poorly.', true),

('Tricep Pushdown', 'triceps', array['front_deltoid'], array['triceps'], 'strength', 'isolation', array['cable_machine'], 'beginner', false,
 'Stand at cable, overhand grip on bar. Keeping upper arms locked at sides, push bar down to full extension. Return slowly.',
 'Leaning into bar, upper arms swinging forward, partial lockout.', true),

('Overhead Tricep Extension', 'triceps', array['front_deltoid'], array['triceps'], 'strength', 'isolation', array['dumbbells'], 'beginner', false,
 'Hold dumbbell overhead with both hands. Lower behind head bending elbows. Extend back up. Keep upper arms still.',
 'Flaring elbows, upper arms moving, using momentum.', true),

('Cable Overhead Tricep Extension', 'triceps', array['front_deltoid'], array['triceps'], 'strength', 'isolation', array['cable_machine'], 'beginner', false,
 'Face away from high cable, rope attachment. Lean slightly forward, extend arms forward from behind head.',
 'Letting elbows flare, not using full range.', true),

('Close-Grip Push-Up', 'triceps', array['chest','front_deltoid'], array['triceps','chest'], 'strength', 'horizontal_push', array['bodyweight'], 'beginner', true,
 'Push-up with hands directly under shoulders or slightly closer. Keep elbows tracking back alongside ribs.',
 'Flaring elbows out, too wide a hand position.', true),

('Dumbbell Kickback', 'triceps', array['rear_deltoid'], array['triceps'], 'strength', 'isolation', array['dumbbells'], 'beginner', false,
 'Hinge 45°, upper arm parallel to floor. Extend forearm back to lockout. Squeeze tricep. Return with control.',
 'Upper arm dropping, swinging to extend, partial range.', true),

('JM Press', 'triceps', array['chest','front_deltoid'], array['triceps','chest'], 'strength', 'horizontal_push', array['barbell','bench'], 'advanced', true,
 'Hybrid between close-grip press and skull crusher. Bar starts above chest, elbows flare slightly as bar lowers past face level, then press.',
 'Going too heavy, uncomfortable elbow path.', true),

('Tate Press', 'triceps', array['chest'], array['triceps','chest'], 'strength', 'isolation', array['dumbbells','bench'], 'intermediate', false,
 'Lie on bench, dumbbells above chest. Fold elbows inward lowering weights to chest. Extend back up.',
 'Turning into a chest fly, not keeping dumbbells close together.', true),

('Resistance Band Tricep Pushdown', 'triceps', array['front_deltoid'], array['triceps'], 'strength', 'isolation', array['resistance_bands'], 'beginner', false,
 'Anchor band overhead. Hold with overhand grip, push down to full extension keeping upper arms still.',
 'Not locking upper arms, using shoulders.', true),

('Bench Dip', 'triceps', array['chest','front_deltoid'], array['triceps','chest'], 'strength', 'vertical_push', array['bench','bodyweight'], 'beginner', true,
 'Place hands on bench behind you, feet on floor. Lower hips toward floor bending elbows to 90°. Press back up.',
 'Going too deep with shoulder forward, not locking out.', true),

('Tricep Cable Rope Pushdown', 'triceps', array['front_deltoid'], array['triceps'], 'strength', 'isolation', array['cable_machine'], 'beginner', false,
 'Attach rope to high cable. Grip with neutral hands. Push down and spread rope at bottom. Return with control.',
 'Spreading rope before lockout, letting elbows drift forward.', true),

-- ══════════════════════════════════════════════════════════════════════════════
-- LEGS — QUADS (12)
-- ══════════════════════════════════════════════════════════════════════════════
('Barbell Back Squat', 'quads', array['glutes','hamstrings','core','lower_back'], array['quads','glutes','hamstrings','core'], 'strength', 'squat', array['barbell','rack'], 'intermediate', true,
 'Bar on upper back, feet shoulder-width. Descend until thighs parallel or below. Keep chest up, knees tracking toes. Drive through heels to stand.',
 'Knees caving inward, heels lifting, rounding lower back, not reaching depth.', true),

('Barbell Front Squat', 'quads', array['glutes','core','upper_back'], array['quads','glutes','core'], 'strength', 'squat', array['barbell','rack'], 'advanced', true,
 'Bar rests on front deltoids, elbows high. Squat to depth maintaining upright torso. Core extremely braced.',
 'Elbows dropping, torso leaning forward, wrists bending.', true),

('Goblet Squat', 'quads', array['glutes','core','hamstrings'], array['quads','glutes','core'], 'strength', 'squat', array['dumbbells','kettlebell'], 'beginner', true,
 'Hold weight at chest in both hands. Squat to depth maintaining upright chest. Drive elbows between knees at bottom.',
 'Heels rising, forward lean, not reaching adequate depth.', true),

('Leg Press', 'quads', array['glutes','hamstrings'], array['quads','glutes','hamstrings'], 'strength', 'squat', array['machine'], 'beginner', true,
 'Feet shoulder-width on platform. Lower weight until 90° knee angle. Push through heels to full extension. Do not lock knees.',
 'Letting lower back round off pad, locking knees, feet too low (quad dominant) or too high (glute dominant).', true),

('Hack Squat', 'quads', array['glutes','hamstrings'], array['quads','glutes','hamstrings'], 'strength', 'squat', array['machine'], 'intermediate', true,
 'Place shoulders under pads, feet on platform. Release safety bars. Descend to 90° or below. Drive through heels.',
 'Not releasing safety properly, not reaching full depth.', true),

('Leg Extension', 'quads', array['rectus_femoris'], array['quads'], 'strength', 'isolation', array['machine'], 'beginner', false,
 'Sit in machine, pad against lower shin. Extend legs to full straightening. Squeeze quads at top. Lower with control.',
 'Using momentum, hyperextending knees, not adjusting seat properly.', true),

('Lunge', 'quads', array['glutes','hamstrings','core'], array['quads','glutes','hamstrings'], 'strength', 'lunge', array['bodyweight'], 'beginner', true,
 'Step forward, lower back knee toward floor. Front knee tracks over toe. Push back to starting position.',
 'Front knee caving, stepping too short, leaning forward.', true),

('Bulgarian Split Squat', 'quads', array['glutes','hamstrings','core'], array['quads','glutes','hamstrings'], 'strength', 'lunge', array['dumbbells','bench'], 'intermediate', true,
 'Rear foot elevated on bench. Lower front knee to 90°. Keep torso upright. Drive through front heel to stand.',
 'Rear foot too close causing balance issues, torso falling forward, front knee caving.', true),

('Dumbbell Walking Lunge', 'quads', array['glutes','hamstrings','core'], array['quads','glutes','hamstrings'], 'strength', 'lunge', array['dumbbells'], 'beginner', true,
 'Hold dumbbells at sides. Lunge forward, step up, lunge again with opposite leg. Keep torso upright throughout.',
 'Torso leaning forward, steps too short, knees caving.', true),

('Step-Up', 'quads', array['glutes','hamstrings'], array['quads','glutes','hamstrings'], 'strength', 'lunge', array['bench','bodyweight'], 'beginner', true,
 'Place one foot on bench. Drive through heel to stand on top. Control descent. Complete reps then switch legs.',
 'Using momentum to jump up, not fully extending on top, knee caving.', true),

('Sissy Squat', 'quads', array['hip_flexors'], array['quads','hip_flexors'], 'strength', 'squat', array['bodyweight'], 'advanced', false,
 'Hold support, lean back while bending knees and rising on toes. Lower until quads parallel or beyond. Return.',
 'Going too fast, insufficient mobility, performing without support initially.', true),

('Wall Sit', 'quads', array['glutes','hamstrings'], array['quads','glutes','hamstrings'], 'strength', 'squat', array['bodyweight'], 'beginner', false,
 'Back flat against wall, slide down until thighs parallel to floor. Hold position maintaining 90° at knees.',
 'Back arching away from wall, knees above 90°.', true),

-- ══════════════════════════════════════════════════════════════════════════════
-- LEGS — HAMSTRINGS (10)
-- ══════════════════════════════════════════════════════════════════════════════
('Lying Leg Curl', 'hamstrings', array['glutes','calves'], array['hamstrings','glutes'], 'strength', 'isolation', array['machine'], 'beginner', false,
 'Lie face down, pad against lower calves. Curl legs toward glutes. Squeeze at top. Lower with control.',
 'Lifting hips off pad to assist, partial range, using momentum.', true),

('Seated Leg Curl', 'hamstrings', array['glutes','calves'], array['hamstrings','glutes'], 'strength', 'isolation', array['machine'], 'beginner', false,
 'Sit upright, pad on lower thigh and against calves. Curl legs under seat. Squeeze at bottom.',
 'Sliding forward in seat, not achieving full range.', true),

('Nordic Hamstring Curl', 'hamstrings', array['glutes','calves'], array['hamstrings','glutes'], 'strength', 'hip_hinge', array['bodyweight','anchor'], 'advanced', false,
 'Kneel with feet anchored. Lower torso toward floor controlling descent with hamstrings. Use hands to catch at bottom. Curl back up.',
 'Descending too fast without control, not engaging throughout full range.', true),

('Sumo Deadlift', 'hamstrings', array['glutes','quads','lower_back','adductors'], array['hamstrings','glutes','quads'], 'strength', 'hip_hinge', array['barbell'], 'intermediate', true,
 'Wide stance, toes angled out. Grip bar inside legs. Push knees out, keep torso upright. Drive hips forward at lockout.',
 'Knees caving in, not maintaining bar over mid-foot, narrow stance for hip mobility.', true),

('Hex Bar Deadlift', 'hamstrings', array['quads','glutes','lower_back'], array['hamstrings','quads','glutes'], 'strength', 'hip_hinge', array['trap_bar'], 'beginner', true,
 'Stand inside hex bar, handles at sides. Hinge to grip, neutral back. Push through floor simultaneously engaging legs and hips.',
 'Treating it as a squat rather than a hinge, rounding back.', true),

('Glute-Ham Raise', 'hamstrings', array['glutes','lower_back'], array['hamstrings','glutes'], 'strength', 'hip_hinge', array['ghr_machine'], 'advanced', false,
 'Anchor feet on GHR machine. Lower torso until parallel. Curl back up using hamstrings and glutes.',
 'Using lower back instead of hamstrings, partial range.', true),

('Stability Ball Leg Curl', 'hamstrings', array['glutes','core'], array['hamstrings','glutes','core'], 'strength', 'isolation', array['stability_ball'], 'intermediate', false,
 'Lie on back, heels on ball. Lift hips, curl ball toward glutes. Extend back to start maintaining hip height.',
 'Hips dropping during curl, losing stability of ball.', true),

('Single-Leg Romanian Deadlift', 'hamstrings', array['glutes','lower_back','core'], array['hamstrings','glutes','core'], 'strength', 'hip_hinge', array['dumbbells'], 'intermediate', true,
 'Stand on one leg. Hinge at hip extending free leg back as torso lowers. Return to standing. Maintain flat back.',
 'Rotating hips open, losing balance, rounding back.', true),

('Dumbbell Romanian Deadlift', 'hamstrings', array['glutes','lower_back'], array['hamstrings','glutes','lower_back'], 'strength', 'hip_hinge', array['dumbbells'], 'beginner', true,
 'Hold dumbbells in front of thighs. Push hips back lowering dumbbells along legs. Maintain flat back. Drive hips forward to stand.',
 'Bending knees too much, rounding back, not achieving full hamstring stretch.', true),

('Resistance Band Leg Curl', 'hamstrings', array['glutes','calves'], array['hamstrings','glutes'], 'rehab', 'isolation', array['resistance_bands'], 'beginner', false,
 'Anchor band at ankle height, attach to foot. Stand and curl foot toward glutes against band resistance.',
 'Hip flexion substitution, band tension insufficient for challenge.', true),

-- ══════════════════════════════════════════════════════════════════════════════
-- GLUTES (12)
-- ══════════════════════════════════════════════════════════════════════════════
('Barbell Hip Thrust', 'glutes', array['hamstrings','quads','core'], array['glutes','hamstrings','quads'], 'strength', 'hip_hinge', array['barbell','bench'], 'intermediate', true,
 'Upper back on bench, bar across hips with pad. Drive hips up to full extension squeezing glutes. Lower with control.',
 'Not achieving full hip extension at top, bar rolling, not using hip pad.', true),

('Dumbbell Hip Thrust', 'glutes', array['hamstrings','quads'], array['glutes','hamstrings'], 'strength', 'hip_hinge', array['dumbbells','bench'], 'beginner', true,
 'Same as barbell hip thrust but with dumbbells placed on hip crease for easier setup.',
 'Pushing through lower back instead of glutes, feet too far away.', true),

('Cable Kickback', 'glutes', array['hamstrings'], array['glutes','hamstrings'], 'strength', 'isolation', array['cable_machine'], 'beginner', false,
 'Attach cable to ankle. Kick leg back and slightly up with slight knee bend. Squeeze glute at top. Control return.',
 'Hyperextending lower back to get more height, rotating hips.', true),

('Glute Bridge', 'glutes', array['hamstrings','core'], array['glutes','hamstrings'], 'strength', 'hip_hinge', array['bodyweight'], 'beginner', false,
 'Lie on back, feet flat on floor. Drive hips up squeezing glutes. Hold at top, lower slowly.',
 'Using lower back rather than glutes, not reaching full hip extension.', true),

('Single-Leg Glute Bridge', 'glutes', array['hamstrings','core'], array['glutes','hamstrings'], 'strength', 'hip_hinge', array['bodyweight'], 'intermediate', false,
 'Lie on back, one knee bent, other leg extended. Drive hips up on working side. Keep hips level.',
 'Hips rotating, not maintaining level pelvis, insufficient range.', true),

('Sumo Squat', 'glutes', array['quads','adductors','hamstrings'], array['glutes','quads','adductors'], 'strength', 'squat', array['dumbbells','kettlebell'], 'beginner', true,
 'Wide stance, toes angled 45°. Hold weight between legs. Squat deep keeping chest up and knees tracking over toes.',
 'Knees caving, insufficient depth, torso leaning forward.', true),

('Monster Walk', 'glutes', array['hip_abductors'], array['glutes','hip_abductors'], 'rehab', 'isolation', array['resistance_bands'], 'beginner', false,
 'Band around ankles or above knees. Half squat position. Walk sideways maintaining tension and squat depth.',
 'Standing up between steps, band losing tension.', true),

('Clamshell', 'glutes', array['hip_abductors'], array['glutes','hip_abductors'], 'rehab', 'isolation', array['bodyweight','resistance_bands'], 'beginner', false,
 'Lie on side, knees bent 45°, hips stacked. Rotate top knee open like a clamshell. Hold, return with control.',
 'Rolling hips back to assist, insufficient range of opening.', true),

('Donkey Kick', 'glutes', array['hamstrings','core'], array['glutes','hamstrings'], 'strength', 'isolation', array['bodyweight'], 'beginner', false,
 'On all fours, kick one leg back and up maintaining bent knee. Squeeze glute at top. Control descent.',
 'Arching lower back, rotating hips, losing neutral spine.', true),

('Fire Hydrant', 'glutes', array['hip_abductors'], array['glutes','hip_abductors'], 'rehab', 'isolation', array['bodyweight'], 'beginner', false,
 'On all fours, lift knee out to side maintaining 90° bend. Squeeze glute at top. Control descent.',
 'Tilting torso to opposite side, losing neutral spine.', true),

('Lateral Band Walk', 'glutes', array['hip_abductors','quads'], array['glutes','hip_abductors'], 'warm_up', 'isolation', array['resistance_bands'], 'beginner', false,
 'Band above knees or ankles, slight squat position. Step sideways maintaining tension. Keep toes forward.',
 'Feet not staying parallel, band losing tension, standing upright.', true),

('Frog Pump', 'glutes', array['hamstrings','adductors'], array['glutes','hamstrings'], 'rehab', 'isolation', array['bodyweight'], 'beginner', false,
 'Lie on back, soles of feet together, knees out. Drive hips up squeezing glutes. Lower slowly.',
 'Using back to raise hips, not achieving full glute contraction.', true),

-- ══════════════════════════════════════════════════════════════════════════════
-- CALVES (8)
-- ══════════════════════════════════════════════════════════════════════════════
('Standing Calf Raise', 'calves', array['soleus'], array['calves','soleus'], 'strength', 'isolation', array['machine','bodyweight'], 'beginner', false,
 'Stand on edge with heels hanging. Rise onto toes as high as possible. Hold briefly. Lower below starting position for full stretch.',
 'Bouncing, not achieving full range, leaning on machine for support.', true),

('Seated Calf Raise', 'soleus', array['calves'], array['soleus','calves'], 'strength', 'isolation', array['machine'], 'beginner', false,
 'Sit with knees at 90°, pad on thighs. Rise onto toes. Lower for full stretch. Seated position targets soleus.',
 'Not achieving full range, not holding stretch at bottom.', true),

('Leg Press Calf Raise', 'calves', array['soleus'], array['calves','soleus'], 'strength', 'isolation', array['machine'], 'beginner', false,
 'On leg press machine, place ball of feet at bottom of platform. Extend and flex ankles for full calf raise range.',
 'Locking knees, partial range, slipping off platform.', true),

('Single-Leg Calf Raise', 'calves', array['soleus'], array['calves','soleus'], 'strength', 'isolation', array['bodyweight'], 'intermediate', false,
 'Stand on one foot on a step edge. Hold weight in opposite hand if needed. Full range press up and controlled descent.',
 'Not using full range, excessive bouncing, gripping support excessively.', true),

('Jump Rope', 'calves', array['quads','hamstrings','core'], array['calves','quads','hamstrings'], 'cardio', 'cardio', array['jump_rope'], 'beginner', true,
 'Stay on balls of feet. Jump just high enough for rope clearance. Keep shoulders relaxed and elbows close to body.',
 'Landing on heels, jumping too high, stiff arms.', true),

('Donkey Calf Raise', 'calves', array['soleus'], array['calves','soleus'], 'strength', 'isolation', array['bodyweight','machine'], 'intermediate', false,
 'Hinge at hips 90°, on toes with heels hanging. Partner or machine on lower back. Full range calf raise.',
 'Not achieving full hip bend position, partial range.', true),

('Box Jump Calf Propulsion', 'calves', array['quads','glutes'], array['calves','quads'], 'plyometric', 'plyometric', array['box'], 'intermediate', true,
 'Stand in front of box. Explode through calves and hips. Land softly on box in athletic position. Step down.',
 'Landing with straight legs, not landing softly, jumping down rather than stepping.', true),

('Ankle Circles', 'calves', array['shin_muscles'], array['calves','shin_muscles'], 'warm_up', 'mobility', array['bodyweight'], 'beginner', false,
 'Sit or stand on one foot. Draw large circles with the foot/ankle. 10 each direction per foot.',
 'Moving knee rather than just ankle, rushing through movement.', true),

-- ══════════════════════════════════════════════════════════════════════════════
-- CORE / ABS (20)
-- ══════════════════════════════════════════════════════════════════════════════
('Plank', 'core', array['shoulders','glutes','hamstrings'], array['core','shoulders','glutes'], 'strength', 'core_stability', array['bodyweight'], 'beginner', false,
 'Forearm or hand plank. Straight line from head to heels. Brace core, squeeze glutes. Do not hold breath.',
 'Hips piking up, hips sagging, looking up, holding breath.', true),

('Side Plank', 'core', array['hip_abductors','obliques'], array['core','hip_abductors','obliques'], 'strength', 'core_stability', array['bodyweight'], 'beginner', false,
 'Lie on side, prop on forearm or hand. Lift hips to form straight line. Hold, then switch sides.',
 'Hips dropping, rotating forward, not maintaining alignment.', true),

('Bicycle Crunch', 'core', array['hip_flexors','obliques'], array['core','obliques','hip_flexors'], 'strength', 'core_rotation', array['bodyweight'], 'beginner', false,
 'Lie on back, hands behind head. Alternately bring elbow toward opposite knee while extending other leg. Control rotation.',
 'Pulling neck with hands, rushing without control, incomplete rotation.', true),

('Dead Bug', 'core', array['hip_flexors','lower_back'], array['core','hip_flexors'], 'rehab', 'core_stability', array['bodyweight'], 'beginner', false,
 'Lie on back, arms up, knees 90° in air. Slowly lower opposite arm and leg toward floor maintaining lower back contact. Return.',
 'Lower back arching off floor, moving too fast, breathing incorrectly.', true),

('Ab Wheel Rollout', 'core', array['shoulders','lats','hip_flexors'], array['core','shoulders','lats'], 'strength', 'core_stability', array['ab_wheel'], 'advanced', false,
 'Kneel behind wheel, roll forward until nearly prone. Roll back using core. Maintain neutral spine throughout.',
 'Sagging hips, not controlling return, going too far for current strength.', true),

('Cable Woodchop', 'core', array['obliques','hip_flexors'], array['core','obliques'], 'strength', 'core_rotation', array['cable_machine'], 'intermediate', false,
 'High cable, rotate and pull diagonally across body to opposite hip. Pivot feet as needed. Control return.',
 'Using arms only, not rotating through thoracic spine, feet nailed to floor.', true),

('Russian Twist', 'core', array['obliques','hip_flexors'], array['core','obliques'], 'strength', 'core_rotation', array['bodyweight','weight_plate'], 'intermediate', false,
 'Sit at 45° with knees bent. Rotate side to side, touching floor each rep. Add weight for progression.',
 'Rounding lower back, feet on floor making it too easy, arm swinging without rotation.', true),

('Leg Raise', 'core', array['hip_flexors'], array['core','hip_flexors'], 'strength', 'core_flexion', array['bodyweight'], 'intermediate', false,
 'Lie flat on back. Keeping legs straight, raise to vertical. Lower without touching floor. Brace core throughout.',
 'Lower back arching, bending knees to compensate, momentum on the way up.', true),

('Hanging Leg Raise', 'core', array['hip_flexors','lats'], array['core','hip_flexors'], 'strength', 'core_flexion', array['pull_up_bar'], 'advanced', false,
 'Hang from bar. Raise straight legs to horizontal or higher. Control descent. Do not swing.',
 'Kipping/swinging, bending knees to compensate weakness, using momentum.', true),

('V-Up', 'core', array['hip_flexors'], array['core','hip_flexors'], 'strength', 'core_flexion', array['bodyweight'], 'intermediate', false,
 'Lie flat, arms overhead. Simultaneously raise arms and legs to touch feet at top. Lower with control.',
 'Bending knees, collapsing on descent, pulling neck with arms.', true),

('Dragon Flag', 'core', array['lats','hip_flexors'], array['core','lats','hip_flexors'], 'strength', 'core_stability', array['bench'], 'advanced', false,
 'Lie on bench, grip top edge. Raise body to vertical keeping rigid. Lower keeping body in straight plank position.',
 'Piking hips, rushing eccentric, lacking full-body tension.', true),

('Pallof Press', 'core', array['obliques','shoulders'], array['core','obliques'], 'rehab', 'core_stability', array['cable_machine'], 'beginner', false,
 'Stand sideways to cable. Hold handle at chest. Press straight out, hold 2 seconds, return. Resist rotation throughout.',
 'Rotating toward cable, not pressing straight out, insufficient bracing.', true),

('Mountain Climber', 'core', array['hip_flexors','shoulders','quads'], array['core','hip_flexors','shoulders'], 'cardio', 'core_stability', array['bodyweight'], 'beginner', true,
 'High plank position. Drive knees alternately toward chest at a controlled pace. Keep hips down.',
 'Hips piking, bouncing rather than driving knees, losing shoulder position.', true),

('Bird Dog', 'core', array['glutes','lower_back'], array['core','glutes','lower_back'], 'rehab', 'core_stability', array['bodyweight'], 'beginner', false,
 'On all fours. Extend opposite arm and leg simultaneously. Hold briefly, return without touching floor. Switch sides.',
 'Rotating hips, looking up, arm and leg not reaching full extension.', true),

('Hollow Body Hold', 'core', array['hip_flexors','lats'], array['core','hip_flexors'], 'strength', 'core_stability', array['bodyweight'], 'intermediate', false,
 'Lie on back. Press lower back into floor. Raise shoulders and legs slightly, arms overhead. Hold position breathing normally.',
 'Lower back arching off floor, holding breath, raising too high or too low.', true),

('Sit-Up', 'core', array['hip_flexors'], array['core','hip_flexors'], 'strength', 'core_flexion', array['bodyweight'], 'beginner', false,
 'Lie on back, knees bent. Rise fully using core. Lower with control. Hands behind head or crossed on chest.',
 'Pulling neck, hip flexor domination, bouncing off floor.', true),

('Cable Crunch', 'core', array['hip_flexors'], array['core','hip_flexors'], 'strength', 'core_flexion', array['cable_machine'], 'beginner', false,
 'Kneel facing high cable with rope. Crunch down bringing elbows to floor. Resist cable pull on way up.',
 'Pulling with arms, using hips/hip flexors, not maintaining kneeling position.', true),

('Reverse Crunch', 'core', array['hip_flexors'], array['core','hip_flexors'], 'strength', 'core_flexion', array['bodyweight'], 'beginner', false,
 'Lie on back, knees up. Use lower abs to pull knees toward chest lifting hips. Return slowly.',
 'Using momentum, lifting too high using lower back.', true),

('Plank Hip Dip', 'core', array['obliques','shoulders'], array['core','obliques'], 'strength', 'core_rotation', array['bodyweight'], 'beginner', false,
 'Forearm plank. Rotate hips to touch floor on each side. Return to neutral between reps. Stay controlled.',
 'Moving too fast, excessive hip rotation, losing shoulder position.', true),

('Turkish Get-Up', 'core', array['shoulders','glutes','hip_flexors','lats'], array['core','shoulders','glutes'], 'functional', 'core_stability', array['kettlebell'], 'advanced', true,
 'Start lying with KB in one hand, arm vertical. Rise through roll, lunge, and press to standing while keeping arm vertical. Reverse to return.',
 'Rushing through positions, losing arm vertical alignment, weight too heavy.', true);


-- ══════════════════════════════════════════════════════════════════════════════
-- FULL BODY / OLYMPIC (15)
-- ══════════════════════════════════════════════════════════════════════════════
insert into exercises (name, primary_muscle_group, secondary_muscle_groups, muscle_groups, category, movement_type, equipment, difficulty_level, is_compound, instructions, common_mistakes, is_system) values

('Power Clean', 'full_body', array['quads','glutes','traps','calves'], array['full_body','quads','glutes','traps'], 'strength', 'hip_hinge', array['barbell'], 'advanced', true,
 'Start with barbell at mid-shin. Explosively pull driving hips forward, shrug, and pull under bar to catch in front rack position at parallel squat depth.',
 'Slow first pull, early arm bend, not catching in athletic position, bar too far from body.', true),

('Hang Power Clean', 'full_body', array['quads','glutes','traps','calves'], array['full_body','quads','glutes','traps'], 'strength', 'hip_hinge', array['barbell'], 'intermediate', true,
 'Start from hang (bar at knees). Drive hips explosively, shrug, and receive bar in quarter-squat front rack.',
 'No hip extension, early arm pull, catching without dip.', true),

('Push Press', 'front_deltoid', array['triceps','quads','glutes','traps'], array['front_deltoid','triceps','quads','glutes'], 'strength', 'vertical_push', array['barbell'], 'intermediate', true,
 'Dip with knees, drive hips, press bar overhead using leg drive. Lock out fully overhead. Control descent.',
 'Excessive forward lean on dip, bar traveling forward rather than straight up.', true),

('Power Snatch', 'full_body', array['quads','glutes','traps','shoulders'], array['full_body','quads','glutes','shoulders'], 'strength', 'hip_hinge', array['barbell'], 'advanced', true,
 'Wide overhead grip. Explosive pull from floor, hip extension, punch bar overhead with straight arms in quarter squat.',
 'Early arm bend, bar too far from body, insufficient hip drive.', true),

('Clean and Jerk', 'full_body', array['quads','glutes','traps','shoulders','triceps'], array['full_body','quads','glutes','shoulders'], 'strength', 'hip_hinge', array['barbell'], 'advanced', true,
 'Clean the bar to front rack. Dip under bar, split jerk or push jerk overhead. Lock out both arms fully.',
 'Poor clean position before jerk, insufficient dip, forward lean in jerk.', true),

('Thruster', 'full_body', array['quads','glutes','shoulders','triceps'], array['full_body','quads','shoulders'], 'functional', 'squat', array['barbell','dumbbells'], 'intermediate', true,
 'Front rack squat, drive up explosively using momentum to press bar overhead. One fluid motion.',
 'Separate squat and press instead of fluid movement, losing rack position.', true),

('Dumbbell Snatch', 'full_body', array['glutes','traps','shoulders'], array['full_body','glutes','shoulders'], 'strength', 'hip_hinge', array['dumbbells'], 'intermediate', true,
 'Start with dumbbell between feet. Explosive hip drive, shrug, pull dumbbell overhead with straight arm. One motion.',
 'Pressing the dumbbell up rather than pulling, not using hip drive.', true),

('Kettlebell Swing', 'glutes', array['hamstrings','lower_back','core','shoulders'], array['glutes','hamstrings','lower_back','core'], 'functional', 'hip_hinge', array['kettlebell'], 'intermediate', true,
 'Hinge at hips, swing KB between legs. Explosively drive hips forward, KB floats to shoulder height. Hinge back on descent.',
 'Squatting rather than hinging, using arms to lift rather than hip drive, not hinging on descent.', true),

('Kettlebell Turkish Get-Up', 'core', array['shoulders','glutes','hip_flexors'], array['core','shoulders','glutes'], 'functional', 'core_stability', array['kettlebell'], 'advanced', true,
 'Lie with KB pressed overhead. Roll, post on hand, sweep leg, lunge, stand — all while keeping arm locked vertical. Reverse.',
 'Losing vertical arm position, rushing, weight too heavy to control.', true),

('Barbell Complex', 'full_body', array['quads','glutes','hamstrings','shoulders'], array['full_body','quads','glutes','shoulders'], 'functional', 'hip_hinge', array['barbell'], 'intermediate', true,
 'Perform series of movements without putting bar down (e.g., RDL, row, hang clean, front squat, press). 6 reps each.',
 'Resting between movements, choosing too heavy a weight.', true),

('Devil Press', 'full_body', array['chest','shoulders','glutes','core'], array['full_body','chest','shoulders'], 'functional', 'hip_hinge', array['dumbbells'], 'intermediate', true,
 'Burpee down to floor with dumbbells. Press up. Dumbbell snatch each arm as you stand. One fluid motion.',
 'Not using hip drive at snatch, poor burpee position.', true),

('Man Maker', 'full_body', array['chest','shoulders','core','quads'], array['full_body','chest','shoulders','core'], 'functional', 'hip_hinge', array['dumbbells'], 'advanced', true,
 'Start in plank with dumbbells. Row each arm, push up, clean to shoulders, squat, press overhead. One rep.',
 'Rushing, poor hip position in clean phase.', true),

('Barbell Row to Press', 'full_body', array['lats','shoulders','biceps','triceps'], array['full_body','lats','shoulders'], 'functional', 'horizontal_pull', array['barbell'], 'intermediate', true,
 'Bent-over row followed immediately by standing overhead press. Good full body pulling + pushing combo.',
 'Not resetting between movements, using momentum excessively.', true),

('Dumbbell Complex', 'full_body', array['quads','glutes','shoulders','core'], array['full_body','quads','shoulders'], 'functional', 'hip_hinge', array['dumbbells'], 'intermediate', true,
 'Perform series: squat, lunge, row, press, or curl — back-to-back without rest, holding dumbbells throughout.',
 'Choosing too heavy dumbbells, poor form when fatigued.', true),

('Sandbag Carry', 'full_body', array['core','glutes','quads','traps'], array['full_body','core','glutes','traps'], 'functional', 'carry', array['sandbag'], 'intermediate', true,
 'Lift sandbag to shoulder or hug it to chest. Walk for designated distance or time maintaining upright posture.',
 'Leaning excessively, not bracing core, shuffling rather than walking naturally.', true);


-- ══════════════════════════════════════════════════════════════════════════════
-- KETTLEBELL (15)
-- ══════════════════════════════════════════════════════════════════════════════
insert into exercises (name, primary_muscle_group, secondary_muscle_groups, muscle_groups, category, movement_type, equipment, difficulty_level, is_compound, instructions, common_mistakes, is_system) values

('Kettlebell Goblet Squat', 'quads', array['glutes','core','hamstrings'], array['quads','glutes','core'], 'strength', 'squat', array['kettlebell'], 'beginner', true,
 'Hold KB by horns at chest. Squat to depth keeping elbows inside knees at bottom. Maintain upright torso.',
 'Heels rising, torso falling forward, not reaching depth.', true),

('Kettlebell Deadlift', 'hamstrings', array['glutes','lower_back'], array['hamstrings','glutes','lower_back'], 'strength', 'hip_hinge', array['kettlebell'], 'beginner', true,
 'KB between feet. Hip hinge, grip handle, stand tall. Excellent for learning hip hinge pattern.',
 'Squatting instead of hinging, rounding lower back.', true),

('Kettlebell Clean', 'glutes', array['quads','traps','core','shoulders'], array['glutes','quads','traps'], 'strength', 'hip_hinge', array['kettlebell'], 'intermediate', true,
 'From swing position, guide KB into rack (held against forearm at shoulder). Thread the handle, not muscle it up.',
 'Banging forearm by muscling weight, missing rack position.', true),

('Kettlebell Press', 'front_deltoid', array['triceps','core'], array['front_deltoid','triceps','core'], 'strength', 'vertical_push', array['kettlebell'], 'intermediate', false,
 'KB in rack position. Press straight overhead to full lockout. Keep core braced, ribs down. Lower back to rack.',
 'Leaning laterally, losing rack position before press, not locking out.', true),

('Kettlebell Windmill', 'core', array['shoulders','hamstrings','glutes'], array['core','shoulders','hamstrings'], 'functional', 'core_rotation', array['kettlebell'], 'advanced', false,
 'KB overhead. Feet angled 45°. Push hip toward KB side, hinge to touch floor with free hand. KB remains vertical.',
 'Bending arm holding KB, rotating torso, rushing descent.', true),

('Kettlebell Halo', 'shoulders', array['core','triceps'], array['shoulders','core'], 'warm_up', 'core_rotation', array['kettlebell'], 'beginner', false,
 'Hold KB by horns inverted at chest. Circle around head one direction, then reverse. Keep elbows close.',
 'Moving head rather than circling around it, using too heavy KB.', true),

('Kettlebell Snatch', 'glutes', array['traps','shoulders','core'], array['glutes','traps','shoulders'], 'functional', 'hip_hinge', array['kettlebell'], 'intermediate', true,
 'From swing, guide KB overhead in one motion. Punch hand through handle at top. Full lockout, then thread back down.',
 'Muscling the KB rather than guiding, not punching through, banging wrist.', true),

('Kettlebell Renegade Row', 'lats', array['core','triceps','rear_deltoid'], array['lats','core','rear_deltoid'], 'strength', 'horizontal_pull', array['kettlebell'], 'intermediate', true,
 'Push-up position with each hand on KB. Row one KB while bracing on other. Avoid rotating hips.',
 'Rotating hips and torso, using KBs with round bottoms (unstable), feet too close.', true),

('Kettlebell Around the World', 'core', array['shoulders','forearms'], array['core','shoulders'], 'warm_up', 'core_rotation', array['kettlebell'], 'beginner', false,
 'Hold KB, pass it around body alternating hands. One direction then reverse. Keep core engaged.',
 'Using too heavy KB, jerky passing motion.', true),

('Kettlebell High Pull', 'traps', array['glutes','rear_deltoid','core'], array['traps','glutes','rear_deltoid'], 'strength', 'vertical_pull', array['kettlebell'], 'intermediate', true,
 'From swing, pull KB to chin level with elbows high. Lead with elbows. Controlled descent back to swing.',
 'Using arm strength rather than hip drive, not leading with elbows.', true),

('Kettlebell Farmer Carry', 'core', array['traps','forearms','quads','glutes'], array['core','traps','forearms'], 'functional', 'carry', array['kettlebell'], 'beginner', true,
 'Hold heavy KBs at sides. Walk for distance or time. Keep shoulders packed, core braced, upright posture.',
 'Leaning to one side, short shuffling steps, not bracing core.', true),

('Kettlebell Suitcase Deadlift', 'hamstrings', array['core','glutes','lower_back'], array['hamstrings','core','glutes'], 'strength', 'hip_hinge', array['kettlebell'], 'beginner', true,
 'KB on one side. Hinge, grip, stand, resisting lateral lean. Excellent anti-lateral flexion core exercise.',
 'Leaning toward the KB, rushing, not bracing against the uneven load.', true),

('Kettlebell Lateral Lunge', 'adductors', array['quads','glutes'], array['adductors','quads','glutes'], 'strength', 'lunge', array['kettlebell'], 'intermediate', true,
 'Hold KB at chest. Step wide to one side, sit into hip. Keep other leg straight. Push back to center.',
 'Knee caving, torso falling forward, insufficient hip sit.', true),

('Kettlebell Squat to Press', 'quads', array['glutes','shoulders','triceps'], array['quads','glutes','shoulders'], 'functional', 'squat', array['kettlebell'], 'intermediate', true,
 'KB in rack or front-loaded position. Squat, then on way up press KB overhead using momentum. Lower back to rack.',
 'Not using upward momentum from squat, pressing separately.', true),

('Single-Arm Kettlebell Row', 'lats', array['rhomboids','biceps','rear_deltoid'], array['lats','rhomboids','biceps'], 'strength', 'horizontal_pull', array['kettlebell'], 'beginner', true,
 'Hinge, brace against thigh. Row KB to hip level. Squeeze lat at top, lower fully.',
 'Rotating torso, pulling with bicep, not achieving full lat contraction.', true);


-- ══════════════════════════════════════════════════════════════════════════════
-- CARDIO (20)
-- ══════════════════════════════════════════════════════════════════════════════
insert into exercises (name, primary_muscle_group, secondary_muscle_groups, muscle_groups, category, movement_type, equipment, difficulty_level, is_compound, instructions, common_mistakes, is_system) values

('Treadmill Run', 'quads', array['hamstrings','glutes','calves','core'], array['quads','hamstrings','glutes','calves'], 'cardio', 'cardio', array['treadmill'], 'beginner', true,
 'Set pace appropriate to target heart rate zone. Land mid-foot, maintain upright posture. Arms swing naturally.',
 'Overstriding (heel striking far ahead), slouching, holding handrails.', true),

('Stationary Bike', 'quads', array['hamstrings','glutes','calves'], array['quads','hamstrings','glutes'], 'cardio', 'cardio', array['stationary_bike'], 'beginner', true,
 'Adjust seat height so slight knee bend at bottom of pedal stroke. Maintain steady cadence. Keep upper body relaxed.',
 'Seat too low causing knee pain, excessive rocking of hips.', true),

('Rowing Machine', 'lats', array['quads','hamstrings','glutes','core','biceps'], array['lats','quads','hamstrings','glutes'], 'cardio', 'cardio', array['rowing_machine'], 'beginner', true,
 'Drive with legs first, then lean back, then pull arms. Recovery: arms, lean forward, then legs. Maintain smooth stroke.',
 'Pulling with arms first, hunching forward, too slow recovery.', true),

('Elliptical', 'quads', array['hamstrings','glutes','calves','chest','triceps'], array['quads','hamstrings','glutes'], 'cardio', 'cardio', array['elliptical'], 'beginner', true,
 'Maintain light grip on handles. Push through entire foot. Keep upright posture. Control stride length.',
 'Over-relying on arm pull, leaning on handles, too high resistance causing poor form.', true),

('Stair Climber', 'glutes', array['quads','hamstrings','calves','core'], array['glutes','quads','hamstrings'], 'cardio', 'cardio', array['stair_climber'], 'beginner', true,
 'Take full steps, not half-steps. Drive through full foot. Stay upright. Hold lightly for balance only.',
 'Leaning heavily on rails, small rapid steps without hip engagement.', true),

('Burpee', 'full_body', array['chest','shoulders','quads','core'], array['full_body','chest','shoulders','quads'], 'cardio', 'cardio', array['bodyweight'], 'intermediate', true,
 'Stand, squat, jump feet back to plank, push up, jump feet in, jump up with arms overhead.',
 'Not reaching full extension on jump, skipping push-up, landing hard.', true),

('High Knees', 'quads', array['hip_flexors','calves','core'], array['quads','hip_flexors','calves'], 'cardio', 'cardio', array['bodyweight'], 'beginner', true,
 'Run in place driving knees above hip height. Pump arms in sync. Land on balls of feet. Stay tall.',
 'Leaning back, not achieving knee height, landing on heels.', true),

('Jumping Jacks', 'quads', array['calves','shoulders','core'], array['quads','calves','shoulders'], 'warm_up', 'cardio', array['bodyweight'], 'beginner', true,
 'From standing, jump feet wide while raising arms overhead. Jump back to start. Keep soft knees on landing.',
 'Stiff legs on landing, arms not reaching overhead.', true),

('Butt Kicks', 'hamstrings', array['quads','calves','core'], array['hamstrings','quads','calves'], 'warm_up', 'cardio', array['bodyweight'], 'beginner', false,
 'Run in place kicking heels toward glutes. Keep knees pointing down. Pump arms. Stay on balls of feet.',
 'Leaning forward, not achieving heel-to-glute contact.', true),

('Skipping', 'calves', array['quads','hamstrings','core'], array['calves','quads','hamstrings'], 'warm_up', 'cardio', array['bodyweight'], 'beginner', true,
 'Skip forward driving knee up with each skip. Pump opposite arm. Land softly on ball of foot.',
 'Stiff landing, not driving knee high, arms not in sync.', true),

('Battle Rope Waves', 'shoulders', array['core','lats','biceps'], array['shoulders','core','lats'], 'cardio', 'cardio', array['battle_ropes'], 'intermediate', true,
 'Hold rope ends, feet shoulder-width in slight squat. Alternate arms to create waves to anchor. Stay low throughout.',
 'Standing upright, alternating too slowly, locking arms.', true),

('Battle Rope Slams', 'shoulders', array['core','lats','glutes'], array['shoulders','core','lats'], 'cardio', 'cardio', array['battle_ropes'], 'intermediate', true,
 'Raise both ropes overhead. Slam to ground explosively using full body. Drive hips on the slam.',
 'Only using arms, not engaging core and hips.', true),

('Assault Bike', 'full_body', array['quads','hamstrings','shoulders','chest'], array['full_body','quads','shoulders'], 'cardio', 'cardio', array['assault_bike'], 'intermediate', true,
 'Push/pull handles while pedaling. Sit upright. Adjust intensity with effort — no free resistance here.',
 'Only pedaling without using handles, hunching forward.', true),

('Box Step-Up Cardio', 'quads', array['glutes','hamstrings','calves'], array['quads','glutes','hamstrings'], 'cardio', 'cardio', array['box'], 'beginner', true,
 'Rapidly alternate stepping up and down on box. Can add speed for cardio effect or slow for strength.',
 'Not fully extending on top of box, landing heavily.', true),

('Jump Rope Double Under', 'calves', array['quads','shoulders','core'], array['calves','quads','shoulders'], 'cardio', 'cardio', array['jump_rope'], 'advanced', true,
 'Jump slightly higher than single under. Wrists spin rope twice per jump. Land softly on balls of feet.',
 'Jumping too high wasting energy, tensing shoulders, timing the spin incorrectly.', true),

('Sled Push', 'quads', array['glutes','hamstrings','calves','core','chest','shoulders'], array['quads','glutes','hamstrings','core'], 'cardio', 'cardio', array['sled'], 'intermediate', true,
 'Hands on low handles, lean body at 45°. Drive with legs taking powerful strides. Keep back flat.',
 'Standing too upright, taking short choppy steps, not loading enough.', true),

('Sled Pull', 'hamstrings', array['glutes','quads','core','lats'], array['hamstrings','glutes','quads'], 'cardio', 'cardio', array['sled'], 'intermediate', true,
 'Walk backward pulling sled with rope or harness. Powerful strides with full hip extension.',
 'Short steps, using arms rather than whole body.', true),

('Ski Erg', 'lats', array['core','triceps','glutes','hamstrings'], array['lats','core','triceps'], 'cardio', 'cardio', array['ski_erg'], 'beginner', true,
 'Reach arms up, pull handles down and back in coordinated movement. Hinge slightly at hips on pull. Reset smoothly.',
 'Arms only without hip hinge, not reaching fully overhead to reset.', true),

('Lateral Shuffle', 'quads', array['glutes','calves','hip_abductors'], array['quads','glutes','calves'], 'warm_up', 'cardio', array['bodyweight'], 'beginner', true,
 'Athletic stance, low position. Shuffle laterally quickly without crossing feet. Touch cone or line at each end.',
 'Crossing feet, standing too tall, slow feet.', true),

('Agility Ladder Run', 'quads', array['calves','hip_flexors','core'], array['quads','calves','hip_flexors'], 'cardio', 'cardio', array['agility_ladder'], 'beginner', true,
 'Step in and out of ladder boxes in various patterns (in-in-out-out, lateral, crossover). Stay light on feet.',
 'Looking down at feet, landing on heels, not maintaining athletic posture.', true);


-- ══════════════════════════════════════════════════════════════════════════════
-- PLYOMETRIC (15)
-- ══════════════════════════════════════════════════════════════════════════════
insert into exercises (name, primary_muscle_group, secondary_muscle_groups, muscle_groups, category, movement_type, equipment, difficulty_level, is_compound, instructions, common_mistakes, is_system) values

('Box Jump', 'quads', array['glutes','hamstrings','calves','core'], array['quads','glutes','hamstrings','calves'], 'plyometric', 'plyometric', array['box'], 'intermediate', true,
 'Stand facing box. Swing arms, bend knees, explode up landing softly on box in athletic position. Step down.',
 'Landing with straight knees, jumping down instead of stepping, box too high.', true),

('Broad Jump', 'quads', array['glutes','hamstrings','calves'], array['quads','glutes','hamstrings'], 'plyometric', 'plyometric', array['bodyweight'], 'intermediate', true,
 'Swing arms back, hinge hips, explode forward as far as possible. Land on both feet softly in quarter squat.',
 'Not using arm swing, landing with locked knees, falling backward on landing.', true),

('Depth Jump', 'quads', array['glutes','hamstrings','calves'], array['quads','glutes','hamstrings'], 'plyometric', 'plyometric', array['box'], 'advanced', true,
 'Step off box. Land and immediately explosively jump as high as possible. Minimize ground contact time.',
 'Jumping off instead of stepping off, too long ground contact, too high box.', true),

('Lateral Box Jump', 'glutes', array['quads','hamstrings','calves','core'], array['glutes','quads','hamstrings'], 'plyometric', 'plyometric', array['box'], 'intermediate', true,
 'Stand beside box. Single or double leg jump laterally onto box. Land softly. Step down and repeat.',
 'Not landing soft, box too high, not sticking landing.', true),

('Jump Squat', 'quads', array['glutes','hamstrings','calves'], array['quads','glutes','hamstrings'], 'plyometric', 'plyometric', array['bodyweight'], 'intermediate', true,
 'Squat to parallel, explode upward jumping maximally. Land soft, immediately squat again.',
 'Quarter squatting only, landing stiff, not absorbing force.', true),

('Split Jump', 'quads', array['glutes','hamstrings','calves'], array['quads','glutes','hamstrings'], 'plyometric', 'plyometric', array['bodyweight'], 'intermediate', true,
 'Lunge position. Jump explosively, switch legs in air, land in opposite lunge. Minimize ground contact.',
 'Short switching motion, not achieving lunge depth, heavy landing.', true),

('Tuck Jump', 'quads', array['core','calves','hip_flexors'], array['quads','core','calves'], 'plyometric', 'plyometric', array['bodyweight'], 'intermediate', true,
 'Jump and bring knees to chest at peak. Land softly and immediately jump again.',
 'Not achieving tuck position, heavy landing, inconsistent rhythm.', true),

('Clap Push-Up', 'chest', array['triceps','front_deltoid','core'], array['chest','triceps','front_deltoid'], 'plyometric', 'plyometric', array['bodyweight'], 'advanced', true,
 'Explosive push-up driving hands off floor. Clap at top. Land with hands wide and immediately go into next rep.',
 'Not enough explosive power, landing with stiff arms, wrist collapse.', true),

('Medicine Ball Chest Pass', 'chest', array['triceps','front_deltoid'], array['chest','triceps','front_deltoid'], 'plyometric', 'plyometric', array['medicine_ball'], 'intermediate', true,
 'Hold ball at chest. Explosively press forward to partner or wall. Catch and immediately reset for next rep.',
 'Slow controlled press instead of explosive throw, poor catching mechanics.', true),

('Medicine Ball Slam', 'core', array['lats','shoulders','glutes'], array['core','lats','shoulders'], 'plyometric', 'plyometric', array['medicine_ball'], 'intermediate', true,
 'Raise ball overhead with full extension. Slam forcefully to ground. Catch bounce or pick up. Maximize force.',
 'Squatting to pick ball up (use hip hinge), not fully extending overhead.', true),

('Bounds', 'glutes', array['quads','hamstrings','calves'], array['glutes','quads','hamstrings'], 'plyometric', 'plyometric', array['bodyweight'], 'intermediate', true,
 'Exaggerated running stride. Drive off one leg, spend maximum time in air, land on opposite leg. Cover maximum distance.',
 'Short choppy bounds, not driving knee high, heavy landing.', true),

('Single-Leg Box Jump', 'quads', array['glutes','hamstrings','calves'], array['quads','glutes','hamstrings'], 'plyometric', 'plyometric', array['box'], 'advanced', true,
 'On one foot, jump onto box. Land on same foot softly in balanced position. Step down.',
 'Too high box, hard landing, balance not established on top.', true),

('Hurdle Hop', 'quads', array['glutes','calves','core'], array['quads','glutes','calves'], 'plyometric', 'plyometric', array['hurdles'], 'intermediate', true,
 'Hop over hurdles in sequence landing on both feet. Minimize ground contact time. Stay tall.',
 'Landing heavy, too slow between hurdles, looking down.', true),

('Sprint Starts', 'glutes', array['quads','hamstrings','calves'], array['glutes','quads','hamstrings'], 'plyometric', 'plyometric', array['bodyweight'], 'intermediate', true,
 'From athletic stance, explode into short sprint 10-20m. Drive knees, pump arms. Focus on acceleration phase.',
 'Upright at start rather than drive phase angle, slow arm action.', true),

('Plyo Push-Up', 'chest', array['triceps','front_deltoid'], array['chest','triceps','front_deltoid'], 'plyometric', 'plyometric', array['bodyweight'], 'intermediate', true,
 'Lower into push-up, explode up off floor. Catch and immediately lower into next rep. Constant tension.',
 'Insufficient push-off height, stiff wrist landing.', true);


-- ══════════════════════════════════════════════════════════════════════════════
-- MOBILITY / FLEXIBILITY (20)
-- ══════════════════════════════════════════════════════════════════════════════
insert into exercises (name, primary_muscle_group, secondary_muscle_groups, muscle_groups, category, movement_type, equipment, difficulty_level, is_compound, instructions, common_mistakes, is_system) values

('Hip 90/90 Stretch', 'hip_flexors', array['glutes','hip_external_rotators'], array['hip_flexors','glutes'], 'mobility', 'mobility', array['bodyweight'], 'beginner', false,
 'Sit with both knees at 90° (one in front, one behind). Sit tall and lean forward over front shin. Switch sides.',
 'Rounding lower back to compensate for limited mobility, forcing range.', true),

('Pigeon Pose', 'glutes', array['hip_flexors','hip_external_rotators'], array['glutes','hip_flexors'], 'mobility', 'mobility', array['bodyweight'], 'beginner', false,
 'From plank, bring one knee forward toward same-side wrist. Extend other leg back. Lower hips. Hold 30-60s.',
 'Back hip rotating open, forcing depth before ready.', true),

('World''s Greatest Stretch', 'hip_flexors', array['thoracic_spine','hamstrings','glutes'], array['hip_flexors','thoracic_spine','hamstrings'], 'warm_up', 'mobility', array['bodyweight'], 'beginner', true,
 'Lunge forward, place same-side hand inside foot. Rotate thoracic spine opening elbow to sky. Extend arm overhead.',
 'Not achieving full thoracic rotation, rushing through.', true),

('Thoracic Spine Rotation', 'thoracic_spine', array['obliques'], array['thoracic_spine','obliques'], 'mobility', 'mobility', array['bodyweight'], 'beginner', false,
 'Side-lying with knees stacked at 90°. Reach top arm across body, rotate upper spine and arm to opposite floor.',
 'Moving from lumbar spine, knees separating, not fully relaxing into rotation.', true),

('Couch Stretch', 'hip_flexors', array['quads'], array['hip_flexors','quads'], 'mobility', 'mobility', array['bodyweight'], 'beginner', false,
 'Kneel with one foot against wall behind you. Upright or lean back torso. Drive hip down toward floor.',
 'Overarching lower back, foot position not against wall.', true),

('Standing Quad Stretch', 'quads', array['hip_flexors'], array['quads','hip_flexors'], 'cool_down', 'mobility', array['bodyweight'], 'beginner', false,
 'Stand on one leg, hold opposite ankle toward glute. Keep knees together. Hips slightly forward.',
 'Knee flaring out to side, leaning forward, not keeping upright.', true),

('Seated Hamstring Stretch', 'hamstrings', array['lower_back'], array['hamstrings','lower_back'], 'cool_down', 'mobility', array['bodyweight'], 'beginner', false,
 'Sit with legs extended. Hinge at hips reaching toward feet. Keep back flat. Hold at point of tension.',
 'Rounding through lower back instead of hinging at hip, forcing stretch.', true),

('Doorway Chest Stretch', 'chest', array['front_deltoid','biceps'], array['chest','front_deltoid'], 'cool_down', 'mobility', array['bodyweight'], 'beginner', false,
 'Place forearms on doorframe. Step through, feel stretch across chest and shoulders. Hold 30-60s.',
 'Overextending lower back as compensation, not positioning arms correctly.', true),

('Lat Stretch', 'lats', array['shoulder'], array['lats','shoulder'], 'cool_down', 'mobility', array['bodyweight'], 'beginner', false,
 'Hang from bar and lean to one side or use wall/rack to reach overhead and side-bend. Feel lat stretch.',
 'Not fully relaxing into stretch, insufficient overhead reach.', true),

('Hip Flexor Lunge Stretch', 'hip_flexors', array['quads'], array['hip_flexors','quads'], 'warm_up', 'mobility', array['bodyweight'], 'beginner', false,
 'Kneeling lunge. Drive rear hip forward. Maintain upright torso. Hold 30s each side.',
 'Posterior pelvic tilt reducing stretch, leaning forward at torso.', true),

('Figure Four Glute Stretch', 'glutes', array['hip_external_rotators'], array['glutes','hip_external_rotators'], 'cool_down', 'mobility', array['bodyweight'], 'beginner', false,
 'Lie on back. Cross ankle over opposite knee. Pull both legs toward chest until glute stretch felt.',
 'Not maintaining crossed leg position, not pulling close enough.', true),

('Calf Stretch Wall', 'calves', array['soleus'], array['calves','soleus'], 'cool_down', 'mobility', array['bodyweight'], 'beginner', false,
 'Hands on wall. Step one foot back, press heel into floor. Lean forward until calf stretch felt.',
 'Not keeping heel on ground, not leaning into stretch.', true),

('Cat-Cow', 'lower_back', array['core','thoracic_spine'], array['lower_back','core'], 'warm_up', 'mobility', array['bodyweight'], 'beginner', false,
 'On all fours. Inhale: arch back (cow). Exhale: round up (cat). Move slowly through full range.',
 'Moving too fast, not using full range, breathing out of sync.', true),

('Thread the Needle', 'thoracic_spine', array['rear_deltoid','obliques'], array['thoracic_spine','rear_deltoid'], 'warm_up', 'mobility', array['bodyweight'], 'beginner', false,
 'On all fours. Thread one arm under body rotating spine. Let shoulder touch floor. Return and switch.',
 'Moving from lower back, not allowing shoulder to relax.', true),

('Ankle Mobility Drill', 'calves', array['shin_muscles'], array['calves','shin_muscles'], 'warm_up', 'mobility', array['bodyweight'], 'beginner', false,
 'Foot on step, drive knee forward over toes without heel lifting. Track knee over pinky toe.',
 'Heel lifting, knee caving inward.', true),

('Shoulder Circles', 'shoulders', array['traps','chest'], array['shoulders','traps'], 'warm_up', 'mobility', array['bodyweight'], 'beginner', false,
 'Rotate arms in large circles forward and backward. Maximize range. Do 10 forward, 10 backward each arm.',
 'Small range circles, shrugging during movement.', true),

('Neck Rolls', 'neck', array['traps'], array['neck','traps'], 'warm_up', 'mobility', array['bodyweight'], 'beginner', false,
 'Gently roll head side to side and forward. Do NOT roll fully back. Move slowly.',
 'Rolling aggressively, extending fully backward (cervical strain risk).', true),

('Lizard Pose', 'hip_flexors', array['glutes','hip_abductors'], array['hip_flexors','glutes'], 'mobility', 'mobility', array['bodyweight'], 'beginner', false,
 'Low lunge with both hands inside front foot. Lower onto forearms if possible. Hold 30-60s each side.',
 'Rear knee not on ground, rushing into depth.', true),

('Spiderman Stretch', 'hip_flexors', array['glutes','hamstrings','thoracic_spine'], array['hip_flexors','glutes','thoracic_spine'], 'warm_up', 'mobility', array['bodyweight'], 'beginner', false,
 'Lunge forward, place same-side elbow to inside of foot. Hold, then reach arm to sky. Alternate.',
 'Back knee not lowered, spine rotation insufficient.', true),

('Standing Figure 4', 'glutes', array['hip_external_rotators'], array['glutes','hip_external_rotators'], 'mobility', 'mobility', array['bodyweight'], 'intermediate', false,
 'Stand on one leg, cross other ankle over knee. Sit back as if into chair maintaining figure-4 position.',
 'Insufficient hip sit depth, wobbling, standing leg knee caving.', true);


-- ══════════════════════════════════════════════════════════════════════════════
-- WARM-UP (15)
-- ══════════════════════════════════════════════════════════════════════════════
insert into exercises (name, primary_muscle_group, secondary_muscle_groups, muscle_groups, category, movement_type, equipment, difficulty_level, is_compound, instructions, common_mistakes, is_system) values

('Arm Swings', 'shoulders', array['chest','back'], array['shoulders','chest','back'], 'warm_up', 'mobility', array['bodyweight'], 'beginner', false,
 'Stand with arms at sides. Swing both arms forward and up, then back. Alternate with horizontal cross-body swings.',
 'Moving too fast, insufficient range, not relaxing shoulders.', true),

('Leg Swings Forward', 'hip_flexors', array['hamstrings','glutes'], array['hip_flexors','hamstrings','glutes'], 'warm_up', 'mobility', array['bodyweight'], 'beginner', false,
 'Hold wall for support. Swing straight leg forward and back like a pendulum. Increase range gradually.',
 'Bending knee, leaning torso, rushing range.', true),

('Leg Swings Lateral', 'hip_abductors', array['adductors','glutes'], array['hip_abductors','adductors','glutes'], 'warm_up', 'mobility', array['bodyweight'], 'beginner', false,
 'Hold wall facing out. Swing leg across body and out to side. Increase range gradually.',
 'Rotating hips, bending stance knee.', true),

('Hip Circles', 'hip_flexors', array['glutes','lower_back'], array['hip_flexors','glutes'], 'warm_up', 'mobility', array['bodyweight'], 'beginner', false,
 'Stand with hands on hips. Make large circles with hips in both directions. 10 reps each way.',
 'Moving too fast, insufficient range.', true),

('Inchworm', 'hamstrings', array['core','shoulders','chest'], array['hamstrings','core','shoulders'], 'warm_up', 'mobility', array['bodyweight'], 'beginner', true,
 'Stand, fold forward, walk hands out to plank, push up optional, walk feet to hands, stand. Repeat.',
 'Bending knees too much, not holding plank position briefly.', true),

('Bear Crawl', 'core', array['shoulders','quads','hip_flexors'], array['core','shoulders','quads'], 'warm_up', 'cardio', array['bodyweight'], 'beginner', true,
 'On all fours, knees 2 inches from floor. Move opposite hand and foot simultaneously. Keep back flat.',
 'Hips too high, crossing same-side limbs, letting knees touch floor.', true),

('Crab Walk', 'glutes', array['triceps','core','hamstrings'], array['glutes','triceps','core'], 'warm_up', 'cardio', array['bodyweight'], 'beginner', true,
 'Table-top position (face up, hips up). Walk backward on hands and feet. Keep hips high.',
 'Hips drooping, moving same-side limbs together.', true),

('T-Rotation', 'thoracic_spine', array['core','shoulders'], array['thoracic_spine','core'], 'warm_up', 'mobility', array['bodyweight'], 'beginner', false,
 'Push-up position. Rotate one arm to sky opening body to T position. Hold 2s. Return, repeat other side.',
 'Rotating from lumbar rather than thoracic, insufficient rotation.', true),

('Knee Hug Walk', 'glutes', array['hip_flexors','lower_back'], array['glutes','hip_flexors'], 'warm_up', 'mobility', array['bodyweight'], 'beginner', false,
 'Walk forward bringing one knee to chest and hugging it. Balance on opposite foot. Alternate.',
 'Not achieving full knee hug, not balancing on one foot.', true),

('Hip Hinge Pattern', 'hamstrings', array['glutes','lower_back'], array['hamstrings','glutes','lower_back'], 'warm_up', 'hip_hinge', array['bodyweight'], 'beginner', false,
 'Stand near wall. Touch wall with glutes, hinge forward. Practice the movement without weight. Cue: push hips back.',
 'Squatting instead of hinging, rounded back.', true),

('Squat to Stand', 'quads', array['hamstrings','hip_flexors','thoracic_spine'], array['quads','hamstrings','hip_flexors'], 'warm_up', 'squat', array['bodyweight'], 'beginner', true,
 'Feet together, fold forward, grab toes. Drop hips into squat while holding toes. Straighten legs, repeat.',
 'Not holding toes, not achieving full squat depth, rushing.', true),

('Thoracic Extension Over Foam Roller', 'thoracic_spine', array['chest','shoulders'], array['thoracic_spine','chest'], 'warm_up', 'mobility', array['foam_roller'], 'beginner', false,
 'Sit in front of foam roller, place at mid-back. Support head. Extend over roller. Move to different segments.',
 'Extending at lower back, not supporting head.', true),

('Glute Activation Clam', 'glutes', array['hip_abductors'], array['glutes','hip_abductors'], 'warm_up', 'isolation', array['resistance_bands'], 'beginner', false,
 'Lie on side, knees bent, band above knees. Open top knee maintaining stacked hips. 15-20 activating reps.',
 'Rolling hips back, using too strong band.', true),

('Shoulder Pass-Through', 'shoulders', array['chest','lats'], array['shoulders','chest','lats'], 'warm_up', 'mobility', array['resistance_bands'], 'beginner', false,
 'Hold band wide with straight arms. Raise overhead and pass to behind body. Return. Narrow grip as mobility improves.',
 'Bending elbows, insufficient band width for current mobility.', true),

('Dynamic Lunge Matrix', 'quads', array['glutes','hip_flexors','hamstrings'], array['quads','glutes','hip_flexors'], 'warm_up', 'lunge', array['bodyweight'], 'beginner', true,
 'Perform forward, lateral, and reverse lunges in sequence. 3 directions per leg without stepping back to start.',
 'Rushing, insufficient lunge depth, knee caving.', true);


-- ══════════════════════════════════════════════════════════════════════════════
-- COOL-DOWN (10)
-- ══════════════════════════════════════════════════════════════════════════════
insert into exercises (name, primary_muscle_group, secondary_muscle_groups, muscle_groups, category, movement_type, equipment, difficulty_level, is_compound, instructions, common_mistakes, is_system) values

('Child''s Pose', 'lower_back', array['glutes','hip_flexors','lats'], array['lower_back','glutes','hip_flexors'], 'cool_down', 'mobility', array['bodyweight'], 'beginner', false,
 'Kneel, sit back on heels, extend arms forward. Let lower back relax. Breathe deeply. Hold 60-90s.',
 'Rushing, not allowing full relaxation into position.', true),

('Supine Twist', 'thoracic_spine', array['glutes','lower_back','obliques'], array['thoracic_spine','glutes','lower_back'], 'cool_down', 'mobility', array['bodyweight'], 'beginner', false,
 'Lie on back. Pull one knee across body to opposite floor. Extend same arm outward. Look away from knee.',
 'Forcing knee to floor, not relaxing shoulders.', true),

('Happy Baby Pose', 'glutes', array['adductors','lower_back'], array['glutes','adductors','lower_back'], 'cool_down', 'mobility', array['bodyweight'], 'beginner', false,
 'Lie on back. Bring knees to chest, grab outside of feet. Open knees toward armpits. Gently rock side to side.',
 'Not holding feet properly, forcing range.', true),

('Legs Up the Wall', 'hamstrings', array['calves','lower_back'], array['hamstrings','calves','lower_back'], 'cool_down', 'mobility', array['bodyweight'], 'beginner', false,
 'Lie near wall, swing legs up against it. Arms at sides. Relax and breathe. Hold 3-5 minutes.',
 'Too far from wall causing excessive hamstring pull.', true),

('Sphinx Pose', 'lower_back', array['core','chest'], array['lower_back','core','chest'], 'cool_down', 'mobility', array['bodyweight'], 'beginner', false,
 'Lie face down. Prop on forearms with elbows under shoulders. Gently extend spine. Relax glutes.',
 'Clenching glutes, overextending beyond comfort.', true),

('Standing Forward Fold', 'hamstrings', array['lower_back','calves'], array['hamstrings','lower_back','calves'], 'cool_down', 'mobility', array['bodyweight'], 'beginner', false,
 'Stand feet together, hinge at hips reaching toward floor. Soften knees slightly. Let head hang. Hold 30-60s.',
 'Rounding aggressively, bouncing, forcing depth.', true),

('Seated Butterfly Stretch', 'adductors', array['glutes','hip_flexors'], array['adductors','glutes','hip_flexors'], 'cool_down', 'mobility', array['bodyweight'], 'beginner', false,
 'Sit with soles of feet together, knees out. Gently press knees toward floor. Hinge forward slightly.',
 'Forcing knees down, rounding back.', true),

('Prone Quad Stretch', 'quads', array['hip_flexors'], array['quads','hip_flexors'], 'cool_down', 'mobility', array['bodyweight'], 'beginner', false,
 'Lie face down. Bend one knee bringing heel to glute. Hold ankle. Feel stretch in front of thigh.',
 'Lifting hip off floor, not maintaining position.', true),

('Cross-Body Shoulder Stretch', 'rear_deltoid', array['rhomboids'], array['rear_deltoid','rhomboids'], 'cool_down', 'mobility', array['bodyweight'], 'beginner', false,
 'Bring arm across chest, hold with other arm at elbow. Keep shoulder down. Hold 30s each.',
 'Rotating torso, elevating shoulder.', true),

('Deep Breathing Diaphragm', 'core', array['lower_back'], array['core','lower_back'], 'cool_down', 'mobility', array['bodyweight'], 'beginner', false,
 'Lie on back or sit. Inhale 4 counts expanding belly and ribcage. Exhale 6 counts. Activates parasympathetic response.',
 'Chest breathing only, not achieving diaphragmatic expansion.', true);


-- ══════════════════════════════════════════════════════════════════════════════
-- YOGA / PILATES (15)
-- ══════════════════════════════════════════════════════════════════════════════
insert into exercises (name, primary_muscle_group, secondary_muscle_groups, muscle_groups, category, movement_type, equipment, difficulty_level, is_compound, instructions, common_mistakes, is_system) values

('Sun Salutation', 'full_body', array['hamstrings','shoulders','core','chest'], array['full_body','hamstrings','shoulders','core'], 'yoga_pilates', 'mobility', array['bodyweight'], 'beginner', true,
 'Flow through: mountain, forward fold, halfway lift, plank, chaturanga, updog, downdog, forward fold, mountain. Sync breath.',
 'Rushing transitions, not synchronizing breath, improper chaturanga form.', true),

('Downward Dog', 'hamstrings', array['calves','lats','shoulders'], array['hamstrings','calves','lats','shoulders'], 'yoga_pilates', 'mobility', array['bodyweight'], 'beginner', false,
 'Inverted V shape. Press heels toward floor, lengthen spine. Engage core. Hold or pedal feet alternately.',
 'Rounding back, bending knees excessively, collapsing shoulders.', true),

('Warrior I', 'quads', array['hip_flexors','glutes','shoulders'], array['quads','hip_flexors','glutes','shoulders'], 'yoga_pilates', 'mobility', array['bodyweight'], 'beginner', false,
 'Front knee over ankle, back foot 45°, arms overhead. Square hips to front. Hold and breathe.',
 'Back heel lifting, hips not squared, collapsing front knee inward.', true),

('Warrior II', 'quads', array['adductors','glutes','shoulders'], array['quads','adductors','glutes','shoulders'], 'yoga_pilates', 'mobility', array['bodyweight'], 'beginner', false,
 'Front knee over ankle, back foot parallel. Arms extended parallel to floor. Gaze over front hand.',
 'Front knee collapsing, torso leaning forward or back.', true),

('Warrior III', 'glutes', array['hamstrings','core','shoulders'], array['glutes','hamstrings','core'], 'yoga_pilates', 'mobility', array['bodyweight'], 'intermediate', false,
 'Balance on one leg, body forms T. Arms forward or at hips. Engage glutes and core. Level hips.',
 'Hips rotating open, collapsing at standing hip, insufficient core engagement.', true),

('Tree Pose', 'glutes', array['hip_abductors','core'], array['glutes','hip_abductors','core'], 'yoga_pilates', 'mobility', array['bodyweight'], 'beginner', false,
 'Stand on one leg. Place opposite foot on inner calf or thigh (not knee). Hands at heart or overhead. Find gaze point.',
 'Foot placed on knee joint, gripping toes, swaying.', true),

('Pilates Hundred', 'core', array['hip_flexors','shoulders'], array['core','hip_flexors','shoulders'], 'yoga_pilates', 'core_stability', array['bodyweight'], 'intermediate', false,
 'Lie on back, knees at tabletop or extended. Lift head and shoulders. Pump arms 100 times breathing in 5, out 5.',
 'Neck tension, lower back arching, not maintaining C-curve.', true),

('Pilates Roll-Up', 'core', array['hip_flexors','hamstrings'], array['core','hip_flexors','hamstrings'], 'yoga_pilates', 'core_flexion', array['bodyweight'], 'intermediate', false,
 'Lie flat, arms overhead. Slowly articulate spine rolling up to sitting, then forward. Roll back down vertebra by vertebra.',
 'Using momentum, not articulating spine, collapsing at hips.', true),

('Pilates Leg Circle', 'core', array['hip_flexors','glutes'], array['core','hip_flexors','glutes'], 'yoga_pilates', 'core_stability', array['bodyweight'], 'beginner', false,
 'Lie on back, one leg extended to ceiling. Circle leg in both directions. Keep pelvis stable and still.',
 'Pelvis rocking, using momentum, circle too large.', true),

('Boat Pose', 'core', array['hip_flexors'], array['core','hip_flexors'], 'yoga_pilates', 'core_stability', array['bodyweight'], 'intermediate', false,
 'Sit balancing on sit bones. Lean back slightly, raise legs to 45°. Arms extended parallel to floor. Hold.',
 'Rounding spine, using hands for support, not maintaining leg angle.', true),

('Bridge Pose', 'glutes', array['hamstrings','core'], array['glutes','hamstrings','core'], 'yoga_pilates', 'hip_hinge', array['bodyweight'], 'beginner', false,
 'Lie on back, feet flat. Press through feet raising hips. Clasp hands under back. Squeeze glutes. Hold.',
 'Feet too far away, not engaging glutes, overextending.', true),

('Chair Pose (Utkatasana)', 'quads', array['glutes','core','shoulders'], array['quads','glutes','core'], 'yoga_pilates', 'squat', array['bodyweight'], 'beginner', false,
 'Feet together, sink hips as if sitting in chair. Arms overhead. Weight in heels. Hold and breathe.',
 'Heels rising, excessive forward lean, collapsing knees.', true),

('Crow Pose', 'core', array['wrists','shoulders','hip_flexors'], array['core','wrists','shoulders'], 'yoga_pilates', 'core_stability', array['bodyweight'], 'advanced', false,
 'Squat, place hands shoulder-width. Rest knees on upper arms. Lean forward shifting weight to hands. Lift feet.',
 'Fear of falling forward, knees slipping off arms, wrists not strong enough.', true),

('Chaturanga', 'chest', array['triceps','core','front_deltoid'], array['chest','triceps','core'], 'yoga_pilates', 'horizontal_push', array['bodyweight'], 'intermediate', true,
 'From plank, lower to 90° elbow angle keeping body rigid. Elbows skim ribs. Lower chests above floor.',
 'Dropping hips first, flaring elbows wide, going too low.', true),

('Pilates Swimming', 'lower_back', array['glutes','rear_deltoid','core'], array['lower_back','glutes','rear_deltoid'], 'yoga_pilates', 'core_stability', array['bodyweight'], 'beginner', false,
 'Lie face down, arms extended. Lift and flutter arms and legs alternately like swimming. Breathe rhythmically.',
 'Holding breath, using neck tension, not lifting high enough.', true);


-- ══════════════════════════════════════════════════════════════════════════════
-- REHAB / PHYSIO (20)
-- ══════════════════════════════════════════════════════════════════════════════
insert into exercises (name, primary_muscle_group, secondary_muscle_groups, muscle_groups, category, movement_type, equipment, difficulty_level, is_compound, instructions, common_mistakes, is_system) values

('Straight Leg Raise', 'quads', array['hip_flexors','core'], array['quads','hip_flexors','core'], 'rehab', 'isolation', array['bodyweight'], 'beginner', false,
 'Lie on back, one knee bent. Tighten quad on straight leg. Raise to 45°. Hold 2s, lower slowly. Common post-knee surgery.',
 'Not activating quad before lifting, leg rotating outward.', true),

('Terminal Knee Extension (TKE)', 'quads', array['hamstrings'], array['quads','hamstrings'], 'rehab', 'isolation', array['resistance_bands'], 'beginner', false,
 'Band behind knee. Stand with slight knee bend. Push knee forward to full extension against band. Key VMO activation.',
 'Hyperextending knee, moving too fast.', true),

('Clam Shell with Band', 'glutes', array['hip_abductors'], array['glutes','hip_abductors'], 'rehab', 'isolation', array['resistance_bands'], 'beginner', false,
 'Lie on side, band above knees. Rotate top knee open against resistance. Slow controlled motion. For hip/knee rehab.',
 'Using hip flexors rather than glutes, rolling pelvis.', true),

('Side-Lying Hip Abduction', 'glutes', array['hip_abductors'], array['glutes','hip_abductors'], 'rehab', 'isolation', array['bodyweight'], 'beginner', false,
 'Lie on side, body aligned. Raise top leg to 45°. Hold, lower. Slow and controlled. Do not let hip flex forward.',
 'Hip flexion substitution, rotating foot up or down.', true),

('Prone Hip Extension', 'glutes', array['hamstrings','lower_back'], array['glutes','hamstrings'], 'rehab', 'isolation', array['bodyweight'], 'beginner', false,
 'Lie face down. Tighten glute, raise leg 6-8 inches. Hold 2s. Lower. Used for glute activation post-injury.',
 'Rotating pelvis, using lower back to raise leg.', true),

('Seated Hip Flexor Strengthening', 'hip_flexors', array['core'], array['hip_flexors','core'], 'rehab', 'isolation', array['resistance_bands'], 'beginner', false,
 'Sit at edge of chair, band around thigh. March knees alternately against resistance. For hip flexor weakness.',
 'Using trunk flexion to assist, not maintaining upright posture.', true),

('Ankle Alphabet', 'calves', array['shin_muscles'], array['calves','shin_muscles'], 'rehab', 'mobility', array['bodyweight'], 'beginner', false,
 'Seated with foot off floor. Trace all letters of alphabet with toe. Both directions. Post ankle sprain rehab.',
 'Moving whole leg rather than ankle, rushing through letters.', true),

('Eccentric Heel Drop', 'calves', array['soleus'], array['calves','soleus'], 'rehab', 'isolation', array['bodyweight'], 'intermediate', false,
 'Stand on edge of step. Rise on two feet, shift weight to one, lower that heel below step slowly. For Achilles rehab.',
 'Dropping too fast, not completing full eccentric range.', true),

('Shoulder External Rotation', 'rear_deltoid', array['external_rotators'], array['rear_deltoid','external_rotators'], 'rehab', 'isolation', array['resistance_bands'], 'beginner', false,
 'Elbow at 90°, band in hand. Rotate forearm outward away from body. Keep elbow locked at side. For rotator cuff.',
 'Elbow drifting away from body, excessive range beyond neutral.', true),

('Shoulder Internal Rotation', 'front_deltoid', array['subscapularis'], array['front_deltoid','subscapularis'], 'rehab', 'isolation', array['resistance_bands'], 'beginner', false,
 'Elbow at 90°, band in hand. Rotate forearm inward across body. Keep elbow locked at side.',
 'Compensating with trunk rotation, elbow flaring.', true),

('Prone Y T W', 'rear_deltoid', array['rhomboids','traps','lower_traps'], array['rear_deltoid','rhomboids','traps'], 'rehab', 'isolation', array['bodyweight'], 'beginner', false,
 'Lie face down. Raise arms in Y, T, then W shapes. Hold each briefly. For scapular stability and shoulder health.',
 'Using too much momentum, not holding positions, using neck tension.', true),

('Serratus Wall Slide', 'chest', array['serratus','shoulders'], array['chest','serratus'], 'rehab', 'isolation', array['bodyweight'], 'beginner', false,
 'Forearms on wall at shoulder height. Slide arms up wall keeping shoulder blades wide and forward (protracted).',
 'Allowing shoulder blades to pinch together, not maintaining protraction.', true),

('Cervical Chin Tuck', 'neck', array['deep_neck_flexors'], array['neck'], 'rehab', 'mobility', array['bodyweight'], 'beginner', false,
 'Sitting or standing. Gently retract chin making "double chin". Hold 3-5s. For forward head posture correction.',
 'Tilting head down (nodding) rather than retracting, excessive force.', true),

('Thoracic Extension with Towel Roll', 'thoracic_spine', array['chest','shoulders'], array['thoracic_spine','chest'], 'rehab', 'mobility', array['towel'], 'beginner', false,
 'Place rolled towel at mid-back. Support head. Gently extend over roll. Hold. Move to adjacent segments.',
 'Extending at lumbar spine instead, not supporting head.', true),

('Hip Abductor Strengthening in Standing', 'glutes', array['hip_abductors'], array['glutes','hip_abductors'], 'rehab', 'isolation', array['resistance_bands'], 'beginner', false,
 'Band around ankles. Stand on one leg, move other leg outward against resistance. Slow controlled return.',
 'Losing balance on stance leg, using trunk lean to assist.', true),

('Knee Tracking Squat', 'quads', array['glutes','core'], array['quads','glutes','core'], 'rehab', 'squat', array['bodyweight'], 'beginner', true,
 'Squat with focus on knee tracking over 2nd toe. Use mirror for feedback. Correct alignment before adding load.',
 'Knee caving medially, excessive forward torso lean.', true),

('Prone Press-Up', 'lower_back', array['core'], array['lower_back','core'], 'rehab', 'mobility', array['bodyweight'], 'beginner', false,
 'Lie face down, hands under shoulders. Press upper body up leaving hips on floor. Hold 2s, lower. McKenzie extension.',
 'Clenching glutes, raising hips, going to pain (discomfort ok, pain no).', true),

('Bridges with Pillow Squeeze', 'glutes', array['adductors','core'], array['glutes','adductors'], 'rehab', 'hip_hinge', array['bodyweight'], 'beginner', false,
 'Standard bridge with pillow between knees. Squeeze pillow gently throughout. Activates adductors and VMO together.',
 'Lifting too high causing lumbar extension, not maintaining pillow squeeze.', true),

('Standing Balance Single Leg', 'core', array['calves','glutes'], array['core','calves','glutes'], 'rehab', 'core_stability', array['bodyweight'], 'beginner', false,
 'Stand on one leg. Eyes open, then progress to eyes closed. Add perturbation for advanced. 30-60s each side.',
 'Too much compensatory hip drop, gripping floor with toes.', true),

('Foam Roller IT Band', 'quads', array['hip_abductors'], array['quads','hip_abductors'], 'rehab', 'mobility', array['foam_roller'], 'beginner', false,
 'Lie on side with foam roller under outer thigh. Slowly roll from hip to knee and back. Pause on tender spots.',
 'Rolling too fast, excessive body weight on one spot causing bruising.', true);


-- ══════════════════════════════════════════════════════════════════════════════
-- RESISTANCE BANDS (15)
-- ══════════════════════════════════════════════════════════════════════════════
insert into exercises (name, primary_muscle_group, secondary_muscle_groups, muscle_groups, category, movement_type, equipment, difficulty_level, is_compound, instructions, common_mistakes, is_system) values

('Band Squat', 'quads', array['glutes','hamstrings'], array['quads','glutes','hamstrings'], 'strength', 'squat', array['resistance_bands'], 'beginner', true,
 'Stand on band, hold handles at shoulder height. Squat to depth maintaining tension. Drive through heels.',
 'Band pulling shoulders forward, not maintaining depth.', true),

('Band Deadlift', 'hamstrings', array['glutes','lower_back'], array['hamstrings','glutes','lower_back'], 'strength', 'hip_hinge', array['resistance_bands'], 'beginner', true,
 'Stand on band, hinge to grip at mid-shin. Stand tall driving hips forward. Excellent travel exercise.',
 'Rounding back, not achieving full hip extension.', true),

('Band Overhead Press', 'front_deltoid', array['triceps','lateral_deltoid'], array['front_deltoid','triceps'], 'strength', 'vertical_push', array['resistance_bands'], 'beginner', false,
 'Stand on band, press from shoulders to overhead. Lock out at top. Lower with control.',
 'Band pulling unevenly, overarching lower back.', true),

('Band Row', 'lats', array['rhomboids','biceps'], array['lats','rhomboids','biceps'], 'strength', 'horizontal_pull', array['resistance_bands'], 'beginner', false,
 'Anchor band at mid-height. Pull handles to abdomen retracting shoulder blades. Control return.',
 'Using momentum, not achieving shoulder blade retraction.', true),

('Band Chest Fly', 'chest', array['front_deltoid'], array['chest','front_deltoid'], 'strength', 'isolation', array['resistance_bands'], 'beginner', false,
 'Anchor band behind at chest height. Step forward, arms wide with slight bend. Bring hands together.',
 'Insufficient band tension, arms too straight.', true),

('Band Glute Kickback', 'glutes', array['hamstrings'], array['glutes','hamstrings'], 'strength', 'isolation', array['resistance_bands'], 'beginner', false,
 'Anchor band at ankle height. Kick leg back against resistance. Squeeze glute at top.',
 'Using lower back to extend, rotating hip.', true),

('Band Bicep Curl', 'biceps', array['brachialis'], array['biceps','brachialis'], 'strength', 'isolation', array['resistance_bands'], 'beginner', false,
 'Stand on band, curl handles from hip to shoulder. Control both up and down phases.',
 'Not controlling eccentric, swinging.', true),

('Band Tricep Extension', 'triceps', array['front_deltoid'], array['triceps'], 'strength', 'isolation', array['resistance_bands'], 'beginner', false,
 'Anchor band overhead. Face away. Extend arms forward from bent position to full extension.',
 'Elbows flaring, not achieving full lockout.', true),

('Band Good Morning', 'hamstrings', array['glutes','lower_back'], array['hamstrings','glutes'], 'strength', 'hip_hinge', array['resistance_bands'], 'beginner', false,
 'Band under feet crossed at back of neck. Hinge forward maintaining flat back. Drive hips back to extend.',
 'Rounding back, using too strong a band.', true),

('Band Pallof Press', 'core', array['obliques','shoulders'], array['core','obliques'], 'rehab', 'core_stability', array['resistance_bands'], 'beginner', false,
 'Anchor band at chest height. Stand sideways. Hold at chest, press straight out and resist rotation. Return.',
 'Rotating toward anchor, insufficient bracing.', true),

('Band Face Pull', 'rear_deltoid', array['rhomboids','traps'], array['rear_deltoid','rhomboids'], 'strength', 'horizontal_pull', array['resistance_bands'], 'beginner', false,
 'Anchor band at face height. Pull toward face with elbows high, externally rotating at end.',
 'Elbows too low, not achieving external rotation.', true),

('Band Hip Thrust', 'glutes', array['hamstrings','quads'], array['glutes','hamstrings'], 'strength', 'hip_hinge', array['resistance_bands'], 'beginner', false,
 'Sit against bench, band across hips anchored under hands. Drive hips up to extension. Squeeze glutes.',
 'Using lower back, not achieving full hip extension.', true),

('Band Lateral Walk', 'glutes', array['hip_abductors'], array['glutes','hip_abductors'], 'warm_up', 'isolation', array['resistance_bands'], 'beginner', false,
 'Band above knees, slight squat. Step sideways maintaining tension and squat position.',
 'Standing upright, feet too close losing tension.', true),

('Band Pull Down', 'lats', array['biceps','rear_deltoid'], array['lats','biceps'], 'strength', 'vertical_pull', array['resistance_bands'], 'beginner', false,
 'Anchor band overhead, face away or toward. Pull handles down to shoulder level. Squeeze lats.',
 'Not achieving full lat contraction, using arms.', true),

('Band Seated Row', 'lats', array['rhomboids','biceps'], array['lats','rhomboids'], 'strength', 'horizontal_pull', array['resistance_bands'], 'beginner', false,
 'Sit on floor, band around feet. Pull handles to abdomen maintaining upright posture.',
 'Rounding back, not retracting shoulder blades.', true);


-- ══════════════════════════════════════════════════════════════════════════════
-- TRX / SUSPENSION (10)
-- ══════════════════════════════════════════════════════════════════════════════
insert into exercises (name, primary_muscle_group, secondary_muscle_groups, muscle_groups, category, movement_type, equipment, difficulty_level, is_compound, instructions, common_mistakes, is_system) values

('TRX Row', 'lats', array['rhomboids','biceps','rear_deltoid'], array['lats','rhomboids','biceps'], 'strength', 'horizontal_pull', array['trx'], 'beginner', true,
 'Hold handles, body at angle. Pull chest to hands retracting shoulder blades. Feet walk toward anchor for more difficulty.',
 'Hips drooping, not achieving shoulder blade retraction.', true),

('TRX Chest Press', 'chest', array['triceps','front_deltoid','core'], array['chest','triceps','front_deltoid'], 'strength', 'horizontal_push', array['trx'], 'intermediate', true,
 'Face away from anchor, arms extended. Lower body by bending elbows. Press back. Body at angle.',
 'Hips dropping, uneven handle heights.', true),

('TRX Squat', 'quads', array['glutes','hamstrings'], array['quads','glutes','hamstrings'], 'strength', 'squat', array['trx'], 'beginner', true,
 'Face anchor holding handles. Squat to depth using TRX for assistance. Great for beginners learning squat.',
 'Over-relying on TRX for support, not eventually reducing assistance.', true),

('TRX Lunge', 'quads', array['glutes','hamstrings','core'], array['quads','glutes','hamstrings'], 'strength', 'lunge', array['trx'], 'intermediate', true,
 'Face anchor or away. Perform lunge using handles for balance assistance. Both forward and reverse.',
 'Too much weight on handles, knee caving.', true),

('TRX Plank', 'core', array['shoulders','glutes'], array['core','shoulders','glutes'], 'strength', 'core_stability', array['trx'], 'intermediate', false,
 'Feet in TRX handles, plank position on hands. Increases instability and core demand vs floor plank.',
 'Hips piking or dropping, not maintaining rigid body position.', true),

('TRX Hamstring Curl', 'hamstrings', array['glutes','core'], array['hamstrings','glutes','core'], 'strength', 'isolation', array['trx'], 'intermediate', false,
 'Lie on back, heels in handles. Raise hips, curl heels toward glutes. Full range pull in and extension.',
 'Hips dropping during curl, insufficient hip height.', true),

('TRX Bicep Curl', 'biceps', array['brachialis'], array['biceps','brachialis'], 'strength', 'isolation', array['trx'], 'beginner', false,
 'Face anchor, body angled back. Curl hands toward forehead. Feet walk away from anchor for more resistance.',
 'Elbows drifting back, body not in straight line.', true),

('TRX Tricep Extension', 'triceps', array['front_deltoid'], array['triceps'], 'strength', 'isolation', array['trx'], 'beginner', false,
 'Face away from anchor. Arms extended, lean forward. Bend elbows lowering head toward hands. Extend back.',
 'Elbows flaring, not maintaining rigid body line.', true),

('TRX Fallout', 'core', array['lats','shoulders'], array['core','lats','shoulders'], 'strength', 'core_stability', array['trx'], 'advanced', false,
 'Face anchor. Extend arms overhead into Y position, body nearly horizontal. Return using core strength. Similar to ab wheel.',
 'Insufficient core strength leading to lumbar collapse, too long a lean angle.', true),

('TRX Hip Hinge', 'hamstrings', array['glutes','lower_back'], array['hamstrings','glutes','lower_back'], 'strength', 'hip_hinge', array['trx'], 'beginner', true,
 'Hold handles facing anchor. Hinge at hips while keeping tension. Use TRX to groove pattern. Return to stand.',
 'Squatting instead of hinging, not maintaining flat back.', true);


-- ══════════════════════════════════════════════════════════════════════════════
-- SPORT-SPECIFIC / FUNCTIONAL (15)
-- ══════════════════════════════════════════════════════════════════════════════
insert into exercises (name, primary_muscle_group, secondary_muscle_groups, muscle_groups, category, movement_type, equipment, difficulty_level, is_compound, instructions, common_mistakes, is_system) values

('Rotational Medicine Ball Throw', 'core', array['obliques','shoulders','glutes'], array['core','obliques','shoulders'], 'sport_specific', 'core_rotation', array['medicine_ball'], 'intermediate', true,
 'Stand sideways to wall. Rotate and throw ball against wall from hip height. Catch and repeat explosively.',
 'Using arms only, insufficient hip rotation, no power generation.', true),

('Single-Leg Hop and Stick', 'glutes', array['quads','calves','core'], array['glutes','quads','calves'], 'sport_specific', 'plyometric', array['bodyweight'], 'intermediate', false,
 'Hop forward on one leg. Land and hold position for 3 seconds showing stability. Progress to lateral and diagonal.',
 'Not achieving balance on landing, knee collapsing, landing stiff.', true),

('Farmer Walk', 'core', array['traps','forearms','quads','glutes'], array['core','traps','forearms'], 'functional', 'carry', array['dumbbells','kettlebell'], 'beginner', true,
 'Hold heavy weights at sides. Walk for distance or time. Upright posture, braced core, normal stride.',
 'Leaning to one side, not bracing core, short shuffling steps.', true),

('Overhead Carry', 'shoulders', array['core','traps'], array['shoulders','core','traps'], 'functional', 'carry', array['dumbbells','kettlebell'], 'intermediate', false,
 'Press weights overhead, walk for distance. Core braced to resist extension. Keep ribs down.',
 'Overextending lumbar, not fully locking arms.', true),

('Trap Bar Carry', 'core', array['traps','forearms','quads'], array['core','traps','forearms'], 'functional', 'carry', array['trap_bar'], 'beginner', true,
 'Stand inside loaded trap bar. Walk for distance with upright posture. Great for introducing loaded carry.',
 'Leaning forward, not maintaining neutral spine.', true),

('Lateral Bound', 'glutes', array['quads','calves'], array['glutes','quads','calves'], 'sport_specific', 'plyometric', array['bodyweight'], 'intermediate', false,
 'Push off one foot laterally as far as possible. Land on opposite foot, absorb, and repeat.',
 'Short bounding, poor landing mechanics, not absorbing force.', true),

('Reactive Step Drill', 'quads', array['glutes','calves','core'], array['quads','glutes','calves'], 'sport_specific', 'cardio', array['bodyweight'], 'intermediate', true,
 'React to visual/verbal cue to step forward, back, left, right. Develops reactive agility. Partner or coach calls direction.',
 'Slow reaction, crossed feet.', true),

('Pallof Press with Rotation', 'core', array['obliques','shoulders'], array['core','obliques','shoulders'], 'functional', 'core_rotation', array['cable_machine'], 'intermediate', false,
 'Standard Pallof press with added rotation at extension. Press out, rotate away from anchor, return, bring in.',
 'Moving too fast, not controlling rotation, insufficient cable tension.', true),

('Half-Kneeling Cable Press', 'front_deltoid', array['core','triceps'], array['front_deltoid','core','triceps'], 'functional', 'vertical_push', array['cable_machine'], 'intermediate', false,
 'Half-kneeling position facing cable. Press handle forward and slightly up. Challenges core anti-rotation stability.',
 'Not maintaining kneeling position, rotating toward cable.', true),

('Split Stance Deadlift', 'hamstrings', array['glutes','core','quads'], array['hamstrings','glutes','core'], 'functional', 'hip_hinge', array['dumbbells','barbell'], 'intermediate', true,
 'Staggered stance with front foot forward. Hinge and deadlift, emphasizing front leg. Develops single-leg strength.',
 'Both legs contributing equally (should feel on front leg), rotating hips.', true),

('Cable Pull-Through', 'glutes', array['hamstrings','lower_back'], array['glutes','hamstrings'], 'functional', 'hip_hinge', array['cable_machine'], 'beginner', false,
 'Face away from cable, rope between legs. Hip hinge letting hands go back between legs. Drive hips forward to stand.',
 'Squatting instead of hinging, arms pulling rather than hips driving.', true),

('Suitcase Carry', 'core', array['traps','obliques','forearms'], array['core','traps','obliques'], 'functional', 'carry', array['dumbbells','kettlebell'], 'beginner', false,
 'Hold heavy weight in one hand at side. Walk maintaining tall posture and resisting lateral lean. Switch hands.',
 'Leaning toward weight, side-bending away from weight to compensate.', true),

('Waiter Carry', 'shoulders', array['core','traps'], array['shoulders','core'], 'functional', 'carry', array['dumbbells','kettlebell'], 'intermediate', false,
 'Hold weight overhead in one hand like a waiter. Walk maintaining tall posture. Other arm relaxed at side.',
 'Leaning to support side, wrist bending, insufficient core stability.', true),

('Cross-Body Mountain Climber', 'core', array['shoulders','hip_flexors','obliques'], array['core','shoulders','obliques'], 'functional', 'core_rotation', array['bodyweight'], 'intermediate', false,
 'High plank. Drive knee toward opposite elbow with rotation. Alternate sides at controlled pace.',
 'Hips rotating excessively, losing shoulder position, rushing.', true),

('Unilateral Farmer Carry', 'core', array['traps','obliques','forearms'], array['core','traps','obliques'], 'functional', 'carry', array['dumbbells','kettlebell'], 'intermediate', false,
 'Single heavy weight in one hand. Walk challenging anti-lateral flexion stability. Core fights to stay upright.',
 'Leaning to either side, not maintaining tall posture.', true);


-- ══════════════════════════════════════════════════════════════════════════════
-- RUNNING-SPECIFIC (10)
-- ══════════════════════════════════════════════════════════════════════════════
insert into exercises (name, primary_muscle_group, secondary_muscle_groups, muscle_groups, category, movement_type, equipment, difficulty_level, is_compound, instructions, common_mistakes, is_system) values

('Single-Leg Calf Raise Eccentric', 'calves', array['soleus'], array['calves','soleus'], 'sport_specific', 'isolation', array['bodyweight'], 'intermediate', false,
 'Rise on both feet on step edge. Shift to one foot, slowly lower over 4 counts. Key for Achilles and calf injury prevention.',
 'Dropping too fast, not completing full range.', true),

('Running Drills A-Skip', 'quads', array['calves','hip_flexors'], array['quads','calves','hip_flexors'], 'sport_specific', 'cardio', array['bodyweight'], 'beginner', true,
 'Skip with exaggerated knee drive. Arm action in sync. Stay on balls of feet. High frequency.',
 'Not driving knee high, flat foot landing, arms out of sync.', true),

('Running Drills B-Skip', 'hamstrings', array['quads','calves'], array['hamstrings','quads','calves'], 'sport_specific', 'cardio', array['bodyweight'], 'intermediate', true,
 'A-skip with additional pawing action of extended leg. Drive knee up then extend and paw back. Develops stride mechanics.',
 'Not completing extension before paw, arm-leg coordination.', true),

('Running Drills High Knees', 'quads', array['hip_flexors','calves'], array['quads','hip_flexors','calves'], 'sport_specific', 'cardio', array['bodyweight'], 'beginner', true,
 'Run in place driving knees to hip height or above. High frequency, light foot contact. Arms in sprint position.',
 'Heel striking, too slow frequency, leaning back.', true),

('Hip Flexor March', 'hip_flexors', array['quads','core'], array['hip_flexors','quads'], 'warm_up', 'isolation', array['resistance_bands'], 'beginner', false,
 'Band above knee. March in place driving knee above hip height against resistance. Key for running performance.',
 'Not achieving hip height, trunk leaning back.', true),

('Single-Leg Bounding', 'glutes', array['quads','hamstrings','calves'], array['glutes','quads','hamstrings'], 'sport_specific', 'plyometric', array['bodyweight'], 'advanced', false,
 'Continuous single-leg hops forward covering maximum distance. Each land absorbs and immediately propels next bound.',
 'Too short bounds, heavy landing, insufficient triple extension.', true),

('Hill Sprint', 'glutes', array['quads','hamstrings','calves'], array['glutes','quads','hamstrings'], 'sport_specific', 'cardio', array['bodyweight'], 'intermediate', true,
 'Sprint up hill at 5-10% grade for 30-50m. Focus on knee drive and powerful arm action. Walk back recovery.',
 'Not using hill grade, insufficient arm drive, heel striking.', true),

('Tempo Run Interval', 'quads', array['hamstrings','glutes','calves','core'], array['quads','hamstrings','glutes'], 'sport_specific', 'cardio', array['treadmill'], 'intermediate', true,
 'Run at comfortably hard pace (lactate threshold) for 20-40 minutes. Conversational but challenging. 80% max HR.',
 'Going too fast too early, inconsistent pace.', true),

('Stride Out', 'glutes', array['quads','hamstrings','calves'], array['glutes','quads','hamstrings'], 'sport_specific', 'cardio', array['bodyweight'], 'beginner', true,
 'Run at controlled near-sprint effort for 80-100m. Focus on mechanics at speed. Full recovery between each.',
 'Going all-out rather than controlled, not focusing on mechanics.', true),

('Foot Strike Drill', 'calves', array['quads','hamstrings'], array['calves','quads'], 'sport_specific', 'cardio', array['bodyweight'], 'beginner', false,
 'Slow trot focusing on landing under center of mass. Mid-foot strike. High cadence (180 steps/min).',
 'Overstriding, heel striking, low cadence.', true);


-- ══════════════════════════════════════════════════════════════════════════════
-- CYCLING (5)
-- ══════════════════════════════════════════════════════════════════════════════
insert into exercises (name, primary_muscle_group, secondary_muscle_groups, muscle_groups, category, movement_type, equipment, difficulty_level, is_compound, instructions, common_mistakes, is_system) values

('Cycling Tabata', 'quads', array['hamstrings','glutes','calves'], array['quads','hamstrings','glutes'], 'cardio', 'cardio', array['stationary_bike'], 'intermediate', true,
 '8 rounds: 20s all-out effort, 10s rest. Maximum output on each 20s interval. Note watt output for tracking.',
 'Not going truly all-out, insufficient resistance for maximal effort.', true),

('Cycling Sprint Intervals', 'quads', array['hamstrings','glutes','calves'], array['quads','hamstrings','glutes'], 'cardio', 'cardio', array['stationary_bike'], 'intermediate', true,
 '6-10 x 30s sprints with 3-4min easy recovery between. Develop anaerobic capacity. Track power output.',
 'Incomplete recovery, not maintaining max effort on each sprint.', true),

('Cycling Zone 2 Endurance', 'quads', array['hamstrings','glutes','calves'], array['quads','hamstrings','glutes'], 'cardio', 'cardio', array['stationary_bike'], 'beginner', true,
 'Ride at moderate intensity (60-70% max HR) for 45-90 minutes. Conversational pace. Builds aerobic base.',
 'Going too hard and leaving Zone 2.', true),

('Cycling Hill Climb Simulation', 'quads', array['glutes','hamstrings'], array['quads','glutes','hamstrings'], 'cardio', 'cardio', array['stationary_bike'], 'intermediate', true,
 'Increase resistance simulating climb. Reduce cadence to 60-70rpm. Seated and standing intervals.',
 'Too low resistance to simulate true climb, staying seated only.', true),

('Single-Leg Cycling Drill', 'quads', array['hamstrings','calves'], array['quads','hamstrings'], 'sport_specific', 'isolation', array['stationary_bike'], 'intermediate', false,
 'Unclip or remove one foot from pedal. Cycle with one leg for 30-60s each side. Improves pedal stroke efficiency.',
 'Dead spots in pedal stroke, compensating with upper body.', true);

-- ══════════════════════════════════════════════════════════════════════════════
-- SWIMMING / AQUA (5)
-- ══════════════════════════════════════════════════════════════════════════════
insert into exercises (name, primary_muscle_group, secondary_muscle_groups, muscle_groups, category, movement_type, equipment, difficulty_level, is_compound, instructions, common_mistakes, is_system) values

('Freestyle Intervals', 'lats', array['chest','front_deltoid','core','quads'], array['lats','chest','shoulders','core'], 'cardio', 'cardio', array['pool'], 'beginner', true,
 'Swim freestyle for set distance or time. Focus on bilateral breathing, high elbow catch, and hip rotation.',
 'Head too high, crossing over on entry, insufficient hip rotation.', true),

('Pull Buoy Drill', 'lats', array['chest','front_deltoid'], array['lats','chest','front_deltoid'], 'sport_specific', 'horizontal_pull', array['pool','pull_buoy'], 'beginner', false,
 'Use pull buoy between thighs to isolate upper body pull. Focus on high elbow and full extension through stroke.',
 'Letting buoy drop, using pull buoy as crutch for body position.', true),

('Kick Board Drill', 'quads', array['hamstrings','glutes','calves'], array['quads','hamstrings','glutes'], 'sport_specific', 'isolation', array['pool','kickboard'], 'beginner', false,
 'Hold kickboard out front, kick continuously. Flutter kick from hip, not knee. Develops leg strength and kick efficiency.',
 'Bending knees too much (bicycle kick), kicking from knees only.', true),

('Water Running', 'quads', array['glutes','hamstrings','calves','core'], array['quads','glutes','hamstrings'], 'cardio', 'cardio', array['pool'], 'beginner', true,
 'In deep end with flotation belt. Run motion in water. Low impact alternative. Great for injury recovery cardio.',
 'Not maintaining running posture, insufficient effort.', true),

('Backstroke Drill', 'lats', array['rear_deltoid','triceps','core'], array['lats','rear_deltoid','triceps'], 'sport_specific', 'horizontal_pull', array['pool'], 'beginner', true,
 'Swim backstroke focusing on shoulder rotation, straight arm recovery, and continuous flutter kick.',
 'Sitting too low in water, insufficient rotation.', true);

-- ══════════════════════════════════════════════════════════════════════════════
-- CROSSFIT / FUNCTIONAL FITNESS (10)
-- ══════════════════════════════════════════════════════════════════════════════
insert into exercises (name, primary_muscle_group, secondary_muscle_groups, muscle_groups, category, movement_type, equipment, difficulty_level, is_compound, instructions, common_mistakes, is_system) values

('Muscle-Up', 'lats', array['triceps','chest','core'], array['lats','triceps','chest'], 'functional', 'vertical_pull', array['rings','pull_up_bar'], 'advanced', true,
 'Explosive pull-up with hip kip. Transition through hip point to dip. Press to lockout. Ring muscle-up requires false grip.',
 'Insufficient explosive pull, missing transition point, no kip when fatigued.', true),

('Ring Dip', 'chest', array['triceps','front_deltoid','core'], array['chest','triceps','front_deltoid'], 'functional', 'vertical_push', array['rings'], 'intermediate', true,
 'Support on rings, rings turned out at top. Lower maintaining ring stability. Press back to support with turnout.',
 'Rings too far apart, not stabilizing rings, not achieving full depth.', true),

('Wall Ball', 'quads', array['glutes','shoulders','core'], array['quads','glutes','shoulders'], 'functional', 'squat', array['medicine_ball'], 'intermediate', true,
 'Hold med ball at chest. Squat to depth, drive up, press ball overhead to target on wall (10ft). Catch and descend.',
 'Squatting without depth, not driving through legs, missing target.', true),

('Double Under', 'calves', array['quads','shoulders'], array['calves','quads','shoulders'], 'cardio', 'cardio', array['jump_rope'], 'advanced', true,
 'Jump once while rope passes twice. Slight hip extension to jump, quick efficient wrist spin. Consistent rhythm.',
 'Piking to get height, muscling shoulders, inconsistent rhythm.', true),

('Toes to Bar', 'core', array['hip_flexors','lats'], array['core','hip_flexors','lats'], 'functional', 'core_flexion', array['pull_up_bar'], 'advanced', false,
 'Hang from bar. Swing forward, kip, drive toes up to touch bar simultaneously. Controlled swing back.',
 'Unable to touch bar with both feet simultaneously, insufficient kip timing.', true),

('Handstand Walk', 'shoulders', array['core','triceps','wrists'], array['shoulders','core','triceps'], 'functional', 'core_stability', array['bodyweight'], 'advanced', false,
 'Kick to handstand. Walk on hands maintaining balance. Core tight. Look slightly forward between hands.',
 'Head too far back or forward, insufficient shoulder stability, poor balance.', true),

('Rope Climb', 'lats', array['biceps','core','grip'], array['lats','biceps','core'], 'functional', 'vertical_pull', array['climbing_rope'], 'advanced', true,
 'Jump and grip rope high. Use leg wrap (J-hook or S-wrap) to lock feet. Stand and reach up. Efficient technique critical.',
 'Using arms only without leg assist, poor leg wrap technique.', true),

('GHD Sit-Up', 'core', array['hip_flexors','quads'], array['core','hip_flexors'], 'functional', 'core_flexion', array['ghr_machine'], 'intermediate', false,
 'Anchored at thighs on GHD. Extend back fully over machine, then sit up explosively. Touch floor or plate overhead.',
 'Going too far back too quickly, insufficient warm-up, excessive spinal extension.', true),

('Box Jump Over', 'quads', array['glutes','hamstrings','calves'], array['quads','glutes','hamstrings'], 'functional', 'plyometric', array['box'], 'intermediate', true,
 'Jump over box (not on). Two-foot takeoff, land on other side in athletic position. Can step up and down as modification.',
 'Clipping box, not landing softly on far side.', true),

('Overhead Squat', 'quads', array['glutes','shoulders','core','upper_back'], array['quads','glutes','shoulders','core'], 'strength', 'squat', array['barbell'], 'advanced', true,
 'Barbell locked overhead with wide grip. Squat to full depth maintaining bar over mid-foot. Extreme mobility required.',
 'Bar traveling forward, insufficient shoulder/ankle mobility, not reaching depth.', true);

-- ─── END OF SEED ─────────────────────────────────────────────────────────────
