'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

function useInView(options = {}) {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1, ...options });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, isInView];
}

function AnimatedSection({ children, className = '' }) {
  const [ref, isInView] = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [activeFaq, setActiveFaq] = useState(null);

  const faqs = [
    {
      question: 'What is Propel?',
      answer: 'Propel is an all-in-one coaching platform built for fitness professionals. It gives you a web dashboard to manage clients, mobile apps for on-the-go coaching, branded client apps, and an AI assistant that responds to client messages 24/7.'
    },
    {
      question: 'Who is Propel for?',
      answer: 'Propel is built for Personal Trainers, Nutritionists, Dietitians, Exercise Physiologists, Strength Coaches, Online Coaches, and Physiotherapists—basically any coach who works with clients and wants to scale their practice.'
    },
    {
      question: 'How does the AI coach work?',
      answer: 'The AI coach learns your coaching style and responds to client messages 24/7 in your voice. It handles common questions, provides motivation, and flags anything that needs your attention.'
    },
    {
      question: 'Can I customise what my clients see?',
      answer: 'Yes. You can toggle features on/off per client. Show workouts to some, nutrition to others, or create fully customised experiences for each client.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes. Start your free 14-day trial right now. No credit card required. You\'ll get access to everything across all three plans.'
    },
    {
      question: 'How do payments work?',
      answer: 'Propel handles payments securely. You set your rates, clients pay through the app, and payouts happen automatically. We keep transaction fees low.'
    }
  ];

  const features = [
    { icon: '💪', title: 'Training Programs', desc: 'Drag-and-drop workouts. Customise reps, sets, rest times.' },
    { icon: '🍽️', title: 'Nutrition & Meal Plans', desc: 'Build meal plans. Track macros. Log recipes.' },
    { icon: '💬', title: 'Client Messaging', desc: '1-on-1 chat with clients. Pin important messages.' },
    { icon: '📋', title: 'Check-ins & Forms', desc: 'Custom forms. Weekly check-ins. Progress tracking.' },
    { icon: '🎯', title: 'Habit Tracking', desc: 'Track daily habits. Motivate with streaks.' },
    { icon: '𓓊', title: 'Progress & Metrics', desc: 'Charts. Stats. Dashboards. Real-time insights.' },
    { icon: '🤖', title: 'AI Coach Assistant', desc: 'Responds to clients 24/7 in your voice.' },
    { icon: '🎨', title: 'White Label & Branding', desc: 'Custom app branding. Your logo. Your colours.' },
    { icon: '🎥', title: 'Video Exercise Library', desc: '1000+ exercise videos. Demo proper form.' },
    { icon: '👥', title: 'Group Chats', desc: 'Build community. Group chat channels.' },
    { icon: '⌚', title: 'Wearable Integration', desc: 'Apple Watch, Fitbit, Oura. Sync automatically.' },
    { icon: '✅', title: 'Form Check with AI', desc: 'Clients film workouts. AI verifies form.' },
    { icon: '📦', title: 'Packages & Subscriptions', desc: '1-off sessions or ongoing subscriptions.' },
    { icon: '🛒', title: 'Marketplace', desc: 'Sell programs, templates, and content.' },
    { icon: '💳', title: 'Payments & Invoicing', desc: 'Automated payments. Custom invoices.' }
  ];

  const professions = ['Personal Trainers', 'Nutritionists', 'Dietitians', 'Exercise Physiologists', 'Strength Coaches', 'Online Coaches', 'Physiotherapists'];

  const testimonials = [
    {
      name: 'Sarah Mitchell',
      role: 'Personal Trainer, Sydney',
      text: 'Propel let me go from 20 to 120 clients in 6 months. The AI coach handles 80% of client questions at night.',
      rating: 5
    },
    {
      name: 'Marcus Chen',
      role: 'Strength Coach, Melbourne',
      text: 'My clients love the branded app. Feels like their own fitness platform. Retention jumped 45%.',
      rating: 5
    },
    {
      name: 'Emma Rodriguez',
      role: 'Dietitian, Brisbane',
      text: 'The meal planning tools save me hours. White-label feature lets my clients think it&apos;s all my brand.',
      rating: 5
    }
  ];

  return (
    <>
      <style>{`
        @keyframes gradient { 0%, 100% { background-size: 200% 200%; background-position: left center; } 50% { background-size: 200% 200%; background-position: right center; } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(15,123,140,0.3); } 50% { box-shadow: 0 0 40px rgba(15,123,140,0.6); } }
        .animate-gradient { animation: gradient 3s ease infinite; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-teal-700">Propel</div>
          <nav className="hidden md:flex gap-8 items-center">
            <Link href="#platform" className="text-gray-700 hover:text-teal-700 transition">Platform</Link>
            <Link href="#features" className="text-gray-700 hover:text-teal-700 transition">Features</Link>
            <Link href="#pricing" className="text-gray-700 hover:text-teal-700 transition">Pricing</Link>
            <Link href="#faq" className="text-gray-700 hover:text-teal-700 transition">FAQ</Link>
          </nav>
          <div className="flex gap-4 items-center">
            <Link href="https://apps.apple.com/app/propel-coaching/id6744426938" target="_blank" className="text-sm text-teal-600 hover:text-teal-800 transition hidden lg:block">Looking for a coach?</Link>
            <Link href="/login" className="text-gray-700 hover:text-teal-700 transition">Log in</Link>
            <Link href="/register" className="bg-teal-700 text-white px-6 py-2 rounded-lg hover:bg-teal-800 transition">
              Start free trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-gray-900 via-teal-900 to-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent animate-gradient">
              Scale Your Coaching Practice
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Propel gives coaches everything they need: a web dashboard, mobile apps, a branded client app, and an AI assistant that works 24/7 in your voice.
          </p>
          <div className="flex gap-4 justify-center mb-16 flex-wrap">
            <Link href="/register" className="bg-teal-600 text-white px-8 py-3 rounded-lg hover:bg-teal-700 transition font-semibold">
              Get started free
            </Link>
            <Link href="#platform" className="border-2 border-teal-400 text-teal-400 px-8 py-3 rounded-lg hover:bg-teal-400/10 transition font-semibold">
              Watch demo
            </Link>
          </div>
          <div className="flex justify-around text-center py-8 border-t border-teal-700/30">
            <div className="animate-float" style={{ animationDelay: '0s' }}>
              <div className="text-2xl font-bold text-teal-400">10,000+</div>
              <div className="text-sm text-gray-400">Workouts logged</div>
            </div>
            <div className="animate-float" style={{ animationDelay: '0.5s' }}>
              <div className="text-2xl font-bold text-teal-400">2,000+</div>
              <div className="text-sm text-gray-400">Active coaches</div>
            </div>
            <div className="animate-float" style={{ animationDelay: '1s' }}>
              <div className="text-2xl font-bold text-teal-400">98%</div>
              <div className="text-sm text-gray-400">Client retention</div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">What You Get</h2>
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {/* Coach Dashboard */}
              <AnimatedSection className="bg-gray-50 p-8 rounded-2xl border border-gray-200 hover:shadow-lg hover:border-teal-200 transition">
                <div className="text-5xl mb-4">💻</div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Coach Web Dashboard</h3>
                <p className="text-gray-600 mb-6">Run your entire business from a browser. Manage clients, build programs, create nutrition plans, handle payments—all in one place.</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>✓ Client management and profiles</li>
                  <li>✓ Program builder with drag-and-drop</li>
                  <li>✓ Meal planning tools</li>
                  <li>✓ Payment processing</li>
                </ul>
              </AnimatedSection>

              {/* Coach Mobile App */}
              <AnimatedSection className="bg-gray-50 p-8 rounded-2xl border border-gray-200 hover:shadow-lg hover:border-teal-200 transition">
                <div className="text-5xl mb-4">📱</div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Coach Mobile App</h3>
                <p className="text-gray-600 mb-6">Coach on the go. Review client check-ins, message clients, approve workout videos, track progress—all from your pocket.</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>✓ Push notifications for client activity</li>
                  <li>✓ Quick messaging with clients</li>
                  <li>✓ Form check with AI video analysis</li>
                  <li>✓ Real-time progress updates</li>
                </ul>
              </AnimatedSection>

              {/* Client App */}
              <AnimatedSection className="bg-gray-50 p-8 rounded-2xl border border-gray-200 hover:shadow-lg hover:border-teal-200 transition">
                <div className="text-5xl mb-4">⭐</div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Client App</h3>
                <p className="text-gray-600 mb-6">Your clients download a beautiful, branded app. They follow workouts, log nutrition, track progress, and chat with you or the AI coach.</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>✓ Fully branded with your logo</li>
                  <li>✓ Workout tracking and video demos</li>
                  <li>✓ Nutrition logging and meal plans</li>
                  <li>✓ Progress charts and analytics</li>
                </ul>
              </AnimatedSection>
            </div>

            {/* AI Coach Callout */}
            <AnimatedSection className="bg-gradient-to-r from-teal-600 to-teal-700 p-8 rounded-2xl text-white text-center animate-pulse-glow">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="text-2xl font-bold mb-2">Plus: AI Coaching Assistant</h3>
              <p className="text-teal-100">An AI that learns your coaching style and responds to client messages 24/7 in your voice. Handles repetitive questions, provides motivation, and flags anything that needs your attention.</p>
            </AnimatedSection>
          </AnimatedSection>
        </div>
      </section>

      {/* Built For Every Profession */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">Built For Every Profession</h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">Toggle features on/off per client. Show workouts to some, nutrition to others. Create fully customised experiences.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {professions.map((profession, i) => (
                <AnimatedSection key={i} style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="bg-white border-2 border-teal-700 text-teal-700 px-6 py-2 rounded-full font-semibold hover:bg-teal-50 transition">
                    {profession}
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Platform Deep Dive - Coach Dashboard */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Manage Everything From One Place</h2>
              <p className="text-gray-700 mb-4">Your web dashboard is built for coaches who want to run a tight ship. See all your clients, manage their programs, handle payments, and measure their progress—without leaving the page.</p>
              <ul className="space-y-3 text-gray-700">
                <li>✓ Client directory with photo and notes</li>
                <li>✓ Program assignments and progress tracking</li>
                <li>✓ Payment dashboard and invoicing</li>
                <li>✓ Analytics and retention metrics</li>
                <li>✓ Team management for multi-coach practices</li>
              </ul>
            </div>
            <div className="bg-gray-100 rounded-xl overflow-hidden border-8 border-gray-800 shadow-2xl">
              <div className="bg-gray-800 h-8 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div className="text-xs text-gray-400 flex-1 text-center">propel.app/dashboard</div>
              </div>
              <div className="bg-white p-4 text-xs">
                <div className="flex gap-4">
                  <div className="w-32 bg-gray-200 rounded p-3 space-y-2">
                    <div className="h-3 bg-gray-300 rounded w-20"></div>
                    <div className="h-2 bg-gray-300 rounded w-full"></div>
                    <div className="h-2 bg-gray-300 rounded w-16"></div>
                    <div className="h-2 bg-gray-300 rounded w-20"></div>
                    <div className="h-2 bg-gray-300 rounded w-full"></div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-teal-100 p-2 rounded">
                        <div className="h-2 bg-teal-700 rounded w-12"></div>
                        <div className="h-1 bg-gray-300 rounded w-8 mt-1"></div>
                      </div>
                      <div className="bg-blue-100 p-2 rounded">
                        <div className="h-2 bg-blue-700 rounded w-12"></div>
                        <div className="h-1 bg-gray-300 rounded w-8 mt-1"></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded space-y-1">
                      <div className="h-2 bg-gray-300 rounded w-full"></div>
                      <div className="h-2 bg-gray-300 rounded w-2/3"></div>
                      <div className="h-2 bg-gray-300 rounded w-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Platform Deep Dive - Coach App */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="max-w-xs">
                <div className="bg-white rounded-3xl border-8 border-gray-900 shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-b from-teal-600 to-teal-700 p-6 text-white text-center">
                    <div className="text-4xl font-bold mb-2">Coach</div>
                    <div className="text-xs opacity-75">9:41</div>
                  </div>
                  <div className="p-4 space-y-3 bg-gray-50 h-96">
                    <div className="bg-teal-100 p-3 rounded-lg text-xs">
                      <div className="font-semibold text-teal-900">Sarah M.</div>
                      <div className="text-teal-800 mt-1">Did my form check on the squat video. Great depth!</div>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg text-xs ml-6">
                      <div className="font-semibold text-blue-900">Marcus C.</div>
                      <div className="text-blue-800 mt-1">Client logged 4/5 meals today. On track.</div>
                    </div>
                    <div className="bg-teal-100 p-3 rounded-lg text-xs">
                      <div className="font-semibold text-teal-900">New Check-in</div>
                      <div className="text-teal-800 mt-1">Emma submitted weekly check-in. View results.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Coach Anywhere, Anytime</h2>
              <p className="text-gray-700 mb-4">The coach mobile app keeps you connected to your clients. See notifications, review their work, send messages, and approve check-ins—all from your phone.</p>
              <ul className="space-y-3 text-gray-700">
                <li>✓ Real-time push notifications</li>
                <li>✓ Instant messaging with clients</li>
                <li>✓ Video form check with AI feedback</li>
                <li>✓ Weekly check-in reviews</li>
                <li>✓ Client progress snapshots</li>
              </ul>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Platform Deep Dive - Client App */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">Your Clients&apos; New Favourite App</h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              Fully branded with your logo and colours. Clients follow workouts, track nutrition, see progress, and chat with you or the AI coach.
            </p>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { label: 'Home', icon: '🏠' },
                { label: 'Workouts', icon: '💪' },
                { label: 'Nutrition', icon: '🍽️' },
                { label: 'Progress', icon: '📊' }
              ].map((screen, i) => (
                <AnimatedSection key={i} style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex flex-col items-center">
                    <div className="bg-white rounded-3xl border-8 border-gray-900 shadow-2xl overflow-hidden w-full max-w-xs">
                      <div className="bg-gradient-to-b from-teal-600 to-teal-700 p-6 text-white text-center h-96 flex flex-col justify-center items-center">
                        <div className="text-6xl mb-3">{screen.icon}</div>
                        <div className="text-xl font-bold">{screen.label}</div>
                      </div>
                    </div>
                    <div className="text-center mt-4 font-semibold text-gray-900">{screen.label}</div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* AI Coach Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-3xl font-bold mb-6">An AI That Works While You Sleep</h2>
              <p className="text-gray-300 mb-6">The Propel AI Coach learns your coaching style and responds to client messages 24/7 in your voice. It handles the repetitive questions, provides motivation, and flags anything that needs your personal attention.</p>
              <ul className="space-y-3 text-gray-300">
                <li>✓ Learns your coaching voice and tone</li>
                <li>✓ Responds to client messages instantly</li>
                <li>✓ Provides workout form feedback</li>
                <li>✓ Motivates with personalised messages</li>
                <li>✓ Flags high-priority issues for you</li>
              </ul>
            </div>
            <div className="bg-gray-800 rounded-2xl border-2 border-gray-700 p-6 h-96 overflow-y-auto space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-600 flex-shrink-0"></div>
                <div className="bg-teal-600/20 border border-teal-600 p-3 rounded-lg text-sm text-gray-200 max-w-xs">
                  Hi coach, I&apos;m feeling sore after yesterday. Should I do the workout today?
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <div className="bg-teal-600 p-3 rounded-lg text-sm text-white max-w-xs">
                  Great question. Soreness is normal, but we&apos;ll dial down the volume today. Let&apos;s do the workout at 75% intensity and focus on form.
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">AI</div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-600 flex-shrink-0"></div>
                <div className="bg-teal-600/20 border border-teal-600 p-3 rounded-lg text-sm text-gray-200 max-w-xs">
                  Perfect, thanks. Starting now!
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <div className="bg-teal-600 p-3 rounded-lg text-sm text-white max-w-xs">
                  Let&apos;s crush it. You&apos;ve got this. Ping me if you have any questions during the session.
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">AI</div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">Everything Your Practice Needs</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <AnimatedSection key={i} style={{ animationDelay: `${i * 50}ms` }} className="bg-gray-50 p-6 rounded-xl hover:shadow-lg hover:border-teal-200 transition border border-gray-200">
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <AnimatedSection className="text-center">
                <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">1</div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Sign Up</h3>
                <p className="text-gray-700">Create your account in 2 minutes. No credit card required. Start your free 14-day trial.</p>
              </AnimatedSection>
              <AnimatedSection className="text-center">
                <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">2</div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Invite Clients</h3>
                <p className="text-gray-700">Send invites to your clients. They download the branded app. You customise what they see.</p>
              </AnimatedSection>
              <AnimatedSection className="text-center">
                <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">3</div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Start Coaching</h3>
                <p className="text-gray-700">Build programs. Assign workouts. Track progress. Let AI handle the rest. Scale your practice.</p>
              </AnimatedSection>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">Coaches Love Propel</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, i) => (
                <AnimatedSection key={i} className="bg-gray-50 p-8 rounded-xl border border-gray-200 hover:shadow-lg transition">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <span key={j} className="text-yellow-400 text-lg">★</span>
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6">&quot;{testimonial.text}&quot;</p>
                  <div className="border-t border-gray-200 pt-4">
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">Simple, Transparent Pricing</h2>
            <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">Start free. Scale as you grow. No surprises.</p>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Starter */}
              <AnimatedSection className="bg-white border-2 border-gray-200 p-8 rounded-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Starter</h3>
                <p className="text-gray-600 text-sm mb-6">For new coaches</p>
                <div className="text-4xl font-bold text-gray-900 mb-1">$29</div>
                <p className="text-sm text-gray-600 mb-6">/month, up to 10 clients</p>
                <Link href="/register" className="block w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800 transition mb-8 font-semibold text-center">
                  Start free trial
                </Link>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li>✓ Web dashboard</li>
                  <li>✓ Coach mobile app</li>
                  <li>✓ Branded client app</li>
                  <li>✓ Up to 10 clients</li>
                  <li>✓ AI coach assistant</li>
                  <li>✗ Team members</li>
                </ul>
              </AnimatedSection>

              {/* Pro */}
              <AnimatedSection className="bg-white border-2 border-teal-600 p-8 rounded-xl shadow-lg relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-teal-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Pro</h3>
                <p className="text-gray-600 text-sm mb-6">For scaling coaches</p>
                <div className="text-4xl font-bold text-gray-900 mb-1">$59</div>
                <p className="text-sm text-gray-600 mb-6">/month, unlimited clients</p>
                <Link href="/register" className="block w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition mb-8 font-semibold text-center">
                  Start free trial
                </Link>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li>✓ Everything in Starter</li>
                  <li>✓ Unlimited clients</li>
                  <li>✓ Payment processing</li>
                  <li>✓ Advanced analytics</li>
                  <li>✓ Group messaging</li>
                  <li>✗ Team members</li>
                </ul>
              </AnimatedSection>

              {/* Clinic */}
              <AnimatedSection className="bg-white border-2 border-gray-200 p-8 rounded-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Clinic</h3>
                <p className="text-gray-600 text-sm mb-6">For teams and clinics</p>
                <div className="text-4xl font-bold text-gray-900 mb-1">$119</div>
                <p className="text-sm text-gray-600 mb-6">/month, up to 5 practitioners</p>
                <Link href="/register" className="block w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800 transition mb-8 font-semibold text-center">
                  Start free trial
                </Link>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li>✓ Everything in Pro</li>
                  <li>✓ Up to 5 team members</li>
                  <li>✓ Custom branding</li>
                  <li>✓ White label client app</li>
                  <li>✓ Priority support</li>
                  <li>✓ Dedicated account manager</li>
                </ul>
              </AnimatedSection>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection>
            <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <AnimatedSection key={i} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="w-full p-6 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <span className="font-semibold text-gray-900 text-left">{faq.question}</span>
                    <span className={`text-teal-600 text-2xl transition-transform ${activeFaq === i ? 'rotate-180' : ''}`}>
                      ↓
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${activeFaq === i ? 'max-h-96' : 'max-h-0'}`}
                  >
                    <div className="p-6 bg-white border-t border-gray-200 text-gray-700">
                      {faq.answer}
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-teal-600 to-teal-700">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-4xl font-bold text-white mb-6">Ready to Propel Your Practice?</h2>
            <p className="text-teal-100 text-lg mb-8 max-w-2xl mx-auto">
              Start your free 14-day trial right now. No credit card. No promises. Just a better way to coach.
            </p>
            <Link href="/register" className="bg-white text-teal-700 px-10 py-4 rounded-lg hover:bg-gray-100 transition font-bold text-lg inline-block">
              Get started free
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">Propel</div>
              <p className="text-sm">The all-in-one platform for fitness coaches.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition">Platform</Link></li>
                <li><Link href="#" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition">Features</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white transition">Terms</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Access</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-white transition">Coach Login</Link></li>
                <li><Link href="https://apps.apple.com/app/propel-coaching/id6744426938" target="_blank" className="hover:text-white transition">Get Coached (Download App)</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 Propel. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
