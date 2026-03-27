'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Play, Video, ExternalLink, MoreHorizontal, X, Clock, Dumbbell, Layers, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'

type StudioVideo = {
  id: string
  title: string
  description: string
  url: string
  duration: string
  category: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  muscle_groups: string[]
  created_at: string
}

const CATEGORIES = ['All', 'Full Body', 'Upper Body', 'Lower Body', 'Core', 'Cardio', 'Mobility', 'Tutorial']
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced']

function difficultyBadge(level: string) {
  switch (level) {
    case 'Beginner': return 'bg-green-500/10 text-green-400'
    case 'Intermediate': return 'bg-amber-500/10 text-amber-400'
    case 'Advanced': return 'bg-red-500/10 text-red-400'
    default: return 'bg-surface-light text-cb-secondary'
  }
}

type AddVideoModalProps = {
  onClose: () => void
  onAdd: (v: { title: string; description: string; url: string; duration: string; category: string; difficulty: StudioVideo['difficulty'] }) => Promise<void>
}
function AddVideoModal({ onClose, onAdd }: AddVideoModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [duration, setDuration] = useState('')
  const [category, setCategory] = useState('Full Body')
  const [difficulty, setDifficulty] = useState<StudioVideo['difficulty']>('Intermediate')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!title.trim() || !url.trim()) return
    setSaving(true)
    await onAdd({ title: title.trim(), description: description.trim(), url: url.trim(), duration: duration.trim(), category, difficulty })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b border-cb-border">
          <h2 className="text-lg font-semibold text-cb-text">Add Video</h2>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-text transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">Title</label>
            <input className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand" placeholder="Video title..." value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">Description</label>
            <textarea className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand resize-none h-16" placeholder="Brief description..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">YouTube / Vimeo URL</label>
            <input className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand" placeholder="https://youtube.com/watch?v=..." value={url} onChange={e => setUrl(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-cb-secondary mb-1">Duration</label>
              <input className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand" placeholder="30:00" value={duration} onChange={e => setDuration(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-cb-secondary mb-1">Category</label>
              <select className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand" value={category} onChange={e => setCategory(e.target.value)}>
                {['Full Body', 'Upper Body', 'Lower Body', 'Core', 'Cardio', 'Mobility', 'Tutorial'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-cb-secondary mb-1">Difficulty</label>
              <select className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand" value={difficulty} onChange={e => setDifficulty(e.target.value as StudioVideo['difficulty'])}>
                {(['Beginner', 'Intermediate', 'Advanced'] as const).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 pt-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-cb-secondary hover:text-cb-text transition-colors">Cancel</button>
          <button onClick={submit} disabled={!title.trim() || !url.trim() || saving} className="px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50">
            {saving ? 'Adding…' : 'Add Video'}
          </button>
        </div>
      </div>
    </div>
  )
}

function VideoCard({ video, onDelete }: { video: StudioVideo; onDelete: () => void }) {
  const [showMenu, setShowMenu] = useState(false)
  return (
    <div className="bg-surface border border-cb-border rounded-xl overflow-hidden hover:border-brand/40 transition-colors group">
      <div className="relative h-36 bg-surface-light flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-brand/20" />
        <button onClick={() => window.open(video.url, '_blank')} className="relative z-10 w-12 h-12 rounded-full bg-black/50 flex items-center justify-center hover:bg-brand transition-colors group-hover:scale-105">
          <Play size={20} className="text-white ml-0.5" fill="white" />
        </button>
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
            <Clock size={10} /> {video.duration}
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-semibold text-cb-text text-sm leading-tight">{video.title}</h4>
          <div className="relative shrink-0">
            <button onClick={() => setShowMenu(!showMenu)} className="p-0.5 rounded text-cb-muted hover:text-cb-text transition-colors">
              <MoreHorizontal size={15} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-5 z-20 bg-surface border border-cb-border rounded-xl shadow-2xl w-36 py-1">
                <button onClick={() => { window.open(video.url, '_blank'); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-cb-text hover:bg-surface-light transition-colors">
                  <ExternalLink size={13} /> Open Video
                </button>
                <div className="h-px bg-cb-border mx-2 my-1" />
                <button onClick={() => { onDelete(); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-surface-light transition-colors">
                  <X size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-cb-secondary mb-2 line-clamp-2">{video.description}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', difficultyBadge(video.difficulty))}>{video.difficulty}</span>
          <span className="px-2 py-0.5 rounded-full bg-surface-light text-cb-muted text-xs">{video.category}</span>
        </div>
      </div>
    </div>
  )
}

export default function WorkoutStudioPage() {
  const supabase = useMemo(() => createClient(), [])
  const [videos, setVideos] = useState<StudioVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [difficultyFilter, setDifficultyFilter] = useState('All')
  const [showAddVideo, setShowAddVideo] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('studio_videos')
        .select('*')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false })
      setVideos(data ?? [])
      setLoading(false)
    }
    load()
  }, [supabase])

  const filteredVideos = videos.filter(v => {
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase()) || v.description.toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'All' || v.category === categoryFilter
    const matchDiff = difficultyFilter === 'All' || v.difficulty === difficultyFilter
    return matchSearch && matchCat && matchDiff
  })

  async function handleAddVideo(data: { title: string; description: string; url: string; duration: string; category: string; difficulty: StudioVideo['difficulty'] }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: inserted, error } = await supabase
      .from('studio_videos')
      .insert({ coach_id: user.id, ...data, muscle_groups: [] })
      .select()
      .single()
    if (error || !inserted) return
    setVideos(prev => [inserted, ...prev])
  }

  async function handleDeleteVideo(id: string) {
    await supabase.from('studio_videos').delete().eq('id', id)
    setVideos(prev => prev.filter(v => v.id !== id))
  }

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <p className="text-cb-muted text-sm">Loading studio…</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cb-text">Workout Studio</h1>
          <p className="text-cb-secondary text-sm mt-0.5">Build on-demand video workout content for clients</p>
        </div>
        <button onClick={() => setShowAddVideo(true)} className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-light transition-colors">
          <Plus size={16} /> Add Video
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-cb-border rounded-xl p-4">
          <p className="text-2xl font-bold text-cb-text">{videos.length}</p>
          <p className="text-sm text-cb-secondary mt-0.5">Total Videos</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cb-muted" />
          <input className="w-full bg-surface border border-cb-border rounded-xl pl-9 pr-4 py-2 text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:border-brand" placeholder="Search videos..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)} className={clsx('px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors', categoryFilter === c ? 'bg-brand text-white border-brand' : 'bg-surface border-cb-border text-cb-secondary hover:border-brand')}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 mb-5">
        {DIFFICULTIES.map(d => (
          <button key={d} onClick={() => setDifficultyFilter(d)} className={clsx('px-3 py-1 rounded-full text-xs font-medium border transition-colors', difficultyFilter === d ? difficultyBadge(d) + ' border-current' : 'border-cb-border text-cb-muted hover:border-brand hover:text-brand')}>
            {d}
          </button>
        ))}
      </div>

      {filteredVideos.length === 0 ? (
        <div className="text-center py-16 text-cb-muted">
          <Video size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">{videos.length === 0 ? 'No videos yet' : 'No videos found'}</p>
          {videos.length === 0 && <p className="text-sm mt-1">Add your first workout video to get started</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVideos.map(v => (
            <VideoCard key={v.id} video={v} onDelete={() => handleDeleteVideo(v.id)} />
          ))}
        </div>
      )}

      {showAddVideo && <AddVideoModal onClose={() => setShowAddVideo(false)} onAdd={handleAddVideo} />}
    </div>
  )
}
