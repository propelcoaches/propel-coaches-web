'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'
import {
  ShoppingBag, Search, Star, Users, TrendingUp, Sparkles,
  Plus, ChevronLeft, CheckCircle, Dumbbell, X
} from 'lucide-react'
import clsx from 'clsx'

// ── Types ─────────────────────────────────────────────────────────────────────

interface MarketplaceListing {
  id: string
  coach_id: string
  program_id: string
  title: string
  description: string
  short_description: string | null
  cover_image_url: string | null
  price_cents: number
  goal: string | null
  experience_level: string | null
  days_per_week: number | null
  program_length_weeks: number | null
  equipment_needed: string[]
  purchase_count: number
  avg_rating: number
  review_count: number
  status: string
  featured: boolean
  tags: string[]
  created_at: string
  coach?: { full_name: string; avatar_url: string | null; avg_rating: number }
}

interface Program {
  id: string
  name: string
  goal: string
  days_per_week: number
  duration_weeks: number
}

const GOALS = ['hypertrophy', 'strength', 'fat_loss', 'athletic_performance', 'general_fitness']

const GOAL_LABELS: Record<string, string> = {
  fat_loss:             'Fat Loss',
  hypertrophy:          'Hypertrophy',
  strength:             'Strength',
  endurance:            'Endurance',
  general_fitness:      'General Fitness',
  athletic_performance: 'Athletic',
}

const REVENUE_SHARE = 0.70 // coach earns 70%

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(cents: number) {
  return cents === 0 ? 'Free' : `$${(cents / 100).toFixed(2)}`
}

function coachEarns(cents: number) {
  return `$${((cents * REVENUE_SHARE) / 100).toFixed(2)}`
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={11}
          className={i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-cb-border'}
        />
      ))}
      {count > 0 && <span className="text-xs text-cb-muted">({count})</span>}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const supabase = createClient()

  const [listings, setListings]       = useState<MarketplaceListing[]>([])
  const [myListings, setMyListings]   = useState<MarketplaceListing[]>([])
  const [loading, setLoading]         = useState(true)
  const [activeTab, setActiveTab]     = useState<'browse' | 'my_listings'>('browse')
  const [showCreate, setShowCreate]   = useState(false)
  const [programs, setPrograms]       = useState<Program[]>([])
  const [filterGoal, setFilterGoal]   = useState('all')
  const [search, setSearch]           = useState('')
  const [sortBy, setSortBy]           = useState('popular')

  const [form, setForm] = useState({
    program_id:        '',
    title:             '',
    description:       '',
    short_description: '',
    price_cents:       2999,
    tags:              [] as string[],
  })
  const [generating, setGenerating] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const [allRes, myRes, progsRes] = await Promise.all([
      supabase
        .from('marketplace_listings')
        .select('*, coach:profiles!marketplace_listings_coach_id_fkey(full_name, avatar_url, avg_rating)')
        .eq('status', 'published')
        .order('purchase_count', { ascending: false }),
      user
        ? supabase.from('marketplace_listings').select('*').eq('coach_id', user.id).order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
      user
        ? supabase.from('programs').select('id, name, goal, days_per_week, duration_weeks').eq('coach_id', user.id).eq('status', 'active')
        : Promise.resolve({ data: [] }),
    ])

    if (allRes.data)  setListings(allRes.data as MarketplaceListing[])
    if (myRes.data)   setMyListings(myRes.data as MarketplaceListing[])
    if (progsRes.data) setPrograms(progsRes.data as Program[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  async function generateWithAI() {
    if (!form.program_id) { toast.error('Select a program first'); return }
    setGenerating(true)
    try {
      const res = await fetch('/api/marketplace/generate-listing', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ program_id: form.program_id }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to generate'); return }
      setForm(prev => ({
        ...prev,
        title:             data.title             ?? prev.title,
        short_description: data.short_description ?? prev.short_description,
        description:       data.description       ?? prev.description,
        tags:              data.tags              ?? prev.tags,
      }))
      toast.success('AI listing copy generated')
    } catch {
      toast.error('Failed to generate listing')
    } finally {
      setGenerating(false)
    }
  }

  async function createListing() {
    if (!form.program_id || !form.title.trim()) { toast.error('Program and title are required'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const program = programs.find(p => p.id === form.program_id)
    const { data, error } = await supabase.from('marketplace_listings').insert({
      coach_id:            user.id,
      program_id:          form.program_id,
      title:               form.title.trim(),
      description:         form.description.trim(),
      short_description:   form.short_description.trim() || null,
      price_cents:         form.price_cents,
      goal:                program?.goal,
      days_per_week:       program?.days_per_week,
      program_length_weeks: program?.duration_weeks,
      tags:                form.tags,
      status:              'draft',
    }).select().single()

    if (data) {
      setMyListings(prev => [data, ...prev])
      setShowCreate(false)
      setActiveTab('my_listings')
      toast.success('Listing created as draft')
    }
    if (error) toast.error(error.message)
  }

  async function publishListing(id: string) {
    await supabase.from('marketplace_listings')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', id)
    setMyListings(prev => prev.map(l => l.id === id ? { ...l, status: 'published' } : l))
    toast.success('Listing published to marketplace')
  }

  async function purchaseProgram(listing: MarketplaceListing) {
    if (listing.price_cents === 0) {
      try {
        const res = await fetch('/api/marketplace/clone', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ listing_id: listing.id }),
        })
        const data = await res.json()
        if (data.success) toast.success('Program cloned to your library!')
        else toast.error(data.error ?? 'Failed to clone program')
      } catch { toast.error('Failed to clone program') }
    } else {
      try {
        const res = await fetch('/api/marketplace/checkout', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ listing_id: listing.id }),
        })
        const data = await res.json()
        if (data.url) window.location.href = data.url
        else toast.error(data.error ?? 'Failed to start checkout')
      } catch { toast.error('Failed to start checkout') }
    }
  }

  const filteredListings = listings.filter(l => {
    if (filterGoal !== 'all' && l.goal !== filterGoal) return false
    if (search && !l.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }).sort((a, b) => {
    if (sortBy === 'popular')    return b.purchase_count - a.purchase_count
    if (sortBy === 'rating')     return b.avg_rating - a.avg_rating
    if (sortBy === 'price_low')  return a.price_cents - b.price_cents
    if (sortBy === 'price_high') return b.price_cents - a.price_cents
    if (sortBy === 'newest')     return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    return 0
  })

  // ── Create listing view ───────────────────────────────────────────────────

  if (showCreate) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setShowCreate(false)} className="flex items-center gap-1 text-cb-muted hover:text-cb-text text-sm">
            <ChevronLeft size={16} /> Back
          </button>
          <div>
            <h1 className="text-xl font-bold text-cb-text">Publish to Marketplace</h1>
            <p className="text-xs text-cb-muted mt-0.5">You earn {Math.round(REVENUE_SHARE * 100)}% of every sale</p>
          </div>
        </div>

        <div className="bg-surface border border-cb-border rounded-2xl p-5 space-y-4">
          {/* Program selector */}
          <div>
            <label className="block text-xs font-semibold text-cb-muted uppercase tracking-wide mb-1.5">Program to Sell</label>
            <select
              value={form.program_id}
              onChange={e => setForm({ ...form, program_id: e.target.value })}
              className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2.5 text-sm text-cb-text focus:outline-none focus:border-brand"
            >
              <option value="">Select a program…</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* AI generate button */}
          <div className="flex justify-end">
            <button
              onClick={generateWithAI}
              disabled={!form.program_id || generating}
              className="flex items-center gap-1.5 text-sm text-brand border border-brand/30 bg-brand/5 hover:bg-brand/10 rounded-xl px-3 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {generating
                ? <><div className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin" /> Generating…</>
                : <><Sparkles size={13} /> Generate with AI</>
              }
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-cb-muted uppercase tracking-wide mb-1.5">Listing Title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. 12-Week Hypertrophy Blueprint for Intermediate Lifters"
              className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2.5 text-sm text-cb-text focus:outline-none focus:border-brand"
            />
          </div>

          {/* Short description */}
          <div>
            <label className="block text-xs font-semibold text-cb-muted uppercase tracking-wide mb-1.5">Short Description</label>
            <input
              type="text"
              value={form.short_description}
              onChange={e => setForm({ ...form, short_description: e.target.value })}
              placeholder="One-liner for the listing card (max 120 chars)"
              maxLength={120}
              className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2.5 text-sm text-cb-text focus:outline-none focus:border-brand"
            />
          </div>

          {/* Full description */}
          <div>
            <label className="block text-xs font-semibold text-cb-muted uppercase tracking-wide mb-1.5">Full Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={6}
              placeholder="What the buyer gets, who it's for, what results to expect…"
              className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2.5 text-sm text-cb-text focus:outline-none focus:border-brand resize-none"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-semibold text-cb-muted uppercase tracking-wide mb-1.5">Price (USD)</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-surface-light border border-cb-border rounded-xl px-3 py-2.5">
                <span className="text-cb-muted text-sm">$</span>
                <input
                  type="number"
                  value={form.price_cents / 100}
                  onChange={e => setForm({ ...form, price_cents: Math.round(parseFloat(e.target.value || '0') * 100) })}
                  step="0.01"
                  min="0"
                  className="w-24 bg-transparent text-sm text-cb-text focus:outline-none"
                />
              </div>
              {form.price_cents > 0 && (
                <span className="text-xs text-cb-success font-medium">
                  You earn {coachEarns(form.price_cents)} per sale
                </span>
              )}
              {form.price_cents === 0 && (
                <span className="text-xs text-cb-muted">Free listing</span>
              )}
            </div>
          </div>

          <button
            onClick={createListing}
            disabled={!form.program_id || !form.title.trim()}
            className="w-full py-3 bg-brand text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Create Listing (Draft)
          </button>
        </div>
      </div>
    )
  }

  // ── Main view ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cb-text">Program Marketplace</h1>
          <div className="h-0.5 w-12 bg-gradient-to-r from-brand to-brand/40 rounded-full mt-1.5 mb-1" />
          <p className="text-sm text-cb-muted">Browse and sell training programs — you keep {Math.round(REVENUE_SHARE * 100)}%</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-brand text-white rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={15} /> Sell a Program
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface-light border border-cb-border rounded-xl p-1 w-fit">
        {([['browse', 'Browse', ShoppingBag], ['my_listings', `My Listings (${myListings.length})`, TrendingUp]] as const).map(([tab, label, Icon]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === tab ? 'bg-surface text-cb-text shadow-sm' : 'text-cb-muted hover:text-cb-secondary'
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'browse' ? (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-2 bg-surface border border-cb-border rounded-xl px-3 py-2">
              <Search size={14} className="text-cb-muted" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search programs…"
                className="bg-transparent text-sm text-cb-text focus:outline-none w-44"
              />
              {search && <button onClick={() => setSearch('')}><X size={13} className="text-cb-muted hover:text-cb-text" /></button>}
            </div>
            <select
              value={filterGoal}
              onChange={e => setFilterGoal(e.target.value)}
              className="bg-surface border border-cb-border rounded-xl px-3 py-2 text-sm text-cb-text focus:outline-none focus:border-brand"
            >
              <option value="all">All Goals</option>
              {GOALS.map(g => <option key={g} value={g}>{GOAL_LABELS[g] ?? g}</option>)}
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-surface border border-cb-border rounded-xl px-3 py-2 text-sm text-cb-text focus:outline-none focus:border-brand"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-12 h-12 bg-surface-light rounded-2xl flex items-center justify-center mb-4 border border-cb-border">
                <ShoppingBag size={22} className="text-cb-muted" />
              </div>
              <p className="text-cb-secondary font-medium">No programs found</p>
              <p className="text-cb-muted text-sm mt-1">
                {search || filterGoal !== 'all' ? 'Try adjusting your filters.' : 'Be the first to list a program!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredListings.map(listing => (
                <div key={listing.id} className="bg-surface border border-cb-border rounded-2xl overflow-hidden hover:shadow-md hover:border-brand/30 transition-all cursor-pointer group">
                  {/* Cover */}
                  <div className="h-36 bg-gradient-to-br from-brand to-brand/60 flex items-center justify-center relative">
                    {listing.cover_image_url ? (
                      <img src={listing.cover_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Dumbbell size={36} className="text-white/30" />
                    )}
                    {listing.featured && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded-full uppercase tracking-wide">
                        Featured
                      </span>
                    )}
                    <span className="absolute top-2 right-2 bg-white/95 text-brand font-bold text-sm px-2 py-0.5 rounded-lg shadow-sm">
                      {formatPrice(listing.price_cents)}
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-cb-text text-sm line-clamp-2 mb-1 leading-snug">{listing.title}</h3>
                    {listing.short_description && (
                      <p className="text-xs text-cb-muted line-clamp-2 mb-2">{listing.short_description}</p>
                    )}

                    {/* Meta pills */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {listing.goal && (
                        <span className="px-1.5 py-0.5 bg-brand/5 text-brand text-[10px] font-medium rounded-md border border-brand/10">
                          {GOAL_LABELS[listing.goal] ?? listing.goal}
                        </span>
                      )}
                      {listing.days_per_week && (
                        <span className="px-1.5 py-0.5 bg-surface-light text-cb-muted text-[10px] rounded-md border border-cb-border">
                          {listing.days_per_week}d/wk
                        </span>
                      )}
                      {listing.program_length_weeks && (
                        <span className="px-1.5 py-0.5 bg-surface-light text-cb-muted text-[10px] rounded-md border border-cb-border">
                          {listing.program_length_weeks}wk
                        </span>
                      )}
                    </div>

                    {/* Coach + rating */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        {listing.coach && (
                          <span className="text-xs text-cb-muted">by {listing.coach.full_name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {listing.avg_rating > 0 && <StarRating rating={listing.avg_rating} count={listing.review_count} />}
                        {listing.purchase_count > 0 && (
                          <span className="text-[10px] text-cb-muted flex items-center gap-0.5">
                            <Users size={10} /> {listing.purchase_count}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => purchaseProgram(listing)}
                      className="w-full py-2 bg-brand text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      {listing.price_cents === 0 ? 'Get Free' : 'Purchase'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* My Listings */
        <div className="space-y-3">
          {myListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 bg-surface-light rounded-2xl flex items-center justify-center mb-4 border border-cb-border">
                <TrendingUp size={22} className="text-cb-muted" />
              </div>
              <p className="text-cb-secondary font-medium">No listings yet</p>
              <p className="text-cb-muted text-sm mt-1">Publish a program and start earning.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 flex items-center gap-2 bg-brand text-white rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90"
              >
                <Plus size={15} /> Sell a Program
              </button>
            </div>
          ) : (
            myListings.map(listing => (
              <div key={listing.id} className="bg-surface border border-cb-border rounded-2xl p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-cb-text text-sm truncate">{listing.title}</h3>
                    <span className={clsx(
                      'px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0',
                      listing.status === 'published' ? 'bg-cb-success/10 text-cb-success' : 'bg-surface-light text-cb-muted border border-cb-border'
                    )}>
                      {listing.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-cb-muted">
                    <span className="font-medium text-cb-text">{formatPrice(listing.price_cents)}</span>
                    {listing.price_cents > 0 && (
                      <span className="text-cb-success">You earn {coachEarns(listing.price_cents)}/sale</span>
                    )}
                    <span className="flex items-center gap-1"><Users size={11} /> {listing.purchase_count} sales</span>
                    {listing.avg_rating > 0 && (
                      <span className="flex items-center gap-1"><Star size={11} className="fill-amber-400 text-amber-400" /> {listing.avg_rating.toFixed(1)}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 ml-4">
                  {listing.status === 'draft' && (
                    <button
                      onClick={() => publishListing(listing.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-cb-success text-white rounded-xl text-xs font-medium hover:opacity-90 transition-opacity"
                    >
                      <CheckCircle size={12} /> Publish
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
