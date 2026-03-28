'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Video } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';
import EmptyState from '@/components/EmptyState';

interface FormCheck {
  id: string;
  client_id: string;
  video_url: string;
  thumbnail_url: string | null;
  exercise_name: string;
  set_number: number | null;
  weight_used: string | null;
  reps_performed: number | null;
  ai_status: 'pending' | 'processing' | 'completed' | 'failed';
  ai_analysis: AiAnalysis | null;
  coach_reviewed: boolean;
  coach_notes: string;
  created_at: string;
  client?: { full_name: string; avatar_url: string | null };
}

interface AiAnalysis {
  overall_score: number;
  summary: string;
  strengths: { cue: string; detail: string }[];
  improvements: { cue: string; detail: string; priority: string; drill: string }[];
  safety_concerns: { concern: string; recommendation: string }[];
  coaching_cues: string[];
  recommended_deload: boolean;
}

export default function FormCheckPage() {
  // Stable client instance — avoid recreating on every render
  const supabase = useMemo(() => createClient(), []);

  const [formChecks, setFormChecks] = useState<FormCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCheck, setSelectedCheck] = useState<FormCheck | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [coachNotes, setCoachNotes] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const fetchFormChecks = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('form_checks')
      .select('*, client:profiles!form_checks_client_id_fkey(full_name, avatar_url)')
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setFormChecks(data as FormCheck[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchFormChecks(); }, [fetchFormChecks]);

  // Realtime subscription for status updates
  useEffect(() => {
    const channel = supabase
      .channel('form-checks')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'form_checks' }, (payload) => {
        setFormChecks((prev) =>
          prev.map((fc) => (fc.id === payload.new.id ? { ...fc, ...payload.new } : fc))
        );
        if (selectedCheck?.id === payload.new.id) {
          setSelectedCheck((prev) => prev ? { ...prev, ...payload.new } : prev);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, selectedCheck]);

  const runAnalysis = async (id: string) => {
    setAnalyzing(id);
    try {
      const res = await fetch('/api/ai/form-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_check_id: id }),
      });
      const data = await res.json();
      if (data.analysis) {
        setFormChecks((prev) =>
          prev.map((fc) =>
            fc.id === id ? { ...fc, ai_status: 'completed', ai_analysis: data.analysis } : fc
          )
        );
        if (selectedCheck?.id === id) {
          setSelectedCheck((prev) => prev ? { ...prev, ai_status: 'completed', ai_analysis: data.analysis } : prev);
        }
      }
    } catch {
      toast.error('Failed to analyze form check');
    } finally {
      setAnalyzing(null);
    }
  };

  const saveCoachReview = async () => {
    if (!selectedCheck) return;
    await supabase.from('form_checks').update({
      coach_reviewed: true,
      coach_notes: coachNotes,
      coach_reviewed_at: new Date().toISOString(),
    }).eq('id', selectedCheck.id);

    setSelectedCheck((prev) => prev ? { ...prev, coach_reviewed: true, coach_notes: coachNotes } : prev);
    setFormChecks((prev) =>
      prev.map((fc) => fc.id === selectedCheck.id ? { ...fc, coach_reviewed: true, coach_notes: coachNotes } : fc)
    );
  };

  const filtered = formChecks.filter((fc) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return fc.ai_status === 'pending';
    if (filter === 'reviewed') return fc.coach_reviewed;
    if (filter === 'unreviewed') return fc.ai_status === 'completed' && !fc.coach_reviewed;
    return true;
  });

  const scoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  // ─── Detail View ──────────────────────────────────────────────────
  if (selectedCheck) {
    const analysis = selectedCheck.ai_analysis;

    return (
      <div className="max-w-5xl mx-auto p-6">
        <button onClick={() => setSelectedCheck(null)} className="text-indigo-600 hover:text-indigo-700 text-sm mb-4">
          ← Back to form checks
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video + info */}
          <div>
            <div className="bg-black rounded-xl overflow-hidden aspect-video mb-4">
              <video src={selectedCheck.video_url} controls className="w-full h-full object-contain" />
            </div>
            <div className="bg-surface border border-cb-border rounded-xl p-4">
              <h2 className="font-semibold text-gray-900 text-lg">{selectedCheck.exercise_name}</h2>
              <div className="flex gap-4 mt-2 text-sm text-gray-500">
                {selectedCheck.weight_used && <span>Weight: {selectedCheck.weight_used}</span>}
                {selectedCheck.reps_performed && <span>Reps: {selectedCheck.reps_performed}</span>}
                {selectedCheck.set_number && <span>Set: {selectedCheck.set_number}</span>}
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {selectedCheck.client?.full_name} · {new Date(selectedCheck.created_at).toLocaleDateString()}
              </p>

              {selectedCheck.ai_status === 'pending' && (
                <button
                  onClick={() => runAnalysis(selectedCheck.id)}
                  disabled={analyzing === selectedCheck.id}
                  className="mt-4 w-full py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 disabled:opacity-50"
                >
                  {analyzing === selectedCheck.id ? 'Analyzing...' : '🤖 Run AI Analysis'}
                </button>
              )}
              {selectedCheck.ai_status === 'processing' && (
                <div className="mt-4 text-center py-3 bg-indigo-50 rounded-lg text-indigo-600 text-sm font-medium">
                  Processing...
                </div>
              )}
            </div>
          </div>

          {/* Analysis results */}
          <div className="space-y-4">
            {analysis ? (
              <>
                {/* Score */}
                <div className="bg-surface border border-cb-border rounded-xl p-4 flex items-center gap-4">
                  <div className={`text-3xl font-bold rounded-xl w-16 h-16 flex items-center justify-center ${scoreColor(analysis.overall_score)}`}>
                    {analysis.overall_score}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Overall Form Score</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{analysis.summary}</p>
                  </div>
                </div>

                {analysis.recommended_deload && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-700 font-medium text-sm">⚠️ Deload recommended — form is significantly compromised at this weight.</p>
                  </div>
                )}

                {/* Coaching cues */}
                <div className="bg-surface border border-cb-border rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Quick Coaching Cues</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.coaching_cues.map((cue, i) => (
                      <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                        {cue}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Strengths */}
                {analysis.strengths.length > 0 && (
                  <div className="bg-surface border border-cb-border rounded-xl p-4">
                    <h3 className="font-semibold text-green-700 mb-3">Strengths</h3>
                    <div className="space-y-3">
                      {analysis.strengths.map((s, i) => (
                        <div key={i}>
                          <p className="font-medium text-gray-900 text-sm">{s.cue}</p>
                          <p className="text-gray-500 text-sm">{s.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvements */}
                {analysis.improvements.length > 0 && (
                  <div className="bg-surface border border-cb-border rounded-xl p-4">
                    <h3 className="font-semibold text-amber-700 mb-3">Areas for Improvement</h3>
                    <div className="space-y-3">
                      {analysis.improvements.map((imp, i) => (
                        <div key={i} className="border-l-2 border-amber-300 pl-3">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 text-sm">{imp.cue}</p>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              imp.priority === 'high' ? 'bg-red-100 text-red-600' :
                              imp.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>{imp.priority}</span>
                          </div>
                          <p className="text-gray-500 text-sm mt-0.5">{imp.detail}</p>
                          {imp.drill && (
                            <p className="text-indigo-600 text-sm mt-1">Drill: {imp.drill}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Safety */}
                {analysis.safety_concerns.length > 0 && (
                  <div className="bg-red-50 rounded-xl border border-red-200 p-4">
                    <h3 className="font-semibold text-red-700 mb-3">Safety Concerns</h3>
                    <div className="space-y-2">
                      {analysis.safety_concerns.map((sc, i) => (
                        <div key={i}>
                          <p className="font-medium text-red-800 text-sm">{sc.concern}</p>
                          <p className="text-red-600 text-sm">{sc.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Coach notes */}
                <div className="bg-surface border border-cb-border rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Coach Notes</h3>
                  <textarea
                    value={coachNotes}
                    onChange={(e) => setCoachNotes(e.target.value)}
                    rows={3}
                    placeholder="Add your personal feedback for the client..."
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    onClick={saveCoachReview}
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    {selectedCheck.coach_reviewed ? 'Update Review' : 'Save & Mark Reviewed'}
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border p-8 text-center">
                <p className="text-gray-500">
                  {selectedCheck.ai_status === 'pending' ? 'Run AI analysis to get form feedback.' :
                   selectedCheck.ai_status === 'processing' ? 'Analysis in progress...' :
                   selectedCheck.ai_status === 'failed' ? 'Analysis failed. Try again.' : 'No analysis available.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── List View ────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Check Reviews</h1>
          <p className="text-gray-500 text-sm mt-1">AI-powered movement analysis for your clients</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'unreviewed', 'reviewed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-brand text-white' : 'bg-surface-light text-cb-secondary hover:bg-cb-border/50'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Video size={48} />}
          title="No form checks yet"
          description="Clients can upload workout videos from the mobile app for AI-powered movement analysis."
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((fc) => (
            <div key={fc.id} onClick={() => { setSelectedCheck(fc); setCoachNotes(fc.coach_notes || ''); }}
              className="bg-surface border border-cb-border rounded-xl p-4 hover:shadow-md hover:border-brand/20 transition-all duration-200 cursor-pointer flex items-center gap-4">
              <div className="w-20 h-14 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                {fc.thumbnail_url ? (
                  <img src={fc.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">📹</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">{fc.exercise_name}</h3>
                  {fc.ai_analysis && (
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${scoreColor(fc.ai_analysis.overall_score)}`}>
                      {fc.ai_analysis.overall_score}/10
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {fc.client?.full_name} · {fc.weight_used || ''} {fc.reps_performed ? `× ${fc.reps_performed}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  fc.ai_status === 'completed' ? 'bg-green-100 text-green-700' :
                  fc.ai_status === 'processing' ? 'bg-blue-100 text-blue-700' :
                  fc.ai_status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{fc.ai_status}</span>
                {fc.coach_reviewed && <span className="text-green-500 text-sm">✓</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
