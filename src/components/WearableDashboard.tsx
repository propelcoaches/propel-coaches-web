'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface DailySummary {
  date: string;
  steps: number | null;
  calories_burned: number | null;
  active_minutes: number | null;
  distance_km: number | null;
  resting_heart_rate: number | null;
  avg_heart_rate: number | null;
  hrv_avg: number | null;
  sleep_hours: number | null;
  sleep_quality_score: number | null;
  deep_sleep_hours: number | null;
  recovery_score: number | null;
  strain_score: number | null;
  readiness_score: number | null;
  provider: string;
}

interface WearableConnection {
  id: string;
  provider: string;
  is_active: boolean;
  last_synced_at: string | null;
}

interface Props {
  clientId: string;
  clientName?: string;
}

const PROVIDER_LABELS: Record<string, { name: string; color: string; icon: string }> = {
  apple_health: { name: 'Apple Health', color: '#FF2D55', icon: '❤️' },
  garmin: { name: 'Garmin', color: '#007CC3', icon: '⌚' },
  whoop: { name: 'WHOOP', color: '#00B140', icon: '💪' },
  oura: { name: 'Oura', color: '#8B5CF6', icon: '💍' },
  fitbit: { name: 'Fitbit', color: '#00B0B9', icon: '📱' },
};

export default function WearableDashboard({ clientId, clientName }: Props) {
  const supabase = createClientComponentClient();

  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [connections, setConnections] = useState<WearableConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [summariesRes, connectionsRes] = await Promise.all([
      supabase
        .from('wearable_daily_summaries')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true }),
      supabase
        .from('wearable_connections')
        .select('*')
        .eq('client_id', clientId),
    ]);

    if (summariesRes.data) setSummaries(summariesRes.data);
    if (connectionsRes.data) setConnections(connectionsRes.data);
    setLoading(false);
  }, [supabase, clientId, days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Averages
  const avg = (key: keyof DailySummary) => {
    const vals = summaries.filter((s) => s[key] != null).map((s) => Number(s[key]));
    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };

  const avgDecimal = (key: keyof DailySummary) => {
    const vals = summaries.filter((s) => s[key] != null).map((s) => Number(s[key]));
    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : null;
  };

  const latest = summaries.length > 0 ? summaries[summaries.length - 1] : null;

  if (loading) return <div className="text-gray-500 text-sm py-4">Loading wearable data...</div>;

  if (connections.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center">
        <div className="text-3xl mb-2">⌚</div>
        <h3 className="font-semibold text-gray-900 mb-1">No Wearables Connected</h3>
        <p className="text-sm text-gray-500">
          {clientName || 'This client'} hasn't connected a wearable device yet.
          They can connect Apple Health, Garmin, WHOOP, or Oura from the mobile app.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connected devices */}
      <div className="flex items-center gap-3">
        <h3 className="font-semibold text-gray-900 text-sm">Connected Devices</h3>
        {connections.map((c) => {
          const provider = PROVIDER_LABELS[c.provider] || { name: c.provider, color: '#6b7280', icon: '📱' };
          return (
            <span key={c.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: provider.color }}>
              {provider.icon} {provider.name}
              {c.last_synced_at && (
                <span className="opacity-75 ml-1">
                  · synced {new Date(c.last_synced_at).toLocaleDateString()}
                </span>
              )}
            </span>
          );
        })}
        <div className="ml-auto flex gap-1">
          {[7, 14, 30].map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1 rounded text-xs font-medium ${days === d ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {summaries.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-500">
          No data available for the last {days} days.
        </div>
      ) : (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <MetricCard label="Avg Steps" value={avg('steps')} unit="" icon="👣" color="text-blue-600" />
            <MetricCard label="Avg Calories" value={avg('calories_burned')} unit="kcal" icon="🔥" color="text-orange-600" />
            <MetricCard label="Avg Active Min" value={avg('active_minutes')} unit="min" icon="🏃" color="text-green-600" />
            <MetricCard label="Avg Sleep" value={avgDecimal('sleep_hours')} unit="hrs" icon="😴" color="text-purple-600" />
            <MetricCard label="Resting HR" value={avg('resting_heart_rate')} unit="bpm" icon="❤️" color="text-red-600" />
            <MetricCard label="HRV" value={avgDecimal('hrv_avg')} unit="ms" icon="📈" color="text-teal-600" />
          </div>

          {/* WHOOP / Oura specific */}
          {(latest?.recovery_score || latest?.readiness_score || latest?.strain_score) && (
            <div className="grid grid-cols-3 gap-3">
              {latest?.recovery_score != null && (
                <div className={`rounded-xl p-4 text-center ${
                  latest.recovery_score >= 67 ? 'bg-green-50' : latest.recovery_score >= 34 ? 'bg-yellow-50' : 'bg-red-50'
                }`}>
                  <div className={`text-2xl font-bold ${
                    latest.recovery_score >= 67 ? 'text-green-700' : latest.recovery_score >= 34 ? 'text-yellow-700' : 'text-red-700'
                  }`}>{latest.recovery_score}%</div>
                  <div className="text-xs text-gray-500 mt-1">Recovery Score</div>
                </div>
              )}
              {latest?.strain_score != null && (
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-700">{latest.strain_score}</div>
                  <div className="text-xs text-gray-500 mt-1">Strain Score</div>
                </div>
              )}
              {latest?.readiness_score != null && (
                <div className={`rounded-xl p-4 text-center ${
                  latest.readiness_score >= 70 ? 'bg-green-50' : latest.readiness_score >= 50 ? 'bg-yellow-50' : 'bg-red-50'
                }`}>
                  <div className={`text-2xl font-bold ${
                    latest.readiness_score >= 70 ? 'text-green-700' : latest.readiness_score >= 50 ? 'text-yellow-700' : 'text-red-700'
                  }`}>{latest.readiness_score}</div>
                  <div className="text-xs text-gray-500 mt-1">Readiness Score</div>
                </div>
              )}
            </div>
          )}

          {/* Daily breakdown */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-900 text-sm">Daily Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Date</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500">Steps</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500">Cal</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500">Active</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500">Sleep</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500">RHR</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500">HRV</th>
                    {summaries.some((s) => s.recovery_score != null) && (
                      <th className="text-right px-3 py-2 font-medium text-gray-500">Recovery</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((s) => (
                    <tr key={s.date} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-700">{new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                      <td className="text-right px-3 py-2 text-gray-900 font-medium">{s.steps?.toLocaleString() ?? '—'}</td>
                      <td className="text-right px-3 py-2 text-gray-600">{s.calories_burned ?? '—'}</td>
                      <td className="text-right px-3 py-2 text-gray-600">{s.active_minutes ? `${s.active_minutes}m` : '—'}</td>
                      <td className="text-right px-3 py-2 text-gray-600">{s.sleep_hours ? `${s.sleep_hours}h` : '—'}</td>
                      <td className="text-right px-3 py-2 text-gray-600">{s.resting_heart_rate ?? '—'}</td>
                      <td className="text-right px-3 py-2 text-gray-600">{s.hrv_avg ?? '—'}</td>
                      {summaries.some((ss) => ss.recovery_score != null) && (
                        <td className="text-right px-3 py-2">
                          {s.recovery_score != null ? (
                            <span className={`font-medium ${
                              s.recovery_score >= 67 ? 'text-green-600' : s.recovery_score >= 34 ? 'text-yellow-600' : 'text-red-600'
                            }`}>{s.recovery_score}%</span>
                          ) : '—'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value, unit, icon, color }: {
  label: string;
  value: number | null;
  unit: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border p-3 text-center">
      <div className="text-lg mb-0.5">{icon}</div>
      <div className={`text-xl font-bold ${color}`}>
        {value != null ? value.toLocaleString() : '—'}
      </div>
      {value != null && unit && <span className="text-xs text-gray-400">{unit}</span>}
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
