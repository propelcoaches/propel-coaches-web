'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: number
}

const BOT_RESPONSES = [
  {
    patterns: ['price', 'pricing', 'cost', 'how much', 'plan', 'subscription'],
    response: "We have three plans! 🎉\n\n**Starter** — Free, up to 5 clients\n**Pro** — £29/mo, up to 30 clients + AI assistant\n**Team** — £79/mo, unlimited clients + up to 5 coaches\n\nAll plans include a 14-day free trial. Want me to walk you through what's included?"
  },
  {
    patterns: ['free trial', 'trial', 'try', 'test'],
    response: "Yes! Every plan starts with a **14-day free trial**. You'll need a credit card to start but you won't be charged until the trial ends — cancel anytime before then. Want to get started?"
  },
  {
    patterns: ['feature', 'what can', 'include', 'does it'],
    response: "Propel includes everything a modern coach needs:\n\n🏋️ Program builder with templates\n✅ Weekly check-ins with photos\n🥗 Nutrition & macro tracking\n💬 Client messaging + AI assistant\n📊 Progress metrics & body fat tracking\n🔥 Habit tracking with streaks\n💳 Stripe payments\n\nAnything specific you'd like to know more about?"
  },
  {
    patterns: ['compare', 'trainerize', 'truecoach', 'competitor', 'vs', 'better', 'difference'],
    response: "Great question! The main things coaches tell us after switching:\n\n✅ AI coaching assistant (not on competitors)\n✅ Loom video feedback built-in\n✅ Body fat % tracking\n✅ Habit contribution calendar\n\nWe also have a detailed comparison page if you want to dive deeper! Check out /compare/trainerize"
  },
  {
    patterns: ['nutrition', 'macros', 'food', 'calories', 'meal'],
    response: "Yes — Propel has a full nutrition module! Coaches set custom macro targets per client (calories, protein, carbs, fat). Clients log meals with a food search powered by a 1M+ food database, scan barcodes, and track daily progress against their targets. Water intake tracking is included too."
  },
  {
    patterns: ['app', 'mobile', 'iphone', 'android', 'ios', 'phone'],
    response: "There's a full iOS & Android app for clients — they use it to log workouts, submit check-ins, track nutrition, and message you. As a coach you can manage everything from both the mobile app AND this web dashboard. Available on the App Store and Google Play!"
  },
  {
    patterns: ['payment', 'stripe', 'invoice', 'billing', 'charge'],
    response: "Propel has Stripe built in! You can send invoices, set up recurring subscriptions for clients, and track all your revenue from the dashboard. Payments go directly to your Stripe account — Propel doesn't take a cut of your client fees."
  },
  {
    patterns: ['hello', 'hi', 'hey', 'start', 'help'],
    response: "Hey! 👋 I'm here to help you learn about Propel. You can ask me about pricing, features, how the free trial works, or how we compare to other platforms. What would you like to know?"
  },
  {
    patterns: ['signup', 'sign up', 'register', 'get started', 'create account'],
    response: "You can get started in under 2 minutes! 🚀 Just click the **'Start free trial'** button at the top of the page. You'll get 14 days full access — you won't be charged until the trial ends."
  },
]

const DEFAULT_RESPONSE = "That's a great question! I want to make sure I give you the right answer. The best thing to do is start your free trial and explore — or feel free to email us at hello@propelcoach.app and our team will get back to you within a few hours."

const QUICK_REPLY_OPTIONS = [
  "What's included?",
  "How much does it cost?",
  "Is there a free trial?",
  "How does it compare?"
]

function renderMarkdown(text: string) {
  return text.split('\n').map((line, idx) => {
    // Replace **text** with <strong>text</strong>
    const processedLine = line.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>')
    return <div key={idx} dangerouslySetInnerHTML={{ __html: processedLine }} />
  })
}

function findBotResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase()

  for (const botResponse of BOT_RESPONSES) {
    for (const pattern of botResponse.patterns) {
      if (lowerMessage.includes(pattern)) {
        return botResponse.response
      }
    }
  }

  return DEFAULT_RESPONSE
}

export default function LeadChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const unreadCount = useRef(0)

  // Initialize with opening message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const openingMessage: Message = {
        id: 'opening',
        text: "Hi! 👋 I'm the Propel assistant. Ask me anything about our platform — pricing, features, how it compares to other tools, or how to get started!",
        sender: 'bot',
        timestamp: Date.now()
      }
      setMessages([openingMessage])
      unreadCount.current = 1
    }
  }, [isOpen, messages.length])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputValue,
      sender: 'user',
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')

    // Show typing indicator
    setIsTyping(true)

    // Simulate bot response delay (800ms)
    await new Promise(resolve => setTimeout(resolve, 800))

    // Find and add bot response
    const botResponseText = findBotResponse(inputValue)
    const botMessage: Message = {
      id: `bot-${Date.now()}`,
      text: botResponseText,
      sender: 'bot',
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, botMessage])
    setIsTyping(false)
  }

  const handleQuickReply = (reply: string) => {
    setInputValue(reply)
    // Small delay to make it feel natural
    setTimeout(() => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      document.getElementById('chatbot-input')?.dispatchEvent(event)
    }, 100)
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#0F7B8C] text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center"
      >
        <div className="relative">
          <MessageCircle size={24} />
          {unreadCount.current > 0 && !isOpen && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {Math.min(unreadCount.current, 9)}
            </div>
          )}
        </div>
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 h-[520px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#0F7B8C] text-white px-6 py-5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base">Propel Assistant</h3>
              <p className="text-xs text-white/70">Typically replies instantly</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                Loading...
              </div>
            ) : (
              <>
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-3 rounded-lg text-sm ${
                        msg.sender === 'user'
                          ? 'bg-[#0F7B8C] text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-900 rounded-bl-none'
                      }`}
                    >
                      {renderMarkdown(msg.text)}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg rounded-bl-none flex gap-2">
                      <span className="inline-flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                      </span>
                    </div>
                  </div>
                )}

                {/* Quick replies (after opening message) */}
                {messages.length === 1 && !isTyping && (
                  <div className="mt-4 space-y-2">
                    {QUICK_REPLY_OPTIONS.map(option => (
                      <button
                        key={option}
                        onClick={() => handleQuickReply(option)}
                        className="w-full text-left px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg transition-colors border border-gray-200"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 px-6 py-4 flex gap-2">
            <input
              id="chatbot-input"
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F7B8C] text-sm"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="bg-[#0F7B8C] text-white px-4 py-2 rounded-lg hover:bg-[#0d6b7a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes bounce {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }

        .animate-bounce {
          animation: bounce 1.4s infinite;
        }

        .delay-100 {
          animation-delay: 0.2s;
        }

        .delay-200 {
          animation-delay: 0.4s;
        }
      `}</style>
    </>
  )
}
