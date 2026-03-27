'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';
import {
  DollarSign,
  Users,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  AlertCircle,
  Loader,
} from 'lucide-react';

interface CoachingPackage {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  billing_interval: 'monthly' | 'quarterly' | 'yearly' | 'one_time';
  features: string[];
  max_clients: number | null;
  is_active: boolean;
  created_at: string;
}

interface PackageStats {
  activeSubscribers: number;
  monthlyRevenue: number;
}

export default function PackagesPage() {
  const supabase = createClient();
  const [packages, setPackages] = useState<CoachingPackage[]>([]);
  const [stats, setStats] = useState<Record<string, PackageStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_cents: 0,
    currency: 'USD',
    billing_interval: 'monthly' as const,
    features: [''],
    max_clients: null as number | null,
  });

  useEffect(() => {
    fetchPackages();
    const subscription = supabase
      .channel('packages_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coaching_packages' }, () => {
        fetchPackages();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: packagesData, error: packagesError } = await supabase
        .from('coaching_packages')
        .select('*')
        .order('created_at', { ascending: false });

      if (packagesError) throw packagesError;

      setPackages(packagesData || []);

      if (packagesData && packagesData.length > 0) {
        await fetchStats(packagesData.map((p) => p.id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (packageIds: string[]) => {
    try {
      const statsRecord: Record<string, PackageStats> = {};

      for (const packageId of packageIds) {
        const { data: subscriptions } = await supabase
          .from('client_subscriptions')
          .select('status, current_period_start, current_period_end')
          .eq('package_id', packageId);

        const activeCount = subscriptions?.filter((s) => s.status === 'active').length || 0;

        const { data: pkg } = await supabase
          .from('coaching_packages')
          .select('price_cents, billing_interval')
          .eq('id', packageId)
          .single();

        const monthlyRevenue =
          pkg && pkg.billing_interval === 'monthly'
            ? (activeCount * pkg.price_cents) / 100
            : pkg && pkg.billing_interval === 'yearly'
              ? (activeCount * pkg.price_cents) / 100 / 12
              : pkg && pkg.billing_interval === 'quarterly'
                ? (activeCount * pkg.price_cents) / 100 / 3
                : 0;

        statsRecord[packageId] = {
          activeSubscribers: activeCount,
          monthlyRevenue,
        };
      }

      setStats(statsRecord);
    } catch (err) {
      toast.error('Failed to load package stats');
    }
  };

  const handleAddFeature = () => {
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, ''],
    }));
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.map((f, i) => (i === index ? value : f)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const cleanedFeatures = formData.features.filter((f) => f.trim());

      if (!formData.name.trim()) {
        setError('Package name is required');
        return;
      }

      if (formData.price_cents < 0) {
        setError('Price must be non-negative');
        return;
      }

      if (editingId) {
        const { error: updateError } = await supabase
          .from('coaching_packages')
          .update({
            name: formData.name,
            description: formData.description,
            price_cents: formData.price_cents,
            currency: formData.currency,
            billing_interval: formData.billing_interval,
            features: cleanedFeatures,
            max_clients: formData.max_clients,
          })
          .eq('id', editingId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('coaching_packages').insert({
          name: formData.name,
          description: formData.description,
          price_cents: formData.price_cents,
          currency: formData.currency,
          billing_interval: formData.billing_interval,
          features: cleanedFeatures,
          max_clients: formData.max_clients,
        });

        if (insertError) throw insertError;
      }

      resetForm();
      fetchPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save package');
    }
  };

  const handleEdit = (pkg: CoachingPackage) => {
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      price_cents: pkg.price_cents,
      currency: pkg.currency,
      billing_interval: pkg.billing_interval as any,
      features: pkg.features && pkg.features.length > 0 ? [...pkg.features] : [''],
      max_clients: pkg.max_clients,
    });
    setEditingId(pkg.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      return;
    }

    try {
      setDeleting(id);
      setPendingDeleteId(null);
      const { error } = await supabase.from('coaching_packages').delete().eq('id', id);

      if (error) throw error;
      fetchPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete package');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (pkg: CoachingPackage) => {
    try {
      const { error } = await supabase
        .from('coaching_packages')
        .update({ is_active: !pkg.is_active })
        .eq('id', pkg.id);

      if (error) throw error;
      fetchPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update package');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price_cents: 0,
      currency: 'USD',
      billing_interval: 'monthly',
      features: [''],
      max_clients: null,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(cents / 100);
  };

  const getBillingLabel = (interval: string) => {
    const labels: Record<string, string> = {
      monthly: '/month',
      quarterly: '/3 months',
      yearly: '/year',
      one_time: 'one-time',
    };
    return labels[interval] || interval;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader className="mx-auto mb-4 h-12 w-12 animate-spin text-indigo-600" />
          <p className="text-slate-600">Loading packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Coaching Packages</h1>
            <p className="mt-2 text-slate-600">Manage your service offerings and pricing</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5" />
            New Package
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingId ? 'Edit Package' : 'Create New Package'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Package Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="e.g., Premium Training"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Billing Interval
                    </label>
                    <select
                      value={formData.billing_interval}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          billing_interval: e.target.value as any,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                      <option value="one_time">One-Time</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Describe what clients get with this package..."
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Price ({formData.currency})
                    </label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                        $
                      </span>
                      <input
                        type="number"
                        value={formData.price_cents / 100}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            price_cents: Math.round(parseFloat(e.target.value) * 100),
                          }))
                        }
                        step="0.01"
                        min="0"
                        className="w-full rounded-lg border border-slate-300 pl-7 pr-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Max Clients (optional)
                    </label>
                    <input
                      type="number"
                      value={formData.max_clients || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          max_clients: e.target.value ? parseInt(e.target.value) : null,
                        }))
                      }
                      min="1"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Leave empty for unlimited"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Features
                  </label>
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => handleFeatureChange(index, e.target.value)}
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          placeholder="e.g., 4 sessions per month"
                        />
                        {formData.features.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(index)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    + Add Feature
                  </button>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700"
                  >
                    {editingId ? 'Update' : 'Create'} Package
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Packages Grid */}
        {packages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <DollarSign className="mx-auto mb-4 h-12 w-12 text-slate-400" />
            <h3 className="text-lg font-medium text-slate-900">No packages yet</h3>
            <p className="mt-2 text-slate-600">
              Create your first coaching package to start accepting clients
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => {
              const packageStats = stats[pkg.id] || { activeSubscribers: 0, monthlyRevenue: 0 };
              return (
                <div
                  key={pkg.id}
                  className={`rounded-xl border transition-all ${
                    pkg.is_active
                      ? 'border-slate-200 bg-white shadow-md hover:shadow-lg'
                      : 'border-slate-200 bg-slate-50 shadow-sm'
                  }`}
                >
                  {/* Header */}
                  <div className="border-b border-slate-200 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold ${!pkg.is_active ? 'text-slate-500' : 'text-slate-900'}`}>
                          {pkg.name}
                        </h3>
                        <p
                          className={`mt-1 text-sm ${
                            !pkg.is_active ? 'text-slate-400' : 'text-slate-600'
                          }`}
                        >
                          {pkg.description || 'No description'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleActive(pkg)}
                        className="ml-2 text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {pkg.is_active ? (
                          <ToggleRight className="h-6 w-6 text-indigo-600" />
                        ) : (
                          <ToggleLeft className="h-6 w-6" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Price & Stats */}
                  <div className="border-b border-slate-200 p-6">
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-indigo-600">
                        {formatPrice(pkg.price_cents, pkg.currency)}
                      </span>
                      <span className="ml-2 text-slate-600">{getBillingLabel(pkg.billing_interval)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-indigo-50 p-3">
                        <div className="flex items-center gap-2 text-indigo-600">
                          <Users className="h-4 w-4" />
                          <span className="text-sm font-medium">Active</span>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-indigo-900">
                          {packageStats.activeSubscribers}
                        </p>
                        {pkg.max_clients && (
                          <p className="mt-1 text-xs text-indigo-700">
                            of {pkg.max_clients}
                          </p>
                        )}
                      </div>

                      <div className="rounded-lg bg-emerald-50 p-3">
                        <div className="flex items-center gap-2 text-emerald-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm font-medium">Revenue</span>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-emerald-900">
                          ${packageStats.monthlyRevenue.toFixed(0)}
                        </p>
                        <p className="mt-1 text-xs text-emerald-700">/month avg</p>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  {pkg.features && pkg.features.length > 0 && (
                    <div className="border-b border-slate-200 p-6">
                      <h4 className="mb-3 text-sm font-medium text-slate-900">Features</h4>
                      <ul className="space-y-2">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 p-6">
                    <button
                      onClick={() => handleEdit(pkg)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </button>
                    {pendingDeleteId === pkg.id ? (
                      <>
                        <button
                          onClick={() => setPendingDeleteId(null)}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(pkg.id)}
                          disabled={deleting === pkg.id}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Confirm Delete
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDelete(pkg.id)}
                        disabled={deleting === pkg.id}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 px-3 py-2 font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
