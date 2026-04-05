'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  XCircle,
} from 'lucide-react';

type ConcernSeverity = 'low' | 'medium' | 'high' | 'critical';
type ConcernCategory =
  | 'disordered_eating'
  | 'mental_health'
  | 'self_harm'
  | 'injury'
  | 'substance'
  | 'abuse'
  | 'other';
type ConcernStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

interface Concern {
  id: string;
  client_id: string;
  severity: ConcernSeverity;
  category: ConcernCategory;
  trigger_excerpt: string;
  ai_reasoning: string | null;
  status: ConcernStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  client_name: string | null;
  client_email: string | null;
}

const SEVERITY_CONFIG: Record<ConcernSeverity, { label: string; className: string }> = {
  critical: { label: 'Critical', className: 'text-red-400 bg-red-500/10 border-red-500/20' },
  high:     { label: 'High',     className: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  medium:   { label: 'Medium',   className: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  low:      { label: 'Low',      className: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
};

const CATEGORY_LABELS: Record<ConcernCategory, string> = {
  disordered_eating: 'Disordered Eating',
  mental_health:     'Mental Health',
  self_harm:         'Self-Harm',
  injury:            'Injury',
  substance:         'Substance',
  abuse:             'Abuse',
  other:             'Other',
};

const STATUS_CONFIG: Record<ConcernStatus, { label: string; icon: React.ComponentType<any>; className: string }> = {
  open:      { label: 'Open',      icon: AlertTriangle, className: 'text-red-400' },
  reviewing: { label: 'Reviewing', icon: Eye,           className: 'text-amber-400' },
  resolved:  { label: 'Resolved',  icon: CheckCircle,   className: 'text-green-400' },
  dismissed: { label: 'Dismissed', icon: XCircle,       className: 'text-cb-muted' },
};

export default function ConcernsPage() {
  const supabase = createClientComponentClient();

  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ConcernStatus | 'all'>('open');

  const fetchConcerns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('ai_coach_concerns')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data: concerns, error: err } = await query;
      if (err) throw err;

      if (!concerns || concerns.length === 0) {
        setConcerns([]);
        return;
      }

      // Fetch client profiles in one query
      const clientIds = [...new Set(concerns.map((c: any) => c.client_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', clientIds);

      const profileMap: Record<string, { full_name: string | null; email: string | null }> = {};
      for (const p of profiles ?? []) {
        profileMap[p.id] = { full_name: p.full_name, email: p.email };
      }

      setConcerns(
        concerns.map((c: any) => ({
          ...c,
          client_name: profileMap[c.client_id]?.full_name ?? null,
          client_email: profileMap[c.client_id]?.email ?? null,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load concerns');
    } finally {
      setLoading(false);
    }
  }, [supabase, filterStatus]);

  useEffect(() => {
    fetchConcerns();
  }, [fetchConcerns]);

  const updateStatus = async (id: string, status: ConcernStatus) => {
    try {
      setSaving(id);
      const notes = resolutionNotes[id] ?? null;
      const { error } = await supabase
        .from('ai_coach_concerns')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          resolution_notes: notes,
        })
        .eq('id', id);
      if (error) throw error;
      await fetchConcerns();
      setExpandedId(null);
    } catch (err) {
      console.error('Failed to update concern:', err);
    } finally {
      setSaving(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertCircle className="text-red-400" size={48} />
        <p className="text-cb-secondary">{error}</p>
        <button
          onClick={fetchConcerns}
          className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <AlertTriangle className="text-red-400" size={22} />
          <h1 className="text-xl font-bold text-cb-text">Safety Concerns</h1>
        </div>
        <p className="text-cb-secondary text-sm">
          Flagged by the AI coach when a client message requires human attention.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-card border border-cb-border rounded-lg p-1 w-fit">
        {(['open', 'reviewing', 'resolved', 'dismissed', 'all'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
              filterStatus === s
                ? 'bg-brand text-white'
                : 'text-cb-secondary hover:text-cb-text hover:bg-surface-light'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {concerns.length === 0 ? (
        <div className="text-center py-16 bg-card border border-cb-border rounded-xl">
          <CheckCircle className="mx-auto text-green-400 mb-3" size={40} />
          <p className="text-cb-text font-medium">No concerns found</p>
          <p className="text-cb-muted text-sm mt-1">
            {filterStatus === 'open' ? 'All clear — no open concerns right now.' : `No ${filterStatus} concerns.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {concerns.map((concern) => {
            const isExpanded = expandedId === concern.id;
            const severity = SEVERITY_CONFIG[concern.severity];
            const StatusIcon = STATUS_CONFIG[concern.status].icon;

            return (
              <div
                key={concern.id}
                className="bg-card border border-cb-border rounded-xl overflow-hidden"
              >
                {/* Row header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : concern.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-surface-light transition-colors"
                >
                  {/* Severity badge */}
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${severity.className}`}
                  >
                    {severity.label}
                  </span>

                  {/* Category */}
                  <span className="text-sm font-medium text-cb-text flex-shrink-0 w-36">
                    {CATEGORY_LABELS[concern.category]}
                  </span>

                  {/* Client */}
                  <div className="flex items-center gap-2 flex-shrink-0 w-44">
                    <div className="w-7 h-7 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-brand">
                        {getInitials(concern.client_name)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-cb-text truncate">
                        {concern.client_name ?? 'Unknown'}
                      </p>
                      <p className="text-[10px] text-cb-muted truncate">{concern.client_email ?? ''}</p>
                    </div>
                  </div>

                  {/* Excerpt preview */}
                  <p className="flex-1 text-xs text-cb-secondary truncate min-w-0">
                    "{concern.trigger_excerpt}"
                  </p>

                  {/* Status */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <StatusIcon
                      size={13}
                      className={STATUS_CONFIG[concern.status].className}
                    />
                    <span className="text-xs text-cb-muted">{STATUS_CONFIG[concern.status].label}</span>
                  </div>

                  {/* Time */}
                  <span className="text-xs text-cb-muted flex-shrink-0 hidden lg:block">
                    {formatDate(concern.created_at)}
                  </span>

                  {isExpanded ? (
                    <ChevronUp size={15} className="text-cb-muted flex-shrink-0" />
                  ) : (
                    <ChevronDown size={15} className="text-cb-muted flex-shrink-0" />
                  )}
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-cb-border bg-surface">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-xs font-semibold text-cb-muted uppercase tracking-wider mb-1.5">
                          Trigger excerpt
                        </p>
                        <p className="text-sm text-cb-text bg-card border border-cb-border rounded-lg px-3 py-2 italic">
                          "{concern.trigger_excerpt}"
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-cb-muted uppercase tracking-wider mb-1.5">
                          AI reasoning
                        </p>
                        <p className="text-sm text-cb-secondary bg-card border border-cb-border rounded-lg px-3 py-2">
                          {concern.ai_reasoning ?? 'No reasoning provided.'}
                        </p>
                      </div>
                    </div>

                    {concern.resolution_notes && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-cb-muted uppercase tracking-wider mb-1.5">
                          Resolution notes
                        </p>
                        <p className="text-sm text-cb-secondary">{concern.resolution_notes}</p>
                      </div>
                    )}

                    {concern.reviewed_at && (
                      <p className="text-xs text-cb-muted mt-3">
                        Reviewed {formatDate(concern.reviewed_at)}
                      </p>
                    )}

                    {/* Actions — only show for non-terminal statuses */}
                    {concern.status !== 'resolved' && concern.status !== 'dismissed' && (
                      <div className="mt-4 pt-4 border-t border-cb-border">
                        <p className="text-xs font-semibold text-cb-muted uppercase tracking-wider mb-2">
                          Resolution notes (optional)
                        </p>
                        <textarea
                          value={resolutionNotes[concern.id] ?? ''}
                          onChange={(e) =>
                            setResolutionNotes((prev) => ({ ...prev, [concern.id]: e.target.value }))
                          }
                          placeholder="Add notes about how this was handled..."
                          rows={2}
                          className="w-full px-3 py-2 bg-card border border-cb-border rounded-lg text-sm text-cb-text placeholder:text-cb-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors resize-none mb-3"
                        />
                        <div className="flex gap-2">
                          {concern.status === 'open' && (
                            <button
                              onClick={() => updateStatus(concern.id, 'reviewing')}
                              disabled={saving === concern.id}
                              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium rounded-lg hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                            >
                              {saving === concern.id ? (
                                <Loader size={12} className="animate-spin" />
                              ) : (
                                <Eye size={12} />
                              )}
                              Mark reviewing
                            </button>
                          )}
                          <button
                            onClick={() => updateStatus(concern.id, 'resolved')}
                            disabled={saving === concern.id}
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium rounded-lg hover:bg-green-500/20 transition-colors disabled:opacity-50"
                          >
                            {saving === concern.id ? (
                              <Loader size={12} className="animate-spin" />
                            ) : (
                              <CheckCircle size={12} />
                            )}
                            Resolve
                          </button>
                          <button
                            onClick={() => updateStatus(concern.id, 'dismissed')}
                            disabled={saving === concern.id}
                            className="flex items-center gap-1.5 px-3 py-2 bg-cb-border/50 text-cb-muted text-xs font-medium rounded-lg hover:bg-cb-border transition-colors disabled:opacity-50"
                          >
                            {saving === concern.id ? (
                              <Loader size={12} className="animate-spin" />
                            ) : (
                              <XCircle size={12} />
                            )}
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
