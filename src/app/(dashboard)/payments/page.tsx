'use client'

import { useState } from 'react'
import { useIsDemo } from '@/lib/demo/useDemoMode'
import { Plus, CreditCard, Tag, Copy, Trash2 } from 'lucide-react'
import clsx from 'clsx'

const DEMO_INVOICES = [
  {
    id: 'inv-1',
    clientName: 'Liam Carter',
    clientId: 'demo-client-1',
    invoiceNo: 'INV-0042',
    amount: 299,
    currency: 'AUD',
    status: 'paid',
    dueDate: '2026-03-01',
    paidDate: '2026-02-28',
    service: 'Monthly Coaching — March 2026',
  },
  {
    id: 'inv-2',
    clientName: 'Sophie Nguyen',
    clientId: 'demo-client-2',
    invoiceNo: 'INV-0043',
    amount: 299,
    currency: 'AUD',
    status: 'paid',
    dueDate: '2026-03-01',
    paidDate: '2026-03-01',
    service: 'Monthly Coaching — March 2026',
  },
  {
    id: 'inv-3',
    clientName: 'Jake Wilson',
    clientId: 'demo-client-3',
    invoiceNo: 'INV-0044',
    amount: 399,
    currency: 'AUD',
    status: 'pending',
    dueDate: '2026-03-28',
    paidDate: null,
    service: 'Premium Coaching — March 2026',
  },
  {
    id: 'inv-4',
    clientName: 'Emma Thompson',
    clientId: 'demo-client-4',
    invoiceNo: 'INV-0045',
    amount: 199,
    currency: 'AUD',
    status: 'overdue',
    dueDate: '2026-03-15',
    paidDate: null,
    service: 'Starter Coaching — March 2026',
  },
  {
    id: 'inv-5',
    clientName: 'Liam Carter',
    clientId: 'demo-client-1',
    invoiceNo: 'INV-0038',
    amount: 299,
    currency: 'AUD',
    status: 'paid',
    dueDate: '2026-02-01',
    paidDate: '2026-01-31',
    service: 'Monthly Coaching — February 2026',
  },
  {
    id: 'inv-6',
    clientName: 'Sophie Nguyen',
    clientId: 'demo-client-2',
    invoiceNo: 'INV-0039',
    amount: 299,
    currency: 'AUD',
    status: 'paid',
    dueDate: '2026-02-01',
    paidDate: '2026-02-01',
    service: 'Monthly Coaching — February 2026',
  },
]

const DEMO_SUBSCRIPTIONS = [
  {
    clientId: 'demo-client-1',
    clientName: 'Liam Carter',
    plan: 'Monthly Coaching',
    amount: 299,
    nextBilling: '2026-04-01',
    status: 'active',
  },
  {
    clientId: 'demo-client-2',
    clientName: 'Sophie Nguyen',
    plan: 'Monthly Coaching',
    amount: 299,
    nextBilling: '2026-04-01',
    status: 'active',
  },
  {
    clientId: 'demo-client-3',
    clientName: 'Jake Wilson',
    plan: 'Premium Coaching',
    amount: 399,
    nextBilling: '2026-04-01',
    status: 'active',
  },
  {
    clientId: 'demo-client-4',
    clientName: 'Emma Thompson',
    plan: 'Starter Coaching',
    amount: 199,
    nextBilling: '2026-04-01',
    status: 'past_due',
  },
]

const DEMO_BILLING_EVENTS = [
  {
    id: 'event-1',
    eventType: 'subscription_started',
    amount: 2900,
    date: '2026-03-24',
    status: 'success',
    description: 'Pro subscription started',
  },
  {
    id: 'event-2',
    eventType: 'payment_succeeded',
    amount: 2900,
    date: '2026-03-20',
    status: 'success',
    description: 'Monthly payment processed',
  },
  {
    id: 'event-3',
    eventType: 'payment_succeeded',
    amount: 2900,
    date: '2026-02-20',
    status: 'success',
    description: 'Monthly payment processed',
  },
  {
    id: 'event-4',
    eventType: 'payment_failed',
    amount: 2900,
    date: '2026-01-25',
    status: 'failed',
    description: 'Payment failed - card declined',
  },
  {
    id: 'event-5',
    eventType: 'trial_ending_soon',
    amount: 0,
    date: '2026-01-08',
    status: 'warning',
    description: 'Trial ending in 5 days',
  },
]

type InvoiceFilter = 'all' | 'paid' | 'pending' | 'overdue'
type Tab = 'invoices' | 'subscriptions' | 'settings'

type PromoCode = {
  id: string
  code: string
  discount: string
  type: 'percent' | 'fixed'
  duration: string
  uses: number
  maxUses: number | null
  active: boolean
}

const INITIAL_PROMO_CODES: PromoCode[] = []

export default function PaymentsPage() {
  const isDemo = useIsDemo()
  const [activeTab, setActiveTab] = useState<Tab>('invoices')
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(INITIAL_PROMO_CODES)
  const [showPromoForm, setShowPromoForm] = useState(false)
  const [newPromo, setNewPromo] = useState({ code: '', discount: '', type: 'percent' as 'percent' | 'fixed', duration: '1_month', maxUses: '' })
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleCreatePromo = () => {
    if (!newPromo.code || !newPromo.discount) return
    const entry: PromoCode = {
      id: Date.now().toString(),
      code: newPromo.code.toUpperCase(),
      discount: newPromo.discount,
      type: newPromo.type,
      duration: newPromo.duration,
      uses: 0,
      maxUses: newPromo.maxUses ? parseInt(newPromo.maxUses) : null,
      active: true,
    }
    setPromoCodes(prev => [entry, ...prev])
    setNewPromo({ code: '', discount: '', type: 'percent', duration: '1_month', maxUses: '' })
    setShowPromoForm(false)
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleTogglePromo = (id: string) => {
    setPromoCodes(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p))
  }

  const handleDeletePromo = (id: string) => {
    setPromoCodes(prev => prev.filter(p => p.id !== id))
  }

  const durationLabel = (d: string) => {
    const map: Record<string, string> = { '1_month': '1 month free', '2_months': '2 months free', '3_months': '3 months free', 'forever': 'Forever' }
    return map[d] ?? d
  }
  const [invoiceFilter, setInvoiceFilter] = useState<InvoiceFilter>('all')

  const invoices = isDemo ? DEMO_INVOICES : []
  const subscriptions = isDemo ? DEMO_SUBSCRIPTIONS : []
  const billingEvents = isDemo ? DEMO_BILLING_EVENTS : []

  // Filter invoices
  const filteredInvoices =
    invoiceFilter === 'all'
      ? invoices
      : invoices.filter(inv => inv.status === invoiceFilter)

  // Calculate stats
  const paidThisMonth = invoices
    .filter(inv => inv.status === 'paid' && inv.paidDate?.startsWith('2026-03'))
    .reduce((sum, inv) => sum + inv.amount, 0)

  const outstanding = invoices
    .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0)

  const paidRate =
    invoices.length > 0
      ? Math.round((invoices.filter(inv => inv.status === 'paid').length / invoices.length) * 100)
      : 0

  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cb-text">Payments</h1>
          <p className="text-sm text-cb-muted mt-0.5">Revenue & invoices</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors font-medium text-sm">
          <Plus size={16} />
          New Invoice
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Monthly Revenue', value: `$${paidThisMonth}`, unit: 'AUD (paid)' },
          { label: 'Outstanding', value: `$${outstanding}`, unit: 'AUD' },
          { label: 'Paid Rate', value: `${paidRate}%`, unit: '' },
          { label: 'Active Subscriptions', value: activeSubscriptions.toString(), unit: '' },
          { label: 'Webhook Status', value: 'Active', unit: 'Connected', badge: true },
        ].map(({ label, value, unit, badge }) => (
          <div key={label} className="bg-surface border border-cb-border rounded-lg p-4">
            <p className="text-xs text-cb-muted mb-1">{label}</p>
            <div className="flex items-baseline gap-1">
              {badge ? (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-cb-success rounded-full" />
                  <p className="text-xl font-bold text-cb-text">{value}</p>
                </div>
              ) : (
                <>
                  <p className="text-xl font-bold text-cb-text">{value}</p>
                  {unit && <p className="text-xs text-cb-muted">{unit}</p>}
                </>
              )}
            </div>
            {badge && unit && <p className="text-xs text-cb-success mt-1">{unit}</p>}
          </div>
        ))}
      </div>

      {/* Monthly revenue chart */}
      <div className="bg-surface border border-cb-border rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-cb-text mb-4">Monthly Revenue (last 6 months)</h2>
        <div className="flex items-end gap-3 h-40">
          {[
            { month: 'Jan', amount: 950, isFuture: false },
            { month: 'Feb', amount: 798, isFuture: false },
            { month: 'Mar', amount: 1196, isFuture: false },
            { month: 'Apr', amount: 0, isFuture: true },
            { month: 'May', amount: 0, isFuture: true },
            { month: 'Jun', amount: 0, isFuture: true },
          ].map(({ month, amount, isFuture }) => {
            const maxAmount = 1196
            const height = amount > 0 ? (amount / maxAmount) * 100 : 5
            return (
              <div key={month} className="flex flex-col items-center flex-1">
                <div
                  className={clsx('w-full rounded-t-md transition-colors', isFuture ? 'bg-cb-border' : 'bg-brand')}
                  style={{ height: height + '%', minHeight: 8 }}
                  title={`${month}: $${amount}`}
                />
                <span className="text-xs text-cb-muted mt-2">{month}</span>
                <span className="text-xs font-medium text-cb-text mt-1">${amount}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-cb-border">
        {(['invoices', 'subscriptions', 'settings'] as const).map(tab => (
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
            {tab === 'invoices' ? 'Invoices' : tab === 'subscriptions' ? 'Subscriptions' : 'Settings'}
          </button>
        ))}
      </div>

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div>
          <div className="mb-4 flex gap-2">
            {(['all', 'paid', 'pending', 'overdue'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setInvoiceFilter(filter)}
                className={clsx(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  invoiceFilter === filter
                    ? 'bg-brand text-white'
                    : 'bg-surface border border-cb-border text-cb-secondary hover:bg-surface-light'
                )}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          <div className="bg-surface border border-cb-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cb-border bg-surface-light">
                  <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">
                    Invoice No
                  </th>
                  <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">
                    Client
                  </th>
                  <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">
                    Service
                  </th>
                  <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">
                    Amount
                  </th>
                  <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">
                    Due Date
                  </th>
                  <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cb-border">
                {filteredInvoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-surface-light">
                    <td className="px-5 py-3 text-sm font-medium text-cb-text">{invoice.invoiceNo}</td>
                    <td className="px-5 py-3 text-sm text-cb-secondary">{invoice.clientName}</td>
                    <td className="px-5 py-3 text-sm text-cb-secondary">{invoice.service}</td>
                    <td className="px-5 py-3 text-sm font-medium text-cb-text">
                      ${invoice.amount} {invoice.currency}
                    </td>
                    <td className="px-5 py-3 text-sm text-cb-secondary">{invoice.dueDate}</td>
                    <td className="px-5 py-3 text-sm">
                      <span
                        className={clsx(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold',
                          invoice.status === 'paid'
                            ? 'bg-cb-success/15 text-cb-success'
                            : invoice.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                              : 'bg-cb-danger/15 text-cb-danger'
                        )}
                      >
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm flex gap-2">
                      {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                        <button className="px-2 py-1 text-xs font-medium rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                          Remind
                        </button>
                      )}
                      <button className="px-2 py-1 text-xs font-medium rounded-lg bg-surface-light border border-cb-border text-cb-secondary hover:text-cb-text transition-colors">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="bg-surface border border-cb-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cb-border bg-surface-light">
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">
                  Client
                </th>
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">
                  Plan
                </th>
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">
                  Amount/month
                </th>
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">
                  Next Billing
                </th>
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cb-border">
              {subscriptions.map(sub => (
                <tr key={sub.clientId} className="hover:bg-surface-light">
                  <td className="px-5 py-3 text-sm font-medium text-cb-text">{sub.clientName}</td>
                  <td className="px-5 py-3 text-sm text-cb-secondary">{sub.plan}</td>
                  <td className="px-5 py-3 text-sm font-medium text-cb-text">${sub.amount} AUD</td>
                  <td className="px-5 py-3 text-sm text-cb-secondary">{sub.nextBilling}</td>
                  <td className="px-5 py-3 text-sm">
                    <span
                      className={clsx(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold',
                        sub.status === 'active'
                          ? 'bg-cb-success/15 text-cb-success'
                          : 'bg-cb-danger/15 text-cb-danger'
                      )}
                    >
                      {sub.status === 'active' ? 'Active' : 'Past Due'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm">
                    {sub.status === 'past_due' && (
                      <button className="px-2 py-1 text-xs font-medium rounded-lg bg-cb-danger/10 text-cb-danger border border-cb-danger/30 hover:bg-cb-danger/20 transition-colors">
                        Retry Payment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                    Connect your Stripe account to start accepting card payments. Clients pay online — you get paid automatically.
                  </p>
                </div>
              </div>
              <button className="px-4 py-2 bg-white text-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-medium text-sm">
                Connect Stripe Account
              </button>
            </div>
          </div>

          {/* Payment methods section */}
          <div className="bg-surface border border-cb-border rounded-lg p-6">
            <h3 className="text-sm font-semibold text-cb-text mb-4">Payment Methods</h3>
            <div className="bg-surface-light rounded-lg p-4 text-center">
              <p className="text-sm text-cb-muted">No payment methods connected yet.</p>
              <button className="mt-3 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand text-white hover:bg-brand/90 transition-colors">
                Add Payment Method
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
                        <option value="fixed">£</option>
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
                      <option value="forever">Forever (ongoing %)</option>
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
                  <div key={promo.id} className={clsx('flex items-center gap-3 p-3 rounded-lg border', promo.active ? 'border-cb-border bg-surface-light' : 'border-cb-border/50 bg-surface opacity-60')}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-cb-text">{promo.code}</span>
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-semibold', promo.active ? 'bg-cb-success/15 text-cb-success' : 'bg-cb-muted/20 text-cb-muted')}>
                          {promo.active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <p className="text-xs text-cb-muted mt-0.5">
                        {promo.discount}{promo.type === 'percent' ? '%' : '£'} off · {durationLabel(promo.duration)} · {promo.uses} uses{promo.maxUses ? ` / ${promo.maxUses}` : ''}
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
                        {promo.active ? 'Pause' : 'Activate'}
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
                <label className="text-xs font-semibold text-cb-muted block mb-2 uppercase tracking-wide">
                  Currency
                </label>
                <select className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text bg-surface-light focus:outline-none focus:ring-2 focus:ring-brand">
                  <option>AUD - Australian Dollar</option>
                  <option>USD - US Dollar</option>
                  <option>EUR - Euro</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-cb-muted block mb-2 uppercase tracking-wide">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  placeholder="10"
                  className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted bg-surface-light focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-cb-muted block mb-2 uppercase tracking-wide">
                  Payment Terms (days)
                </label>
                <input
                  type="number"
                  placeholder="30"
                  className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted bg-surface-light focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing Events Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-cb-text mb-4">Billing Events</h2>
        <div className="bg-surface border border-cb-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cb-border bg-surface-light">
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">
                  Date
                </th>
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">
                  Event
                </th>
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">
                  Amount
                </th>
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-5 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cb-border">
              {billingEvents.map(event => (
                <tr key={event.id} className="hover:bg-surface-light">
                  <td className="px-5 py-3 text-sm text-cb-secondary">{event.date}</td>
                  <td className="px-5 py-3 text-sm text-cb-text">{event.description}</td>
                  <td className="px-5 py-3 text-sm font-medium text-cb-text">
                    {event.amount > 0 ? `$${(event.amount / 100).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-5 py-3 text-sm">
                    <span
                      className={clsx(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold',
                        event.status === 'success'
                          ? 'bg-cb-success/15 text-cb-success'
                          : event.status === 'failed'
                            ? 'bg-cb-danger/15 text-cb-danger'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                      )}
                    >
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
