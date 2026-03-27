'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Plus, FileText, Video, ImageIcon, Link, Download, MoreHorizontal, X, Upload, Users, Filter, AlertCircle, Loader2, Check } from 'lucide-react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'

type ResourceType = 'PDF' | 'Video' | 'Image' | 'Link' | 'Document'
type Client = { id: string; name: string | null; email: string }

type Resource = {
  id: string
  coach_id: string
  title: string
  description: string | null
  resource_type: ResourceType
  url: string | null
  file_path: string | null
  file_size_bytes: number | null
  duration_secs: number | null
  tags: string[]
  assigned_client_ids: string[]
  created_at: string
}

const FILE_TYPES: (ResourceType | 'All')[] = ['All', 'PDF', 'Video', 'Image', 'Link', 'Document']

function typeIcon(type: ResourceType) {
  switch (type) {
    case 'PDF': return <FileText size={14} className="text-red-400" />
    case 'Video': return <Video size={14} className="text-cb-teal" />
    case 'Image': return <ImageIcon size={14} className="text-yellow-400" />
    case 'Link': return <Link size={14} className="text-purple-400" />
    case 'Document': return <FileText size={14} className="text-cb-secondary" />
  }
}

function typeBadgeClass(type: ResourceType) {
  switch (type) {
    case 'PDF': return 'bg-red-500/10 text-red-400'
    case 'Video': return 'bg-cb-teal/10 text-cb-teal'
    case 'Image': return 'bg-yellow-500/10 text-yellow-400'
    case 'Link': return 'bg-purple-500/10 text-purple-400'
    case 'Document': return 'bg-surface-light text-cb-secondary'
  }
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Add Resource Modal ──────────────────────────────────────────────────────

function AddResourceModal({ clients, onClose, onAdd }: {
  clients: Client[]
  onClose: () => void
  onAdd: (resource: Resource) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<ResourceType>('PDF')
  const [url, setUrl] = useState('')
  const [tags, setTags] = useState('')
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadedFile, setUploadedFile] = useState<{ path: string; url: string; size: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function toggleClient(id: string) {
    setSelectedClientIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleFileUpload(file: File) {
    setUploading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('resources')
        .upload(path, file, { upsert: false })
      if (uploadErr) throw uploadErr

      const { data: urlData } = supabase.storage.from('resources').getPublicUrl(path)
      setUploadedFile({ path, url: urlData.publicUrl, size: file.size })
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error: err } = await supabase
        .from('resources')
        .insert({
          coach_id: user.id,
          title: title.trim(),
          description: description || null,
          resource_type: type,
          url: uploadedFile?.url ?? (url || null),
          file_path: uploadedFile?.path ?? null,
          file_size_bytes: uploadedFile?.size ?? null,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          assigned_client_ids: selectedClientIds,
        })
        .select()
        .single()

      if (err) throw err
      onAdd(data as Resource)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save resource')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-surface border border-cb-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-cb-border">
          <h2 className="text-lg font-semibold text-cb-text">Add Resource</h2>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-text transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-cb-danger/10 border border-cb-danger/30 rounded-lg">
              <AlertCircle size={14} className="text-cb-danger flex-shrink-0" />
              <p className="text-xs text-cb-danger">{error}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Resource title..."
              className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:ring-2 focus:ring-cb-teal" />
          </div>
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." rows={2}
              className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:ring-2 focus:ring-cb-teal resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-cb-secondary mb-1">Type</label>
              <select value={type} onChange={e => setType(e.target.value as ResourceType)}
                className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:ring-2 focus:ring-cb-teal">
                {(['PDF', 'Video', 'Image', 'Link', 'Document'] as ResourceType[]).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-cb-secondary mb-1">Tags (comma separated)</label>
              <input value={tags} onChange={e => setTags(e.target.value)} placeholder="nutrition, beginner..."
                className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:ring-2 focus:ring-cb-teal" />
            </div>
          </div>

          {/* File / URL */}
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">
              {type === 'Link' ? 'URL' : 'File'}
            </label>
            {type === 'Link' ? (
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..."
                className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:ring-2 focus:ring-cb-teal" />
            ) : uploadedFile ? (
              <div className="flex items-center gap-2 p-3 bg-cb-teal/10 border border-cb-teal/30 rounded-xl">
                <Check size={14} className="text-cb-teal flex-shrink-0" />
                <span className="text-sm text-cb-teal truncate flex-1">File uploaded ({formatBytes(uploadedFile.size)})</span>
                <button onClick={() => setUploadedFile(null)} className="text-cb-muted hover:text-cb-danger"><X size={14} /></button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste URL or upload file..."
                  className="flex-1 bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:ring-2 focus:ring-cb-teal" />
                <input ref={fileInputRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-surface-light border border-cb-border rounded-xl text-cb-secondary text-sm hover:text-cb-text transition-colors disabled:opacity-50">
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  Upload
                </button>
              </div>
            )}
          </div>

          {/* Client assignment */}
          {clients.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-cb-secondary mb-2">Assign to Clients</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {clients.map(c => (
                  <button key={c.id} onClick={() => toggleClient(c.id)}
                    className={clsx('px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                      selectedClientIds.includes(c.id)
                        ? 'bg-cb-teal text-white border-cb-teal'
                        : 'bg-surface-light border-cb-border text-cb-secondary hover:border-cb-teal'
                    )}>
                    {c.name ?? c.email}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 p-6 pt-0 border-t border-cb-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-cb-secondary hover:text-cb-text transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!title.trim() || saving || uploading}
            className="flex items-center gap-2 px-4 py-2 bg-cb-teal text-white rounded-xl text-sm font-medium hover:bg-cb-teal/90 transition-colors disabled:opacity-50">
            {saving && <Loader2 size={13} className="animate-spin" />}
            Add Resource
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Assign Modal ────────────────────────────────────────────────────────────

function AssignModal({ resource, clients, onClose, onSave }: {
  resource: Resource
  clients: Client[]
  onClose: () => void
  onSave: (ids: string[]) => void
}) {
  const [selected, setSelected] = useState<string[]>(resource.assigned_client_ids)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('resources')
        .update({ assigned_client_ids: selected })
        .eq('id', resource.id)
      if (error) throw error
      onSave(selected)
    } catch {
      // keep modal open on failure
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-surface border border-cb-border rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-cb-border">
          <div>
            <h2 className="font-semibold text-cb-text">Assign Resource</h2>
            <p className="text-xs text-cb-muted mt-0.5">{resource.title}</p>
          </div>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-text transition-colors"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-2 max-h-64 overflow-y-auto">
          {clients.length === 0 && <p className="text-sm text-cb-muted text-center py-4">No clients yet.</p>}
          {clients.map(c => (
            <label key={c.id} className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={selected.includes(c.id)} onChange={() => setSelected(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])}
                className="accent-cb-teal w-4 h-4" />
              <span className="text-sm text-cb-text group-hover:text-cb-teal transition-colors">{c.name ?? c.email}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-cb-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-cb-secondary hover:text-cb-text transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-cb-teal text-white rounded-xl text-sm font-medium hover:bg-cb-teal/90 disabled:opacity-50 transition-colors">
            {saving && <Loader2 size={13} className="animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'All'>('All')
  const [showAddModal, setShowAddModal] = useState(false)
  const [assignResource, setAssignResource] = useState<Resource | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const [resRes, clientRes] = await Promise.all([
        supabase.from('resources').select('*').eq('coach_id', user.id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, name, email').eq('role', 'client').order('name'),
      ])

      if (resRes.error) throw resRes.error
      if (clientRes.error) throw clientRes.error

      setResources((resRes.data ?? []) as Resource[])
      setClients((clientRes.data ?? []) as Client[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resources')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(resource: Resource) {
    setDeletingId(resource.id)
    setOpenMenu(null)
    try {
      const supabase = createClient()
      if (resource.file_path) {
        await supabase.storage.from('resources').remove([resource.file_path])
      }
      const { error } = await supabase.from('resources').delete().eq('id', resource.id)
      if (error) throw error
      setResources(prev => prev.filter(r => r.id !== resource.id))
    } catch {
      load()
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = resources.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = r.title.toLowerCase().includes(q) ||
      (r.description ?? '').toLowerCase().includes(q) ||
      r.tags.some(t => t.toLowerCase().includes(q))
    return matchSearch && (typeFilter === 'All' || r.resource_type === typeFilter)
  })

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cb-text">Resources</h1>
          <p className="text-cb-secondary text-sm mt-0.5">Manage and share resources with your clients</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cb-teal text-white rounded-xl text-sm font-medium hover:bg-cb-teal/90 transition-colors">
          <Plus size={16} /> Add Resource
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-cb-danger/10 border border-cb-danger/30 rounded-xl mb-5">
          <AlertCircle size={16} className="text-cb-danger flex-shrink-0" />
          <p className="text-sm text-cb-danger flex-1">{error}</p>
          <button onClick={load} className="text-sm text-cb-danger underline">Retry</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Resources', value: resources.length },
          { label: 'Assigned', value: resources.filter(r => r.assigned_client_ids.length > 0).length },
          { label: 'File Types', value: Array.from(new Set(resources.map(r => r.resource_type))).length },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-cb-border rounded-xl p-4">
            <p className="text-2xl font-bold text-cb-text">{loading ? '…' : s.value}</p>
            <p className="text-sm text-cb-secondary mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cb-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources..."
            className="w-full bg-surface border border-cb-border rounded-xl pl-9 pr-4 py-2 text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-cb-teal" />
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Filter size={15} className="text-cb-muted" />
          {FILE_TYPES.map(t => (
            <button key={t} onClick={() => setTypeFilter(t as ResourceType | 'All')}
              className={clsx('px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border',
                typeFilter === t ? 'bg-cb-teal text-white border-cb-teal' : 'bg-surface border-cb-border text-cb-secondary hover:border-cb-teal'
              )}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-surface border border-cb-border rounded-xl p-4 space-y-3 animate-pulse">
              <div className="h-4 w-16 bg-surface-light rounded-full" />
              <div className="h-4 w-3/4 bg-surface-light rounded" />
              <div className="h-3 w-full bg-surface-light rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <FileText size={40} className="mx-auto mb-3 text-cb-muted" />
          <p className="font-medium text-cb-text mb-1">
            {resources.length === 0 ? 'No resources yet' : 'No resources match your search'}
          </p>
          <p className="text-sm text-cb-muted mb-4">
            {resources.length === 0 ? 'Upload PDFs, videos, links, and documents to share with clients.' : 'Try adjusting your filters.'}
          </p>
          {resources.length === 0 && (
            <button onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cb-teal text-white rounded-xl text-sm font-medium hover:bg-cb-teal/90">
              <Plus size={14} /> Add your first resource
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(r => {
            const assignedClients = r.assigned_client_ids.map(id => clientMap[id]).filter(Boolean)
            return (
              <div key={r.id} className="bg-surface border border-cb-border rounded-xl p-4 flex flex-col gap-3 hover:border-cb-teal/40 transition-colors relative">
                <div className="flex items-start justify-between gap-2">
                  <div className={clsx('flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', typeBadgeClass(r.resource_type))}>
                    {typeIcon(r.resource_type)} {r.resource_type}
                  </div>
                  <div className="relative">
                    <button onClick={() => setOpenMenu(openMenu === r.id ? null : r.id)}
                      className="p-1 rounded-lg text-cb-muted hover:text-cb-text hover:bg-surface-light transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                    {openMenu === r.id && (
                      <div className="absolute right-0 top-7 z-20 bg-surface border border-cb-border rounded-xl shadow-2xl w-44 py-1">
                        <button onClick={() => { setAssignResource(r); setOpenMenu(null) }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-cb-text hover:bg-surface-light transition-colors">
                          <Users size={14} /> Assign to Clients
                        </button>
                        {r.url && (
                          <button onClick={() => { window.open(r.url!, '_blank'); setOpenMenu(null) }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-cb-text hover:bg-surface-light transition-colors">
                            <Download size={14} /> Open / Download
                          </button>
                        )}
                        <div className="h-px bg-cb-border mx-2 my-1" />
                        <button onClick={() => handleDelete(r)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-cb-danger hover:bg-surface-light transition-colors">
                          {deletingId === r.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-cb-text text-sm">{r.title}</h3>
                  {r.description && <p className="text-xs text-cb-secondary mt-1 line-clamp-2">{r.description}</p>}
                </div>
                {r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {r.tags.map(tag => <span key={tag} className="px-2 py-0.5 rounded-full bg-surface-light text-cb-muted text-xs">{tag}</span>)}
                  </div>
                )}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-cb-border">
                  <span className="text-xs text-cb-muted">
                    {formatBytes(r.file_size_bytes) || new Date(r.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {assignedClients.length > 0 ? (
                    <div className="flex items-center gap-1 text-xs text-cb-secondary">
                      <Users size={12} /> {assignedClients.length} client{assignedClients.length !== 1 ? 's' : ''}
                    </div>
                  ) : (
                    <button onClick={() => setAssignResource(r)} className="text-xs text-cb-teal hover:underline">
                      Assign clients
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAddModal && (
        <AddResourceModal
          clients={clients}
          onClose={() => setShowAddModal(false)}
          onAdd={r => { setResources(prev => [r, ...prev]); setShowAddModal(false) }}
        />
      )}
      {assignResource && (
        <AssignModal
          resource={assignResource}
          clients={clients}
          onClose={() => setAssignResource(null)}
          onSave={ids => {
            setResources(prev => prev.map(r => r.id === assignResource.id ? { ...r, assigned_client_ids: ids } : r))
            setAssignResource(null)
          }}
        />
      )}

      {/* Click outside to close menu */}
      {openMenu && <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />}
    </div>
  )
}
