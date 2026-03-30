export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy initialization — only evaluated at request time, not during build.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: any;
function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing Supabase environment variables');
    _supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabase;
}

/**
 * Verify CRON_SECRET bearer token
 */
function verifyAuthToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken) {
    console.warn('CRON_SECRET environment variable not set');
    return false;
  }

  if (!authHeader) {
    return false;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || token !== expectedToken) {
    return false;
  }

  return true;
}

/**
 * Send a push notification to a client via Expo Push Notification service
 */
async function sendPushNotification(
  clientId: string,
  title: string,
  body: string
): Promise<void> {
  try {
    const { data: profile } = await getSupabase()
      .from('profiles')
      .select('push_token')
      .eq('id', clientId)
      .single()

    if (!profile?.push_token) return

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: profile.push_token, title, body }),
    })
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}

/**
 * Insert message into messages table
 */
async function insertMessage(
  coachId: string,
  clientId: string,
  content: string,
  type: string
): Promise<string | null> {
  try {
    const { data, error } = await getSupabase()
      .from('messages')
      .insert({
        coach_id: coachId,
        client_id: clientId,
        content,
        type,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;
    return data?.id || null;
  } catch (error) {
    console.error('Failed to insert message:', error);
    return null;
  }
}
/**
 * Process a single scheduled message
 */
async function processScheduledMessage(
  message: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const { id, coach_id, client_id, content, type } = message;

    if (client_id === null) {
      const { data: subscriptions, error: subscriptionError } = await getSupabase()
        .from('client_subscriptions')
        .select('client_id')
        .eq('coach_id', coach_id)
        .eq('status', 'active');

      if (subscriptionError) throw subscriptionError;

      const clientIds = subscriptions?.map((s: any) => s.client_id) || [];
      let successCount = 0;

      for (const cid of clientIds) {
        const messageId = await insertMessage(coach_id, cid, content, type);
        if (messageId) {
          successCount++;
          await sendPushNotification(cid, 'New Message', content.substring(0, 50) + '...');
        }
      }

      if (successCount > 0) {
        const { error: updateError } = await getSupabase()
          .from('scheduled_messages')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (updateError) throw updateError;
      }

      return { success: true };
    } else {
      const messageId = await insertMessage(coach_id, client_id, content, type);
      if (!messageId) {
        throw new Error('Failed to create message');
      }

      await sendPushNotification(client_id, 'New Message', content.substring(0, 50) + '...');

      const { error: updateError } = await getSupabase()
        .from('scheduled_messages')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;
      return { success: true };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to process scheduled message:', errorMessage);

    try {
      await getSupabase()
        .from('scheduled_messages')
        .update({ status: 'failed' })
        .eq('id', message.id);
    } catch (updateError) {
      console.error('Failed to mark message as failed:', updateError);
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * GET /api/messages/scheduled
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
  if (!verifyAuthToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    status: 'ready',
    message: 'POST to process scheduled messages',
  });
}

/**
 * POST /api/messages/scheduled
 * Process pending scheduled messages
 * Protected by CRON_SECRET bearer token
 */
export async function POST(request: NextRequest) {
  try {
    if (!verifyAuthToken(request)) {
      console.warn('Unauthorized attempt to process scheduled messages');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date().toISOString();
    const { data: pendingMessages, error: fetchError } = await getSupabase()
      .from('scheduled_messages')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(100);

    if (fetchError) {
      console.error('Database error fetching pending messages:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch pending messages' },
        { status: 500 }
      );
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No pending messages to process',
      });
    }

    const results = await Promise.allSettled(
      pendingMessages.map((msg: any) => processScheduledMessage(msg))
    );

    const successCount = results.filter((r) => r.status === 'fulfilled' && (r as any).value.success).length;
    const failureCount = results.filter((r) => r.status === 'rejected' || !(r as any).value?.success).length;

    return NextResponse.json({
      success: true,
      processed: pendingMessages.length,
      succeeded: successCount,
      failed: failureCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Unexpected error in scheduled messages processor:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
