import test from 'node:test'
import assert from 'node:assert/strict'
import {
  computeGoalStats,
  filterGoals,
  sortGoals,
  getDefaultSubtasksForMilestone,
  ensureMilestoneSubtasks,
  toggleMilestoneStatusInRoadmap,
  toggleSubtaskInRoadmap,
  getLayerDisplayName,
  getAvailableLayers,
  DEFAULT_MILESTONE_SUBTASKS,
} from '../src/lib/goals'
import {
  getDefaultRoadmap,
  validateRoadmap,
  serializeTrip,
  parseAndValidateTripJson,
} from '../src/lib/storage'
import type { Milestone, Roadmap } from '../src/lib/types'

// ----------------------------------------------------------------------
// 1. Goal Viewer Filter Engine Tests
// ----------------------------------------------------------------------

test('filterGoals correctly filters by status (all, completed, pending)', () => {
  const milestones: Milestone[] = [
    { id: 'm1', title: 'Setup', description: 'desc1', layer: 'layer1', status: 'completed', week: 1 },
    { id: 'm2', title: 'API Live', description: 'desc2', layer: 'layer1', status: 'pending', week: 6 },
    { id: 'm3', title: 'LLD Design', description: 'desc3', layer: 'layer2', status: 'completed', week: 10 },
    { id: 'm4', title: 'RAG Pipeline', description: 'desc4', layer: 'layer3', status: 'pending', week: 15 },
  ]

  // All
  const allResults = filterGoals(milestones, { status: 'all' })
  assert.equal(allResults.length, 4)

  // Completed
  const completedResults = filterGoals(milestones, { status: 'completed' })
  assert.equal(completedResults.length, 2)
  assert.deepEqual(completedResults.map((m) => m.id), ['m1', 'm3'])
  assert.ok(completedResults.every((m) => m.status === 'completed'))

  // Pending
  const pendingResults = filterGoals(milestones, { status: 'pending' })
  assert.equal(pendingResults.length, 2)
  assert.deepEqual(pendingResults.map((m) => m.id), ['m2', 'm4'])
  assert.ok(pendingResults.every((m) => m.status === 'pending'))
})

test('filterGoals correctly filters by layer ID', () => {
  const milestones: Milestone[] = [
    { id: 'm1', title: 'Track Setup', description: 'desc', layer: 'layer1', status: 'pending', week: 1 },
    { id: 'm2', title: 'API Capstone', description: 'desc', layer: 'layer1', status: 'completed', week: 6 },
    { id: 'm3', title: 'LLD Spec', description: 'desc', layer: 'layer2', status: 'pending', week: 10 },
    { id: 'm4', title: 'Portfolio', description: 'desc', layer: 'capstone', status: 'pending', week: 24 },
  ]

  // All layers
  assert.equal(filterGoals(milestones, { layer: 'all' }).length, 4)

  // Specific layer1
  const layer1Goals = filterGoals(milestones, { layer: 'layer1' })
  assert.equal(layer1Goals.length, 2)
  assert.deepEqual(layer1Goals.map((m) => m.id), ['m1', 'm2'])

  // Specific capstone layer (case-insensitive)
  const capstoneGoals = filterGoals(milestones, { layer: 'CAPSTONE' })
  assert.equal(capstoneGoals.length, 1)
  assert.equal(capstoneGoals[0].id, 'm4')

  // Non-matching layer
  const emptyGoals = filterGoals(milestones, { layer: 'nonexistent-layer' })
  assert.equal(emptyGoals.length, 0)
})

test('filterGoals correctly searches by query across title, description, layer, and subtasks', () => {
  const milestones: Milestone[] = [
    {
      id: 'm1',
      title: 'Track Selection & Environment Setup',
      description: 'Choose Java/Node.js/Python/Rust track. Set up IDE with Copilot.',
      layer: 'layer1',
      status: 'pending',
      week: 1,
      subtasks: [
        { id: 'st1', title: 'Configure editor and Docker environment', completed: false },
      ],
    },
    {
      id: 'm2',
      title: 'First Production-Grade API Live',
      description: 'Deploy REST API with JWT authentication and Postgres.',
      layer: 'layer1',
      status: 'completed',
      week: 6,
      subtasks: [
        { id: 'st2', title: 'Deploy container to AWS', completed: true },
      ],
    },
    {
      id: 'm3',
      title: 'Production RAG System Shipped',
      description: 'Build RAG pipeline with hybrid search and vector index.',
      layer: 'layer3',
      status: 'pending',
      week: 15,
      subtasks: [
        { id: 'st3', title: 'Benchmarking latency and TruLens evals', completed: false },
      ],
    },
  ]

  // Empty / whitespace search query returns all
  assert.equal(filterGoals(milestones, { query: '' }).length, 3)
  assert.equal(filterGoals(milestones, { query: '   ' }).length, 3)

  // Title match
  const ragSearch = filterGoals(milestones, { query: 'RAG' })
  assert.equal(ragSearch.length, 1)
  assert.equal(ragSearch[0].id, 'm3')

  // Description match
  const jwtSearch = filterGoals(milestones, { query: 'JWT authentication' })
  assert.equal(jwtSearch.length, 1)
  assert.equal(jwtSearch[0].id, 'm2')

  // Layer ID match
  const layer3Search = filterGoals(milestones, { query: 'layer3' })
  assert.equal(layer3Search.length, 1)
  assert.equal(layer3Search[0].id, 'm3')

  // Subtask title match
  const dockerSearch = filterGoals(milestones, { query: 'Docker' })
  assert.equal(dockerSearch.length, 1)
  assert.equal(dockerSearch[0].id, 'm1')

  // Case insensitivity
  const lowercaseSearch = filterGoals(milestones, { query: 'environment setup' })
  assert.equal(lowercaseSearch.length, 1)
  assert.equal(lowercaseSearch[0].id, 'm1')

  // Search with no matches
  const noMatches = filterGoals(milestones, { query: 'xyz-no-such-term-exists' })
  assert.equal(noMatches.length, 0)
})

test('filterGoals matches layer friendly titles when layers list is provided', () => {
  const defaultRoadmap = getDefaultRoadmap()
  const milestones = defaultRoadmap.milestones

  // Search for "Applied AI" (which is in Phase 3 layer title)
  const results = filterGoals(milestones, { query: 'Applied AI' }, defaultRoadmap.layers)
  assert.ok(results.length > 0)
  assert.ok(results.some((m) => m.layer === 'layer3'))
})

test('filterGoals correctly combines status, layer, and search query filters simultaneously', () => {
  const milestones: Milestone[] = [
    { id: 'm1', title: 'Track Setup', description: 'desc', layer: 'layer1', status: 'completed', week: 1 },
    { id: 'm2', title: 'First API Live', description: 'REST API', layer: 'layer1', status: 'pending', week: 6 },
    { id: 'm3', title: 'Second API Gateway', description: 'REST API Gateway', layer: 'layer1', status: 'completed', week: 8 },
    { id: 'm4', title: 'Third API Capstone', description: 'REST API', layer: 'layer2', status: 'pending', week: 10 },
  ]

  // Filter: layer1 + status: pending + query: 'API'
  const filtered = filterGoals(milestones, {
    status: 'pending',
    layer: 'layer1',
    query: 'API',
  })

  assert.equal(filtered.length, 1)
  assert.equal(filtered[0].id, 'm2')
})

// ----------------------------------------------------------------------
// 2. Goal Viewer Sort Engine Tests
// ----------------------------------------------------------------------

test('sortGoals correctly sorts by week ascending and descending', () => {
  const milestones: Milestone[] = [
    { id: 'm3', title: 'Week 10 Goal', description: 'desc', layer: 'layer2', status: 'pending', week: 10 },
    { id: 'm1', title: 'Week 1 Goal', description: 'desc', layer: 'layer1', status: 'pending', week: 1 },
    { id: 'm4', title: 'Week 24 Goal', description: 'desc', layer: 'layer5', status: 'completed', week: 24 },
    { id: 'm2', title: 'Week 6 Goal', description: 'desc', layer: 'layer1', status: 'completed', week: 6 },
  ]

  // Ascending
  const asc = sortGoals(milestones, 'week-asc')
  assert.deepEqual(asc.map((m) => m.week), [1, 6, 10, 24])

  // Descending
  const desc = sortGoals(milestones, 'week-desc')
  assert.deepEqual(desc.map((m) => m.week), [24, 10, 6, 1])
})

test('sortGoals correctly sorts by status (pending first, completed last)', () => {
  const milestones: Milestone[] = [
    { id: 'm1', title: 'Done 1', description: 'desc', layer: 'layer1', status: 'completed', week: 1 },
    { id: 'm2', title: 'Pending 1', description: 'desc', layer: 'layer1', status: 'pending', week: 6 },
    { id: 'm3', title: 'Done 2', description: 'desc', layer: 'layer2', status: 'completed', week: 10 },
    { id: 'm4', title: 'Pending 2', description: 'desc', layer: 'layer3', status: 'pending', week: 15 },
  ]

  const sorted = sortGoals(milestones, 'status')
  assert.equal(sorted[0].status, 'pending')
  assert.equal(sorted[1].status, 'pending')
  assert.equal(sorted[2].status, 'completed')
  assert.equal(sorted[3].status, 'completed')
})

test('sortGoals correctly sorts by title alphabetically', () => {
  const milestones: Milestone[] = [
    { id: 'm1', title: 'Zoo Management API', description: 'desc', layer: 'layer1', status: 'pending', week: 1 },
    { id: 'm2', title: 'Alpha Milestone', description: 'desc', layer: 'layer1', status: 'pending', week: 6 },
    { id: 'm3', title: 'Beta Milestone', description: 'desc', layer: 'layer2', status: 'pending', week: 10 },
  ]

  const sorted = sortGoals(milestones, 'title')
  assert.deepEqual(sorted.map((m) => m.title), [
    'Alpha Milestone',
    'Beta Milestone',
    'Zoo Management API',
  ])
})

test('sortGoals correctly sorts by layer', () => {
  const milestones: Milestone[] = [
    { id: 'm1', title: 'Milestone C', description: 'desc', layer: 'layer3', status: 'pending', week: 15 },
    { id: 'm2', title: 'Milestone A', description: 'desc', layer: 'layer1', status: 'pending', week: 1 },
    { id: 'm3', title: 'Milestone B', description: 'desc', layer: 'layer2', status: 'pending', week: 10 },
  ]

  const sorted = sortGoals(milestones, 'layer')
  assert.deepEqual(sorted.map((m) => m.layer), ['layer1', 'layer2', 'layer3'])
})

// ----------------------------------------------------------------------
// 3. Goal Stats Banner & Progress Computation Tests
// ----------------------------------------------------------------------

test('computeGoalStats computes correct total, completed, pending, and percent', () => {
  const milestones: Milestone[] = [
    { id: 'm1', title: 'M1', description: '', layer: 'layer1', status: 'completed', week: 1 },
    { id: 'm2', title: 'M2', description: '', layer: 'layer1', status: 'completed', week: 2 },
    { id: 'm3', title: 'M3', description: '', layer: 'layer2', status: 'pending', week: 3 },
    { id: 'm4', title: 'M4', description: '', layer: 'layer2', status: 'pending', week: 4 },
  ]

  const stats = computeGoalStats(milestones)
  assert.equal(stats.total, 4)
  assert.equal(stats.completed, 2)
  assert.equal(stats.pending, 2)
  assert.equal(stats.percent, 50)
})

test('computeGoalStats defends strictly against empty or non-array inputs without division by zero', () => {
  const emptyStats = computeGoalStats([])
  assert.equal(emptyStats.total, 0)
  assert.equal(emptyStats.completed, 0)
  assert.equal(emptyStats.pending, 0)
  assert.equal(emptyStats.percent, 0)
  assert.equal(emptyStats.totalSubtasks, 0)
  assert.equal(emptyStats.completedSubtasks, 0)
  assert.equal(emptyStats.subtasksPercent, 0)

  const nonArrayStats = computeGoalStats(null as unknown as Milestone[])
  assert.equal(nonArrayStats.total, 0)
  assert.equal(nonArrayStats.percent, 0)
})

test('computeGoalStats calculates 100% when all goals are completed', () => {
  const milestones: Milestone[] = [
    { id: 'm1', title: 'M1', description: '', layer: 'layer1', status: 'completed', week: 1 },
    { id: 'm2', title: 'M2', description: '', layer: 'layer2', status: 'completed', week: 2 },
  ]
  const stats = computeGoalStats(milestones)
  assert.equal(stats.completed, 2)
  assert.equal(stats.pending, 0)
  assert.equal(stats.percent, 100)
})

test('computeGoalStats computes accurate aggregate subtasks metrics', () => {
  const milestones: Milestone[] = [
    {
      id: 'm1',
      title: 'M1',
      description: '',
      layer: 'layer1',
      status: 'pending',
      week: 1,
      subtasks: [
        { id: 'st1', title: 'Task 1', completed: true },
        { id: 'st2', title: 'Task 2', completed: false },
      ],
    },
    {
      id: 'm2',
      title: 'M2',
      description: '',
      layer: 'layer2',
      status: 'completed',
      week: 2,
      subtasks: [
        { id: 'st3', title: 'Task 3', completed: true },
        { id: 'st4', title: 'Task 4', completed: true },
      ],
    },
  ]

  const stats = computeGoalStats(milestones)
  assert.equal(stats.totalSubtasks, 4)
  assert.equal(stats.completedSubtasks, 3)
  assert.equal(stats.subtasksPercent, 75)
})

// ----------------------------------------------------------------------
// 4. Subtasks & Milestone Status Toggle Engine Tests
// ----------------------------------------------------------------------

test('ensureMilestoneSubtasks attaches default deliverables if milestone lacks them', () => {
  const bareMilestone: Milestone = {
    id: 'milestone1',
    title: 'Track Selection & Environment Setup',
    description: 'desc',
    layer: 'layer1',
    status: 'pending',
    week: 1,
  }

  const hydrated = ensureMilestoneSubtasks(bareMilestone)
  assert.ok(Array.isArray(hydrated.subtasks))
  assert.ok(hydrated.subtasks.length >= 4)
  assert.equal(hydrated.subtasks[0].id, 'st1-1')
  assert.equal(hydrated.subtasks[0].completed, false)
})

test('getDefaultSubtasksForMilestone provides curated deliverables for all 12 milestones', () => {
  for (let i = 1; i <= 12; i++) {
    const id = `milestone${i}`
    assert.ok(DEFAULT_MILESTONE_SUBTASKS[id], `Missing deliverables for ${id}`)
    assert.ok(DEFAULT_MILESTONE_SUBTASKS[id].length >= 3, `${id} should have at least 3 subtasks`)
  }
})

test('toggleMilestoneStatusInRoadmap inverts milestone status and synchronizes subtasks and progress', () => {
  const initialRoadmap = getDefaultRoadmap()
  const milestoneId = 'milestone1'
  assert.equal(initialRoadmap.milestones.find((m) => m.id === milestoneId)?.status, 'pending')

  // Toggle milestone1 to completed
  const updatedRoadmap = toggleMilestoneStatusInRoadmap(initialRoadmap, milestoneId)
  const targetMilestone = updatedRoadmap.milestones.find((m) => m.id === milestoneId)
  assert.equal(targetMilestone?.status, 'completed')

  // Verify all subtasks marked completed
  assert.ok(targetMilestone?.subtasks && targetMilestone.subtasks.length > 0)
  assert.ok(targetMilestone?.subtasks?.every((st) => st.completed === true))

  // Verify progress tracking is recalculated
  assert.equal(
    updatedRoadmap.progressTracking.completedMilestones,
    initialRoadmap.progressTracking.completedMilestones + 1
  )
  assert.ok(updatedRoadmap.progressTracking.overallProgressPercent > 0)

  // Toggle back to pending
  const revertedRoadmap = toggleMilestoneStatusInRoadmap(updatedRoadmap, milestoneId)
  const revertedMilestone = revertedRoadmap.milestones.find((m) => m.id === milestoneId)
  assert.equal(revertedMilestone?.status, 'pending')
  assert.ok(revertedMilestone?.subtasks?.every((st) => st.completed === false))
  assert.equal(
    revertedRoadmap.progressTracking.completedMilestones,
    initialRoadmap.progressTracking.completedMilestones
  )
})

test('toggleSubtaskInRoadmap toggles individual subtask and auto-completes milestone when all subtasks done', () => {
  const initialRoadmap = getDefaultRoadmap()
  const milestoneId = 'milestone1'
  const targetSubtaskId = 'st1-1'

  // Toggle first subtask
  const step1 = toggleSubtaskInRoadmap(initialRoadmap, milestoneId, targetSubtaskId)
  const mStep1 = step1.milestones.find((m) => m.id === milestoneId)
  assert.equal(mStep1?.status, 'pending', 'Milestone should remain pending with only 1 subtask completed')
  assert.equal(mStep1?.subtasks?.find((st) => st.id === targetSubtaskId)?.completed, true)

  // Toggle remaining subtasks for milestone1
  let currentRoadmap = step1
  const subtasks = mStep1?.subtasks || []
  for (let i = 1; i < subtasks.length; i++) {
    currentRoadmap = toggleSubtaskInRoadmap(currentRoadmap, milestoneId, subtasks[i].id)
  }

  // Now all subtasks are complete: milestone should automatically be marked completed!
  const finalMilestone = currentRoadmap.milestones.find((m) => m.id === milestoneId)
  assert.equal(finalMilestone?.status, 'completed', 'Milestone should auto-complete when all subtasks are checked')
  assert.equal(
    currentRoadmap.progressTracking.completedMilestones,
    initialRoadmap.progressTracking.completedMilestones + 1
  )

  // Now uncheck one subtask from the completed milestone: status should revert to pending!
  const uncheckStep = toggleSubtaskInRoadmap(currentRoadmap, milestoneId, targetSubtaskId)
  const uncheckedMilestone = uncheckStep.milestones.find((m) => m.id === milestoneId)
  assert.equal(uncheckedMilestone?.status, 'pending', 'Milestone should revert to pending when a deliverable is unchecked')
})

// ----------------------------------------------------------------------
// 5. Layer Helper & Metadata Tests
// ----------------------------------------------------------------------

test('getLayerDisplayName returns friendly titles for all phases', () => {
  assert.equal(getLayerDisplayName('layer1'), 'Phase 1: Core Backend')
  assert.equal(getLayerDisplayName('layer2'), 'Phase 2: Low-Level Design (LLD)')
  assert.equal(getLayerDisplayName('capstone'), 'Capstone Project')
  assert.equal(getLayerDisplayName('career'), 'Career Transition')
  assert.equal(getLayerDisplayName('community'), 'Alumni & Community')
})

test('getAvailableLayers extracts unique layers with counts', () => {
  const defaultRoadmap = getDefaultRoadmap()
  const layers = getAvailableLayers(defaultRoadmap.milestones, defaultRoadmap.layers)
  assert.ok(layers.length >= 7)

  const layer1Entry = layers.find((l) => l.id === 'layer1')
  assert.ok(layer1Entry)
  assert.equal(layer1Entry?.count, 2)
  assert.ok(layer1Entry?.label.includes('Phase 1'))
})

// ----------------------------------------------------------------------
// 6. Persistence & Schema Validation Round-Trip Tests
// ----------------------------------------------------------------------

test('serializeTrip and parseAndValidateTripJson preserve subtasks through round-trip serialization', () => {
  const roadmap = getDefaultRoadmap()
  // Complete a subtask
  const modifiedRoadmap = toggleSubtaskInRoadmap(roadmap, 'milestone1', 'st1-1')

  const serialized = serializeTrip(modifiedRoadmap)
  const parsed = parseAndValidateTripJson(serialized)

  assert.equal(parsed.valid, true)
  assert.equal(parsed.errors.length, 0)
  assert.ok(parsed.data)

  const parsedMilestone = parsed.data?.milestones.find((m) => m.id === 'milestone1')
  assert.ok(parsedMilestone?.subtasks)
  assert.equal(parsedMilestone?.subtasks?.length, 4)
  assert.equal(parsedMilestone?.subtasks?.[0].completed, true)
})

test('validateRoadmap rejects corrupted subtask schema', () => {
  const roadmap = getDefaultRoadmap()
  const corruptedRoadmap: Roadmap = {
    ...roadmap,
    milestones: [
      {
        id: 'm1',
        title: 'M1',
        description: 'desc',
        layer: 'layer1',
        status: 'pending',
        week: 1,
        subtasks: [
          {
            id: '', // Empty id is invalid
            title: 'Task',
            completed: true,
          },
        ],
      },
    ],
  }

  const result = validateRoadmap(corruptedRoadmap)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('subtasks[0].id')))
})
