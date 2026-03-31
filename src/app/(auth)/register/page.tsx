'use client';

import { useState } from 'react';
import Link from 'next/link';

type UserType = 'coach' | 'ai_coach' | null;

const coachPlans = [
  {
    id: 'coach_starter',
    name: 'Starter',
    price: '49.99',
    per: 'month',
    trial: '14-day free trial',
    description: 'Perfect for coaches getting started',
    features: [
      'Up to 10 active clients',
      'Training program builder',
      'Nutrition & macro tracking',
      'Habit tracking',
      'Client messaging',
      'Check-in forms',
    ],
    highlighted: false,
  },
  {
    id: 'coach_pro',
    name: 'Pro',
    price: '99.99',
    per: 'month',
    trial: '14-day free trial',
    description: 'For coaches scaling their business',
    features: [
      'Up to 50 active clients',
      'All Starter features',
      'AI Coach Assistant',
      'Custom branding & logo',
      'Stripe payments',
      'Marketplace access',
      'Priority support',
    ],
    highlighted: true,
  },
  {
    id: 'coach_scale',
    name: 'Scale',
    price: '199.99',
    per: 'month',
    trial: '14-day free trial',
    description: 'For clinics & large teams',
    features: [
      'Unlimited clients',
      'All Pro features',
      'Up to 5 coach accounts',
      'Team dashboard',
      'Revenue analytics',
      'White label app',
      'Phone support',
    ],
    highlighted: false,
  },
];

const aiPlans = [
  {
    id: 'ai_starter',
    name: 'Starter',
    price: '9.99',
    per: 'week',
    trial: '7-day free trial',
    description: 'Start your AI coaching journey',
    features: [
      'AI coach available 24/7',
      'Personalised workout plans',
      'Nutrition & macro tracking',
      'Progress insights',
      'Habit coaching',
    ],
    highlighted: false,
  },
  {
    id: 'ai_pro',
    name: 'Pro',
    price: '19.99',
    per: 'week',
    trial: '7-day free trial',
    description: 'Accelerate your results',
    features: [
      'Everything in Starter',
      'AI meal plan generator',
      'Form check analysis',
      'Weekly AI check-ins',
      'Unlimited AI messages',
      'Priority AI responses',
    ],
    highlighted: true,
  },
  {
    id: 'ai_elite',
    name: 'Elite',
    price: '29.99',
    per: 'week',
    trial: '7-day free trial',
    description: 'Maximum AI coaching support',
    features: [
      'Everything in Pro',
      'Dedicated AI model',
      'Advanced body composition tracking',
      'Supplement recommendations',
      'Live coaching integrations',
      'Weekly AI strategy review',
    ],
    highlighted: false,
  },
];

const professions = [
  'Personal Trainer',
  'Dietitian',
  'Nutritionist',
  'Exercise Physiologist',
  'Strength Coach',
  'Physiotherapist',
  'Online Fitness Coach',
  'Other',
];

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [userType, setUserType] = useState<UserType>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    profession: '',
  });

  const plans = userType === 'coach' ? coachPlans : aiPlans;

  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (userType === 'coach' && !formData.profession) {
      errors.profession = 'Please select your profession';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep2()) {
      setStep(3);
      setFormErrors({});
    }
  };

  const handlePlanSelect = async (planId: string) => {
    setSelectedPlan(planId);
    setIsLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          plan: planId,
          profession: formData.profession || undefined,
          password: formData.password,
        }),
      });
      if (!res.ok) throw new Error('Failed to create checkout session');
      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      setFormErrors({ checkout: 'Failed to redirect to payment. Please try again.' });
      setIsLoading(false);
    }
  };

  const checkIcon = (
    <svg className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
    </svg>
  );

  const errorIcon = (
    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
    </svg>
  );

  return (
    <div className="min-h-screen bg-surface-light flex flex-col">

      {/* Header */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="Propel" className="w-8 h-8" />
              <span className="text-xl font-bold text-cb-text font-display">Propel</span>
            </Link>
            <p className="text-sm text-cb-muted hidden sm:block">
              Already have an account?{' '}
              <Link href="/login" className="text-brand font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-lg mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            {/* Step 1 */}
            <div className={`step-dot ${step >= 1 ? (step > 1 ? 'done' : 'active') : 'inactive'}`}>
              {step > 1 ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              ) : '1'}
            </div>
            <div className="flex-1">
              <p className={`text-xs font-semibold ${step === 1 ? 'text-brand' : 'text-cb-muted'}`}>Who are you?</p>
            </div>
            <div className={`step-connector ${step > 1 ? 'done' : ''}`} />
            {/* Step 2 */}
            <div className={`step-dot ${step >= 2 ? (step > 2 ? 'done' : 'active') : 'inactive'}`}>
              {step > 2 ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              ) : '2'}
            </div>
            <div className="flex-1">
              <p className={`text-xs font-semibold ${step === 2 ? 'text-brand' : 'text-cb-muted'}`}>Your details</p>
            </div>
            <div className={`step-connector ${step > 2 ? 'done' : ''}`} />
            {/* Step 3 */}
            <div className={`step-dot ${step === 3 ? 'active' : 'inactive'}`}>3</div>
            <div className="flex-1">
              <p className={`text-xs font-semibold ${step === 3 ? 'text-brand' : 'text-cb-muted'}`}>Choose plan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-start justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-2xl">

          {/* ── Step 1: Type selection ── */}
          {step === 1 && (
            <div className="bg-surface rounded-2xl border border-border shadow-md p-8 sm:p-10">
              <div className="mb-8">
                <h1 className="font-display text-3xl font-bold text-cb-text mb-2">
                  Welcome to Propel
                </h1>
                <p className="text-cb-secondary text-sm">
                  Tell us how you&apos;d like to use Propel so we can show you the right plans.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Coach option */}
                <button
                  onClick={() => { setUserType('coach'); setStep(2); }}
                  className="group relative flex flex-col items-start p-6 rounded-2xl border-2 border-border hover:border-brand hover:shadow-md hover:shadow-brand/10 transition-all text-left cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-brand/8 flex items-center justify-center mb-4 group-hover:bg-brand/15 transition-colors">
                    <svg className="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <h3 className="font-display text-lg font-bold text-cb-text mb-1">I&apos;m a coach</h3>
                  <p className="text-sm text-cb-secondary leading-relaxed">
                    I run a coaching business and want to manage clients, programs, and nutrition.
                  </p>
                  <div className="mt-4 text-xs font-semibold text-brand">From A$49.99/month →</div>
                </button>

                {/* AI Coach option */}
                <button
                  onClick={() => { setUserType('ai_coach'); setStep(2); }}
                  className="group relative flex flex-col items-start p-6 rounded-2xl border-2 border-border hover:border-brand hover:shadow-md hover:shadow-brand/10 transition-all text-left cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-brand/8 flex items-center justify-center mb-4 group-hover:bg-brand/15 transition-colors">
                    <svg className="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <h3 className="font-display text-lg font-bold text-cb-text mb-1">I want an AI coach</h3>
                  <p className="text-sm text-cb-secondary leading-relaxed">
                    I want personalised AI-powered coaching for my own fitness and nutrition goals.
                  </p>
                  <div className="mt-4 text-xs font-semibold text-brand">From A$9.99/week →</div>
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-cb-secondary">
                  Already have an account?{' '}
                  <Link href="/login" className="text-brand font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* ── Step 2: Details ── */}
          {step === 2 && (
            <div className="bg-surface rounded-2xl border border-border shadow-md p-8 sm:p-10">
              <div className="mb-8">
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 text-sm text-brand font-semibold hover:underline mb-4 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                  </svg>
                  Back
                </button>
                <h1 className="font-display text-3xl font-bold text-cb-text mb-2">
                  Create your account
                </h1>
                <p className="text-cb-secondary text-sm">
                  {userType === 'coach'
                    ? 'Set up your coaching account on Propel.'
                    : 'Set up your AI coaching account on Propel.'}
                </p>
              </div>

              <form onSubmit={handleStep2Submit} className="space-y-5">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-cb-text mb-1.5">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`field ${formErrors.name ? 'error' : ''}`}
                    placeholder="Jane Smith"
                    autoComplete="name"
                  />
                  {formErrors.name && (
                    <p className="mt-1.5 text-xs text-cb-danger flex items-center gap-1">{errorIcon}{formErrors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-cb-text mb-1.5">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`field ${formErrors.email ? 'error' : ''}`}
                    placeholder="jane@example.com"
                    autoComplete="email"
                  />
                  {formErrors.email && (
                    <p className="mt-1.5 text-xs text-cb-danger flex items-center gap-1">{errorIcon}{formErrors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-cb-text mb-1.5">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`field ${formErrors.password ? 'error' : ''}`}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  {formErrors.password ? (
                    <p className="mt-1.5 text-xs text-cb-danger flex items-center gap-1">{errorIcon}{formErrors.password}</p>
                  ) : (
                    <p className="mt-1.5 text-xs text-cb-muted">At least 8 characters</p>
                  )}
                </div>

                {/* Profession — coaches only */}
                {userType === 'coach' && (
                  <div>
                    <label htmlFor="profession" className="block text-sm font-medium text-cb-text mb-1.5">Profession</label>
                    <select
                      id="profession"
                      value={formData.profession}
                      onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                      className={`field ${formErrors.profession ? 'error' : ''}`}
                    >
                      <option value="">Select your profession</option>
                      {professions.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    {formErrors.profession && (
                      <p className="mt-1.5 text-xs text-cb-danger flex items-center gap-1">{errorIcon}{formErrors.profession}</p>
                    )}
                  </div>
                )}

                <button type="submit" className="w-full btn-primary mt-2">
                  Continue to plan selection
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </form>
            </div>
          )}

          {/* ── Step 3: Plan selection ── */}
          {step === 3 && (
            <div>
              <div className="mb-8">
                <button
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 text-sm text-brand font-semibold hover:underline mb-4 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                  </svg>
                  Back
                </button>
                <h1 className="font-display text-3xl font-bold text-cb-text mb-1.5">
                  Choose your plan
                </h1>
                <p className="text-sm text-cb-secondary">
                  {userType === 'coach'
                    ? '14-day free trial on every plan. No credit card required.'
                    : '7-day free trial on every plan. No credit card required.'}
                </p>
              </div>

              {formErrors.checkout && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                  <p className="text-sm text-red-700">{formErrors.checkout}</p>
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-5">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl transition-all cursor-pointer flex flex-col bg-surface border ${
                      plan.highlighted
                        ? 'border-brand ring-2 ring-brand/20 shadow-lg shadow-brand/10'
                        : selectedPlan === plan.id
                        ? 'border-brand ring-2 ring-brand/20 shadow-md'
                        : 'border-border shadow-sm hover:border-brand/40 hover:shadow-md'
                    }`}
                    onClick={() => !isLoading && handlePlanSelect(plan.id)}
                  >
                    {plan.highlighted && (
                      <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                        <span className="bg-brand text-white px-4 py-1 rounded-full text-xs font-bold shadow-sm">
                          Most popular
                        </span>
                      </div>
                    )}

                    <div className="p-7 flex flex-col flex-1">
                      <div className="mb-5">
                        <h3 className="font-display text-xl font-bold text-cb-text mb-1">{plan.name}</h3>
                        <p className="text-xs text-cb-muted">{plan.description}</p>
                      </div>

                      <div className="mb-6">
                        <div className="flex items-baseline gap-1">
                          <span className="font-display text-4xl font-extrabold text-cb-text">A${plan.price}</span>
                          <span className="text-sm text-cb-muted">/{plan.per}</span>
                        </div>
                        <p className="text-xs text-brand font-medium mt-1">{plan.trial}</p>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); if (!isLoading) handlePlanSelect(plan.id); }}
                        disabled={isLoading && selectedPlan !== plan.id}
                        className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all mb-6 cursor-pointer ${
                          plan.highlighted || selectedPlan === plan.id
                            ? 'bg-brand text-white hover:bg-brand-light shadow-sm shadow-brand/20'
                            : 'bg-surface-light text-cb-text hover:bg-border'
                        } ${isLoading && selectedPlan === plan.id ? 'opacity-70' : ''}`}
                      >
                        {isLoading && selectedPlan === plan.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                            Processing…
                          </span>
                        ) : 'Start free trial'}
                      </button>

                      <ul className="space-y-3 flex-1">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            {checkIcon}
                            <span className="text-sm text-cb-secondary">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex items-center justify-center gap-2 text-sm text-cb-muted">
                <svg className="w-4 h-4 text-cb-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                Payment info is encrypted and secure via Stripe
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
