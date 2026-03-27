'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Library, FileText, Video, Image, Link, Users, X, Search, ChevronRight, MoreHorizontal } from 'lucide-react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'

type CollectionResource = {
  id: string
  title: string
  resource_type: 'PDF' | 'Video' | 'Image' | 'Link' | 'Document'
}

type Collection = {
  id: string
  name: string
  description: string
  resources: CollectionResource[]
  color: string
  created_at: string
}

function typeIcon(type: CollectionResource['resource_type']) {
  const cls = 'shrink-0'
  switch (type) {
    case 'PDF': return <FileText size={13} className={clsx(cls, 'text-red-400')} />
    case 'Video': return <Video size={13} className={clsx(cls, 'text-brand')} />
    case 'Image': return <Image size={13} className={clsx(cls, 'text-yellow-400')} />
    case 'Link': return <Link size={13} className={clsx(cls, 'text-purple-400')} />
    case 'Document': return <FileText size={13} className={clsx(cls, 'text-cb-secondary')} />
  }
}

const COLOR_MAP: Record<string, string> = {
  brand: 'bg-brand/10 border-brand/30 text-brand',
  green: 'bg-green-500/10 border-green-500/30 text-green-400',
  purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
}

const COLOR_DOT: Record<string, string> = {
  brand: 'bg-brand',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
}

type NewCollectionModalProps = {
  onClose: () => void
  onAdd: (name: string, description: string, color: string) => Promise<void>
}

function NewCollectionModal({ onClose, onAdd }: NewCollectionModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('brand')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!name.trim()) return
    setSaving(true)
    await onAdd(name.trim(), description.trim(), color)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b border-cb-border">
          <h2 className="text-lg font-semibold text-cb-text">New Collection</h2>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-text transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">Name</label>
            <input className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand" placeholder="Collection name..." value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">Description</label>
            <textarea className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand resize-none h-16" placeholder="Describe what this collection is for..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-2">Color</label>
            <div className="flex gap-3">
              {Object.entries(COLOR_DOT).map(([key, cls]) => (
                <button key={key} onClick={() => setColor(key)} className={clsx('w-7 h-7 rounded-full transition-all', cls, color === key ? 'ring-2 ring-offset-2 ring-offset-surface ring-cb-border scale-110' : '')} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 pt-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-cb-secondary hover:text-cb-text transition-colors">Cancel</button>
          <button onClick={submit} disabled={!name.trim() || saving} className="px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50">
            {saving ? 'Creating…' : 'Create Collection'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ResourceCollectionsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('resource_collections')
        .select(`
          id, name, description, color, created_at,
          resource_collection_items(
            resources(id, title, resource_type)
          )
        `)
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false })

      setCollections(
        (data ?? []).map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          color: c.color,
          created_at: c.created_at,
          resources: (c.resource_collection_items ?? [])
            .map((item: any) => item.resources)
            .filter(Boolean)
            .map((r: any) => ({ id: r.id, title: r.title, resource_type: r.resource_type })),
        }))
      )
      setLoading(false)
    }
    load()
  }, [supabase])

  const filtered = collections.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase())
  )

  async function handleAdd(name: string, description: string, color: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('resource_collections')
      .insert({ coach_id: user.id, name, description, color })
      .select()
      .single()
    if (error || !data) return
    setCollections(prev => [{ id: data.id, name: data.name, description: data.description, color: data.color, created_at: data.created_at, resources: [] }, ...prev])
  }

  async function handleDelete(collectionId: string) {
    await supabase.from('resource_collections').delete().eq('id', collectionId)
    setCollections(prev => prev.filter(c => c.id !== collectionId))
    setOpenMenu(null)
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-cb-muted text-sm">Loading collections…</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cb-text">Resource Collections</h1>
          <p className="text-cb-secondary text-sm mt-0.5">Bundle resources into curated collections for clients</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-light transition-colors">
          <Plus size={16} /> New Collection
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Collections', value: collections.length },
          { label: 'Total Resources', value: collections.reduce((a, c) => a + c.resources.length, 0) },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-cb-border rounded-xl p-4">
            <p className="text-2xl font-bold text-cb-text">{s.value}</p>
            <p className="text-sm text-cb-secondary mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cb-muted" />
        <input className="w-full bg-surface border border-cb-border rounded-xl pl-9 pr-4 py-2 text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:border-brand" placeholder="Search collections..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-cb-muted">
          <Library size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">{collections.length === 0 ? 'No collections yet' : 'No collections found'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c.id} className={clsx('bg-surface border rounded-xl transition-colors', expanded === c.id ? 'border-brand/40' : 'border-cb-border hover:border-brand/30')}>
              <div className="flex items-center gap-4 p-4">
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center border', COLOR_MAP[c.color] ?? COLOR_MAP.brand)}>
                  <Library size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-cb-text">{c.name}</h3>
                    <span className={clsx('px-2 py-0.5 rounded-full text-xs border', COLOR_MAP[c.color] ?? COLOR_MAP.brand)}>
                      {c.resources.length} item{c.resources.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-sm text-cb-secondary truncate mt-0.5">{c.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="relative">
                    <button onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)} className="p-1 rounded-lg text-cb-muted hover:text-cb-text hover:bg-surface-light transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                    {openMenu === c.id && (
                      <div className="absolute right-0 top-7 z-20 bg-surface border border-cb-border rounded-xl shadow-2xl w-40 py-1">
                        <div className="h-px bg-cb-border mx-2 my-1" />
                        <button onClick={() => handleDelete(c.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-surface-light transition-colors">
                          <X size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setExpanded(expanded === c.id ? null : c.id)} className="p-1 rounded-lg text-cb-muted hover:text-cb-text hover:bg-surface-light transition-colors">
                    <ChevronRight size={16} className={clsx('transition-transform', expanded === c.id ? 'rotate-90' : '')} />
                  </button>
                </div>
              </div>

              {expanded === c.id && (
                <div className="border-t border-cb-border px-4 py-3">
                  {c.resources.length === 0 ? (
                    <p className="text-xs text-cb-muted">No resources in this collection yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {c.resources.map(r => (
                        <div key={r.id} className="flex items-center gap-2 p-2 bg-surface-light rounded-lg">
                          {typeIcon(r.resource_type)}
                          <span className="text-xs text-cb-text truncate">{r.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showNewModal && <NewCollectionModal onClose={() => setShowNewModal(false)} onAdd={handleAdd} />}
    </div>
  )
}
