'use client'

import { useState } from 'react'

interface Exercise {
  name: string
  sets: number
  reps: string
}

interface WorkoutDay {
  dayNumber: number
  name: string
  exercises: Exercise[]
}

const PROGRAM_DATA: Record<number, WorkoutDay[]> = {
  1: [
    {
      dayNumber: 1,
      name: 'Upper Body Push',
      exercises: [
        { name: 'Bench Press', sets: 4, reps: '8' },
        { name: 'Overhead Press', sets: 3, reps: '10' },
        { name: 'Cable Flyes', sets: 3, reps: '12' },
        { name: 'Tricep Dips', sets: 3, reps: '15' },
      ],
    },
    {
      dayNumber: 2,
      name: 'Lower Body',
      exercises: [
        { name: 'Squat', sets: 4, reps: '6' },
        { name: 'Romanian Deadlift', sets: 3, reps: '10' },
        { name: 'Leg Press', sets: 3, reps: '12' },
        { name: 'Calf Raises', sets: 4, reps: '15' },
      ],
    },
    {
      dayNumber: 3,
      name: 'Upper Body Pull',
      exercises: [
        { name: 'Pull-ups', sets: 4, reps: '8' },
        { name: 'Barbell Row', sets: 3, reps: '10' },
        { name: 'Face Pulls', sets: 3, reps: '15' },
        { name: 'Bicep Curls', sets: 3, reps: '12' },
      ],
    },
    {
      dayNumber: 4,
      name: 'Conditioning',
      exercises: [
        { name: 'KB Swings', sets: 4, reps: '15' },
        { name: 'Box Jumps', sets: 3, reps: '8' },
        { name: 'Battle Ropes', sets: 3, reps: '30s' },
        { name: 'Plank', sets: 3, reps: '60s' },
      ],
    },
  ],
  2: [
    {
      dayNumber: 1,
      name: 'Upper Body Push',
      exercises: [
        { name: 'Bench Press', sets: 4, reps: '8' },
        { name: 'Incline Dumbbell Press', sets: 3, reps: '10' },
        { name: 'Pec Deck', sets: 3, reps: '12' },
        { name: 'Rope Tricep Extensions', sets: 3, reps: '15' },
      ],
    },
    {
      dayNumber: 2,
      name: 'Lower Body',
      exercises: [
        { name: 'Squat', sets: 4, reps: '6' },
        { name: 'Leg Curls', sets: 3, reps: '10' },
        { name: 'Hack Squat', sets: 3, reps: '12' },
        { name: 'Leg Extensions', sets: 3, reps: '15' },
      ],
    },
    {
      dayNumber: 3,
      name: 'Upper Body Pull',
      exercises: [
        { name: 'Pull-ups', sets: 4, reps: '8' },
        { name: 'Sealed Row', sets: 3, reps: '10' },
        { name: 'Cable Rows', sets: 3, reps: '12' },
        { name: 'Lat Pulldowns', sets: 3, reps: '12' },
      ],
    },
    {
      dayNumber: 4,
      name: 'Conditioning',
      exercises: [
        { name: 'Assault Bike', sets: 1, reps: '20m' },
        { name: 'Rowing Machine', sets: 1, reps: '15m' },
        { name: 'Jump Rope', sets: 3, reps: '60s' },
        { name: 'Core Work', sets: 3, reps: 'varies' },
      ],
    },
  ],
}

export default function ProgramPage() {
  const [selectedWeek, setSelectedWeek] = useState(1)

  const workoutDays = PROGRAM_DATA[selectedWeek] || PROGRAM_DATA[1]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Fat Loss Foundation</h1>
        <p className="text-gray-600 mt-2">12-week program focused on fat loss with metabolic conditioning</p>
      </div>

      {/* Week Selector */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Week</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(week => (
            <button
              key={week}
              onClick={() => setSelectedWeek(week)}
              className={`px-4 py-2 rounded-full font-medium transition-colors whitespace-nowrap ${
                selectedWeek === week
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Week {week}
            </button>
          ))}
        </div>
      </div>

      {/* Workout Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {workoutDays.map(day => (
          <div key={day.dayNumber} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Day {day.dayNumber}: {day.name}
            </h3>

            <div className="space-y-3">
              {day.exercises.map((exercise, idx) => (
                <div key={idx} className="flex items-start justify-between pb-3 border-b border-gray-200 last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{exercise.name}</p>
                    <p className="text-sm text-gray-600">
                      {exercise.sets} × {exercise.reps}
                    </p>
                  </div>
                  <div className="ml-4 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-semibold">
                    {exercise.sets}×{exercise.reps}
                  </div>
                </div>
              ))}
            </div>

            {/* Start Workout Button */}
            <button className="w-full mt-6 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors">
              Start {day.name} Workout
            </button>
          </div>
        ))}
      </div>

      {/* Program Info */}
      <div className="mt-12 bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 Program Overview</h3>
        <ul className="space-y-2 text-gray-700">
          <li>• <strong>Duration:</strong> 12 weeks</li>
          <li>• <strong>Frequency:</strong> 4 days per week</li>
          <li>• <strong>Goal:</strong> Fat loss while preserving muscle</li>
          <li>• <strong>Structure:</strong> Upper Push, Lower, Upper Pull, Conditioning</li>
          <li>• <strong>Current Week:</strong> Week {selectedWeek} of 8</li>
        </ul>
        <p className="text-sm text-gray-600 mt-4">
          Questions about the program? Message your coach for guidance on exercise modifications or progression.
        </p>
      </div>
    </div>
  )
}
