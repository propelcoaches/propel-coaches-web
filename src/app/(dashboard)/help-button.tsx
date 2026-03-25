'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { HelpCircle, MessageSquare, FileText, Zap, ChevronUp } from 'lucide-react';

export default function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div ref={popoverRef} className="relative">
        {/* Popover */}
        {isOpen && (
          <div
            className="absolute bottom-16 right-0 w-72 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
            style={{
              animation: 'fadeInUp 200ms ease-out forwards'
            }}
          >
            {/* Header */}
            <div
              className="px-4 py-4 text-white"
              style={{ backgroundColor: '#0F7B8C' }}
            >
              <h3 className="font-semibold text-lg">Need help?</h3>
              <p className="text-sm opacity-90">Browse our resources or get in touch</p>
            </div>

            {/* Quick Links */}
            <div className="divide-y">
              <Link
                href="/help"
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Help Center</p>
                  <p className="text-xs text-gray-500">Browse FAQs and guides</p>
                </div>
              </Link>

              <Link
                href="/help/contact"
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <MessageSquare className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Contact Support</p>
                  <p className="text-xs text-gray-500">Get help from our team</p>
                </div>
              </Link>

              <Link
                href="#"
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <Zap className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">What's New</p>
                  <p className="text-xs text-gray-500">See latest updates</p>
                </div>
              </Link>
            </div>

            {/* Chat Button */}
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <Link
                href="/help/contact"
                className="block w-full text-center px-4 py-2 rounded-lg font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#0F7B8C' }}
                onClick={() => setIsOpen(false)}
              >
                Chat with us
              </Link>
            </div>
          </div>
        )}

        {/* Help Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white font-semibold transition-all hover:shadow-xl active:scale-95"
          style={{ backgroundColor: '#0F7B8C' }}
          aria-label="Help and support"
          title="Help and support"
        >
          {isOpen ? (
            <ChevronUp className="w-6 h-6" />
          ) : (
            <HelpCircle className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* CSS for fade-in animation */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-in {
          animation: fadeInUp 200ms ease-out forwards;
        }
      `}</style>
    </div>
  );
}
