'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Search, MessageCircle } from 'lucide-react';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: 'signup',
    category: 'Getting Started',
    question: 'How do I sign up?',
    answer: 'Visit propelcoaches.com and click "Get Started". You\'ll create an account with your email and password. We offer a 14-day free trial so you can explore all features before committing to a plan.'
  },
  {
    id: 'invite-clients',
    category: 'Getting Started',
    question: 'How do I invite clients?',
    answer: 'Once logged in, go to your Clients section and click "Add New Client". You can invite clients via email, and they\'ll receive a link to download the Propel app and join your coaching program.'
  },
  {
    id: 'devices',
    category: 'Getting Started',
    question: 'What devices does Propel support?',
    answer: 'Propel is available on iOS and Android devices. For the web dashboard, we support modern browsers including Chrome, Firefox, Safari, and Edge on desktop and tablet.'
  },
  {
    id: 'free-trial',
    category: 'Account & Billing',
    question: 'How does the 14-day free trial work?',
    answer: 'Your free trial includes access to all Pro features for 14 days. No credit card is required to start. After the trial ends, you\'ll need to upgrade to a paid plan to continue using Propel.'
  },
  {
    id: 'upgrade-downgrade',
    category: 'Account & Billing',
    question: 'How do I upgrade or downgrade my plan?',
    answer: 'You can manage your subscription in the Settings > Billing section. Changes take effect immediately, and we\'ll prorate any charges or credits based on your current billing cycle.'
  },
  {
    id: 'cancel',
    category: 'Account & Billing',
    question: 'How do I cancel my subscription?',
    answer: 'Go to Settings > Billing and select "Cancel Subscription". Your account will remain active until the end of your current billing period. You can reactivate anytime.'
  },
  {
    id: 'ai-coach',
    category: 'Features',
    question: 'How does the AI coach work?',
    answer: 'The AI coach provides personalized workout recommendations and form feedback based on client data and goals. It learns from client progress and adapts in real-time to optimize results.'
  },
  {
    id: 'white-label',
    category: 'Features',
    question: 'Can I white-label the app?',
    answer: 'Yes! Pro and Enterprise plans include white-labeling options. You can customize the branding, colors, and logo to match your coaching business. Contact our sales team for details.'
  },
  {
    id: 'group-chats',
    category: 'Features',
    question: 'How do group chats work?',
    answer: 'Create group chats to communicate with multiple clients at once. Share updates, motivational messages, or important announcements. Clients receive notifications and can respond in real-time.'
  },
  {
    id: 'client-limit',
    category: 'Clients',
    question: 'How many clients can I have?',
    answer: 'Client limits vary by plan. Starter: 10 clients, Pro: 50 clients, Enterprise: Unlimited. You can upgrade anytime if you need more capacity.'
  },
  {
    id: 'client-download',
    category: 'Clients',
    question: 'How do clients download the app?',
    answer: 'Clients can download Propel from the Apple App Store or Google Play Store. When they sign up with the invite link you send, they\'ll automatically connect to your coaching program.'
  },
  {
    id: 'import-clients',
    category: 'Clients',
    question: 'Can I import existing clients?',
    answer: 'Yes, you can bulk import clients via CSV in the Clients section. We support imports from common fitness platforms and custom spreadsheets.'
  },
  {
    id: 'data-security',
    category: 'Technical',
    question: 'Is my data secure?',
    answer: 'Propel uses enterprise-grade encryption (AES-256) for all data at rest and in transit. We\'re compliant with GDPR, CCPA, and HIPAA standards. All data is stored securely on AWS servers.'
  },
  {
    id: 'export-data',
    category: 'Technical',
    question: 'Can I export my data?',
    answer: 'You can export client data and workout history as CSV files at any time from the Settings > Data Export section. Your data remains your own.'
  },
  {
    id: 'integrations',
    category: 'Technical',
    question: 'What integrations are supported?',
    answer: 'Propel integrates with popular platforms including Stripe for payments, Zapier for automation, and various fitness trackers. We\'re constantly adding new integrations.'
  }
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const categories = Array.from(new Set(faqItems.map(item => item.category)));

  const filteredItems = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleItem = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const groupedItems = categories.map(category => ({
    category,
    items: filteredItems.filter(item => item.category === category)
  })).filter(group => group.items.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <Link href="https://propelcoaches.com" className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: '#0F7B8C' }}
              >
                P
              </div>
              <span className="font-semibold text-gray-900">Propel</span>
            </Link>
            <nav className="hidden sm:flex gap-8">
              <Link href="/help" className="text-gray-900 font-medium">
                Help Center
              </Link>
              <Link href="/help/contact" className="text-gray-600 hover:text-gray-900">
                Contact Us
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white py-12 sm:py-16 border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            How can we help?
          </h1>
          <p className="text-gray-600 mb-8">
            Search our knowledge base or browse categories below
          </p>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ '--tw-ring-color': '#0F7B8C' } as React.CSSProperties}
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {groupedItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No results found for "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear search
              </button>
            </div>
          ) : (
            groupedItems.map(group => (
              <div key={group.category} className="mb-12">
                <h2
                  className="text-xl font-bold mb-6 pb-3 border-b-2"
                  style={{ borderColor: '#0F7B8C', color: '#0F7B8C' }}
                >
                  {group.category}
                </h2>

                <div className="space-y-3">
                  {group.items.map(item => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
                    >
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900">
                          {item.question}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-600 transition-transform ${
                            expandedItems.includes(item.id) ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {expandedItems.includes(item.id) && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                          <p className="text-gray-700 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-white border-t border-gray-200 py-12 sm:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#0F7B8C' }} />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Still need help?
          </h2>
          <p className="text-gray-600 mb-6">
            Can't find what you're looking for? Our support team is ready to assist.
          </p>
          <Link
            href="/help/contact"
            className="inline-block px-6 py-3 rounded-lg font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#0F7B8C' }}
          >
            Contact Support
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2026 Propel. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
