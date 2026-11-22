import test from 'node:test'
import assert from 'node:assert/strict'
import { searchRoadmap } from '../src/lib/search'
import { getDefaultRoadmap } from '../src/lib/storage'
import type { Roadmap } from '../src/lib/types'

test('searchRoadmap returns empty array for empty or whitespace-only queries', () => {
  const roadmap = getDefaultRoadmap()

  assert.deepEqual(searchRoadmap(roadmap, ''), [])
  assert.deepEqual(searchRoadmap(roadmap, '   '), [])
  assert.deepEqual(searchRoadmap(roadmap, '\t\n'), [])
})

test('searchRoadmap finds layers matching title and description', () => {
  const roadmap = getDefaultRoadmap()

  // Search by keyword present in layer titles ("Backend" or "Architecture")
  const results = searchRoadmap(roadmap, 'Backend')
  assert.ok(results.length > 0, 'Should find results for Backend')

  const layerResult = results.find((r) => r.type === 'layer')
  assert.ok(layerResult, 'Should contain a layer type result')
  assert.equal(layerResult.targetTab, 'layers')
  assert.ok(layerResult.targetLayerId)
  assert.ok(layerResult.title.toLowerCase().includes('backend'))
})

test('searchRoadmap finds modules and specific topics', () => {
  const roadmap = getDefaultRoadmap()

  // Search for Docker or Kubernetes (common backend topics)
  const results = searchRoadmap(roadmap, 'Docker')
  assert.ok(results.length > 0, 'Should find topics matching Docker')

  const moduleResult = results.find((r) => r.type === 'module')
  assert.ok(moduleResult, 'Should find at least one module')
  assert.equal(moduleResult.targetTab, 'layers')
  assert.ok(moduleResult.targetLayerId)
  assert.ok(moduleResult.subtitle.toLowerCase().includes('docker') || moduleResult.title.toLowerCase().includes('docker'))
})

test('searchRoadmap finds milestones and maps to milestones tab', () => {
  const roadmap = getDefaultRoadmap()

  const firstMilestone = roadmap.milestones[0]
  assert.ok(firstMilestone, 'Should have milestones')

  const results = searchRoadmap(roadmap, firstMilestone.title.slice(0, 8))
  assert.ok(results.length > 0)

  const msResult = results.find((r) => r.type === 'milestone')
  assert.ok(msResult, 'Should find milestone result')
  assert.equal(msResult.targetTab, 'milestones')
  assert.equal(msResult.targetMilestoneId, firstMilestone.id)
})

test('searchRoadmap finds projects by skills and standout features', () => {
  const roadmap = getDefaultRoadmap()

  const firstProject = roadmap.projects[0]
  assert.ok(firstProject, 'Should have projects')

  // Search for project title
  const titleResults = searchRoadmap(roadmap, firstProject.title)
  assert.ok(titleResults.length > 0)
  const projResult = titleResults.find((r) => r.type === 'project')
  assert.ok(projResult)
  assert.equal(projResult.targetTab, 'projects')
  assert.equal(projResult.targetProjectId, firstProject.id)

  // Search by skill
  if (firstProject.skills.length > 0) {
    const skill = firstProject.skills[0]
    const skillResults = searchRoadmap(roadmap, skill)
    assert.ok(skillResults.some((r) => r.type === 'project'))
  }
})

test('searchRoadmap supports type filtering', () => {
  const roadmap = getDefaultRoadmap()

  // Filter only layers
  const onlyLayers = searchRoadmap(roadmap, 'AI', { filterType: 'layer' })
  assert.ok(onlyLayers.every((r) => r.type === 'layer'))

  // Filter only milestones
  const onlyMilestones = searchRoadmap(roadmap, 'AI', { filterType: 'milestone' })
  assert.ok(onlyMilestones.every((r) => r.type === 'milestone'))

  // Filter only projects
  const onlyProjects = searchRoadmap(roadmap, 'AI', { filterType: 'project' })
  assert.ok(onlyProjects.every((r) => r.type === 'project'))

  // Filter only modules
  const onlyModules = searchRoadmap(roadmap, 'AI', { filterType: 'module' })
  assert.ok(onlyModules.every((r) => r.type === 'module'))
})

test('searchRoadmap ranks exact and title matches higher than fuzzy description matches', () => {
  const customRoadmap: Roadmap = {
    ...getDefaultRoadmap(),
    layers: [
      {
        id: 'layer-desc',
        title: 'Random Subject',
        description: 'Contains Python programming deep in the description',
        status: 'pending',
        estimatedWeeks: 4,
      },
      {
        id: 'layer-title',
        title: 'Python Mastery',
        description: 'Covers syntax and basic scripting',
        status: 'pending',
        estimatedWeeks: 4,
      },
    ],
    milestones: [],
    projects: [],
  }

  const results = searchRoadmap(customRoadmap, 'Python')
  assert.ok(results.length >= 2)
  assert.equal(results[0].title, 'Python Mastery', 'Title match should rank before description match')
  assert.ok(results[0].score > results[1].score)
})

test('searchRoadmap respects the limit option', () => {
  const roadmap = getDefaultRoadmap()
  const limitedResults = searchRoadmap(roadmap, 'a', { limit: 5 })
  assert.ok(limitedResults.length <= 5)
})
