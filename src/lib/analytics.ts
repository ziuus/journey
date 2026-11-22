import type { Roadmap, Layer, Milestone, Project, Module } from './types'

export interface LayerProgress {
  id: string
  title: string
  status: 'pending' | 'in-progress' | 'completed'
  totalModules: number
  completedModules: number
  totalMilestones: number
  completedMilestones: number
  modulePercent: number
  milestonePercent: number
  completionPercent: number
  estimatedWeeks: number
}

export interface PhaseBreakdown {
  id: string
  name: string
  focus: string
  outcome: string
  layers: string[]
  totalModules: number
  completedModules: number
  totalMilestones: number
  completedMilestones: number
  percentage: number
  status: 'pending' | 'in-progress' | 'completed'
}

export interface VelocityMetrics {
  currentWeek: number
  totalWeeks: number
  completedModules: number
  totalModules: number
  remainingModules: number
  completedMilestones: number
  totalMilestones: number
  remainingMilestones: number
  modulePace: number // completedModules / currentWeek
  milestonePace: number // completedMilestones / currentWeek
  projectedCompletionWeek: number | null
  weeksRemainingAtCurrentPace: number | null
  status: 'ahead' | 'on-track' | 'behind' | 'not-started' | 'completed'
  paceStatusDescription: string
}

export interface SkillItem {
  name: string
  count: number
  category: string
  percentage: number
}

export interface SkillCategorySummary {
  category: string
  count: number
  percentage: number
  skills: string[]
}

export interface TechnologySummary {
  name: string
  category: 'ai' | 'backend' | 'other'
  frequency: number
}

export interface TrackBreakdown {
  trackId: string
  trackName: string
  totalModules: number
  isSelected: boolean
}

export interface AnalyticsSummary {
  overallPercent: number
  velocity: VelocityMetrics
  phases: PhaseBreakdown[]
  layers: LayerProgress[]
  skillCategories: SkillCategorySummary[]
  topSkills: SkillItem[]
  technologies: TechnologySummary[]
  tracks: TrackBreakdown[]
}

// ----------------------------------------------------------------------
// Strict Defenses & Mathematical Primitives
// ----------------------------------------------------------------------

/**
 * Safely performs division with strict defenses against 0, NaN, Infinity, and negative values.
 * Returns 0 if denominator <= 0, or if either operand is non-finite or negative.
 */
export function safeDivide(numerator: number, denominator: number): number {
  if (
    typeof numerator !== 'number' ||
    typeof denominator !== 'number' ||
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator <= 0 ||
    numerator <= 0
  ) {
    return 0
  }
  const result = numerator / denominator
  return Number.isFinite(result) ? Math.max(0, result) : 0
}

/**
 * Calculates a percentage clamped strictly between 0 and 100.
 * Guaranteed to return an integer or bounded float, never NaN, Infinity, or negative.
 */
export function safePercentage(completed: number, total: number, round = true): number {
  if (
    typeof completed !== 'number' ||
    typeof total !== 'number' ||
    !Number.isFinite(completed) ||
    !Number.isFinite(total) ||
    total <= 0 ||
    completed <= 0
  ) {
    return 0
  }
  const pct = (completed / total) * 100
  const clamped = Math.min(100, Math.max(0, pct))
  return round ? Math.round(clamped) : Number(clamped.toFixed(2))
}

/**
 * Clamps a number to a safe non-negative integer.
 */
export function safeNonNegativeInt(val: unknown, fallback = 0): number {
  if (typeof val !== 'number' || !Number.isFinite(val) || Number.isNaN(val) || val < 0) {
    return fallback
  }
  return Math.floor(val)
}

/**
 * Parses program duration string like "24 weeks" into a safe integer number of weeks.
 */
export function parseDurationWeeks(durationStr?: string, fallback = 24): number {
  if (!durationStr || typeof durationStr !== 'string') return fallback
  const match = durationStr.match(/(-?\d+)/)
  if (!match) return fallback
  const parsed = parseInt(match[1], 10)
  return parsed > 0 ? parsed : fallback
}

/**
 * Returns modules belonging to a layer, respecting selected track if tracks exist.
 */
export function getLayerModules(layer?: Layer | null, selectedTrackId?: string | null): Module[] {
  if (!layer) return []
  if (Array.isArray(layer.modules) && layer.modules.length > 0) {
    return layer.modules
  }
  if (Array.isArray(layer.tracks) && layer.tracks.length > 0) {
    if (selectedTrackId) {
      const match = layer.tracks.find((t) => t.id === selectedTrackId)
      if (match && Array.isArray(match.modules)) {
        return match.modules
      }
    }
    return Array.isArray(layer.tracks[0]?.modules) ? layer.tracks[0].modules : []
  }
  if (Array.isArray(layer.sections) && layer.sections.length > 0) {
    return layer.sections
  }
  return []
}

// ----------------------------------------------------------------------
// Phase & Layer Progress Breakdown
// ----------------------------------------------------------------------

/**
 * Computes layer-by-layer progress breakdown.
 */
export function getLayerProgress(roadmap?: Roadmap | null): LayerProgress[] {
  if (!roadmap || !Array.isArray(roadmap.layers)) return []

  const milestones = Array.isArray(roadmap.milestones) ? roadmap.milestones : []
  const selectedTrackId = roadmap.progressTracking?.track || null

  return roadmap.layers.map((layer) => {
    const modules = getLayerModules(layer, selectedTrackId)
    const totalModules = modules.length

    const layerMilestones = milestones.filter((m) => m && m.layer === layer.id)
    const totalMilestones = layerMilestones.length
    const completedMilestones = layerMilestones.filter((m) => m && m.status === 'completed').length

    let completedModules = 0
    if (layer.status === 'completed') {
      completedModules = totalModules
    } else if (layer.status === 'in-progress') {
      if (totalMilestones > 0) {
        completedModules = Math.min(
          totalModules,
          Math.round((completedMilestones / totalMilestones) * totalModules)
        )
      } else {
        completedModules = totalModules > 0 ? Math.max(1, Math.round(totalModules * 0.5)) : 0
      }
    } else {
      // Pending layer: if any milestones were completed, reflect proportionally
      if (totalMilestones > 0 && completedMilestones > 0) {
        completedModules = Math.min(
          totalModules,
          Math.round((completedMilestones / totalMilestones) * totalModules)
        )
      }
    }

    const modulePercent = safePercentage(completedModules, totalModules)
    const milestonePercent = safePercentage(completedMilestones, totalMilestones)

    let completionPercent = 0
    if (layer.status === 'completed') {
      completionPercent = 100
    } else if (totalModules > 0 && totalMilestones > 0) {
      completionPercent = Math.round((modulePercent + milestonePercent) / 2)
    } else if (totalModules > 0) {
      completionPercent = modulePercent
    } else if (totalMilestones > 0) {
      completionPercent = milestonePercent
    } else if (layer.status === 'in-progress') {
      completionPercent = 50
    }

    const estWeeks =
      typeof layer.estimatedWeeks === 'number'
        ? Math.max(0, layer.estimatedWeeks)
        : parseInt(String(layer.estimatedWeeks), 10) || 0

    return {
      id: layer.id,
      title: layer.title || 'Untitled Layer',
      status: layer.status || 'pending',
      totalModules,
      completedModules,
      totalMilestones,
      completedMilestones,
      modulePercent,
      milestonePercent,
      completionPercent: Math.min(100, Math.max(0, completionPercent)),
      estimatedWeeks: Math.max(0, estWeeks),
    }
  })
}

/**
 * Computes phase-by-phase completion breakdown across timeline phases.
 */
export function getPhaseBreakdown(roadmap?: Roadmap | null): PhaseBreakdown[] {
  if (!roadmap) return []

  const layerProgressMap = new Map<string, LayerProgress>()
  for (const lp of getLayerProgress(roadmap)) {
    layerProgressMap.set(lp.id, lp)
  }

  const phases = Array.isArray(roadmap.timelinePhases) ? roadmap.timelinePhases : []

  // If no timelinePhases defined in roadmap, fallback to treating each layer as a phase
  if (phases.length === 0 && Array.isArray(roadmap.layers)) {
    return roadmap.layers.map((layer, idx) => {
      const lp = layerProgressMap.get(layer.id)
      return {
        id: layer.id,
        name: `Phase ${idx + 1}: ${layer.title}`,
        focus: layer.description || '',
        outcome: `${lp?.totalModules || 0} modules`,
        layers: [layer.id],
        totalModules: lp?.totalModules || 0,
        completedModules: lp?.completedModules || 0,
        totalMilestones: lp?.totalMilestones || 0,
        completedMilestones: lp?.completedMilestones || 0,
        percentage: lp?.completionPercent || 0,
        status: lp?.status || 'pending',
      }
    })
  }

  return phases.map((phase) => {
    const phaseLayers = Array.isArray(phase.layers) ? phase.layers : []
    let totalModules = 0
    let completedModules = 0
    let totalMilestones = 0
    let completedMilestones = 0
    let anyInProgress = false
    let allCompleted = phaseLayers.length > 0

    for (const layerId of phaseLayers) {
      const lp = layerProgressMap.get(layerId)
      if (lp) {
        totalModules += lp.totalModules
        completedModules += lp.completedModules
        totalMilestones += lp.totalMilestones
        completedMilestones += lp.completedMilestones
        if (lp.status === 'in-progress') anyInProgress = true
        if (lp.status !== 'completed') allCompleted = false
      } else {
        allCompleted = false
      }
    }

    const modulePct = safePercentage(completedModules, totalModules)
    const milestonePct = safePercentage(completedMilestones, totalMilestones)

    let percentage = 0
    if (allCompleted) {
      percentage = 100
    } else if (totalModules > 0 && totalMilestones > 0) {
      percentage = Math.round((modulePct + milestonePct) / 2)
    } else if (totalModules > 0) {
      percentage = modulePct
    } else if (totalMilestones > 0) {
      percentage = milestonePct
    }

    let status: 'pending' | 'in-progress' | 'completed' = 'pending'
    if (percentage >= 100 || allCompleted) {
      status = 'completed'
    } else if (percentage > 0 || anyInProgress) {
      status = 'in-progress'
    }

    return {
      id: phase.id,
      name: phase.name || 'Unnamed Phase',
      focus: phase.focus || '',
      outcome: phase.outcome || '',
      layers: phaseLayers,
      totalModules,
      completedModules,
      totalMilestones,
      completedMilestones,
      percentage: Math.min(100, Math.max(0, percentage)),
      status,
    }
  })
}

// ----------------------------------------------------------------------
// Learning Velocity & Pace Forecast
// ----------------------------------------------------------------------

/**
 * Calculates learning velocity, pacing metrics, and completion forecasts.
 */
export function calculateVelocity(roadmap?: Roadmap | null): VelocityMetrics {
  const defaultWeeks = 24
  if (!roadmap) {
    return {
      currentWeek: 0,
      totalWeeks: defaultWeeks,
      completedModules: 0,
      totalModules: 0,
      remainingModules: 0,
      completedMilestones: 0,
      totalMilestones: 0,
      remainingMilestones: 0,
      modulePace: 0,
      milestonePace: 0,
      projectedCompletionWeek: null,
      weeksRemainingAtCurrentPace: null,
      status: 'not-started',
      paceStatusDescription: 'No roadmap data available',
    }
  }

  const totalWeeks = parseDurationWeeks(roadmap.programDuration, defaultWeeks)
  const currentWeek = safeNonNegativeInt(roadmap.progressTracking?.currentWeek, 0)

  // Calculate modules
  const layerBreakdown = getLayerProgress(roadmap)
  const layerTotalModules = layerBreakdown.reduce((acc, l) => acc + l.totalModules, 0)
  const layerCompletedModules = layerBreakdown.reduce((acc, l) => acc + l.completedModules, 0)

  const trackingTotalModules = safeNonNegativeInt(roadmap.progressTracking?.totalModules, 0)
  const trackingCompletedModules = safeNonNegativeInt(roadmap.progressTracking?.completedModules, 0)

  const totalModules = trackingTotalModules > 0 ? trackingTotalModules : layerTotalModules
  const completedModules = Math.min(
    totalModules,
    Math.max(trackingCompletedModules, layerCompletedModules)
  )
  const remainingModules = Math.max(0, totalModules - completedModules)

  // Calculate milestones
  const allMilestones = Array.isArray(roadmap.milestones) ? roadmap.milestones : []
  const countCompletedMilestones = allMilestones.filter((m) => m && m.status === 'completed').length
  const totalMilestones = allMilestones.length > 0 ? allMilestones.length : safeNonNegativeInt(roadmap.progressTracking?.totalMilestones, 0)
  const completedMilestones = Math.min(
    totalMilestones,
    Math.max(countCompletedMilestones, safeNonNegativeInt(roadmap.progressTracking?.completedMilestones, 0))
  )
  const remainingMilestones = Math.max(0, totalMilestones - completedMilestones)

  // Compute paces
  const rawModulePace = safeDivide(completedModules, currentWeek)
  const modulePace = Number(rawModulePace.toFixed(2))

  const rawMilestonePace = safeDivide(completedMilestones, currentWeek)
  const milestonePace = Number(rawMilestonePace.toFixed(2))

  // Determine forecast & status
  if (remainingModules === 0 && totalModules > 0) {
    return {
      currentWeek,
      totalWeeks,
      completedModules,
      totalModules,
      remainingModules: 0,
      completedMilestones,
      totalMilestones,
      remainingMilestones: 0,
      modulePace,
      milestonePace,
      projectedCompletionWeek: currentWeek > 0 ? currentWeek : 1,
      weeksRemainingAtCurrentPace: 0,
      status: 'completed',
      paceStatusDescription: 'Curriculum completed!',
    }
  }

  if (currentWeek <= 0 || completedModules <= 0 || rawModulePace <= 0) {
    return {
      currentWeek,
      totalWeeks,
      completedModules,
      totalModules,
      remainingModules,
      completedMilestones,
      totalMilestones,
      remainingMilestones,
      modulePace: 0,
      milestonePace: 0,
      projectedCompletionWeek: null,
      weeksRemainingAtCurrentPace: null,
      status: 'not-started',
      paceStatusDescription:
        currentWeek === 0 ? 'Learning journey not yet started' : 'No modules completed yet',
    }
  }

  // Active pace calculations
  const weeksNeeded = remainingModules / rawModulePace
  const weeksRemainingAtCurrentPace = Math.ceil(weeksNeeded)
  const projectedCompletionWeek = Math.max(currentWeek + 1, currentWeek + weeksRemainingAtCurrentPace)

  let status: 'ahead' | 'on-track' | 'behind'
  let paceStatusDescription: string

  if (projectedCompletionWeek < totalWeeks) {
    status = 'ahead'
    const delta = totalWeeks - projectedCompletionWeek
    paceStatusDescription = `${delta} ${delta === 1 ? 'week' : 'weeks'} ahead of target`
  } else if (projectedCompletionWeek === totalWeeks) {
    status = 'on-track'
    paceStatusDescription = 'On track for scheduled completion'
  } else {
    status = 'behind'
    const delta = projectedCompletionWeek - totalWeeks
    paceStatusDescription = `${delta} ${delta === 1 ? 'week' : 'weeks'} behind target schedule`
  }

  return {
    currentWeek,
    totalWeeks,
    completedModules,
    totalModules,
    remainingModules,
    completedMilestones,
    totalMilestones,
    remainingMilestones,
    modulePace,
    milestonePace,
    projectedCompletionWeek,
    weeksRemainingAtCurrentPace,
    status,
    paceStatusDescription,
  }
}

// ----------------------------------------------------------------------
// Skill Coverage & Technology Distribution
// ----------------------------------------------------------------------

const SKILL_CATEGORY_RULES: Array<{ category: string; patterns: RegExp[] }> = [
  {
    category: 'AI & LLM Systems',
    patterns: [
      /\bllm\b/i,
      /\bagent/i,
      /\brag\b/i,
      /\bprompt/i,
      /\bembedding/i,
      /\bsemantic/i,
      /\blanggraph\b/i,
      /\blangchain\b/i,
      /\beval/i,
      /\bguardrail/i,
      /\bvector/i,
      /\bmodels?\b/i,
      /\bmodel\s+(routing|gateway|providers?)\b/i,
    ],
  },
  {
    category: 'Backend & API Architecture',
    patterns: [
      /\bapi\b/i,
      /\brest\b/i,
      /\bendpoint/i,
      /\bopenapi\b/i,
      /\bvalidation\b/i,
      /\bcontract/i,
      /\bingestion\b/i,
      /\bwebhook/i,
      /\bcontroller/i,
    ],
  },
  {
    category: 'Distributed Systems & Concurrency',
    patterns: [
      /\bconcurrency\b/i,
      /\bkafka\b/i,
      /\block/i,
      /\bqueue/i,
      /\bevent-driven\b/i,
      /\bstreaming\b/i,
      /\bbackoff\b/i,
      /\bretr/i,
      /\bidempot/i,
      /\brate limit/i,
      /\btracing\b/i,
      /\btimeout/i,
    ],
  },
  {
    category: 'Data & Storage Engineering',
    patterns: [
      /\bsql\b/i,
      /\bdatabase\b/i,
      /\bpostgres/i,
      /\bmongo/i,
      /\bredis\b/i,
      /\bledger\b/i,
      /\bacid\b/i,
      /\btransaction/i,
      /\bcach/i,
      /\bshard/i,
      /\bpartition/i,
    ],
  },
  {
    category: 'Security & Reliability',
    patterns: [
      /\bauth/i,
      /\bsecurity\b/i,
      /\bpermission/i,
      /\bsandbox/i,
      /\baudit\b/i,
      /\bisolation\b/i,
      /\brbac\b/i,
      /\boauth\b/i,
      /\bjwt\b/i,
    ],
  },
  {
    category: 'Testing & Quality',
    patterns: [
      /\btest/i,
      /\bmock/i,
      /\bci\b/i,
      /\bprofil/i,
      /\bbenchmark/i,
      /\bload/i,
    ],
  },
]

export function categorizeSkill(skillName: string): string {
  if (!skillName || typeof skillName !== 'string') return 'General Engineering'
  for (const rule of SKILL_CATEGORY_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(skillName)) {
        return rule.category
      }
    }
  }
  return 'General Engineering'
}

/**
 * Extracts skill coverage across projects and module topics.
 */
export function getSkillCoverage(roadmap?: Roadmap | null): {
  topSkills: SkillItem[]
  categories: SkillCategorySummary[]
  totalSkills: number
} {
  if (!roadmap) {
    return { topSkills: [], categories: [], totalSkills: 0 }
  }

  const skillFrequency = new Map<string, number>()
  const projects = Array.isArray(roadmap.projects) ? roadmap.projects : []

  // Count skills across projects
  for (const project of projects) {
    if (Array.isArray(project.skills)) {
      for (const skill of project.skills) {
        const trimmed = skill.trim()
        if (trimmed) {
          skillFrequency.set(trimmed, (skillFrequency.get(trimmed) || 0) + 1)
        }
      }
    }
  }

  const totalSkills = skillFrequency.size
  if (totalSkills === 0) {
    return { topSkills: [], categories: [], totalSkills: 0 }
  }

  // Convert to skill items
  const skillItems: SkillItem[] = []
  skillFrequency.forEach((count, name) => {
    const category = categorizeSkill(name)
    const percentage = safePercentage(count, projects.length)
    skillItems.push({ name, count, category, percentage })
  })

  // Sort top skills by frequency descending, then alphabetically
  skillItems.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

  // Group by category
  const categoryMap = new Map<string, { count: number; skills: string[] }>()
  for (const item of skillItems) {
    const existing = categoryMap.get(item.category) || { count: 0, skills: [] }
    existing.count += 1
    existing.skills.push(item.name)
    categoryMap.set(item.category, existing)
  }

  const categories: SkillCategorySummary[] = []
  categoryMap.forEach((data, category) => {
    categories.push({
      category,
      count: data.count,
      percentage: safePercentage(data.count, totalSkills),
      skills: data.skills,
    })
  })
  categories.sort((a, b) => b.count - a.count)

  return {
    topSkills: skillItems,
    categories,
    totalSkills,
  }
}

/**
 * Extracts technology distribution from toolsAndTechnologies and cross-references usage.
 */
export function getTechnologyDistribution(roadmap?: Roadmap | null): TechnologySummary[] {
  if (!roadmap || !roadmap.toolsAndTechnologies) return []

  const { aiToolStack, backendStack } = roadmap.toolsAndTechnologies
  const result: TechnologySummary[] = []

  // Collect text corpus to evaluate technology prominence
  const corpusParts: string[] = []
  if (Array.isArray(roadmap.layers)) {
    for (const layer of roadmap.layers) {
      if (layer.title) corpusParts.push(layer.title)
      if (layer.description) corpusParts.push(layer.description)
      const modules = getLayerModules(layer)
      for (const m of modules) {
        if (m.title) corpusParts.push(m.title)
        if (Array.isArray(m.topics)) corpusParts.push(...m.topics)
      }
    }
  }
  if (Array.isArray(roadmap.projects)) {
    for (const proj of roadmap.projects) {
      if (proj.title) corpusParts.push(proj.title)
      if (proj.description) corpusParts.push(proj.description)
      if (Array.isArray(proj.skills)) corpusParts.push(...proj.skills)
    }
  }

  const corpus = corpusParts.join(' ').toLowerCase()

  const countOccurrences = (tech: string): number => {
    if (!tech) return 0
    // Escape special regex characters
    const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi')
    const matches = corpus.match(regex)
    return matches ? matches.length : 1
  }

  if (Array.isArray(aiToolStack)) {
    for (const tool of aiToolStack) {
      if (tool) {
        result.push({
          name: tool,
          category: 'ai',
          frequency: countOccurrences(tool),
        })
      }
    }
  }

  if (Array.isArray(backendStack)) {
    for (const tech of backendStack) {
      if (tech) {
        result.push({
          name: tech,
          category: 'backend',
          frequency: countOccurrences(tech),
        })
      }
    }
  }

  // Sort by frequency descending, then name
  result.sort((a, b) => b.frequency - a.frequency || a.name.localeCompare(b.name))
  return result
}

// ----------------------------------------------------------------------
// Track Breakdown
// ----------------------------------------------------------------------

/**
 * Extracts available tracks from layer1 and tracks progress.
 */
export function getTrackBreakdown(roadmap?: Roadmap | null): TrackBreakdown[] {
  if (!roadmap || !Array.isArray(roadmap.layers)) return []

  const layer1 = roadmap.layers.find((l) => l.id === 'layer1')
  if (!layer1 || !Array.isArray(layer1.tracks)) return []

  const currentTrackId = roadmap.progressTracking?.track || null

  return layer1.tracks.map((track) => ({
    trackId: track.id,
    trackName: track.name,
    totalModules: Array.isArray(track.modules) ? track.modules.length : 0,
    isSelected: track.id === currentTrackId,
  }))
}

// ----------------------------------------------------------------------
// Master Analytics Summary
// ----------------------------------------------------------------------

/**
 * Returns a comprehensive analytics summary combining velocity, phases, skills, and tracks.
 */
export function getAnalyticsSummary(roadmap?: Roadmap | null): AnalyticsSummary {
  const velocity = calculateVelocity(roadmap)
  const phases = getPhaseBreakdown(roadmap)
  const layers = getLayerProgress(roadmap)
  const skillCoverage = getSkillCoverage(roadmap)
  const technologies = getTechnologyDistribution(roadmap)
  const tracks = getTrackBreakdown(roadmap)

  const overallPercent = safePercentage(velocity.completedMilestones, velocity.totalMilestones)

  return {
    overallPercent: roadmap?.progressTracking?.overallProgressPercent ?? overallPercent,
    velocity,
    phases,
    layers,
    skillCategories: skillCoverage.categories,
    topSkills: skillCoverage.topSkills,
    technologies,
    tracks,
  }
}
