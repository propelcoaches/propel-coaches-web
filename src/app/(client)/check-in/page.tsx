'use client'

import { useState } from 'react'
import Link from 'next/link'

type FormData = {
  energy: number
  stress: number
  sleepQuality: number
  trainingDifficulty: number
  winsAndStruggles: string
  bodyweight: string
}

const getEmojiForScore = (score: number, category: string) => {
  if (category === 'energy') {
    if (score <= 3) return '😴'
    if (score <= 6) return '😐'
    return '⚡'
  }
  if (category === 'stress') {
    if (score <= 3) return '😌'
    if (score <= 6) return '😟'
    return '😰'
  }
  if (category === 'sleep') {
    if (score <= 3) return '😫'
    if (score <= 6) return '😴'
    return '😴'
  }
  if (category === 'training') {
    if (score <= 3) return '🤔'
    if (score <= 6) return '💪'
    return '🔥'
  }
  return ''
}

export default function CheckInPage() {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    energy: 5,
    stress: 5,
    sleepQuality: 5,
    trainingDifficulty: 5,
    winsAndStruggles: '',
    bodyweight: '88.2',
  })

  const handleSliderChange = (field: keyof FormData, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>, field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }))
  }

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = () => {
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-green-50 rounded-lg p-8 border border-green-200 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Check-in submitted!</h1>
          <p className="text-lg text-gray-600 mb-8">
            Your coach will review your check-in soon and provide feedback.
          </p>
          <Link
            href="/client"
            className="inline-block px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Weekly Check-in</h1>
        <p className="text-gray-600 mt-2">Step {step} of 5</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-teal-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 mb-8">
        {/* Step 1: Energy */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">How's your energy?</h2>
            <p className="text-gray-600 mb-8">Rate your overall energy level from 1 (exhausted) to 10 (energized)</p>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-4xl">{getEmojiForScore(formData.energy, 'energy')}</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.energy}
                  onChange={e => handleSliderChange('energy', parseInt(e.target.value))}
                  className="flex-1 mx-6 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-3xl font-bold text-teal-600 w-12 text-right">{formData.energy}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Stress */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">What's your stress level?</h2>
            <p className="text-gray-600 mb-8">Rate your stress from 1 (relaxed) to 10 (extremely stressed)</p>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-4xl">{getEmojiForScore(formData.stress, 'stress')}</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.stress}
                  onChange={e => handleSliderChange('stress', parseInt(e.target.value))}
                  className="flex-1 mx-6 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-3xl font-bold text-teal-600 w-12 text-right">{formData.stress}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Relaxed</span>
                <span>Stressed</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Sleep Quality */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">How was your sleep?</h2>
            <p className="text-gray-600 mb-8">Rate your sleep quality from 1 (terrible) to 10 (excellent)</p>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-4xl">{getEmojiForScore(formData.sleepQuality, 'sleep')}</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.sleepQuality}
                  onChange={e => handleSliderChange('sleepQuality', parseInt(e.target.value))}
                  className="flex-1 mx-6 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-3xl font-bold text-teal-600 w-12 text-right">{formData.sleepQuality}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Terrible</span>
                <span>Excellent</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Training Difficulty */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">How was training difficulty?</h2>
            <p className="text-gray-600 mb-8">Rate how hard your workouts felt from 1 (easy) to 10 (extremely challenging)</p>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-4xl">{getEmojiForScore(formData.trainingDifficulty, 'training')}</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.trainingDifficulty}
                  onChange={e => handleSliderChange('trainingDifficulty', parseInt(e.target.value))}
                  className="flex-1 mx-6 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-3xl font-bold text-teal-600 w-12 text-right">{formData.trainingDifficulty}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Easy</span>
                <span>Challenging</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Wins, Struggles, and Bodyweight */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Final Details</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Wins & Highlights this week
              </label>
              <textarea
                value={formData.winsAndStruggles}
                onChange={e => handleTextChange(e, 'winsAndStruggles')}
                placeholder="What went well? Any PRs, great workouts, or wins? (optional)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Struggles
              </label>
              <textarea
                value={formData.winsAndStruggles}
                onChange={e => handleTextChange(e, 'winsAndStruggles')}
                placeholder="Any challenges this week? (optional)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Current Bodyweight (kg)
              </label>
              <input
                type="number"
                value={formData.bodyweight}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    bodyweight: e.target.value,
                  }))
                }
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="88.2"
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4">
        <button
          onClick={handleBack}
          disabled={step === 1}
          className={`px-6 py-2 border-2 border-gray-300 font-medium rounded-lg transition-colors ${
            step === 1
              ? 'text-gray-400 cursor-not-allowed bg-gray-50'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          ← Back
        </button>

        {step < 5 ? (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
          >
            Submit Check-in
          </button>
        )}
      </div>
    </div>
  )
}
