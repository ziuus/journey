'use client'

import { useEffect, useId } from 'react'
import { X, Keyboard, Command } from 'lucide-react'
import { SHORTCUTS_LIST } from '@/lib/hotkeys'

interface ShortcutHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ShortcutHelpModal({ isOpen, onClose }: ShortcutHelpModalProps) {
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Group shortcuts by category
  const categories = Array.from(new Set(SHORTCUTS_LIST.map((s) => s.category)))

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
        className="w-full max-w-lg bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/20 text-primary">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 id={titleId} className="text-lg font-bold text-foreground">
                Keyboard Shortcuts
              </h2>
              <p id={descriptionId} className="text-xs text-muted-foreground">
                Navigate the entire Journey roadmap hands-free
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close keyboard shortcuts dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-5 overflow-y-auto space-y-6">
          {categories.map((category) => (
            <div key={category} className="space-y-3">
              <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">
                {category}
              </h3>
              <div className="space-y-2">
                {SHORTCUTS_LIST.filter((s) => s.category === category).map((shortcut, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-4 p-2.5 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm text-foreground/90 font-medium">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {shortcut.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-1 rounded-md text-xs font-mono font-semibold bg-background border border-border text-foreground shadow-sm inline-flex items-center justify-center min-w-[24px]"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/30 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Command className="w-3.5 h-3.5 text-primary" />
            Press <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-card border border-border">?</kbd> at any time to open this help
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
