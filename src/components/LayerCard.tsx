'use client'

import { cn } from '@/lib/utils'
import { CheckCircle, Clock, BookOpen } from 'lucide-react'
import type { Layer } from '@/lib/types'

interface LayerCardProps {
  layer: Layer
  index: number
  isCurrent: boolean
  isCompleted: boolean
  onClick?: () => void
}

const statusIcons = {
  pending: Clock,
  'in-progress': BookOpen,
  completed: CheckCircle,
}

const statusColors = {
  pending: 'text-muted-foreground',
  'in-progress': 'text-primary',
  completed: 'text-accent',
}

export function LayerCard({ layer, index, isCurrent, isCompleted, onClick }: LayerCardProps) {
  const StatusIcon = statusIcons[layer.status]
  const statusColor = statusColors[layer.status]
  const trackCount = layer.tracks?.length || 0
  const moduleCount = layer.modules?.length || layer.sections?.length || 0

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View details for Layer ${index + 1}: ${layer.title}`}
      onKeyDown={handleKeyDown}
      onClick={onClick}
      className={cn(
        'group relative p-6 rounded-xl border transition-all duration-300 cursor-pointer text-left',
        'bg-card border-border/50 hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
        isCurrent && 'border-primary/50 ring-1 ring-primary/20 shadow-sm',
        isCompleted && 'opacity-80'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className={cn('text-lg font-mono font-medium', isCurrent && 'text-primary')}>
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className={cn('font-semibold text-lg truncate', isCurrent && 'text-primary')}>
              {layer.title}
            </h3>
            {isCurrent && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full shrink-0">
                ACTIVE
              </span>
            )}
            {isCompleted && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-accent/20 text-accent rounded-full shrink-0">
                DONE
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {layer.description}
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {trackCount > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-muted/60 border border-border/40 rounded-lg">
                {trackCount} track{trackCount !== 1 ? 's' : ''}
              </span>
            )}
            <span className="flex items-center gap-1 px-2.5 py-1 bg-muted/60 border border-border/40 rounded-lg">
              {moduleCount} module{moduleCount !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 bg-muted/60 border border-border/40 rounded-lg">
              {layer.estimatedWeeks} week{layer.estimatedWeeks !== 1 && layer.estimatedWeeks !== 'ongoing' ? 's' : ''}
            </span>
          </div>
        </div>
        <div className={cn('flex-shrink-0 p-3 rounded-full bg-muted/30 border border-border/40 transition-colors', statusColor)}>
          <StatusIcon className="w-5 h-5" />
        </div>
      </div>
      {isCurrent && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/60 origin-left group-hover:scale-x-100 scale-x-0 transition-transform duration-300 rounded-b-xl" />
      )}
    </div>
  )
}
