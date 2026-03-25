'use client'

import { useState } from 'react'
import { Users2, Plus, X, Heart, MessageCircle, Trophy, Pin } from 'lucide-react'
import { useIsDemo } from '@/lib/demo/useDemoMode'
import clsx from 'clsx'

type Post = {
  id: string
  title: string
  content: string
  author: string
  date: string
  likes: number
  comments: number
  pinned: boolean
  audience: 'all' | 'specific'
}

type Challenge = {
  id: string
  name: string
  description: string
  metric: 'Steps' | 'Workouts' | 'Check-ins' | 'Habit streak'
  startDate: string
  endDate: string
  participants: number
  leaderboard: { name: string; score: number; initials: string }[]
}

const DEMO_POSTS: Post[] = [
  {
    id: 'post-1',
    title: 'Welcome to March — let\'s make it count!',
    content: 'Hey team! March is here and I want to kick it off strong. This month we\'re focusing on consistency over perfection. Remember — one missed workout won\'t derail your progress, but giving up will. Let\'s go!',
    author: 'Your Coach',
    date: '2026-03-01',
    likes: 12,
    comments: 4,
    pinned: true,
    audience: 'all',
  },
  {
    id: 'post-2',
    title: 'Nutrition tip of the week: protein timing',
    content: 'A reminder that spreading your protein across meals matters more than eating it all at once. Aim for 30–40g per meal and prioritise getting some in within 2 hours post-workout. Your muscles will thank you!',
    author: 'Your Coach',
    date: '2026-03-05',
    likes: 8,
    comments: 2,
    pinned: false,
    audience: 'all',
  },
  {
    id: 'post-3',
    title: 'Check-in reminder — Sunday is check-in day!',
    content: 'Just a friendly nudge — Sunday check-ins are due by midnight. Takes less than 5 minutes and helps me give you better feedback. Don\'t skip it, it\'s one of the most powerful tools we have!',
    author: 'Your Coach',
    date: '2026-03-08',
    likes: 6,
    comments: 1,
    pinned: false,
    audience: 'all',
  },
]

const DEMO_CHALLENGES: Challenge[] = [
  {
    id: 'ch-1',
    name: 'March Step Challenge',
    description: 'Hit 8,000 steps every day this month. Whoever logs the most total steps wins!',
    metric: 'Steps',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    participants: 4,
    leaderboard: [
      { name: 'Sophie Nguyen', score: 72400, initials: 'SN' },
      { name: 'Liam Carter', score: 65200, initials: 'LC' },
      { name: 'Emma Thompson', score: 54800, initials: 'ET' },
    ],
  },
  {
    id: 'ch-2',
    name: 'Consistency King/Queen',
    description: 'Complete every assigned workout for 4 weeks straight. No excuses, no days off!',
    metric: 'Workouts',
    startDate: '2026-03-10',
    endDate: '2026-04-06',
    participants: 3,
    leaderboard: [
      { name: 'Jake Wilson', score: 8, initials: 'JW' },
      { name: 'Liam Carter', score: 7, initials: 'LC' },
      { name: 'Sophie Nguyen', score: 7, initials: 'SN' },
    ],
  },
]

function NewPostModal({ onClose, onSave }: { onClose: () => void; onSave: (p: Post) => void }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [audience, setAudience] = useState<'all' | 'specific'>('all')
  const [pinned, setPinned] = useState(false)

  function handleSave() {
    if (!title.trim() || !content.trim()) return
    onSave({
      id: 'post-' + Date.now(),
      title: title.trim(),
      content: content.trim(),
      author: 'Your Coach',
      date: new Date().toISOString().slice(0, 10),
      likes: 0,
      comments: 0,
      pinned,
      audience,
    })
  }

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
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Post title..."
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-1">Content *</label>
            <textarea rows={4} value={content} onChange={e => setContent(e.target.value)} placeholder="Write your announcement..."
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-1">Audience</label>
            <select value={audience} onChange={e => setAudience(e.target.value as 'all' | 'specific')}
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-secondary focus:outline-none focus:ring-2 focus:ring-brand">
              <option value="all">All clients</option>
              <option value="specific">Specific clients</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} className="rounded" />
            <span className="text-sm text-cb-secondary">Pin to top</span>
          </label>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-cb-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-cb-secondary border border-cb-border rounded-lg hover:bg-surface-light transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!title.trim() || !content.trim()}
            className="px-4 py-2 text-sm bg-brand hover:bg-brand-light disabled:opacity-50 text-white rounded-lg font-medium">
            Post
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CommunityPage() {
  const isDemo = useIsDemo()
  const [tab, setTab] = useState<'announcements' | 'challenges'>('announcements')
  const [posts, setPosts] = useState<Post[]>(isDemo ? DEMO_POSTS : [])
  const [challenges] = useState<Challenge[]>(isDemo ? DEMO_CHALLENGES : [])
  const [showModal, setShowModal] = useState(false)

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
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-light text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={15} /> New Post
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface-light rounded-lg p-1 w-fit">
        {(['announcements', 'challenges'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={clsx('px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize',
              tab === t ? 'bg-surface text-cb-text shadow-sm' : 'text-cb-secondary hover:text-cb-text'
            )}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'announcements' && (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-surface border border-cb-border rounded-lg p-16 text-center">
              <Users2 size={40} className="mx-auto text-cb-muted mb-3" />
              <p className="text-cb-muted text-sm">No posts yet. Click &quot;New Post&quot; to get started.</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="bg-surface border border-cb-border rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {post.pinned && <Pin size={14} className="text-brand flex-shrink-0" />}
                    <h3 className="font-semibold text-cb-text">{post.title}</h3>
                  </div>
                  <span className="text-xs text-cb-muted whitespace-nowrap ml-3">{formatDate(post.date)}</span>
                </div>
                <p className="text-sm text-cb-secondary leading-relaxed mb-4">{post.content}</p>
                <div className="flex items-center gap-4 text-xs text-cb-muted">
                  <span className="font-medium text-cb-secondary">{post.author}</span>
                  <button className="flex items-center gap-1 hover:text-cb-danger transition-colors">
                    <Heart size={12} /> {post.likes}
                  </button>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={12} /> {post.comments}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'challenges' && (
        <div className="space-y-5">
          {challenges.length === 0 ? (
            <div className="bg-surface border border-cb-border rounded-lg p-16 text-center">
              <Trophy size={40} className="mx-auto text-cb-muted mb-3" />
              <p className="text-cb-muted text-sm">No challenges yet.</p>
            </div>
          ) : (
            challenges.map(ch => (
              <div key={ch.id} className="bg-surface border border-cb-border rounded-xl p-5">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-cb-text">{ch.name}</h3>
                  <span className="text-xs bg-brand-bg text-brand px-2 py-0.5 rounded-full font-medium">{ch.metric}</span>
                </div>
                <p className="text-sm text-cb-secondary mb-3">{ch.description}</p>
                <div className="flex items-center gap-4 text-xs text-cb-muted mb-4">
                  <span>{ch.participants} participants</span>
                  <span>{new Date(ch.startDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – {new Date(ch.endDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="bg-surface-light rounded-lg p-3">
                  <p className="text-xs font-semibold text-cb-muted uppercase tracking-wider mb-3">Leaderboard</p>
                  <div className="space-y-2">
                    {ch.leaderboard.map((entry, i) => (
                      <div key={entry.name} className="flex items-center gap-3">
                        <span className={clsx('text-sm font-bold w-4', i === 0 ? 'text-cb-warning' : 'text-cb-muted')}>
                          {i + 1}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-brand-bg flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-brand">{entry.initials}</span>
                        </div>
                        <span className="text-sm text-cb-text flex-1">{entry.name}</span>
                        <span className="text-sm font-semibold text-cb-secondary">{entry.score.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <NewPostModal
          onClose={() => setShowModal(false)}
          onSave={p => { setPosts(prev => [p, ...prev]); setShowModal(false) }}
        />
      )}
    </div>
  )
}
