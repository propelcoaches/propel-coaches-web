'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'
import { format } from 'date-fns'
import { Bot, ChevronDown, ChevronUp, Pause, Play, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react'
import clsx from 'clsx'

type AIReview = {
  id: string
  user_id: string
  client_name: string | null
  client_email: string | null
  ai_adjustments_paused: boolean
  input_summary: string | null
  output_action: string | null
  tokens_used: number | null
  latency_ms: number | null
  error: string | null
  created_at: string
}

type AIClientStats = {
  total: number
  active: number
  avgTokensPerReview: number
}

function parseInputSummary(summary: string | null): Record<string, string> {
  const result: Record<string, string> = {}
  if (!summary) return result
  for (const part of summary.split(' | ')) {
    const [key, val] = part.split(':')
    if (key && val !== undefined) result[key.trim()] = val.trim()
  }
  return result
}

function AdjustmentBadge({ text }: { text: string }) {
  const isNoChange = text.toLowerCase().includes('no adjustment') || text.toLowerCase().includes('no change')
  const isDeload = text.toLowerCase().includes('deload')
  const isPaused = text.toLowerCase().includes('paused')
  const isInjury = text.toLowerCase().includes('injury')
  const isRebuild = text.toLowerCase().includes('rebuild')

  const cls = isNoChange || isPaused
    ? 'bg-cb-surface text-cb-muted'
    : isInjury
    ? 'bg-cb-danger/10 text-cb-danger'
    : isDeload
    ? 'bg-cb-warning/10 text-cb-warning'
    : isRebuild
    ? 'bg-brand/10 text-brand'
    : 'bg-cb-success/10 text-cb-success'

  return (
    <span className={clsx('inline-block px-2 py-0.5 rounded text-xs font-medium', cls)}>
      {text}
    </span>
  )
}

export default function AIReviewsPage() {
  const [reviews, setReviews] = useState<AIReview[]>([])
  const [stats, setStats] = useState<AIClientStats>({ total: 0, active: 0, avgTokensPerReview: 0 })
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [filterClient, setFilterClient] = useState<string>('all')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()

    // Load AI review logs (via view) — the view already filters trigger_type='check_in'
    // and joins with profiles. We limit to 200 most recent.
    const { data: reviewData, error } = await supabase
      .from('ai_review_summary')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      // Fallback: query ai_agent_logs directly if view doesn't exist yet
      const { data: fallback } = await supabase
        .from('ai_agent_logs')
        .select('id, user_id, input_summary, output_action, tokens_used, latency_ms, error, created_at')
        .eq('trigger_type', 'check_in')
        .order('created_at', { ascending: false })
        .limit(200)

      const userIdSet = new Set((fallback ?? []).map((r: any) => r.user_id as string))
      const userIds = Array.from(userIdSet)
      const { data: profiles } = userIds.length > 0
        ? await supabase.from('profiles').select('id, name, email, ai_adjustments_paused').in('id', userIds)
        : { data: [] }

      const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]))
      const mapped: AIReview[] = (fallback ?? []).map((r: any) => ({
        ...r,
        client_name: profileMap[r.user_id]?.name ?? null,
        client_email: profileMap[r.user_id]?.email ?? null,
        ai_adjustments_paused: profileMap[r.user_id]?.ai_adjustments_paused ?? false,
      }))
      setReviews(mapped)
      computeStats(mapped)
    } else {
      setReviews(reviewData ?? [])
      computeStats(reviewData ?? [])
    }

    setLoading(false)
  }

  function computeStats(data: AIReview[]) {
    const total = new Set(data.map(r => r.user_id)).size
    const active = new Set(data.filter(r => !r.ai_adjustments_paused).map(r => r.user_id)).size
    const tokens = data.filter(r => r.tokens_used).map(r => r.tokens_used as number)
    const avg = tokens.length > 0 ? Math.round(tokens.reduce((a, b) => a + b, 0) / tokens.length) : 0
    setStats({ total, active, avgTokensPerReview: avg })
  }

  async function togglePause(userId: string, currentlyPaused: boolean) {
    setToggling(userId)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ ai_adjustments_paused: !currentlyPaused })
      .eq('id', userId)

    if (error) {
      toast.error('Failed to update pause state')
    } else {
      toast.success(currentlyPaused ? 'AI adjustments resumed' : 'AI adjustments paused')
      setReviews(prev => prev.map(r =>
        r.user_id === userId ? { ...r, ai_adjustments_paused: !currentlyPaused } : r
      ))
    }
    setToggling(null)
  }

  const clientOptions = Array.from(new Map(reviews.map(r => [r.user_id, r.client_name ?? r.client_email ?? r.user_id])).entries())
  const filtered = filterClient === 'all' ? reviews : reviews.filter(r => r.user_id === filterClient)

  // Cost estimate: claude-sonnet-4-6 is ~$3/$15 per M tokens (input/output)
  const estimatedCostCents = Math.round(stats.avgTokensPerReview * 0.000009 * 100) // rough avg

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-cb-text">AI Coach Reviews</h1>
            <p className="text-sm text-cb-muted">Automated check-in reviews for AI-coached clients</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl p-4 border border-cb-border">
          <p className="text-xs text-cb-muted font-medium uppercase tracking-wide">AI Clients</p>
          <p className="text-2xl font-bold text-cb-text mt-1">{stats.total}</p>
        </div>
        <div className="bg-surface rounded-xl p-4 border border-cb-border">
          <p className="text-xs text-cb-muted font-medium uppercase tracking-wide">Active (not paused)</p>
          <p className="text-2xl font-bold text-cb-success mt-1">{stats.active}</p>
        </div>
        <div className="bg-surface rounded-xl p-4 border border-cb-border">
          <p className="text-xs text-cb-muted font-medium uppercase tracking-wide">Total Reviews</p>
          <p className="text-2xl font-bold text-cb-text mt-1">{reviews.length}</p>
        </div>
        <div className="bg-surface rounded-xl p-4 border border-cb-border">
          <p className="text-xs text-cb-muted font-medium uppercase tracking-wide">Avg Tokens / Review</p>
          <p className="text-2xl font-bold text-cb-text mt-1">{stats.avgTokensPerReview.toLocaleString()}</p>
          <p className="text-[10px] text-cb-muted mt-0.5">~${estimatedCostCents}¢ est. per review</p>
        </div>
      </div>

      {/* Filter */}
      {clientOptions.length > 1 && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-cb-text">Filter by client:</label>
          <select
            value={filterClient}
            onChange={e => setFilterClient(e.target.value)}
            className="bg-surface border border-cb-border rounded-lg px-3 py-1.5 text-sm text-cb-text"
          >
            <option value="all">All clients</option>
            {clientOptions.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="text-center py-16 text-cb-muted">Loading reviews...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Bot size={40} className="mx-auto text-cb-muted/40" />
          <p className="text-cb-muted">No check-in reviews yet.</p>
          <p className="text-sm text-cb-muted/70">Reviews appear here when AI-coached clients submit their weekly check-ins.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(review => {
            const isOpen = expanded === review.id
            const parsed = parseInputSummary(review.input_summary)
            const adjustments = (review.output_action ?? 'No adjustments').split('; ')
            const hasError = !!review.error
            const isPaused = review.ai_adjustments_paused

            return (
              <div
                key={review.id}
                className={clsx(
                  'bg-surface border rounded-xl overflow-hidden',
                  hasError ? 'border-cb-danger/30' : 'border-cb-border',
                )}
              >
                {/* Row summary */}
                <button
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-cb-border/20 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : review.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-cb-text truncate">
                        {review.client_name ?? review.client_email ?? 'Unknown client'}
                      </span>
                      {isPaused && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-cb-warning/15 text-cb-warning">
                          PAUSED
                        </span>
                      )}
                      {hasError && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-cb-danger/15 text-cb-danger">
                          ERROR
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-cb-muted mt-0.5">
                      {format(new Date(review.created_at), 'EEE d MMM yyyy, h:mm a')}
                      {review.latency_ms && ` · ${(review.latency_ms / 1000).toFixed(1)}s`}
                      {review.tokens_used && ` · ${review.tokens_used.toLocaleString()} tokens`}
                    </p>
                  </div>

                  {/* Quick metrics */}
                  <div className="hidden sm:flex items-center gap-3 text-xs text-cb-muted shrink-0">
                    {parsed.energy && <span>⚡ {parsed.energy}/10</span>}
                    {parsed.stress && <span>😰 {parsed.stress}/10</span>}
                    {parsed.weight && <span>⚖️ {parsed.weight}</span>}
                  </div>

                  {isOpen ? <ChevronUp size={16} className="text-cb-muted shrink-0" /> : <ChevronDown size={16} className="text-cb-muted shrink-0" />}
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="px-4 pb-4 space-y-4 border-t border-cb-border/50 pt-4">
                    {/* Check-in metrics */}
                    {Object.keys(parsed).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-cb-muted uppercase tracking-wide mb-2">Check-In Data</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(parsed).map(([k, v]) => (
                            k !== 'check_in' && (
                              <span key={k} className="px-2 py-1 bg-cb-border/40 rounded text-xs text-cb-text">
                                <span className="text-cb-muted">{k}:</span> {v}
                              </span>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Adjustments applied */}
                    <div>
                      <p className="text-xs font-semibold text-cb-muted uppercase tracking-wide mb-2">Adjustments Applied</p>
                      <div className="flex flex-wrap gap-1.5">
                        {adjustments.map((a, i) => <AdjustmentBadge key={i} text={a} />)}
                      </div>
                    </div>

                    {/* Error */}
                    {hasError && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-cb-danger/8 border border-cb-danger/20">
                        <AlertTriangle size={14} className="text-cb-danger mt-0.5 shrink-0" />
                        <p className="text-xs text-cb-danger">{review.error}</p>
                      </div>
                    )}

                    {/* Override controls */}
                    <div className="flex items-center gap-3 pt-2 border-t border-cb-border/50">
                      <button
                        onClick={() => togglePause(review.user_id, isPaused)}
                        disabled={toggling === review.user_id}
                        className={clsx(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                          isPaused
                            ? 'bg-cb-success/10 text-cb-success hover:bg-cb-success/20'
                            : 'bg-cb-warning/10 text-cb-warning hover:bg-cb-warning/20',
                        )}
                      >
                        {toggling === review.user_id ? (
                          <span className="animate-pulse">...</span>
                        ) : isPaused ? (
                          <><Play size={12} /> Resume AI Adjustments</>
                        ) : (
                          <><Pause size={12} /> Pause AI Adjustments</>
                        )}
                      </button>
                      <span className="text-xs text-cb-muted">
                        {isPaused
                          ? 'AI will still send messages, but won\'t modify the program.'
                          : 'AI is actively adjusting this client\'s program after each check-in.'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
