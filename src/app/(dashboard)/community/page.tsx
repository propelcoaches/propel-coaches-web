'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users2, Plus, X, Heart, MessageCircle, Trophy, Pin, Loader2, Trash2 } from 'lucide-react'
import clsx from 'clsx'

type Post = {
  id: string
  coach_id: string
  title: string
  content: string
  audience: 'all' | 'specific'
  pinned: boolean
  likes_count: number
  comments_count: number
  created_at: string
}

function NewPostModal({ onClose, onSave, saving }: {
  onClose: () => void
  onSave: (title: string, content: string, audience: 'all' | 'specific', pinned: boolean) => Promise<void>
  saving: boolean
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [audience, setAudience] = useState<'all' | 'specific'>('all')
  const [pinned, setPinned] = useState(false)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-cb-border rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-cb-border">
          <h2 className="text-lg font-semibold text-cb-text">New Post</h2>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-secondary"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title..."
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-1">Content *</label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement..."
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-1">Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as 'all' | 'specific')}
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-secondary focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="all">All clients</option>
              <option value="specific">Specific clients</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="rounded accent-brand"
            />
            <span className="text-sm text-cb-secondary">Pin to top</span>
          </label>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-cb-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-cb-secondary border border-cb-border rounded-lg hover:bg-surface-light transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(title, content, audience, pinned)}
            disabled={!title.trim() || !content.trim() || saving}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-brand hover:bg-brand/90 disabled:opacity-50 text-white rounded-lg font-medium"
          >
            {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Post
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CommunityPage() {
  const supabase = useMemo(() => createClient(), [])
  const [tab, setTab] = useState<'announcements' | 'challenges'>('announcements')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('community_posts')
      .select('*')
      .eq('coach_id', user.id)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (data) setPosts(data as Post[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  async function handleSave(title: string, content: string, audience: 'all' | 'specific', pinned: boolean) {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { data } = await supabase
      .from('community_posts')
      .insert({ coach_id: user.id, title, content, audience, pinned })
      .select()
      .single()

    if (data) {
      setPosts((prev) => pinned ? [data as Post, ...prev] : [...prev.filter((p) => p.pinned), data as Post, ...prev.filter((p) => !p.pinned)])
    }
    setSaving(false)
    setShowModal(false)
  }

  async function handleDelete(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id))
    await supabase.from('community_posts').delete().eq('id', id)
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cb-text">Community</h1>
          <p className="text-sm text-cb-muted mt-0.5">Post announcements and run challenges with your clients</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand/90 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} /> New Post
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface-light rounded-lg p-1 w-fit">
        {(['announcements', 'challenges'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize',
              tab === t ? 'bg-surface text-cb-text shadow-sm' : 'text-cb-secondary hover:text-cb-text'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'announcements' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="text-brand animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-surface border border-cb-border rounded-xl p-16 text-center">
              <Users2 size={40} className="mx-auto text-cb-muted mb-3" />
              <p className="text-cb-muted text-sm">No posts yet. Click "New Post" to get started.</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-surface border border-cb-border rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {post.pinned && <Pin size={14} className="text-brand flex-shrink-0" />}
                    <h3 className="font-semibold text-cb-text truncate">{post.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <span className="text-xs text-cb-muted">{formatDate(post.created_at)}</span>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-cb-muted hover:text-red-500 transition-colors p-1"
                      title="Delete post"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-cb-secondary leading-relaxed mb-4">{post.content}</p>
                <div className="flex items-center gap-4 text-xs text-cb-muted">
                  <span className={clsx(
                    'px-2 py-0.5 rounded-full text-[10px] font-medium',
                    post.audience === 'all' ? 'bg-brand/10 text-brand' : 'bg-surface-light text-cb-secondary'
                  )}>
                    {post.audience === 'all' ? 'All clients' : 'Specific'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart size={12} /> {post.likes_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={12} /> {post.comments_count}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'challenges' && (
        <div className="bg-surface border border-cb-border rounded-xl p-16 text-center">
          <Trophy size={40} className="mx-auto text-cb-muted mb-3" />
          <p className="text-cb-muted text-sm">Challenges coming soon.</p>
        </div>
      )}

      {showModal && (
        <NewPostModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  )
}
