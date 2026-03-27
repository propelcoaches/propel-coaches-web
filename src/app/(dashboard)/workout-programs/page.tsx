'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';

// ─── Types ──────────────────────────────────────────────────────────
interface WorkoutProgram {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'archived';
  goal: string;
  experience_level: string;
  days_per_week: number;
  session_duration_minutes: number;
  equipment_available: string[];
  program_length_weeks: number;
  ai_generated: boolean;
  client_id: string;
  created_at: string;
  client?: { full_name: string };
  workout_days?: WorkoutDay[];
}

interface WorkoutDay {
  id: string;
  day_number: number;
  name: string;
  focus: string;
  notes: string;
  estimated_duration_minutes: number;
  workout_exercises: Exercise[];
}

interface Exercise {
  id: string;
  order_index: number;
  name: string;
  muscle_group: string;
  sets: number;
  reps: string;
  rpe: number | null;
  rest_seconds: number;
  tempo: string | null;
  notes: string;
  superset_group: string | null;
  is_warmup: boolean;
}

interface Client {
  id: string;
  full_name: string;
}

// ─── Config ─────────────────────────────────────────────────────────
const GOALS = [
  { value: 'hypertrophy', label: 'Hypertrophy (Muscle Growth)' },
  { value: 'strength', label: 'Strength' },
  { value: 'fat_loss', label: 'Fat Loss' },
  { value: 'athletic_performance', label: 'Athletic Performance' },
  { value: 'general_fitness', label: 'General Fitness' },
];

const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'];

const EQUIPMENT_OPTIONS = [
  'Barbell', 'Dumbbells', 'Cables', 'Machines', 'Kettlebells',
  'Pull-up Bar', 'Resistance Bands', 'Bodyweight Only', 'TRX/Suspension',
  'Medicine Ball', 'Battle Ropes', 'Plyo Box',
];

const SPLITS = [
  { value: 'auto', label: 'Auto (AI chooses best)' },
  { value: 'push_pull_legs', label: 'Push / Pull / Legs' },
  { value: 'upper_lower', label: 'Upper / Lower' },
  { value: 'full_body', label: 'Full Body' },
  { value: 'bro_split', label: 'Body Part Split' },
];

export default function WorkoutProgramsPage() {
  const supabase = createClient();

  const [clients, setClients] = useState<Client[]>([]);
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<WorkoutProgram | null>(null);
  const [activeDay, setActiveDay] = useState(1);

  const [form, setForm] = useState({
    client_id: '',
    title: '',
    goal: 'hypertrophy',
    experience_level: 'intermediate',
    days_per_week: 4,
    session_duration_minutes: 60,
    equipment_available: ['Barbell', 'Dumbbells', 'Cables', 'Machines'],
    injuries_limitations: '',
    preferred_split: 'auto',
    notes: '',
    program_length_weeks: 4,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const [c, p] = await Promise.all([
      supabase.from('profiles').select('id, full_name').eq('coach_id', user?.id ?? '').eq('role', 'client'),
      supabase
        .from('workout_programs')
        .select('*, client:profiles!workout_programs_client_id_fkey(full_name)')
        .order('created_at', { ascending: false }),
    ]);
    if (c.data) setClients(c.data);
    if (p.data) setPrograms(p.data as WorkoutProgram[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleEquipment = (item: string) => {
    setForm((f) => ({
      ...f,
      equipment_available: f.equipment_available.includes(item)
        ? f.equipment_available.filter((e) => e !== item)
        : [...f.equipment_available, item],
    }));
  };

  const handleGenerate = async () => {
    if (!form.client_id) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/workout-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.program) {
        setPrograms((prev) => [data.program, ...prev]);
        setSelectedProgram(data.program);
        setShowGenerator(false);
        setActiveDay(1);
      } else {
        toast.error(data.error || 'Failed to generate program');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setGenerating(false);
    }
  };

  const viewProgram = async (prog: WorkoutProgram) => {
    const { data } = await supabase
      .from('workout_programs')
      .select('*, client:profiles!workout_programs_client_id_fkey(full_name), workout_days(*, workout_exercises(*))')
      .eq('id', prog.id)
      .single();
    if (data) {
      setSelectedProgram(data as WorkoutProgram);
      setActiveDay(1);
    }
  };

  const updateStatus = async (id: string, status: 'active' | 'archived') => {
    await supabase.from('workout_programs').update({ status }).eq('id', id);
    setPrograms((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    if (selectedProgram?.id === id) setSelectedProgram((p) => (p ? { ...p, status } : p));
  };

  // ─── Generator Form ──────────────────────────────────────────────
  if (showGenerator) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Generate AI Workout Program</h1>
          <button onClick={() => setShowGenerator(false)} className="text-gray-500 hover:text-gray-700">Cancel</button>
        </div>

        <div className="space-y-6 bg-white rounded-xl shadow-sm border p-6">
          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} className="w-full border rounded-lg px-3 py-2">
              <option value="">Select a client...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. 12-Week Hypertrophy Block" className="w-full border rounded-lg px-3 py-2" />
          </div>

          {/* Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Training Goal</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {GOALS.map((g) => (
                <button key={g.value} type="button" onClick={() => setForm({ ...form, goal: g.value })}
                  className={`px-3 py-2 rounded-lg border text-sm text-left transition-colors ${form.goal === g.value ? 'bg-indigo-100 border-indigo-400 text-indigo-700' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
            <div className="flex gap-2">
              {EXPERIENCE_LEVELS.map((lvl) => (
                <button key={lvl} type="button" onClick={() => setForm({ ...form, experience_level: lvl })}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${form.experience_level === lvl ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}>
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Days/week + duration + length */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Days/Week</label>
              <div className="flex gap-1">
                {[2, 3, 4, 5, 6].map((n) => (
                  <button key={n} type="button" onClick={() => setForm({ ...form, days_per_week: n })}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${form.days_per_week === n ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Length (min)</label>
              <input type="number" value={form.session_duration_minutes} onChange={(e) => setForm({ ...form, session_duration_minutes: parseInt(e.target.value) || 60 })} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program Length (weeks)</label>
              <input type="number" value={form.program_length_weeks} onChange={(e) => setForm({ ...form, program_length_weeks: parseInt(e.target.value) || 4 })} min={1} max={16} className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>

          {/* Split */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Training Split</label>
            <div className="flex flex-wrap gap-2">
              {SPLITS.map((s) => (
                <button key={s.value} type="button" onClick={() => setForm({ ...form, preferred_split: s.value })}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${form.preferred_split === s.value ? 'bg-indigo-100 border-indigo-400 text-indigo-700' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Available</label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button key={eq} type="button" onClick={() => toggleEquipment(eq)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${form.equipment_available.includes(eq) ? 'bg-indigo-100 border-indigo-400 text-indigo-700' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}>
                  {eq}
                </button>
              ))}
            </div>
          </div>

          {/* Injuries */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Injuries / Limitations</label>
            <textarea value={form.injuries_limitations} onChange={(e) => setForm({ ...form, injuries_limitations: e.target.value })} rows={2} placeholder="e.g. Previous ACL tear (left knee), avoid overhead pressing due to shoulder impingement" className="w-full border rounded-lg px-3 py-2" />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="e.g. Client wants to compete in powerlifting meet in 6 months" className="w-full border rounded-lg px-3 py-2" />
          </div>

          {/* Generate */}
          <button onClick={handleGenerate} disabled={generating || !form.client_id}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {generating ? (
              <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Generating program...</>
            ) : (
              <>🏋️ Generate Workout Program</>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ─── Program Detail ───────────────────────────────────────────────
  if (selectedProgram) {
    const days = (selectedProgram.workout_days || []).sort((a, b) => a.day_number - b.day_number);
    const currentDay = days.find((d) => d.day_number === activeDay);

    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => setSelectedProgram(null)} className="text-indigo-600 hover:text-indigo-700 text-sm mb-1">← Back to programs</button>
            <h1 className="text-2xl font-bold text-gray-900">{selectedProgram.title}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {selectedProgram.goal.replace('_', ' ')} · {selectedProgram.days_per_week} days/week · {selectedProgram.program_length_weeks} weeks
              {selectedProgram.client && ` · ${selectedProgram.client.full_name}`}
              {selectedProgram.ai_generated && ' · AI Generated'}
            </p>
            {selectedProgram.description && <p className="text-gray-600 text-sm mt-2">{selectedProgram.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              selectedProgram.status === 'active' ? 'bg-green-100 text-green-700' :
              selectedProgram.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-600'
            }`}>{selectedProgram.status}</span>
            {selectedProgram.status === 'draft' && (
              <button onClick={() => updateStatus(selectedProgram.id, 'active')} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                Assign to Client
              </button>
            )}
          </div>
        </div>

        {/* Day tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {days.map((day) => (
            <button key={day.day_number} onClick={() => setActiveDay(day.day_number)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeDay === day.day_number ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              Day {day.day_number}: {day.name}
            </button>
          ))}
        </div>

        {currentDay ? (
          <div>
            <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{currentDay.name}</h2>
                  <p className="text-sm text-gray-500">Focus: {currentDay.focus} · ~{currentDay.estimated_duration_minutes} min</p>
                </div>
              </div>
              {currentDay.notes && <p className="text-sm text-gray-600 mt-2 bg-amber-50 rounded-lg px-3 py-2">{currentDay.notes}</p>}
            </div>

            {/* Exercise table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">#</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Exercise</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Muscle</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">Sets</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">Reps</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">RPE</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">Rest</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDay.workout_exercises
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((ex, i) => (
                      <tr key={ex.id} className={`border-b last:border-0 ${ex.is_warmup ? 'bg-blue-50/50' : ''}`}>
                        <td className="px-4 py-3 text-gray-400">
                          {ex.superset_group ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold">
                              {ex.superset_group}
                            </span>
                          ) : (
                            i + 1
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {ex.name}
                          {ex.is_warmup && <span className="ml-2 text-xs text-blue-500 font-normal">(warm-up)</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-500 capitalize">{ex.muscle_group}</td>
                        <td className="px-4 py-3 text-center text-gray-900 font-medium">{ex.sets}</td>
                        <td className="px-4 py-3 text-center text-gray-900">{ex.reps}</td>
                        <td className="px-4 py-3 text-center text-gray-500">{ex.rpe ?? '—'}</td>
                        <td className="px-4 py-3 text-center text-gray-500">{ex.rest_seconds}s</td>
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-48 truncate">{ex.notes || '—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-12">Select a day to view exercises.</p>
        )}
      </div>
    );
  }

  // ─── Programs List ────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workout Programs</h1>
          <p className="text-gray-500 text-sm mt-1">AI-generated training programs for your clients</p>
        </div>
        <button onClick={() => setShowGenerator(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2">
          🏋️ Generate New Program
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : programs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <div className="text-4xl mb-3">💪</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No programs yet</h3>
          <p className="text-gray-500 mb-4">Generate your first AI workout program for a client.</p>
          <button onClick={() => setShowGenerator(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">Get Started</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {programs.map((prog) => (
            <div key={prog.id} onClick={() => viewProgram(prog)}
              className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{prog.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    prog.status === 'active' ? 'bg-green-100 text-green-700' :
                    prog.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{prog.status}</span>
                  {prog.ai_generated && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">AI</span>}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {prog.client?.full_name || 'Unknown'} · {prog.goal.replace('_', ' ')} · {prog.days_per_week} days/wk · {prog.program_length_weeks} weeks
                </p>
              </div>
              <div className="text-sm text-gray-400">{new Date(prog.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
