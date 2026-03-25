'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckIn, Profile } from '@/lib/types'
import { format, startOfWeek, isSameWeek } from 'date-fns'
import { CheckSquare, ChevronDown, ChevronUp, Check, Camera, Maximize2, Play } from 'lucide-react'
import clsx from 'clsx'
import Image from 'next/image'
import { useIsDemo } from '@/lib/demo/useDemoMode'
import { DEMO_CLIENTS, DEMO_CHECK_INS } from '@/lib/demo/mockData'

type CheckInWithClient = CheckIn & { client?: Profile }

function extractLoomId(url: string): string | null {
  const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

function ScoreBadge({ value, label }: { value: number | null; label: string }) {
  if (value === null) return <span className="text-cb-muted text-xs">—</span>
  const color =
    value >= 8 ? 'bg-cb-success/15 text-cb-success' :
    value >= 5 ? 'bg-cb-warning/15 text-cb-warning' :
    'bg-cb-danger/15 text-cb-danger'
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={clsx('px-2 py-0.5 rounded text-xs font-semibold', color)}>{value}</span>
      <span className="text-[10px] text-cb-muted">{label}</span>
    </div>
  )
}

export default function CheckInsPage() {
  const isDemo = useIsDemo()
  const [checkIns, setCheckIns] = useState<CheckInWithClient[]>([])
  const [clients, setClients] = useState<Profile[]>([])
  const [filterClient, setFilterClient] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({})
  const [loomDraft, setLoomDraft] = useState<Record<string, string>>({})
  const [savingComment, setSavingComment] = useState<string | null>(null)
  const [savingLoom, setSavingLoom] = useState<string | null>(null)
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; label: string } | null>(null)

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo])

  async function loadData() {
    setLoading(true)

    if (isDemo) {
      const demoClients = DEMO_CLIENTS as unknown as Profile[]
      setClients(demoClients)
      const enriched: CheckInWithClient[] = DEMO_CHECK_INS.map((ci) => ({
        ...(ci as unknown as CheckIn),
        client: demoClients.find((c) => c.id === ci.client_id),
      }))
      setCheckIns(enriched)
      const drafts: Record<string, string> = {}
      const loomDrafts: Record<string, string> = {}
      enriched.forEach((ci) => {
        drafts[ci.id] = ci.coach_comment ?? ''
        loomDrafts[ci.id] = ci.loom_url ?? ''
      })
      setCommentDraft(drafts)
      setLoomDraft(loomDrafts)
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: clientData } = await supabase
      .from('profiles')
      .select('*')
      .eq('coach_id', user.id)
      .eq('role', 'client')

    const clientIds = (clientData ?? []).map((c: Profile) => c.id)
    setClients(clientData ?? [])

    if (clientIds.length === 0) {
      setCheckIns([])
      setLoading(false)
      return
    }

    const { data: ciData } = await supabase
      .from('check_ins')
      .select('*')
      .in('client_id', clientIds)
      .order('date', { ascending: false })

    const enriched: CheckInWithClient[] = (ciData ?? []).map((ci: CheckIn) => ({
      ...ci,
      client: (clientData ?? []).find((c: Profile) => c.id === ci.client_id),
    }))

    setCheckIns(enriched)
    const drafts: Record<string, string> = {}
    const loomDrafts: Record<string, string> = {}
    enriched.forEach((ci) => {
      drafts[ci.id] = ci.coach_comment ?? ''
      loomDrafts[ci.id] = ci.loom_url ?? ''
    })
    setCommentDraft(drafts)
    setLoomDraft(loomDrafts)
    setLoading(false)
  }

  async function saveComment(checkInId: string) {
    if (isDemo) return
    setSavingComment(checkInId)
    const supabase = createClient()
    await supabase.from('check_ins').update({ coach_comment: commentDraft[checkInId] }).eq('id', checkInId)
    setSavingComment(null)
    loadData()
  }

  async function saveLoomUrl(checkInId: string) {
    if (isDemo) return
    const url = loomDraft[checkInId]?.trim() ?? ''
    if (!url || !url.startsWith('https://www.loom.com/share/')) {
      alert('Please enter a valid Loom URL starting with https://www.loom.com/share/')
      return
    }
    setSavingLoom(checkInId)
    const supabase = createClient()
    await supabase.from('check_ins').update({ loom_url: url }).eq('id', checkInId)
    setSavingLoom(null)
    loadData()
  }

  const filtered = filterClient === 'all'
    ? checkIns
    : checkIns.filter((ci) => ci.client_id === filterClient)

  // Compute stats
  const thisWeekCIs = filtered.filter((ci) => isSameWeek(new Date(ci.date), new Date(), { weekStartsOn: 1 }))
  const avgEnergy = thisWeekCIs.length
    ? Math.round(thisWeekCIs.reduce((s, ci) => s + (ci.energy ?? 0), 0) / thisWeekCIs.length * 10) / 10
    : null
  const avgStress = thisWeekCIs.length
    ? Math.round(thisWeekCIs.reduce((s, ci) => s + (ci.stress ?? 0), 0) / thisWeekCIs.length * 10) / 10
    : null
  const avgSleep = thisWeekCIs.length
    ? Math.round(thisWeekCIs.reduce((s, ci) => s + (ci.sleep_quality ?? 0), 0) / thisWeekCIs.length * 10) / 10
    : null

  // Group by week
  const weeks: Record<string, CheckInWithClient[]> = {}
  filtered.forEach((ci) => {
    const weekStart = format(startOfWeek(new Date(ci.date), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    if (!weeks[weekStart]) weeks[weekStart] = []
    weeks[weekStart].push(ci)
  })
  const sortedWeeks = Object.entries(weeks).sort(([a], [b]) => b.localeCompare(a))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-cb-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cb-text">Check Ins</h1>
          <p className="text-sm text-cb-muted mt-0.5">Review and respond to client check-ins</p>
        </div>
        <div className="flex items-center gap-3">
          <CheckSquare size={18} className="text-cb-muted" />
          <span className="text-sm text-cb-secondary font-medium">{filtered.length} total</span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: 'This Week', value: thisWeekCIs.length.toString(), unit: 'check-ins' },
          { label: 'Avg Energy', value: avgEnergy?.toString() ?? '—', unit: '/ 10' },
          { label: 'Avg Stress', value: avgStress?.toString() ?? '—', unit: '/ 10' },
          { label: 'Avg Sleep', value: avgSleep?.toString() ?? '—', unit: '/ 10' },
        ].map(({ label, value, unit }) => (
          <div key={label} className="bg-surface border border-cb-border rounded-lg p-4">
            <p className="text-xs text-cb-muted mb-1">{label}</p>
            <div className="flex items-baseline gap-1">
              <p className="text-xl font-bold text-cb-text">{value}</p>
              <p className="text-xs text-cb-muted">{unit}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="mb-5">
        <select
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          className="px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-secondary bg-surface-light focus:outline-none focus:ring-2 focus:ring-cb-teal"
        >
          <option value="all">All Clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name ?? c.email}</option>
          ))}
        </select>
      </div>

      {/* Grouped by week */}
      {filtered.length === 0 ? (
        <div className="bg-surface border border-cb-border rounded-lg p-16 text-center">
          <CheckSquare size={40} className="mx-auto text-cb-muted mb-3" />
          <p className="text-cb-muted">No check-ins found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedWeeks.map(([weekStart, cis]) => (
            <div key={weekStart}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold text-cb-secondary">
                  Week of {format(new Date(weekStart), 'd MMM yyyy')}
                </h2>
                <span className="text-xs text-cb-muted">{cis.length} check-in{cis.length !== 1 ? 's' : ''}</span>
                <div className="flex-1 h-px bg-cb-border" />
              </div>
              <div className="space-y-2">
                {cis.map((ci) => (
                  <div key={ci.id} className={clsx('bg-surface border rounded-lg overflow-hidden', ci.submitted ? 'border-cb-success/30' : 'border-cb-border')}>
                    <button
                      className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-surface-light transition-colors"
                      onClick={() => setExpanded(expanded === ci.id ? null : ci.id)}
                    >
                      {/* Client avatar */}
                      <div className="w-8 h-8 rounded-full bg-cb-teal/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-cb-teal">
                          {(ci.client?.name ?? '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-semibold text-cb-text">{ci.client?.name ?? 'Unknown'}</span>
                          <span className="text-sm text-cb-muted">{format(new Date(ci.date), 'd MMM yyyy')}</span>
                          {ci.bodyweight_kg && (
                            <span className="text-sm text-cb-secondary font-medium">{ci.bodyweight_kg} kg</span>
                          )}
                          <span className={clsx('ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                            ci.submitted ? 'bg-cb-success/15 text-cb-success' : 'bg-surface-light text-cb-muted'
                          )}>
                            {ci.submitted ? 'Submitted' : 'Draft'}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <ScoreBadge value={ci.energy} label="Energy" />
                          <ScoreBadge value={ci.stress} label="Stress" />
                          <ScoreBadge value={ci.sleep_quality} label="Sleep" />
                          <ScoreBadge value={ci.training_difficulty} label="Training" />
                          {ci.wins && (
                            <span className="text-xs text-cb-muted truncate max-w-xs hidden md:block">
                              Wins: {ci.wins.slice(0, 60)}{ci.wins.length > 60 ? '…' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {expanded === ci.id ? <ChevronUp size={16} className="text-cb-muted flex-shrink-0" /> : <ChevronDown size={16} className="text-cb-muted flex-shrink-0" />}
                    </button>

                    {expanded === ci.id && (
                      <div className="px-5 pb-5 border-t border-cb-border space-y-4 pt-4">
                        {/* Scores grid */}
                        <div className="grid grid-cols-4 gap-3">
                          {[
                            { label: 'Energy', value: ci.energy },
                            { label: 'Stress', value: ci.stress },
                            { label: 'Sleep Quality', value: ci.sleep_quality },
                            { label: 'Training Difficulty', value: ci.training_difficulty },
                          ].map(({ label, value }) => {
                            const color = value === null ? 'bg-surface-light text-cb-muted' :
                              value >= 8 ? 'bg-cb-success/15 text-cb-success border border-cb-success/30' :
                              value >= 5 ? 'bg-cb-warning/15 text-cb-warning border border-cb-warning/30' :
                              'bg-cb-danger/15 text-cb-danger border border-cb-danger/30'
                            return (
                              <div key={label} className={clsx('rounded-lg p-3 text-center', color)}>
                                <p className="text-xl font-bold">{value ?? '—'}</p>
                                <p className="text-[10px] mt-0.5 opacity-80">{label}</p>
                              </div>
                            )
                          })}
                        </div>

                        {/* Wins / Struggles */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-cb-muted mb-1 uppercase tracking-wide">Wins</p>
                            <p className="text-sm text-cb-secondary">{ci.wins || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-cb-muted mb-1 uppercase tracking-wide">Struggles</p>
                            <p className="text-sm text-cb-secondary">{ci.struggles || '—'}</p>
                          </div>
                        </div>

                        {/* Bodyweight mini bar */}
                        {ci.bodyweight_kg && (
                          <div className="flex items-center gap-3 bg-surface-light rounded-lg px-4 py-2">
                            <span className="text-xs text-cb-muted">Bodyweight</span>
                            <span className="text-sm font-semibold text-cb-text">{ci.bodyweight_kg} kg</span>
                          </div>
                        )}

                        {/* Progress photos */}
                        {(ci.photo_front_url || ci.photo_side_url || ci.photo_back_url) && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Camera size={13} className="text-cb-muted" />
                              <p className="text-xs font-semibold text-cb-muted uppercase tracking-wide">Progress Photos</p>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              {[
                                { url: ci.photo_front_url, label: 'Front' },
                                { url: ci.photo_side_url, label: 'Side' },
                                { url: ci.photo_back_url, label: 'Back' },
                              ].map(({ url, label }) => (
                                <div key={label} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-surface-light border border-cb-border group">
                                  {url ? (
                                    <>
                                      <Image src={url} alt={label} fill className="object-cover" unoptimized />
                                      <button
                                        onClick={() => setLightboxPhoto({ url, label })}
                                        className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors"
                                      >
                                        <Maximize2 size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </button>
                                    </>
                                  ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                                      <Camera size={18} className="text-cb-muted opacity-40" />
                                      <span className="text-[10px] text-cb-muted opacity-50">{label}</span>
                                    </div>
                                  )}
                                  <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-semibold text-white drop-shadow-sm">{url ? label : ''}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Coach comment */}
                        <div>
                          <p className="text-xs font-semibold text-cb-muted mb-2 uppercase tracking-wide">Coach Comment</p>
                          <div className="flex gap-2">
                            <textarea
                              rows={3}
                              value={commentDraft[ci.id] ?? ''}
                              onChange={(e) => setCommentDraft({ ...commentDraft, [ci.id]: e.target.value })}
                              placeholder="Add your feedback…"
                              className="flex-1 px-3 py-2 border border-cb-border rounded-md text-sm text-cb-text placeholder-cb-muted bg-surface-light focus:outline-none focus:ring-2 focus:ring-cb-teal resize-none"
                            />
                            <button
                              onClick={() => saveComment(ci.id)}
                              disabled={savingComment === ci.id}
                              className="px-3 py-2 bg-cb-teal hover:bg-cb-teal/90 disabled:bg-cb-teal/50 text-white rounded-md flex items-center gap-1 text-sm self-start"
                            >
                              {savingComment === ci.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <><Check size={14} /> Save</>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Loom Video Feedback */}
                        <div className="space-y-2 mt-4 pt-4 border-t border-cb-border">
                          <p className="text-xs font-semibold text-cb-muted uppercase tracking-wide">Loom Video Feedback</p>
                          {ci.loom_url ? (
                            <div className="space-y-2">
                              <div className="relative w-full rounded-lg overflow-hidden bg-surface-light border border-cb-border">
                                <iframe
                                  src={`https://www.loom.com/embed/${extractLoomId(ci.loom_url)}`}
                                  frameBorder="0"
                                  allowFullScreen
                                  className="w-full h-64"
                                />
                              </div>
                              <button
                                onClick={() => setLoomDraft({ ...loomDraft, [ci.id]: ci.loom_url || '' })}
                                className="text-sm text-cb-teal hover:text-cb-teal/80 font-medium"
                              >
                                Change
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={loomDraft[ci.id] ?? ''}
                                onChange={(e) => setLoomDraft({ ...loomDraft, [ci.id]: e.target.value })}
                                placeholder="Paste Loom video URL…"
                                className="w-full px-3 py-2 border border-cb-border rounded-md text-sm text-cb-text placeholder-cb-muted bg-surface-light focus:outline-none focus:ring-2 focus:ring-cb-teal"
                              />
                              {loomDraft[ci.id] && loomDraft[ci.id].startsWith('https://www.loom.com/share/') && (
                                <div className="relative w-full rounded-lg overflow-hidden bg-surface-light border border-cb-border">
                                  <iframe
                                    src={`https://www.loom.com/embed/${extractLoomId(loomDraft[ci.id])}`}
                                    frameBorder="0"
                                    allowFullScreen
                                    className="w-full h-64"
                                  />
                                </div>
                              )}
                              <button
                                onClick={() => saveLoomUrl(ci.id)}
                                disabled={savingLoom === ci.id || !loomDraft[ci.id]}
                                className="px-3 py-2 bg-cb-teal hover:bg-cb-teal/90 disabled:bg-cb-teal/50 text-white rounded-md flex items-center gap-1 text-sm"
                              >
                                {savingLoom === ci.id ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <><Check size={14} /> Save Loom URL</>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden">
              <Image src={lightboxPhoto.url} alt={lightboxPhoto.label} fill className="object-contain" unoptimized />
            </div>
            <p className="text-center text-white text-sm font-semibold mt-3 opacity-80">{lightboxPhoto.label}</p>
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-lg font-bold"
            >×</button>
          </div>
        </div>
      )}
    </div>
  )
}
