'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, CreditCard, Tag, Copy, Trash2, AlertCircle, RefreshCw, X, Check } from 'lucide-react'
import clsx from 'clsx'

// ─── Types ────────────────────────────────────────────────────────────────────

type Invoice = {
  id: string
  invoice_number: string
  description: string
  amount_cents: number
  currency: string
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled'
  due_date: string | null
  paid_at: string | null
  created_at: string
  client_id: string | null
  client: { full_name: string } | null
}

type PromoCode = {
  id: string
  code: string
  discount: number
  type: 'percent' | 'fixed'
  duration: string
  max_uses: number | null
  uses: number
  is_active: boolean
}

type PaymentSettings = {
  payment_currency: string
  payment_tax_rate: number
  payment_terms_days: number
}

type Client = {
  id: string
  full_name: string
  email: string
}

type InvoiceFilter = 'all' | 'paid' | 'pending' | 'overdue' | 'draft'
type Tab = 'invoices' | 'settings'

// ─── Toast ────────────────────────────────────────────────────────────────────

function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const show = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }, [])
  return { toast, show }
}

// ─── Revenue chart data ────────────────────────────────────────────────────────

function buildRevenueChart(invoices: Invoice[]) {
  const now = new Date()
  const months: { label: string; key: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      label: d.toLocaleString('default', { month: 'short' }),
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    })
  }
  const data = months.map(({ label, key }) => {
    const amount = invoices
      .filter(inv => inv.status === 'paid' && inv.paid_at?.startsWith(key))
      .reduce((sum, inv) => sum + inv.amount_cents, 0)
    return { month: label, key, amount, isFuture: key > months[4].key }
  })
  return data
}

// ─── New Invoice Modal ─────────────────────────────────────────────────────────

function NewInvoiceModal({
  clients,
  currency,
  onClose,
  onCreated,
}: {
  clients: Client[]
  currency: string
  onClose: () => void
  onCreated: (inv: Invoice) => void
}) {
  const [form, setForm] = useState({
    client_id: '',
    invoice_number: `INV-${String(Date.now()).slice(-4)}`,
    description: '',
    amount: '',
    currency,
    due_date: '',
    status: 'pending' as Invoice['status'],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.description || !form.amount) { setError('Description and amount are required'); return }
    const cents = Math.round(parseFloat(form.amount) * 100)
    if (isNaN(cents) || cents <= 0) { setError('Enter a valid amount'); return }
    setSaving(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error: err } = await supabase
        .from('invoices')
        .insert({
          coach_id: user.id,
          client_id: form.client_id || null,
          invoice_number: form.invoice_number,
          description: form.description,
          amount_cents: cents,
          currency: form.currency,
          due_date: form.due_date || null,
          status: form.status,
        })
        .select('*, client:profiles!invoices_client_id_fkey(full_name)')
        .single()
      if (err) throw err
      onCreated(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create invoice')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-cb-border rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-cb-border">
          <h2 className="text-base font-semibold text-cb-text">New Invoice</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-light text-cb-muted hover:text-cb-text transition-colors"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <p className="text-xs text-cb-danger bg-cb-danger/10 px-3 py-2 rounded-lg">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-cb-muted block mb-1 uppercase tracking-wide">Invoice No</label>
              <input
                type="text"
                value={form.invoice_number}
                onChange={e => setForm(p => ({ ...p, invoice_number: e.target.value }))}
                className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text bg-surface font-mono focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-cb-muted block mb-1 uppercase tracking-wide">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value as Invoice['status'] }))}
                className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-cb-muted block mb-1 uppercase tracking-wide">Client (optional)</label>
            <select
              value={form.client_id}
              onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))}
              className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="">— No client —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-cb-muted block mb-1 uppercase tracking-wide">Description</label>
            <input
              type="text"
              placeholder="Monthly Coaching — April 2026"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text bg-surface placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-cb-muted block mb-1 uppercase tracking-wide">Amount</label>
              <div className="flex items-center border border-cb-border rounded-lg overflow-hidden bg-surface focus-within:ring-2 focus-within:ring-brand">
                <span className="px-3 text-sm text-cb-muted border-r border-cb-border bg-surface-light">$</span>
                <input
                  type="number"
                  placeholder="299.00"
                  value={form.amount}
                  onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                  className="flex-1 px-3 py-2 text-sm text-cb-text bg-surface focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-cb-muted block mb-1 uppercase tracking-wide">Currency</label>
              <select
                value={form.currency}
                onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
                className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="AUD">AUD</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
                <option value="NZD">NZD</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-cb-muted block mb-1 uppercase tracking-wide">Due Date (optional)</label>
            <input
              type="date"
              value={form.due_date}
              onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
              className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-cb-border text-cb-secondary hover:bg-surface-light transition-colors">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-brand text-white hover:bg-brand/90 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Creating…' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const { toast, show: showToast } = useToast()

  // Data state
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [settings, setSettings] = useState<PaymentSettings>({ payment_currency: 'AUD', payment_tax_rate: 0, payment_terms_days: 30 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stripeConnected, setStripeConnected] = useState<boolean | null>(null)

  // UI state
  const [activeTab, setActiveTab] = useState<Tab>('invoices')
  const [invoiceFilter, setInvoiceFilter] = useState<InvoiceFilter>('all')
  const [showNewInvoice, setShowNewInvoice] = useState(false)
  const [showPromoForm, setShowPromoForm] = useState(false)
  const [newPromo, setNewPromo] = useState({ code: '', discount: '', type: 'percent' as 'percent' | 'fixed', duration: '1_month', maxUses: '' })
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)

  // ── Load ────────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Step 1: check profile + Stripe connection
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('payment_currency, payment_tax_rate, payment_terms_days, stripe_account_id')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setSettings({
          payment_currency: profileData.payment_currency ?? 'AUD',
          payment_tax_rate: profileData.payment_tax_rate ?? 0,
          payment_terms_days: profileData.payment_terms_days ?? 30,
        })
      }

      const hasStripe = !!(profileData as any)?.stripe_account_id
      setStripeConnected(hasStripe)

      // Step 2: only fetch payments data if Stripe is connected
      if (!hasStripe) return

      const [invoicesRes, promoRes, clientsRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('*, client:profiles!invoices_client_id_fkey(full_name)')
          .eq('coach_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('promo_codes')
          .select('*')
          .eq('coach_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('role', 'client')
          .eq('coach_id', user.id),
      ])

      if (invoicesRes.error) throw invoicesRes.error
      if (promoRes.error) throw promoRes.error
      if (clientsRes.error) throw clientsRes.error

      setInvoices(invoicesRes.data ?? [])
      setPromoCodes(promoRes.data ?? [])
      setClients(clientsRes.data ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load payments data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Computed ────────────────────────────────────────────────────────────────

  const filteredInvoices = invoiceFilter === 'all' ? invoices : invoices.filter(inv => inv.status === invoiceFilter)

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const paidThisMonth = invoices.filter(inv => inv.status === 'paid' && inv.paid_at?.startsWith(thisMonth)).reduce((s, inv) => s + inv.amount_cents, 0)
  const outstanding = invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue').reduce((s, inv) => s + inv.amount_cents, 0)
  const paidRate = invoices.length > 0 ? Math.round((invoices.filter(inv => inv.status === 'paid').length / invoices.length) * 100) : 0
  const revenueChart = buildRevenueChart(invoices)
  const maxChartAmount = Math.max(...revenueChart.map(d => d.amount), 1)

  // ── Promo code handlers ─────────────────────────────────────────────────────

  const handleCreatePromo = async () => {
    if (!newPromo.code || !newPromo.discount) return
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error: err } = await supabase
        .from('promo_codes')
        .insert({
          coach_id: user.id,
          code: newPromo.code.toUpperCase(),
          discount: parseFloat(newPromo.discount),
          type: newPromo.type,
          duration: newPromo.duration,
          max_uses: newPromo.maxUses ? parseInt(newPromo.maxUses) : null,
        })
        .select()
        .single()
      if (err) throw err
      setPromoCodes(prev => [data, ...prev])
      setNewPromo({ code: '', discount: '', type: 'percent', duration: '1_month', maxUses: '' })
      setShowPromoForm(false)
      showToast('Promo code created')
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to create promo code', 'error')
    }
  }

  const handleTogglePromo = async (id: string) => {
    const promo = promoCodes.find(p => p.id === id)
    if (!promo) return
    const nextActive = !promo.is_active
    setPromoCodes(prev => prev.map(p => p.id === id ? { ...p, is_active: nextActive } : p))
    try {
      const supabase = createClient()
      const { error: err } = await supabase.from('promo_codes').update({ is_active: nextActive }).eq('id', id)
      if (err) throw err
    } catch (e: unknown) {
      setPromoCodes(prev => prev.map(p => p.id === id ? { ...p, is_active: promo.is_active } : p))
      showToast(e instanceof Error ? e.message : 'Failed to update promo code', 'error')
    }
  }

  const handleDeletePromo = async (id: string) => {
    const prev = [...promoCodes]
    setPromoCodes(p => p.filter(x => x.id !== id))
    try {
      const supabase = createClient()
      const { error: err } = await supabase.from('promo_codes').delete().eq('id', id)
      if (err) throw err
      showToast('Promo code deleted')
    } catch (e: unknown) {
      setPromoCodes(prev)
      showToast(e instanceof Error ? e.message : 'Failed to delete promo code', 'error')
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // ── Settings handler ────────────────────────────────────────────────────────

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error: err } = await supabase
        .from('profiles')
        .update({
          payment_currency: settings.payment_currency,
          payment_tax_rate: settings.payment_tax_rate,
          payment_terms_days: settings.payment_terms_days,
        })
        .eq('id', user.id)
      if (err) throw err
      showToast('Settings saved')
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to save settings', 'error')
    } finally {
      setSavingSettings(false)
    }
  }

  // ── Mark invoice as paid ─────────────────────────────────────────────────────

  const handleMarkPaid = async (id: string) => {
    const prev = [...invoices]
    const paidAt = new Date().toISOString()
    setInvoices(p => p.map(inv => inv.id === id ? { ...inv, status: 'paid', paid_at: paidAt } : inv))
    try {
      const supabase = createClient()
      const { error: err } = await supabase.from('invoices').update({ status: 'paid', paid_at: paidAt }).eq('id', id)
      if (err) throw err
      showToast('Invoice marked as paid')
    } catch (e: unknown) {
      setInvoices(prev)
      showToast(e instanceof Error ? e.message : 'Failed to update invoice', 'error')
    }
  }

  const handleDeleteInvoice = async (id: string) => {
    const prev = [...invoices]
    setInvoices(p => p.filter(inv => inv.id !== id))
    try {
      const supabase = createClient()
      const { error: err } = await supabase.from('invoices').delete().eq('id', id)
      if (err) throw err
      showToast('Invoice deleted')
    } catch (e: unknown) {
      setInvoices(prev)
      showToast(e instanceof Error ? e.message : 'Failed to delete invoice', 'error')
    }
  }

  const durationLabel = (d: string) => {
    const map: Record<string, string> = { '1_month': '1 month free', '2_months': '2 months free', '3_months': '3 months free', 'forever': 'Forever' }
    return map[d] ?? d
  }

  const fmt = (cents: number, cur = 'AUD') => `$${(cents / 100).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`

  // ── Loading / Error ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-7 w-32 bg-surface-light rounded animate-pulse" />
            <div className="h-4 w-40 bg-surface-light rounded animate-pulse mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface border border-cb-border rounded-lg p-4 h-20 animate-pulse" />
          ))}
        </div>
        <div className="bg-surface border border-cb-border rounded-lg h-52 animate-pulse mb-6" />
        <div className="bg-surface border border-cb-border rounded-lg h-64 animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-cb-text">Payments</h1>
            <p className="text-sm text-cb-muted mt-0.5">Track revenue and manage billing</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 gap-4 max-w-md mx-auto text-center">
          <div className="w-14 h-14 rounded-full bg-cb-danger/10 flex items-center justify-center">
            <AlertCircle size={28} className="text-cb-danger" />
          </div>
          <div>
            <p className="text-cb-text font-semibold mb-1">Failed to load payments</p>
            <p className="text-cb-secondary text-sm font-mono bg-surface-light border border-cb-border rounded-lg px-3 py-2 mt-2">{error}</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors">
            <RefreshCw size={14} /> Try Again
          </button>
          <p className="text-xs text-cb-muted">
            If this keeps happening, check your Supabase connection and ensure your environment variables are set correctly.
          </p>
        </div>
      </div>
    )
  }

  // ── Stripe not connected ─────────────────────────────────────────────────────
  if (!loading && stripeConnected === false) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-cb-text">Payments</h1>
          <p className="text-sm text-cb-muted mt-0.5">Track revenue and manage billing</p>
        </div>
        <div className="bg-surface border border-cb-border rounded-xl p-10 flex flex-col items-center justify-center text-center gap-5 max-w-lg mx-auto mt-8">
          <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center">
            <CreditCard size={30} className="text-brand" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-cb-text mb-1.5">Start accepting payments</h2>
            <p className="text-sm text-cb-muted leading-relaxed">
              Connect Stripe to send invoices, track revenue, and get paid directly by your clients.
            </p>
          </div>
          <a
            href="/api/stripe/connect"
            className="flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors"
          >
            <CreditCard size={15} />
            Connect Stripe
          </a>
          <p className="text-xs text-cb-muted">
            You can also manage invoices manually without Stripe.{' '}
            <button
              onClick={() => setStripeConnected(true)}
              className="text-brand underline underline-offset-2 hover:no-underline"
            >
              Skip for now
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={clsx(
          'fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all',
          toast.type === 'success' ? 'bg-cb-success text-white' : 'bg-cb-danger text-white'
        )}>
          {toast.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cb-text">Payments</h1>
          <div className="h-0.5 w-12 bg-gradient-to-r from-brand to-brand/40 rounded-full mt-1.5 mb-0.5" />
          <p className="text-sm text-cb-muted mt-0.5">Track revenue and manage billing</p>
        </div>
        <button
          onClick={() => setShowNewInvoice(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors font-medium text-sm"
        >
          <Plus size={16} /> New Invoice
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'This Month (paid)', value: fmt(paidThisMonth, settings.payment_currency) },
          { label: 'Outstanding', value: fmt(outstanding, settings.payment_currency) },
          { label: 'Paid Rate', value: `${paidRate}%` },
          { label: 'Total Invoices', value: invoices.length.toString() },
        ].map(({ label, value }) => (
          <div key={label} className="bg-surface border border-cb-border rounded-lg p-4">
            <p className="text-xs text-cb-muted mb-1">{label}</p>
            <p className="text-xl font-bold text-cb-text">{value}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-surface border border-cb-border rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-cb-text mb-4">Monthly Revenue — last 6 months</h2>
        <div className="flex items-end gap-3 h-36">
          {revenueChart.map(({ month, amount, isFuture }) => {
            const height = amount > 0 ? (amount / maxChartAmount) * 100 : 0
            return (
              <div key={month} className="flex flex-col items-center flex-1">
                <div
                  className={clsx('w-full rounded-t-md transition-colors', amount === 0 ? 'bg-cb-border' : isFuture ? 'bg-brand/30' : 'bg-brand')}
                  style={{ height: Math.max(height, 4) + '%' }}
                  title={`${month}: ${fmt(amount, settings.payment_currency)}`}
                />
                <span className="text-xs text-cb-muted mt-2">{month}</span>
                <span className="text-xs font-medium text-cb-text mt-0.5">${(amount / 100).toFixed(0)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-cb-border">
        {(['invoices', 'settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'px-4 py-3 text-sm font-medium transition-colors border-b-2',
              activeTab === tab
                ? 'border-brand text-cb-text'
                : 'border-transparent text-cb-muted hover:text-cb-secondary'
            )}
          >
            {tab === 'invoices' ? `Invoices (${invoices.length})` : 'Settings'}
          </button>
        ))}
      </div>

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div>
          <div className="mb-4 flex gap-2">
            {(['all', 'pending', 'overdue', 'paid', 'draft'] as const).map(f => (
              <button
                key={f}
                onClick={() => setInvoiceFilter(f)}
                className={clsx(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  invoiceFilter === f
                    ? 'bg-brand text-white'
                    : 'bg-surface border border-cb-border text-cb-secondary hover:bg-surface-light'
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="bg-surface border border-cb-border rounded-lg py-16 text-center">
              <p className="text-cb-muted text-sm mb-3">No invoices yet</p>
              <button
                onClick={() => setShowNewInvoice(true)}
                className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors"
              >
                Create your first invoice
              </button>
            </div>
          ) : (
            <div className="bg-surface border border-cb-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cb-border bg-surface-light">
                    {['Invoice No', 'Client', 'Description', 'Amount', 'Due Date', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-cb-border">
                  {filteredInvoices.map(invoice => (
                    <tr key={invoice.id} className="hover:bg-surface-light">
                      <td className="px-5 py-3 text-sm font-medium text-cb-text font-mono">{invoice.invoice_number}</td>
                      <td className="px-5 py-3 text-sm text-cb-secondary">{invoice.client?.full_name ?? '—'}</td>
                      <td className="px-5 py-3 text-sm text-cb-secondary max-w-xs truncate">{invoice.description}</td>
                      <td className="px-5 py-3 text-sm font-medium text-cb-text whitespace-nowrap">{fmt(invoice.amount_cents, invoice.currency)}</td>
                      <td className="px-5 py-3 text-sm text-cb-secondary">{invoice.due_date ?? '—'}</td>
                      <td className="px-5 py-3 text-sm">
                        <span className={clsx(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold',
                          invoice.status === 'paid' ? 'bg-cb-success/15 text-cb-success'
                            : invoice.status === 'pending' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                            : invoice.status === 'overdue' ? 'bg-cb-danger/15 text-cb-danger'
                            : invoice.status === 'draft' ? 'bg-cb-muted/15 text-cb-muted'
                            : 'bg-cb-muted/15 text-cb-muted'
                        )}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                            <button
                              onClick={() => handleMarkPaid(invoice.id)}
                              className="px-2 py-1 text-xs font-medium rounded-lg bg-cb-success/10 text-cb-success border border-cb-success/30 hover:bg-cb-success/20 transition-colors"
                            >
                              Mark paid
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            className="p-1 rounded text-cb-muted hover:text-cb-danger hover:bg-cb-danger/10 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Stripe banner */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white overflow-hidden relative">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.5)_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>
            <div className="relative z-10">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CreditCard size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">Connect Stripe</h3>
                  <p className="text-sm opacity-90">
                    Connect your Stripe account to accept card payments online. Clients pay directly — you get paid automatically.
                  </p>
                </div>
              </div>
              <button className="px-4 py-2 bg-white text-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-medium text-sm">
                Connect Stripe Account
              </button>
            </div>
          </div>

          {/* Promo Codes */}
          <div className="bg-surface border border-cb-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-brand" />
                <h3 className="text-sm font-semibold text-cb-text">Promo Codes</h3>
              </div>
              <button
                onClick={() => setShowPromoForm(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand text-white hover:bg-brand/90 transition-colors"
              >
                <Plus size={13} /> New code
              </button>
            </div>

            {showPromoForm && (
              <div className="mb-5 p-4 bg-surface-light border border-cb-border rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-cb-muted block mb-1 uppercase tracking-wide">Code</label>
                    <input
                      type="text"
                      placeholder="e.g. LAUNCH50"
                      value={newPromo.code}
                      onChange={e => setNewPromo(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text bg-surface placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-cb-muted block mb-1 uppercase tracking-wide">Discount</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder={newPromo.type === 'percent' ? '50' : '29'}
                        value={newPromo.discount}
                        onChange={e => setNewPromo(p => ({ ...p, discount: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text bg-surface placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                      <select
                        value={newPromo.type}
                        onChange={e => setNewPromo(p => ({ ...p, type: e.target.value as 'percent' | 'fixed' }))}
                        className="px-2 py-2 border border-cb-border rounded-lg text-sm text-cb-text bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
                      >
                        <option value="percent">%</option>
                        <option value="fixed">$</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-cb-muted block mb-1 uppercase tracking-wide">Duration</label>
                    <select
                      value={newPromo.duration}
                      onChange={e => setNewPromo(p => ({ ...p, duration: e.target.value }))}
                      className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      <option value="1_month">1 month free</option>
                      <option value="2_months">2 months free</option>
                      <option value="3_months">3 months free</option>
                      <option value="forever">Forever (ongoing)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-cb-muted block mb-1 uppercase tracking-wide">Max uses (blank = unlimited)</label>
                    <input
                      type="number"
                      placeholder="Unlimited"
                      value={newPromo.maxUses}
                      onChange={e => setNewPromo(p => ({ ...p, maxUses: e.target.value }))}
                      className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text bg-surface placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleCreatePromo}
                    disabled={!newPromo.code || !newPromo.discount}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-brand text-white hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Create code
                  </button>
                  <button
                    onClick={() => setShowPromoForm(false)}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-cb-border text-cb-secondary hover:bg-surface-light transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {promoCodes.length === 0 ? (
              <div className="text-center py-6 text-cb-muted text-sm">
                No promo codes yet. Create one to share with your marketing campaigns.
              </div>
            ) : (
              <div className="space-y-2">
                {promoCodes.map(promo => (
                  <div
                    key={promo.id}
                    className={clsx(
                      'flex items-center gap-3 p-3 rounded-lg border',
                      promo.is_active ? 'border-cb-border bg-surface-light' : 'border-cb-border/50 bg-surface opacity-60'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-cb-text">{promo.code}</span>
                        <span className={clsx(
                          'text-xs px-2 py-0.5 rounded-full font-semibold',
                          promo.is_active ? 'bg-cb-success/15 text-cb-success' : 'bg-cb-muted/20 text-cb-muted'
                        )}>
                          {promo.is_active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <p className="text-xs text-cb-muted mt-0.5">
                        {promo.discount}{promo.type === 'percent' ? '%' : '$'} off · {durationLabel(promo.duration)} · {promo.uses} uses{promo.max_uses ? ` / ${promo.max_uses}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyCode(promo.code)}
                        className="p-1.5 rounded-md text-cb-muted hover:text-cb-text hover:bg-surface transition-colors"
                        title="Copy code"
                      >
                        <Copy size={13} />
                      </button>
                      {copiedCode === promo.code && <span className="text-xs text-cb-success">Copied!</span>}
                      <button
                        onClick={() => handleTogglePromo(promo.id)}
                        className="px-2 py-1 text-xs font-medium rounded-md border border-cb-border text-cb-secondary hover:bg-surface transition-colors"
                      >
                        {promo.is_active ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeletePromo(promo.id)}
                        className="p-1.5 rounded-md text-cb-muted hover:text-cb-danger hover:bg-cb-danger/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoice settings */}
          <div className="bg-surface border border-cb-border rounded-lg p-6">
            <h3 className="text-sm font-semibold text-cb-text mb-4">Invoice Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-cb-muted block mb-2 uppercase tracking-wide">Currency</label>
                <select
                  value={settings.payment_currency}
                  onChange={e => setSettings(s => ({ ...s, payment_currency: e.target.value }))}
                  className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text bg-surface-light focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="AUD">AUD — Australian Dollar</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="GBP">GBP — British Pound</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="NZD">NZD — New Zealand Dollar</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-cb-muted block mb-2 uppercase tracking-wide">Tax Rate (%)</label>
                <input
                  type="number"
                  placeholder="10"
                  value={settings.payment_tax_rate}
                  onChange={e => setSettings(s => ({ ...s, payment_tax_rate: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted bg-surface-light focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-cb-muted block mb-2 uppercase tracking-wide">Payment Terms (days)</label>
                <input
                  type="number"
                  placeholder="30"
                  value={settings.payment_terms_days}
                  onChange={e => setSettings(s => ({ ...s, payment_terms_days: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted bg-surface-light focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand/90 disabled:opacity-60 transition-colors"
              >
                {savingSettings ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Invoice Modal */}
      {showNewInvoice && (
        <NewInvoiceModal
          clients={clients}
          currency={settings.payment_currency}
          onClose={() => setShowNewInvoice(false)}
          onCreated={inv => {
            setInvoices(prev => [inv, ...prev])
            setShowNewInvoice(false)
            showToast('Invoice created')
          }}
        />
      )}
    </div>
  )
}
