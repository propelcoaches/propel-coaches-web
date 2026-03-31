'use client';

import { useState } from 'react';
import Link from 'next/link';

const coachPlans = [
  {
    name: 'Starter',
    desc: 'Perfect for coaches getting started',
    price: '49.99',
    clientLimit: '10 active clients',
    features: ['Up to 10 active clients', 'Training program builder', 'Nutrition & macro tracking', 'Habit tracking', 'Client messaging', 'Check-in forms'],
    popular: false,
  },
  {
    name: 'Pro',
    desc: 'For coaches scaling their business',
    price: '99.99',
    clientLimit: '50 active clients',
    features: ['Up to 50 active clients', 'Everything in Starter', 'AI Coach Assistant', 'Custom branding', 'Stripe payments', 'Marketplace access', 'Priority support'],
    popular: true,
  },
  {
    name: 'Scale',
    desc: 'For clinics & large teams',
    price: '199.99',
    clientLimit: 'Unlimited clients',
    features: ['Unlimited active clients', 'Up to 5 coach accounts', 'Everything in Pro', 'Team dashboard', 'Revenue analytics', 'White label app', 'Phone support'],
    popular: false,
  },
];

const aiPlans = [
  {
    name: 'Starter',
    desc: 'Start your AI coaching journey',
    price: '9.99',
    clientLimit: '7-day free trial',
    features: ['AI coach available 24/7', 'Personalised workout plans', 'Nutrition & macro tracking', 'Progress insights', 'Habit coaching'],
    popular: false,
  },
  {
    name: 'Pro',
    desc: 'Accelerate your results',
    price: '19.99',
    clientLimit: '7-day free trial',
    features: ['Everything in Starter', 'AI meal plan generator', 'Form check analysis', 'Weekly AI check-ins', 'Unlimited AI messages', 'Priority AI responses'],
    popular: true,
  },
  {
    name: 'Elite',
    desc: 'Maximum AI coaching support',
    price: '29.99',
    clientLimit: '7-day free trial',
    features: ['Everything in Pro', 'Dedicated AI model', 'Advanced body composition tracking', 'Supplement recommendations', 'Weekly AI strategy review'],
    popular: false,
  },
];

export function PricingSection() {
  const [tab, setTab] = useState<'coach' | 'ai'>('coach');
  const plans = tab === 'coach' ? coachPlans : aiPlans;
  const per = tab === 'coach' ? 'month' : 'week';
  const trial = tab === 'coach' ? '14-day free trial' : '7-day free trial';

  return (
    <section id="pricing" className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Simple, transparent pricing</h2>
          <p className="mt-4 text-gray-500">{trial}. No credit card required during trial. Cancel anytime.</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-gray-100 rounded-2xl p-1 gap-1">
            <button
              onClick={() => setTab('coach')}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                tab === 'coach'
                  ? 'bg-white text-brand shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              For Coaches
            </button>
            <button
              onClick={() => setTab('ai')}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                tab === 'ai'
                  ? 'bg-white text-brand shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              AI Coach
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 border relative flex flex-col ${plan.popular ? 'border-brand ring-1 ring-brand/20' : 'border-gray-200'}`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand text-white text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap">Most popular</div>
              )}
              <div>
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-1">{plan.desc}</p>
                <p className="text-xs font-semibold text-brand mb-4">{plan.clientLimit}</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">A${plan.price}</span>
                  <span className="text-gray-400 text-sm"> AUD/{per}</span>
                </div>
                <Link
                  href="/register"
                  className={`block text-center font-bold py-3 px-6 rounded-xl text-sm transition-colors mb-6 ${plan.popular ? 'bg-brand text-white hover:bg-brand-light' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                >
                  Start free trial
                </Link>
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-brand flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">All prices in AUD. Annual billing available at 20% off.</p>
      </div>
    </section>
  );
}
