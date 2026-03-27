'use client'

import { useEffect, useState } from 'react'
import { subscribe, getToasts } from '@/lib/toast'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

type ToastItem = { id: string; message: string; type: 'success' | 'error' | 'info' }

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const COLORS = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const ICON_COLORS = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
}

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>(getToasts)

  useEffect(() => {
    const unsub = subscribe(setToasts)
    return () => { unsub() }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((t) => {
        const Icon = ICONS[t.type]
        return (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium pointer-events-auto max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-200 ${COLORS[t.type]}`}
          >
            <Icon size={16} className={`flex-shrink-0 ${ICON_COLORS[t.type]}`} />
            <span className="flex-1">{t.message}</span>
          </div>
        )
      })}
    </div>
  )
}
