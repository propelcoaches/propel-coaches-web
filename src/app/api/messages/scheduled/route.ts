import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

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
 * Send a push notification to a client
 * This is a placeholder implementation - integrate with your push notification service
 */
async function sendPushNotification(
  clientId: string,
  title: string,
  body: string
): Promise<void> {
  try {
    // TODO: Integrate with your push notification service
    // Examples: Firebase Cloud Messaging, OneSignal, Pusher, etc.
    console.log(`Push notification to ${clientId}: ${title} - ${body}`);

    // Example Firebase implementation:
    // const message = {
    //   notification: { title, body },
    //   token: deviceToken, // Retrieved from your device_tokens table
    // };
    // await admin.messaging().send(message);
  } catch (error) {
    console.error('Failed to send push notification:', error);
    // Don't throw - notification failure shouldn't block message processing
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
    const { data, error } = await supabase
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

    // If broadcast (client_id is null), send to all clients of this coach
    if (client_id === null) {
      const { data: subscriptions, error: subscriptionError } = await supabase
        .from('client_subscriptions')
        .select('client_id')
        .eq('coach_id', coach_id)
        .eq('status', 'active');

      if (subscriptionError) throw subscriptionError;

      const clientIds = subscriptions?.map((s) => s.client_id) || [];
      let successCount = 0;

      for (const cid of clientIds) {
        const messageId = await insertMessage(coach_id, cid, content, type);
        if (messageId) {
          successCount++;
          // Send push notification
          await sendPushNotification(cid, 'New Message', content.substring(0, 50) + '...');
        }
      }

      // Mark as sent only if at least one message succeeded
      if (successCount > 0) {
        const { error: updateError } = await supabase
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
      // Send to specific client
      const messageId = await insertMessage(coach_id, client_id, content, type);

      if (!messageId) {
        throw new Error('Failed to create message');
      }

      // Send push notification
      await sendPushNotification(client_id, 'New Message', content.substring(0, 50) + '...');

      // Update scheduled message status
      const { error: updateError } = await supabase
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
    console.error(`Failed to process scheduled message:`, errorMessage);

    // Mark as failed
    try {
      await supabase
        .from('scheduled_messages')
        .update({
          status: 'failed',
        })
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
    // Verify authentication
    if (!verifyAuthToken(request)) {
      console.warn('Unauthorized attempt to process scheduled messages');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch pending scheduled messages due now or in the past
    const now = new Date().toISOString();

    const { data: pendingMessages, error: fetchError } = await supabase
      .from('scheduled_messages')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(100); // Process max 100 messages per cron run

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

    // Process each scheduled message
    const results = await Promise.allSettled(
      pendingMessages.map((msg) => processScheduledMessage(msg))
    );

    const successCount = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    const failureCount = results.filter((r) => r.status === 'rejected' || !r.value.success).length;

    console.log(
      `Processed ${pendingMessages.length} scheduled messages: ${successCount} succeeded, ${failureCount} failed`
    );

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

/**
 * Example cron job configuration for Vercel:
 *
 * In vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/messages/scheduled",
 *     "schedule": "*/5 * * * *"
 *   }]
 * }
 *
 * Example cron job configuration for other platforms:
 *
 * Using an external service (e.g., Upstash, EasyCron):
 * - POST to: https://your-domain.com/api/messages/scheduled
 * - Headers: Authorization: Bearer YOUR_CRON_SECRET
 * - Frequency: Every 5 minutes (or your preferred interval)
 *
 * The CRON_SECRET should be a strong, random string:
 * - Add to .env.local: CRON_SECRET=your-secret-key
 * - Add to production environment variables in your deployment platform
 */
