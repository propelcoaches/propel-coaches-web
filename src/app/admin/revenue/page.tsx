'use client'

const MONTHLY = [
  { month: 'Oct 2024', mrr: 3420, newCoaches: 8, churned: 1, net: 7 },
  { month: 'Nov 2024', mrr: 4150, newCoaches: 11, churned: 2, net: 9 },
  { month: 'Dec 2024', mrr: 4890, newCoaches: 13, churned: 1, net: 12 },
  { month: 'Jan 2025', mrr: 5760, newCoaches: 15, churned: 3, net: 12 },
  { month: 'Feb 2025', mrr: 6340, newCoaches: 12, churned: 2, net: 10 },
  { month: 'Mar 2025', mrr: 7120, newCoaches: 18, churned: 2, net: 16 },
]

const PLAN_BREAKDOWN = [
  { plan: 'Starter', price: 49, coaches: 28, mrr: 1372 },
  { plan: 'Pro', price: 99, coaches: 31, mrr: 3069 },
  { plan: 'Clinic', price: 199, coaches: 14, mrr: 2786 },
]

const total_mrr = PLAN_BREAKDOWN.reduce((s, p) => s + p.mrr, 0)

export default function AdminRevenuePage() {
  const latest = MONTHLY[MONTHLY.length - 1]
  const prev = MONTHLY[MONTHLY.length - 2]
  const growth = (((latest.mrr - prev.mrr) / prev.mrr) * 100).toFixed(1)

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Revenue</h1>
        <p className="text-gray-400">MRR and growth overview</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-500 text-sm mb-1">Current MRR</p>
          <p className="text-3xl font-bold text-white">${latest.mrr.toLocaleString()}</p>
          <p className="text-emerald-400 text-sm mt-1">+{growth}% vs last month</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-500 text-sm mb-1">ARR (projected)</p>
          <p className="text-3xl font-bold text-white">${(latest.mrr * 12).toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-500 text-sm mb-1">Net New Coaches (Mar)</p>
          <p className="text-3xl font-bold text-white">+{latest.net}</p>
          <p className="text-gray-500 text-sm mt-1">{latest.newCoaches} joined · {latest.churned} churned</p>
        </div>
      </div>

      {/* Plan breakdown */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Plan Breakdown</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50 border-b border-gray-800">
              <tr>
                {['Plan', 'Price / mo', 'Coaches', 'MRR', '% of MRR'].map((h) => (
                  <th key={h} className="text-left py-4 px-6 font-semibold text-gray-500 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {PLAN_BREAKDOWN.map((row) => (
                <tr key={row.plan} className="hover:bg-gray-800/30 transition-colors">
                  <td className="py-4 px-6 font-medium text-white">{row.plan}</td>
                  <td className="py-4 px-6 text-gray-400">${row.price}</td>
                  <td className="py-4 px-6 text-white">{row.coaches}</td>
                  <td className="py-4 px-6 text-white font-medium">${row.mrr.toLocaleString()}</td>
                  <td className="py-4 px-6 text-gray-400">{((row.mrr / total_mrr) * 100).toFixed(1)}%</td>
                </tr>
              ))}
              <tr className="bg-gray-800/30">
                <td className="py-4 px-6 font-bold text-white" colSpan={3}>Total</td>
                <td className="py-4 px-6 font-bold text-white">${total_mrr.toLocaleString()}</td>
                <td className="py-4 px-6 text-gray-400">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly history */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Monthly History</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50 border-b border-gray-800">
              <tr>
                {['Month', 'MRR', 'New Coaches', 'Churned', 'Net Growth'].map((h) => (
                  <th key={h} className="text-left py-4 px-6 font-semibold text-gray-500 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {[...MONTHLY].reverse().map((row) => (
                <tr key={row.month} className="hover:bg-gray-800/30 transition-colors">
                  <td className="py-4 px-6 text-gray-300">{row.month}</td>
                  <td className="py-4 px-6 font-medium text-white">${row.mrr.toLocaleString()}</td>
                  <td className="py-4 px-6 text-emerald-400">+{row.newCoaches}</td>
                  <td className="py-4 px-6 text-red-400">-{row.churned}</td>
                  <td className="py-4 px-6 text-white font-medium">+{row.net}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
