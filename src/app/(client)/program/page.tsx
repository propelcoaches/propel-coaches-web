'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dumbbell, Loader2, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Exercise {
  id: string
  name: string
  sets: number
  reps_min: number
  reps_max: number
  rep_range: string
  weight: number | null
  weight_unit: string
  notes: string | null
}

interface WorkoutSession {
  id: string
  week_number: number
  day_number: number
  name: string
  notes: string | null
  exercises: Exercise[]
}

interface ActiveProgram {
  id: string
  name: string
  description: string | null
  goal: string
  difficulty: string
  duration_weeks: number
  days_per_week: number
  started_at: string | null
  workouts: WorkoutSession[]
}

const GOAL_LABELS: Record<string, string> = {
  strength: 'Strength',
  hypertrophy: 'Hypertrophy',
  fat_loss: 'Fat Loss',
  endurance: 'Endurance',
  general_fitness: 'General Fitness',
}

function currentProgramWeek(program: ActiveProgram): number {
  if (!program.started_at) return 1
  const elapsed = Math.floor(
    (Date.now() - new Date(program.started_at).getTime()) / (7 * 24 * 60 * 60 * 1000)
  )
  return Math.min(elapsed + 1, program.duration_weeks)
}

export default function ProgramPage() {
  const [program, setProgram] = useState<ActiveProgram | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState(1)

  const load = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const res = await fetch(`/api/clients/${user.id}/programs/active`)
      const d = await res.json()
      if (d.program) {
        setProgram(d.program)
        setSelectedWeek(currentProgramWeek(d.program))
      }
    } catch {
      // no program
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="text-brand animate-spin" />
      </div>
    )
  }

  if (!program) {
    return (
      <div className="flex flex-col items-center justify-center h-64 px-6 text-center gap-4">
        <Dumbbell size={48} className="text-gray-300" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">No Active Program</h2>
          <p className="text-sm text-gray-500 mt-1">Your coach hasn't assigned a training program yet. Check back soon!</p>
        </div>
      </div>
    )
  }

  const weeks = Array.from({ length: program.duration_weeks }, (_, i) => i + 1)
  const workoutsThisWeek = program.workouts.filter((w) => w.week_number === selectedWeek)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{program.name}</h1>
        {program.description && (
          <p className="text-gray-600 mt-2">{program.description}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          {program.goal && (
            <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium border border-teal-200">
              {GOAL_LABELS[program.goal] ?? program.goal}
            </span>
          )}
          {program.difficulty && (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
              {program.difficulty}
            </span>
          )}
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            {program.duration_weeks} weeks · {program.days_per_week}×/week
          </span>
        </div>
      </div>

      {/* Week Selector */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Week</h2>
        <div className="flex gap-2 flex-wrap">
          {weeks.map((week) => (
            <button
              key={week}
              onClick={() => setSelectedWeek(week)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                selectedWeek === week
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Week {week}
            </button>
          ))}
        </div>
      </div>

      {/* Workout Days */}
      {workoutsThisWeek.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No workouts scheduled for week {selectedWeek}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workoutsThisWeek
            .sort((a, b) => a.day_number - b.day_number)
            .map((session) => (
              <div key={session.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Day {session.day_number}: {session.name}
                </h3>
                {session.notes && (
                  <p className="text-xs text-gray-500 mb-4">{session.notes}</p>
                )}

                <div className="space-y-3 mb-6">
                  {session.exercises.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No exercises added yet.</p>
                  ) : (
                    session.exercises
                      .sort((a, b) => (a as any).order_index - (b as any).order_index)
                      .map((ex, idx) => (
                        <div
                          key={ex.id}
                          className="flex items-center justify-between pb-3 border-b border-gray-200 last:border-b-0"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{ex.name}</p>
                            <p className="text-xs text-gray-500">
                              {ex.sets} sets ·{' '}
                              {ex.rep_range || `${ex.reps_min}${ex.reps_max !== ex.reps_min ? `–${ex.reps_max}` : ''}`} reps
                              {ex.weight ? ` · ${ex.weight}${ex.weight_unit}` : ''}
                            </p>
                          </div>
                          <span className="ml-3 px-2.5 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-semibold flex-shrink-0">
                            {ex.sets}×{ex.rep_range || ex.reps_min}
                          </span>
                        </div>
                      ))
                  )}
                </div>

                <Link
                  href="/my-workout"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors text-sm"
                >
                  <Dumbbell size={15} />
                  Start {session.name}
                </Link>
              </div>
            ))}
        </div>
      )}

      {/* Program Overview footer */}
      <div className="mt-12 bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Program Overview</h3>
        <ul className="space-y-1.5 text-sm text-gray-700">
          <li><strong>Duration:</strong> {program.duration_weeks} weeks</li>
          <li><strong>Frequency:</strong> {program.days_per_week} days per week</li>
          {program.goal && <li><strong>Goal:</strong> {GOAL_LABELS[program.goal] ?? program.goal}</li>}
          <li><strong>Current Week:</strong> Week {selectedWeek} of {program.duration_weeks}</li>
        </ul>
        <p className="text-xs text-gray-500 mt-4">
          Questions about the program? Message your coach for guidance on exercise modifications or progression.
        </p>
      </div>
    </div>
  )
}
