'use client'

import { useState } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'

type Client = {
  id: string
  name: string
  email: string
  coach: string
  plan: string
  joinedAt: string
  status: 'Active' | 'Inactive'
}

const CLIENTS: Client[] = [
  { id: '1', name: 'Liam Carter', email: 'liam@example.com', coach: 'James Khoury', plan: 'Team', joinedAt: '2024-01-10', status: 'Active' },
  { id: '2', name: 'Emma Davis', email: 'emma@example.com', coach: 'Sarah Mitchell', plan: 'Pro', joinedAt: '2024-01-15', status: 'Active' },
  { id: '3', name: 'Noah Williams', email: 'noah@example.com', coach: 'Marcus Thompson', plan: 'Starter', joinedAt: '2024-02-01', status: 'Active' },
  { id: '4', name: 'Olivia Brown', email: 'olivia@example.com', coach: 'Sofia Rodriguez', plan: 'Team', joinedAt: '2024-02-05', status: 'Active' },
  { id: '5', name: 'William Jones', email: 'william@example.com', coach: 'David Kim', plan: 'Pro', joinedAt: '2024-02-10', status: 'Active' },
  { id: '6', name: 'Ava Miller', email: 'ava@example.com', coach: 'Emma Wilson', plan: 'Starter', joinedAt: '2024-01-20', status: 'Inactive' },
  { id: '7', name: 'James Wilson', email: 'james.w@example.com', coach: 'Alex Chen', plan: 'Pro', joinedAt: '2024-02-15', status: 'Active' },
  { id: '8', name: 'Sophia Moore', email: 'sophia@example.com', coach: 'Lisa Anderson', plan: 'Starter', joinedAt: '2024-03-01', status: 'Active' },
  { id: '9', name: 'Benjamin Taylor', email: 'ben@example.com', coach: 'Robert Chang', plan: 'Pro', joinedAt: '2024-03-05', status: 'Active' },
  { id: '10', name: 'Mia Anderson', email: 'mia@example.com', coach: 'Nina Patel', plan: 'Starter', joinedAt: '2023-12-10', status: 'Inactive' },
  { id: '11', name: 'Elijah Thomas', email: 'elijah@example.com', coach: 'James Sullivan', plan: 'Team', joinedAt: '2024-02-20', status: 'Active' },
  { id: '12', name: 'Charlotte Jackson', email: 'charlotte@example.com', coach: 'Clara Brown', plan: 'Pro', joinedAt: '2024-03-10', status: 'Active' },
  { id: '13', name: 'Aiden White', email: 'aiden@example.com', coach: 'Michael Torres', plan: 'Starter', joinedAt: '2024-03-12', status: 'Active' },
  { id: '14', name: 'Amelia Harris', email: 'amelia@example.com', coach: 'Jessica Lee', plan: 'Pro', joinedAt: '2024-01-25', status: 'Active' },
  { id: '15', name: 'Lucas Martin', email: 'lucas@example.com', coach: 'Daniel Martinez', plan: 'Starter', joinedAt: '2023-11-15', status: 'Inactive' },
]

export default function AdminClientsPage() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('joinedAt')

  const filtered = CLIENTS.filter((c) => {
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.coach.toLowerCase().includes(q)
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    if (sortBy === 'coach') return a.coach.localeCompare(b.coach)
    return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
  })

  return (
    <div className="p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Clients</h1>
        <p className="text-gray-400">All clients across the platform ({filtered.length})</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, email, or coach..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          />
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/40 pr-10"
          >
            <option value="joinedAt">Date Joined</option>
            <option value="name">Name</option>
            <option value="coach">Coach</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50 border-b border-gray-800">
              <tr>
                {['Name', 'Email', 'Coach', 'Plan', 'Joined', 'Status'].map((h) => (
                  <th key={h} className="text-left py-4 px-6 font-semibold text-gray-500 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {sorted.map((client) => (
                <tr key={client.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="py-4 px-6 font-medium text-white">{client.name}</td>
                  <td className="py-4 px-6 text-gray-400">{client.email}</td>
                  <td className="py-4 px-6 text-gray-300">{client.coach}</td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-800 text-gray-300">{client.plan}</span>
                  </td>
                  <td className="py-4 px-6 text-gray-400">{format(new Date(client.joinedAt), 'MMM d, yyyy')}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${client.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {client.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-sm text-gray-500 text-center">Showing {sorted.length} of {CLIENTS.length} clients</div>
    </div>
  )
}
