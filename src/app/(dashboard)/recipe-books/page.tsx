'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, BookOpen, Search, ChevronRight, Sparkles, X, MoreHorizontal, Clock, Flame, Users } from 'lucide-react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'

type Recipe = {
  id: string
  name: string
  description: string
  prep_time: number
  calories: number
  protein_g: number
  carbs_g: number
  fats_g: number
  ingredients: string[]
  steps: string[]
  tags: string[]
}

type RecipeBook = {
  id: string
  name: string
  description: string
  diet_type: string
  created_at: string
  recipes: Recipe[]
}

const DIET_TYPES = ['All', 'High Protein', 'Balanced', 'Low Calorie', 'Keto', 'Vegan']

function MacroBadge({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className={clsx('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', color)}>
      <span>{value}g</span>
      <span className="opacity-60">{label}</span>
    </div>
  )
}

function RecipeCard({ recipe, onDelete }: { recipe: Recipe; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="bg-surface-light rounded-xl border border-cb-border overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-semibold text-cb-text text-sm">{recipe.name}</h4>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-1 rounded-lg text-cb-muted hover:text-cb-text hover:bg-surface transition-colors">
              <MoreHorizontal size={14} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-6 z-20 bg-surface border border-cb-border rounded-xl shadow-2xl w-36 py-1">
                <div className="h-px bg-cb-border mx-2 my-1" />
                <button onClick={() => { onDelete(); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-surface-light transition-colors">
                  <X size={12} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-cb-secondary mb-3">{recipe.description}</p>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1 text-xs text-cb-muted">
            <Clock size={12} /> {recipe.prep_time} min
          </div>
          <div className="flex items-center gap-1 text-xs text-cb-muted">
            <Flame size={12} /> {recipe.calories} kcal
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          <MacroBadge value={Math.round(recipe.protein_g)} label="P" color="bg-brand/10 text-brand" />
          <MacroBadge value={Math.round(recipe.carbs_g)} label="C" color="bg-amber-500/10 text-amber-400" />
          <MacroBadge value={Math.round(recipe.fats_g)} label="F" color="bg-red-500/10 text-red-400" />
        </div>
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs text-brand hover:underline">
          {expanded ? 'Hide details' : 'View recipe'}
          <ChevronRight size={12} className={clsx('transition-transform', expanded ? 'rotate-90' : '')} />
        </button>
      </div>
      {expanded && (
        <div className="border-t border-cb-border p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-cb-secondary mb-1.5">Ingredients</p>
            <ul className="space-y-1">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-cb-text">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                  {ing}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-cb-secondary mb-1.5">Method</p>
            <ol className="space-y-1">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-cb-text">
                  <span className="text-cb-muted shrink-0 w-4">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recipe.tags.map(tag => <span key={tag} className="px-2 py-0.5 rounded-full bg-surface text-cb-muted text-xs">{tag}</span>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

type NewBookModalProps = { onClose: () => void; onAdd: (name: string, description: string, dietType: string) => Promise<void> }
function NewBookModal({ onClose, onAdd }: NewBookModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dietType, setDietType] = useState('Balanced')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!name.trim()) return
    setSaving(true)
    await onAdd(name.trim(), description.trim(), dietType)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-cb-border">
          <h2 className="text-lg font-semibold text-cb-text">New Recipe Book</h2>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-text transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">Name</label>
            <input className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand" placeholder="e.g. High Protein Meals" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">Description</label>
            <textarea className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand resize-none h-16" placeholder="What is this recipe book for?" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">Diet Type</label>
            <select className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand" value={dietType} onChange={e => setDietType(e.target.value)}>
              {['High Protein', 'Balanced', 'Low Calorie', 'Keto', 'Vegan'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 pt-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-cb-secondary hover:text-cb-text transition-colors">Cancel</button>
          <button onClick={submit} disabled={!name.trim() || saving} className="px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50">
            {saving ? 'Creating…' : 'Create Book'}
          </button>
        </div>
      </div>
    </div>
  )
}

type AIRecipeModalProps = { bookId: string; onClose: () => void; onAdded: (recipe: Recipe) => void }
function AIRecipeModal({ bookId, onClose, onAdded }: AIRecipeModalProps) {
  const supabase = useMemo(() => createClient(), [])
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    if (!prompt.trim()) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), book_id: bookId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate recipe')
      onAdded(data.recipe)
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-cb-border">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-brand" />
            <h2 className="text-lg font-semibold text-cb-text">AI Recipe Generator</h2>
          </div>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-text transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6">
          <p className="text-sm text-cb-secondary mb-4">Describe what you want and AI will generate a recipe with macro breakdown.</p>
          <textarea
            className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-3 text-cb-text text-sm focus:outline-none focus:border-brand resize-none h-24"
            placeholder='e.g. "High protein lunch under 500 calories, no dairy, suitable for meal prep..."'
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
          />
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 p-6 pt-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-cb-secondary hover:text-cb-text transition-colors">Cancel</button>
          <button onClick={generate} disabled={!prompt.trim() || generating} className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50">
            {generating ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
            ) : (
              <><Sparkles size={14} /> Generate Recipe</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RecipeBooksPage() {
  const supabase = useMemo(() => createClient(), [])
  const [books, setBooks] = useState<RecipeBook[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dietFilter, setDietFilter] = useState('All')
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [aiBookId, setAiBookId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('recipe_books')
        .select(`
          id, name, description, diet_type, created_at,
          recipes(id, name, description, prep_time, calories, protein_g, carbs_g, fats_g, ingredients, steps, tags)
        `)
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false })
      const loaded = (data ?? []).map((b: any) => ({
        id: b.id, name: b.name, description: b.description, diet_type: b.diet_type, created_at: b.created_at,
        recipes: b.recipes ?? [],
      }))
      setBooks(loaded)
      if (loaded.length > 0) setSelectedBookId(loaded[0].id)
      setLoading(false)
    }
    load()
  }, [supabase])

  const filteredBooks = books.filter(b => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase())
    const matchDiet = dietFilter === 'All' || b.diet_type === dietFilter
    return matchSearch && matchDiet
  })

  const activeBook = books.find(b => b.id === selectedBookId)

  async function handleAddBook(name: string, description: string, dietType: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('recipe_books')
      .insert({ coach_id: user.id, name, description, diet_type: dietType })
      .select()
      .single()
    if (error || !data) return
    const newBook: RecipeBook = { id: data.id, name: data.name, description: data.description, diet_type: data.diet_type, created_at: data.created_at, recipes: [] }
    setBooks(prev => [newBook, ...prev])
    setSelectedBookId(newBook.id)
  }

  function handleRecipeAdded(recipe: Recipe) {
    setBooks(prev => prev.map(b => b.id === aiBookId ? { ...b, recipes: [...b.recipes, recipe] } : b))
  }

  async function handleDeleteRecipe(bookId: string, recipeId: string) {
    await supabase.from('recipes').delete().eq('id', recipeId)
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, recipes: b.recipes.filter(r => r.id !== recipeId) } : b))
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-cb-muted text-sm">Loading recipe books…</p>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <div className="w-72 shrink-0 border-r border-cb-border bg-surface h-full overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-cb-border">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-bold text-cb-text">Recipe Books</h1>
            <button onClick={() => setShowNewModal(true)} className="p-1.5 rounded-lg bg-brand text-white hover:bg-brand-light transition-colors">
              <Plus size={16} />
            </button>
          </div>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cb-muted" />
            <input className="w-full bg-surface-light border border-cb-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-cb-text placeholder-cb-muted focus:outline-none focus:border-brand" placeholder="Search books..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1">
            {DIET_TYPES.map(t => (
              <button key={t} onClick={() => setDietFilter(t)} className={clsx('px-2 py-0.5 rounded-full text-xs font-medium border transition-colors', dietFilter === t ? 'bg-brand text-white border-brand' : 'bg-surface-light border-cb-border text-cb-secondary hover:border-brand')}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 p-2">
          {filteredBooks.length === 0 ? (
            <p className="text-xs text-cb-muted px-2 py-4">{books.length === 0 ? 'No recipe books yet' : 'No books match'}</p>
          ) : (
            filteredBooks.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBookId(b.id)}
                className={clsx('w-full text-left p-3 rounded-xl mb-1 transition-colors', selectedBookId === b.id ? 'bg-brand/10 border border-brand/30' : 'hover:bg-surface-light border border-transparent')}
              >
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen size={14} className={selectedBookId === b.id ? 'text-brand' : 'text-cb-muted'} />
                  <span className={clsx('text-sm font-medium truncate', selectedBookId === b.id ? 'text-brand' : 'text-cb-text')}>{b.name}</span>
                </div>
                <span className="text-xs text-cb-muted">{b.recipes.length} recipe{b.recipes.length !== 1 ? 's' : ''}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-y-auto">
        {activeBook ? (
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-cb-text">{activeBook.name}</h2>
                  <span className="px-2 py-0.5 rounded-full bg-surface-light border border-cb-border text-cb-secondary text-xs">{activeBook.diet_type}</span>
                </div>
                <p className="text-cb-secondary text-sm">{activeBook.description}</p>
              </div>
              <button onClick={() => setAiBookId(activeBook.id)} className="flex items-center gap-2 px-3 py-2 bg-surface border border-cb-border rounded-xl text-sm text-cb-secondary hover:text-brand hover:border-brand transition-colors">
                <Sparkles size={14} /> AI Generate
              </button>
            </div>

            {activeBook.recipes.length === 0 ? (
              <div className="text-center py-16 text-cb-muted">
                <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
                <p className="font-medium">No recipes yet</p>
                <p className="text-sm mt-1">Use AI to generate recipes for this book</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeBook.recipes.map(recipe => (
                  <RecipeCard key={recipe.id} recipe={recipe} onDelete={() => handleDeleteRecipe(activeBook.id, recipe.id)} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-cb-muted">
            <div className="text-center">
              <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
              <p>{books.length === 0 ? 'Create your first recipe book' : 'Select a recipe book'}</p>
            </div>
          </div>
        )}
      </div>

      {showNewModal && <NewBookModal onClose={() => setShowNewModal(false)} onAdd={handleAddBook} />}
      {aiBookId && <AIRecipeModal bookId={aiBookId} onClose={() => setAiBookId(null)} onAdded={handleRecipeAdded} />}
    </div>
  )
}
