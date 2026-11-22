/**
 * Pure TypeScript Graph & DAG Engine for Journey
 * Zero external libraries (no d3, cytoscape, or vis.js).
 * Native SVG topological layout, cycle detection, path routing, and metrics.
 */

import type { Roadmap, Layer, Milestone, Project } from './types'

export type NodeStatus = 'completed' | 'in-progress' | 'pending'
export type NodeType = 'layer' | 'milestone' | 'project' | 'checkpoint'
export type EdgeType = 'prerequisite' | 'sequence' | 'contains' | 'parallel'

export interface GraphNode {
  id: string
  label: string
  type: NodeType
  status: NodeStatus
  layerId?: string
  week?: number
  description?: string
  metadata?: {
    estimatedWeeks?: number | string
    topicsCount?: number
    skills?: string[]
    level?: string
    phase?: string
    isCurrent?: boolean
    subtasksCompleted?: number
    subtasksTotal?: number
    [key: string]: unknown
  }
  // Layout coordinates (assigned by layout engine)
  x: number
  y: number
  width: number
  height: number
  level: number // topological rank
  slot: number  // index within topological rank
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: EdgeType
  label?: string
  status?: 'active' | 'completed' | 'pending'
  path?: string // SVG path string 'd'
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  hasCycles?: boolean
}

export interface GraphLayoutOptions {
  direction: 'LR' | 'TB'
  nodeWidth: number
  nodeHeight: number
  rankSpacing: number
  nodeSpacing: number
  padding: { x: number; y: number }
}

export interface GraphBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

export interface GraphLayoutResult {
  graph: GraphData
  bounds: GraphBounds
}

export interface GraphMetrics {
  nodeCount: number
  edgeCount: number
  maxDepth: number
  longestPathLength: number
  completedCount: number
  inProgressCount: number
  pendingCount: number
  isolatedNodesCount: number
  criticalPath: string[]
}

export type GraphViewMode = 'phases' | 'milestones' | 'complete'

export const DEFAULT_LAYOUT_OPTIONS: GraphLayoutOptions = {
  direction: 'LR',
  nodeWidth: 200,
  nodeHeight: 76,
  rankSpacing: 80,
  nodeSpacing: 32,
  padding: { x: 40, y: 40 },
}

/**
 * Detects cycles in a directed graph using 3-color DFS (0: unvisited, 1: visiting, 2: visited).
 * Returns array of cycle paths (e.g. [['A', 'B', 'A']]), or empty array if DAG.
 */
export function detectCycles(
  nodes: { id: string }[],
  edges: { source: string; target: string }[]
): string[][] {
  const adj = new Map<string, string[]>()
  for (const node of nodes) {
    adj.set(node.id, [])
  }
  for (const edge of edges) {
    if (adj.has(edge.source)) {
      adj.get(edge.source)!.push(edge.target)
    }
  }

  const visited = new Map<string, number>() // 0: unvisited, 1: visiting, 2: visited
  const parent = new Map<string, string | null>()
  const cycles: string[][] = []

  for (const node of nodes) {
    visited.set(node.id, 0)
    parent.set(node.id, null)
  }

  function dfs(curr: string, path: string[]) {
    visited.set(curr, 1)
    path.push(curr)

    const neighbors = adj.get(curr) || []
    for (const next of neighbors) {
      if (!visited.has(next)) continue

      const state = visited.get(next)
      if (state === 1) {
        // Cycle detected
        const cycleStartIndex = path.indexOf(next)
        if (cycleStartIndex !== -1) {
          cycles.push([...path.slice(cycleStartIndex), next])
        }
      } else if (state === 0) {
        dfs(next, path)
      }
    }

    visited.set(curr, 2)
    path.pop()
  }

  for (const node of nodes) {
    if (visited.get(node.id) === 0) {
      dfs(node.id, [])
    }
  }

  return cycles
}

/**
 * Performs topological sort on a graph using Kahn's algorithm.
 * Guarantees a safe ordering even if cycles or disconnected components exist.
 */
export function topologicalSort(
  nodes: { id: string }[],
  edges: { source: string; target: string }[]
): string[] {
  if (nodes.length === 0) return []

  const inDegree = new Map<string, number>()
  const adj = new Map<string, string[]>()

  for (const n of nodes) {
    inDegree.set(n.id, 0)
    adj.set(n.id, [])
  }

  for (const e of edges) {
    if (inDegree.has(e.target) && adj.has(e.source)) {
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1)
      adj.get(e.source)!.push(e.target)
    }
  }

  const queue: string[] = []
  inDegree.forEach((deg, id) => {
    if (deg === 0) {
      queue.push(id)
    }
  })

  const result: string[] = []
  while (queue.length > 0) {
    const curr = queue.shift()!
    result.push(curr)

    const neighbors = adj.get(curr) || []
    for (const next of neighbors) {
      const newDeg = (inDegree.get(next) || 1) - 1
      inDegree.set(next, newDeg)
      if (newDeg === 0) {
        queue.push(next)
      }
    }
  }

  // If graph contains cycles or disjoint nodes missed by Kahn's, append remaining
  if (result.length < nodes.length) {
    for (const n of nodes) {
      if (!result.includes(n.id)) {
        result.push(n.id)
      }
    }
  }

  return result
}

/**
 * Assigns topological layer/rank (0, 1, 2, ...) to each node using longest path from roots.
 * Handles disconnected subgraphs and cycles without infinite loops.
 */
export function assignTopologicalLayers(
  nodes: { id: string }[],
  edges: { source: string; target: string }[]
): Map<string, number> {
  const ranks = new Map<string, number>()
  if (nodes.length === 0) return ranks

  // Initialize all to 0
  for (const n of nodes) {
    ranks.set(n.id, 0)
  }

  const incoming = new Map<string, string[]>()
  for (const n of nodes) {
    incoming.set(n.id, [])
  }
  const nodeIds = new Set(nodes.map(n => n.id))
  for (const e of edges) {
    if (incoming.has(e.target) && nodeIds.has(e.source)) {
      incoming.get(e.target)!.push(e.source)
    }
  }

  const sortedOrder = topologicalSort(nodes, edges)

  for (const nodeId of sortedOrder) {
    const parents = incoming.get(nodeId) || []
    if (parents.length > 0) {
      let maxParentRank = 0
      for (const p of parents) {
        maxParentRank = Math.max(maxParentRank, ranks.get(p) ?? 0)
      }
      ranks.set(nodeId, maxParentRank + 1)
    }
  }

  return ranks
}

/**
 * Generates a clean cubic Bezier SVG path connecting source and target nodes with arrows.
 */
export function generateCurvedPath(
  source: { x: number; y: number; width: number; height: number },
  target: { x: number; y: number; width: number; height: number },
  direction: 'LR' | 'TB' = 'LR'
): string {
  if (direction === 'LR') {
    const startX = source.x + source.width
    const startY = source.y + source.height / 2
    const endX = target.x
    const endY = target.y + target.height / 2

    const dx = Math.max(30, Math.abs(endX - startX) * 0.45)
    return `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`
  } else {
    const startX = source.x + source.width / 2
    const startY = source.y + source.height
    const endX = target.x + target.width / 2
    const endY = target.y

    const dy = Math.max(30, Math.abs(endY - startY) * 0.45)
    return `M ${startX} ${startY} C ${startX} ${startY + dy}, ${endX} ${endY - dy}, ${endX} ${endY}`
  }
}

/**
 * Robust Topological DAG Layout Engine.
 * Takes nodes and edges, groups into topological ranks, minimizes crossings,
 * assigns (x, y) coordinates, routes smooth edges, and computes graph bounding box.
 */
export function computeDagLayout(
  graph: GraphData,
  customOptions?: Partial<GraphLayoutOptions>
): GraphLayoutResult {
  const options: GraphLayoutOptions = {
    ...DEFAULT_LAYOUT_OPTIONS,
    ...customOptions,
    padding: {
      ...DEFAULT_LAYOUT_OPTIONS.padding,
      ...(customOptions?.padding || {}),
    },
  }

  if (graph.nodes.length === 0) {
    return {
      graph: { nodes: [], edges: [] },
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 },
    }
  }

  // 1. Assign topological levels
  const ranks = assignTopologicalLayers(graph.nodes, graph.edges)

  // 2. Group nodes by level
  const rankBuckets = new Map<number, GraphNode[]>()
  let maxLevel = 0

  for (const node of graph.nodes) {
    const level = ranks.get(node.id) ?? 0
    maxLevel = Math.max(maxLevel, level)
    if (!rankBuckets.has(level)) {
      rankBuckets.set(level, [])
    }
    rankBuckets.get(level)!.push({
      ...node,
      level,
      width: options.nodeWidth,
      height: options.nodeHeight,
    })
  }

  // 3. Barycenter ordering heuristic to reduce edge crossings
  const nodeIndexMap = new Map<string, number>()
  for (let l = 0; l <= maxLevel; l++) {
    const bucket = rankBuckets.get(l) || []
    if (l === 0) {
      // Sort level 0 by original order or week
      bucket.sort((a, b) => (a.week ?? 0) - (b.week ?? 0))
    } else {
      // Compute barycenter based on parent positions in level - 1
      bucket.sort((a, b) => {
        const getParentAvg = (nodeId: string) => {
          const parents = graph.edges
            .filter(e => e.target === nodeId)
            .map(e => e.source)
            .map(pId => nodeIndexMap.get(pId))
            .filter((idx): idx is number => idx !== undefined)

          if (parents.length === 0) return 0
          return parents.reduce((sum, val) => sum + val, 0) / parents.length
        }

        const avgA = getParentAvg(a.id)
        const avgB = getParentAvg(b.id)
        if (avgA !== avgB) return avgA - avgB
        return (a.week ?? 0) - (b.week ?? 0)
      })
    }

    // Record slot index for each node
    bucket.forEach((node, slot) => {
      node.slot = slot
      nodeIndexMap.set(node.id, slot)
    })
  }

  // 4. Calculate maximum slot count for column/row centering
  let maxNodesInRank = 0
  for (let l = 0; l <= maxLevel; l++) {
    const count = (rankBuckets.get(l) || []).length
    maxNodesInRank = Math.max(maxNodesInRank, count)
  }

  const positionedNodes: GraphNode[] = []
  const nodePositionMap = new Map<string, GraphNode>()

  // 5. Position nodes with alignment
  for (let l = 0; l <= maxLevel; l++) {
    const bucket = rankBuckets.get(l) || []
    const count = bucket.length

    bucket.forEach((node, slot) => {
      if (options.direction === 'LR') {
        // X = horizontal rank, Y = vertical slot
        node.x = options.padding.x + l * (options.nodeWidth + options.rankSpacing)
        // Center vertically relative to rank with most nodes
        const totalRankHeight = count * options.nodeHeight + (count - 1) * options.nodeSpacing
        const maxRankHeight = maxNodesInRank * options.nodeHeight + (maxNodesInRank - 1) * options.nodeSpacing
        const yOffset = (maxRankHeight - totalRankHeight) / 2
        node.y = options.padding.y + yOffset + slot * (options.nodeHeight + options.nodeSpacing)
      } else {
        // TB: Y = vertical rank, X = horizontal slot
        node.y = options.padding.y + l * (options.nodeHeight + options.rankSpacing)
        const totalRankWidth = count * options.nodeWidth + (count - 1) * options.nodeSpacing
        const maxRankWidth = maxNodesInRank * options.nodeWidth + (maxNodesInRank - 1) * options.nodeSpacing
        const xOffset = (maxRankWidth - totalRankWidth) / 2
        node.x = options.padding.x + xOffset + slot * (options.nodeWidth + options.nodeSpacing)
      }

      positionedNodes.push(node)
      nodePositionMap.set(node.id, node)
    })
  }

  // 6. Route edges with precomputed SVG curves
  const positionedEdges: GraphEdge[] = []
  for (const edge of graph.edges) {
    const sourceNode = nodePositionMap.get(edge.source)
    const targetNode = nodePositionMap.get(edge.target)

    if (sourceNode && targetNode) {
      const path = generateCurvedPath(sourceNode, targetNode, options.direction)
      positionedEdges.push({
        ...edge,
        path,
        status:
          sourceNode.status === 'completed' && targetNode.status === 'completed'
            ? 'completed'
            : sourceNode.status === 'completed' || sourceNode.status === 'in-progress'
            ? 'active'
            : 'pending',
      })
    }
  }

  // 7. Compute graph bounding box
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const node of positionedNodes) {
    minX = Math.min(minX, node.x)
    minY = Math.min(minY, node.y)
    maxX = Math.max(maxX, node.x + node.width)
    maxY = Math.max(maxY, node.y + node.height)
  }

  const bounds: GraphBounds = {
    minX: Math.max(0, minX - options.padding.x),
    minY: Math.max(0, minY - options.padding.y),
    maxX: maxX + options.padding.x,
    maxY: maxY + options.padding.y,
    width: Math.max(300, maxX - minX + options.padding.x * 2),
    height: Math.max(200, maxY - minY + options.padding.y * 2),
  }

  return {
    graph: {
      nodes: positionedNodes,
      edges: positionedEdges,
    },
    bounds,
  }
}

/**
 * Builds a GraphData structure from a Roadmap instance based on the chosen view mode.
 */
export function buildRoadmapGraph(
  roadmap: Roadmap,
  mode: GraphViewMode = 'phases'
): GraphData {
  if (!roadmap || !roadmap.layers) {
    return { nodes: [], edges: [] }
  }

  if (mode === 'phases') {
    return buildPhasesGraph(roadmap)
  } else if (mode === 'milestones') {
    return buildMilestonesGraph(roadmap)
  } else {
    return buildCompleteGraph(roadmap)
  }
}

/**
 * Builds the high-level Phases & Layers DAG.
 */
function buildPhasesGraph(roadmap: Roadmap): GraphData {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  // Create nodes for standard phases
  roadmap.layers.forEach((layer) => {
    const isCurrent = layer.id === roadmap.progressTracking?.currentLayer
    let topicsCount = 0

    if (layer.modules) {
      topicsCount = layer.modules.reduce((acc, m) => acc + (m.topics?.length || 0), 0)
    } else if (layer.tracks) {
      topicsCount = layer.tracks.reduce(
        (acc, t) => acc + t.modules.reduce((mAcc, m) => mAcc + (m.topics?.length || 0), 0),
        0
      )
    } else if (layer.sections) {
      topicsCount = layer.sections.reduce((acc, s) => acc + (s.topics?.length || 0), 0)
    }

    nodes.push({
      id: layer.id,
      label: layer.title.replace(/^Phase \d+:\s*/, ''),
      type: 'layer',
      status: layer.status,
      description: layer.description,
      metadata: {
        estimatedWeeks: layer.estimatedWeeks,
        topicsCount,
        isCurrent,
        phase: layer.title,
      },
      x: 0,
      y: 0,
      width: 220,
      height: 80,
      level: 0,
      slot: 0,
    })
  })

  // Add virtual terminal milestones / checkpoints (Capstone, Career, Alumni) if present
  const milestones = roadmap.milestones || []
  const capstoneMilestone = milestones.find(m => m.layer === 'capstone' || m.id === 'milestone9')
  const careerMilestone = milestones.find(m => m.layer === 'career' || m.id === 'milestone10')
  const alumniMilestone = milestones.find(m => m.layer === 'community' || m.id === 'milestone12')

  if (capstoneMilestone) {
    nodes.push({
      id: 'capstone-node',
      label: 'Capstone Project',
      type: 'checkpoint',
      status: capstoneMilestone.status,
      description: capstoneMilestone.description,
      week: capstoneMilestone.week,
      metadata: { phase: 'Capstone' },
      x: 0,
      y: 0,
      width: 200,
      height: 76,
      level: 0,
      slot: 0,
    })
  }

  if (careerMilestone) {
    nodes.push({
      id: 'career-node',
      label: 'Career Transition & Offers',
      type: 'checkpoint',
      status: careerMilestone.status,
      description: careerMilestone.description,
      week: careerMilestone.week,
      metadata: { phase: 'Career' },
      x: 0,
      y: 0,
      width: 200,
      height: 76,
      level: 0,
      slot: 0,
    })
  }

  if (alumniMilestone) {
    nodes.push({
      id: 'community-node',
      label: 'Alumni Network & Growth',
      type: 'checkpoint',
      status: alumniMilestone.status,
      description: alumniMilestone.description,
      week: alumniMilestone.week,
      metadata: { phase: 'Community' },
      x: 0,
      y: 0,
      width: 200,
      height: 76,
      level: 0,
      slot: 0,
    })
  }

  // Linear progression edges between core phases: layer1 -> layer2 -> layer3 -> layer4 -> layer5 -> layer6
  const coreLayers = ['layer1', 'layer2', 'layer3', 'layer4', 'layer5', 'layer6']
  for (let i = 0; i < coreLayers.length - 1; i++) {
    const src = coreLayers[i]
    const tgt = coreLayers[i + 1]
    if (nodes.some(n => n.id === src) && nodes.some(n => n.id === tgt)) {
      edges.push({
        id: `edge-${src}-${tgt}`,
        source: src,
        target: tgt,
        type: 'prerequisite',
        label: 'Unlocks',
      })
    }
  }

  // Layer 7 (DSA) runs parallel from layer1 throughout program
  if (nodes.some(n => n.id === 'layer7')) {
    if (nodes.some(n => n.id === 'layer1')) {
      edges.push({
        id: 'edge-layer1-layer7',
        source: 'layer1',
        target: 'layer7',
        type: 'parallel',
        label: 'Parallel Track',
      })
    }
    if (nodes.some(n => n.id === 'layer6')) {
      edges.push({
        id: 'edge-layer7-layer6',
        source: 'layer7',
        target: 'layer6',
        type: 'sequence',
      })
    }
  }

  // Connect Layer 6 to Capstone
  if (nodes.some(n => n.id === 'capstone-node')) {
    const lastLayer = nodes.some(n => n.id === 'layer6') ? 'layer6' : coreLayers[coreLayers.length - 1]
    edges.push({
      id: `edge-${lastLayer}-capstone`,
      source: lastLayer,
      target: 'capstone-node',
      type: 'prerequisite',
      label: 'Capstone Integration',
    })

    if (nodes.some(n => n.id === 'career-node')) {
      edges.push({
        id: 'edge-capstone-career',
        source: 'capstone-node',
        target: 'career-node',
        type: 'sequence',
        label: 'Interview Readiness',
      })
    }
  }

  if (nodes.some(n => n.id === 'career-node') && nodes.some(n => n.id === 'community-node')) {
    edges.push({
      id: 'edge-career-community',
      source: 'career-node',
      target: 'community-node',
      type: 'sequence',
      label: 'Network',
    })
  }

  return { nodes, edges }
}

/**
 * Builds the Milestones progression DAG across the 12 roadmap milestones.
 */
function buildMilestonesGraph(roadmap: Roadmap): GraphData {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  const sortedMilestones = [...(roadmap.milestones || [])].sort((a, b) => a.week - b.week)

  sortedMilestones.forEach((m) => {
    const subtasks = m.subtasks || []
    const subtasksCompleted = subtasks.filter(s => s.completed).length

    nodes.push({
      id: m.id,
      label: m.title,
      type: 'milestone',
      status: m.status,
      layerId: m.layer,
      week: m.week,
      description: m.description,
      metadata: {
        subtasksCompleted,
        subtasksTotal: subtasks.length,
        week: m.week,
        phase: m.layer,
      },
      x: 0,
      y: 0,
      width: 210,
      height: 76,
      level: 0,
      slot: 0,
    })
  })

  // Explicit milestone dependency chain matching curriculum flow
  // m1 (Setup) -> m2 (Live API) -> m3 (LLD) -> m4 (RAG) -> m5 (Data) -> m6 (SysDesign) -> m7 (FDE Pilot)
  // m8 (DSA) feeds into m9 (Capstone) & m10 (Interviews)
  // m7 & m8 -> m9 (Capstone) -> m10 (Interviews) -> m11 (Offer) -> m12 (Alumni)
  const defaultDeps: Array<[string, string, string?]> = [
    ['milestone1', 'milestone2', 'Week 1-6'],
    ['milestone2', 'milestone3', 'Week 6-10'],
    ['milestone3', 'milestone4', 'Week 10-15'],
    ['milestone4', 'milestone5', 'Week 15-19'],
    ['milestone5', 'milestone6', 'Week 19-24'],
    ['milestone6', 'milestone7', 'Phase 5 to 6'],
    ['milestone1', 'milestone8', 'DSA Parallel'],
    ['milestone7', 'milestone9', 'Capstone'],
    ['milestone8', 'milestone9', 'DSA Integration'],
    ['milestone9', 'milestone10', 'Interviews'],
    ['milestone10', 'milestone11', 'Offers'],
    ['milestone11', 'milestone12', 'Alumni'],
  ]

  const nodeIds = new Set(nodes.map(n => n.id))

  for (const [src, tgt, label] of defaultDeps) {
    if (nodeIds.has(src) && nodeIds.has(tgt)) {
      edges.push({
        id: `edge-${src}-${tgt}`,
        source: src,
        target: tgt,
        type: 'prerequisite',
        label,
      })
    }
  }

  // Fallback: If any milestone is disconnected, connect in chronological week sequence
  for (let i = 0; i < sortedMilestones.length - 1; i++) {
    const cur = sortedMilestones[i].id
    const nxt = sortedMilestones[i + 1].id
    const hasIncoming = edges.some(e => e.target === nxt)
    const hasOutgoing = edges.some(e => e.source === cur)
    if (!hasIncoming && !hasOutgoing) {
      edges.push({
        id: `seq-${cur}-${nxt}`,
        source: cur,
        target: nxt,
        type: 'sequence',
      })
    }
  }

  return { nodes, edges }
}

/**
 * Builds the Complete unified Knowledge Graph (Layers, Milestones, and Featured Projects).
 */
function buildCompleteGraph(roadmap: Roadmap): GraphData {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  // 1. Add Layers
  roadmap.layers.forEach((layer) => {
    nodes.push({
      id: layer.id,
      label: layer.title.replace(/^Phase \d+:\s*/, ''),
      type: 'layer',
      status: layer.status,
      description: layer.description,
      metadata: { phase: layer.title },
      x: 0,
      y: 0,
      width: 220,
      height: 76,
      level: 0,
      slot: 0,
    })
  })

  // Core layer edges
  const coreLayers = ['layer1', 'layer2', 'layer3', 'layer4', 'layer5', 'layer6']
  for (let i = 0; i < coreLayers.length - 1; i++) {
    const src = coreLayers[i]
    const tgt = coreLayers[i + 1]
    if (nodes.some(n => n.id === src) && nodes.some(n => n.id === tgt)) {
      edges.push({
        id: `edge-${src}-${tgt}`,
        source: src,
        target: tgt,
        type: 'prerequisite',
      })
    }
  }

  // 2. Add Milestones
  (roadmap.milestones || []).slice(0, 8).forEach((m) => {
    nodes.push({
      id: m.id,
      label: m.title,
      type: 'milestone',
      status: m.status,
      layerId: m.layer,
      week: m.week,
      description: m.description,
      x: 0,
      y: 0,
      width: 200,
      height: 68,
      level: 0,
      slot: 0,
    })

    // Connect milestone to its parent layer
    if (nodes.some(n => n.id === m.layer)) {
      edges.push({
        id: `edge-${m.layer}-${m.id}`,
        source: m.layer,
        target: m.id,
        type: 'contains',
      })
    }
  })

  // 3. Add Key Projects
  const showcaseProjects = (roadmap.projects || []).slice(0, 6)
  showcaseProjects.forEach((proj) => {
    nodes.push({
      id: proj.id,
      label: proj.title,
      type: 'project',
      status: 'pending',
      description: proj.description,
      metadata: {
        level: proj.level,
        phase: proj.phase,
        skills: proj.skills,
      },
      x: 0,
      y: 0,
      width: 200,
      height: 68,
      level: 0,
      slot: 0,
    })

    // Link projects to associated phases
    if (proj.phase.includes('Phase 1') && nodes.some(n => n.id === 'layer1')) {
      edges.push({ id: `edge-layer1-${proj.id}`, source: 'layer1', target: proj.id, type: 'sequence' })
    } else if (proj.phase.includes('Phase 2') && nodes.some(n => n.id === 'layer2')) {
      edges.push({ id: `edge-layer2-${proj.id}`, source: 'layer2', target: proj.id, type: 'sequence' })
    } else if (proj.phase.includes('Phase 3') && nodes.some(n => n.id === 'layer3')) {
      edges.push({ id: `edge-layer3-${proj.id}`, source: 'layer3', target: proj.id, type: 'sequence' })
    } else if (proj.phase.includes('Phase 4') && nodes.some(n => n.id === 'layer4')) {
      edges.push({ id: `edge-layer4-${proj.id}`, source: 'layer4', target: proj.id, type: 'sequence' })
    } else if (proj.phase.includes('Phase 5') && nodes.some(n => n.id === 'layer5')) {
      edges.push({ id: `edge-layer5-${proj.id}`, source: 'layer5', target: proj.id, type: 'sequence' })
    } else if (nodes.some(n => n.id === 'layer6')) {
      edges.push({ id: `edge-layer6-${proj.id}`, source: 'layer6', target: proj.id, type: 'sequence' })
    }
  })

  return { nodes, edges }
}

/**
 * Computes graph analytics: depth, node/edge counts, completion rates, and critical path.
 */
export function computeGraphMetrics(graph: GraphData): GraphMetrics {
  const { nodes, edges } = graph

  let completedCount = 0
  let inProgressCount = 0
  let pendingCount = 0

  for (const n of nodes) {
    if (n.status === 'completed') completedCount++
    else if (n.status === 'in-progress') inProgressCount++
    else pendingCount++
  }

  // Count isolated nodes
  const connectedNodeIds = new Set<string>()
  for (const e of edges) {
    connectedNodeIds.add(e.source)
    connectedNodeIds.add(e.target)
  }
  const isolatedNodesCount = nodes.filter(n => !connectedNodeIds.has(n.id)).length

  // Calculate topological ranks
  const ranks = assignTopologicalLayers(nodes, edges)
  let maxDepth = 0
  ranks.forEach((r) => {
    maxDepth = Math.max(maxDepth, r)
  })

  // Find longest path (critical path)
  const adj = new Map<string, string[]>()
  for (const n of nodes) adj.set(n.id, [])
  for (const e of edges) {
    if (adj.has(e.source)) adj.get(e.source)!.push(e.target)
  }

  const sorted = topologicalSort(nodes, edges)
  const dist = new Map<string, number>()
  const prev = new Map<string, string | null>()

  for (const id of sorted) {
    dist.set(id, 0)
    prev.set(id, null)
  }

  let endNode: string | null = null
  let maxDist = 0

  for (const u of sorted) {
    const currentDist = dist.get(u) || 0
    for (const v of adj.get(u) || []) {
      if ((dist.get(v) || 0) < currentDist + 1) {
        dist.set(v, currentDist + 1)
        prev.set(v, u)
        if (currentDist + 1 > maxDist) {
          maxDist = currentDist + 1
          endNode = v
        }
      }
    }
  }

  const criticalPath: string[] = []
  const visited = new Set<string>()
  let curr = endNode
  while (curr !== null && !visited.has(curr)) {
    visited.add(curr)
    criticalPath.unshift(curr)
    curr = prev.get(curr) || null
  }

  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    maxDepth: nodes.length > 0 ? maxDepth + 1 : 0,
    longestPathLength: criticalPath.length,
    completedCount,
    inProgressCount,
    pendingCount,
    isolatedNodesCount,
    criticalPath,
  }
}

/**
 * Finds direct predecessors and successors of a given node.
 */
export function findNodeNeighbors(
  graph: GraphData,
  nodeId: string
): {
  predecessors: string[]
  successors: string[]
  allAncestors: string[]
  allDescendants: string[]
} {
  const predecessors: string[] = []
  const successors: string[] = []

  for (const edge of graph.edges) {
    if (edge.target === nodeId) predecessors.push(edge.source)
    if (edge.source === nodeId) successors.push(edge.target)
  }

  // BFS for all ancestors
  const allAncestors: string[] = []
  const queueAncestors = [...predecessors]
  const visitedAncestors = new Set<string>(queueAncestors)

  while (queueAncestors.length > 0) {
    const curr = queueAncestors.shift()!
    allAncestors.push(curr)
    for (const edge of graph.edges) {
      if (edge.target === curr && !visitedAncestors.has(edge.source)) {
        visitedAncestors.add(edge.source)
        queueAncestors.push(edge.source)
      }
    }
  }

  // BFS for all descendants
  const allDescendants: string[] = []
  const queueDescendants = [...successors]
  const visitedDescendants = new Set<string>(queueDescendants)

  while (queueDescendants.length > 0) {
    const curr = queueDescendants.shift()!
    allDescendants.push(curr)
    for (const edge of graph.edges) {
      if (edge.source === curr && !visitedDescendants.has(edge.target)) {
        visitedDescendants.add(edge.target)
        queueDescendants.push(edge.target)
      }
    }
  }

  return {
    predecessors,
    successors,
    allAncestors,
    allDescendants,
  }
}

/**
 * Filters a graph by a node predicate, safely keeping valid edges.
 */
export function filterGraph(
  graph: GraphData,
  predicate: (node: GraphNode) => boolean
): GraphData {
  const keptNodes = graph.nodes.filter(predicate)
  const keptIds = new Set(keptNodes.map(n => n.id))
  const keptEdges = graph.edges.filter(
    e => keptIds.has(e.source) && keptIds.has(e.target)
  )

  return {
    nodes: keptNodes,
    edges: keptEdges,
  }
}
