'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Search, ChevronDown } from 'lucide-react'

type Coach = {
  id: string
  name: string
  email: string
  plan: 'Starter' | 'Pro' | 'Team'
  clientCount: number
  mrrContribution: number
  lastActive: string
  status: 'Active' | 'Churned'
}

// 20 coaches mock data
const COACHES: Coach[] = [
  {
    id: '1',
    name: 'James Khoury',
    email: 'james@example.com',
    plan: 'Team',
    clientCount: 12,
    mrrContribution: 79,
    lastActive: '2024-03-23',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Sarah Mitchell',
    email: 'sarah@example.com',
    plan: 'Pro',
    clientCount: 8,
    mrrContribution: 29,
    lastActive: '2024-03-22',
    status: 'Active',
  },
  {
    id: '3',
    name: 'Marcus Thompson',
    email: 'marcus@example.com',
    plan: 'Starter',
    clientCount: 2,
    mrrContribution: 9,
    lastActive: '2024-03-21',
    status: 'Active',
  },
  {
    id: '4',
    name: 'Sofia Rodriguez',
    email: 'sofia@example.com',
    plan: 'Team',
    clientCount: 15,
    mrrContribution: 79,
    lastActive: '2024-03-23',
    status: 'Active',
  },
  {
    id: '5',
    name: 'David Kim',
    email: 'david@example.com',
    plan: 'Pro',
    clientCount: 6,
    mrrContribution: 29,
    lastActive: '2024-03-20',
    status: 'Active',
  },
  {
    id: '6',
    name: 'Emma Wilson',
    email: 'emma@example.com',
    plan: 'Starter',
    clientCount: 3,
    mrrContribution: 9,
    lastActive: '2024-02-28',
    status: 'Churned',
  },
  {
    id: '7',
    name: 'Alex Chen',
    email: 'alex@example.com',
    plan: 'Pro',
    clientCount: 7,
    mrrContribution: 29,
    lastActive: '2024-03-19',
    status: 'Active',
  },
  {
    id: '8',
    name: 'Lisa Anderson',
    email: 'lisa@example.com',
    plan: 'Starter',
    clientCount: 1,
    mrrContribution: 9,
    lastActive: '2024-03-18',
    status: 'Active',
  },
  {
    id: '9',
    name: 'Robert Chang',
    email: 'robert@example.com',
    plan: 'Pro',
    clientCount: 9,
    mrrContribution: 29,
    lastActive: '2024-03-17',
    status: 'Active',
  },
  {
    id: '10',
    name: 'Nina Patel',
    email: 'nina@example.com',
    plan: 'Starter',
    clientCount: 4,
    mrrContribution: 9,
    lastActive: '2024-01-15',
    status: 'Churned',
  },
  {
    id: '11',
    name: 'James Sullivan',
    email: 'james.s@example.com',
    plan: 'Team',
    clientCount: 11,
    mrrContribution: 79,
    lastActive: '2024-03-23',
    status: 'Active',
  },
  {
    id: '12',
    name: 'Clara Brown',
    email: 'clara@example.com',
    plan: 'Pro',
    clientCount: 5,
    mrrContribution: 29,
    lastActive: '2024-03-16',
    status: 'Active',
  },
  {
    id: '13',
    name: 'Michael Torres',
    email: 'michael@example.com',
    plan: 'Starter',
    clientCount: 2,
    mrrContribution: 9,
    lastActive: '2024-03-14',
    status: 'Active',
  },
  {
    id: '14',
    name: 'Jessica Lee',
    email: 'jessica@example.com',
    plan: 'Pro',
    clientCount: 8,
    mrrContribution: 29,
    lastActive: '2024-03-23',
    status: 'Active',
  },
  {
    id: '15',
    name: 'Daniel Martinez',
    email: 'daniel@example.com',
    plan: 'Starter',
    clientCount: 3,
    mrrContribution: 9,
    lastActive: '2024-02-10',
    status: 'Churned',
  },
  {
    id: '16',
    name: 'Rachel Green',
    email: 'rachel@example.com',
    plan: 'Team',
    clientCount: 14,
    mrrContribution: 79,
    lastActive: '2024-03-22',
    status: 'Active',
  },
  {
    id: '17',
    name: 'Kevin Johnson',
    email: 'kevin@example.com',
    plan: 'Pro',
    clientCount: 7,
    mrrContribution: 29,
    lastActive: '2024-03-21',
    status: 'Active',
  },
  {
    id: '18',
    name: 'Amanda White',
    email: 'amanda@example.com',
    plan: 'Starter',
    clientCount: 2,
    mrrContribution: 9,
    lastActive: '2024-03-20',
    status: 'Active',
  },
  {
    id: '19',
    name: 'Christopher Davis',
    email: 'chris@example.com',
    plan: 'Pro',
    clientCount: 6,
    mrrContribution: 29,
    lastActive: '2024-03-19',
    status: 'Active',
  },
  {
    id: '20',
    name: 'Victoria King',
    email: 'victoria@example.com',
    plan: 'Team',
    clientCount: 10,
    mrrContribution: 79,
    lastActive: '2024-03-18',
    status: 'Active',
  },
]

export default function AdminCoachesPage() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('lastActive')

  const filteredCoaches = COACHES.filter((coach) => {
    const query = search.toLowerCase()
    return (
      coach.name.toLowerCase().includes(query) ||
      coach.email.toLowerCase().includes(query) ||
      coach.plan.toLowerCase().includes(query)
    )
  })

  const sortedCoaches = [...filteredCoaches].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'clients':
        return b.clientCount - a.clientCount
      case 'mrr':
        return b.mrrContribution - a.mrrContribution
      case 'lastActive':
      default:
        return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
    }
  })

  const planColorMap = {
    Starter: 'bg-gray-800 text-gray-300',
    Pro: 'bg-teal/20 text-teal',
    Team: 'bg-success/20 text-success',
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Coaches</h1>
        <p className="text-gray-400">All coaches on the platform ({filteredCoaches.length})</p>
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search coaches by name, email, or plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal/40"
          />
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal/40 pr-10"
          >
            <option value="lastActive">Last Active</option>
            <option value="name">Name</option>
            <option value="clients">Clients</option>
            <option value="mrr">MRR Contribution</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50 border-b border-gray-800">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-500 text-xs uppercase">
                  Name
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-500 text-xs uppercase">
                  Email
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-500 text-xs uppercase">
                  Plan
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-500 text-xs uppercase">
                  Clients
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-500 text-xs uppercase">
                  MRR
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-500 text-xs uppercase">
                  Last Active
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-500 text-xs uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {sortedCoaches.map((coach) => (
                <tr key={coach.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="py-4 px-6 font-medium text-white">{coach.name}</td>
                  <td className="py-4 px-6 text-gray-400">{coach.email}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${planColorMap[coach.plan]}`}>
                      {coach.plan}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-white font-medium">{coach.clientCount}</td>
                  <td className="py-4 px-6 text-white font-medium">${coach.mrrContribution} AUD</td>
                  <td className="py-4 px-6 text-gray-400">
                    {format(new Date(coach.lastActive), 'MMM d, yyyy')}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        coach.status === 'Active'
                          ? 'bg-success/20 text-success'
                          : 'bg-danger/20 text-danger'
                      }`}
                    >
                      {coach.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Info */}
      <div className="text-sm text-gray-500 text-center">
        Showing {sortedCoaches.length} of {COACHES.length} coaches
      </div>
    </div>
  )
}
