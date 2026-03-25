'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'

export interface PricingPlan {
  name: string
  slug: string
  price: string
  period: string
  description: string
  highlight: boolean
  features: string[]
}

export default function PricingClient({ plans }: { plans: PricingPlan[] }) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleCheckout = async (planSlug: string) => {
    setLoading(planSlug)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planSlug,
          billing: 'monthly',
          email: '',
          coachId: '',
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('Failed to create checkout session:', data.error)
      }
    } catch (e) {
      console.error('Checkout error:', e)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-8 items-start">
      {plans.map(plan => (
        <div
          key={plan.slug}
          className={`rounded-2xl border transition-all ${
            plan.highlight
              ? 'bg-[#0F7B8C] text-white border-[#0F7B8C] shadow-2xl shadow-[#0F7B8C]/25 md:scale-105'
              : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
          }`}
        >
          <div className="p-8">
            {plan.highlight && (
              <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                ⭐ Most Popular
              </div>
            )}

            <h3 className={`text-2xl font-black mb-2 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
              {plan.name}
            </h3>
            <p className={`text-sm mb-6 ${plan.highlight ? 'text-white/70' : 'text-gray-500'}`}>
              {plan.description}
            </p>

            <div className="flex items-end gap-1 mb-8">
              <span className={`text-5xl font-black ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                £{plan.price}
              </span>
              <span className={`text-sm mb-2 ${plan.highlight ? 'text-white/70' : 'text-gray-500'}`}>
                {plan.period}
              </span>
            </div>

            <button
              onClick={() => handleCheckout(plan.slug)}
              disabled={loading === plan.slug}
              className={`block w-full text-center font-bold py-3 px-6 rounded-xl text-sm transition-colors mb-8 ${
                plan.highlight
                  ? 'bg-white text-[#0F7B8C] hover:bg-gray-50 disabled:opacity-70'
                  : 'bg-[#0F7B8C] text-white hover:bg-[#0d6b7a] disabled:opacity-70'
              }`}
            >
              {loading === plan.slug ? 'Processing...' : 'Start free trial'}
            </button>

            <ul className="space-y-4">
              {plan.features.map(feature => (
                <li
                  key={feature}
                  className={`flex items-start gap-3 text-sm ${
                    plan.highlight ? 'text-white/90' : 'text-gray-700'
                  }`}
                >
                  <Check
                    size={18}
                    className={`flex-shrink-0 mt-0.5 ${
                      plan.highlight ? 'text-white' : 'text-[#0F7B8C]'
                    }`}
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  )
}
