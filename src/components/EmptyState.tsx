import React from 'react'
import Link from 'next/link'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  actionHref?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="bg-surface border border-cb-border rounded-xl shadow-sm p-12 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand/8 flex items-center justify-center text-brand/60 mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-cb-text mb-2">{title}</h3>
      <p className="text-sm text-cb-muted max-w-md mb-6">{description}</p>
      {actionLabel && (
        actionHref ? (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-lg text-sm font-medium hover:opacity-90 transition"
          >
            {actionLabel}
          </Link>
        ) : onAction ? (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-lg text-sm font-medium hover:opacity-90 transition"
          >
            {actionLabel}
          </button>
        ) : null
      )}
    </div>
  )
}
