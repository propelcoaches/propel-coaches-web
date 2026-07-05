'use client';

/**
 * Coach-side program detail page.
 *
 * Read-only view of a single workout program with full multi-modality
 * awareness — modality badge, race-date display, "Why this plan" rationale
 * panel powered by engine_metadata.evidence, and the day-by-day exercise
 * breakdown. Used as the deep link from the client detail page's program
 * list and from the AI Generator's "view program" link after dispatch.
 *
 * Editing happens in the existing program builder; this page is the
 * read/audit surface.
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronUp, Calendar, Clock, Dumbbell, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { MODALITY_ICON, MODALITY_LABEL, isModality, type Modality } from '@/lib/modalities';
import type { EngineMetadata } from '@/lib/types';

type Program = {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  status: string;
  goal: string;
  experience_level: string | null;
  days_per_week: number;
  session_duration_minutes: number | null;
  program_length_weeks: number | null;
  modality: Modality;
  race_date: string | null;
  engine_metadata: EngineMetadata | null;
  created_at: string;
  notes: string | null;
};

type WorkoutDay = {
  id: string;
  name: string;
  day_number: number;
  focus: string | null;
  estimated_duration_minutes: number | null;
  day_type: string | null;
  day_type_a0: string | null;
  target_distance_km: number | null;
  target_duration_minutes: number | null;
  target_pace_seconds_per_km: number | null;
  target_power_watts: number | null;
  target_zone: string | null;
};

type Exercise = {
  id: string;
  workout_day_id: string;
  exercise_name: string;
  muscle_group: string;
  sets: number;
  reps: string;
  rpe: number | null;
  rest_seconds: number;
  tempo: string | null;
  notes: string | null;
  sort_order: number;
};

type ClientProfile = { full_name: string | null; email: string | null };

const STATUS_BADGE: Record<string, string> = {
  active:   'bg-emerald-100 text-emerald-700 ring-emerald-200',
  paused:   'bg-amber-100 text-amber-700 ring-amber-200',
  draft:    'bg-slate-100 text-slate-600 ring-slate-200',
  archived: 'bg-zinc-100 text-zinc-500 ring-zinc-200',
};

export default function ProgramDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const programId = params.id;

  const [program, setProgram] = useState<Program | null>(null);
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [exercisesByDay, setExercisesByDay] = useState<Record<string, Exercise[]>>({});
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showRationale, setShowRationale] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!programId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: progRow, error: progErr } = await supabase
          .from('workout_programs')
          .select('*')
          .eq('id', programId)
          .single();
        if (progErr || !progRow) throw new Error(progErr?.message ?? 'Program not found');

        const modality: Modality = isModality(progRow.modality) ? progRow.modality : 'strength';
        if (!cancelled) {
          setProgram({ ...progRow, modality } as Program);
          if (progRow.days_per_week === 0 || progRow.days_per_week == null) setDays([]);
        }

        const [daysRes, clientRes] = await Promise.all([
          supabase
            .from('workout_days')
            .select('*')
            .eq('program_id', progRow.id)
            .order('day_number', { ascending: true }),
          supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', progRow.client_id)
            .maybeSingle(),
        ]);

        if (cancelled) return;
        const dayRows = (daysRes.data ?? []) as WorkoutDay[];
        setDays(dayRows);
        setClient((clientRes.data ?? null) as ClientProfile | null);
        if (dayRows.length > 0) setExpanded(new Set([dayRows[0].id]));

        if (dayRows.length > 0) {
          const dayIds = dayRows.map((d) => d.id);
          const { data: exRows } = await supabase
            .from('workout_exercises')
            .select('*')
            .in('workout_day_id', dayIds)
            .order('sort_order', { ascending: true });
          if (cancelled) return;
          const byDay: Record<string, Exercise[]> = {};
          for (const ex of (exRows ?? []) as Exercise[]) {
            (byDay[ex.workout_day_id] ??= []).push(ex);
          }
          setExercisesByDay(byDay);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load program');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [programId, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error ?? 'Program not found.'}
        </p>
      </div>
    );
  }

  const Icon = MODALITY_ICON[program.modality];
  const evidence = program.engine_metadata?.evidence ?? null;
  const inputsSnapshot = program.engine_metadata?.inputs_snapshot ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="mb-3 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700 ring-1 ring-emerald-100">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{program.title}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span className="font-medium">{MODALITY_LABEL[program.modality]}</span>
                <span aria-hidden>·</span>
                <span>{program.goal.replace(/_/g, ' ')}</span>
                {client?.full_name && (
                  <>
                    <span aria-hidden>·</span>
                    <Link
                      href={`/clients/${program.client_id}`}
                      className="text-emerald-700 hover:underline"
                    >
                      {client.full_name}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${STATUS_BADGE[program.status] ?? STATUS_BADGE.draft}`}
          >
            {program.status}
          </span>
        </div>

        {program.description && (
          <p className="mt-4 text-sm leading-relaxed text-slate-700">{program.description}</p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={<Calendar className="h-4 w-4" />} label="Days / week" value={`${program.days_per_week}`} />
          <Stat icon={<Clock className="h-4 w-4" />} label="Length" value={`${program.program_length_weeks ?? '—'} wk`} />
          <Stat icon={<Dumbbell className="h-4 w-4" />} label="Experience" value={program.experience_level ?? '—'} />
          {program.race_date && (
            <Stat icon={<Calendar className="h-4 w-4" />} label="Race date" value={new Date(program.race_date).toLocaleDateString()} />
          )}
        </div>
      </div>

      {/* Why this plan */}
      {(evidence || inputsSnapshot) && (
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
          <button
            type="button"
            className="flex w-full items-center justify-between text-left"
            onClick={() => setShowRationale((v) => !v)}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Why this plan</h2>
            {showRationale ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          {showRationale && (
            <div className="mt-4 space-y-4 text-sm text-slate-700">
              {evidence?.methodology && evidence.methodology.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900">Methodology</h3>
                  <ul className="mt-1 list-inside list-disc space-y-1">
                    {evidence.methodology.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
              )}
              {evidence?.safety_adjustments && evidence.safety_adjustments.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900">Safety adjustments applied</h3>
                  <ul className="mt-1 space-y-2">
                    {evidence.safety_adjustments.map((s: any, i: number) => (
                      <li key={i} className="rounded-lg bg-amber-50 p-2 ring-1 ring-amber-100">
                        {typeof s === 'string' ? (
                          <span>{s}</span>
                        ) : (
                          <>
                            <div className="text-xs font-semibold uppercase tracking-wide text-amber-800">{s.trigger}</div>
                            <div className="mt-0.5 text-amber-900">{s.adjustment}</div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {inputsSnapshot && Object.keys(inputsSnapshot).length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900">Inputs the engine used</h3>
                  <dl className="mt-1 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                    {Object.entries(inputsSnapshot).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2 border-b border-slate-100 py-1">
                        <dt className="text-slate-500">{k.replace(/_/g, ' ')}</dt>
                        <dd className="font-medium text-slate-700">{formatValue(v)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Day-by-day */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <h2 className="border-b border-slate-200 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
          Day by day
        </h2>
        {days.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">No workout days on this program yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {days.map((day) => {
              const open = expanded.has(day.id);
              const exs = exercisesByDay[day.id] ?? [];
              return (
                <li key={day.id} className="px-5 py-3">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left"
                    onClick={() =>
                      setExpanded((prev) => {
                        const next = new Set(prev);
                        if (next.has(day.id)) next.delete(day.id);
                        else next.add(day.id);
                        return next;
                      })
                    }
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">Day {day.day_number} · {day.name}</span>
                        {day.day_type_a0 && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                            {day.day_type_a0}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {[
                          day.focus,
                          day.estimated_duration_minutes ? `${day.estimated_duration_minutes} min` : null,
                          day.target_distance_km ? `${day.target_distance_km} km` : null,
                          day.target_zone,
                          day.target_power_watts ? `${day.target_power_watts} W` : null,
                          `${exs.length} exercises`,
                        ].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </button>
                  {open && (
                    <ul className="mt-3 space-y-2 pl-1">
                      {exs.length === 0 ? (
                        <li className="text-sm italic text-slate-500">No exercises on this day.</li>
                      ) : (
                        exs.map((ex) => (
                          <li
                            key={ex.id}
                            className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                          >
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{ex.exercise_name}</div>
                              <div className="text-xs text-slate-500">
                                {[
                                  `${ex.sets} × ${ex.reps}`,
                                  ex.rpe ? `RPE ${ex.rpe}` : null,
                                  ex.rest_seconds ? `${ex.rest_seconds}s rest` : null,
                                  ex.tempo,
                                  ex.muscle_group,
                                ].filter(Boolean).join(' · ')}
                              </div>
                              {ex.notes && <div className="mt-1 text-xs text-slate-500">{ex.notes}</div>}
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function formatValue(v: unknown): string {
  if (v == null) return '—';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
  try { return JSON.stringify(v); } catch { return '[…]'; }
}
