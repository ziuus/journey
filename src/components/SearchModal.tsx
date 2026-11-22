'use client'

import { useState, useEffect, useRef, useId } from 'react'
import { Search, X, BookOpen, Flag, Trophy, Layers, ArrowRight, CornerDownLeft } from 'lucide-react'
import { searchRoadmap, type SearchResult, type SearchResultType } from '@/lib/search'
import type { Roadmap } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  roadmap: Roadmap
  onSelectResult: (result: SearchResult) => void
}

const typeIcons: Record<SearchResultType, React.ComponentType<{ className?: string }>> = {
  layer: Layers,
  module: BookOpen,
  milestone: Flag,
  project: Trophy,
}

const typeStyles: Record<SearchResultType, { badge: string; text: string }> = {
  layer: {
    badge: 'bg-primary/20 text-primary border-primary/30',
    text: 'text-primary',
  },
  module: {
    badge: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    text: 'text-sky-400',
  },
  milestone: {
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    text: 'text-amber-400',
  },
  project: {
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    text: 'text-emerald-400',
  },
}

export function SearchModal({
  isOpen,
  onClose,
  roadmap,
  onSelectResult,
}: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [filterType, setFilterType] = useState<SearchResultType | 'all'>('all')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsListRef = useRef<HTMLUListElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  const results = searchRoadmap(roadmap, query, { filterType, limit: 30 })

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Reset selected index when query or results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query, filterType])

  // Scroll active item into view
  useEffect(() => {
    if (resultsListRef.current && results.length > 0) {
      const activeEl = resultsListRef.current.children[selectedIndex] as HTMLElement | undefined
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex, results.length])

  // Handle Escape key and keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0))
      } else if (e.key === 'Enter') {
        if (results.length > 0 && results[selectedIndex]) {
          e.preventDefault()
          onSelectResult(results[selectedIndex])
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex, onSelectResult, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleClear = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div
        className="w-full max-w-2xl bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-slide-up focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header & Search Bar */}
        <div className="p-4 border-b border-border/60">
          <div className="flex items-center justify-between mb-3">
            <h2 id={titleId} className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              Instant Global Search
            </h2>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs text-muted-foreground">Press Esc to exit</span>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Close search dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p id={descriptionId} className="sr-only">
            Search across all roadmap layers, tracks, modules, topics, milestones, and projects.
          </p>

          <div className="relative flex items-center">
            <Search className="w-5 h-5 absolute left-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="search"
              role="searchbox"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topics, modules, milestones, projects, skills..."
              aria-label="Search roadmap contents"
              className="w-full pl-11 pr-20 py-2.5 rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-inner"
            />
            <div className="absolute right-3 flex items-center gap-1.5">
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/80 transition-colors"
                  aria-label="Clear search query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-muted text-muted-foreground border border-border/60">
                ESC
              </kbd>
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 text-xs">
            {(['all', 'layer', 'module', 'milestone', 'project'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-medium transition-colors capitalize shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  filterType === type
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {type === 'all' ? 'All Results' : `${type}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-3">
          {query.trim() === '' ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <Search className="w-8 h-8 mx-auto opacity-30 mb-2" />
              <p className="text-sm font-medium">Type a keyword to search across the entire roadmap</p>
              <p className="text-xs opacity-75">
                Examples: &ldquo;Transformers&rdquo;, &ldquo;Docker&rdquo;, &ldquo;RAG&rdquo;, &ldquo;Week 12&rdquo;, &ldquo;Autonomous Agents&rdquo;
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <p className="text-sm font-medium">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs opacity-75">Try checking your spelling or searching for a broader term.</p>
            </div>
          ) : (
            <ul
              ref={resultsListRef}
              role="listbox"
              aria-label="Search suggestions"
              className="space-y-1.5"
            >
              {results.map((item, index) => {
                const IconComponent = typeIcons[item.type]
                const styles = typeStyles[item.type]
                const isSelected = index === selectedIndex

                return (
                  <li
                    key={item.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelectResult(item)
                      onClose()
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'group flex items-start justify-between gap-3 p-3 rounded-xl cursor-pointer transition-all border text-left',
                      isSelected
                        ? 'bg-primary/10 border-primary/40 shadow-sm'
                        : 'bg-card/40 border-border/40 hover:bg-muted/40 hover:border-border'
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={cn('p-2 rounded-lg border shrink-0 mt-0.5', styles.badge)}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={cn('text-xs font-mono font-medium', styles.text)}>
                            {item.category}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted/80 text-muted-foreground border border-border/40">
                            {item.badgeText}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {item.title}
                        </h4>
                        {item.subtitle && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 self-center">
                      <span className="text-xs text-muted-foreground capitalize hidden sm:inline">
                        {item.targetTab}
                      </span>
                      <div className="p-1.5 rounded-lg text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Modal Footer Hotkey Hints */}
        <div className="px-4 py-2.5 bg-muted/30 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-card border border-border">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-card border border-border">↓</kbd>
              <span className="text-[11px] ml-0.5">Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-card border border-border flex items-center gap-0.5">
                <CornerDownLeft className="w-2.5 h-2.5" />
              </kbd>
              <span className="text-[11px] ml-0.5">Select</span>
            </span>
          </div>
          <span className="text-[11px] font-mono">{results.length} results</span>
        </div>
      </div>
    </div>
  )
}
