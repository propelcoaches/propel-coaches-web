import Link from 'next/link'

export const metadata = {
  title: 'Propel — The platform that propels your practice',
  description: 'One platform for personal trainers, dietitians, and exercise physiologists. Programs, nutrition, check-ins, messaging, payments — and an AI coach that works while you sleep.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ─── Header ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-gray-900">
            <div className="w-8 h-8 rounded-lg bg-[#0F7B8C] flex items-center justify-center text-white text-sm font-bold">P</div>
            Propel
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-[#0F7B8C] hover:text-[#0d6b7a] transition-colors">
              Coach login
            </Link>
            <Link href="/register" className="bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              Sign up free
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="pt-28 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <p className="text-sm font-semibold text-[#0F7B8C] mb-4 tracking-wide">Built for health &amp; fitness professionals</p>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
                The platform that<br />
                <span className="text-[#0F7B8C]">propels your practice</span>
              </h1>
              <p className="mt-6 text-lg text-gray-500 leading-relaxed max-w-lg">
                One platform for personal trainers, dietitians, and exercise physiologists.
                Programs, nutrition, check-ins, messaging, payments — and an AI coach that works while you sleep.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white font-bold px-8 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-[#0F7B8C]/20">
                  Start for free <span aria-hidden="true">→</span>
                </Link>
                <a href="#how-it-works" className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold px-8 py-4 rounded-2xl text-base transition-colors hover:border-gray-300 hover:bg-gray-50">
                  See how it works
                </a>
              </div>
              <div className="mt-10 flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    <div className="w-6 h-6 rounded-full bg-[#0F7B8C]/20 border-2 border-white" />
                    <div className="w-6 h-6 rounded-full bg-[#0F7B8C]/30 border-2 border-white" />
                    <div className="w-6 h-6 rounded-full bg-[#0F7B8C]/40 border-2 border-white" />
                  </div>
                  <span><strong className="text-gray-600">500+</strong> coaches</span>
                </div>
                <span>No lock-in</span>
                <span>iOS &amp; Android</span>
              </div>
            </div>

            {/* Right — Phone Mockups */}
            <div className="relative h-[580px] hidden md:block">
              {/* Left phone — Nutrition */}
              <div className="absolute left-4 top-12 w-[180px] z-10 transform -rotate-3">
                <div className="bg-gray-900 rounded-[28px] p-[5px] shadow-2xl" style={{aspectRatio: '9/19'}}>
                  <div className="bg-white rounded-[24px] overflow-hidden h-full flex flex-col">
                    <div className="bg-[#0F7B8C] px-4 py-3 flex-shrink-0">
                      <p className="text-white text-[11px] font-semibold">Nutrition</p>
                    </div>
                    <div className="p-3 space-y-2.5 flex-1">
                      <div className="text-center py-1">
                        <p className="text-xl font-bold text-gray-900">1,220</p>
                        <p className="text-[9px] text-gray-400">kcal · 980 remaining</p>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[9px] text-gray-500">Protein</span>
                            <span className="text-[9px] font-semibold text-gray-700">133/180g</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full"><div className="h-1.5 bg-[#0F7B8C] rounded-full" style={{width: '74%'}} /></div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[9px] text-gray-500">Carbs</span>
                            <span className="text-[9px] font-semibold text-gray-700">118/220g</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full"><div className="h-1.5 bg-amber-400 rounded-full" style={{width: '54%'}} /></div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[9px] text-gray-500">Fat</span>
                            <span className="text-[9px] font-semibold text-gray-700">24/70g</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full"><div className="h-1.5 bg-rose-400 rounded-full" style={{width: '34%'}} /></div>
                        </div>
                      </div>
                      <div className="space-y-1 pt-1">
                        <div className="bg-gray-50 rounded-lg px-2.5 py-2 text-[9px] text-gray-600">🥣 Breakfast · 420 kcal</div>
                        <div className="bg-gray-50 rounded-lg px-2.5 py-2 text-[9px] text-gray-600">🍛 Lunch · 510 kcal</div>
                        <div className="bg-gray-50 rounded-lg px-2.5 py-2 text-[9px] text-gray-600">🍽️ Dinner · 290 kcal</div>
                        <div className="bg-gray-50 rounded-lg px-2.5 py-2 text-[9px] text-gray-400">🍫 Snacks · Log food</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center phone — Home / Dashboard */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[210px] z-20">
                <div className="bg-gray-900 rounded-[30px] p-[5px] shadow-2xl shadow-black/30" style={{aspectRatio: '9/19'}}>
                  <div className="rounded-[26px] overflow-hidden bg-white h-full flex flex-col">
                    {/* Status bar + Notch */}
                    <div className="relative bg-white pt-2 pb-1 flex-shrink-0">
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-[5px] bg-gray-900 rounded-full z-10" />
                      <div className="flex justify-between px-4 pt-3">
                        <span className="text-[8px] text-gray-400">9:41</span>
                        <div className="flex gap-1 items-center">
                          <div className="w-3 h-1.5 border border-gray-400 rounded-sm"><div className="w-2 h-full bg-gray-400 rounded-sm" /></div>
                        </div>
                      </div>
                    </div>
                    {/* Screen Content — Client Home */}
                    <div className="px-3.5 pb-4 flex-1">
                      <p className="text-[9px] text-gray-400 mb-0.5">Good morning</p>
                      <p className="text-[13px] font-bold text-gray-900 mb-3">Emma Wilson</p>
                      <div className="bg-[#0F7B8C]/5 rounded-xl p-2.5 border border-[#0F7B8C]/10">
                        <p className="text-[9px] font-semibold text-[#0F7B8C] mb-0.5">Today&apos;s Workout</p>
                        <p className="text-[11px] font-bold text-gray-900">Upper Body Push</p>
                        <p className="text-[9px] text-gray-400">5 exercises · ~55 min</p>
                        <div className="mt-1.5 bg-[#0F7B8C] rounded-lg py-1.5 text-center">
                          <span className="text-[9px] font-semibold text-white">Start Workout</span>
                        </div>
                      </div>
                      <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-[15px] font-bold text-gray-900">1,220</p>
                          <p className="text-[8px] text-gray-400">kcal today</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-[15px] font-bold text-gray-900">8,432</p>
                          <p className="text-[8px] text-gray-400">steps</p>
                        </div>
                      </div>
                      <p className="text-[9px] font-semibold text-gray-500 mt-2.5 mb-1">Daily Habits</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1.5">
                          <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-[8px]">✓</div>
                          <span className="text-[9px] text-gray-600">Drink 3L water</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1.5">
                          <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[8px] text-gray-300">○</div>
                          <span className="text-[9px] text-gray-600">10,000 steps</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1.5">
                          <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-[8px]">✓</div>
                          <span className="text-[9px] text-gray-600">8hrs sleep</span>
                        </div>
                      </div>
                      {/* Bottom nav bar */}
                      <div className="mt-3 flex justify-around border-t border-gray-100 pt-2">
                        <div className="text-center"><div className="text-[10px]">🏠</div><p className="text-[7px] text-[#0F7B8C] font-semibold">Home</p></div>
                        <div className="text-center"><div className="text-[10px]">🏋️</div><p className="text-[7px] text-gray-400">Train</p></div>
                        <div className="text-center"><div className="text-[10px]">🍎</div><p className="text-[7px] text-gray-400">Nutrition</p></div>
                        <div className="text-center"><div className="text-[10px]">💬</div><p className="text-[7px] text-gray-400">Chat</p></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right phone — Training */}
              <div className="absolute right-4 top-12 w-[180px] z-10 transform rotate-3">
                <div className="bg-gray-900 rounded-[28px] p-[5px] shadow-2xl" style={{aspectRatio: '9/19'}}>
                  <div className="bg-white rounded-[24px] overflow-hidden h-full flex flex-col">
                    <div className="bg-[#0F7B8C] px-4 py-3 flex-shrink-0">
                      <p className="text-white text-[11px] font-semibold">Training</p>
                    </div>
                    <div className="p-3 space-y-2 flex-1">
                      <p className="text-[11px] font-bold text-gray-900">My Program</p>
                      <p className="text-[9px] text-gray-400">1/4 sessions this week</p>
                      <div className="flex gap-1 mt-1">
                        {['M','T','W','T','F','S','S'].map((d, i) => (
                          <div key={i} className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[7px] font-medium ${i === 2 ? 'bg-[#0F7B8C] text-white' : 'bg-gray-100 text-gray-400'}`}>
                            {d}
                          </div>
                        ))}
                      </div>
                      <div className="mt-1.5 bg-gray-50 rounded-xl p-2.5">
                        <span className="text-[9px] font-semibold text-[#0F7B8C]">TODAY</span>
                        <p className="text-[10px] font-bold text-gray-900 mt-0.5">Upper Body Push</p>
                        <p className="text-[8px] text-gray-400">~55 min · 5 exercises</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2.5">
                        <span className="text-[9px] font-semibold text-gray-400">TOMORROW</span>
                        <p className="text-[10px] font-bold text-gray-900 mt-0.5">Lower Body</p>
                        <p className="text-[8px] text-gray-400">~50 min · 6 exercises</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2.5 border-l-4 border-[#0F7B8C]">
                        <p className="text-[9px] font-semibold text-gray-800">Coach Note</p>
                        <p className="text-[8px] text-gray-500 mt-0.5">Focus on controlled tempo today. 3-1-2 on all presses.</p>
                      </div>
                      <div className="bg-[#0F7B8C] rounded-xl py-2 text-center">
                        <span className="text-[9px] font-semibold text-white">▶ Start Workout</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Professions bar ─── */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">Built for every health profession</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['🏋️ Personal Trainers','🥗 Nutritionists','🍎 Dietitians','🏃 Exercise Physiologists','💪 Strength Coaches','📱 Online Fitness Coaches','🦴 Physiotherapists'].map((p, i) => (
              <span key={i} className="px-4 py-2 bg-white rounded-full text-sm text-gray-600 border border-gray-100 shadow-sm">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Coach Dashboard Preview ─── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Your coaching HQ, in the browser</h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
              Build programs, create meal plans with AI, track check-ins and message clients — all from your coach dashboard.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-2xl shadow-gray-200/50">
            {/* Browser chrome */}
            <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="ml-4 flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 border border-gray-200">
                app.propelcoaches.com
              </div>
            </div>
            {/* Dashboard UI */}
            <div className="bg-white flex">
              {/* Sidebar */}
              <div className="w-48 bg-gray-50 border-r border-gray-100 p-4 hidden sm:block">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-6 h-6 rounded bg-[#0F7B8C] flex items-center justify-center text-white text-[10px] font-bold">P</div>
                  <span className="text-xs font-bold text-gray-900">Propel</span>
                </div>
                <nav className="space-y-0.5 text-[11px]">
                  {['Dashboard','Clients','Messages','Check-ins','Coaching','Programs','Nutrition','Habits','Payments'].map((item, i) => (
                    <div key={i} className={`px-3 py-1.5 rounded-md ${i === 1 ? 'bg-[#0F7B8C] text-white font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                      {item}
                    </div>
                  ))}
                </nav>
              </div>
              {/* Main content */}
              <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Clients</h3>
                    <p className="text-xs text-gray-400">Manage your coaching clients</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-100 rounded-lg px-3 py-1.5 text-xs text-gray-400">Search clients...</div>
                    <div className="bg-[#0F7B8C] text-white text-xs font-semibold px-3 py-1.5 rounded-lg">Add Client</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[{label:'Total Clients',val:'24'},{label:'Active (Onboarded)',val:'21'},{label:'Pending Invitations',val:'3'}].map((s,i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[10px] text-gray-400">{s.label}</p>
                      <p className="text-lg font-bold text-gray-900">{s.val}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[
                    {name:'Emma Wilson',goal:'Fat Loss',status:'Active',last:'3 days ago'},
                    {name:'James Khoury',goal:'Muscle Gain',status:'Active',last:'Today'},
                    {name:'Mia Torres',goal:'Performance',status:'Active',last:'Yesterday'},
                    {name:'Liam Chen',goal:'Recomp',status:'Pending',last:'Invite sent'},
                  ].map((c,i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0F7B8C]/10 flex items-center justify-center text-[10px] font-bold text-[#0F7B8C]">
                          {c.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{c.name}</p>
                          <p className="text-[10px] text-gray-400">{c.goal}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${c.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>{c.status}</span>
                        <span className="text-[10px] text-gray-400">{c.last}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Everything you need.<br/>Nothing you don&apos;t.
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
              Choose which features your clients can access. A dietitian doesn&apos;t need the workout section, and a PT might not need meal plans.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {title:'Training Programs',desc:'Build and assign workout programs with sets, reps, tempo, and coach notes. Clients log sessions live in the app.',icon:'🏋️'},
              {title:'Nutrition & Meal Plans',desc:'Create AI-generated meal plans, set macro targets, and let clients log food with a barcode scanner or photo.',icon:'🍎'},
              {title:'Client Messaging',desc:'Chat directly with clients in real time. Send voice notes, use canned templates, and let AI handle after-hours.',icon:'💬'},
              {title:'Check-ins & Forms',desc:'Weekly progress check-ins with custom questions. Stay on top of how every client is really doing.',icon:'📋'},
              {title:'Habit Tracking',desc:'Set daily habits and let clients track them in the app. Build consistency one day at a time.',icon:'✅'},
              {title:'Progress & Metrics',desc:'Weight, measurements, progress photos, and personal bests — every metric in one place.',icon:'📊'},
              {title:'AI Coach Assistant',desc:'Your AI coach responds to clients 24/7 in your tone and style. It can also generate meal plans and workout programs.',icon:'🤖'},
              {title:'White Label & Branding',desc:'Make Propel your own. Custom colours, logo, and branding so clients see your brand — not ours.',icon:'🎨'},
              {title:'Video Exercise Library',desc:'Upload exercise demo videos and attach them to workouts. Clients see exactly how to perform each movement.',icon:'🎬'},
              {title:'Group Chats',desc:'Create group coaching channels for challenges, accountability groups, or team communication.',icon:'👥'},
              {title:'Wearable Integration',desc:'Connect Apple Watch, Fitbit, and Garmin. Pull in steps, heart rate, sleep, and activity data automatically.',icon:'⌚'},
              {title:'AI Form Check',desc:'Clients upload exercise videos and get instant AI-powered form analysis with technique feedback.',icon:'📹'},
              {title:'Packages & Subscriptions',desc:'Create coaching packages with different tiers. Clients subscribe and get auto-billed through Stripe.',icon:'📦'},
              {title:'Marketplace',desc:'List your programs and templates on the Propel marketplace. Earn passive income from your expertise.',icon:'🛒'},
              {title:'Payments & Invoicing',desc:'Send invoices, manage subscriptions, and track revenue — all powered by Stripe.',icon:'💳'},
            ].map((f, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-[#0F7B8C]/20 hover:bg-[#0F7B8C]/[0.02] transition-colors">
                <span className="text-2xl mb-3 block">{f.icon}</span>
                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AI Section ─── */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#0F7B8C] to-[#0a5a68] text-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-white/60 tracking-wide mb-3">AI-powered</p>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Your AI coach works while you sleep</h2>
              <p className="mt-4 text-white/70 leading-relaxed">
                Clients don&apos;t stop needing support at 5pm. Your AI coaching assistant responds to messages around the clock in your tone.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Responds instantly to client questions and check-ins',
                  'Matches your communication style perfectly',
                  'Hands off to you seamlessly when needed',
                  'Toggle on or off for any client at any time',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                    <svg className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/10">
                <p className="text-xs font-semibold text-white/40 mb-4">Example conversation</p>
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <div className="bg-white/20 rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%]">
                      <p className="text-sm">Hey, I missed my session today. Feeling really guilty 😔</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[80%]">
                      <p className="text-sm text-gray-700">Don&apos;t be too hard on yourself — one missed session doesn&apos;t undo your progress. How are you feeling? Want to make it up tomorrow?</p>
                      <p className="text-[10px] text-[#0F7B8C] font-semibold mt-1">AI Coach</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-white/20 rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%]">
                      <p className="text-sm">Just been flat out at work. I&apos;ll make it up tomorrow</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[80%]">
                      <p className="text-sm text-gray-700">That&apos;s the spirit. Tomorrow is upper body — get a good sleep and stay hydrated tonight. You&apos;ve got this 💪</p>
                      <p className="text-[10px] text-[#0F7B8C] font-semibold mt-1">AI Coach</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Up and running in minutes</h2>
            <p className="mt-4 text-gray-500">No setup call required. No lengthy onboarding. Just you and your clients, coaching.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {step:'1',title:'Sign up in 60 seconds',desc:'Create your account, tell us your profession, and choose which features your clients can access.'},
              {step:'2',title:'Invite your clients',desc:'Send clients an invite link. They download the app, create a profile, and connect to you instantly.'},
              {step:'3',title:'Start coaching',desc:'Build programs, send check-ins, chat in real time, and let your AI assistant handle the in-between.'},
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#0F7B8C]/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-[#0F7B8C]">{s.step}</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight text-center mb-16">Coaches love Propel</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {quote:'Propel replaced three separate tools I was using. My clients love the app and I finally feel on top of everything.',name:'Sarah Mitchell',role:'Online PT, Sydney'},
              {quote:'As a dietitian I only needed the nutrition and check-in features — being able to turn everything else off keeps it clean.',name:'James Khoury',role:'Accredited Dietitian'},
              {quote:'The AI coach handles all the after-hours messages. I used to spend an hour every night replying — now I don\'t.',name:'Mia Torres',role:'Exercise Physiologist'},
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(s => <span key={s} className="text-amber-400 text-sm">★</span>)}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Simple, transparent pricing</h2>
            <p className="mt-4 text-gray-500">14-day free trial on all plans. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {name:'Starter',desc:'Perfect for coaches just getting started',price:'0',features:['Up to 5 active clients','Training program builder','Nutrition & macro tracking','Habit tracking','Client messaging'],popular:false,cta:'Start free trial'},
              {name:'Pro',desc:'For established coaches scaling their business',price:'29',features:['Up to 30 active clients','Everything in Starter','AI Coach Assistant','Custom branding','Stripe payments','Priority support'],popular:true,cta:'Start free trial'},
              {name:'Team',desc:'For multi-practitioner clinics and teams',price:'79',features:['Unlimited active clients','Up to 5 coaches','Everything in Pro','Team dashboard','Revenue analytics','Phone support'],popular:false,cta:'Start free trial'},
            ].map((plan, i) => (
              <div key={i} className={`rounded-2xl p-6 border ${plan.popular ? 'border-[#0F7B8C] bg-[#0F7B8C]/[0.02] ring-1 ring-[#0F7B8C]/20 relative' : 'border-gray-200'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0F7B8C] text-white text-[10px] font-bold px-3 py-1 rounded-full">Most popular</div>
                )}
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">${plan.price}</span>
                  <span className="text-gray-400 text-sm">/month</span>
                </div>
                <Link href="/register" className={`block text-center font-bold py-3 px-6 rounded-xl text-sm transition-colors mb-6 ${plan.popular ? 'bg-white text-[#0F7B8C] hover:bg-gray-50 border border-[#0F7B8C]/20' : 'bg-[#0F7B8C] text-white hover:bg-[#0d6b7a]'}`}>
                  {plan.cta}
                </Link>
                <ul className="space-y-2.5">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-[#0F7B8C] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Ready to propel your practice?</h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">
            Join hundreds of health professionals who&apos;ve replaced their patchwork of tools with one platform that actually works.
          </p>
          <div className="mt-8">
            <Link href="/register" className="inline-flex items-center gap-2 bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white font-bold px-10 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-[#0F7B8C]/20">
              Get started free <span aria-hidden="true">→</span>
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400">14-day free trial · Cancel anytime · No lock-in contracts</p>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#0F7B8C] flex items-center justify-center text-white text-[10px] font-bold">P</div>
            <span className="text-sm font-bold text-gray-900">Propel</span>
          </div>
          <p className="text-xs text-gray-400">© 2026 Propel. Built for coaches, by coaches.</p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <a href="/privacy-policy" className="hover:text-gray-600 transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-gray-600 transition-colors">Terms</a>
            <Link href="/login" className="hover:text-gray-600 transition-colors text-[#0F7B8C]">Coach login</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
