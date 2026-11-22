import type { Roadmap, Layer, Milestone, Project, Module, Track } from './types'

export type SearchResultType = 'layer' | 'module' | 'milestone' | 'project'

export interface SearchResult {
  id: string
  type: SearchResultType
  title: string
  subtitle: string
  category: string
  badgeText: string
  targetTab: 'overview' | 'layers' | 'milestones' | 'projects' | 'tree'
  targetLayerId?: string
  targetMilestoneId?: string
  targetProjectId?: string
  score: number
  matchedTerms: string[]
}

export interface SearchOptions {
  limit?: number
  filterType?: SearchResultType | 'all'
}

/**
 * Normalizes text for search comparison (lowercase, trimmed).
 */
function normalize(str: string): string {
  return str.toLowerCase().trim()
}

/**
 * Searches across all layers, modules, topics, milestones, and projects in a Roadmap.
 * Returns ranked search results.
 */
export function searchRoadmap(
  roadmap: Roadmap,
  rawQuery: string,
  options: SearchOptions = {}
): SearchResult[] {
  const query = normalize(rawQuery)
  if (!query) {
    return []
  }

  const queryTerms = query.split(/\s+/).filter(Boolean)
  const results: SearchResult[] = []
  const { limit = 50, filterType = 'all' } = options

  // 1. Search Layers
  if (filterType === 'all' || filterType === 'layer') {
    roadmap.layers.forEach((layer, idx) => {
      const title = layer.title || ''
      const desc = layer.description || ''
      const titleNorm = normalize(title)
      const descNorm = normalize(desc)

      let score = 0
      const matchedTerms: string[] = []

      queryTerms.forEach((term) => {
        if (titleNorm === term) {
          score += 100
          matchedTerms.push(term)
        } else if (titleNorm.startsWith(term)) {
          score += 80
          matchedTerms.push(term)
        } else if (titleNorm.includes(term)) {
          score += 60
          matchedTerms.push(term)
        } else if (descNorm.includes(term)) {
          score += 35
          matchedTerms.push(term)
        }
      })

      if (score > 0) {
        results.push({
          id: `layer-${layer.id}`,
          type: 'layer',
          title: layer.title,
          subtitle: layer.description,
          category: `Layer ${idx + 1}`,
          badgeText: `${layer.estimatedWeeks}w · ${layer.status}`,
          targetTab: 'layers',
          targetLayerId: layer.id,
          score,
          matchedTerms,
        })
      }
    })
  }

  // 2. Search Modules & Topics
  if (filterType === 'all' || filterType === 'module') {
    roadmap.layers.forEach((layer, layerIdx) => {
      const processModules = (modules: Module[], contextName: string) => {
        modules.forEach((mod, modIdx) => {
          const modTitleNorm = normalize(mod.title)
          const topicsNorm = mod.topics.map(normalize)

          let score = 0
          const matchedTerms: string[] = []

          queryTerms.forEach((term) => {
            if (modTitleNorm === term) {
              score += 90
              matchedTerms.push(term)
            } else if (modTitleNorm.startsWith(term)) {
              score += 70
              matchedTerms.push(term)
            } else if (modTitleNorm.includes(term)) {
              score += 55
              matchedTerms.push(term)
            } else {
              const matchedTopic = topicsNorm.find((t) => t.includes(term))
              if (matchedTopic) {
                score += 45
                matchedTerms.push(term)
              }
            }
          })

          if (score > 0) {
            results.push({
              id: `module-${layer.id}-${mod.id}-${modIdx}`,
              type: 'module',
              title: mod.title,
              subtitle: mod.topics.join(' · '),
              category: `Layer ${layerIdx + 1} · ${contextName}`,
              badgeText: `${mod.topics.length} topics`,
              targetTab: 'layers',
              targetLayerId: layer.id,
              score,
              matchedTerms,
            })
          }
        })
      }

      if (layer.tracks) {
        layer.tracks.forEach((track) => {
          processModules(track.modules, track.name)
        })
      }
      if (layer.modules) {
        processModules(layer.modules, 'Core')
      }
      if (layer.sections) {
        processModules(layer.sections, 'Sections')
      }
    })
  }

  // 3. Search Milestones
  if (filterType === 'all' || filterType === 'milestone') {
    roadmap.milestones.forEach((ms) => {
      const titleNorm = normalize(ms.title)
      const descNorm = normalize(ms.description)
      const layerNorm = normalize(ms.layer)

      let score = 0
      const matchedTerms: string[] = []

      queryTerms.forEach((term) => {
        if (titleNorm === term) {
          score += 100
          matchedTerms.push(term)
        } else if (titleNorm.startsWith(term)) {
          score += 80
          matchedTerms.push(term)
        } else if (titleNorm.includes(term)) {
          score += 65
          matchedTerms.push(term)
        } else if (descNorm.includes(term)) {
          score += 35
          matchedTerms.push(term)
        } else if (layerNorm.includes(term)) {
          score += 30
          matchedTerms.push(term)
        }
      })

      if (score > 0) {
        results.push({
          id: `milestone-${ms.id}`,
          type: 'milestone',
          title: ms.title,
          subtitle: ms.description,
          category: `Milestone · Week ${ms.week}`,
          badgeText: ms.status === 'completed' ? 'Completed' : 'Pending',
          targetTab: 'milestones',
          targetMilestoneId: ms.id,
          score,
          matchedTerms,
        })
      }
    })
  }

  // 4. Search Projects
  if (filterType === 'all' || filterType === 'project') {
    roadmap.projects.forEach((proj) => {
      const titleNorm = normalize(proj.title)
      const descNorm = normalize(proj.description)
      const standoutNorm = normalize(proj.standout)
      const skillsNorm = proj.skills.map(normalize)
      const phaseNorm = normalize(proj.phase)
      const levelNorm = normalize(proj.level)

      let score = 0
      const matchedTerms: string[] = []

      queryTerms.forEach((term) => {
        if (titleNorm === term) {
          score += 100
          matchedTerms.push(term)
        } else if (titleNorm.startsWith(term)) {
          score += 80
          matchedTerms.push(term)
        } else if (titleNorm.includes(term)) {
          score += 65
          matchedTerms.push(term)
        } else if (skillsNorm.some((s) => s.includes(term))) {
          score += 50
          matchedTerms.push(term)
        } else if (standoutNorm.includes(term)) {
          score += 40
          matchedTerms.push(term)
        } else if (descNorm.includes(term)) {
          score += 35
          matchedTerms.push(term)
        } else if (phaseNorm.includes(term) || levelNorm.includes(term)) {
          score += 25
          matchedTerms.push(term)
        }
      })

      if (score > 0) {
        results.push({
          id: `project-${proj.id}`,
          type: 'project',
          title: proj.title,
          subtitle: proj.description,
          category: `${proj.level} · ${proj.phase}`,
          badgeText: proj.standout ? proj.standout : proj.level,
          targetTab: 'projects',
          targetProjectId: proj.id,
          score,
          matchedTerms,
        })
      }
    })
  }

  // Sort descending by score, then alphabetically by title
  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }
    return a.title.localeCompare(b.title)
  })

  return results.slice(0, limit)
}
