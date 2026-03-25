'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Review {
  id: string;
  coach_id: string;
  client_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_public: boolean;
  is_featured: boolean;
  communication_rating: number | null;
  knowledge_rating: number | null;
  program_quality_rating: number | null;
  value_rating: number | null;
  coach_response: string | null;
  coach_responded_at: string | null;
  days_as_client: number | null;
  created_at: string;
  client?: { full_name: string; avatar_url: string | null };
}

export default function ReviewsPage() {
  const supabase = createClientComponentClient();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ avg: 0, total: 0, dist: [0, 0, 0, 0, 0] });
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('coach_reviews')
      .select('*, client:profiles!coach_reviews_client_id_fkey(full_name, avatar_url)')
      .order('created_at', { ascending: false });

    if (data) {
      setReviews(data as Review[]);
      // Calculate stats
      const total = data.length;
      const avg = total > 0 ? data.reduce((sum: number, r: any) => sum + r.rating, 0) / total : 0;
      const dist = [0, 0, 0, 0, 0];
      data.forEach((r: any) => { dist[r.rating - 1]++; });
      setStats({ avg: Math.round(avg * 10) / 10, total, dist });
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const submitResponse = async (reviewId: string) => {
    if (!responseText.trim()) return;
    const { data } = await supabase.from('coach_reviews').update({
      coach_response: responseText.trim(),
      coach_responded_at: new Date().toISOString(),
    }).eq('id', reviewId).select().single();

    if (data) {
      setReviews((prev) => prev.map((r) => r.id === reviewId ? { ...r, ...data } : r));
    }
    setRespondingTo(null);
    setResponseText('');
  };

  const toggleFeatured = async (review: Review) => {
    const { data } = await supabase.from('coach_reviews')
      .update({ is_featured: !review.is_featured })
      .eq('id', review.id).select().single();
    if (data) setReviews((prev) => prev.map((r) => r.id === data.id ? { ...r, ...data } : r));
  };

  const stars = (rating: number) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

  if (loading) return <div className="p-6 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h1>
          <p className="text-gray-500 text-sm mt-1">Client testimonials for your public profile</p>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-6 text-center">
          <div className="text-4xl font-bold text-amber-500">{stats.avg}</div>
          <div className="text-amber-400 text-lg mt-1">{stars(Math.round(stats.avg))}</div>
          <div className="text-sm text-gray-500 mt-1">{stats.total} review{stats.total !== 1 ? 's' : ''}</div>
        </div>
        <div className="bg-white rounded-xl border p-6 col-span-2">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Rating Distribution</h3>
          {[5, 4, 3, 2, 1].map((n) => {
            const count = stats.dist[n - 1];
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <div key={n} className="flex items-center gap-2 mb-1.5">
                <span className="text-sm text-gray-500 w-8">{n} ★</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-xl border p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-medium text-gray-500">
                  {review.client?.full_name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{review.client?.full_name || 'Anonymous'}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-amber-500">{stars(review.rating)}</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                    {review.days_as_client && (
                      <>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-500">{review.days_as_client} days as client</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {review.is_featured && <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 font-medium">Featured</span>}
                <button onClick={() => toggleFeatured(review)}
                  className="text-sm text-gray-400 hover:text-amber-500">
                  {review.is_featured ? 'Unfeature' : 'Feature'}
                </button>
              </div>
            </div>

            {review.title && <h3 className="font-semibold text-gray-900 mt-3">{review.title}</h3>}
            {review.body && <p className="text-gray-600 text-sm mt-1">{review.body}</p>}

            {/* Sub-ratings */}
            {(review.communication_rating || review.knowledge_rating || review.program_quality_rating || review.value_rating) && (
              <div className="flex gap-4 mt-3 text-sm">
                {review.communication_rating && <span className="text-gray-500">Communication: <span className="text-amber-500">{stars(review.communication_rating)}</span></span>}
                {review.knowledge_rating && <span className="text-gray-500">Knowledge: <span className="text-amber-500">{stars(review.knowledge_rating)}</span></span>}
                {review.program_quality_rating && <span className="text-gray-500">Programs: <span className="text-amber-500">{stars(review.program_quality_rating)}</span></span>}
                {review.value_rating && <span className="text-gray-500">Value: <span className="text-amber-500">{stars(review.value_rating)}</span></span>}
              </div>
            )}

            {/* Coach response */}
            {review.coach_response ? (
              <div className="mt-4 ml-4 pl-4 border-l-2 border-indigo-200 bg-indigo-50/50 rounded-r-lg p-3">
                <p className="text-sm font-medium text-indigo-700 mb-1">Your Response</p>
                <p className="text-sm text-gray-600">{review.coach_response}</p>
              </div>
            ) : respondingTo === review.id ? (
              <div className="mt-4 ml-4">
                <textarea value={responseText} onChange={(e) => setResponseText(e.target.value)}
                  rows={3} placeholder="Write your response..."
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => submitResponse(review.id)}
                    className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                    Submit Response
                  </button>
                  <button onClick={() => { setRespondingTo(null); setResponseText(''); }}
                    className="px-4 py-1.5 text-gray-500 text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setRespondingTo(review.id)}
                className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Reply to this review
              </button>
            )}
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border">
            <div className="text-4xl mb-3">⭐</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No reviews yet</h3>
            <p className="text-gray-500">Clients are automatically prompted to review after 30 days.</p>
          </div>
        )}
      </div>
    </div>
  );
}
