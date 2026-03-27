'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';

interface MarketplaceListing {
  id: string;
  coach_id: string;
  program_id: string;
  title: string;
  description: string;
  short_description: string | null;
  cover_image_url: string | null;
  price_cents: number;
  goal: string | null;
  experience_level: string | null;
  days_per_week: number | null;
  program_length_weeks: number | null;
  equipment_needed: string[];
  purchase_count: number;
  avg_rating: number;
  review_count: number;
  status: string;
  featured: boolean;
  tags: string[];
  created_at: string;
  coach?: { full_name: string; avatar_url: string | null; avg_rating: number };
}

interface Program {
  id: string;
  title: string;
  goal: string;
  days_per_week: number;
  program_length_weeks: number;
}

const GOALS = ['hypertrophy', 'strength', 'fat_loss', 'athletic_performance', 'general_fitness'];

export default function MarketplacePage() {
  const supabase = createClient();

  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [myListings, setMyListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'my_listings'>('browse');
  const [showCreate, setShowCreate] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filterGoal, setFilterGoal] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('popular');

  const [form, setForm] = useState({
    program_id: '',
    title: '',
    description: '',
    short_description: '',
    price_cents: 2999,
    tags: [] as string[],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const [allRes, myRes, progsRes] = await Promise.all([
      supabase
        .from('marketplace_listings')
        .select('*, coach:profiles!marketplace_listings_coach_id_fkey(full_name, avatar_url, avg_rating)')
        .eq('status', 'published')
        .order('purchase_count', { ascending: false }),
      user ? supabase
        .from('marketplace_listings')
        .select('*')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
      user ? supabase
        .from('workout_programs')
        .select('id, title, goal, days_per_week, program_length_weeks')
        .eq('coach_id', user.id) : Promise.resolve({ data: [] }),
    ]);

    if (allRes.data) setListings(allRes.data as MarketplaceListing[]);
    if (myRes.data) setMyListings(myRes.data as MarketplaceListing[]);
    if (progsRes.data) setPrograms(progsRes.data as Program[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createListing = async () => {
    if (!form.program_id || !form.title.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const program = programs.find((p) => p.id === form.program_id);
    const { data, error } = await supabase.from('marketplace_listings').insert({
      coach_id: user.id,
      program_id: form.program_id,
      title: form.title.trim(),
      description: form.description.trim(),
      short_description: form.short_description.trim() || null,
      price_cents: form.price_cents,
      goal: program?.goal,
      experience_level: null,
      days_per_week: program?.days_per_week,
      program_length_weeks: program?.program_length_weeks,
      tags: form.tags,
      status: 'draft',
    }).select().single();

    if (data) {
      setMyListings((prev) => [data, ...prev]);
      setShowCreate(false);
      setActiveTab('my_listings');
    }
    if (error) toast.error(error.message);
  };

  const publishListing = async (id: string) => {
    await supabase.from('marketplace_listings')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', id);
    setMyListings((prev) => prev.map((l) => l.id === id ? { ...l, status: 'published' } : l));
  };

  const purchaseProgram = async (listing: MarketplaceListing) => {
    if (listing.price_cents === 0) {
      // Free — clone directly
      try {
        const res = await fetch('/api/marketplace/clone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listing_id: listing.id }),
        });
        const data = await res.json();
        if (data.success) toast.success('Program cloned to your library!');
        else toast.error(data.error ?? 'Failed to clone program');
      } catch { toast.error('Failed to clone program'); }
    } else {
      // Paid — redirect to Stripe checkout
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'marketplace',
          listing_id: listing.id,
          price_cents: listing.price_cents,
        }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    }
  };

  const formatPrice = (cents: number) => cents === 0 ? 'Free' : `$${(cents / 100).toFixed(2)}`;
  const stars = (rating: number) => '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

  const filteredListings = listings.filter((l) => {
    if (filterGoal !== 'all' && l.goal !== filterGoal) return false;
    if (search && !l.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'popular') return b.purchase_count - a.purchase_count;
    if (sortBy === 'rating') return b.avg_rating - a.avg_rating;
    if (sortBy === 'price_low') return a.price_cents - b.price_cents;
    if (sortBy === 'price_high') return b.price_cents - a.price_cents;
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return 0;
  });

  // ─── Create listing form ─────────────────────────────────────────
  if (showCreate) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Publish to Marketplace</h1>
          <button onClick={() => setShowCreate(false)} className="text-gray-500">Cancel</button>
        </div>
        <div className="space-y-4 bg-white rounded-xl border p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program to Sell</label>
            <select value={form.program_id} onChange={(e) => setForm({ ...form, program_id: e.target.value })} className="w-full border rounded-lg px-3 py-2">
              <option value="">Select a program...</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Listing Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. 12-Week Hypertrophy Blueprint" className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
            <input type="text" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} placeholder="One-liner for the listing card" className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5} placeholder="What the buyer gets, who it's for, what results to expect..." className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD)</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input type="number" value={form.price_cents / 100} onChange={(e) => setForm({ ...form, price_cents: Math.round(parseFloat(e.target.value || '0') * 100) })} step="0.01" min="0" className="w-32 border rounded-lg px-3 py-2" />
              <span className="text-gray-400 text-sm">Set to 0 for free</span>
            </div>
          </div>
          <button onClick={createListing} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">
            Create Listing (Draft)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Program Marketplace</h1>
          <p className="text-gray-500 text-sm mt-1">Browse, sell, and purchase training programs</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
          + Sell a Program
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setActiveTab('browse')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'browse' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>Browse</button>
        <button onClick={() => setActiveTab('my_listings')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'my_listings' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>My Listings ({myListings.length})</button>
      </div>

      {activeTab === 'browse' ? (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search programs..." className="border rounded-lg px-3 py-2 text-sm w-64" />
            <select value={filterGoal} onChange={(e) => setFilterGoal(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
              <option value="all">All Goals</option>
              {GOALS.map((g) => <option key={g} value={g}>{g.replace('_', ' ')}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredListings.map((listing) => (
                <div key={listing.id} className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-40 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    {listing.cover_image_url ? (
                      <img src={listing.cover_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white/50 text-5xl">🏋️</span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{listing.title}</h3>
                      <span className="text-lg font-bold text-indigo-600 shrink-0 ml-2">{formatPrice(listing.price_cents)}</span>
                    </div>
                    {listing.short_description && <p className="text-sm text-gray-500 line-clamp-2 mb-2">{listing.short_description}</p>}
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                      {listing.goal && <span className="capitalize">{listing.goal.replace('_', ' ')}</span>}
                      {listing.days_per_week && <span>{listing.days_per_week} days/wk</span>}
                      {listing.program_length_weeks && <span>{listing.program_length_weeks} weeks</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {listing.coach && (
                          <span className="text-xs text-gray-500">by {listing.coach.full_name}</span>
                        )}
                        {listing.avg_rating > 0 && (
                          <span className="text-xs text-amber-500">{stars(listing.avg_rating)} ({listing.review_count})</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{listing.purchase_count} sold</span>
                    </div>
                    <button onClick={() => purchaseProgram(listing)}
                      className="w-full mt-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                      {listing.price_cents === 0 ? 'Get Free' : 'Purchase'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          {myListings.map((listing) => (
            <div key={listing.id} className="bg-white rounded-xl border p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{listing.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    listing.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>{listing.status}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {formatPrice(listing.price_cents)} · {listing.purchase_count} sales · {listing.avg_rating > 0 ? `${listing.avg_rating} rating` : 'No ratings'}
                </p>
              </div>
              <div className="flex gap-2">
                {listing.status === 'draft' && (
                  <button onClick={() => publishListing(listing.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Publish</button>
                )}
              </div>
            </div>
          ))}
          {myListings.length === 0 && <p className="text-gray-500 text-center py-8">You haven't listed any programs yet.</p>}
        </div>
      )}
    </div>
  );
}
