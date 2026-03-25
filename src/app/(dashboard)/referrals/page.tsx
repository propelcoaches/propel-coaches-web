'use client'
import React, { useState } from 'react'
import { Users, Gift, Copy, Share2, TrendingUp, CheckCircle, Clock, DollarSign } from 'lucide-react'

const DEMO_REFERRALS = [
  { email: 'jessica@fitlife.com', name: 'Jessica Park', status: 'converted', signedUp: '2026-03-01', converted: '2026-03-15', reward: '$20 credit' },
  { email: 'david@coachd.com', name: 'David Kim', status: 'signed_up', signedUp: '2026-03-10', converted: null, reward: 'Pending' },
  { email: 'lisa@trainingwith.com', name: 'Lisa Chen', status: 'pending', signedUp: null, converted: null, reward: 'Pending' },
  { email: 'ryan@ryanfit.io', name: 'Ryan Torres', status: 'converted', signedUp: '2026-02-20', converted: '2026-03-05', reward: '$20 credit' },
]

const MY_CODE = 'PROPEL-CHARLES-K8X2'
const REFERRAL_URL = `https://propelcoach.app/trial/setup?ref=${MY_CODE}`

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(REFERRAL_URL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const converted = DEMO_REFERRALS.filter(r => r.status === 'converted').length
  const signedUp = DEMO_REFERRALS.filter(r => r.status === 'signed_up').length
  const totalCredits = converted * 20

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Referral Program</h1>
        <p className="text-gray-500 mt-1">Earn $20 credit for every coach you refer who upgrades to a paid plan.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Referred', value: DEMO_REFERRALS.length, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Signed Up', value: signedUp, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Converted', value: converted, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Credits Earned', value: `$${totalCredits}`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Referral Link Card */}
      <div className="bg-gradient-to-br from-purple-600 to-violet-700 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Gift className="w-5 h-5" />
          <span className="font-semibold text-lg">Your Referral Link</span>
        </div>
        <p className="text-purple-200 text-sm mb-4">Share this link — your friends get 20% off their first month too!</p>
        <div className="bg-white/10 rounded-xl p-3 flex items-center gap-3 mb-4">
          <span className="text-sm font-mono flex-1 truncate">{REFERRAL_URL}</span>
          <button
            onClick={handleCopy}
            className="bg-white text-purple-700 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-1"
          >
            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-purple-200 text-sm">Your code:</span>
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-mono font-bold">{MY_CODE}</span>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">How it works</h2>
        <div className="flex flex-col md:flex-row gap-4">
          {[
            { step: '1', title: 'Share your link', desc: 'Send your referral link to another fitness coach' },
            { step: '2', title: 'They sign up', desc: 'They get a 14-day trial + 20% off their first month' },
            { step: '3', title: 'You get paid', desc: 'Once they upgrade, you get $20 credit on your next bill' },
          ].map(s => (
            <div key={s.step} className="flex-1 flex gap-3">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{s.step}</div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">{s.title}</div>
                <div className="text-gray-500 text-sm mt-0.5">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referrals Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Your Referrals</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Coach</th>
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Signed Up</th>
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Reward</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {DEMO_REFERRALS.map(r => (
              <tr key={r.email} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 text-sm">{r.name}</div>
                  <div className="text-gray-400 text-xs">{r.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.status === 'converted' ? 'bg-green-100 text-green-700' :
                    r.status === 'signed_up' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {r.status === 'converted' ? '✓ Converted' : r.status === 'signed_up' ? '⏳ Trial' : '📧 Invited'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{r.signedUp || '—'}</td>
                <td className="px-6 py-4 text-sm font-medium text-purple-600">{r.reward}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
