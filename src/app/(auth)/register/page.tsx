'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    profession: '',
  });

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 0,
      description: 'Perfect for getting started',
      features: [
        'Up to 5 active clients',
        'Training program builder',
        'Weekly check-ins',
        'Nutrition & macro tracking',
        'Habit tracking',
        'Client messaging',
      ],
      highlighted: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29,
      description: 'Most popular for growing coaches',
      features: [
        'Unlimited clients',
        'All Starter features',
        'AI Coach Assistant (24/7)',
        'Custom brand colours & logo',
        'Priority support',
        'Early access to new features',
      ],
      highlighted: true,
    },
    {
      id: 'team',
      name: 'Team',
      price: 79,
      description: 'For multi-practitioner clinics',
      features: [
        'Unlimited clients',
        'Up to 5 coaches',
        'All Pro features',
        'Team dashboard',
        'Dedicated onboarding',
        'Phone support',
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

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

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

    if (!formData.profession) {
      errors.profession = 'Please select your profession';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
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
          profession: formData.profession,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      setFormErrors({ checkout: 'Failed to redirect to payment. Please try again.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header with logo */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0F7B8C] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-2xl font-bold text-slate-900">Propel</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          {step === 1 ? (
            // Step 1: Account Details
            <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Create your Propel account
                </h1>
                <p className="text-slate-600">
                  Join thousands of coaches transforming their practice
                </p>
              </div>

              <form onSubmit={handleStep1Submit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F7B8C] focus:border-transparent transition ${
                      formErrors.name
                        ? 'border-red-500 bg-red-50'
                        : 'border-slate-300 bg-white'
                    }`}
                    placeholder="John Smith"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F7B8C] focus:border-transparent transition ${
                      formErrors.email
                        ? 'border-red-500 bg-red-50'
                        : 'border-slate-300 bg-white'
                    }`}
                    placeholder="john@example.com"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F7B8C] focus:border-transparent transition ${
                      formErrors.password
                        ? 'border-red-500 bg-red-50'
                        : 'border-slate-300 bg-white'
                    }`}
                    placeholder="••••••••"
                  />
                  {formErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    At least 8 characters
                  </p>
                </div>

                {/* Profession Dropdown */}
                <div>
                  <label
                    htmlFor="profession"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Profession
                  </label>
                  <select
                    id="profession"
                    value={formData.profession}
                    onChange={(e) =>
                      setFormData({ ...formData, profession: e.target.value })
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F7B8C] focus:border-transparent transition ${
                      formErrors.profession
                        ? 'border-red-500 bg-red-50'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    <option value="">Select your profession</option>
                    {professions.map((profession) => (
                      <option key={profession} value={profession}>
                        {profession}
                      </option>
                    ))}
                  </select>
                  {formErrors.profession && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.profession}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-[#0F7B8C] text-white font-semibold py-3 rounded-lg hover:bg-[#0a5a67] transition duration-200 mt-8"
                >
                  Continue to Plans
                </button>
              </form>

              {/* Login Link */}
              <div className="mt-8 text-center">
                <p className="text-slate-600">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="text-[#0F7B8C] font-semibold hover:underline"
                  >
                    Coach login
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            // Step 2: Plan Selection
            <div>
              <div className="mb-8">
                <button
                  onClick={() => setStep(1)}
                  className="text-[#0F7B8C] font-semibold hover:underline mb-4 flex items-center gap-2"
                >
                  ← Back
                </button>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Choose your plan
                </h1>
                <p className="text-slate-600">
                  Select the perfect plan for your coaching practice
                </p>
              </div>

              {/* Error message */}
              {formErrors.checkout && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700">{formErrors.checkout}</p>
                </div>
              )}

              {/* Plans Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`rounded-2xl transition duration-200 cursor-pointer relative ${
                      plan.highlighted
                        ? 'ring-2 ring-[#0F7B8C] shadow-xl scale-105'
                        : 'shadow-lg'
                    } ${
                      selectedPlan === plan.id
                        ? 'bg-slate-50 border-2 border-[#0F7B8C]'
                        : 'bg-white border border-slate-200 hover:border-[#0F7B8C]'
                    }`}
                    onClick={() => !isLoading && handlePlanSelect(plan.id)}
                  >
                    {plan.highlighted && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-[#0F7B8C] text-white px-4 py-1 rounded-full text-sm font-semibold">
                          Most popular
                        </span>
                      </div>
                    )}

                    <div className="p-8">
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-slate-600 mb-6">
                        {plan.description}
                      </p>

                      <div className="mb-6">
                        <span className="text-4xl font-bold text-slate-900">
                          {plan.price === 0 ? 'Free' : `$${plan.price} AUD`}
                        </span>
                        {plan.price > 0 && <span className="text-slate-600">/month</span>}
                      </div>

                      <button
                        onClick={() => !isLoading && handlePlanSelect(plan.id)}
                        disabled={isLoading && selectedPlan !== plan.id}
                        className={`w-full py-3 px-4 rounded-lg font-semibold transition duration-200 mb-6 ${
                          selectedPlan === plan.id || plan.highlighted
                            ? 'bg-[#0F7B8C] text-white hover:bg-[#0a5a67]'
                            : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                        } ${isLoading && selectedPlan === plan.id ? 'opacity-70' : ''}`}
                      >
                        {isLoading && selectedPlan === plan.id
                          ? 'Processing...'
                          : 'Select Plan'}
                      </button>

                      <ul className="space-y-4">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <svg
                              className="w-5 h-5 text-[#0F7B8C] flex-shrink-0 mt-0.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-sm text-slate-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              {/* Security note */}
              <div className="mt-12 text-center">
                <p className="text-slate-600 text-sm">
                  🔒 Your payment information is secure and encrypted
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
