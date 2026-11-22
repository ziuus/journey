'use client'

import { useEffect, useId } from 'react'
import { X, Layers, Calendar, Clock, BookOpen, CheckCircle } from 'lucide-react'
import type { Layer } from '@/lib/types'
import { cn } from '@/lib/utils'

interface LayerDetailModalProps {
  layer: Layer | null
  onClose: () => void
}

const statusIcons = {
  pending: Clock,
  'in-progress': BookOpen,
  completed: CheckCircle,
}

export function LayerDetailModal({ layer, onClose }: LayerDetailModalProps) {
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!layer) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [layer, onClose])

  if (!layer) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const StatusIcon = statusIcons[layer.status] || Clock

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div
        className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slide-up shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border/80 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="p-1.5 rounded-lg bg-primary/20 text-primary">
                <Layers className="w-4 h-4" />
              </span>
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Layer Specification
              </span>
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium capitalize',
                layer.status === 'completed' && 'bg-accent/20 text-accent',
                layer.status === 'in-progress' && 'bg-primary/20 text-primary',
                layer.status === 'pending' && 'bg-muted text-muted-foreground'
              )}>
                {layer.status}
              </span>
            </div>
            <h2 id={titleId} className="text-2xl font-bold text-foreground">
              {layer.title}
            </h2>
            <p id={descriptionId} className="text-sm text-muted-foreground mt-1">
              {layer.description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
            aria-label="Close layer details dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
          <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border/40">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              Estimated Duration: <strong className="text-foreground">{layer.estimatedWeeks} weeks</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <StatusIcon className="w-4 h-4 text-primary" />
              Current Status: <strong className="text-foreground capitalize">{layer.status}</strong>
            </span>
          </div>

          {layer.tracks && (
            <div className="space-y-4">
              <h3 className="font-semibold text-base text-foreground">Curriculum Tracks</h3>
              <div className="grid gap-4">
                {layer.tracks.map((track) => (
                  <div key={track.id} className="p-4 rounded-xl border border-border/60 bg-card/60">
                    <h4 className="font-medium text-sm text-primary mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      {track.name} ({track.modules.length} modules)
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {track.modules.map((module, i) => (
                        <div
                          key={module.id}
                          className="flex items-start gap-2 p-2 rounded-lg bg-background/50 border border-border/30 text-xs"
                        >
                          <span className="font-mono text-primary font-bold w-5 shrink-0">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">{module.title}</p>
                            {module.topics && module.topics.length > 0 && (
                              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                {module.topics.join(' · ')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {layer.modules && (
            <div className="space-y-4">
              <h3 className="font-semibold text-base text-foreground">
                Core Modules ({layer.modules.length})
              </h3>
              <div className="space-y-2.5">
                {layer.modules.map((module, i) => (
                  <div
                    key={module.id}
                    className="p-3.5 rounded-xl border border-border/60 bg-card/50"
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-mono text-primary font-bold w-6 shrink-0 mt-0.5">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-foreground">{module.title}</h4>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {module.topics.map((topic) => (
                            <span
                              key={topic}
                              className="px-2 py-0.5 text-[11px] bg-muted/80 border border-border/40 rounded-md text-muted-foreground"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {layer.sections && (
            <div className="space-y-4">
              <h3 className="font-semibold text-base text-foreground">
                Specialized Sections ({layer.sections.length})
              </h3>
              <div className="space-y-2.5">
                {layer.sections.map((section, i) => (
                  <div
                    key={section.id}
                    className="p-3.5 rounded-xl border border-border/60 bg-card/50"
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-mono text-primary font-bold w-6 shrink-0 mt-0.5">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-foreground">{section.title}</h4>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {section.topics.map((topic) => (
                            <span
                              key={topic}
                              className="px-2 py-0.5 text-[11px] bg-muted/80 border border-border/40 rounded-md text-muted-foreground"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/30 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground">
          <span>Press <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-card border border-border">Esc</kbd> or click outside to dismiss</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
