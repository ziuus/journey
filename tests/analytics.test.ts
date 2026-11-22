import test from 'node:test'
import assert from 'node:assert/strict'
import {
  safeDivide,
  safePercentage,
  safeNonNegativeInt,
  parseDurationWeeks,
  getLayerModules,
  getLayerProgress,
  getPhaseBreakdown,
  calculateVelocity,
  categorizeSkill,
  getSkillCoverage,
  getTechnologyDistribution,
  getTrackBreakdown,
  getAnalyticsSummary,
} from '../src/lib/analytics'
import { getDefaultRoadmap } from '../src/lib/storage'
import type { Roadmap, Layer } from '../src/lib/types'

// ----------------------------------------------------------------------
// 1. Strict Defensive Math Helpers
// ----------------------------------------------------------------------

test('safeDivide defends strictly against zero, negative, NaN, and non-numeric values', () => {
  // Normal division
  assert.equal(safeDivide(10, 2), 5)
  assert.equal(safeDivide(7, 2), 3.5)

  // Division by zero
  assert.equal(safeDivide(10, 0), 0)
  assert.equal(safeDivide(0, 0), 0)

  // Negative values
  assert.equal(safeDivide(-10, 2), 0)
  assert.equal(safeDivide(10, -2), 0)
  assert.equal(safeDivide(-10, -2), 0)

  // Numerator is zero
  assert.equal(safeDivide(0, 10), 0)

  // Non-finite values
  assert.equal(safeDivide(NaN, 5), 0)
  assert.equal(safeDivide(5, NaN), 0)
  assert.equal(safeDivide(Infinity, 5), 0)
  assert.equal(safeDivide(5, Infinity), 0)
  assert.equal(safeDivide(-Infinity, 5), 0)

  // Non-numeric inputs
  assert.equal(safeDivide('10' as unknown as number, 2), 0)
  assert.equal(safeDivide(10, '2' as unknown as number), 0)
  assert.equal(safeDivide(null as unknown as number, 5), 0)
  assert.equal(safeDivide(undefined as unknown as number, 5), 0)
})

test('safePercentage strictly clamps results between 0 and 100 with division-by-zero defense', () => {
  // Normal percentages
  assert.equal(safePercentage(5, 10), 50)
  assert.equal(safePercentage(10, 10), 100)
  assert.equal(safePercentage(0, 10), 0)

  // Rounding vs raw float
  assert.equal(safePercentage(1, 3, true), 33)
  assert.equal(safePercentage(1, 3, false), 33.33)

  // Division by zero denominator
  assert.equal(safePercentage(5, 0), 0)
  assert.equal(safePercentage(0, 0), 0)

  // Clamping: completed > total
  assert.equal(safePercentage(15, 10), 100)
  assert.equal(safePercentage(200, 100), 100)

  // Negative values
  assert.equal(safePercentage(-5, 10), 0)
  assert.equal(safePercentage(5, -10), 0)
  assert.equal(safePercentage(-5, -10), 0)

  // Non-finite / invalid types
  assert.equal(safePercentage(NaN, 10), 0)
  assert.equal(safePercentage(5, NaN), 0)
  assert.equal(safePercentage(Infinity, 10), 0)
  assert.equal(safePercentage(undefined as unknown as number, 10), 0)
})

test('safeNonNegativeInt returns non-negative integer or safe fallback', () => {
  assert.equal(safeNonNegativeInt(15), 15)
  assert.equal(safeNonNegativeInt(15.9), 15)
  assert.equal(safeNonNegativeInt(0), 0)

  // Negative numbers
  assert.equal(safeNonNegativeInt(-5), 0)
  assert.equal(safeNonNegativeInt(-1.5, 10), 10)

  // Non-numbers and NaN
  assert.equal(safeNonNegativeInt(NaN), 0)
  assert.equal(safeNonNegativeInt(Infinity), 0)
  assert.equal(safeNonNegativeInt('15'), 0)
  assert.equal(safeNonNegativeInt(null), 0)
  assert.equal(safeNonNegativeInt(undefined, 42), 42)
})

test('parseDurationWeeks parses duration string or safely defaults to 24', () => {
  assert.equal(parseDurationWeeks('24 weeks'), 24)
  assert.equal(parseDurationWeeks('12 Weeks'), 12)
  assert.equal(parseDurationWeeks('Program is 6 weeks long'), 6)
  assert.equal(parseDurationWeeks(''), 24)
  assert.equal(parseDurationWeeks(undefined), 24)
  assert.equal(parseDurationWeeks('ongoing', 20), 20)
  assert.equal(parseDurationWeeks('-5 weeks', 24), 24)
})

// ----------------------------------------------------------------------
// 2. Layer & Module Extraction
// ----------------------------------------------------------------------

test('getLayerModules resolves modules from tracks, modules, or sections safely', () => {
  const roadmap = getDefaultRoadmap()

  // Layer 1 has tracks
  const layer1 = roadmap.layers[0]
  const nodeModules = getLayerModules(layer1, 'js-node')
  assert.equal(nodeModules.length, 10)
  assert.equal(nodeModules[0].title, 'Backend Systems & the Node.js Runtime')

  // Layer 1 with java track
  const javaModules = getLayerModules(layer1, 'java-spring')
  assert.equal(javaModules.length, 10)
  assert.equal(javaModules[0].title, 'Backend Systems & the Java Runtime')

  // Layer 2 has direct modules
  const layer2 = roadmap.layers[1]
  const layer2Modules = getLayerModules(layer2)
  assert.equal(layer2Modules.length, 6)

  // Layer 7 has sections (DSA)
  const layer7 = roadmap.layers[6]
  const layer7Modules = getLayerModules(layer7)
  assert.equal(layer7Modules.length, 9)

  // Edge cases: null, undefined, empty layer
  assert.deepEqual(getLayerModules(null), [])
  assert.deepEqual(getLayerModules(undefined), [])
  assert.deepEqual(getLayerModules({ id: 'dummy', title: 'T', description: 'D', status: 'pending', estimatedWeeks: 1 }), [])
})

// ----------------------------------------------------------------------
// 3. Layer Progress Breakdown
// ----------------------------------------------------------------------

test('getLayerProgress computes module and milestone breakdown for all layers', () => {
  const roadmap = getDefaultRoadmap()
  const layers = getLayerProgress(roadmap)

  assert.equal(layers.length, roadmap.layers.length)

  // Test Layer 1 initial pending state
  const l1 = layers[0]
  assert.equal(l1.id, 'layer1')
  assert.equal(l1.totalModules, 10)
  assert.equal(l1.completedModules, 0)
  assert.equal(l1.modulePercent, 0)
  assert.equal(l1.totalMilestones, 2)
  assert.equal(l1.completedMilestones, 0)
  assert.equal(l1.milestonePercent, 0)
  assert.equal(l1.completionPercent, 0)

  // Completed layer scenario
  const completedRoadmap: Roadmap = {
    ...roadmap,
    layers: roadmap.layers.map((l, i) => (i === 0 ? { ...l, status: 'completed' } : l)),
    milestones: roadmap.milestones.map((m) =>
      m.layer === 'layer1' ? { ...m, status: 'completed' } : m
    ),
  }
  const completedProgress = getLayerProgress(completedRoadmap)
  const completedL1 = completedProgress[0]
  assert.equal(completedL1.completedModules, 10)
  assert.equal(completedL1.completedMilestones, 2)
  assert.equal(completedL1.modulePercent, 100)
  assert.equal(completedL1.milestonePercent, 100)
  assert.equal(completedL1.completionPercent, 100)

  // In-progress layer with partial milestone completion
  const partialRoadmap: Roadmap = {
    ...roadmap,
    layers: roadmap.layers.map((l, i) => (i === 0 ? { ...l, status: 'in-progress' } : l)),
    milestones: roadmap.milestones.map((m, i) =>
      m.id === 'milestone1' ? { ...m, status: 'completed' } : m
    ),
  }
  const partialProgress = getLayerProgress(partialRoadmap)
  const partialL1 = partialProgress[0]
  assert.equal(partialL1.completedMilestones, 1)
  assert.equal(partialL1.totalMilestones, 2)
  assert.equal(partialL1.milestonePercent, 50)
  assert.equal(partialL1.completedModules, 5) // 50% of 10 modules
  assert.equal(partialL1.modulePercent, 50)
  assert.equal(partialL1.completionPercent, 50)

  // Null/empty input defense
  assert.deepEqual(getLayerProgress(null), [])
  assert.deepEqual(getLayerProgress(undefined), [])
  assert.deepEqual(getLayerProgress({} as unknown as Roadmap), [])
})

// ----------------------------------------------------------------------
// 4. Phase-by-Phase Completion Breakdown
// ----------------------------------------------------------------------

test('getPhaseBreakdown maps timeline phases and aggregates constituent layers', () => {
  const roadmap = getDefaultRoadmap()
  const phases = getPhaseBreakdown(roadmap)

  assert.equal(phases.length, 5)

  // Phase 1: Foundation (Weeks 1-6) -> layer1
  const p1 = phases[0]
  assert.equal(p1.id, 'phase1')
  assert.equal(p1.name, 'Foundation (Weeks 1-6)')
  assert.deepEqual(p1.layers, ['layer1'])
  assert.equal(p1.totalModules, 10)
  assert.equal(p1.completedModules, 0)
  assert.equal(p1.percentage, 0)
  assert.equal(p1.status, 'pending')

  // Phase 5: Architecture & Operations -> layer5 (8 modules) and layer6 (4 modules)
  const p5 = phases[4]
  assert.equal(p5.id, 'phase5')
  assert.deepEqual(p5.layers, ['layer5', 'layer6'])
  assert.equal(p5.totalModules, 12) // 8 + 4

  // Mark all milestones in layer1 as completed
  const modifiedRoadmap: Roadmap = {
    ...roadmap,
    layers: roadmap.layers.map((l) => (l.id === 'layer1' ? { ...l, status: 'completed' } : l)),
    milestones: roadmap.milestones.map((m) =>
      m.layer === 'layer1' ? { ...m, status: 'completed' } : m
    ),
  }
  const updatedPhases = getPhaseBreakdown(modifiedRoadmap)
  assert.equal(updatedPhases[0].completedModules, 10)
  assert.equal(updatedPhases[0].completedMilestones, 2)
  assert.equal(updatedPhases[0].percentage, 100)
  assert.equal(updatedPhases[0].status, 'completed')

  // Test fallback when timelinePhases is empty or missing
  const noTimelineRoadmap: Roadmap = {
    ...roadmap,
    timelinePhases: [],
  }
  const fallbackPhases = getPhaseBreakdown(noTimelineRoadmap)
  assert.equal(fallbackPhases.length, roadmap.layers.length)

  // Null input defense
  assert.deepEqual(getPhaseBreakdown(null), [])
})

// ----------------------------------------------------------------------
// 5. Learning Velocity & Pace Forecast
// ----------------------------------------------------------------------

test('calculateVelocity accurately calculates pace, forecasts completion, and defends against division by zero', () => {
  const baseRoadmap = getDefaultRoadmap()

  // Scenario 1: Initial state before starting (currentWeek = 0, completedModules = 0)
  const initialVelocity = calculateVelocity(baseRoadmap)
  assert.equal(initialVelocity.currentWeek, 0)
  assert.equal(initialVelocity.modulePace, 0)
  assert.equal(initialVelocity.milestonePace, 0)
  assert.equal(initialVelocity.projectedCompletionWeek, null)
  assert.equal(initialVelocity.weeksRemainingAtCurrentPace, null)
  assert.equal(initialVelocity.status, 'not-started')
  assert.equal(initialVelocity.remainingModules, 57)
  assert.equal(initialVelocity.remainingMilestones, 12)

  // Scenario 2: Active on-pace learning (Week 4, 10 modules completed out of 57)
  const activeRoadmap: Roadmap = {
    ...baseRoadmap,
    progressTracking: {
      ...baseRoadmap.progressTracking,
      currentWeek: 4,
      completedModules: 10,
      totalModules: 57,
      completedMilestones: 2,
    },
  }
  const activeVelocity = calculateVelocity(activeRoadmap)
  assert.equal(activeVelocity.currentWeek, 4)
  assert.equal(activeVelocity.modulePace, 2.5) // 10 / 4 = 2.5
  assert.equal(activeVelocity.milestonePace, 0.5) // 2 / 4 = 0.5
  assert.equal(activeVelocity.remainingModules, 47)
  // 47 remaining / 2.5 pace = 18.8 weeks needed -> ceil = 19 weeks
  // Projected completion = 4 + 19 = 23 <= 24 (ahead by 1 week)
  assert.equal(activeVelocity.weeksRemainingAtCurrentPace, 19)
  assert.equal(activeVelocity.projectedCompletionWeek, 23)
  assert.equal(activeVelocity.status, 'ahead')
  assert.match(activeVelocity.paceStatusDescription, /ahead of target/i)

  // Scenario 3: Behind schedule (Week 10, only 5 modules completed out of 57)
  const slowRoadmap: Roadmap = {
    ...baseRoadmap,
    progressTracking: {
      ...baseRoadmap.progressTracking,
      currentWeek: 10,
      completedModules: 5,
      totalModules: 57,
      completedMilestones: 1,
    },
  }
  const slowVelocity = calculateVelocity(slowRoadmap)
  assert.equal(slowVelocity.modulePace, 0.5) // 5 / 10 = 0.5
  assert.equal(slowVelocity.remainingModules, 52)
  // 52 / 0.5 = 104 weeks needed
  assert.equal(slowVelocity.weeksRemainingAtCurrentPace, 104)
  assert.equal(slowVelocity.projectedCompletionWeek, 114) // 10 + 104
  assert.equal(slowVelocity.status, 'behind')
  assert.match(slowVelocity.paceStatusDescription, /behind target schedule/i)

  // Scenario 4: Fully completed curriculum
  const completedRoadmap: Roadmap = {
    ...baseRoadmap,
    progressTracking: {
      ...baseRoadmap.progressTracking,
      currentWeek: 20,
      completedModules: 57,
      totalModules: 57,
      completedMilestones: 12,
      totalMilestones: 12,
    },
  }
  const doneVelocity = calculateVelocity(completedRoadmap)
  assert.equal(doneVelocity.remainingModules, 0)
  assert.equal(doneVelocity.remainingMilestones, 0)
  assert.equal(doneVelocity.projectedCompletionWeek, 20)
  assert.equal(doneVelocity.weeksRemainingAtCurrentPace, 0)
  assert.equal(doneVelocity.status, 'completed')

  // Scenario 5: Defensive checks on malformed inputs (negative numbers, NaN, null)
  const malformedRoadmap: Roadmap = {
    ...baseRoadmap,
    progressTracking: {
      ...baseRoadmap.progressTracking,
      currentWeek: -5 as unknown as number,
      completedModules: -10 as unknown as number,
      totalModules: NaN as unknown as number,
      completedMilestones: -2 as unknown as number,
    },
  }
  const malformedVelocity = calculateVelocity(malformedRoadmap)
  assert.equal(malformedVelocity.currentWeek, 0)
  assert.equal(malformedVelocity.completedModules, 0)
  assert.equal(malformedVelocity.modulePace, 0)
  assert.equal(malformedVelocity.projectedCompletionWeek, null)
  assert.equal(malformedVelocity.status, 'not-started')

  // Scenario 6: Null and empty object
  const nullVelocity = calculateVelocity(null)
  assert.equal(nullVelocity.modulePace, 0)
  assert.equal(nullVelocity.status, 'not-started')
  assert.equal(nullVelocity.projectedCompletionWeek, null)
})

// ----------------------------------------------------------------------
// 6. Skill Categorization & Coverage Extraction
// ----------------------------------------------------------------------

test('categorizeSkill groups technical skills into appropriate domain areas', () => {
  assert.equal(categorizeSkill('LLM Structured Outputs'), 'AI & LLM Systems')
  assert.equal(categorizeSkill('Multi-Agent Orchestration (LangGraph)'), 'AI & LLM Systems')
  assert.equal(categorizeSkill('RAG Pipeline with Hybrid Search'), 'AI & LLM Systems')
  assert.equal(categorizeSkill('Prompt Injection/PII Guardrails'), 'AI & LLM Systems')

  assert.equal(categorizeSkill('Production REST API Design'), 'Backend & API Architecture')
  assert.equal(categorizeSkill('Request Validation'), 'Backend & API Architecture')
  assert.equal(categorizeSkill('OpenAPI Documentation'), 'Backend & API Architecture')

  assert.equal(categorizeSkill('Double-Entry Ledger Modeling'), 'Data & Storage Engineering')
  assert.equal(categorizeSkill('ACID Transactions'), 'Data & Storage Engineering')
  assert.equal(categorizeSkill('Redis Caching/TTL'), 'Data & Storage Engineering')

  assert.equal(categorizeSkill('Event-Driven Architecture (Kafka)'), 'Distributed Systems & Concurrency')
  assert.equal(categorizeSkill('Pessimistic vs Optimistic Locking'), 'Distributed Systems & Concurrency')
  assert.equal(categorizeSkill('Distributed Rate Limiting'), 'Distributed Systems & Concurrency')

  assert.equal(categorizeSkill('OAuth2 and JWT Auth'), 'Security & Reliability')
  assert.equal(categorizeSkill('Integration Testing & Mocking'), 'Testing & Quality')

  // Fallback for unknown / empty skill
  assert.equal(categorizeSkill('Customer Relationship Building'), 'General Engineering')
  assert.equal(categorizeSkill(''), 'General Engineering')
  assert.equal(categorizeSkill(null as unknown as string), 'General Engineering')
})

test('getSkillCoverage aggregates project skills, counts frequency, and provides category breakdown', () => {
  const roadmap = getDefaultRoadmap()
  const coverage = getSkillCoverage(roadmap)

  assert.ok(coverage.totalSkills > 20, 'Expected more than 20 distinct skills across projects')
  assert.ok(coverage.topSkills.length > 0)
  assert.ok(coverage.categories.length > 0)

  // Verify skills are sorted by frequency descending
  for (let i = 0; i < coverage.topSkills.length - 1; i++) {
    assert.ok(coverage.topSkills[i].count >= coverage.topSkills[i + 1].count)
  }

  // Verify percentage math on each skill
  for (const skill of coverage.topSkills) {
    assert.ok(skill.percentage >= 0 && skill.percentage <= 100)
    assert.ok(typeof skill.category === 'string')
  }

  // Verify categories sum to totalSkills
  const categoryCountSum = coverage.categories.reduce((acc, c) => acc + c.count, 0)
  assert.equal(categoryCountSum, coverage.totalSkills)

  // Edge cases: null, empty projects
  assert.deepEqual(getSkillCoverage(null), { topSkills: [], categories: [], totalSkills: 0 })
  assert.deepEqual(getSkillCoverage({ ...roadmap, projects: [] }), {
    topSkills: [],
    categories: [],
    totalSkills: 0,
  })
})

// ----------------------------------------------------------------------
// 7. Technology Distribution Extraction
// ----------------------------------------------------------------------

test('getTechnologyDistribution analyzes AI and Backend stacks and calculates curriculum prominence', () => {
  const roadmap = getDefaultRoadmap()
  const tech = getTechnologyDistribution(roadmap)

  assert.ok(tech.length > 0)

  // Check presence of key technologies
  const techNames = tech.map((t) => t.name)
  assert.ok(techNames.includes('OpenAI'))
  assert.ok(techNames.includes('Node.js'))
  assert.ok(techNames.includes('Rust'))
  assert.ok(techNames.includes('Redis'))

  // Verify categorizations
  const aiTools = tech.filter((t) => t.category === 'ai')
  const backendTools = tech.filter((t) => t.category === 'backend')
  assert.ok(aiTools.length > 0)
  assert.ok(backendTools.length > 0)

  // Verify frequency is positive non-zero
  for (const item of tech) {
    assert.ok(item.frequency >= 1)
  }

  // Edge cases: null or missing tools
  assert.deepEqual(getTechnologyDistribution(null), [])
  assert.deepEqual(
    getTechnologyDistribution({
      ...roadmap,
      toolsAndTechnologies: { aiToolStack: [], backendStack: [] },
    }),
    []
  )
})

// ----------------------------------------------------------------------
// 8. Track Progress Breakdown
// ----------------------------------------------------------------------

test('getTrackBreakdown lists available tracks and marks the selected track', () => {
  const roadmap = getDefaultRoadmap()
  const tracks = getTrackBreakdown(roadmap)

  assert.equal(tracks.length, 4)
  const trackIds = tracks.map((t) => t.trackId)
  assert.deepEqual(trackIds, ['java-spring', 'js-node', 'python-django', 'rust-axum'])

  // In default roadmap, 'js-node' is selected
  const activeTrack = tracks.find((t) => t.isSelected)
  assert.ok(activeTrack)
  assert.equal(activeTrack?.trackId, 'js-node')
  assert.equal(activeTrack?.totalModules, 10)

  // Null input defense
  assert.deepEqual(getTrackBreakdown(null), [])
})

// ----------------------------------------------------------------------
// 9. Master Analytics Summary
// ----------------------------------------------------------------------

test('getAnalyticsSummary returns consolidated metrics and survives empty or corrupt roadmaps', () => {
  const roadmap = getDefaultRoadmap()
  const summary = getAnalyticsSummary(roadmap)

  assert.ok(summary)
  assert.equal(typeof summary.overallPercent, 'number')
  assert.ok(summary.velocity)
  assert.ok(Array.isArray(summary.phases))
  assert.ok(Array.isArray(summary.layers))
  assert.ok(Array.isArray(summary.skillCategories))
  assert.ok(Array.isArray(summary.topSkills))
  assert.ok(Array.isArray(summary.technologies))
  assert.ok(Array.isArray(summary.tracks))

  // Completely empty roadmap object
  const emptySummary = getAnalyticsSummary({} as unknown as Roadmap)
  assert.ok(emptySummary)
  assert.equal(emptySummary.overallPercent, 0)
  assert.equal(emptySummary.velocity.modulePace, 0)
  assert.equal(emptySummary.phases.length, 0)
  assert.equal(emptySummary.layers.length, 0)

  // Null input
  const nullSummary = getAnalyticsSummary(null)
  assert.ok(nullSummary)
  assert.equal(nullSummary.overallPercent, 0)
  assert.equal(nullSummary.velocity.status, 'not-started')
})
