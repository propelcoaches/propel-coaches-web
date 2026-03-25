'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Plus, X, ChevronDown, ChevronUp, Eye, Trash2, Send, GripVertical, Calendar, Edit2, AlertCircle, Loader2, Check } from 'lucide-react'
import clsx from 'clsx'
import {
  getForms, createForm, updateForm, deleteForm, getSubmissions,
  type CheckInForm, type FormSubmission, type Question, type QuestionType, type ScheduleType,
} from '@/lib/forms'

// ─── Constants ────────────────────────────────────────────────────────────────

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short_text: 'Short Text',
  long_text: 'Long Text',
  number: 'Number',
  scale: 'Scale (1-10)',
  yes_no: 'Yes / No',
  progress_photo: 'Progress Photos',
  metric: 'Metric',
}

const QUESTION_TYPE_ICONS: Record<QuestionType, string> = {
  short_text: '📝',
  long_text: '📄',
  number: '🔢',
  scale: '⭐',
  yes_no: '✅',
  progress_photo: '📷',
  metric: '📏',
}

const SCHEDULE_LABELS: Record<ScheduleType, string> = {
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
  daily: 'Daily',
  not_set: 'No schedule',
}

function genId() { return 'q-' + Math.random().toString(36).slice(2, 9) }

// ─── Toast ────────────────────────────────────────────────────────────────────

type Toast = { id: string; message: string; type: 'success' | 'error' }

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  return { toasts, show }
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2">
      {toasts.map(t => (
        <div key={t.id} className={clsx(
          'flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium',
          t.type === 'success' ? 'bg-cb-success text-white' : 'bg-cb-danger text-white'
        )}>
          {t.type === 'success' ? <Check size={15} /> : <AlertCircle size={15} />}
          {t.message}
        </div>
      ))}
    </div>
  )
}

// ─── Form Builder ─────────────────────────────────────────────────────────────

type BuilderProps = {
  formType: 'check_in' | 'questionnaire'
  editing: CheckInForm | null
  onSave: (form: CheckInForm) => void
  onCancel: () => void
  toast: (msg: string, type?: Toast['type']) => void
}

function FormBuilder({ formType, editing, onSave, onCancel, toast }: BuilderProps) {
  const [name, setName] = useState(editing?.name ?? '')
  const [scheduleType, setScheduleType] = useState<ScheduleType>(editing?.schedule_type ?? 'not_set')
  const [questions, setQuestions] = useState<Question[]>(editing?.questions ?? [])
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState('')

  function addQuestion() {
    setQuestions(prev => [...prev, { id: genId(), label: '', type: 'short_text', required: false }])
  }

  function updateQuestion(id: string, updates: Partial<Question>) {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q))
  }

  function removeQuestion(id: string) {
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  async function handleSave() {
    if (!name.trim()) { setNameError('Form name is required'); return }
    setNameError('')
    setSaving(true)
    try {
      let saved: CheckInForm
      if (editing) {
        saved = await updateForm(editing.id, { name: name.trim(), schedule_type: scheduleType, questions })
        toast('Form updated')
      } else {
        saved = await createForm({ name: name.trim(), form_type: formType, schedule_type: scheduleType, questions })
        toast('Form created')
      }
      onSave(saved)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save form', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cb-text">
            {editing ? 'Edit Form' : formType === 'check_in' ? 'New Check-In Form' : 'New Questionnaire'}
          </h1>
          <p className="text-sm text-cb-muted mt-0.5">Build your form by adding questions below</p>
        </div>
        <button onClick={onCancel} className="text-cb-muted hover:text-cb-secondary transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Form details */}
      <div className="bg-surface border border-cb-border rounded-xl p-5 mb-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-cb-muted mb-1">Form Name *</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); if (e.target.value.trim()) setNameError('') }}
            placeholder={formType === 'check_in' ? 'e.g. Weekly Check-In' : 'e.g. Initial Intake Form'}
            className={clsx(
              'w-full px-3 py-2 bg-surface-light border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-cb-teal',
              nameError ? 'border-cb-danger' : 'border-cb-border'
            )}
          />
          {nameError && <p className="text-xs text-cb-danger mt-1">{nameError}</p>}
        </div>

        {formType === 'check_in' && (
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-2">Schedule</label>
            <div className="flex flex-wrap gap-2">
              {(['not_set', 'weekly', 'biweekly', 'monthly'] as ScheduleType[]).map(s => (
                <button
                  key={s}
                  onClick={() => setScheduleType(s)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    scheduleType === s
                      ? 'bg-cb-teal text-white border-cb-teal'
                      : 'border-cb-border text-cb-secondary hover:border-cb-teal/50'
                  )}
                >
                  {SCHEDULE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-3 mb-4">
        {questions.length === 0 && (
          <div className="bg-surface border border-dashed border-cb-border rounded-xl py-12 text-center">
            <p className="text-sm text-cb-muted">No questions yet. Add your first question below.</p>
          </div>
        )}
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-surface border border-cb-border rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-2 pt-2 text-cb-muted flex-shrink-0">
                <GripVertical size={14} className="cursor-grab" />
                <span className="text-xs font-semibold w-5 text-center">{idx + 1}</span>
              </div>
              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  value={q.label}
                  onChange={e => updateQuestion(q.id, { label: e.target.value })}
                  placeholder="Question text..."
                  className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-cb-teal"
                />
                <div className="flex items-center gap-3 flex-wrap">
                  <select
                    value={q.type}
                    onChange={e => updateQuestion(q.id, { type: e.target.value as QuestionType })}
                    className="flex-1 min-w-[160px] px-3 py-1.5 bg-surface-light border border-cb-border rounded-lg text-xs text-cb-secondary focus:outline-none focus:ring-2 focus:ring-cb-teal"
                  >
                    {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map(t => (
                      <option key={t} value={t}>{QUESTION_TYPE_ICONS[t]} {QUESTION_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-cb-muted">Required</span>
                    <button
                      onClick={() => updateQuestion(q.id, { required: !q.required })}
                      className={clsx(
                        'relative inline-flex w-9 h-5 rounded-full transition-colors duration-200',
                        q.required ? 'bg-cb-teal' : 'bg-surface-light border border-cb-border'
                      )}
                    >
                      <span className={clsx(
                        'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
                        q.required ? 'translate-x-4' : 'translate-x-0'
                      )} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeQuestion(q.id)}
                    className="p-1.5 text-cb-muted hover:text-cb-danger rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addQuestion}
        className="flex items-center gap-2 text-sm text-cb-teal hover:text-cb-teal/80 mb-6 transition-colors font-medium"
      >
        <Plus size={14} /> Add Question
      </button>

      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-cb-secondary border border-cb-border rounded-lg hover:bg-surface-light transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 text-sm bg-cb-teal hover:bg-cb-teal/90 disabled:opacity-60 text-white rounded-lg font-medium transition-colors"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? 'Saving…' : editing ? 'Save Changes' : 'Save Form'}
        </button>
      </div>
    </div>
  )
}

// ─── Form Preview ─────────────────────────────────────────────────────────────

function FormPreview({ form, onBack }: { form: CheckInForm; onBack: () => void }) {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={onBack} className="text-sm text-cb-muted hover:text-cb-secondary mb-4 transition-colors flex items-center gap-1">
        ← Back to Forms
      </button>
      <div className="bg-surface border border-cb-border rounded-xl p-6">
        <h2 className="text-xl font-bold text-cb-text mb-1">{form.name}</h2>
        <p className="text-sm text-cb-muted mb-6">Preview — this is how clients will see this form</p>
        {form.questions.length === 0 && (
          <p className="text-sm text-cb-muted text-center py-8">No questions added yet.</p>
        )}
        <div className="space-y-5">
          {form.questions.map((q, i) => (
            <div key={q.id}>
              <label className="block text-sm font-medium text-cb-text mb-2">
                {i + 1}. {q.label || <span className="italic text-cb-muted">Untitled question</span>}
                {q.required && <span className="text-cb-danger ml-1">*</span>}
              </label>
              {q.type === 'long_text' && (
                <textarea rows={3} placeholder="Your answer…"
                  className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted resize-none" readOnly />
              )}
              {(q.type === 'short_text' || q.type === 'metric') && (
                <input type="text" placeholder="Your answer…"
                  className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted" readOnly />
              )}
              {q.type === 'number' && (
                <input type="number" placeholder="0"
                  className="w-32 px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text" readOnly />
              )}
              {q.type === 'scale' && (
                <div className="flex gap-2 flex-wrap">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button key={n} className="w-9 h-9 rounded-lg border border-cb-border bg-surface-light text-sm text-cb-secondary hover:border-cb-teal hover:text-cb-teal transition-colors">
                      {n}
                    </button>
                  ))}
                </div>
              )}
              {q.type === 'yes_no' && (
                <div className="flex gap-3">
                  {['Yes', 'No'].map(opt => (
                    <button key={opt} className="px-5 py-2 border border-cb-border rounded-lg text-sm text-cb-secondary hover:border-cb-teal hover:text-cb-teal transition-colors">
                      {opt}
                    </button>
                  ))}
                </div>
              )}
              {q.type === 'progress_photo' && (
                <div className="border-2 border-dashed border-cb-border rounded-xl p-6 text-center">
                  <p className="text-xs text-cb-muted">📷 Tap to upload photos</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type View = 'list' | 'builder' | 'preview'

export default function FormsPage() {
  const [checkIns, setCheckIns] = useState<CheckInForm[]>([])
  const [questionnaires, setQuestionnaires] = useState<CheckInForm[]>([])
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'check_ins' | 'questionnaires'>('check_ins')
  const [view, setView] = useState<View>('list')
  const [editingForm, setEditingForm] = useState<CheckInForm | null>(null)
  const [previewForm, setPreviewForm] = useState<CheckInForm | null>(null)
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<CheckInForm | null>(null)
  const { toasts, show: showToast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [ci, q, subs] = await Promise.all([
        getForms('check_in'),
        getForms('questionnaire'),
        getSubmissions(),
      ])
      setCheckIns(ci)
      setQuestionnaires(q)
      setSubmissions(subs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load forms')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function handleSaved(saved: CheckInForm) {
    if (saved.form_type === 'check_in') {
      setCheckIns(prev => {
        const idx = prev.findIndex(f => f.id === saved.id)
        return idx >= 0 ? prev.map(f => f.id === saved.id ? saved : f) : [saved, ...prev]
      })
    } else {
      setQuestionnaires(prev => {
        const idx = prev.findIndex(f => f.id === saved.id)
        return idx >= 0 ? prev.map(f => f.id === saved.id ? saved : f) : [saved, ...prev]
      })
    }
    setView('list')
    setEditingForm(null)
  }

  async function handleDelete(form: CheckInForm) {
    setDeletingId(form.id)
    try {
      await deleteForm(form.id)
      if (form.form_type === 'check_in') {
        setCheckIns(prev => prev.filter(f => f.id !== form.id))
      } else {
        setQuestionnaires(prev => prev.filter(f => f.id !== form.id))
      }
      showToast('Form deleted')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete form', 'error')
    } finally {
      setDeletingId(null)
      setConfirmDelete(null)
    }
  }

  async function handleToggleActive(form: CheckInForm) {
    try {
      const updated = await updateForm(form.id, { is_active: !form.is_active })
      handleSaved(updated)
      showToast(updated.is_active ? 'Form activated' : 'Form set to draft')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update form', 'error')
    }
  }

  // ── Builder view ─────────────────────────────────────────────────────────────
  if (view === 'builder') {
    return (
      <>
        <FormBuilder
          formType={editingForm?.form_type ?? (activeTab === 'check_ins' ? 'check_in' : 'questionnaire')}
          editing={editingForm}
          onSave={handleSaved}
          onCancel={() => { setView('list'); setEditingForm(null) }}
          toast={showToast}
        />
        <ToastContainer toasts={toasts} />
      </>
    )
  }

  // ── Preview view ─────────────────────────────────────────────────────────────
  if (view === 'preview' && previewForm) {
    return <FormPreview form={previewForm} onBack={() => { setView('list'); setPreviewForm(null) }} />
  }

  // ── List view ─────────────────────────────────────────────────────────────────
  const displayForms = activeTab === 'check_ins' ? checkIns : questionnaires
  const displaySubmissions = submissions.filter(s =>
    displayForms.some(f => f.id === s.form_id)
  )

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ToastContainer toasts={toasts} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cb-text">Forms</h1>
          <p className="text-sm text-cb-muted mt-0.5">Manage check-in forms and questionnaires</p>
        </div>
        <button
          onClick={() => { setEditingForm(null); setView('builder') }}
          className="flex items-center gap-2 px-4 py-2 bg-cb-teal hover:bg-cb-teal/90 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={15} /> {activeTab === 'check_ins' ? 'Add Check-In' : 'Add Questionnaire'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-cb-border mb-6">
        <nav className="flex gap-0.5">
          {[
            { id: 'check_ins' as const, label: 'Check Ins', count: checkIns.length },
            { id: 'questionnaires' as const, label: 'Questionnaires', count: questionnaires.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === tab.id
                  ? 'border-cb-teal text-cb-teal'
                  : 'border-transparent text-cb-secondary hover:text-cb-text'
              )}
            >
              {tab.label}
              <span className={clsx(
                'px-1.5 py-0.5 rounded text-xs font-semibold',
                activeTab === tab.id ? 'bg-cb-teal/15 text-cb-teal' : 'bg-surface-light text-cb-muted'
              )}>
                {loading ? '…' : tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-cb-danger/10 border border-cb-danger/30 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle size={16} className="text-cb-danger flex-shrink-0" />
          <p className="text-sm text-cb-danger flex-1">{error}</p>
          <button onClick={load} className="text-sm text-cb-danger underline">Retry</button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="bg-surface border border-cb-border rounded-xl overflow-hidden">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-cb-border last:border-0 animate-pulse">
              <div className="h-4 bg-surface-light rounded w-48" />
              <div className="h-4 bg-surface-light rounded w-24 ml-auto" />
              <div className="h-4 bg-surface-light rounded w-16" />
              <div className="h-4 bg-surface-light rounded w-20" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && displayForms.length === 0 && (
        <div className="bg-surface border border-cb-border rounded-xl py-16 text-center">
          <FileText size={36} className="mx-auto text-cb-muted mb-3" />
          <p className="text-sm font-medium text-cb-text mb-1">
            No {activeTab === 'check_ins' ? 'check-in forms' : 'questionnaires'} yet
          </p>
          <p className="text-sm text-cb-muted mb-6">
            {activeTab === 'check_ins'
              ? 'Create a check-in form to send to clients on a regular schedule.'
              : 'Create a questionnaire to collect information from new clients.'}
          </p>
          <button
            onClick={() => { setEditingForm(null); setView('builder') }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cb-teal hover:bg-cb-teal/90 text-white rounded-xl text-sm font-medium"
          >
            <Plus size={14} /> Create your first {activeTab === 'check_ins' ? 'check-in' : 'questionnaire'}
          </button>
        </div>
      )}

      {/* Forms table */}
      {!loading && !error && displayForms.length > 0 && (
        <div className="bg-surface border border-cb-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cb-border bg-surface-light">
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">Form Name</th>
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Questions</th>
                {activeTab === 'check_ins' && (
                  <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3 hidden md:table-cell">Schedule</th>
                )}
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Responses</th>
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cb-border">
              {displayForms.map(form => {
                const submissionCount = submissions.filter(s => s.form_id === form.id).length
                return (
                  <tr key={form.id} className="hover:bg-surface-light/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-cb-text">{form.name}</p>
                      <p className="text-xs text-cb-muted mt-0.5">
                        Created {new Date(form.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-sm text-cb-secondary">{form.questions.length}</span>
                    </td>
                    {activeTab === 'check_ins' && (
                      <td className="px-5 py-4 hidden md:table-cell">
                        {form.schedule_type && form.schedule_type !== 'not_set' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cb-teal/10 text-cb-teal border border-cb-teal/20">
                            <Calendar size={10} /> {SCHEDULE_LABELS[form.schedule_type]}
                          </span>
                        ) : (
                          <span className="text-xs text-cb-muted">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-sm text-cb-secondary">{submissionCount}</span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleActive(form)}
                        className={clsx('text-xs px-2 py-0.5 rounded-full font-medium transition-colors',
                          form.is_active
                            ? 'bg-cb-success/15 text-cb-success hover:bg-cb-success/25'
                            : 'bg-surface-light text-cb-muted hover:bg-surface'
                        )}
                      >
                        {form.is_active ? 'Active' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => { setPreviewForm(form); setView('preview') }}
                          className="p-1.5 text-cb-muted hover:text-cb-secondary hover:bg-surface-light rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => { setEditingForm(form); setView('builder') }}
                          className="p-1.5 text-cb-muted hover:text-cb-teal hover:bg-cb-teal/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(form)}
                          className="p-1.5 text-cb-muted hover:text-cb-danger hover:bg-cb-danger/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          {deletingId === form.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent submissions */}
      {!loading && displaySubmissions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-cb-text mb-3">Recent Responses</h2>
          <div className="space-y-2">
            {displaySubmissions.slice(0, 10).map(sub => {
              const form = displayForms.find(f => f.id === sub.form_id)
              const isExpanded = expandedSubmission === sub.id
              const clientName = sub.client?.full_name ?? sub.client?.email ?? 'Unknown client'
              const initials = clientName.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()
              return (
                <div key={sub.id} className="bg-surface border border-cb-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedSubmission(isExpanded ? null : sub.id)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-surface-light transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-cb-teal/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-cb-teal">{initials}</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-cb-text">{clientName}</p>
                        <p className="text-xs text-cb-muted">
                          {form?.name} · {new Date(sub.submitted_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <span className={clsx(
                        'ml-2 text-xs px-2 py-0.5 rounded-full font-medium',
                        sub.status === 'pending' ? 'bg-amber-500/15 text-amber-400' : 'bg-cb-success/15 text-cb-success'
                      )}>
                        {sub.status === 'pending' ? 'Pending' : 'Reviewed'}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp size={15} className="text-cb-muted" /> : <ChevronDown size={15} className="text-cb-muted" />}
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-cb-border">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        {form?.questions.map(q => (
                          <div key={q.id}>
                            <p className="text-xs font-medium text-cb-muted mb-0.5">{q.label}</p>
                            <p className="text-sm text-cb-text">{String(sub.responses[q.id] ?? '—')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-cb-border rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-bold text-cb-text mb-2">Delete form?</h3>
            <p className="text-sm text-cb-muted mb-5">
              <span className="font-medium text-cb-text">&ldquo;{confirmDelete.name}&rdquo;</span> and all its responses will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 text-sm border border-cb-border rounded-lg text-cb-secondary hover:bg-surface-light transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={!!deletingId}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-cb-danger hover:bg-cb-danger/90 text-white rounded-lg transition-colors disabled:opacity-60"
              >
                {deletingId ? <Loader2 size={14} className="animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
