// Email utility using Resend API
// Graceful degradation if RESEND_API_KEY not set

interface EmailPayload {
  to: string
  subject: string
  html: string
  from?: string
}

const FROM_EMAIL = 'Propel <noreply@propelcoach.app>'

async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log('[Email] RESEND_API_KEY not set, would send:', payload.subject, 'to', payload.to)
    return true // graceful no-op
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: payload.from || FROM_EMAIL,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    })
    return res.ok
  } catch (err) {
    console.error('[Email] Send failed:', err)
    return false
  }
}

// ─── Email Templates ───────────────────────────────────────────────────────

function baseTemplate(content: string, previewText = ''): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Propel</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
${previewText ? `<div style="display:none;max-height:0;overflow:hidden;">${previewText}</div>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px 40px;text-align:center;">
    <span style="color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">⚡ Propel</span>
  </td></tr>
  <tr><td style="padding:40px;">
    ${content}
  </td></tr>
  <tr><td style="background:#f4f4f5;padding:24px 40px;text-align:center;">
    <p style="margin:0;color:#9ca3af;font-size:12px;">© 2026 Propel · <a href="#" style="color:#7c3aed;">Unsubscribe</a> · <a href="#" style="color:#7c3aed;">Privacy Policy</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

// ─── Sequence Emails ────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, coachName: string): Promise<boolean> {
  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:24px;font-weight:700;">Welcome to Propel, ${coachName}! 🎉</h1>
    <p style="color:#6b7280;font-size:16px;line-height:1.6;">You're 14 days away from transforming how you coach. Here's what to do first:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr><td style="padding:16px;background:#faf5ff;border-radius:8px;border-left:4px solid #7c3aed;margin-bottom:12px;">
        <strong style="color:#7c3aed;">Step 1:</strong> <span style="color:#374151;">Add your first client via the Clients tab</span>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;">
      <tr><td style="padding:16px;background:#faf5ff;border-radius:8px;border-left:4px solid #7c3aed;">
        <strong style="color:#7c3aed;">Step 2:</strong> <span style="color:#374151;">Build a workout program and assign it</span>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;">
      <tr><td style="padding:16px;background:#faf5ff;border-radius:8px;border-left:4px solid #7c3aed;">
        <strong style="color:#7c3aed;">Step 3:</strong> <span style="color:#374151;">Set macro targets for your client</span>
      </td></tr>
    </table>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://propelcoach.app'}/dashboard" style="display:inline-block;margin:24px 0 0;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">Go to Dashboard →</a>
    <p style="margin:24px 0 0;color:#9ca3af;font-size:14px;">Questions? Just reply to this email — we're here to help.</p>
  `, `Welcome to Propel, ${coachName}! Here's how to get started.`)

  return sendEmail({ to, subject: `Welcome to Propel, ${coachName}! Here's your quick-start guide 🚀`, html })
}

export async function sendDay3Email(to: string, coachName: string): Promise<boolean> {
  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:24px;font-weight:700;">Day 3 Check-in 👋</h1>
    <p style="color:#6b7280;font-size:16px;line-height:1.6;">Hey ${coachName}, you've had 3 days with Propel. Here's a tip to get more out of it:</p>
    <div style="background:#faf5ff;border-radius:12px;padding:24px;margin:24px 0;">
      <h2 style="margin:0 0 12px;color:#7c3aed;font-size:18px;">💡 Pro Tip: Use Check-in Templates</h2>
      <p style="margin:0;color:#374151;line-height:1.6;">Coaches who set up weekly check-in questions see 3x higher client engagement. Head to your dashboard and set up your first check-in template — it takes 2 minutes.</p>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://propelcoach.app'}/dashboard/check-ins" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">Set Up Check-ins →</a>
  `, `Day 3 tip: Check-in templates drive 3x engagement`)

  return sendEmail({ to, subject: `Quick tip for your coaching practice, ${coachName} 💡`, html })
}

export async function sendDay7Email(to: string, coachName: string, clientCount = 0): Promise<boolean> {
  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:24px;font-weight:700;">One week in! 🏆</h1>
    <p style="color:#6b7280;font-size:16px;line-height:1.6;">You're halfway through your free trial. ${clientCount > 0 ? `You have ${clientCount} client${clientCount > 1 ? 's' : ''} already — great start!` : "Let's make the most of your remaining 7 days."}</p>
    <div style="background:#f0fdf4;border-radius:12px;padding:24px;margin:24px 0;border:1px solid #bbf7d0;">
      <h2 style="margin:0 0 8px;color:#16a34a;font-size:18px;">Your trial ends in 7 days</h2>
      <p style="margin:0;color:#374151;">Upgrade now to keep all your client data, programs, and check-in history. No interruption to your coaching.</p>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://propelcoach.app'}/pricing" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">View Pricing Plans →</a>
  `, '7 days left in your trial — upgrade to keep everything')

  return sendEmail({ to, subject: `Your Propel trial: 7 days left ⏰`, html })
}

export async function sendTrialExpiring3DayEmail(to: string, coachName: string): Promise<boolean> {
  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:24px;font-weight:700;">3 days left on your trial ⏳</h1>
    <p style="color:#6b7280;font-size:16px;line-height:1.6;">Hey ${coachName}, your Propel trial expires in 3 days. Don't lose your data — upgrade now.</p>
    <div style="background:#fff7ed;border-radius:12px;padding:24px;margin:24px 0;border:1px solid #fed7aa;">
      <h2 style="margin:0 0 8px;color:#ea580c;font-size:18px;">⚠️ What happens when your trial ends</h2>
      <ul style="margin:8px 0 0;padding-left:20px;color:#374151;line-height:2;">
        <li>Your client profiles will be locked</li>
        <li>Check-in history will be archived</li>
        <li>Your programs will be saved but uneditable</li>
      </ul>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://propelcoach.app'}/pricing" style="display:inline-block;background:#ea580c;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">Upgrade Before It Expires →</a>
    <p style="margin:24px 0 0;color:#9ca3af;font-size:14px;">Starter plan is just $29/mo. Cancel anytime.</p>
  `, 'Trial expires in 3 days — upgrade to keep your data')

  return sendEmail({ to, subject: `⚠️ Your Propel trial expires in 3 days`, html })
}

export async function sendTrialExpiring1DayEmail(to: string, coachName: string): Promise<boolean> {
  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:24px;font-weight:700;">Last chance — trial ends tomorrow 🚨</h1>
    <p style="color:#6b7280;font-size:16px;line-height:1.6;">Hey ${coachName}, this is your final reminder. Your trial ends tomorrow.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://propelcoach.app'}/pricing" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:8px;font-weight:700;font-size:18px;">Upgrade Now — Keep Everything →</a>
    <p style="margin:24px 0 0;color:#9ca3af;font-size:14px;">Still unsure? Reply to this email and we'll help you pick the right plan.</p>
  `, 'Trial ends tomorrow — upgrade now')

  return sendEmail({ to, subject: `🚨 Final notice: Your Propel trial ends tomorrow`, html })
}

export async function sendTrialExpiredEmail(to: string, coachName: string): Promise<boolean> {
  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:24px;font-weight:700;">Your trial has ended</h1>
    <p style="color:#6b7280;font-size:16px;line-height:1.6;">Hey ${coachName}, your Propel trial has expired. Your data is safe — upgrade anytime to get back in.</p>
    <div style="background:#faf5ff;border-radius:12px;padding:24px;margin:24px 0;">
      <p style="margin:0;color:#374151;font-weight:600;">✅ All your client data is preserved</p>
      <p style="margin:8px 0 0;color:#374151;font-weight:600;">✅ Programs and check-ins are saved</p>
      <p style="margin:8px 0 0;color:#374151;font-weight:600;">✅ Upgrade and pick up right where you left off</p>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://propelcoach.app'}/trial/expired" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">Reactivate My Account →</a>
  `, 'Your data is safe — reactivate anytime')

  return sendEmail({ to, subject: `Your Propel trial has ended — reactivate anytime`, html })
}

export async function sendPaymentFailedEmail(to: string, coachName: string): Promise<boolean> {
  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:24px;font-weight:700;">Payment issue — action needed</h1>
    <p style="color:#6b7280;font-size:16px;line-height:1.6;">Hey ${coachName}, we couldn't process your last payment. Please update your payment method to avoid service interruption.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://propelcoach.app'}/dashboard/payments" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">Update Payment Method →</a>
  `, 'Update your payment method')

  return sendEmail({ to, subject: `⚠️ Payment failed for your Propel subscription`, html })
}

export async function sendWinBackEmail(to: string, coachName: string): Promise<boolean> {
  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;color:#111827;font-size:24px;font-weight:700;">We miss you, ${coachName} 👋</h1>
    <p style="color:#6b7280;font-size:16px;line-height:1.6;">It's been a while since you've used Propel. We've been busy adding new features:</p>
    <ul style="color:#374151;line-height:2;font-size:15px;">
      <li>📊 Body fat % tracking alongside weight</li>
      <li>🎥 Loom video check-in feedback</li>
      <li>📋 Printable PDF progress reports</li>
      <li>🏆 Client gamification and habit streaks</li>
    </ul>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://propelcoach.app'}/pricing" style="display:inline-block;margin-top:16px;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">Come Back — First Month 20% Off →</a>
  `, 'New features + 20% off to welcome you back')

  return sendEmail({ to, subject: `We've added a lot since you left, ${coachName} 🚀`, html })
}
