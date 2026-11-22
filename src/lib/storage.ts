import defaultRoadmapData from '../data/roadmap.json'
import type { Roadmap, Layer, Milestone, Project, Track, Module, ProgressTracking } from './types'
export type { RawRoadmapData, RawLayerData, RawRoadmapItem } from '@/types/roadmap'

export const STORAGE_KEY = 'journey_current_trip'
export const EXPORT_SCHEMA_VERSION = '1.0.0'

export interface TripExportWrapper {
  app: 'journey'
  schemaVersion: string
  exportedAt: string
  source: string
  metadata: {
    totalLayers: number
    totalMilestones: number
    totalProjects: number
    overallProgressPercent: number
  }
  data: Roadmap
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  data?: Roadmap
}

export class TripValidationError extends Error {
  public readonly errors: string[]

  constructor(message: string, errors: string[] = []) {
    super(message)
    this.name = 'TripValidationError'
    this.errors = errors
  }
}

/**
 * Returns a clean, deep-cloned copy of the default roadmap data.
 */
export function getDefaultRoadmap(): Roadmap {
  return JSON.parse(JSON.stringify(defaultRoadmapData)) as Roadmap
}

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val)
}

function isNonEmptyString(val: unknown): val is string {
  return typeof val === 'string' && val.trim().length > 0
}

function isValidNumber(val: unknown): val is number {
  return typeof val === 'number' && !Number.isNaN(val) && Number.isFinite(val)
}

function validateModule(mod: unknown, path: string, errors: string[]): mod is Module {
  if (!isObject(mod)) {
    errors.push(`${path}: must be an object`)
    return false
  }
  if (!isNonEmptyString(mod.id)) {
    errors.push(`${path}.id: must be a non-empty string`)
  }
  if (!isNonEmptyString(mod.title)) {
    errors.push(`${path}.title: must be a non-empty string`)
  }
  if (!Array.isArray(mod.topics)) {
    errors.push(`${path}.topics: must be an array of strings`)
  } else {
    for (let i = 0; i < mod.topics.length; i++) {
      if (typeof mod.topics[i] !== 'string') {
        errors.push(`${path}.topics[${i}]: must be a string`)
      }
    }
  }
  return true
}

function validateTrack(track: unknown, path: string, errors: string[]): track is Track {
  if (!isObject(track)) {
    errors.push(`${path}: must be an object`)
    return false
  }
  if (!isNonEmptyString(track.id)) {
    errors.push(`${path}.id: must be a non-empty string`)
  }
  if (!isNonEmptyString(track.name)) {
    errors.push(`${path}.name: must be a non-empty string`)
  }
  if (!Array.isArray(track.modules)) {
    errors.push(`${path}.modules: must be an array of modules`)
  } else {
    track.modules.forEach((mod, idx) => {
      validateModule(mod, `${path}.modules[${idx}]`, errors)
    })
  }
  return true
}

function validateLayer(layer: unknown, index: number, errors: string[]): layer is Layer {
  const prefix = `layers[${index}]`
  if (!isObject(layer)) {
    errors.push(`${prefix}: must be an object`)
    return false
  }
  if (!isNonEmptyString(layer.id)) {
    errors.push(`${prefix}.id: missing or invalid string`)
  }
  if (!isNonEmptyString(layer.title)) {
    errors.push(`${prefix}.title: missing or invalid string`)
  }
  if (typeof layer.description !== 'string') {
    errors.push(`${prefix}.description: must be a string`)
  }
  const validStatuses = ['pending', 'in-progress', 'completed']
  if (!validStatuses.includes(layer.status as string)) {
    errors.push(`${prefix}.status: '${layer.status}' is invalid. Expected one of: ${validStatuses.join(', ')}`)
  }
  if (typeof layer.estimatedWeeks !== 'number' && typeof layer.estimatedWeeks !== 'string') {
    errors.push(`${prefix}.estimatedWeeks: must be a number or string`)
  }

  if (layer.tracks !== undefined) {
    if (!Array.isArray(layer.tracks)) {
      errors.push(`${prefix}.tracks: must be an array if defined`)
    } else {
      layer.tracks.forEach((t, tidx) => validateTrack(t, `${prefix}.tracks[${tidx}]`, errors))
    }
  }

  if (layer.modules !== undefined) {
    if (!Array.isArray(layer.modules)) {
      errors.push(`${prefix}.modules: must be an array if defined`)
    } else {
      layer.modules.forEach((m, midx) => validateModule(m, `${prefix}.modules[${midx}]`, errors))
    }
  }

  if (layer.sections !== undefined) {
    if (!Array.isArray(layer.sections)) {
      errors.push(`${prefix}.sections: must be an array if defined`)
    } else {
      layer.sections.forEach((s, sidx) => validateModule(s, `${prefix}.sections[${sidx}]`, errors))
    }
  }

  return true
}

function validateMilestone(ms: unknown, index: number, errors: string[]): ms is Milestone {
  const prefix = `milestones[${index}]`
  if (!isObject(ms)) {
    errors.push(`${prefix}: must be an object`)
    return false
  }
  if (!isNonEmptyString(ms.id)) {
    errors.push(`${prefix}.id: missing or invalid string`)
  }
  if (!isNonEmptyString(ms.title)) {
    errors.push(`${prefix}.title: missing or invalid string`)
  }
  if (typeof ms.description !== 'string') {
    errors.push(`${prefix}.description: must be a string`)
  }
  if (!isNonEmptyString(ms.layer)) {
    errors.push(`${prefix}.layer: missing or invalid string`)
  }
  const validStatuses = ['pending', 'completed']
  if (!validStatuses.includes(ms.status as string)) {
    errors.push(`${prefix}.status: '${ms.status}' is invalid. Expected one of: ${validStatuses.join(', ')}`)
  }
  if (!isValidNumber(ms.week) || (ms.week as number) < 0) {
    errors.push(`${prefix}.week: must be a non-negative number`)
  }
  if (ms.subtasks !== undefined) {
    if (!Array.isArray(ms.subtasks)) {
      errors.push(`${prefix}.subtasks: must be an array if defined`)
    } else {
      ms.subtasks.forEach((st: unknown, sidx: number) => {
        const stPrefix = `${prefix}.subtasks[${sidx}]`
        if (!isObject(st)) {
          errors.push(`${stPrefix}: must be an object`)
        } else {
          if (!isNonEmptyString(st.id)) {
            errors.push(`${stPrefix}.id: missing or invalid string`)
          }
          if (!isNonEmptyString(st.title)) {
            errors.push(`${stPrefix}.title: missing or invalid string`)
          }
          if (typeof st.completed !== 'boolean') {
            errors.push(`${stPrefix}.completed: must be a boolean`)
          }
        }
      })
    }
  }
  return true
}

function validateProject(proj: unknown, index: number, errors: string[]): proj is Project {
  const prefix = `projects[${index}]`
  if (!isObject(proj)) {
    errors.push(`${prefix}: must be an object`)
    return false
  }
  if (!isNonEmptyString(proj.id)) {
    errors.push(`${prefix}.id: missing or invalid string`)
  }
  if (!isNonEmptyString(proj.title)) {
    errors.push(`${prefix}.title: missing or invalid string`)
  }
  if (typeof proj.level !== 'string') {
    errors.push(`${prefix}.level: must be a string`)
  }
  if (typeof proj.phase !== 'string') {
    errors.push(`${prefix}.phase: must be a string`)
  }
  if (typeof proj.description !== 'string') {
    errors.push(`${prefix}.description: must be a string`)
  }
  if (!Array.isArray(proj.skills)) {
    errors.push(`${prefix}.skills: must be an array of strings`)
  }
  if (typeof proj.standout !== 'string') {
    errors.push(`${prefix}.standout: must be a string`)
  }
  return true
}

function validateProgressTracking(pt: unknown, errors: string[]): pt is ProgressTracking {
  if (!isObject(pt)) {
    errors.push(`progressTracking: must be an object`)
    return false
  }
  const numFields: Array<keyof ProgressTracking> = [
    'totalModules',
    'completedModules',
    'totalMilestones',
    'completedMilestones',
    'totalProjects',
    'completedProjects',
    'currentWeek',
    'overallProgressPercent',
  ]
  for (const field of numFields) {
    if (!isValidNumber(pt[field])) {
      errors.push(`progressTracking.${field}: must be a valid number`)
    }
  }
  if (typeof pt.currentLayer !== 'string') {
    errors.push(`progressTracking.currentLayer: must be a string`)
  }
  if (pt.track !== null && typeof pt.track !== 'string') {
    errors.push(`progressTracking.track: must be a string or null`)
  }
  return true
}

/**
 * Validates any parsed JavaScript object against the Roadmap schema.
 * Supports both wrapped export format ({ app: 'journey', data: Roadmap })
 * and raw Roadmap objects.
 */
export function validateRoadmap(input: unknown): ValidationResult {
  const errors: string[] = []

  if (!isObject(input)) {
    return {
      valid: false,
      errors: ['Input is not a valid JSON object'],
    }
  }

  // Handle export wrapper envelope
  let candidate: Record<string, unknown> = input
  if (input.app === 'journey' && isObject(input.data)) {
    candidate = input.data as Record<string, unknown>
  } else if (isObject(input.data) && (Array.isArray(input.data.layers) || Array.isArray(input.data.milestones))) {
    candidate = input.data as Record<string, unknown>
  }

  // Check required core sections
  if (!Array.isArray(candidate.layers) || candidate.layers.length === 0) {
    errors.push("Missing required field 'layers' (must be a non-empty array)")
  } else {
    candidate.layers.forEach((layer, idx) => validateLayer(layer, idx, errors))
  }

  if (!Array.isArray(candidate.milestones)) {
    errors.push("Missing required field 'milestones' (must be an array)")
  } else {
    candidate.milestones.forEach((ms, idx) => validateMilestone(ms, idx, errors))
  }

  if (!Array.isArray(candidate.projects)) {
    errors.push("Missing required field 'projects' (must be an array)")
  } else {
    candidate.projects.forEach((proj, idx) => validateProject(proj, idx, errors))
  }

  if (!candidate.progressTracking) {
    errors.push("Missing required field 'progressTracking'")
  } else {
    validateProgressTracking(candidate.progressTracking, errors)
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    }
  }

  // Provide sensible defaults for optional or secondary metadata if missing
  const defaultBase = getDefaultRoadmap()
  const completeRoadmap: Roadmap = {
    version: typeof candidate.version === 'string' ? candidate.version : defaultBase.version,
    source: typeof candidate.source === 'string' ? candidate.source : 'Imported Trip',
    programDuration: typeof candidate.programDuration === 'string' ? candidate.programDuration : defaultBase.programDuration,
    lastUpdated: typeof candidate.lastUpdated === 'string' ? candidate.lastUpdated : new Date().toISOString().split('T')[0],
    layers: candidate.layers as Layer[],
    milestones: candidate.milestones as Milestone[],
    roles: Array.isArray(candidate.roles) ? (candidate.roles as Roadmap['roles']) : defaultBase.roles,
    timelinePhases: Array.isArray(candidate.timelinePhases) ? (candidate.timelinePhases as Roadmap['timelinePhases']) : defaultBase.timelinePhases,
    projects: candidate.projects as Project[],
    careerSupport: isObject(candidate.careerSupport) ? (candidate.careerSupport as unknown as Roadmap['careerSupport']) : defaultBase.careerSupport,
    salaryOutcomes: isObject(candidate.salaryOutcomes) ? (candidate.salaryOutcomes as unknown as Roadmap['salaryOutcomes']) : defaultBase.salaryOutcomes,
    cohortComposition: isObject(candidate.cohortComposition) ? (candidate.cohortComposition as unknown as Roadmap['cohortComposition']) : defaultBase.cohortComposition,
    knowledgePartner: typeof candidate.knowledgePartner === 'string' ? candidate.knowledgePartner : defaultBase.knowledgePartner,
    instructors: Array.isArray(candidate.instructors) ? (candidate.instructors as Roadmap['instructors']) : defaultBase.instructors,
    toolsAndTechnologies: isObject(candidate.toolsAndTechnologies) ? (candidate.toolsAndTechnologies as unknown as Roadmap['toolsAndTechnologies']) : defaultBase.toolsAndTechnologies,
    progressTracking: candidate.progressTracking as ProgressTracking,
    suggestedStudentPath: Array.isArray(candidate.suggestedStudentPath) ? (candidate.suggestedStudentPath as string[]) : defaultBase.suggestedStudentPath,
    notes: typeof candidate.notes === 'string' ? candidate.notes : defaultBase.notes,
  }

  return {
    valid: true,
    errors: [],
    data: completeRoadmap,
  }
}

/**
 * Parses a JSON string and validates it against the Roadmap schema.
 * Gracefully handles syntax errors and semantic validation failures.
 */
export function parseAndValidateTripJson(rawJson: string): ValidationResult {
  if (typeof rawJson !== 'string' || rawJson.trim().length === 0) {
    return {
      valid: false,
      errors: ['Input JSON string is empty or invalid.'],
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawJson)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      valid: false,
      errors: [`Corrupted JSON: Failed to parse input string (${message})`],
    }
  }

  return validateRoadmap(parsed)
}

/**
 * Serializes a roadmap into a formatted JSON string with envelope metadata.
 */
export function serializeTrip(roadmap: Roadmap, pretty = true): string {
  const wrapper: TripExportWrapper = {
    app: 'journey',
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    source: roadmap.source || 'Journey Trip',
    metadata: {
      totalLayers: roadmap.layers.length,
      totalMilestones: roadmap.milestones.length,
      totalProjects: roadmap.projects.length,
      overallProgressPercent: roadmap.progressTracking.overallProgressPercent,
    },
    data: roadmap,
  }

  return JSON.stringify(wrapper, null, pretty ? 2 : undefined)
}

/**
 * Triggers a client-side file download of the serialized roadmap trip.
 */
export function downloadTripFile(roadmap: Roadmap, customFilename?: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  const jsonContent = serializeTrip(roadmap, true)
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const dateStr = new Date().toISOString().slice(0, 10)
  const safeTitle = (roadmap.source || 'trip')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const filename = customFilename || `journey-trip-${safeTitle || 'export'}-${dateStr}.json`

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()

  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 100)
}

/**
 * Reads a File object uploaded by the user, validates its JSON schema,
 * and returns the parsed Roadmap. Throws TripValidationError on invalid data.
 */
export async function readTripFromFile(file: File): Promise<Roadmap> {
  const content = await file.text()
  const result = parseAndValidateTripJson(content)
  if (!result.valid || !result.data) {
    throw new TripValidationError(
      `File "${file.name}" failed validation: ${result.errors.join('; ')}`,
      result.errors
    )
  }
  return result.data
}

/**
 * Retrieves the currently saved trip from localStorage.
 * Falls back to null if no saved trip exists or if stored data is corrupted.
 */
export function getStoredTrip(): Roadmap | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const result = parseAndValidateTripJson(raw)
    if (result.valid && result.data) {
      return result.data
    } else {
      console.warn('Stored trip in localStorage is corrupted or invalid. Falling back to default.', result.errors)
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }
  } catch (err) {
    console.warn('Failed to access localStorage:', err)
    return null
  }
}

/**
 * Saves a validated roadmap to localStorage.
 * Returns true if successful, false otherwise.
 */
export function saveStoredTrip(roadmap: Roadmap): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false
  }

  try {
    const validation = validateRoadmap(roadmap)
    if (!validation.valid || !validation.data) {
      console.error('Cannot save invalid roadmap to localStorage:', validation.errors)
      return false
    }
    const serialized = JSON.stringify(validation.data)
    window.localStorage.setItem(STORAGE_KEY, serialized)
    return true
  } catch (err) {
    console.error('Failed to save trip to localStorage:', err)
    return false
  }
}

/**
 * Removes any saved trip from localStorage.
 */
export function clearStoredTrip(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.warn('Failed to clear trip from localStorage:', err)
  }
}

/**
 * Checks whether a saved trip is present in localStorage.
 */
export function hasStoredTrip(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}
