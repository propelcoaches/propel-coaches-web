'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Template {
  id: string;
  title: string;
  body: string;
  category: string;
  shortcut: string | null;
  use_count: number;
  is_pinned: boolean;
  created_at: string;
}

const CATEGORIES = ['general', 'check-in', 'motivation', 'reminder', 'feedback', 'onboarding'];

const DEFAULT_TEMPLATES = [
  { title: 'Great check-in', body: 'Great check-in, {{client_name}}! Love the consistency. Here\'s my feedback:\n\n', category: 'check-in', shortcut: '/great' },
  { title: 'Missed check-in', body: 'Hey {{client_name}}, I noticed you missed your check-in this week. Everything okay? Let me know if you need any adjustments to the plan.', category: 'reminder', shortcut: '/missed' },
  { title: 'Weight stall', body: 'I see the scale hasn\'t moved much this week — that\'s totally normal! Let\'s look at the bigger picture. Your measurements and progress photos are showing real change.', category: 'feedback', shortcut: '/stall' },
  { title: 'Welcome message', body: 'Welcome to the team, {{client_name}}! 🎉 I\'m excited to work with you. Here\'s what to do first:\n\n1. Complete your profile\n2. Log your first check-in\n3. Start this week\'s workouts\n\nDon\'t hesitate to message me anytime!', category: 'onboarding', shortcut: '/welcome' },
  { title: 'Keep it up', body: 'You\'re crushing it, {{client_name}}! 💪 Keep up the hard work — the results will follow.', category: 'motivation', shortcut: '/crush' },
  { title: 'Program update', body: 'I\'ve updated your program based on your progress. Check the Training tab for your new workouts. Key changes:\n\n', category: 'feedback', shortcut: '/update' },
];

export default function TemplatesPage() {
  const supabase = createClientComponentClient();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Template | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({ title: '', body: '', category: 'general', shortcut: '' });

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('message_templates')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('use_count', { ascending: false });

    if (data && data.length > 0) {
      setTemplates(data);
    } else if (data && data.length === 0) {
      // Seed defaults for new coach
      await seedDefaults();
    }
    setLoading(false);
  }, [supabase]);

  const seedDefaults = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const rows = DEFAULT_TEMPLATES.map((t) => ({ ...t, coach_id: user.id }));
    const { data } = await supabase.from('message_templates').insert(rows).select();
    if (data) setTemplates(data);
  };

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const startNew = () => {
    setForm({ title: '', body: '', category: 'general', shortcut: '' });
    setIsNew(true);
    setEditing({} as Template);
  };

  const startEdit = (t: Template) => {
    setForm({ title: t.title, body: t.body, category: t.category, shortcut: t.shortcut || '' });
    setIsNew(false);
    setEditing(t);
  };

  const save = async () => {
    if (!form.title.trim() || !form.body.trim()) return;

    if (isNew) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('message_templates').insert({
        coach_id: user.id,
        title: form.title.trim(),
        body: form.body.trim(),
        category: form.category,
        shortcut: form.shortcut.trim() || null,
      }).select().single();
      if (data) setTemplates((prev) => [data, ...prev]);
    } else if (editing) {
      const { data } = await supabase.from('message_templates').update({
        title: form.title.trim(),
        body: form.body.trim(),
        category: form.category,
        shortcut: form.shortcut.trim() || null,
        updated_at: new Date().toISOString(),
      }).eq('id', editing.id).select().single();
      if (data) setTemplates((prev) => prev.map((t) => t.id === data.id ? data : t));
    }
    setEditing(null);
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    await supabase.from('message_templates').delete().eq('id', id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const togglePin = async (t: Template) => {
    const { data } = await supabase.from('message_templates')
      .update({ is_pinned: !t.is_pinned })
      .eq('id', t.id).select().single();
    if (data) setTemplates((prev) => prev.map((x) => x.id === data.id ? data : x));
  };

  const filtered = templates.filter((t) => {
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.body.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // ─── Edit/Create Modal ──────────────────────────────────────
  if (editing) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{isNew ? 'New Template' : 'Edit Template'}</h1>
          <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-700">Cancel</button>
        </div>

        <div className="space-y-4 bg-white rounded-xl shadow-sm border p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Great check-in" className="w-full border rounded-lg px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
            <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={6} placeholder="Type your template message... Use {{client_name}} and {{coach_name}} as placeholders."
              className="w-full border rounded-lg px-3 py-2 font-mono text-sm" />
            <p className="text-xs text-gray-400 mt-1">
              Placeholders: {'{{client_name}}'}, {'{{coach_name}}'} will be auto-replaced when used.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border rounded-lg px-3 py-2">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shortcut (optional)</label>
              <input type="text" value={form.shortcut} onChange={(e) => setForm({ ...form, shortcut: e.target.value })}
                placeholder="e.g. /great" className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={save}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
              {isNew ? 'Create Template' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── List View ────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Message Templates</h1>
          <p className="text-gray-500 text-sm mt-1">Canned replies you can insert in 1 tap during chat</p>
        </div>
        <button onClick={startNew}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
          + New Template
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates..." className="border rounded-lg px-3 py-2 text-sm w-64" />
        <div className="flex gap-1">
          {['all', ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setFilterCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                filterCategory === c ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{c}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {t.is_pinned && <span className="text-amber-500 text-xs">📌</span>}
                    <h3 className="font-semibold text-gray-900">{t.title}</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500 capitalize">{t.category}</span>
                    {t.shortcut && (
                      <code className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 text-xs font-mono">{t.shortcut}</code>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1 whitespace-pre-line line-clamp-2">{t.body}</p>
                  <p className="text-xs text-gray-400 mt-1">Used {t.use_count} times</p>
                </div>
                <div className="flex items-center gap-1 ml-4 shrink-0">
                  <button onClick={() => togglePin(t)} className="p-1.5 hover:bg-gray-100 rounded text-sm" title="Pin">
                    {t.is_pinned ? '📌' : '📍'}
                  </button>
                  <button onClick={() => startEdit(t)} className="p-1.5 hover:bg-gray-100 rounded text-sm" title="Edit">
                    ✏️
                  </button>
                  <button onClick={() => deleteTemplate(t.id)} className="p-1.5 hover:bg-red-50 rounded text-sm" title="Delete">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
