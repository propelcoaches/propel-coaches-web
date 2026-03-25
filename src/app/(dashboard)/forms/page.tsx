'use client'

import { useState } from 'react'
import { FileText, Plus, X, ChevronDown, ChevronUp, Eye, Trash2, Send, GripVertical, Calendar, ToggleLeft, ToggleRight, Edit2 } from 'lucide-react'
import { useIsDemo } from '@/lib/demo/useDemoMode'
import clsx from 'clsx'

type QuestionType = 'short_text' | 'long_text' | 'number' | 'scale' | 'yes_no' | 'progress_photo' | 'metric'

type Question = {
  id: string
  label: string
  type: QuestionType
  required: boolean
}

type FormKind = 'check_in' | 'questionnaire'

type Form = {
  id: string
  name: string
  kind: FormKind
  questions: Question[]
  responses: number
  lastSent: string | null
  status: 'active' | 'draft'
  schedule: 'weekly' | 'biweekly' | 'monthly' | null
}

type Response = {
  id: string
  formId: string
  respondent: string
  date: string
  answers: Record<string, string>
}

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

const DEMO_CHECK_INS: Form[] = [
  {
    id: 'form-1',
    name: 'Weekly Check-In',
    kind: 'check_in',
    questions: [
      { id: 'q1', label: 'How would you rate your energy levels this week? (1-10)', type: 'scale', required: true },
      { id: 'q2', label: 'How many workouts did you complete?', type: 'number', required: true },
      { id: 'q3', label: 'Did you hit your nutrition targets most days?', type: 'yes_no', required: true },
      { id: 'q4', label: 'Rate your sleep quality this week (1-10)', type: 'scale', required: true },
      { id: 'q5', label: 'Any wins or highlights this week?', type: 'long_text', required: false },
      { id: 'q6', label: 'Any struggles or challenges?', type: 'long_text', required: false },
      { id: 'q7', label: 'Progress photos', type: 'progress_photo', required: false },
      { id: 'q8', label: 'Current bodyweight', type: 'metric', required: true },
    ],
    responses: 12,
    lastSent: '2026-03-22',
    status: 'active',
    schedule: 'weekly',
  },
  {
    id: 'form-2',
    name: 'Biweekly Progress Check',
    kind: 'check_in',
    questions: [
      { id: 'q1', label: 'How do you feel about your progress overall? (1-10)', type: 'scale', required: true },
      { id: 'q2', label: 'Describe any physical changes you have noticed', type: 'long_text', required: true },
      { id: 'q3', label: 'Are you still happy with your programme?', type: 'yes_no', required: true },
      { id: 'q4', label: 'Progress photos (front, side, back)', type: 'progress_photo', required: true },
    ],
    responses: 6,
    lastSent: '2026-03-15',
    status: 'active',
    schedule: 'biweekly',
  },
]

const DEMO_QUESTIONNAIRES: Form[] = [
  {
    id: 'form-3',
    name: 'Initial Intake Form',
    kind: 'questionnaire',
    questions: [
      { id: 'q1', label: 'Full name', type: 'short_text', required: true },
      { id: 'q2', label: 'Date of birth', type: 'short_text', required: true },
      { id: 'q3', label: 'What are your main fitness goals?', type: 'long_text', required: true },
      { id: 'q4', label: 'Current training frequency (days/week)', type: 'number', required: true },
      { id: 'q5', label: 'Do you have any injuries or medical conditions?', type: 'yes_no', required: true },
      { id: 'q6', label: 'Please describe any injuries or conditions', type: 'long_text', required: false },
      { id: 'q7', label: 'Dietary preferences or restrictions', type: 'short_text', required: false },
      { id: 'q8', label: 'How would you rate your current fitness level? (1-10)', type: 'scale', required: true },
    ],
    responses: 4,
    lastSent: '2026-03-01',
    status: 'active',
    schedule: null,
  },
  {
    id: 'form-4',
    name: 'Injury & Health History',
    kind: 'questionnaire',
    questions: [
      { id: 'q1', label: 'Do you have any current injuries?', type: 'yes_no', required: true },
      { id: 'q2', label: 'List any past surgeries or medical procedures', type: 'long_text', required: false },
      { id: 'q3', label: 'Are you currently on any medications?', type: 'yes_no', required: true },
      { id: 'q4', label: 'Any movements that cause discomfort?', type: 'long_text', required: false },
    ],
    responses: 3,
    lastSent: '2026-02-10',
    status: 'draft',
    schedule: null,
  },
]

const DEMO_RESPONSES: Response[] = [
  {
    id: 'resp-1',
    formId: 'form-1',
    respondent: 'Liam Carter',
    date: '2026-03-22',
    answers: { q1: '8', q2: '4', q3: 'Yes', q4: '7', q5: 'Hit a new squat PR!', q6: 'Felt tired Thursday', q8: '84.2' },
  },
  {
    id: 'resp-2',
    formId: 'form-3',
    respondent: 'Sophie Nguyen',
    date: '2026-03-01',
    answers: { q1: 'Sophie Nguyen', q2: '14 March 1992', q3: 'Lose body fat, get lean for summer', q4: '4', q5: 'Yes', q6: 'Minor lower back tightness', q7: 'High protein, no dairy', q8: '6' },
  },
]

function genId() { return 'q-' + Math.random().toString(36).slice(2) }

const SCHEDULE_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
}

export default function FormsPage() {
  const isDemo = useIsDemo()
  const [checkIns, setCheckIns] = useState<Form[]>(isDemo ? DEMO_CHECK_INS : [])
  const [questionnaires, setQuestionnaires] = useState<Form[]>(isDemo ? DEMO_QUESTIONNAIRES : [])
  const [responses] = useState<Response[]>(isDemo ? DEMO_RESPONSES : [])
  const [activeTab, setActiveTab] = useState<'check_ins' | 'questionnaires'>('check_ins')
  const [showBuilder, setShowBuilder] = useState(false)
  const [builderKind, setBuilderKind] = useState<FormKind>('check_in')
  const [builderName, setBuilderName] = useState('')
  const [builderSchedule, setBuilderSchedule] = useState<'weekly' | 'biweekly' | 'monthly' | null>(null)
  const [builderQuestions, setBuilderQuestions] = useState<Question[]>([])
  const [expandedResponse, setExpandedResponse] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState<Form | null>(null)

  const allForms = [...checkIns, ...questionnaires]

  function addQuestion() {
    setBuilderQuestions(prev => [...prev, { id: genId(), label: '', type: 'short_text', required: false }])
  }

  function updateQuestion(id: string, updates: Partial<Question>) {
    setBuilderQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q))
  }

  function removeQuestion(id: string) {
    setBuilderQuestions(prev => prev.filter(q => q.id !== id))
  }

  function saveForm() {
    if (!builderName.trim()) return
    const newForm: Form = {
      id: 'form-' + Date.now(),
      name: builderName.trim(),
      kind: builderKind,
      questions: builderQuestions,
      responses: 0,
      lastSent: null,
      status: 'draft',
      schedule: builderSchedule,
    }
    if (builderKind === 'check_in') {
      setCheckIns(prev => [...prev, newForm])
    } else {
      setQuestionnaires(prev => [...prev, newForm])
    }
    setShowBuilder(false)
    setBuilderName('')
    setBuilderQuestions([])
    setBuilderSchedule(null)
  }

  function openNewBuilder(kind: FormKind) {
    setBuilderKind(kind)
    setBuilderName('')
    setBuilderQuestions([])
    setBuilderSchedule(null)
    setShowBuilder(true)
  }

  // ── Form Builder ─────────────────────────────────────────────────────────────
  if (showBuilder) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-cb-text">
              {builderKind === 'check_in' ? 'New Check-In Form' : 'New Questionnaire'}
            </h1>
            <p className="text-sm text-cb-muted mt-0.5">Build your form by adding questions below</p>
          </div>
          <button onClick={() => setShowBuilder(false)} className="text-cb-muted hover:text-cb-secondary">
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
              value={builderName}
              onChange={e => setBuilderName(e.target.value)}
              placeholder={builderKind === 'check_in' ? 'e.g. Weekly Check-In' : 'e.g. Initial Intake Form'}
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-cb-teal"
            />
          </div>
          {builderKind === 'check_in' && (
            <div>
              <label className="block text-xs font-medium text-cb-muted mb-2">Schedule</label>
              <div className="flex gap-2">
                {[
                  { value: null, label: 'No schedule' },
                  { value: 'weekly' as const, label: 'Weekly' },
                  { value: 'biweekly' as const, label: 'Biweekly' },
                  { value: 'monthly' as const, label: 'Monthly' },
                ].map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => setBuilderSchedule(opt.value)}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      builderSchedule === opt.value
                        ? 'bg-cb-teal text-white border-cb-teal'
                        : 'border-cb-border text-cb-secondary hover:border-cb-teal/50'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="space-y-3 mb-4">
          {builderQuestions.length === 0 && (
            <div className="bg-surface border border-dashed border-cb-border rounded-xl py-12 text-center">
              <p className="text-sm text-cb-muted">No questions yet. Add your first question below.</p>
            </div>
          )}
          {builderQuestions.map((q, idx) => (
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
                  <div className="flex items-center gap-3">
                    <select
                      value={q.type}
                      onChange={e => updateQuestion(q.id, { type: e.target.value as QuestionType })}
                      className="flex-1 px-3 py-1.5 bg-surface-light border border-cb-border rounded-lg text-xs text-cb-secondary focus:outline-none focus:ring-2 focus:ring-cb-teal"
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
            onClick={() => setShowBuilder(false)}
            className="px-4 py-2 text-sm text-cb-secondary border border-cb-border rounded-lg hover:bg-surface-light transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveForm}
            disabled={!builderName.trim()}
            className="px-6 py-2 text-sm bg-cb-teal hover:bg-cb-teal/90 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            Save Form
          </button>
        </div>
      </div>
    )
  }

  // ── Form Preview ─────────────────────────────────────────────────────────────
  if (showPreview) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button onClick={() => setShowPreview(null)} className="text-sm text-cb-muted hover:text-cb-secondary mb-4 transition-colors flex items-center gap-1">
          ← Back to Forms
        </button>
        <div className="bg-surface border border-cb-border rounded-xl p-6">
          <h2 className="text-xl font-bold text-cb-text mb-1">{showPreview.name}</h2>
          <p className="text-sm text-cb-muted mb-6">Preview — client-facing view</p>
          <div className="space-y-5">
            {showPreview.questions.map((q, i) => (
              <div key={q.id}>
                <label className="block text-sm font-medium text-cb-text mb-2">
                  {i + 1}. {q.label} {q.required && <span className="text-cb-danger">*</span>}
                </label>
                {q.type === 'long_text' && (
                  <textarea rows={3} placeholder="Your answer..."
                    className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none resize-none" readOnly />
                )}
                {(q.type === 'short_text' || q.type === 'metric') && (
                  <input type="text" placeholder="Your answer..."
                    className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none" readOnly />
                )}
                {q.type === 'number' && (
                  <input type="number" placeholder="0"
                    className="w-32 px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none" readOnly />
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
                    <p className="text-xs text-cb-muted">📷 Upload photos</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Main Forms List ───────────────────────────────────────────────────────────
  const displayForms = activeTab === 'check_ins' ? checkIns : questionnaires

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cb-text">Forms</h1>
          <p className="text-sm text-cb-muted mt-0.5">Manage check-in forms and questionnaires</p>
        </div>
        <button
          onClick={() => openNewBuilder(activeTab === 'check_ins' ? 'check_in' : 'questionnaire')}
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
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Forms list */}
      {displayForms.length === 0 ? (
        <div className="bg-surface border border-cb-border rounded-xl py-16 text-center">
          <FileText size={36} className="mx-auto text-cb-muted mb-3" />
          <p className="text-sm text-cb-muted mb-4">
            No {activeTab === 'check_ins' ? 'check-in forms' : 'questionnaires'} yet.
          </p>
          <button
            onClick={() => openNewBuilder(activeTab === 'check_ins' ? 'check_in' : 'questionnaire')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cb-teal hover:bg-cb-teal/90 text-white rounded-xl text-sm font-medium"
          >
            <Plus size={14} /> Create your first {activeTab === 'check_ins' ? 'check-in' : 'questionnaire'}
          </button>
        </div>
      ) : (
        <div className="bg-surface border border-cb-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cb-border bg-surface-light">
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">Form Name</th>
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">Questions</th>
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">Schedule</th>
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">Responses</th>
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">Last Sent</th>
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cb-border">
              {displayForms.map(form => (
                <tr key={form.id} className="hover:bg-surface-light/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-cb-text">{form.name}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-cb-secondary">{form.questions.length} questions</span>
                  </td>
                  <td className="px-5 py-4">
                    {form.schedule ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cb-teal/10 text-cb-teal border border-cb-teal/20">
                        <Calendar size={10} /> {SCHEDULE_LABELS[form.schedule]}
                      </span>
                    ) : (
                      <span className="text-xs text-cb-muted">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-cb-secondary">{form.responses}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-cb-muted">
                      {form.lastSent ? new Date(form.lastSent).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium',
                      form.status === 'active' ? 'bg-cb-success/15 text-cb-success' : 'bg-surface-light text-cb-muted'
                    )}>
                      {form.status === 'active' ? 'Active' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => setShowPreview(form)}
                        className="p-1.5 text-cb-muted hover:text-cb-secondary hover:bg-surface-light rounded-lg transition-colors"
                        title="Preview"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="p-1.5 text-cb-muted hover:text-cb-teal hover:bg-cb-teal/10 rounded-lg transition-colors"
                        title="Send"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent responses */}
      {responses.filter(r => displayForms.some(f => f.id === r.formId)).length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-cb-text mb-3">Recent Responses</h2>
          <div className="space-y-2">
            {responses.filter(r => displayForms.some(f => f.id === r.formId)).map(resp => {
              const form = allForms.find(f => f.id === resp.formId)
              const isExpanded = expandedResponse === resp.id
              return (
                <div key={resp.id} className="bg-surface border border-cb-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedResponse(isExpanded ? null : resp.id)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-surface-light transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-cb-teal/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-cb-teal">{resp.respondent.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-cb-text">{resp.respondent}</p>
                        <p className="text-xs text-cb-muted">{form?.name} · {new Date(resp.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={15} className="text-cb-muted" /> : <ChevronDown size={15} className="text-cb-muted" />}
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-cb-border">
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        {form?.questions.map(q => (
                          <div key={q.id}>
                            <p className="text-xs font-medium text-cb-muted mb-0.5">{q.label}</p>
                            <p className="text-sm text-cb-text">{resp.answers[q.id] ?? '—'}</p>
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
    </div>
  )
}
