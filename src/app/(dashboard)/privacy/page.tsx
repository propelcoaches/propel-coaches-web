'use client'
import React, { useState } from 'react'
import { Shield, Download, Trash2, Eye, Lock, CheckCircle, AlertTriangle } from 'lucide-react'

export default function PrivacyPage() {
  const [exportRequested, setExportRequested] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteTyped, setDeleteTyped] = useState('')

  const handleExport = () => {
    // In production: trigger background job, email zip to coach
    setExportRequested(true)
    setTimeout(() => setExportRequested(false), 5000)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Privacy & Data</h1>
          <p className="text-gray-500 text-sm">Manage your data and privacy settings</p>
        </div>
      </div>

      {/* Data Rights Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {[
          { icon: Eye, title: 'Right to Access', desc: 'Download all your data in a portable format', color: 'blue' },
          { icon: Lock, title: 'Right to Restrict', desc: 'Opt out of analytics and tracking', color: 'purple' },
          { icon: Trash2, title: 'Right to Erasure', desc: 'Delete your account and all associated data', color: 'red' },
        ].map(right => (
          <div key={right.title} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 bg-${right.color}-50 rounded-lg flex items-center justify-center mb-3`}>
              <right.icon className={`w-5 h-5 text-${right.color}-600`} />
            </div>
            <div className="font-semibold text-gray-900 text-sm mb-1">{right.title}</div>
            <div className="text-gray-500 text-xs">{right.desc}</div>
          </div>
        ))}
      </div>

      {/* Data Export */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-600" /> Export Your Data
            </h2>
            <p className="text-gray-500 text-sm mb-1">Get a complete copy of all your Propel data including:</p>
            <ul className="text-gray-500 text-sm space-y-0.5 list-disc list-inside">
              <li>Client profiles and check-ins</li>
              <li>Workout programs and sessions</li>
              <li>Nutrition logs and targets</li>
              <li>Messages and notes</li>
              <li>Billing history</li>
            </ul>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exportRequested}
          className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {exportRequested ? (
            <><CheckCircle className="w-4 h-4" /> Export requested — you'll receive an email within 24 hours</>
          ) : (
            <><Download className="w-4 h-4" /> Request Data Export</>
          )}
        </button>
      </div>

      {/* Analytics Opt-out */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-purple-600" /> Analytics & Tracking
        </h2>
        <div className="space-y-3">
          {[
            { label: 'Product analytics (PostHog)', desc: 'Helps us improve Propel based on how features are used', defaultOn: true },
            { label: 'Error reporting (Sentry)', desc: 'Automatically reports crashes and errors to our team', defaultOn: true },
            { label: 'Marketing emails', desc: 'Product updates, tips, and promotional content', defaultOn: true },
          ].map(item => (
            <ToggleRow key={item.label} label={item.label} desc={item.desc} defaultOn={item.defaultOn} />
          ))}
        </div>
      </div>

      {/* Data Retention */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
        <h2 className="font-semibold text-gray-900 mb-3">Data Retention Policy</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• Active client data: retained while your subscription is active</p>
          <p>• After cancellation: data archived for 90 days, then permanently deleted</p>
          <p>• Billing records: retained for 7 years for legal compliance</p>
          <p>• Backup copies: deleted within 30 days of your data deletion request</p>
        </div>
      </div>

      {/* Delete Account */}
      <div className="bg-red-50 rounded-xl p-6 border border-red-100">
        <h2 className="font-semibold text-red-900 mb-1 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Delete Account
        </h2>
        <p className="text-red-700 text-sm mb-4">Permanently delete your account and all associated data. This action cannot be undone. All clients will lose access to their data.</p>
        {!deleteConfirm ? (
          <button onClick={() => setDeleteConfirm(true)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Delete My Account
          </button>
        ) : (
          <div>
            <p className="text-red-700 text-sm mb-2 font-medium">Type <strong>DELETE MY ACCOUNT</strong> to confirm:</p>
            <input
              value={deleteTyped}
              onChange={e => setDeleteTyped(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex gap-2">
              <button
                disabled={deleteTyped !== 'DELETE MY ACCOUNT'}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                onClick={() => alert('In production: this would trigger account deletion workflow')}
              >
                Confirm Delete
              </button>
              <button onClick={() => { setDeleteConfirm(false); setDeleteTyped('') }} className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ToggleRow({ label, desc, defaultOn }: { label: string; desc: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-gray-900">{label}</div>
        <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors ${on ? 'bg-purple-600' : 'bg-gray-200'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}
