// ────────────────────────────────────────────────────────────────────────────
// Web modality registry. Mirrors mobile-app/lib/modalities.ts in shape, but
// targets the web dashboard (lucide-react icons via name lookup). Coach-side
// surfaces import from here:
//   • app/(dashboard)/programs/page.tsx — modality picker in the AI Generator
//   • app/(dashboard)/clients/[id]/page.tsx — per-modality grouping + badges
//
// Keys here MUST match `workout_programs.modality` enum in
// supabase.legacy/migrations/20260504_001_multi_modality_programs.sql and
// the edge function names in generators/ENGINE_CONTRACT.md.
// ────────────────────────────────────────────────────────────────────────────

import {
  Dumbbell,
  Footprints,
  Bike,
  Waves,
  Activity,
  Swords,
  Move,
  type LucideIcon,
} from 'lucide-react';

export type Modality =
  | 'strength'
  | 'running'
  | 'cycling'
  | 'triathlon'
  | 'hyrox'
  | 'combat'
  | 'mobility';

export const ALL_MODALITIES: readonly Modality[] = [
  'strength',
  'running',
  'cycling',
  'triathlon',
  'hyrox',
  'combat',
  'mobility',
] as const;

export type ModalityCard = {
  id: Modality;
  title: string;
  subhead: string;
  /** lucide-react icon (already-imported component, not a string). */
  Icon: LucideIcon;
};

export const MODALITY_CARDS: readonly ModalityCard[] = [
  {
    id: 'strength',
    title: 'Strength training',
    subhead: 'Build muscle, get stronger, lift more',
    Icon: Dumbbell,
  },
  {
    id: 'running',
    title: 'Running',
    subhead: '5K, 10K, half-marathon, marathon, ultra',
    Icon: Footprints,
  },
  {
    id: 'cycling',
    title: 'Cycling',
    subhead: 'Road, gravel, MTB, indoor',
    Icon: Bike,
  },
  {
    id: 'triathlon',
    title: 'Triathlon',
    subhead: 'Sprint to Ironman',
    Icon: Waves,
  },
  {
    id: 'hyrox',
    title: 'Hyrox / Functional Fitness',
    subhead: 'Hyrox events and hybrid hard work',
    Icon: Activity,
  },
  {
    id: 'combat',
    title: 'Combat sport',
    subhead: 'MMA, boxing, BJJ, Muay Thai, wrestling',
    Icon: Swords,
  },
  {
    id: 'mobility',
    title: 'Mobility & recovery',
    subhead: 'Pain reduction, flexibility, foundational movement',
    Icon: Move,
  },
] as const;

export const MODALITY_LABEL: Record<Modality, string> = {
  strength: 'Strength',
  running: 'Running',
  cycling: 'Cycling',
  triathlon: 'Triathlon',
  hyrox: 'Hyrox',
  combat: 'Combat',
  mobility: 'Mobility',
};

export const MODALITY_ICON: Record<Modality, LucideIcon> = {
  strength: Dumbbell,
  running: Footprints,
  cycling: Bike,
  triathlon: Waves,
  hyrox: Activity,
  combat: Swords,
  mobility: Move,
};

/** Edge function name per modality (mirrors ENGINE_CONTRACT.md). */
export const EDGE_FN_BY_MODALITY: Record<Modality, string> = {
  strength: 'ai-generate-program',
  running: 'ai-generate-running',
  cycling: 'ai-generate-cycling',
  triathlon: 'ai-generate-triathlon',
  hyrox: 'ai-generate-hyrox',
  combat: 'ai-generate-combat',
  mobility: 'ai-generate-mobility',
};

// ── Per-modality input schema (drives the dynamic coach override form) ─────
// Mirrors the modality_inputs key conventions in ENGINE_CONTRACT.md §"Inputs
// the engine reads from profiles". Coaches can leave fields blank and the
// engine will fall back to client profile values + sensible defaults.

export type ModalityFieldType = 'text' | 'number' | 'date' | 'select';

export type ModalityField = {
  /** Key sent to the edge function as a top-level override. */
  key: string;
  label: string;
  type: ModalityFieldType;
  placeholder?: string;
  /** For type='select'. */
  options?: { value: string; label: string }[];
  /** Min/max for type='number'. */
  min?: number;
  max?: number;
  help?: string;
};

export const MODALITY_INPUT_SCHEMA: Record<Modality, ModalityField[]> = {
  strength: [], // handled by the legacy strength form
  running: [
    {
      key: 'running_target_race_distance',
      label: 'Race distance',
      type: 'select',
      options: [
        { value: 'none', label: 'No race — general' },
        { value: '5k', label: '5K' },
        { value: '10k', label: '10K' },
        { value: 'half', label: 'Half marathon' },
        { value: 'marathon', label: 'Marathon' },
        { value: 'ultra', label: 'Ultra' },
      ],
    },
    { key: 'running_target_race_date', label: 'Race date', type: 'date' },
    {
      key: 'running_current_weekly_km',
      label: 'Current weekly km',
      type: 'number',
      min: 0,
      max: 250,
      placeholder: 'e.g. 35',
    },
    {
      key: 'running_longest_recent_km',
      label: 'Longest recent run (km)',
      type: 'number',
      min: 0,
      max: 100,
      placeholder: 'e.g. 12',
    },
    {
      key: 'running_recent_5k_seconds',
      label: 'Recent 5K time (seconds)',
      type: 'number',
      min: 600,
      max: 3600,
      placeholder: 'e.g. 1500 = 25:00',
      help: 'Optional. Leave blank if unknown.',
    },
    {
      key: 'running_threshold_pace_seconds_per_km',
      label: 'Threshold pace (sec/km)',
      type: 'number',
      min: 180,
      max: 600,
      placeholder: 'e.g. 270 = 4:30/km',
      help: 'Optional. Engine will estimate if blank.',
    },
  ],
  cycling: [
    {
      key: 'cycling_discipline',
      label: 'Discipline',
      type: 'select',
      options: [
        { value: 'road', label: 'Road' },
        { value: 'gravel', label: 'Gravel' },
        { value: 'mtb', label: 'MTB' },
        { value: 'indoor', label: 'Indoor' },
      ],
    },
    {
      key: 'cycling_target_event',
      label: 'Target event',
      type: 'text',
      placeholder: 'e.g. century_ride, gran_fondo',
    },
    { key: 'cycling_target_event_date', label: 'Event date', type: 'date' },
    {
      key: 'cycling_ftp_watts',
      label: 'FTP (watts)',
      type: 'number',
      min: 50,
      max: 600,
      placeholder: 'e.g. 240',
    },
    {
      key: 'cycling_current_weekly_hours',
      label: 'Current weekly hours',
      type: 'number',
      min: 0,
      max: 30,
      placeholder: 'e.g. 5.5',
    },
    {
      key: 'cycling_longest_recent_km',
      label: 'Longest recent ride (km)',
      type: 'number',
      min: 0,
      max: 400,
      placeholder: 'e.g. 60',
    },
  ],
  triathlon: [
    {
      key: 'tri_race_distance',
      label: 'Race distance',
      type: 'select',
      options: [
        { value: 'sprint', label: 'Sprint' },
        { value: 'olympic', label: 'Olympic' },
        { value: '70_3', label: '70.3' },
        { value: 'ironman', label: 'Ironman' },
      ],
    },
    { key: 'tri_target_event_date', label: 'Race date', type: 'date' },
    {
      key: 'tri_swim_css_seconds_per_100m',
      label: 'Swim CSS (sec / 100m)',
      type: 'number',
      min: 60,
      max: 240,
      placeholder: 'e.g. 105',
    },
    {
      key: 'tri_swim_pool_or_open',
      label: 'Swim venue',
      type: 'select',
      options: [
        { value: 'pool', label: 'Pool' },
        { value: 'open', label: 'Open water' },
      ],
    },
    {
      key: 'cycling_ftp_watts',
      label: 'FTP (watts)',
      type: 'number',
      min: 50,
      max: 600,
      placeholder: 'e.g. 240',
    },
    {
      key: 'running_threshold_pace_seconds_per_km',
      label: 'Run threshold pace (sec/km)',
      type: 'number',
      min: 180,
      max: 600,
    },
  ],
  hyrox: [
    {
      key: 'hyrox_target_event_date',
      label: 'Event date',
      type: 'date',
    },
    {
      key: 'hyrox_current_400m_seconds',
      label: 'Current 400m time (seconds)',
      type: 'number',
      min: 60,
      max: 240,
      placeholder: 'e.g. 110',
    },
  ],
  combat: [
    {
      key: 'combat_discipline',
      label: 'Discipline',
      type: 'select',
      options: [
        { value: 'mma', label: 'MMA' },
        { value: 'boxing', label: 'Boxing' },
        { value: 'bjj', label: 'BJJ' },
        { value: 'muay_thai', label: 'Muay Thai' },
        { value: 'wrestling', label: 'Wrestling' },
      ],
    },
    { key: 'combat_fight_date', label: 'Fight date', type: 'date' },
    {
      key: 'combat_weight_class',
      label: 'Weight class',
      type: 'text',
      placeholder: 'e.g. lightweight',
    },
    {
      key: 'combat_weight_cut_target_kg',
      label: 'Weight-cut target (kg)',
      type: 'number',
      min: 40,
      max: 130,
      help: 'Leave blank if no cut.',
    },
  ],
  mobility: [
    {
      key: 'mobility_primary_complaint',
      label: 'Primary complaint',
      type: 'text',
      placeholder: 'e.g. lower_back_tightness',
    },
    {
      key: 'mobility_practice_history',
      label: 'Practice history',
      type: 'select',
      options: [
        { value: 'none', label: 'None' },
        { value: 'some', label: 'Some' },
        { value: 'regular', label: 'Regular' },
      ],
    },
    {
      key: 'mobility_session_minutes',
      label: 'Available minutes / session',
      type: 'number',
      min: 5,
      max: 60,
      placeholder: 'e.g. 15',
    },
  ],
};

export function isModality(value: unknown): value is Modality {
  return typeof value === 'string' && (ALL_MODALITIES as readonly string[]).includes(value);
}
