'use client'

import { cn } from '@/lib/utils'
import { Flag, CheckCircle2, Calendar, Target } from 'lucide-react'
import type { Milestone } from '@/lib/types'

interface MilestoneCardProps {
  milestone: Milestone
  isCurrent?: boolean
  onToggleStatus?: (id: string) => void
}

export function MilestoneCard({ milestone, isCurrent, onToggleStatus }: MilestoneCardProps) {
  const isCompleted = milestone.status === 'completed'

  return (
    <div
      className={cn(
        'relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-300',
        'bg-card border-border/50',
        isCurrent && 'border-primary/50 bg-primary/5',
        isCompleted && 'border-accent/30 bg-accent/5'
      )}
    >
      <div className="relative flex flex-col items-center justify-center min-w-[48px]">
        <button
          type="button"
          onClick={() => onToggleStatus?.(milestone.id)}
          disabled={!onToggleStatus}
          aria-label={`Mark milestone "${milestone.title}" as ${isCompleted ? 'pending' : 'completed'}`}
          title={onToggleStatus ? `Click to mark as ${isCompleted ? 'pending' : 'completed'}` : undefined}
          className={cn(
            'w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-200',
            isCompleted
              ? 'bg-accent border-accent text-accent-foreground'
              : 'border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground',
            onToggleStatus && 'cursor-pointer hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Flag className="w-5 h-5" />
          )}
        </button>
        <div className="absolute top-10 bottom-0 left-5 w-0.5 bg-border/50" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className={cn('font-medium', isCurrent && 'text-primary', isCompleted && 'line-through text-muted-foreground')}>
            {milestone.title}
          </h4>
          {isCurrent && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
              CURRENT
            </span>
          )}
          {isCompleted && (
            <span className="px-2 py-0.5 text-xs font-medium bg-accent/20 text-accent rounded-full">
              DONE
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
          {milestone.description}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Week {milestone.week}
          </span>
          <span className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            {milestone.layer}
          </span>
        </div>
      </div>
    </div>
  )
}
