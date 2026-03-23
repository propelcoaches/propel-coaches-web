// Lightweight Stripe REST API helper — no npm package needed
const STRIPE_BASE = 'https://api.stripe.com/v1'

function stripeHeaders() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('no_key')
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }
}

export async function stripeGet(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${STRIPE_BASE}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), { headers: stripeHeaders() })
  return res.json()
}

export async function stripePost(path: string, body: Record<string, string>) {
  const res = await fetch(`${STRIPE_BASE}${path}`, {
    method: 'POST',
    headers: stripeHeaders(),
    body: new URLSearchParams(body).toString(),
  })
  return res.json()
}
