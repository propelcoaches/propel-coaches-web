export const dynamic = "force-dynamic";
/*
  Supabase Migration: Create support_tickets table

  Run this SQL in your Supabase dashboard:

  CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX idx_support_tickets_email ON support_tickets(email);
  CREATE INDEX idx_support_tickets_status ON support_tickets(status);
  CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at);
*/

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSupportTicketEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Lazy initialization — only evaluated at request time, not during build.
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase env vars")
  return createClient(url, key)
}



export async function POST(request: NextRequest) {
  // Public unauthenticated endpoint writing via service role — throttle per IP.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(`support-contact:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  const supabaseAdmin = getSupabaseAdmin()
  try {
    // Parse request body
    const body = await request.json() as ContactFormData;

    // Validate required fields
    if (!body.name || !body.email || !body.subject || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate types and lengths
    if (typeof body.name !== 'string' || body.name.length > 255) {
      return NextResponse.json({ error: 'name must be a string under 255 characters' }, { status: 400 });
    }
    if (typeof body.subject !== 'string' || body.subject.length > 255) {
      return NextResponse.json({ error: 'subject must be a string under 255 characters' }, { status: 400 });
    }
    if (typeof body.message !== 'string' || body.message.length > 10000) {
      return NextResponse.json({ error: 'message must be a string under 10,000 characters' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof body.email !== 'string' || body.email.length > 254 || !emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Store in Supabase
    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .insert([
        {
          name: body.name,
          email: body.email,
          subject: body.subject,
          message: body.message,
          status: 'open'
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save support ticket' },
        { status: 500 }
      );
    }

    // Send email notification (non-blocking)
    await sendSupportTicketEmail(body);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Support ticket created successfully',
        ticketId: data?.[0]?.id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
