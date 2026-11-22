import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getDefaultRoadmap,
  serializeTrip,
  parseAndValidateTripJson,
  readTripFromFile,
  TripValidationError,
} from '../src/lib/storage'
import type { Roadmap } from '../src/lib/types'

test('Round-trip serialization and import preserves custom modifications and progress', () => {
  const baseRoadmap = getDefaultRoadmap()

  // Make custom modifications as a user would
  const customizedRoadmap: Roadmap = {
    ...baseRoadmap,
    source: 'My Advanced Machine Learning Journey',
    milestones: baseRoadmap.milestones.map((ms, idx) =>
      idx < 5 ? { ...ms, status: 'completed' as const } : ms
    ),
  }
  const completedCount = customizedRoadmap.milestones.filter(m => m.status === 'completed').length
  const totalCount = customizedRoadmap.milestones.length
  customizedRoadmap.progressTracking = {
    ...customizedRoadmap.progressTracking,
    completedMilestones: completedCount,
    overallProgressPercent: Math.round((completedCount / totalCount) * 100),
  }

  // 1. Serialize to JSON
  const exportedJson = serializeTrip(customizedRoadmap)
  assert.ok(typeof exportedJson === 'string')

  // 2. Parse & validate imported JSON
  const importResult = parseAndValidateTripJson(exportedJson)
  assert.equal(importResult.valid, true)
  assert.equal(importResult.errors.length, 0)
  assert.ok(importResult.data)

  const reloaded = importResult.data!
  assert.equal(reloaded.source, 'My Advanced Machine Learning Journey')
  assert.equal(reloaded.milestones.filter(m => m.status === 'completed').length, 5)
  assert.equal(reloaded.progressTracking.completedMilestones, 5)
  assert.equal(reloaded.progressTracking.overallProgressPercent, Math.round((5 / totalCount) * 100))
  assert.equal(reloaded.layers.length, baseRoadmap.layers.length)
  assert.equal(reloaded.projects.length, baseRoadmap.projects.length)
})

test('readTripFromFile successfully processes valid File object', async () => {
  const roadmap = getDefaultRoadmap()
  roadmap.source = 'File Test Trip'
  const serialized = serializeTrip(roadmap)

  // Use web-standard File or Blob (available globally in Node 20+)
  const file = new File([serialized], 'trip-export.json', { type: 'application/json' })

  const loaded = await readTripFromFile(file)
  assert.equal(loaded.source, 'File Test Trip')
  assert.equal(loaded.layers.length, roadmap.layers.length)
})

test('readTripFromFile rejects invalid or corrupted file with TripValidationError', async () => {
  const corruptFile = new File(['{ invalid json content...'], 'broken.json', {
    type: 'application/json',
  })

  await assert.rejects(
    async () => {
      await readTripFromFile(corruptFile)
    },
    (err: unknown) => {
      assert.ok(err instanceof TripValidationError)
      assert.ok(err.message.includes('broken.json'))
      assert.ok(err.errors.length > 0)
      return true
    }
  )

  const missingFieldsFile = new File(
    [JSON.stringify({ someKey: 'no layers or milestones here' })],
    'missing-fields.json',
    { type: 'application/json' }
  )

  await assert.rejects(
    async () => {
      await readTripFromFile(missingFieldsFile)
    },
    (err: unknown) => {
      assert.ok(err instanceof TripValidationError)
      assert.ok(err.errors.some(e => e.includes('layers')))
      return true
    }
  )
})
