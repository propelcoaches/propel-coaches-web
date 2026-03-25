'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface CoachTag {
  id: string;
  name: string;
  color: string;
  description: string | null;
  client_count: number;
  created_at: string;
}

interface Segment {
  id: string;
  name: string;
  description: string | null;
  filters: {
    tags?: string[];
    status?: string;
    goal?: string;
    last_checkin_days?: number;
  };
  is_smart: boolean;
  created_at: string;
}

interface Client {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  tags: string[];
  created_at: string;
}

const TAG_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

export default function TagsPage() {
  const supabase = createClientComponentClient();

  const [tags, setTags] = useState<CoachTag[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tags' | 'segments'>('tags');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Tag form
  const [showTagForm, setShowTagForm] = useState(false);
  const [tagForm, setTagForm] = useState({ name: '', color: TAG_COLORS[0], description: '' });
  const [editingTagId, setEditingTagId] = useState<string | null>(null);

  // Segment form
  const [showSegmentForm, setShowSegmentForm] = useState(false);
  const [segmentForm, setSegmentForm] = useState({
    name: '',
    description: '',
    filter_tags: [] as string[],
    filter_status: '',
    filter_last_checkin_days: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [tagsRes, segmentsRes, clientsRes] = await Promise.all([
      supabase.from('coach_tags').select('*').order('name'),
      supabase.from('client_segments').select('*').order('name'),
      supabase.from('profiles').select('id, full_name, email, avatar_url, tags, created_at').eq('role', 'client'),
    ]);
    if (tagsRes.data) setTags(tagsRes.data);
    if (segmentsRes.data) setSegments(segmentsRes.data as Segment[]);
    if (clientsRes.data) setClients(clientsRes.data as Client[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Tag CRUD
  const saveTag = async () => {
    if (!tagForm.name.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingTagId) {
      const { data } = await supabase.from('coach_tags')
        .update({ name: tagForm.name.trim(), color: tagForm.color, description: tagForm.description.trim() || null })
        .eq('id', editingTagId).select().single();
      if (data) setTags((prev) => prev.map((t) => t.id === data.id ? data : t));
    } else {
      const clientCount = clients.filter((c) => c.tags?.includes(tagForm.name.trim())).length;
      const { data } = await supabase.from('coach_tags')
        .insert({ coach_id: user.id, name: tagForm.name.trim(), color: tagForm.color, description: tagForm.description.trim() || null, client_count: clientCount })
        .select().single();
      if (data) setTags((prev) => [...prev, data]);
    }

    setShowTagForm(false);
    setEditingTagId(null);
    setTagForm({ name: '', color: TAG_COLORS[0], description: '' });
  };

  const deleteTag = async (id: string) => {
    if (!confirm('Delete this tag? Clients will keep their tags.')) return;
    await supabase.from('coach_tags').delete().eq('id', id);
    setTags((prev) => prev.filter((t) => t.id !== id));
  };

  const editTag = (tag: CoachTag) => {
    setTagForm({ name: tag.name, color: tag.color, description: tag.description || '' });
    setEditingTagId(tag.id);
    setShowTagForm(true);
  };

  // Toggle tag on a client
  const toggleClientTag = async (clientId: string, tagName: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    const currentTags = client.tags || [];
    const newTags = currentTags.includes(tagName)
      ? currentTags.filter((t) => t !== tagName)
      : [...currentTags, tagName];

    await supabase.from('profiles').update({ tags: newTags }).eq('id', clientId);
    setClients((prev) => prev.map((c) => c.id === clientId ? { ...c, tags: newTags } : c));

    // Update count
    const count = clients.filter((c) => {
      const t = c.id === clientId ? newTags : (c.tags || []);
      return t.includes(tagName);
    }).length;
    const tag = tags.find((t) => t.name === tagName);
    if (tag) {
      await supabase.from('coach_tags').update({ client_count: count }).eq('id', tag.id);
      setTags((prev) => prev.map((t) => t.id === tag.id ? { ...t, client_count: count } : t));
    }
  };

  // Segment CRUD
  const saveSegment = async () => {
    if (!segmentForm.name.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const filters: Segment['filters'] = {};
    if (segmentForm.filter_tags.length > 0) filters.tags = segmentForm.filter_tags;
    if (segmentForm.filter_status) filters.status = segmentForm.filter_status;
    if (segmentForm.filter_last_checkin_days) filters.last_checkin_days = parseInt(segmentForm.filter_last_checkin_days);

    const { data } = await supabase.from('client_segments').insert({
      coach_id: user.id,
      name: segmentForm.name.trim(),
      description: segmentForm.description.trim() || null,
      filters,
      is_smart: true,
    }).select().single();

    if (data) setSegments((prev) => [...prev, data as Segment]);
    setShowSegmentForm(false);
    setSegmentForm({ name: '', description: '', filter_tags: [], filter_status: '', filter_last_checkin_days: '' });
  };

  const deleteSegment = async (id: string) => {
    if (!confirm('Delete this segment?')) return;
    await supabase.from('client_segments').delete().eq('id', id);
    setSegments((prev) => prev.filter((s) => s.id !== id));
  };

  // Filter clients by selected tag
  const filteredClients = selectedTag
    ? clients.filter((c) => (c.tags || []).includes(selectedTag))
    : clients;

  // Get segment client count
  const getSegmentClientCount = (segment: Segment) => {
    return clients.filter((c) => {
      const tags = c.tags || [];
      if (segment.filters.tags && segment.filters.tags.length > 0) {
        if (!segment.filters.tags.some((t) => tags.includes(t))) return false;
      }
      return true;
    }).length;
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tags & Segments</h1>
          <p className="text-gray-500 text-sm mt-1">Organize clients with tags and create smart segments</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {(['tags', 'segments'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}>{tab}</button>
        ))}
      </div>

      {activeTab === 'tags' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tags list */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Tags</h2>
              <button onClick={() => { setShowTagForm(true); setEditingTagId(null); setTagForm({ name: '', color: TAG_COLORS[0], description: '' }); }}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">+ Add Tag</button>
            </div>

            {showTagForm && (
              <div className="bg-white rounded-xl border p-4 mb-3">
                <input type="text" value={tagForm.name} onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                  placeholder="Tag name" className="w-full border rounded-lg px-3 py-2 text-sm mb-2" />
                <input type="text" value={tagForm.description} onChange={(e) => setTagForm({ ...tagForm, description: e.target.value })}
                  placeholder="Description (optional)" className="w-full border rounded-lg px-3 py-2 text-sm mb-2" />
                <div className="flex gap-1 mb-3">
                  {TAG_COLORS.map((c) => (
                    <button key={c} onClick={() => setTagForm({ ...tagForm, color: c })}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${tagForm.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={saveTag} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Save</button>
                  <button onClick={() => setShowTagForm(false)} className="px-3 py-1.5 text-gray-500 text-sm">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <button onClick={() => setSelectedTag(null)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedTag === null ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-600'
                }`}>
                All Clients ({clients.length})
              </button>
              {tags.map((tag) => (
                <div key={tag.id}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer group ${
                    selectedTag === tag.name ? 'bg-indigo-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTag(selectedTag === tag.name ? null : tag.name)}>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="font-medium text-gray-900">{tag.name}</span>
                    <span className="text-gray-400 text-xs">{tag.client_count}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); editTag(tag); }} className="text-xs text-gray-400 hover:text-gray-600">Edit</button>
                    <button onClick={(e) => { e.stopPropagation(); deleteTag(tag.id); }} className="text-xs text-red-400 hover:text-red-600">Del</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clients with tag management */}
          <div className="lg:col-span-2">
            <h2 className="font-semibold text-gray-900 mb-3">
              {selectedTag ? `Clients tagged "${selectedTag}"` : 'All Clients'} ({filteredClients.length})
            </h2>
            <div className="space-y-2">
              {filteredClients.map((client) => (
                <div key={client.id} className="bg-white rounded-xl border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                      {client.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{client.full_name}</p>
                      <p className="text-xs text-gray-500">{client.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(client.tags || []).map((tag) => {
                      const tagDef = tags.find((t) => t.name === tag);
                      return (
                        <button key={tag} onClick={() => toggleClientTag(client.id, tag)}
                          className="px-2.5 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: tagDef?.color || '#6b7280' }}>
                          {tag} ×
                        </button>
                      );
                    })}
                    <div className="relative group">
                      <button className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200">+</button>
                      <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg p-2 hidden group-hover:block z-10 w-40">
                        {tags
                          .filter((t) => !(client.tags || []).includes(t.name))
                          .map((t) => (
                            <button key={t.id} onClick={() => toggleClientTag(client.id, t.name)}
                              className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-50 rounded flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                              {t.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Segments tab */
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Smart Segments</h2>
            <button onClick={() => setShowSegmentForm(true)}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">+ New Segment</button>
          </div>

          {showSegmentForm && (
            <div className="bg-white rounded-xl border p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <input type="text" value={segmentForm.name} onChange={(e) => setSegmentForm({ ...segmentForm, name: e.target.value })}
                  placeholder="Segment name" className="border rounded-lg px-3 py-2 text-sm" />
                <input type="text" value={segmentForm.description} onChange={(e) => setSegmentForm({ ...segmentForm, description: e.target.value })}
                  placeholder="Description" className="border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="mb-3">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Filter by tags:</label>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <button key={t.id}
                      onClick={() => setSegmentForm({
                        ...segmentForm,
                        filter_tags: segmentForm.filter_tags.includes(t.name)
                          ? segmentForm.filter_tags.filter((x) => x !== t.name)
                          : [...segmentForm.filter_tags, t.name],
                      })}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                        segmentForm.filter_tags.includes(t.name)
                          ? 'text-white border-transparent' : 'text-gray-600 border-gray-300'
                      }`}
                      style={segmentForm.filter_tags.includes(t.name) ? { backgroundColor: t.color } : {}}>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={saveSegment} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Create Segment</button>
                <button onClick={() => setShowSegmentForm(false)} className="px-4 py-2 text-gray-500 text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="grid gap-3">
            {segments.map((seg) => (
              <div key={seg.id} className="bg-white rounded-xl border p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{seg.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700 font-medium">
                      {getSegmentClientCount(seg)} clients
                    </span>
                    {seg.is_smart && <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">Smart</span>}
                  </div>
                  {seg.description && <p className="text-sm text-gray-500 mt-1">{seg.description}</p>}
                  {seg.filters.tags && (
                    <div className="flex gap-1 mt-2">
                      {seg.filters.tags.map((t) => {
                        const tagDef = tags.find((x) => x.name === t);
                        return (
                          <span key={t} className="px-2 py-0.5 rounded-full text-xs text-white"
                            style={{ backgroundColor: tagDef?.color || '#6b7280' }}>{t}</span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button onClick={() => deleteSegment(seg.id)} className="text-sm text-red-400 hover:text-red-600">Delete</button>
              </div>
            ))}
            {segments.length === 0 && (
              <p className="text-center text-gray-500 py-8">No segments yet. Create one to organize your clients.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
