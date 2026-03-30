# AI Coach Tier — Build Prompt (Phases 1 & 2)

## Context

Propel Coaches is adding a new lower-cost subscription tier: **AI Coach**. Instead of being matched with a human coach, the client is fully coached by an AI agent. Same app experience (programs, meal plans, messages, check-ins) but the "coach" is AI.

This prompt covers Phase 1 (foundation) and Phase 2 (first AI-generated program + meal plan). Phase 3+ (messaging agent, check-in reviews, proactive engagement) will come later.

### Existing Stack
- **Mobile app:** React Native / Expo Router
- **Web dashboard:** Next.js 14 App Router
- **Backend:** Supabase (Postgres + Auth + Edge Functions + RLS)
- **Styling (app):** ThemeContext at `@/context/ThemeContext`, design tokens at `constants/tokens.ts`
- **Styling (web):** Tailwind with custom tokens (`bg-brand`, `text-cb-text`, `bg-surface`)

### Existing Tables You'll Interact With
- `profiles` — user profiles (has `role` field)
- `messages` — coach-client messaging
- `workout_programs`, `workout_days`, `workout_exercises`, `exercise_sets` — workout system
- `workout_sections` — sport-specific sections (just migrated)
- `meal_plans`, `meal_plan_days`, `meals`, `meal_items` — nutrition system (verify exact names before using)
- `check_ins` — client check-in submissions (verify exact name)

**IMPORTANT:** Before writing any Supabase queries, verify the actual table and column names by checking the existing codebase. Do NOT assume table names — run a search first.

---

## Batch 1: Database Foundation + Consumer Agreement

### 1a. Database Migration

Create `supabase/migrations/20260328_ai_coach_tier.sql`:

```sql
-- Add coaching_type to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coaching_type text DEFAULT 'human';

-- Consumer agreement tracking
CREATE TABLE IF NOT EXISTS ai_coach_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agreement_version text NOT NULL DEFAULT '1.0',
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, agreement_version)
);

-- Onboarding questionnaire responses
CREATE TABLE IF NOT EXISTS ai_onboarding_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fitness_goal text NOT NULL,                    -- 'lose_weight' | 'build_muscle' | 'improve_fitness' | 'sport_performance' | 'general_health'
  experience_level text NOT NULL,                -- 'beginner' | 'intermediate' | 'advanced'
  training_days_per_week integer NOT NULL,        -- 1-7
  session_duration_minutes integer NOT NULL,      -- 30, 45, 60, 75, 90
  available_equipment text NOT NULL,              -- 'full_gym' | 'home_basic' | 'home_full' | 'bodyweight' | 'resistance_bands'
  injuries_limitations text,                      -- free text, nullable
  sport_preference text,                          -- maps to SportCategory type if applicable
  dietary_preference text,                        -- 'no_preference' | 'high_protein' | 'balanced' | 'vegetarian' | 'vegan' | 'keto' | 'paleo'
  dietary_restrictions text,                      -- free text (allergies, intolerances)
  current_weight_kg numeric,
  target_weight_kg numeric,
  height_cm numeric,
  age integer,
  sex text,                                       -- 'male' | 'female' | 'other' | 'prefer_not_to_say'
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI agent action log (for debugging and analytics)
CREATE TABLE IF NOT EXISTS ai_agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trigger_type text NOT NULL,                    -- 'onboarding' | 'message' | 'check_in' | 'nudge' | 'program_complete'
  input_summary text,                             -- brief description of input context
  output_action text,                             -- what the AI did
  model_used text,                                -- 'gpt-4' | 'claude-sonnet' etc
  tokens_used integer,
  latency_ms integer,
  error text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE ai_coach_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_logs ENABLE ROW LEVEL SECURITY;

-- Users can read/insert their own agreement
CREATE POLICY "Users manage own agreements" ON ai_coach_agreements
  FOR ALL USING (user_id = auth.uid());

-- Users can manage their own onboarding responses
CREATE POLICY "Users manage own onboarding" ON ai_onboarding_responses
  FOR ALL USING (user_id = auth.uid());

-- Users can read their own agent logs
CREATE POLICY "Users read own agent logs" ON ai_agent_logs
  FOR SELECT USING (user_id = auth.uid());

-- Service role can insert agent logs (edge functions use service role)
-- No policy needed — service role bypasses RLS

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_onboarding_user ON ai_onboarding_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_user ON ai_agent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_coaching_type ON profiles(coaching_type);
```

### 1b. Consumer Agreement Screen (Mobile App)

Create `app/ai-coach/agreement.tsx`:

- Full-screen scrollable view with the agreement text
- Agreement text covers these points:
  - This is an AI-powered coaching service, not human coaching
  - AI provides general fitness and nutrition guidance based on your inputs
  - This is NOT medical, physiotherapy, dietetic, or psychological advice
  - You should consult a qualified health professional before starting any new exercise or nutrition program
  - You are responsible for your own health and safety decisions
  - Stop any exercise that causes pain and consult a healthcare provider
  - AI recommendations are only as accurate as the information you provide
  - Propel Coaches Pty Ltd is not liable for any injuries, health issues, or adverse outcomes arising from following AI-generated guidance
  - You may cancel your subscription at any time
  - Your data is used solely to personalise your coaching experience (link to privacy policy)
- Scroll indicator: user must scroll to bottom before the accept button enables
- Checkbox: "I have read and agree to the AI Coach Terms of Service"
- "Accept & Continue" button (disabled until scrolled + checked)
- On accept: insert into `ai_coach_agreements`, then navigate to onboarding questionnaire
- Style with ThemeContext tokens. Clean, professional look — not scary legal, but clear.

### 1c. Onboarding Questionnaire (Mobile App)

Create `app/ai-coach/onboarding.tsx`:

- Multi-step form (progress bar at top showing steps 1-5):
  - **Step 1 — Goals:** Single-select cards for fitness_goal (icon + label for each)
  - **Step 2 — Experience & Schedule:** experience_level selector, training_days_per_week stepper (1-7), session_duration_minutes selector
  - **Step 3 — Equipment & Sport:** available_equipment single-select cards, optional sport_preference dropdown
  - **Step 4 — Body & Health:** current_weight_kg, target_weight_kg, height_cm, age, sex (all optional but encouraged). injuries_limitations free text field ("Any injuries or limitations we should know about?")
  - **Step 5 — Nutrition:** dietary_preference single-select, dietary_restrictions free text ("Any allergies or food intolerances?")
- Back/Next navigation between steps. "Next" validates current step before advancing.
- Final screen: "Let's build your program!" button
- On submit: insert into `ai_onboarding_responses` with `completed_at = now()`, set `profiles.coaching_type = 'ai'`
- Clean, modern UI. Cards should be tappable with selected state. Use brand colors for selected states.

### 1d. Auth Flow Modification

- Modify the signup flow: after email/password registration, show a choice screen:
  - "I have a coach code" → existing invitation flow
  - "Start with AI Coach" → navigate to `ai-coach/agreement`
- If user selects AI Coach path, skip the "waiting for coach" / invitation screen entirely
- After onboarding completes, navigate to the main app (home/dashboard tab)

---

## Batch 2: AI Program & Meal Plan Generation

### 2a. AI Program Generation Edge Function

Create `supabase/functions/ai-generate-program/index.ts`:

- Triggered after onboarding completion (called from the app after inserting onboarding responses)
- Reads `ai_onboarding_responses` for the user
- Constructs a detailed prompt for the AI model:
  - Include: goal, experience level, days/week, session duration, equipment, injuries, sport preference
  - Request: a structured JSON program with weeks, days, exercises, sets, reps, rest periods
  - Format: must match the existing `workout_programs` → `workout_days` → `workout_exercises` → `exercise_sets` table structure
  - If sport_preference is set, use the sport-specific format (include `sport_category` on workout_programs, appropriate `format` on workout_days, create `workout_sections` where relevant)
- Parse AI response and insert into database:
  - Create `workout_programs` row (with `coach_id = NULL` or a special AI coach UUID, `client_id = auth user`)
  - Create `workout_days` rows
  - Create `workout_exercises` rows with appropriate fields
  - Create `exercise_sets` rows with targets
- Set program as active (`is_active = true`)
- Log the action in `ai_agent_logs`
- Return success/failure to the client

**Important:** The AI-generated program should be realistic and well-structured. The prompt should specify:
- Proper warm-up and cool-down
- Progressive overload built into the weeks
- Appropriate volume for the experience level
- Rest day distribution
- Exercise selection matching the available equipment

### 2b. AI Meal Plan Generation Edge Function

Create `supabase/functions/ai-generate-mealplan/index.ts`:

- Triggered alongside or immediately after program generation
- Reads `ai_onboarding_responses` for dietary preferences + body stats
- Calculates approximate TDEE from weight, height, age, sex, activity level (training days)
- Adjusts calories based on goal (deficit for weight loss, surplus for muscle gain, maintenance for general health)
- Constructs prompt requesting a structured meal plan:
  - 7 days, 3-4 meals per day
  - Matches dietary preference and restrictions
  - Realistic, whole-food focused meals
  - Approximate macros per meal
- Parse and insert into existing meal plan tables (verify exact table names first!)
- Log in `ai_agent_logs`

### 2c. Welcome Message

After both program and meal plan are generated:

- Insert a message into the `messages` table from the AI coach to the client:
  - Sender: use a dedicated AI coach profile (create one in profiles with a recognisable name like "Propel AI Coach" and an avatar)
  - Message content: personalised welcome based on their goals. Example:
    > "Hey [first_name]! Welcome to Propel. I've put together your first training program — [X] days per week focused on [goal]. I've also set up a meal plan based on your preferences. Take a look through everything and let me know if you'd like any changes. I'm here whenever you need me!"
- This message appears in their normal messages tab

### 2d. Loading/Generation Screen (Mobile App)

Create `app/ai-coach/generating.tsx`:

- Shown after onboarding submit while the edge functions run
- Animated screen: "Building your personalised program..." with a progress animation
- Steps shown as they complete:
  - "Analysing your goals..." ✓
  - "Designing your training program..." ✓
  - "Creating your meal plan..." ✓
  - "Setting everything up..." ✓
- On completion: navigate to main app with a brief success toast
- On failure: show error with retry button. Log error in `ai_agent_logs`.
- Timeout after 60 seconds with a friendly error: "This is taking longer than expected. We'll have your program ready shortly — check back in a few minutes."

---

## Batch 3: App Routing & UI Adjustments

### 3a. Conditional UI Based on coaching_type

Throughout the app, certain screens need to behave differently for AI-coached clients:

- **Messages tab:** Already works — messages from the AI coach profile will appear here naturally. No changes needed to the UI itself (the messaging agent that RESPONDS is Phase 3).
- **Coach profile section:** If `coaching_type = 'ai'`, show "AI Coach" card instead of a human coach card. Include the AI coach avatar and name. No "Schedule Call" or similar human-only actions.
- **Settings:** Add "Upgrade to Human Coach" option for AI clients. Add "AI Coach Agreement" link to view the accepted agreement.
- **Check-in form:** Still works as normal — the AI review of check-ins is Phase 4. For now, just show a note: "Your AI coach will review your check-in and adjust your program accordingly."

### 3b. Navigation Guards

- If `coaching_type = 'ai'` and no `ai_coach_agreements` record exists → redirect to agreement screen
- If agreement exists but no `ai_onboarding_responses` with `completed_at` → redirect to onboarding
- If onboarding complete but no active `workout_programs` → show generating screen or "Your program is being prepared" message
- Normal app access only after: agreement ✓ + onboarding ✓ + program exists ✓

### 3c. AI Coach Profile Seed

Create a migration or seed script that creates the AI coach profile in the `profiles` table:
- `id`: a fixed UUID (e.g., `00000000-0000-0000-0000-000000000001`)
- `first_name`: "Propel"
- `last_name`: "AI Coach"
- `email`: "ai-coach@propelcoaches.com"
- `role`: "coach"
- `avatar_url`: (use a branded AI avatar — can be set later)
- This profile is the "sender" for all AI-generated messages

---

## Important Notes

1. **Verify all table names** before writing queries. Search the existing codebase for actual table and column names. The tables listed above are best guesses — confirm them.

2. **RLS implications:** The AI coach profile needs to be able to write to client-facing tables (messages, workout_programs, etc). The edge functions run with the service role key, which bypasses RLS. Make sure the edge functions use `createClient` with the service role, not the anon key.

3. **Don't break existing flows.** Human-coached clients should see zero changes. The `coaching_type` field defaults to `'human'`, so all existing users are unaffected.

4. **Mobile-first.** Build the app screens first. The web dashboard changes (admin view of AI clients, analytics) come later.

5. **API keys:** The edge functions will need an AI provider API key (OpenAI or Anthropic). Store it as a Supabase secret (`supabase secrets set AI_API_KEY=sk-...`). Don't hardcode it.
