'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';

interface Client {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  tags?: string[];
}

interface Program {
  id: string;
  title: string;
}

interface Props {
  clients: Client[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onActionComplete: () => void;
}

type BulkAction = 'assign_program' | 'send_reminder' | 'send_message' | 'export_data' | 'add_tag' | 'remove_tag';

export default function BulkClientActions({ clients, selectedIds, onSelectionChange, onActionComplete }: Props) {
  const supabase = createClient();

  const [action, setAction] = useState<BulkAction | null>(null);
  const [executing, setExecuting] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [messageText, setMessageText] = useState('');
  const [tagInput, setTagInput] = useState('');

  const selectedClients = clients.filter((c) => selectedIds.includes(c.id));

  const toggleAll = () => {
    if (selectedIds.length === clients.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(clients.map((c) => c.id));
    }
  };

  const openAction = async (a: BulkAction) => {
    setAction(a);
    if (a === 'assign_program' && programs.length === 0) {
      const { data } = await supabase.from('workout_programs').select('id, title').eq('status', 'active');
      if (data) setPrograms(data);
    }
  };

  // Auto-execute for simple actions (export, reminder) — runs once when action is set
  useEffect(() => {
    if ((action === 'export_data' || action === 'send_reminder') && !executing) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  const execute = async () => {
    if (selectedIds.length === 0) return;
    setExecuting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      switch (action) {
        case 'assign_program': {
          if (!selectedProgram) return;
          // Clone the program for each client
          const { data: sourceProgram } = await supabase
            .from('workout_programs')
            .select('*, workout_days(*, workout_exercises(*))')
            .eq('id', selectedProgram)
            .single();

          if (!sourceProgram) break;

          for (const clientId of selectedIds) {
            const { data: newProg } = await supabase.from('workout_programs').insert({
              coach_id: user.id,
              client_id: clientId,
              title: sourceProgram.title,
              description: sourceProgram.description,
              status: 'active',
              goal: sourceProgram.goal,
              days_per_week: sourceProgram.days_per_week,
            }).select().single();

            if (newProg && sourceProgram.workout_days) {
              for (const day of sourceProgram.workout_days) {
                const { data: newDay } = await supabase.from('workout_days').insert({
                  program_id: newProg.id,
                  day_number: day.day_number,
                  name: day.name,
                  focus: day.focus,
                  notes: day.notes,
                }).select().single();

                if (newDay && day.workout_exercises) {
                  const exercises = day.workout_exercises.map((ex: any, i: number) => ({
                    workout_day_id: newDay.id,
                    sort_order: i,
                    exercise_name: ex.exercise_name,
                    muscle_group: ex.muscle_group,
                    sets: ex.sets,
                    reps: ex.reps,
                    rpe: ex.rpe,
                    rest_seconds: ex.rest_seconds,
                    tempo: ex.tempo,
                    notes: ex.notes,
                  }));
                  await supabase.from('workout_exercises').insert(exercises);
                }
              }
            }
          }
          break;
        }

        case 'send_reminder': {
          // Send check-in reminders via push notifications
          const res = await fetch('/api/notifications/broadcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_ids: selectedIds,
              title: 'Check-in Reminder',
              body: 'Don\'t forget to submit your weekly check-in! Your coach is waiting for your update.',
              type: 'check_in_reminder',
            }),
          });
          if (!res.ok) throw new Error('Failed to send reminders');
          break;
        }

        case 'send_message': {
          if (!messageText.trim()) return;
          // Insert message for each client
          for (const clientId of selectedIds) {
            await supabase.from('messages').insert({
              sender_id: user.id,
              receiver_id: clientId,
              content: messageText.trim(),
              type: 'text',
            });
          }
          break;
        }

        case 'export_data': {
          // Fetch client data and generate CSV
          const rows = ['Name,Email,Created,Last Check-in'];
          for (const clientId of selectedIds) {
            const client = clients.find((c) => c.id === clientId);
            if (!client) continue;

            const { data: lastCheckIn } = await supabase
              .from('check_ins')
              .select('created_at')
              .eq('client_id', clientId)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            rows.push(
              `"${client.full_name}","${client.email}","${new Date().toLocaleDateString()}","${
                lastCheckIn ? new Date(lastCheckIn.created_at).toLocaleDateString() : 'Never'
              }"`
            );
          }

          const csv = rows.join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `clients-export-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          break;
        }

        case 'add_tag': {
          if (!tagInput.trim()) return;
          for (const clientId of selectedIds) {
            const client = clients.find((c) => c.id === clientId);
            const existingTags = client?.tags || [];
            if (!existingTags.includes(tagInput.trim())) {
              await supabase.from('profiles')
                .update({ tags: [...existingTags, tagInput.trim()] })
                .eq('id', clientId);
            }
          }
          break;
        }

        case 'remove_tag': {
          if (!tagInput.trim()) return;
          for (const clientId of selectedIds) {
            const client = clients.find((c) => c.id === clientId);
            const existingTags = client?.tags || [];
            await supabase.from('profiles')
              .update({ tags: existingTags.filter((t: string) => t !== tagInput.trim()) })
              .eq('id', clientId);
          }
          break;
        }
      }

      onActionComplete();
      setAction(null);
      setMessageText('');
      setTagInput('');
      setSelectedProgram('');
    } catch (err) {
      console.error('Bulk action error:', err);
      toast.error('Some actions failed. Please check and try again.');
    } finally {
      setExecuting(false);
    }
  };

  if (selectedIds.length === 0) {
    return (
      <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
        <input
          type="checkbox"
          checked={false}
          onChange={toggleAll}
          className="rounded border-gray-300"
        />
        <span className="text-sm text-gray-500">Select clients to perform bulk actions</span>
      </div>
    );
  }

  return (
    <div className="mb-4">
      {/* Selection bar */}
      <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
        <input
          type="checkbox"
          checked={selectedIds.length === clients.length}
          onChange={toggleAll}
          className="rounded border-indigo-300"
        />
        <span className="text-sm font-medium text-indigo-700">
          {selectedIds.length} client{selectedIds.length !== 1 ? 's' : ''} selected
        </span>
        <div className="flex gap-2 ml-auto">
          <button onClick={() => openAction('assign_program')}
            className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm font-medium text-indigo-700 hover:bg-indigo-50">
            Assign Program
          </button>
          <button onClick={() => openAction('send_reminder')}
            className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm font-medium text-indigo-700 hover:bg-indigo-50">
            Send Reminder
          </button>
          <button onClick={() => openAction('send_message')}
            className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm font-medium text-indigo-700 hover:bg-indigo-50">
            Send Message
          </button>
          <button onClick={() => openAction('add_tag')}
            className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm font-medium text-indigo-700 hover:bg-indigo-50">
            Add Tag
          </button>
          <button onClick={() => openAction('export_data')}
            className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm font-medium text-indigo-700 hover:bg-indigo-50">
            Export CSV
          </button>
          <button onClick={() => onSelectionChange([])}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">
            Clear
          </button>
        </div>
      </div>

      {/* Action modals */}
      {action && action !== 'export_data' && action !== 'send_reminder' && (
        <div className="mt-3 p-4 bg-white rounded-lg border shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3 capitalize">
            {action.replace('_', ' ')} — {selectedIds.length} clients
          </h3>

          {action === 'assign_program' && (
            <select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-3">
              <option value="">Select a program...</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          )}

          {action === 'send_message' && (
            <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)}
              rows={3} placeholder="Type your message..." className="w-full border rounded-lg px-3 py-2 mb-3" />
          )}

          {(action === 'add_tag' || action === 'remove_tag') && (
            <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              placeholder="Enter tag name..." className="w-full border rounded-lg px-3 py-2 mb-3" />
          )}

          <div className="flex gap-2">
            <button onClick={execute} disabled={executing}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {executing ? 'Executing...' : 'Execute'}
            </button>
            <button onClick={() => setAction(null)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Auto-execute for simple actions — handled via useEffect below */}
      {(action === 'export_data' || action === 'send_reminder') && (
        <div className="mt-3 p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-green-700 text-sm font-medium">
            {executing ? (action === 'export_data' ? 'Preparing export...' : 'Sending reminders...') : 'Done!'}
          </p>
        </div>
      )}
    </div>
  );
}
