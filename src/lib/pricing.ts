/**
 * PROPEL ECOSYSTEM — CANONICAL PRICING & FEATURE MATRIX
 *
 * This is the single source of truth for pricing, tier definitions, and
 * per-tier feature access across the Propel ecosystem.
 *
 * DO NOT EDIT THE COPIES DIRECTLY. This file is mirrored (because three
 * different runtimes — React Native, Next.js, Deno — cannot share an
 * import path) to:
 *
 *   • /mobile-app/constants/pricing.ts                 (React Native / Expo)
 *   • /web-dashboard/src/lib/pricing.ts                (Next.js)
 *   • /supabase/functions/_shared/pricing.ts           (Deno edge functions)
 *   • /mobile-app/supabase/functions/_shared/pricing.ts (Deno edge functions)
 *
 * When changing pricing, update THIS FILE FIRST, then copy to all four
 * locations. A sync check can be added later; for now the top-of-file
 * comment in each copy points back here.
 *
 * Locked: 2026-04-24 (see Obsidian:
 *   Projects/Propel Coaches/pricing-and-tiers-plan-2026-04-24.md)
 */

// ───────────────────────────────────────────────────────────────────────────
// TIER IDS
// ───────────────────────────────────────────────────────────────────────────

export type AITier = 'ai_starter' | 'ai_pro' | 'ai_elite';

export type CoachTier =
  | 'coach_free'
  | 'coach_starter'
  | 'coach_pro'
  | 'coach_scale';

export type Billing = 'monthly' | 'annual';

export type AIPlanId =
  | 'ai_starter' | 'ai_pro' | 'ai_elite'
  | 'ai_starter_annual' | 'ai_pro_annual' | 'ai_elite_annual';

export type CoachPlanId =
  | 'coach_free'
  | 'coach_starter' | 'coach_pro' | 'coach_scale'
  | 'coach_starter_annual' | 'coach_pro_annual' | 'coach_scale_annual';

export type PlanId = AIPlanId | CoachPlanId;

// ───────────────────────────────────────────────────────────────────────────
// PRICING DEFINITIONS (AUD, cents) — AU-only launch (Aug 2026)
//
// Pricing strategy: USD-equivalent AUD tiers (Apple App Store standard tier
// mapping). Anchors at A$24.99/A$39.99/A$59.99 monthly for AI, matching the
// USD competitive analysis (Fitbod A$24.99, Centr A$44.99, etc.). NOT
// same-digit-as-USD — that prices Propel at parity with Apple Fitness+
// (A$14.99) which we can't out-feature.
// ───────────────────────────────────────────────────────────────────────────

export interface AITierDef {
  id: AITier;
  name: string;
  monthlyCents: number;
  annualCents: number;
  trialDays: number;
  popular: boolean;
  iconKey: 'zap' | 'star' | 'crown';
  tagline: string;
}

export const AI_TIERS: Record<AITier, AITierDef> = {
  ai_starter: {
    id: 'ai_starter',
    name: 'Starter',
    monthlyCents: 2499,       // A$24.99
    annualCents: 24999,       // A$249.99 (~17% off)
    trialDays: 7,
    popular: false,
    iconKey: 'zap',
    tagline: 'The essentials — AI programs, meals, and daily guidance.',
  },
  ai_pro: {
    id: 'ai_pro',
    name: 'Pro',
    monthlyCents: 3999,       // A$39.99
    annualCents: 39999,       // A$399.99
    trialDays: 7,
    popular: true,
    iconKey: 'star',
    tagline: 'Add an AI coach you can chat with daily.',
  },
  ai_elite: {
    id: 'ai_elite',
    name: 'Elite',
    monthlyCents: 5999,       // A$59.99
    annualCents: 59999,       // A$599.99
    trialDays: 7,
    popular: false,
    iconKey: 'crown',
    tagline: 'Full-service AI coaching — unlimited chat, form analysis, wearables.',
  },
};

export interface CoachTierDef {
  id: CoachTier;
  name: string;
  monthlyCents: number;       // 0 = free tier
  annualCents: number;        // 0 = free tier
  trialDays: number;          // 0 = no trial (free tier never expires)
  maxClients: number | null;  // null = unlimited
  teamSeats: number;
  popular: boolean;
  iconKey: 'gift' | 'zap' | 'star' | 'trending-up';
  tagline: string;
}

export const COACH_TIERS: Record<CoachTier, CoachTierDef> = {
  coach_free: {
    id: 'coach_free',
    name: 'Free',
    monthlyCents: 0,
    annualCents: 0,
    trialDays: 0,
    maxClients: 3,
    teamSeats: 1,
    popular: false,
    iconKey: 'gift',
    tagline: 'Run up to 3 clients, forever. No card required.',
  },
  coach_starter: {
    id: 'coach_starter',
    name: 'Starter',
    monthlyCents: 4499,       // A$44.99
    annualCents: 44900,       // A$449 (~17% off)
    trialDays: 14,
    maxClients: 20,
    teamSeats: 1,
    popular: false,
    iconKey: 'zap',
    tagline: 'For solo coaches scaling to 20 clients with AI assistance.',
  },
  coach_pro: {
    id: 'coach_pro',
    name: 'Pro',
    monthlyCents: 8999,       // A$89.99
    annualCents: 89900,       // A$899
    trialDays: 14,
    maxClients: null,
    teamSeats: 1,
    popular: true,
    iconKey: 'star',
    tagline: 'Unlimited clients, full AI, branded experience, Propel app bundle.',
  },
  coach_scale: {
    id: 'coach_scale',
    name: 'Scale',
    monthlyCents: 17999,      // A$179.99
    annualCents: 179900,      // A$1,799
    trialDays: 14,
    maxClients: null,
    teamSeats: 5,
    popular: false,
    iconKey: 'trending-up',
    tagline: 'Multi-coach teams, concierge onboarding, API access.',
  },
};

// ───────────────────────────────────────────────────────────────────────────
// FEATURE MATRIX
// ───────────────────────────────────────────────────────────────────────────
//
// Every feature that is gated by tier is declared here. When a tier's
// feature flag is:
//   • boolean → simple on/off
//   • number  → a quota (Infinity = unlimited)
//   • string  → a named level (e.g. 'basic' | 'full' | 'full_trends')
//
// Consumers should NEVER hardcode tier checks. Always read through the
// canAccess() / getQuota() / getLevel() helpers at the bottom of this file.

export type AnalyticsLevel = 'basic' | 'full' | 'full_trends';
export type WearableLevel = 'none' | 'read_only' | 'full_sync';

export interface AIFeatureFlags {
  ai_program: boolean;
  ai_meal_plan: boolean;
  daily_decision_engine: boolean;
  habit_tracking: boolean;
  progress_analytics: AnalyticsLevel;
  ai_coach_chat: boolean;
  ai_coach_chat_daily_quota: number;     // Infinity = unlimited
  weekly_checkin_ai: boolean;
  video_form_analysis: boolean;
  wearable_integration: WearableLevel;
  priority_ai_response: boolean;
}

export const AI_FEATURES: Record<AITier, AIFeatureFlags> = {
  ai_starter: {
    ai_program: true,
    ai_meal_plan: true,
    daily_decision_engine: true,
    habit_tracking: true,
    progress_analytics: 'basic',
    ai_coach_chat: false,
    ai_coach_chat_daily_quota: 0,
    weekly_checkin_ai: false,
    video_form_analysis: false,
    wearable_integration: 'none',
    priority_ai_response: false,
  },
  ai_pro: {
    ai_program: true,
    ai_meal_plan: true,
    daily_decision_engine: true,
    habit_tracking: true,
    progress_analytics: 'full',
    ai_coach_chat: true,
    ai_coach_chat_daily_quota: 20,
    weekly_checkin_ai: true,
    video_form_analysis: false,
    wearable_integration: 'read_only',
    priority_ai_response: false,
  },
  ai_elite: {
    ai_program: true,
    ai_meal_plan: true,
    daily_decision_engine: true,
    habit_tracking: true,
    progress_analytics: 'full_trends',
    ai_coach_chat: true,
    ai_coach_chat_daily_quota: Number.POSITIVE_INFINITY,
    weekly_checkin_ai: true,
    video_form_analysis: true,
    wearable_integration: 'full_sync',
    priority_ai_response: true,
  },
};

export interface CoachFeatureFlags {
  manual_program_builder: boolean;
  messaging: boolean;
  ai_program_generation_monthly_quota: number;  // Infinity = unlimited
  ai_meal_plan_generation_monthly_quota: number;
  ai_coach_assistant: boolean;
  checkin_automation: boolean;
  payments_invoicing: boolean;
  custom_branding: boolean;
  b2c_discount_coupon: boolean;                 // Pro+ coach gets a Stripe coupon to share
  priority_support: boolean;
  concierge_onboarding: boolean;
  api_access: boolean;
}

export const COACH_FEATURES: Record<CoachTier, CoachFeatureFlags> = {
  coach_free: {
    manual_program_builder: true,
    messaging: true,
    ai_program_generation_monthly_quota: 0,
    ai_meal_plan_generation_monthly_quota: 0,
    ai_coach_assistant: false,
    checkin_automation: false,
    payments_invoicing: false,
    custom_branding: false,
    b2c_discount_coupon: false,
    priority_support: false,
    concierge_onboarding: false,
    api_access: false,
  },
  coach_starter: {
    manual_program_builder: true,
    messaging: true,
    ai_program_generation_monthly_quota: 10,
    ai_meal_plan_generation_monthly_quota: 10,
    ai_coach_assistant: false,
    checkin_automation: true,
    payments_invoicing: true,
    custom_branding: false,
    b2c_discount_coupon: false,
    priority_support: false,
    concierge_onboarding: false,
    api_access: false,
  },
  coach_pro: {
    manual_program_builder: true,
    messaging: true,
    ai_program_generation_monthly_quota: Number.POSITIVE_INFINITY,
    ai_meal_plan_generation_monthly_quota: Number.POSITIVE_INFINITY,
    ai_coach_assistant: true,
    checkin_automation: true,
    payments_invoicing: true,
    custom_branding: true,
    b2c_discount_coupon: true,
    priority_support: true,
    concierge_onboarding: false,
    api_access: false,
  },
  coach_scale: {
    manual_program_builder: true,
    messaging: true,
    ai_program_generation_monthly_quota: Number.POSITIVE_INFINITY,
    ai_meal_plan_generation_monthly_quota: Number.POSITIVE_INFINITY,
    ai_coach_assistant: true,
    checkin_automation: true,
    payments_invoicing: true,
    custom_branding: true,
    b2c_discount_coupon: true,
    priority_support: true,
    concierge_onboarding: true,
    api_access: true,
  },
};

// ───────────────────────────────────────────────────────────────────────────
// PUBLIC-FACING FEATURE COPY (for pricing pages / paywalls)
// ───────────────────────────────────────────────────────────────────────────
//
// Human-readable bullets per tier. Keep these short (<45 chars each) so they
// fit on both mobile cards and web pricing columns.

export const AI_TIER_FEATURE_COPY: Record<AITier, string[]> = {
  ai_starter: [
    'AI-generated workout programs',
    'AI meal plans + nutrition tracking',
    'Daily "what should I do" guidance',
    'Habit & progress tracking',
  ],
  ai_pro: [
    'Everything in Starter',
    'AI Coach chat (20 messages/day)',
    'Weekly AI check-in feedback',
    'Full progress analytics',
    'Read-only wearable integration',
  ],
  ai_elite: [
    'Everything in Pro',
    'Unlimited AI Coach chat',
    'Video form analysis',
    'Full wearable sync (Apple Health, Garmin)',
    'Priority AI response speed',
  ],
};

export const COACH_TIER_FEATURE_COPY: Record<CoachTier, string[]> = {
  coach_free: [
    'Up to 3 active clients',
    'Manual program builder',
    'Client messaging',
    'Basic dashboard',
  ],
  coach_starter: [
    'Up to 20 active clients',
    '10 AI-generated programs/month',
    '10 AI meal plans/month',
    'Check-in automation',
    'Payments & invoicing',
  ],
  coach_pro: [
    'Unlimited clients',
    'Unlimited AI program generation',
    'Unlimited AI meal plans',
    'AI Coach assistant (reply-writing)',
    'Custom branding',
    'Propel app discount code for your clients',
    'Priority support (24h)',
  ],
  coach_scale: [
    'Everything in Pro',
    'Up to 5 team coach seats',
    'Concierge onboarding',
    'API access',
    'Priority support (24h)',
  ],
};

// ───────────────────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────────────────

export function formatPrice(cents: number): string {
  if (cents === 0) return 'Free';
  const dollars = cents / 100;
  // Show .00 → strip; show .99 → keep
  const formatted = dollars.toFixed(2);
  return formatted.endsWith('.00') ? `A$${Math.round(dollars)}` : `A$${formatted}`;
}

export function aiPlanIdFor(tier: AITier, billing: Billing): AIPlanId {
  return billing === 'annual' ? (`${tier}_annual` as AIPlanId) : (tier as AIPlanId);
}

export function coachPlanIdFor(tier: CoachTier, billing: Billing): CoachPlanId {
  if (tier === 'coach_free') return 'coach_free';  // free tier has no billing variant
  return billing === 'annual' ? (`${tier}_annual` as CoachPlanId) : (tier as CoachPlanId);
}

export function parsePlanId(planId: string): {
  kind: 'ai' | 'coach';
  tier: AITier | CoachTier;
  billing: Billing;
} | null {
  const annual = planId.endsWith('_annual');
  const base = annual ? planId.slice(0, -'_annual'.length) : planId;
  if (base in AI_TIERS) {
    return { kind: 'ai', tier: base as AITier, billing: annual ? 'annual' : 'monthly' };
  }
  if (base in COACH_TIERS) {
    return { kind: 'coach', tier: base as CoachTier, billing: annual ? 'annual' : 'monthly' };
  }
  return null;
}

/** Boolean feature check for AI tier. Returns false if tier is null/unknown. */
export function canAccessAI<K extends keyof AIFeatureFlags>(
  tier: AITier | null | undefined,
  feature: K,
): AIFeatureFlags[K] extends boolean ? boolean : boolean {
  if (!tier || !(tier in AI_FEATURES)) return false as never;
  const val = AI_FEATURES[tier][feature];
  if (typeof val === 'boolean') return val as never;
  if (typeof val === 'number') return (val > 0) as never;
  return (val !== 'none') as never;
}

/** Boolean feature check for Coach tier. Returns false if tier is null/unknown. */
export function canAccessCoach<K extends keyof CoachFeatureFlags>(
  tier: CoachTier | null | undefined,
  feature: K,
): CoachFeatureFlags[K] extends boolean ? boolean : boolean {
  if (!tier || !(tier in COACH_FEATURES)) return false as never;
  const val = COACH_FEATURES[tier][feature];
  if (typeof val === 'boolean') return val as never;
  if (typeof val === 'number') return (val > 0) as never;
  return true as never;
}

/** Quota lookup. Returns 0 if tier is null/unknown; Infinity for unlimited. */
export function getAIQuota(
  tier: AITier | null | undefined,
  feature: 'ai_coach_chat_daily_quota',
): number {
  if (!tier || !(tier in AI_FEATURES)) return 0;
  return AI_FEATURES[tier][feature];
}

export function getCoachQuota(
  tier: CoachTier | null | undefined,
  feature:
    | 'ai_program_generation_monthly_quota'
    | 'ai_meal_plan_generation_monthly_quota',
): number {
  if (!tier || !(tier in COACH_FEATURES)) return 0;
  return COACH_FEATURES[tier][feature];
}

/** Max-clients check. Returns null (unlimited), a number, or 0 for unknown tier. */
export function getCoachClientCap(tier: CoachTier | null | undefined): number | null {
  if (!tier || !(tier in COACH_TIERS)) return 0;
  return COACH_TIERS[tier].maxClients;
}

/** Client-count permit. Returns true if the coach can add one more client. */
export function coachCanAddClient(
  tier: CoachTier | null | undefined,
  currentCount: number,
): boolean {
  const cap = getCoachClientCap(tier);
  if (cap === null) return true;         // unlimited
  return currentCount < cap;
}

/** Categorises a subscription_tier string into AI / coach / unknown. */
export function classifyTier(tier: string | null | undefined): 'ai' | 'coach' | 'unknown' {
  if (!tier) return 'unknown';
  if (tier in AI_TIERS) return 'ai';
  if (tier in COACH_TIERS) return 'coach';
  return 'unknown';
}
