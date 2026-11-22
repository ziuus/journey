'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Zap,
  Layers,
  GitBranch,
  Cpu,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Award,
  ChevronRight,
  Code2,
  Calendar,
} from 'lucide-react'
import {
  getAnalyticsSummary,
  type AnalyticsSummary,
  type PhaseBreakdown,
  type LayerProgress,
} from '@/lib/analytics'
import type { Roadmap } from '@/lib/types'

interface AnalyticsDashboardProps {
  roadmap: Roadmap
  onSelectLayer?: (layerId: string) => void
}

export function AnalyticsDashboard({ roadmap, onSelectLayer }: AnalyticsDashboardProps) {
  const summary: AnalyticsSummary = getAnalyticsSummary(roadmap)
  const { velocity, phases, layers, skillCategories, topSkills, technologies, tracks } = summary

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null)
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(phases[0]?.id || null)

  const filteredSkills = activeCategoryFilter
    ? topSkills.filter((s) => s.category === activeCategoryFilter)
    : topSkills

  const selectedPhase = phases.find((p) => p.id === selectedPhaseId) || phases[0]

  return (
    <div className="space-y-6">
      {/* 1. Learning Velocity & Pace Forecast Section */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/20 text-primary border border-primary/30 shadow-sm">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">Learning Velocity & Pace Forecast</h2>
                <span
                  className={cn(
                    'text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border',
                    velocity.status === 'ahead' && 'bg-accent/20 text-accent border-accent/40',
                    velocity.status === 'on-track' && 'bg-primary/20 text-primary border-primary/40',
                    velocity.status === 'behind' && 'bg-destructive/20 text-destructive border-destructive/40',
                    velocity.status === 'completed' && 'bg-accent/20 text-accent border-accent/40',
                    velocity.status === 'not-started' && 'bg-muted text-muted-foreground border-border/60'
                  )}
                >
                  {velocity.status === 'ahead' && 'Ahead of Schedule'}
                  {velocity.status === 'on-track' && 'On Track'}
                  {velocity.status === 'behind' && 'Behind Schedule'}
                  {velocity.status === 'completed' && 'Completed'}
                  {velocity.status === 'not-started' && 'Not Started'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time pacing metrics, projected timeline, and milestone burn-down
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-xl border border-border/40 self-start sm:self-auto">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>Target: {velocity.totalWeeks} Weeks Program</span>
          </div>
        </div>

        {/* Velocity Metrics Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Module Velocity */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/40 flex flex-col justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Module Velocity
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-foreground">
                  {velocity.modulePace}
                </span>
                <span className="text-xs text-muted-foreground">modules / wk</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border/30">
              {velocity.completedModules} of {velocity.totalModules} modules finished
            </p>
          </div>

          {/* Milestone Pace */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/40 flex flex-col justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Milestone Pace
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-foreground">
                  {velocity.milestonePace}
                </span>
                <span className="text-xs text-muted-foreground">milestones / wk</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border/30">
              {velocity.completedMilestones} of {velocity.totalMilestones} checkpoints
            </p>
          </div>

          {/* Projected Completion */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/40 flex flex-col justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Pace Forecast
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-foreground">
                  {velocity.projectedCompletionWeek ? `Week ${velocity.projectedCompletionWeek}` : 'Pending'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border/30 truncate" title={velocity.paceStatusDescription}>
              {velocity.paceStatusDescription}
            </p>
          </div>

          {/* Remaining Burn-down */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/40 flex flex-col justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Remaining Workload
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-foreground">
                  {velocity.remainingModules}
                </span>
                <span className="text-xs text-muted-foreground">modules left</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border/30">
              {velocity.remainingMilestones} milestones remaining
            </p>
          </div>
        </div>

        {/* Pacing Timeline Gauge */}
        <div className="mt-5 p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-primary" />
              Timeline Progress (Week {velocity.currentWeek} of {velocity.totalWeeks})
            </span>
            <span className="font-mono font-bold text-foreground">
              {Math.round(Math.min(100, (velocity.currentWeek / (velocity.totalWeeks || 1)) * 100))}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden flex">
            <div
              className="bg-primary h-full transition-all duration-500 rounded-full"
              style={{
                width: `${Math.min(100, Math.max(0, (velocity.currentWeek / (velocity.totalWeeks || 1)) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. Phase-by-Phase Completion Breakdown */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/30">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Phase Completion Breakdown</h3>
                <p className="text-xs text-muted-foreground">
                  Curriculum completion percentage across architectural phases
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {phases.map((phase) => {
              const isSelected = phase.id === selectedPhaseId
              return (
                <div
                  key={phase.id}
                  onClick={() => setSelectedPhaseId(phase.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedPhaseId(phase.id)
                    }
                  }}
                  className={cn(
                    'p-4 rounded-xl border transition-all duration-200 cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    isSelected
                      ? 'bg-card border-primary/60 shadow-sm ring-1 ring-primary/40'
                      : 'bg-muted/10 border-border/50 hover:border-border/80 hover:bg-muted/20'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {phase.name}
                        </span>
                        {phase.status === 'completed' && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-accent/20 text-accent font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </span>
                        )}
                        {phase.status === 'in-progress' && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-primary/20 text-primary font-semibold">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {phase.focus}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-bold text-primary shrink-0">
                      {phase.percentage}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-muted/60 rounded-full overflow-hidden mb-2">
                    <div
                      className={cn(
                        'h-full transition-all duration-500 rounded-full',
                        phase.percentage === 100 ? 'bg-accent' : 'bg-primary'
                      )}
                      style={{ width: `${phase.percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                    <span>
                      {phase.completedModules}/{phase.totalModules} modules
                    </span>
                    <span>
                      {phase.completedMilestones}/{phase.totalMilestones} milestones
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Phase Focus & Detail Panel */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/40">
              <Award className="w-4 h-4 text-primary" />
              <h3 className="text-base font-bold text-foreground">Selected Phase Focus</h3>
            </div>

            {selectedPhase ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{selectedPhase.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {selectedPhase.focus}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="text-[11px] font-mono font-semibold uppercase text-primary block mb-1">
                    Target Outcome
                  </span>
                  <p className="text-xs text-foreground font-medium">
                    {selectedPhase.outcome || 'Production competency'}
                  </p>
                </div>

                {/* Layers in this Phase */}
                <div>
                  <span className="text-[11px] font-mono uppercase text-muted-foreground font-semibold block mb-2">
                    Constituent Layers ({selectedPhase.layers.length})
                  </span>
                  <div className="space-y-2">
                    {selectedPhase.layers.map((layerId) => {
                      const layer = layers.find((l) => l.id === layerId)
                      if (!layer) return null
                      return (
                        <div
                          key={layer.id}
                          onClick={() => onSelectLayer?.(layer.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              onSelectLayer?.(layer.id)
                            }
                          }}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/40 hover:bg-muted/40 transition-colors cursor-pointer group"
                        >
                          <div className="truncate mr-2">
                            <span className="text-xs font-medium text-foreground block truncate">
                              {layer.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {layer.completedModules}/{layer.totalModules} modules • {layer.completionPercent}%
                            </span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Select a phase to inspect details</p>
            )}
          </div>

          <div className="pt-4 border-t border-border/40 mt-4 text-[11px] text-muted-foreground font-mono text-center">
            Click any constituent layer to open detailed spec
          </div>
        </div>
      </div>

      {/* 3. Engineering Tracks Breakdown */}
      {tracks.length > 0 && (
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/30">
                <GitBranch className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Track Progress Breakdown</h3>
                <p className="text-xs text-muted-foreground">
                  Language and runtime specializations for Phase 1 backend engineering
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tracks.map((track) => (
              <div
                key={track.trackId}
                className={cn(
                  'p-4 rounded-xl border transition-all duration-200',
                  track.isSelected
                    ? 'bg-primary/10 border-primary/50 shadow-sm ring-1 ring-primary/30'
                    : 'bg-muted/10 border-border/40'
                )}
              >
                <div className="flex items-start justify-between gap-1 mb-2">
                  <span className="text-xs font-bold text-foreground">
                    {track.trackName}
                  </span>
                  {track.isSelected && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary text-primary-foreground font-bold shrink-0">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span>{track.totalModules} Modules</span>
                  <span>{track.isSelected ? 'Selected' : 'Available'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Skill Coverage & Technology Distribution */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/20 text-primary border border-primary/30 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">Skill Coverage & Tech Distribution</h3>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
                  {summary.topSkills.length} Core Skills
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Competencies and technologies targeted across portfolio projects and modules
              </p>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveCategoryFilter(null)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border',
                activeCategoryFilter === null
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted/70 hover:text-foreground'
              )}
            >
              All Skills ({topSkills.length})
            </button>
            {skillCategories.map((cat) => (
              <button
                key={cat.category}
                type="button"
                onClick={() =>
                  setActiveCategoryFilter(activeCategoryFilter === cat.category ? null : cat.category)
                }
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border',
                  activeCategoryFilter === cat.category
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted/70 hover:text-foreground'
                )}
              >
                {cat.category} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {/* Skill Tags Cloud */}
        <div className="mb-6">
          <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold mb-3">
            Project Skills ({filteredSkills.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {filteredSkills.map((skill) => (
              <div
                key={skill.name}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/30 hover:bg-muted/60 border border-border/50 transition-colors text-xs"
              >
                <span className="text-foreground font-medium">{skill.name}</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-primary/20 text-primary border border-primary/30">
                  {skill.count} {skill.count === 1 ? 'proj' : 'projs'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Technology Distribution Badges */}
        {technologies.length > 0 && (
          <div className="pt-4 border-t border-border/40">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold mb-3">
              Tools & Technology Stack
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* AI Tool Stack */}
              <div className="p-4 rounded-xl bg-muted/20 border border-border/40">
                <span className="text-xs font-semibold text-primary block mb-2 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> AI & Agent Tool Stack
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {technologies
                    .filter((t) => t.category === 'ai')
                    .map((tech) => (
                      <span
                        key={tech.name}
                        className="px-2 py-1 rounded-md bg-card border border-border/60 text-xs font-mono text-foreground"
                      >
                        {tech.name}
                      </span>
                    ))}
                </div>
              </div>

              {/* Backend Stack */}
              <div className="p-4 rounded-xl bg-muted/20 border border-border/40">
                <span className="text-xs font-semibold text-primary block mb-2 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" /> Backend & Cloud Stack
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {technologies
                    .filter((t) => t.category === 'backend')
                    .map((tech) => (
                      <span
                        key={tech.name}
                        className="px-2 py-1 rounded-md bg-card border border-border/60 text-xs font-mono text-foreground"
                      >
                        {tech.name}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
