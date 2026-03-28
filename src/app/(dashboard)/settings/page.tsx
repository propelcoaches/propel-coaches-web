'use client'

import { useState, KeyboardEvent, useEffect } from 'react'
import { User, Bell, Shield, CreditCard, Palette, ChevronRight, Bot, X, Dumbbell, UtensilsCrossed, ClipboardCheck, HeartPulse, ListTodo, BookOpen, MessageSquare, TrendingUp } from 'lucide-react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'

interface ClientFeatures {
  training: boolean
  nutrition: boolean
  check_ins: boolean
  habits: boolean
  tasks: boolean
  resources: boolean
  messaging: boolean
  progress: boolean
}

const FEATURES_DISPLAY = [
  { key: 'training' as const, label: 'Training / Workouts', icon: Dumbbell },
  { key: 'nutrition' as const, label: 'Nutrition Plans', icon: UtensilsCrossed },
  { key: 'check_ins' as const, label: 'Check-ins', icon: ClipboardCheck },
  { key: 'habits' as const, label: 'Habits', icon: HeartPulse },
  { key: 'tasks' as const, label: 'Tasks', icon: ListTodo },
  { key: 'resources' as const, label: 'Resources', icon: BookOpen },
  { key: 'messaging' as const, label: 'Messaging', icon: MessageSquare },
  { key: 'progress' as const, label: 'Progress Tracking', icon: TrendingUp },
]

const SECTIONS = [
  {
    id: 'client_access',
    label: 'Default Client Access',
    icon: Shield,
    description: 'These defaults apply to newly invited clients. You can customize access for each client in their profile.',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    description: 'Your name, bio, and contact details',
    fields: [
      { label: 'Full Name',          placeholder: 'Your Name',                    type: 'text' },
      { label: 'Business Name',      placeholder: 'Your Business Name',           type: 'text' },
      { label: 'Email',              placeholder: 'coach@example.com',            type: 'email' },
      { label: 'Phone',              placeholder: '+61 400 000 000',              type: 'tel' },
    ],
    textareas: [
      { label: 'Bio', placeholder: 'Tell clients a bit about your coaching philosophy…', rows: 3 },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'When and how you hear about client activity',
    toggles: [
      { label: 'Client logs a workout',    desc: 'Get notified when a client completes a session' },
      { label: 'Weekly check-in received', desc: 'Get notified when a client submits their check-in' },
      { label: 'Client hasn\'t logged in', desc: 'Alert after 7 days of inactivity' },
    ],
  },
  {
    id: 'ai_voice',
    label: 'AI Voice',
    icon: Bot,
    description: 'Help the AI speak in your voice when covering for you.',
  },
]

const TONE_SUGGESTIONS = ['direct', 'encouraging', 'no fluff', 'data-driven', 'motivating', 'tough love', 'supportive', 'evidence-based']

function inputCls() {
  return 'w-full px-3 py-2.5 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand/40 transition-colors'
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('client_access')
  const [saved, setSaved] = useState(false)
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    'Client logs a workout': true,
    'Weekly check-in received': true,
    "Client hasn't logged in": false,
  })

  // Client Access state
  const [clientFeatures, setClientFeatures] = useState<ClientFeatures>({
    training: true,
    nutrition: true,
    check_ins: true,
    habits: true,
    tasks: true,
    resources: true,
    messaging: true,
    progress: true,
  })
  const [profession, setProfession] = useState<string | null>(null)
  const [featuresSaving, setFeaturesSaving] = useState(false)
  const [featuresSaved, setFeaturesSaved] = useState(false)
  const [featuresLoading, setFeaturesLoading] = useState(true)

  // Profile state
  const [profileData, setProfileData] = useState({ full_name: '', business_name: '', email: '', phone: '', bio: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Notifications state
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifSaved, setNotifSaved] = useState(false)

  // AI Voice state
  const [aiProfileBio, setAiProfileBio] = useState('')
  const [toneKeywords, setToneKeywords] = useState<string[]>(['direct', 'encouraging'])
  const [tagInput, setTagInput] = useState('')
  const [aiSaving, setAiSaving] = useState(false)
  const [aiSaved, setAiSaved] = useState(false)

  // Load all profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('client_features, profession, full_name, business_name, email, phone, bio, ai_coach_style, tone_keywords, notification_prefs')
          .eq('id', user.id)
          .single()
        if (data?.client_features) setClientFeatures(data.client_features)
        if (data?.profession) setProfession(data.profession)
        if (data) {
          setProfileData({
            full_name: data.full_name || '',
            business_name: data.business_name || '',
            email: data.email || user.email || '',
            phone: data.phone || '',
            bio: data.bio || '',
          })
        }
        if (data?.ai_coach_style) setAiProfileBio(data.ai_coach_style)
        if (data?.tone_keywords) setToneKeywords(data.tone_keywords)
        if (data?.notification_prefs) setToggles(data.notification_prefs)
      }
      setFeaturesLoading(false)
    }
    loadProfile()
  }, [])

  function toggleFeature(key: keyof ClientFeatures) {
    setClientFeatures((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleFeaturesSave() {
    setFeaturesSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ client_features: clientFeatures })
        .eq('id', user.id)
    }
    setFeaturesSaving(false)
    setFeaturesSaved(true)
    setTimeout(() => setFeaturesSaved(false), 2000)
  }

  async function handleProfileSave() {
    setProfileSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({
        full_name: profileData.full_name,
        business_name: profileData.business_name,
        phone: profileData.phone,
        bio: profileData.bio,
      }).eq('id', user.id)
    }
    setProfileSaving(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  async function handleNotifSave() {
    setNotifSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ notification_prefs: toggles }).eq('id', user.id)
    }
    setNotifSaving(false)
    setNotifSaved(true)
    setTimeout(() => setNotifSaved(false), 2000)
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function addTag(tag: string) {
    const trimmed = tag.trim().toLowerCase()
    if (!trimmed || toneKeywords.includes(trimmed) || toneKeywords.length >= 8) return
    setToneKeywords((prev) => [...prev, trimmed])
  }

  function removeTag(tag: string) {
    setToneKeywords((prev) => prev.filter((t) => t !== tag))
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
      setTagInput('')
    }
  }

  async function handleAiSave() {
    setAiSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({
        ai_coach_style: aiProfileBio,
        tone_keywords: toneKeywords,
      }).eq('id', user.id)
    }
    setAiSaving(false)
    setAiSaved(true)
    setTimeout(() => setAiSaved(false), 2000)
  }

  const section = SECTIONS.find((s) => s.id === activeSection)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-cb-text">Settings</h1>
        <div className="h-0.5 w-12 bg-gradient-to-r from-brand to-brand/40 rounded-full mt-1.5 mb-1" />
        <p className="text-sm text-cb-muted mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-52 flex-shrink-0">
          <nav className="space-y-0.5">
            {SECTIONS.map((s) => {
              const Icon = s.icon
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={clsx(
                    'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                    activeSection === s.id
                      ? 'bg-brand/10 text-brand'
                      : 'text-cb-secondary hover:bg-surface-light hover:text-cb-text'
                  )}
                >
                  <Icon size={16} className={activeSection === s.id ? 'text-brand' : 'text-cb-muted'} />
                  {s.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {section && activeSection === 'client_access' && (
            <div className="bg-surface border border-cb-border rounded-xl p-6">
              <div className="mb-6">
                <h2 className="text-base font-semibold text-cb-text">{section.label}</h2>
                <p className="text-sm text-cb-muted mt-0.5">{section.description}</p>
              </div>

              {profession && (
                <div className="mb-6 p-4 bg-surface-light rounded-lg border border-cb-border">
                  <p className="text-xs font-medium text-cb-secondary mb-1">Profession</p>
                  <p className="text-sm text-cb-text capitalize">{profession.replace(/_/g, ' ')}</p>
                </div>
              )}

              {featuresLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-4 h-4 border-2 border-cb-border border-t-brand rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {FEATURES_DISPLAY.map(({ key, label, icon: Icon }) => (
                      <div
                        key={key}
                        onClick={() => toggleFeature(key)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          clientFeatures[key]
                            ? 'border-brand bg-brand/10'
                            : 'border-cb-border bg-surface-light'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <Icon
                              size={20}
                              className={clientFeatures[key] ? 'text-brand' : 'text-cb-muted'}
                            />
                            <span className="text-sm font-medium text-cb-text">{label}</span>
                          </div>
                          <div
                            className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 mt-0.5 ${
                              clientFeatures[key] ? 'bg-brand' : 'bg-cb-border'
                            }`}
                            style={{ height: '22px', width: '40px' }}
                          >
                            <span
                              className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${
                                clientFeatures[key] ? 'translate-x-5' : 'translate-x-0.5'
                              }`}
                              style={{ width: '18px', height: '18px' }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleFeaturesSave}
                      disabled={featuresSaving}
                      className="flex items-center gap-2 px-5 py-2 bg-brand hover:bg-brand/90 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {featuresSaving && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      {featuresSaved ? 'Saved!' : 'Save Changes'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {section && activeSection !== 'ai_voice' && activeSection !== 'client_access' && (
            <div className="bg-surface border border-cb-border rounded-xl p-6">
              <div className="mb-6">
                <h2 className="text-base font-semibold text-cb-text">{section.label}</h2>
                <p className="text-sm text-cb-muted mt-0.5">{section.description}</p>
              </div>

              <div className="space-y-4">
                {section.fields?.map((f) => {
                  const fieldKey = f.label === 'Full Name' ? 'full_name'
                    : f.label === 'Business Name' ? 'business_name'
                    : f.label === 'Email' ? 'email'
                    : f.label === 'Phone' ? 'phone'
                    : null
                  return (
                    <div key={f.label}>
                      <label className="block text-xs font-medium text-cb-secondary mb-1.5">{f.label}</label>
                      <input
                        type={f.type}
                        placeholder={f.placeholder}
                        readOnly={f.label === 'Email'}
                        value={fieldKey ? profileData[fieldKey as keyof typeof profileData] : ''}
                        onChange={fieldKey && f.label !== 'Email' ? (e) => setProfileData(p => ({ ...p, [fieldKey]: e.target.value })) : undefined}
                        className={`${inputCls()} ${f.label === 'Email' ? 'opacity-60 cursor-not-allowed' : ''}`}
                      />
                    </div>
                  )
                })}
                {section.textareas?.map((f) => (
                  <div key={f.label}>
                    <label className="block text-xs font-medium text-cb-secondary mb-1.5">{f.label}</label>
                    <textarea
                      rows={f.rows}
                      placeholder={f.placeholder}
                      value={profileData.bio}
                      onChange={(e) => setProfileData(p => ({ ...p, bio: e.target.value }))}
                      className={`${inputCls()} resize-none`}
                    />
                  </div>
                ))}
                {section.toggles?.map((t) => (
                  <div key={t.label} className="flex items-start justify-between gap-4 py-3 border-b border-cb-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-cb-text">{t.label}</p>
                      <p className="text-xs text-cb-muted mt-0.5">{t.desc}</p>
                    </div>
                    <button
                      onClick={() => setToggles((prev) => ({ ...prev, [t.label]: !prev[t.label] }))}
                      className={clsx(
                        'relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 mt-0.5',
                        toggles[t.label] ? 'bg-brand' : 'bg-cb-border'
                      )}
                      style={{ height: '22px', width: '40px' }}
                    >
                      <span
                        className={clsx(
                          'absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform',
                          toggles[t.label] ? 'translate-x-5' : 'translate-x-0.5'
                        )}
                        style={{ width: '18px', height: '18px' }}
                      />
                    </button>
                  </div>
                ))}
              </div>

              {section.fields && (
                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={handleProfileSave}
                    disabled={profileSaving}
                    className="flex items-center gap-2 px-5 py-2 bg-brand hover:bg-brand/90 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {profileSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {profileSaved ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>
              )}
              {section.toggles && (
                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={handleNotifSave}
                    disabled={notifSaving}
                    className="flex items-center gap-2 px-5 py-2 bg-brand hover:bg-brand/90 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {notifSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {notifSaved ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* AI Voice section */}
          {activeSection === 'ai_voice' && (
            <div className="bg-surface border border-cb-border rounded-xl p-6">
              <div className="mb-6">
                <h2 className="text-base font-semibold text-cb-text">AI Coach Profile</h2>
                <p className="text-sm text-cb-muted mt-0.5">Help the AI speak in your voice when covering for you.</p>
              </div>

              <div className="space-y-6">
                {/* Coaching Style & Tone */}
                <div>
                  <label className="block text-xs font-medium text-cb-secondary mb-1.5">Coaching Style &amp; Tone</label>
                  <textarea
                    rows={5}
                    value={aiProfileBio}
                    onChange={(e) => setAiProfileBio(e.target.value)}
                    placeholder="Describe how you communicate with clients. E.g. 'I'm direct but encouraging. I use Australian slang, keep messages short, and always acknowledge effort before giving feedback. I hate fluff.'"
                    className={`${inputCls()} resize-none`}
                  />
                </div>

                {/* Tone Keywords */}
                <div>
                  <label className="block text-xs font-medium text-cb-secondary mb-1.5">
                    Tone Keywords
                    <span className="ml-2 text-cb-muted font-normal">{toneKeywords.length}/8</span>
                  </label>

                  {/* Tag pills */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {toneKeywords.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-cb-teal/15 text-cb-teal text-xs font-medium rounded-full"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:text-cb-teal/60 transition-colors"
                          aria-label={`Remove ${tag}`}
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Tag input */}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Type a keyword and press Enter or comma…"
                    disabled={toneKeywords.length >= 8}
                    className={`${inputCls()} mb-3`}
                  />

                  {/* Suggestions */}
                  <div className="flex flex-wrap gap-1.5">
                    {TONE_SUGGESTIONS.filter((s) => !toneKeywords.includes(s)).map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => addTag(suggestion)}
                        disabled={toneKeywords.length >= 8}
                        className="px-2.5 py-1 border border-cb-border text-xs text-cb-secondary rounded-full hover:bg-surface-light hover:text-cb-text transition-colors disabled:opacity-40"
                      >
                        + {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sample Messages info box */}
                <div>
                  <label className="block text-xs font-medium text-cb-secondary mb-1.5">Sample Messages</label>
                  <div className="flex gap-3 p-4 bg-blue-500/8 border border-blue-500/20 rounded-lg">
                    <span className="text-base flex-shrink-0">💬</span>
                    <p className="text-xs text-cb-secondary leading-relaxed">
                      We'll automatically pull your last 50 sent messages to help the AI match your writing style. This happens when you first activate AI Mode.
                    </p>
                  </div>
                </div>

                {/* Save button */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleAiSave}
                    disabled={aiSaving}
                    className="flex items-center gap-2 px-5 py-2 bg-brand hover:bg-brand/90 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {aiSaving && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {aiSaved ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
