'use client'

import { usePathname } from 'next/navigation'
import LeadChatbot from './LeadChatbot'

export default function ChatbotWrapper() {
  const pathname = usePathname()

  // Hide chatbot on dashboard and admin pages
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/client')) {
    return null
  }

  return <LeadChatbot />
}
