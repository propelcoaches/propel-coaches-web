'use client'

import { useState } from 'react'
import { Dumbbell, Library, BookOpen } from 'lucide-react'
import clsx from 'clsx'
import ExerciseLibrary from '@/components/ExerciseLibrary'
import ProgramBuilderTab from '@/components/training/ProgramBuilderTab'
import ProgramTemplatesTab from '@/components/training/ProgramTemplatesTab'

type Tab = 'programs' | 'templates' | 'library'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TABS: { id: Tab; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'programs',  label: 'Programs',        icon: Dumbbell },
  { id: 'templates', label: 'Templates',        icon: BookOpen },
  { id: 'library',   label: 'Exercise Library', icon: Library  },
]

export default function TrainingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('programs')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="flex-shrink-0 flex items-center px-5 border-b border-cb-border bg-surface">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === tab.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-cb-secondary hover:text-cb-text'
              )}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {activeTab === 'library' ? (
        <ExerciseLibrary />
      ) : activeTab === 'templates' ? (
        <ProgramTemplatesTab />
      ) : (
        <ProgramBuilderTab />
      )}
    </div>
  )
}
