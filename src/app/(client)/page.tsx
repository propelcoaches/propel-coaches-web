'use client'

import Link from 'next/link'
import { useIsDemo } from '@/lib/demo/useDemoMode'
import { DEMO_WEIGHT_LOGS, DEMO_CHECK_INS } from '@/lib/demo/mockData'
import { useEffect, useState } from 'react'

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const formatDate = (date: Date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`
}

export default function ClientHome() {
  const isDemo = useIsDemo()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Get weight logs for Liam Carter (demo-client-1)
  const liamWeights = DEMO_WEIGHT_LOGS.filter(w => w.client_id === 'demo-client-1')
  const last4Weights = liamWeights.slice(-4)
  const currentWeight = liamWeights[liamWeights.length - 1]?.weight_kg || 88.2
  const previousWeight = liamWeights.length > 1 ? liamWeights[liamWeights.length - 2]?.weight_kg : 88.5
  const weightChange = currentWeight - previousWeight

  // Get recent check-ins for Liam
  const liamCheckIns = DEMO_CHECK_INS.filter(c => c.client_id === 'demo-client-1')
  const recentCheckIns = liamCheckIns.slice(-3).reverse()

  const today = new Date()
  const nextSunday = new Date(today)
  nextSunday.setDate(today.getDate() + (7 - today.getDay()))

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Greeting */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          {getGreeting()}, Liam 👋
        </h1>
        <p className="text-gray-600 mt-2">{formatDate(today)}</p>
      </div>

      {/* This Week Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">This Week</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Today's Workout Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-blue-600">Today's Workout</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">Upper Body Push</p>
                <p className="text-sm text-gray-600 mt-1">5 exercises</p>
              </div>
              <div className="text-2xl">💪</div>
            </div>
            <Link
              href="/client/my-workout"
              className="inline-block mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Start Workout →
            </Link>
          </div>

          {/* Weekly Check-in Card */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-6 border border-amber-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-amber-600">Weekly Check-in</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">Status</p>
                <p className="text-sm text-gray-600 mt-1">Due {nextSunday.toLocaleDateString('en-US', { weekday: 'short' })}</p>
              </div>
              <div className="text-2xl">📋</div>
            </div>
            <Link
              href="/client/check-in"
              className="inline-block mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Complete Now →
            </Link>
          </div>

          {/* Nutrition Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-green-600">Nutrition</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">1,450 / 2,100 kcal</p>
                <p className="text-sm text-gray-600 mt-1">69% complete</p>
              </div>
              <div className="text-2xl">🍎</div>
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '69%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* My Progress Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">My Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Weight Graph */}
          <div className="md:col-span-2 bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weight Trend (Last 4 weeks)</h3>
            <div className="flex items-end justify-between h-40 gap-2">
              {last4Weights.map((log, idx) => {
                const minWeight = Math.min(...last4Weights.map(w => w.weight_kg))
                const maxWeight = Math.max(...last4Weights.map(w => w.weight_kg))
                const range = maxWeight - minWeight || 1
                const height = ((log.weight_kg - minWeight) / range) * 100
                const date = new Date(log.date)
                return (
                  <div key={log.id} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-teal-600 rounded-t-lg transition-all"
                      style={{ height: `${Math.max(20, height)}%` }}
                    />
                    <div className="mt-2 text-xs text-gray-600">
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-xs font-semibold text-gray-900">
                      {log.weight_kg}kg
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Current Weight Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <p className="text-sm font-medium text-purple-600">Current Weight</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{currentWeight} kg</p>
            <p className={`text-sm font-medium mt-2 ${weightChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
              {weightChange < 0 ? '↓' : '↑'} {Math.abs(weightChange).toFixed(1)} kg this week
            </p>
            <p className="text-xs text-gray-500 mt-4">Target: 82 kg</p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${(currentWeight / 82) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {recentCheckIns.map((checkIn) => {
            const date = new Date(checkIn.date)
            const formattedDate = date.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })
            return (
              <div key={checkIn.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-start gap-4">
                <div className="text-2xl">✅</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Check-in submitted</p>
                  <p className="text-sm text-gray-600">
                    Energy: {checkIn.energy}/10 • Sleep: {checkIn.sleep_quality}/10
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{formattedDate}</p>
                </div>
              </div>
            )
          })}

          {/* Sample PB and Program Updated items */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-start gap-4">
            <div className="text-2xl">🏆</div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Personal best hit!</p>
              <p className="text-sm text-gray-600">Bench Press: 100 kg × 5 reps</p>
              <p className="text-xs text-gray-500 mt-1">Mar 15</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-start gap-4">
            <div className="text-2xl">📅</div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Program updated</p>
              <p className="text-sm text-gray-600">Your Fat Loss Foundation program has been progressed to Week 4</p>
              <p className="text-xs text-gray-500 mt-1">Mar 10</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coach Card */}
      <div className="bg-gradient-to-r from-teal-50 to-teal-100 rounded-lg p-6 border border-teal-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-teal-600">Your Coach</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">Coach Sarah</p>
            <p className="text-sm text-gray-600 mt-1">
              Need help? Message your coach for personalized guidance and support.
            </p>
          </div>
          <div className="text-4xl">👋</div>
        </div>
        <Link
          href="#"
          className="inline-block mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Message your coach →
        </Link>
      </div>
    </div>
  )
}
