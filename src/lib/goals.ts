import type { Milestone, MilestoneSubtask, Roadmap, Layer } from './types'

export type GoalFilterStatus = 'all' | 'completed' | 'pending'
export type GoalSortOption = 'week-asc' | 'week-desc' | 'status' | 'title' | 'layer'

export interface GoalFilterOptions {
  status?: GoalFilterStatus
  layer?: string
  query?: string
}

export interface GoalStats {
  total: number
  completed: number
  pending: number
  percent: number
  totalSubtasks: number
  completedSubtasks: number
  subtasksPercent: number
}

export const DEFAULT_MILESTONE_SUBTASKS: Record<string, MilestoneSubtask[]> = {
  milestone1: [
    { id: 'st1-1', title: 'Select primary engineering track (Java / Node.js / Python / Rust)', completed: false },
    { id: 'st1-2', title: 'Configure editor, compiler toolchain, and debugging environment', completed: false },
    { id: 'st1-3', title: 'Integrate AI coding agents (Cursor, GitHub Copilot, Hermes)', completed: false },
    { id: 'st1-4', title: 'Set up Git repository with branch protections and pre-commit hooks', completed: false },
  ],
  milestone2: [
    { id: 'st2-1', title: 'Implement REST API endpoints with schema validation', completed: false },
    { id: 'st2-2', title: 'Integrate database schema, migrations, and transactional repository layer', completed: false },
    { id: 'st2-3', title: 'Configure JWT authentication and role-based access control (RBAC)', completed: false },
    { id: 'st2-4', title: 'Achieve comprehensive test coverage with unit and integration tests', completed: false },
    { id: 'st2-5', title: 'Deploy service live with health checks and Docker container', completed: false },
  ],
  milestone3: [
    { id: 'st3-1', title: 'Produce agent-executable low-level design (LLD) specification', completed: false },
    { id: 'st3-2', title: 'Implement concurrency-safe core data structures and state machines', completed: false },
    { id: 'st3-3', title: 'Enforce SOLID principles, plugin interfaces, and design patterns', completed: false },
    { id: 'st3-4', title: 'Complete timed machine coding implementation with adversarial tests', completed: false },
  ],
  milestone4: [
    { id: 'st4-1', title: 'Build document chunking, embedding generation, and vector indexing pipeline', completed: false },
    { id: 'st4-2', title: 'Implement hybrid search (dense embeddings + sparse lexical BM25)', completed: false },
    { id: 'st4-3', title: 'Integrate ground-truth citations, hallucination guards, and confidence scoring', completed: false },
    { id: 'st4-4', title: 'Establish evaluation suite (Ragas/TruLens) and telemetry observability', completed: false },
  ],
  milestone5: [
    { id: 'st5-1', title: 'Design relational schema with index tuning and execution plan analysis', completed: false },
    { id: 'st5-2', title: 'Implement multi-tier caching with Redis and cache-aside invalidation', completed: false },
    { id: 'st5-3', title: 'Configure database replication, read/write splitting, and connection pooling', completed: false },
    { id: 'st5-4', title: 'Set up vector search partitioning and scale retrieval benchmarks', completed: false },
  ],
  milestone6: [
    { id: 'st6-1', title: 'Draft High-Concurrency Booking Engine architecture case study', completed: false },
    { id: 'st6-2', title: 'Draft AI-Personalized News Feed scaling and latency breakdown', completed: false },
    { id: 'st6-3', title: 'Draft Real-Time Messaging & Presence system design document', completed: false },
    { id: 'st6-4', title: 'Draft Production RAG at 10K+ QPS architecture & cost model', completed: false },
  ],
  milestone7: [
    { id: 'st7-1', title: 'Conduct customer workflow discovery and technical constraints mapping', completed: false },
    { id: 'st7-2', title: 'Build tool-calling backend integration and ingestion workflow', completed: false },
    { id: 'st7-3', title: 'Formulate rigorous eval datasets and safety boundary guardrails', completed: false },
    { id: 'st7-4', title: 'Package containerized deployment with automated rollback procedures', completed: false },
    { id: 'st7-5', title: 'Conduct stakeholder operational ownership handoff', completed: false },
  ],
  milestone8: [
    { id: 'st8-1', title: 'Master linear patterns: two-pointers, sliding window, prefix sums', completed: false },
    { id: 'st8-2', title: 'Master trees, BSTs, tries, and traversal decomposition', completed: false },
    { id: 'st8-3', title: 'Master graphs: BFS, DFS, topological sort, Dijkstra, Union-Find', completed: false },
    { id: 'st8-4', title: 'Master dynamic programming: state space design and memoization', completed: false },
    { id: 'st8-5', title: 'Complete 200+ timed practice questions with formal complexity defense', completed: false },
  ],
  milestone9: [
    { id: 'st9-1', title: 'Design system architecture combining backend, AI agents, and data storage', completed: false },
    { id: 'st9-2', title: 'Develop core business services, background worker queues, and event streams', completed: false },
    { id: 'st9-3', title: 'Incorporate production RAG or AI agent automation feature', completed: false },
    { id: 'st9-4', title: 'Harden security, rate limiting, and observability with distributed tracing', completed: false },
    { id: 'st9-5', title: 'Publish live deployment URL and open-source portfolio repository', completed: false },
  ],
  milestone10: [
    { id: 'st10-1', title: 'Refine resume with quantified impact metrics and AI engineering highlights', completed: false },
    { id: 'st10-2', title: 'Optimize LinkedIn profile and GitHub showcases for recruiter search', completed: false },
    { id: 'st10-3', title: 'Complete 5+ live mock technical interviews across backend and system design', completed: false },
    { id: 'st10-4', title: 'Submit referrals and direct applications across hiring network', completed: false },
  ],
  milestone11: [
    { id: 'st11-1', title: 'Analyze inbound offers against market salary bands and equity upside', completed: false },
    { id: 'st11-2', title: 'Execute structured compensation negotiation strategy', completed: false },
    { id: 'st11-3', title: 'Finalize role selection aligned with long-term engineering trajectory', completed: false },
    { id: 'st11-4', title: 'Establish 30-60-90 day technical onboarding and execution roadmap', completed: false },
  ],
  milestone12: [
    { id: 'st12-1', title: 'Connect with Airtribe alumni network and attend regional engineering meetups', completed: false },
    { id: 'st12-2', title: 'Mentor incoming cohort candidates on interview prep and capstone builds', completed: false },
    { id: 'st12-3', title: 'Contribute referrals and job opportunities to community channels', completed: false },
  ],
}

/**
 * Returns default subtasks for a milestone.
 * If predefined in registry, returns deep copy.
 * Otherwise creates generic default subtasks.
 */
export function getDefaultSubtasksForMilestone(milestone: Milestone): MilestoneSubtask[] {
  const registered = DEFAULT_MILESTONE_SUBTASKS[milestone.id]
  if (registered && registered.length > 0) {
    return registered.map((st) => ({
      ...st,
      completed: milestone.status === 'completed',
    }))
  }

  // Fallback generic deliverables derived from milestone
  return [
    { id: `${milestone.id}-st1`, title: `Design & plan requirements for ${milestone.title}`, completed: milestone.status === 'completed' },
    { id: `${milestone.id}-st2`, title: `Implement core logic and modules`, completed: milestone.status === 'completed' },
    { id: `${milestone.id}-st3`, title: `Verify implementation with comprehensive tests`, completed: milestone.status === 'completed' },
  ]
}

/**
 * Ensures milestone has a valid subtasks array.
 */
export function ensureMilestoneSubtasks(milestone: Milestone): Milestone {
  if (milestone.subtasks && Array.isArray(milestone.subtasks) && milestone.subtasks.length > 0) {
    return { ...milestone, subtasks: milestone.subtasks.map((st) => ({ ...st })) }
  }
  return {
    ...milestone,
    subtasks: getDefaultSubtasksForMilestone(milestone),
  }
}

/**
 * Computes goal statistics with zero-division safety.
 */
export function computeGoalStats(milestones: Milestone[]): GoalStats {
  const total = Array.isArray(milestones) ? milestones.length : 0
  if (total === 0) {
    return {
      total: 0,
      completed: 0,
      pending: 0,
      percent: 0,
      totalSubtasks: 0,
      completedSubtasks: 0,
      subtasksPercent: 0,
    }
  }

  let completed = 0
  let totalSubtasks = 0
  let completedSubtasks = 0

  for (const m of milestones) {
    if (m.status === 'completed') {
      completed++
    }
    const subtasks = m.subtasks || DEFAULT_MILESTONE_SUBTASKS[m.id] || []
    totalSubtasks += subtasks.length
    completedSubtasks += subtasks.filter((st) => st.completed).length
  }

  const pending = Math.max(0, total - completed)
  const percent = total > 0 ? Math.min(100, Math.max(0, Math.round((completed / total) * 100))) : 0
  const subtasksPercent =
    totalSubtasks > 0
      ? Math.min(100, Math.max(0, Math.round((completedSubtasks / totalSubtasks) * 100)))
      : 0

  return {
    total,
    completed,
    pending,
    percent,
    totalSubtasks,
    completedSubtasks,
    subtasksPercent,
  }
}

/**
 * Filters milestones based on status, layer, and search query.
 */
export function filterGoals(
  milestones: Milestone[],
  filters: GoalFilterOptions,
  layers?: Layer[]
): Milestone[] {
  if (!Array.isArray(milestones)) return []

  const status = filters.status || 'all'
  const layer = filters.layer && filters.layer !== 'all' ? filters.layer.toLowerCase().trim() : 'all'
  const query = filters.query ? filters.query.toLowerCase().trim() : ''

  const layerMap = new Map<string, string>()
  if (layers) {
    for (const l of layers) {
      layerMap.set(l.id.toLowerCase(), l.title.toLowerCase())
    }
  }

  return milestones.filter((milestone) => {
    // 1. Status Filter
    if (status === 'completed' && milestone.status !== 'completed') return false
    if (status === 'pending' && milestone.status !== 'pending') return false

    // 2. Layer Filter
    if (layer !== 'all') {
      if (milestone.layer.toLowerCase() !== layer) return false
    }

    // 3. Search Query Filter
    if (query.length > 0) {
      const titleMatch = milestone.title.toLowerCase().includes(query)
      const descMatch = milestone.description.toLowerCase().includes(query)
      const layerIdMatch = milestone.layer.toLowerCase().includes(query)
      const layerTitle = layerMap.get(milestone.layer.toLowerCase()) || ''
      const layerTitleMatch = layerTitle.includes(query)

      // Also check subtasks if available
      const subtasks = milestone.subtasks || DEFAULT_MILESTONE_SUBTASKS[milestone.id] || []
      const subtaskMatch = subtasks.some((st) => st.title.toLowerCase().includes(query))

      if (!titleMatch && !descMatch && !layerIdMatch && !layerTitleMatch && !subtaskMatch) {
        return false
      }
    }

    return true
  })
}

/**
 * Sorts milestones according to specified sort option.
 */
export function sortGoals(milestones: Milestone[], sortBy: GoalSortOption): Milestone[] {
  if (!Array.isArray(milestones)) return []
  const cloned = [...milestones]

  switch (sortBy) {
    case 'week-asc':
      return cloned.sort((a, b) => a.week - b.week || a.title.localeCompare(b.title))

    case 'week-desc':
      return cloned.sort((a, b) => b.week - a.week || a.title.localeCompare(b.title))

    case 'status':
      // Pending first so items needing work appear at the top, completed at bottom
      return cloned.sort((a, b) => {
        if (a.status === b.status) return a.week - b.week || a.title.localeCompare(b.title)
        return a.status === 'pending' ? -1 : 1
      })

    case 'title':
      return cloned.sort((a, b) => a.title.localeCompare(b.title))

    case 'layer':
      return cloned.sort((a, b) => {
        const layerCompare = a.layer.localeCompare(b.layer)
        if (layerCompare !== 0) return layerCompare
        return a.week - b.week || a.title.localeCompare(b.title)
      })

    default:
      return cloned
  }
}

/**
 * Toggles milestone status and synchronizes overall progress tracking.
 */
export function toggleMilestoneStatusInRoadmap(roadmap: Roadmap, milestoneId: string): Roadmap {
  const updatedMilestones = roadmap.milestones.map((m) => {
    if (m.id !== milestoneId) return m

    const newStatus: 'pending' | 'completed' = m.status === 'completed' ? 'pending' : 'completed'
    const currentSubtasks = m.subtasks && m.subtasks.length > 0 ? m.subtasks : getDefaultSubtasksForMilestone(m)
    
    // When marking completed, set all subtasks completed
    // When marking pending from completed, reset all subtasks to pending
    const updatedSubtasks = currentSubtasks.map((st) => ({
      ...st,
      completed: newStatus === 'completed',
    }))

    return {
      ...m,
      status: newStatus,
      subtasks: updatedSubtasks,
    }
  })

  const completedCount = updatedMilestones.filter((m) => m.status === 'completed').length
  const totalCount = updatedMilestones.length
  const overallPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return {
    ...roadmap,
    milestones: updatedMilestones,
    progressTracking: {
      ...roadmap.progressTracking,
      completedMilestones: completedCount,
      totalMilestones: totalCount,
      overallProgressPercent: overallPercent,
    },
  }
}

/**
 * Toggles an individual subtask's completion status.
 * If all subtasks become completed, milestone is marked 'completed'.
 * If any subtask is unchecked while milestone was 'completed', milestone becomes 'pending'.
 */
export function toggleSubtaskInRoadmap(
  roadmap: Roadmap,
  milestoneId: string,
  subtaskId: string
): Roadmap {
  const updatedMilestones = roadmap.milestones.map((m) => {
    if (m.id !== milestoneId) return m

    const currentSubtasks = m.subtasks && m.subtasks.length > 0 ? m.subtasks : getDefaultSubtasksForMilestone(m)
    const updatedSubtasks = currentSubtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    )

    const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.completed)
    let newStatus: 'pending' | 'completed' = m.status

    if (allCompleted) {
      newStatus = 'completed'
    } else if (m.status === 'completed') {
      newStatus = 'pending'
    }

    return {
      ...m,
      status: newStatus,
      subtasks: updatedSubtasks,
    }
  })

  const completedCount = updatedMilestones.filter((m) => m.status === 'completed').length
  const totalCount = updatedMilestones.length
  const overallPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return {
    ...roadmap,
    milestones: updatedMilestones,
    progressTracking: {
      ...roadmap.progressTracking,
      completedMilestones: completedCount,
      totalMilestones: totalCount,
      overallProgressPercent: overallPercent,
    },
  }
}

/**
 * Formats a user-friendly layer title.
 */
export function getLayerDisplayName(layerId: string, layers?: Layer[]): string {
  if (layers) {
    const matched = layers.find((l) => l.id.toLowerCase() === layerId.toLowerCase())
    if (matched) return matched.title
  }

  const fallbackMap: Record<string, string> = {
    layer1: 'Phase 1: Core Backend',
    layer2: 'Phase 2: Low-Level Design (LLD)',
    layer3: 'Phase 3: Applied AI Engineering',
    layer4: 'Phase 4: Distributed Data Systems',
    layer5: 'Phase 5: High-Level System Design',
    layer6: 'Phase 6: Forward Deployed Engineering',
    layer7: 'Phase 7: Data Structures & Algorithms',
    capstone: 'Capstone Project',
    career: 'Career Transition',
    community: 'Alumni & Community',
  }

  return fallbackMap[layerId] || layerId.toUpperCase()
}

/**
 * Extracts all unique layers from milestones with counts and friendly labels.
 */
export function getAvailableLayers(
  milestones: Milestone[],
  layers?: Layer[]
): Array<{ id: string; label: string; count: number }> {
  if (!Array.isArray(milestones)) return []

  const counts = new Map<string, number>()
  for (const m of milestones) {
    const id = m.layer
    counts.set(id, (counts.get(id) || 0) + 1)
  }

  const result: Array<{ id: string; label: string; count: number }> = []
  counts.forEach((count, id) => {
    result.push({
      id,
      label: getLayerDisplayName(id, layers),
      count,
    })
  })

  return result.sort((a, b) => a.id.localeCompare(b.id))
}
