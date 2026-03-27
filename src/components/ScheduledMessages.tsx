'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  AlertCircle,
  Loader,
  Plus,
  X,
  Calendar,
  Users,
} from 'lucide-react';

interface ScheduledMessage {
  id: string;
  client_id: string | null;
  content: string;
  scheduled_at: string;
  sent_at: string | null;
  status: 'pending' | 'sent' | 'canceled' | 'failed';
  type: 'text' | 'check_in_reminder' | 'motivation' | 'progress_update';
  created_at: string;
}

interface Client {
  id: string;
  email: string;
  full_name: string | null;
}

export default function ScheduledMessages() {
  const supabase = createClient();
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent'>('all');

  const [formData, setFormData] = useState({
    content: '',
    scheduled_at: '',
    scheduled_time: '',
    type: 'text' as const,
    client_id: '' as string | null,
    broadcast: false,
  });

  useEffect(() => {
    fetchMessages();
    fetchClients();

    const subscription = supabase
      .channel('scheduled_messages_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scheduled_messages' }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error: queryError } = await supabase
        .from('scheduled_messages')
        .select('*')
        .eq('coach_id', user.id)
        .order('scheduled_at', { ascending: false });

      if (queryError) throw queryError;
      setMessages(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('coach_id', user.id)
        .eq('role', 'client');
      setClients(data ?? []);
    } catch {
      // non-fatal
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setSubmitting(true);

      if (!formData.content.trim()) {
        setError('Message content is required');
        return;
      }

      if (!formData.scheduled_at || !formData.scheduled_time) {
        setError('Date and time are required');
        return;
      }

      if (!formData.broadcast && !formData.client_id) {
        setError('Select a client or enable broadcast');
        return;
      }

      const [year, month, day] = formData.scheduled_at.split('-');
      const [hours, minutes] = formData.scheduled_time.split(':');

      const scheduledAt = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
      );

      if (scheduledAt <= new Date()) {
        setError('Scheduled time must be in the future');
        return;
      }

      const payload = {
        content: formData.content,
        scheduled_at: scheduledAt.toISOString(),
        type: formData.type,
        client_id: formData.broadcast ? null : formData.client_id,
        status: 'pending',
      };

      const { error: insertError } = await supabase
        .from('scheduled_messages')
        .insert(payload);

      if (insertError) throw insertError;

      resetForm();
      fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule message');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      return;
    }
    try {
      setDeleting(id);
      setPendingDeleteId(null);
      const { error: deleteError } = await supabase
        .from('scheduled_messages')
        .update({ status: 'canceled' })
        .eq('id', id);

      if (deleteError) throw deleteError;
      fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    } finally {
      setDeleting(null);
    }
  };

  const resetForm = () => {
    setFormData({
      content: '',
      scheduled_at: '',
      scheduled_time: '',
      type: 'text',
      client_id: '' as string | null,
      broadcast: false,
    });
    setShowForm(false);
  };

  const getStatusIcon = (status: string) => {
    const iconClass = 'h-5 w-5';
    switch (status) {
      case 'sent':
        return <CheckCircle2 className={`${iconClass} text-emerald-600`} />;
      case 'pending':
        return <Clock className={`${iconClass} text-amber-600`} />;
      case 'failed':
        return <AlertCircle className={`${iconClass} text-red-600`} />;
      case 'canceled':
        return <XCircle className={`${iconClass} text-slate-400`} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'canceled':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: 'Message',
      check_in_reminder: 'Check-in',
      motivation: 'Motivation',
      progress_update: 'Progress Update',
    };
    return labels[type] || type;
  };

  const formatDateTime = (isoString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString));
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'All Clients (Broadcast)';
    const client = clients.find((c) => c.id === clientId);
    return client?.full_name || client?.email || 'Unknown';
  };

  const filteredMessages = messages.filter((msg) => {
    if (filter === 'pending') return msg.status === 'pending';
    if (filter === 'sent') return msg.status === 'sent';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader className="mx-auto mb-4 h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-slate-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Scheduled Messages</h2>
          <p className="mt-1 text-slate-600">Plan and automate your client communications</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5" />
          Schedule Message
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
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
              <h3 className="text-xl font-bold text-slate-900">Schedule New Message</h3>
              <button
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {/* Message Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Message Type</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value as any }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="text">Custom Message</option>
                  <option value="check_in_reminder">Check-in Reminder</option>
                  <option value="motivation">Motivation</option>
                  <option value="progress_update">Progress Update</option>
                </select>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Message Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, content: e.target.value }))
                  }
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Write your message here..."
                />
              </div>

              {/* Recipient */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.broadcast}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, broadcast: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                  />
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Users className="h-4 w-4" />
                    Send to all clients (Broadcast)
                  </label>
                </div>
              </div>

              {!formData.broadcast && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Send to Specific Client *
                  </label>
                  <select
                    value={formData.client_id || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        client_id: e.target.value || null,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select a client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.full_name || client.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Date *</label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      value={formData.scheduled_at}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, scheduled_at: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Time *</label>
                  <div className="relative mt-1">
                    <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="time"
                      value={formData.scheduled_time}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, scheduled_time: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
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
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Schedule Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {(['all', 'pending', 'sent'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-3 font-medium transition-colors ${
              filter === tab
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Messages List */}
      {filteredMessages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Send className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h3 className="text-lg font-medium text-slate-900">No messages</h3>
          <p className="mt-2 text-slate-600">
            {filter === 'all'
              ? 'Schedule your first message to get started'
              : `No ${filter} messages yet`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMessages.map((message) => (
            <div
              key={message.id}
              className="rounded-lg border border-slate-200 bg-white p-4 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(message.status)}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${getStatusColor(
                        message.status
                      )}`}
                    >
                      {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      {getTypeLabel(message.type)}
                    </span>
                  </div>

                  <p className="mt-2 text-slate-900 break-words">{message.content}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {getClientName(message.client_id)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDateTime(message.scheduled_at)}
                    </div>
                    {message.sent_at && (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Sent: {formatDateTime(message.sent_at)}
                      </div>
                    )}
                  </div>
                </div>

                {message.status === 'pending' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {pendingDeleteId === message.id ? (
                      <>
                        <button
                          onClick={() => setPendingDeleteId(null)}
                          className="text-xs px-2 py-1 rounded text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(message.id)}
                          disabled={deleting === message.id}
                          className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          Confirm
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDelete(message.id)}
                        disabled={deleting === message.id}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
