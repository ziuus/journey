import roadmapData from '../data/roadmap.json'
import type { Roadmap } from './types'

export function getRoadmap(): Roadmap {
  return roadmapData as Roadmap
}

export function getCurrentLayer(roadmap: Roadmap) {
  return roadmap.layers.find(l => l.id === roadmap.progressTracking.currentLayer)
}

export function getCurrentTrack(roadmap: Roadmap) {
  const currentLayer = getCurrentLayer(roadmap)
  if (!currentLayer?.tracks) return null
  return currentLayer.tracks.find(t => t.id === roadmap.progressTracking.track)
}

export function getProgressStats(roadmap: Roadmap) {
  const { progressTracking } = roadmap
  return {
    modules: `${progressTracking.completedModules}/${progressTracking.totalModules}`,
    milestones: `${progressTracking.completedMilestones}/${progressTracking.totalMilestones}`,
    projects: `${progressTracking.completedProjects}/${progressTracking.totalProjects}`,
    percent: progressTracking.overallProgressPercent,
  }
}

export function getUpcomingMilestones(roadmap: Roadmap, limit = 3) {
  return roadmap.milestones
    .filter(m => m.status === 'pending')
    .sort((a, b) => a.week - b.week)
    .slice(0, limit)
}

export function getCompletedMilestones(roadmap: Roadmap) {
  return roadmap.milestones.filter(m => m.status === 'completed')
}

export function getProjectsByPhase(roadmap: Roadmap, phase: string) {
  return roadmap.projects.filter(p => p.phase.includes(phase))
}

export function getAllProjects(roadmap: Roadmap) {
  return roadmap.projects
}