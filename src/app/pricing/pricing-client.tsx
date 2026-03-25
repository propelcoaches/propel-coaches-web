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
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const handleCheckout = async (planSlug: string) => {
    setLoading(planSlug)
    setCheckoutError(null)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planSlug, billing: 'monthly', email: '', coachId: '' }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setCheckoutError('Could not start checkout. Please try again or contact support.')
      }
    } catch {
      setCheckoutError('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <div className="grid md:grid-cols-3 gap-6 items-start">
        {plans.map(plan => (
          <div key={plan.slug} className="relative">
            {/* Most Popular badge — sits on the top border */}
            {plan.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <span className="whitespace-nowrap bg-[#0F7B8C] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                  Most Popular
                </span>
              </div>
            )}

            <div
              className={`rounded-2xl border-2 transition-all h-full ${
                plan.highlight
                  ? 'border-[#0F7B8C] shadow-xl shadow-[#0F7B8C]/15'
                  : 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
              }`}
            >
              <div className="p-8">
                {/* Plan name + description */}
                <h3 className="text-2xl font-black text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-6">{plan.description}</p>

                {/* Price */}
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-5xl font-black text-gray-900">
                    {plan.price === '0' ? 'Free' : `$${plan.price} AUD`}
                  </span>
                  {plan.price !== '0' && (
                    <span className="text-sm text-gray-500 mb-2">{plan.period}</span>
                  )}
                </div>

                {/* CTA */}
                {plan.slug === 'starter' ? (
                  <Link
                    href="/trial/setup?plan=starter"
                    className={`block w-full text-center font-bold py-3 px-6 rounded-xl text-sm transition-colors mb-8 ${
                      plan.highlight
                        ? 'bg-[#0F7B8C] text-white hover:bg-[#0d6b7a]'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    Get started free
                  </Link>
                ) : (
                  <button
                    onClick={() => handleCheckout(plan.slug)}
                    disabled={loading === plan.slug}
                    className={`block w-full text-center font-bold py-3 px-6 rounded-xl text-sm transition-colors mb-8 disabled:opacity-70 disabled:cursor-not-allowed ${
                      plan.highlight
                        ? 'bg-[#0F7B8C] text-white hover:bg-[#0d6b7a]'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {loading === plan.slug ? 'Starting…' : 'Start free trial'}
                  </button>
                )}

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
                      <Check
                        size={17}
                        className="flex-shrink-0 mt-0.5 text-[#0F7B8C]"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {checkoutError && (
        <p className="text-center text-sm text-red-600 mt-6">{checkoutError}</p>
      )}
    </>
  )
}
