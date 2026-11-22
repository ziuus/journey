'use client'

import { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  Flag,
  CheckCircle2,
  Calendar,
  Target,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ListChecks,
  RotateCcw,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react'
import type { Roadmap, Milestone, MilestoneSubtask } from '@/lib/types'
import {
  type GoalFilterStatus,
  type GoalSortOption,
  computeGoalStats,
  filterGoals,
  sortGoals,
  toggleMilestoneStatusInRoadmap,
  toggleSubtaskInRoadmap,
  getLayerDisplayName,
  getAvailableLayers,
  ensureMilestoneSubtasks,
} from '@/lib/goals'

export interface GoalViewerProps {
  roadmap: Roadmap
  onRoadmapChange: (updatedRoadmap: Roadmap) => void
  onSelectLayer?: (layerId: string) => void
}

export function GoalViewer({
  roadmap,
  onRoadmapChange,
  onSelectLayer,
}: GoalViewerProps) {
  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<GoalFilterStatus>('all')
  const [layerFilter, setLayerFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<GoalSortOption>('week-asc')

  // Expanded deliverables map (milestoneId -> boolean)
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({})

  // Compute overall goal and subtask stats
  const overallStats = useMemo(() => computeGoalStats(roadmap.milestones), [roadmap.milestones])

  // Extract available layers for dropdown
  const availableLayers = useMemo(
    () => getAvailableLayers(roadmap.milestones, roadmap.layers),
    [roadmap.milestones, roadmap.layers]
  )

  // Ensure milestones have their subtask items hydrated
  const hydratedMilestones = useMemo(() => {
    return roadmap.milestones.map((m) => ensureMilestoneSubtasks(m))
  }, [roadmap.milestones])

  // Apply filtering
  const filteredMilestones = useMemo(() => {
    return filterGoals(
      hydratedMilestones,
      {
        status: statusFilter,
        layer: layerFilter,
        query: searchQuery,
      },
      roadmap.layers
    )
  }, [hydratedMilestones, statusFilter, layerFilter, searchQuery, roadmap.layers])

  // Apply sorting
  const processedMilestones = useMemo(() => {
    return sortGoals(filteredMilestones, sortBy)
  }, [filteredMilestones, sortBy])

  // Filtered stats
  const filteredStats = useMemo(
    () => computeGoalStats(processedMilestones),
    [processedMilestones]
  )

  const isFilterActive = searchQuery.trim() !== '' || statusFilter !== 'all' || layerFilter !== 'all'

  // Toggle milestone expand/collapse
  const toggleExpand = useCallback((milestoneId: string) => {
    setExpandedMilestones((prev) => ({
      ...prev,
      [milestoneId]: !prev[milestoneId],
    }))
  }, [])

  // Expand / collapse all currently visible milestones
  const allVisibleExpanded = useMemo(() => {
    if (processedMilestones.length === 0) return false
    return processedMilestones.every((m) => !!expandedMilestones[m.id])
  }, [processedMilestones, expandedMilestones])

  const toggleExpandAll = useCallback(() => {
    if (allVisibleExpanded) {
      setExpandedMilestones({})
    } else {
      const next: Record<string, boolean> = {}
      for (const m of processedMilestones) {
        next[m.id] = true
      }
      setExpandedMilestones(next)
    }
  }, [allVisibleExpanded, processedMilestones])

  // Reset all filters
  const handleResetFilters = useCallback(() => {
    setSearchQuery('')
    setStatusFilter('all')
    setLayerFilter('all')
    setSortBy('week-asc')
  }, [])

  // Milestone completion toggle
  const handleToggleMilestone = useCallback(
    (milestoneId: string) => {
      const nextRoadmap = toggleMilestoneStatusInRoadmap(roadmap, milestoneId)
      onRoadmapChange(nextRoadmap)
    },
    [roadmap, onRoadmapChange]
  )

  // Subtask checkbox toggle
  const handleToggleSubtask = useCallback(
    (milestoneId: string, subtaskId: string) => {
      const nextRoadmap = toggleSubtaskInRoadmap(roadmap, milestoneId, subtaskId)
      onRoadmapChange(nextRoadmap)
    },
    [roadmap, onRoadmapChange]
  )

  return (
    <div className="space-y-6">
      {/* 1. Goal Stats & Progress Banner */}
      <section
        aria-label="Milestone Progress Overview"
        className="rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card/90 to-card/60 p-5 sm:p-6 shadow-sm backdrop-blur-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-primary/20 text-primary border border-primary/30">
                <Target className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Roadmap Milestones & Goal Verification
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Track, inspect, and verify each program milestone with granular deliverable checklists.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium px-3 py-1.5 rounded-xl bg-card border border-border/80 text-foreground shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              {overallStats.completed} / {overallStats.total} Goals Completed
            </span>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5">
          <div className="p-3.5 rounded-xl bg-card/70 border border-border/60 flex flex-col justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Goals</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground font-mono">
                {overallStats.total}
              </span>
              <span className="text-[11px] text-muted-foreground">milestones</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-accent/5 border border-accent/25 flex flex-col justify-between">
            <span className="text-xs font-medium text-accent">Completed</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-accent font-mono">
                {overallStats.completed}
              </span>
              <span className="text-[11px] text-accent/80">passed</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex flex-col justify-between">
            <span className="text-xs font-medium text-amber-400">Pending</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-amber-400 font-mono">
                {overallStats.pending}
              </span>
              <span className="text-[11px] text-amber-400/80">in queue</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/25 flex flex-col justify-between">
            <span className="text-xs font-medium text-primary">Progress Rate</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-primary font-mono">
                {overallStats.percent}%
              </span>
              <span className="text-[11px] text-muted-foreground">of roadmap</span>
            </div>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">
              Overall Roadmap Goal Completion
            </span>
            <span className="font-mono font-semibold text-foreground">
              {overallStats.percent}% ({overallStats.completed} of {overallStats.total})
            </span>
          </div>

          <div
            className="w-full h-3 rounded-full bg-muted/60 overflow-hidden border border-border/50 p-0.5"
            role="progressbar"
            aria-valuenow={overallStats.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Overall goal completion progress"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-primary/90 to-accent transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${overallStats.percent}%` }}
            />
          </div>

          {/* Subtasks Progress Line */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5 text-primary" />
              Granular Deliverables Checklist Progress:
            </span>
            <span className="font-mono">
              {overallStats.completedSubtasks} / {overallStats.totalSubtasks} tasks verified (
              {overallStats.subtasksPercent}%)
            </span>
          </div>
        </div>
      </section>

      {/* 2. Filter & Controls Engine Toolbar */}
      <section
        aria-label="Goal Controls & Filters"
        className="rounded-xl border border-border/60 bg-card p-4 space-y-3.5"
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Query Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search milestones, deliverables, or layers..."
              aria-label="Search milestones"
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-background border border-border/80 hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm text-foreground placeholder:text-muted-foreground transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Controls: Layer dropdown and Sort dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Layer Filter Select */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="layer-filter-select" className="text-xs text-muted-foreground sr-only">
                Filter by Layer
              </label>
              <select
                id="layer-filter-select"
                value={layerFilter}
                onChange={(e) => setLayerFilter(e.target.value)}
                aria-label="Filter by Layer"
                className="px-3 py-2 rounded-xl bg-background border border-border/80 hover:border-primary/50 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
              >
                <option value="all">All Layers ({overallStats.total})</option>
                {availableLayers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label} ({l.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options Select */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="sort-goals-select" className="text-xs text-muted-foreground sr-only">
                Sort Milestones By
              </label>
              <select
                id="sort-goals-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as GoalSortOption)}
                aria-label="Sort Milestones By"
                className="px-3 py-2 rounded-xl bg-background border border-border/80 hover:border-primary/50 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
              >
                <option value="week-asc">Week (Earliest First)</option>
                <option value="week-desc">Week (Latest First)</option>
                <option value="status">Status (Pending First)</option>
                <option value="title">Title (A → Z)</option>
                <option value="layer">Layer (By Phase)</option>
              </select>
            </div>

            {/* Expand / Collapse All Toggle Button */}
            <button
              type="button"
              onClick={toggleExpandAll}
              aria-label={allVisibleExpanded ? 'Collapse all subtasks' : 'Expand all subtasks'}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border/80 hover:border-primary/50 text-xs font-medium text-muted-foreground hover:text-foreground transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              {allVisibleExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-primary" />
                  <span>Collapse All</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-primary" />
                  <span>Expand All</span>
                </>
              )}
            </button>

            {/* Reset Filters Button (when active) */}
            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                aria-label="Reset all filters"
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-muted/40 hover:bg-muted/70 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Pills Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
          <div className="flex items-center gap-1.5" role="group" aria-label="Status Filters">
            <span className="text-xs text-muted-foreground font-medium mr-1 hidden sm:inline flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Status:
            </span>

            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              aria-pressed={statusFilter === 'all'}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150',
                statusFilter === 'all'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
            >
              All ({overallStats.total})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              aria-pressed={statusFilter === 'completed'}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150',
                statusFilter === 'completed'
                  ? 'bg-accent text-accent-foreground font-semibold shadow-sm'
                  : 'bg-muted/30 text-muted-foreground hover:bg-accent/20 hover:text-accent'
              )}
            >
              Completed ({overallStats.completed})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              aria-pressed={statusFilter === 'pending'}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150',
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'bg-muted/30 text-muted-foreground hover:bg-amber-500/20 hover:text-amber-400'
              )}
            >
              Pending ({overallStats.pending})
            </button>
          </div>

          <div className="text-xs font-mono text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{processedMilestones.length}</span> of{' '}
            {overallStats.total} goals
          </div>
        </div>
      </section>

      {/* 3. Goal Cards List & Subtask Inspection */}
      <section aria-label="Goal Milestone Cards" className="space-y-3.5">
        {processedMilestones.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-border/80 bg-card/40 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted/50 text-muted-foreground flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              No milestones found matching filters
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Try modifying your status filter, clearing your search query, or selecting &quot;All Layers&quot;.
            </p>
            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 text-xs font-semibold transition-colors mt-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          processedMilestones.map((milestone) => {
            const isCompleted = milestone.status === 'completed'
            const isExpanded = !!expandedMilestones[milestone.id]
            const subtasks = milestone.subtasks || []
            const completedSubtasksCount = subtasks.filter((st) => st.completed).length
            const totalSubtasksCount = subtasks.length
            const subtasksPercent =
              totalSubtasksCount > 0
                ? Math.round((completedSubtasksCount / totalSubtasksCount) * 100)
                : 0

            return (
              <article
                key={milestone.id}
                data-testid={`goal-card-${milestone.id}`}
                className={cn(
                  'rounded-xl border transition-all duration-200 overflow-hidden',
                  'bg-card border-border/70 hover:border-primary/40',
                  isCompleted && 'border-accent/30 bg-accent/[0.03]'
                )}
              >
                {/* Main Goal Card Summary Bar */}
                <div className="p-4 sm:p-5 flex items-start gap-3.5 sm:gap-4">
                  {/* Status Toggle Button */}
                  <div className="pt-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleMilestone(milestone.id)}
                      aria-label={`Mark milestone "${milestone.title}" as ${
                        isCompleted ? 'pending' : 'completed'
                      }`}
                      title={`Click to mark as ${isCompleted ? 'pending' : 'completed'}`}
                      className={cn(
                        'w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        isCompleted
                          ? 'bg-accent border-accent text-accent-foreground shadow-sm shadow-accent/20'
                          : 'border-border/80 bg-background text-muted-foreground hover:border-primary hover:text-foreground hover:scale-105 active:scale-95'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-accent-foreground stroke-[2.5]" />
                      ) : (
                        <Flag className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Goal Info */}
                  <div className="flex-1 min-w-0">
                    {/* Header Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/60">
                        <Calendar className="w-3 h-3 text-primary" />
                        Week {milestone.week}
                      </span>

                      <button
                        type="button"
                        onClick={() => onSelectLayer?.(milestone.layer)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                      >
                        <Target className="w-3 h-3" />
                        {getLayerDisplayName(milestone.layer, roadmap.layers)}
                      </button>

                      {isCompleted ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 tracking-wide uppercase">
                          COMPLETED
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 tracking-wide uppercase">
                          PENDING
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3
                      className={cn(
                        'text-base font-semibold tracking-tight transition-colors',
                        isCompleted
                          ? 'text-muted-foreground line-through decoration-muted-foreground/60'
                          : 'text-foreground'
                      )}
                    >
                      {milestone.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2 sm:line-clamp-none">
                      {milestone.description}
                    </p>

                    {/* Deliverables summary bar and toggle */}
                    <div className="mt-3 pt-3 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      {/* Mini Progress */}
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-24 sm:w-32 h-2 rounded-full bg-muted/60 overflow-hidden border border-border/40"
                          role="progressbar"
                          aria-valuenow={subtasksPercent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Subtasks progress: ${completedSubtasksCount} of ${totalSubtasksCount}`}
                        >
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-300',
                              isCompleted ? 'bg-accent' : 'bg-primary'
                            )}
                            style={{ width: `${subtasksPercent}%` }}
                          />
                        </div>

                        <span className="text-xs font-mono text-muted-foreground">
                          {completedSubtasksCount}/{totalSubtasksCount} deliverables ({subtasksPercent}%)
                        </span>
                      </div>

                      {/* Expand / Collapse Button */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(milestone.id)}
                        aria-expanded={isExpanded}
                        aria-controls={`subtasks-region-${milestone.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:underline"
                      >
                        <ListChecks className="w-3.5 h-3.5" />
                        <span>
                          {isExpanded
                            ? 'Hide Deliverables'
                            : `Inspect Deliverables (${totalSubtasksCount})`}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. Expandable Subtasks Checklist Drawer */}
                {isExpanded && (
                  <div
                    id={`subtasks-region-${milestone.id}`}
                    role="region"
                    aria-label={`Deliverables checklist for ${milestone.title}`}
                    className="border-t border-border/60 bg-muted/20 p-4 sm:p-5 space-y-2.5 animate-fade-in"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-primary" />
                        Required Deliverables & Subtask Verification
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {completedSubtasksCount} of {totalSubtasksCount} verified
                      </span>
                    </div>

                    <div className="space-y-2">
                      {subtasks.map((subtask: MilestoneSubtask, index: number) => {
                        const stCompleted = subtask.completed
                        return (
                          <div
                            key={subtask.id}
                            className={cn(
                              'flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-150',
                              stCompleted
                                ? 'bg-accent/5 border-accent/20 text-muted-foreground'
                                : 'bg-card border-border/60 hover:border-primary/40 text-foreground'
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleSubtask(milestone.id, subtask.id)}
                              aria-label={`Toggle subtask: ${subtask.title}`}
                              className={cn(
                                'shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors',
                                stCompleted && 'text-accent'
                              )}
                            >
                              {stCompleted ? (
                                <CheckSquare className="w-4 h-4 text-accent fill-accent/20" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <span
                                className={cn(
                                  'text-xs sm:text-sm font-medium transition-colors block',
                                  stCompleted
                                    ? 'line-through text-muted-foreground'
                                    : 'text-foreground'
                                )}
                              >
                                {subtask.title}
                              </span>
                            </div>

                            <span className="text-[10px] font-mono font-medium text-muted-foreground px-1.5 py-0.5 rounded bg-muted/40 border border-border/40 shrink-0">
                              #{index + 1}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}
