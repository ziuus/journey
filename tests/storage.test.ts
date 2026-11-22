import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getDefaultRoadmap,
  validateRoadmap,
  parseAndValidateTripJson,
  serializeTrip,
  getStoredTrip,
  saveStoredTrip,
  clearStoredTrip,
  hasStoredTrip,
  STORAGE_KEY,
  EXPORT_SCHEMA_VERSION,
} from '../src/lib/storage'
import type { Roadmap } from '../src/lib/types'

test('getDefaultRoadmap returns a valid complete default roadmap', () => {
  const roadmap = getDefaultRoadmap()
  assert.ok(roadmap, 'Roadmap should not be null')
  assert.equal(typeof roadmap.version, 'string')
  assert.ok(Array.isArray(roadmap.layers), 'Layers must be an array')
  assert.ok(roadmap.layers.length >= 7, 'Default roadmap should have at least 7 layers')
  assert.ok(Array.isArray(roadmap.milestones), 'Milestones must be an array')
  assert.ok(roadmap.milestones.length >= 12, 'Default roadmap should have at least 12 milestones')
  assert.ok(Array.isArray(roadmap.projects), 'Projects must be an array')
  assert.ok(roadmap.projects.length >= 10, 'Default roadmap should have at least 10 projects')
  assert.ok(roadmap.progressTracking, 'progressTracking must exist')

  // Verify that subsequent calls return isolated deep copies
  const roadmap2 = getDefaultRoadmap()
  roadmap2.layers[0].title = 'Modified Layer Title'
  assert.notEqual(roadmap.layers[0].title, 'Modified Layer Title', 'Default roadmap must be deep cloned')
})

test('validateRoadmap validates default roadmap successfully', () => {
  const roadmap = getDefaultRoadmap()
  const result = validateRoadmap(roadmap)
  assert.equal(result.valid, true)
  assert.equal(result.errors.length, 0)
  assert.ok(result.data)
  assert.equal(result.data?.layers.length, roadmap.layers.length)
})

test('serializeTrip produces a valid versioned envelope JSON string', () => {
  const roadmap = getDefaultRoadmap()
  const jsonStr = serializeTrip(roadmap)
  assert.equal(typeof jsonStr, 'string')

  const parsed = JSON.parse(jsonStr)
  assert.equal(parsed.app, 'journey')
  assert.equal(parsed.schemaVersion, EXPORT_SCHEMA_VERSION)
  assert.ok(parsed.exportedAt)
  assert.equal(parsed.metadata.totalLayers, roadmap.layers.length)
  assert.equal(parsed.metadata.totalMilestones, roadmap.milestones.length)
  assert.equal(parsed.metadata.totalProjects, roadmap.projects.length)
  assert.ok(parsed.data)
  assert.equal(parsed.data.layers.length, roadmap.layers.length)
})

test('parseAndValidateTripJson correctly parses serialized envelope JSON', () => {
  const roadmap = getDefaultRoadmap()
  const jsonStr = serializeTrip(roadmap)

  const result = parseAndValidateTripJson(jsonStr)
  assert.equal(result.valid, true)
  assert.equal(result.errors.length, 0)
  assert.ok(result.data)
  assert.equal(result.data?.version, roadmap.version)
  assert.equal(result.data?.layers.length, roadmap.layers.length)
  assert.equal(result.data?.milestones.length, roadmap.milestones.length)
  assert.equal(result.data?.projects.length, roadmap.projects.length)
})

test('parseAndValidateTripJson correctly parses raw Roadmap JSON without envelope', () => {
  const roadmap = getDefaultRoadmap()
  const rawJson = JSON.stringify(roadmap)

  const result = parseAndValidateTripJson(rawJson)
  assert.equal(result.valid, true)
  assert.equal(result.errors.length, 0)
  assert.ok(result.data)
  assert.equal(result.data?.layers.length, roadmap.layers.length)
})

test('parseAndValidateTripJson rejects empty, non-string, or corrupted JSON syntax gracefully', () => {
  const emptyRes = parseAndValidateTripJson('')
  assert.equal(emptyRes.valid, false)
  assert.ok(emptyRes.errors[0].includes('empty'))

  const whitespaceRes = parseAndValidateTripJson('   \n  \t ')
  assert.equal(whitespaceRes.valid, false)
  assert.ok(whitespaceRes.errors[0].includes('empty'))

  const corruptedSyntaxRes = parseAndValidateTripJson('{"app": "journey", "layers": [}')
  assert.equal(corruptedSyntaxRes.valid, false)
  assert.ok(corruptedSyntaxRes.errors[0].includes('Corrupted JSON'))
})

test('validateRoadmap rejects non-object inputs', () => {
  const stringRes = validateRoadmap('string input' as unknown)
  assert.equal(stringRes.valid, false)
  assert.ok(stringRes.errors[0].includes('not a valid JSON object'))

  const arrayRes = validateRoadmap([1, 2, 3] as unknown)
  assert.equal(arrayRes.valid, false)
  assert.ok(arrayRes.errors[0].includes('not a valid JSON object'))

  const nullRes = validateRoadmap(null as unknown)
  assert.equal(nullRes.valid, false)
})

test('validateRoadmap catches missing or empty layers array', () => {
  const roadmap = getDefaultRoadmap()
  const missingLayers = { ...roadmap, layers: undefined }
  const res1 = validateRoadmap(missingLayers)
  assert.equal(res1.valid, false)
  assert.ok(res1.errors.some(e => e.includes('layers')))

  const emptyLayers = { ...roadmap, layers: [] }
  const res2 = validateRoadmap(emptyLayers)
  assert.equal(res2.valid, false)
  assert.ok(res2.errors.some(e => e.includes('layers')))
})

test('validateRoadmap catches invalid layer properties and status', () => {
  const roadmap = getDefaultRoadmap()
  const invalidLayer = {
    ...roadmap,
    layers: [
      {
        id: '',
        title: '',
        description: 'test',
        status: 'not-a-valid-status',
        estimatedWeeks: 4,
      },
    ],
  }
  const res = validateRoadmap(invalidLayer)
  assert.equal(res.valid, false)
  assert.ok(res.errors.some(e => e.includes('layers[0].id')))
  assert.ok(res.errors.some(e => e.includes('layers[0].title')))
  assert.ok(res.errors.some(e => e.includes('layers[0].status')))
})

test('validateRoadmap catches missing or invalid milestones', () => {
  const roadmap = getDefaultRoadmap()
  const invalidMilestone = {
    ...roadmap,
    milestones: [
      {
        id: 'ms-1',
        title: 'Milestone 1',
        description: 'desc',
        layer: 'layer-1',
        status: 'invalid-status',
        week: -5,
      },
    ],
  }
  const res = validateRoadmap(invalidMilestone)
  assert.equal(res.valid, false)
  assert.ok(res.errors.some(e => e.includes('milestones[0].status')))
  assert.ok(res.errors.some(e => e.includes('milestones[0].week')))
})

test('validateRoadmap catches missing progressTracking numeric fields', () => {
  const roadmap = getDefaultRoadmap()
  const invalidPt = {
    ...roadmap,
    progressTracking: {
      totalModules: 'invalid-string-instead-of-number',
      completedModules: 0,
      totalMilestones: 10,
      completedMilestones: 5,
      totalProjects: 10,
      completedProjects: 2,
      currentLayer: 'layer-1',
      currentWeek: 1,
      overallProgressPercent: 50,
      track: null,
    },
  }
  const res = validateRoadmap(invalidPt)
  assert.equal(res.valid, false)
  assert.ok(res.errors.some(e => e.includes('progressTracking.totalModules')))
})

test('localStorage persistence flow works cleanly with mock storage', () => {
  // Mock localStorage
  const storageMap = new Map<string, string>()
  const mockLocalStorage = {
    getItem: (key: string) => storageMap.get(key) ?? null,
    setItem: (key: string, val: string) => { storageMap.set(key, val) },
    removeItem: (key: string) => { storageMap.delete(key) },
    clear: () => { storageMap.clear() },
  }

  // Inject into global window
  const originalWindow = (globalThis as unknown as { window?: unknown }).window
  ;(globalThis as unknown as { window: unknown }).window = {
    localStorage: mockLocalStorage,
  }

  try {
    // 1. Initial state: nothing stored
    assert.equal(hasStoredTrip(), false)
    assert.equal(getStoredTrip(), null)

    // 2. Save a customized roadmap
    const roadmap = getDefaultRoadmap()
    roadmap.source = 'Customized Test Trip'
    roadmap.milestones[0].status = 'completed'

    const saveSuccess = saveStoredTrip(roadmap)
    assert.equal(saveSuccess, true)
    assert.equal(hasStoredTrip(), true)

    // 3. Retrieve stored trip
    const retrieved = getStoredTrip()
    assert.ok(retrieved)
    assert.equal(retrieved?.source, 'Customized Test Trip')
    assert.equal(retrieved?.milestones[0].status, 'completed')

    // 4. Handle corrupted localStorage data gracefully
    mockLocalStorage.setItem(STORAGE_KEY, '{ corrupt-json...')
    const corruptRetrieved = getStoredTrip()
    assert.equal(corruptRetrieved, null, 'Should return null and clear corrupted storage')
    assert.equal(hasStoredTrip(), false, 'Corrupted key should have been cleaned up')

    // 5. Test clearStoredTrip
    saveStoredTrip(roadmap)
    assert.equal(hasStoredTrip(), true)
    clearStoredTrip()
    assert.equal(hasStoredTrip(), false)
    assert.equal(getStoredTrip(), null)
  } finally {
    // Restore original window
    if (originalWindow !== undefined) {
      ;(globalThis as unknown as { window: unknown }).window = originalWindow
    } else {
      delete (globalThis as unknown as { window?: unknown }).window
    }
  }
})
