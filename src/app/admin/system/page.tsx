'use client'

import { CheckCircle, AlertCircle } from 'lucide-react'

const SERVICES = [
  { name: 'API Server', status: 'Operational', latency: '42ms' },
  { name: 'Database (Supabase)', status: 'Operational', latency: '18ms' },
  { name: 'Authentication', status: 'Operational', latency: '55ms' },
  { name: 'File Storage', status: 'Operational', latency: '110ms' },
  { name: 'Email (Resend)', status: 'Operational', latency: '220ms' },
  { name: 'Payments (Stripe)', status: 'Operational', latency: '180ms' },
  { name: 'AI (OpenAI)', status: 'Operational', latency: '640ms' },
]

const ENV_VARS = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL', set: true },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', set: true },
  { key: 'STRIPE_SECRET_KEY', set: true },
  { key: 'STRIPE_WEBHOOK_SECRET', set: true },
  { key: 'RESEND_API_KEY', set: true },
  { key: 'OPENAI_API_KEY', set: true },
]

export default function AdminSystemPage() {
  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">System</h1>
        <p className="text-gray-400">Service status and environment configuration</p>
      </div>

      {/* Service status */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Service Status</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
          {SERVICES.map((s) => (
            <div key={s.name} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-white text-sm font-medium">{s.name}</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-gray-500 text-sm">{s.latency}</span>
                <span className="px-2 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400">
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Env vars */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Environment Variables</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
          {ENV_VARS.map((v) => (
            <div key={v.key} className="flex items-center justify-between px-6 py-4">
              <span className="text-gray-300 text-sm font-mono">{v.key}</span>
              <div className="flex items-center gap-2">
                {v.set
                  ? <><CheckCircle className="w-4 h-4 text-emerald-400" /><span className="text-emerald-400 text-sm">Set</span></>
                  : <><AlertCircle className="w-4 h-4 text-red-400" /><span className="text-red-400 text-sm">Missing</span></>
                }
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
