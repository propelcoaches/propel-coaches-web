'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Eye,
  ExternalLink,
  Search,
  LogOut,
  AlertCircle,
  Loader,
} from 'lucide-react';

interface Coach {
  id: string;
  email: string;
  full_name: string;
  plan?: string;
  subscription_status?: string;
  stripe_customer_id?: string;
  clients_count: number;
  created_at: string;
}

interface Stats {
  totalCoaches: number;
  activeSubscriptions: number;
  mrr: number;
  trialCoaches: number;
}

interface ApiResponse {
  stats: Stats;
  coaches: Coach[];
  recentSignups: any[];
}

const ADMIN_PASSWORD_DEFAULT = 'propel-admin-2026';

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentSignups, setRecentSignups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Check if already authenticated
  useEffect(() => {
    const storedAuth = sessionStorage.getItem('adminAuth');
    if (storedAuth === 'true') {
      setAuthenticated(true);
      fetchData();
    }
  }, []);

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD_DEFAULT) {
      setAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      setPasswordError('');
      fetchData();
    } else {
      setPasswordError('Invalid password');
      setPasswordInput('');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/coaches', {
        headers: {
          'x-admin-secret': ADMIN_PASSWORD_DEFAULT,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admin data');
      }

      const data: ApiResponse = await response.json();
      setStats(data.stats);
      setCoaches(data.coaches);
      setRecentSignups(data.recentSignups);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    setAuthenticated(false);
    setCoaches([]);
    setStats(null);
  };

  const filteredCoaches = coaches.filter((coach) =>
    coach.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coach.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'trialing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'past_due':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'canceled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Authentication Screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <div className="flex items-center justify-center mb-8">
              <div className="w-12 h-12 rounded-lg bg-[#0F7B8C] flex items-center justify-center text-white text-lg font-bold">
                P
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Propel Admin
            </h1>
            <p className="text-center text-gray-600 text-sm mb-8">
              Business Owner Dashboard
            </p>

            <form onSubmit={handleAuthenticate} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Enter admin password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0F7B8C] focus:border-transparent text-gray-900"
                />
              </div>

              {passwordError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">{passwordError}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white font-semibold py-3 px-4 rounded-xl transition-colors"
              >
                Access Dashboard
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#0F7B8C] flex items-center justify-center text-white font-bold text-lg">
                P
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Propel Admin</h1>
                <p className="text-sm text-gray-600">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://propelcoaches.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#0F7B8C] hover:text-[#0d6b7a] font-medium text-sm"
              >
                Visit Site
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4 mt-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !stats ? (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="w-8 h-8 text-[#0F7B8C] animate-spin mb-4" />
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          {stats && (
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Coaches */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-gray-600 text-sm font-medium mb-2">Total Coaches</p>
                  <div className="flex items-end gap-2">
                    <p className="text-4xl font-bold text-gray-900">{stats.totalCoaches}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Active members</p>
                </div>

                {/* Active Subscriptions */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-gray-600 text-sm font-medium mb-2">Active Subscriptions</p>
                  <div className="flex items-end gap-2">
                    <p className="text-4xl font-bold text-green-600">{stats.activeSubscriptions}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Paying customers</p>
                </div>

                {/* MRR */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-gray-600 text-sm font-medium mb-2">Monthly Revenue</p>
                  <div className="flex items-end gap-2">
                    <p className="text-4xl font-bold text-[#0F7B8C]">
                      {formatCurrency(stats.mrr)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Recurring revenue</p>
                </div>

                {/* Trial Coaches */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-gray-600 text-sm font-medium mb-2">Trial Coaches</p>
                  <div className="flex items-end gap-2">
                    <p className="text-4xl font-bold text-blue-600">{stats.trialCoaches}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Testing platform</p>
                </div>
              </div>
            </div>
          )}

          {/* Coaches Table Section */}
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              {/* Table Header */}
              <div className="px-6 py-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Coaches Directory</h2>
                  <p className="text-sm text-gray-600">{filteredCoaches.length} coaches</p>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0F7B8C] focus:border-transparent text-gray-900 text-sm"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Clients
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredCoaches.length > 0 ? (
                      filteredCoaches.map((coach) => (
                        <tr
                          key={coach.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {coach.full_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {coach.email}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 rounded font-medium text-xs">
                              {coach.plan || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`inline-block px-2.5 py-1 rounded font-medium text-xs border ${getStatusColor(
                                coach.subscription_status
                              )}`}
                            >
                              {coach.subscription_status || 'inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-center text-gray-900 font-medium">
                            {coach.clients_count}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatDate(coach.created_at)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {coach.stripe_customer_id && (
                                <a
                                  href={`https://dashboard.stripe.com/customers/${coach.stripe_customer_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-[#0F7B8C] hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Manage subscription"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          No coaches found matching your search
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Activity Section */}
          {recentSignups.length > 0 && (
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Recent Sign-ups (Last 7 Days)
                </h3>
                <div className="space-y-3">
                  {recentSignups.map((signup) => (
                    <div
                      key={signup.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {signup.full_name}
                        </p>
                        <p className="text-sm text-gray-600">{signup.email}</p>
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatDate(signup.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
