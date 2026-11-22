import test from 'node:test'
import assert from 'node:assert/strict'
import {
  detectCycles,
  topologicalSort,
  assignTopologicalLayers,
  generateCurvedPath,
  computeDagLayout,
  buildRoadmapGraph,
  computeGraphMetrics,
  findNodeNeighbors,
  filterGraph,
  type GraphData,
} from '../src/lib/graph'
import { getDefaultRoadmap } from '../src/lib/storage'
import type { Roadmap } from '../src/lib/types'

test('detectCycles correctly distinguishes DAGs from cyclic graphs', () => {
  // Acyclic DAG: A -> B -> C
  const dagNodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }]
  const dagEdges = [
    { source: 'A', target: 'B' },
    { source: 'B', target: 'C' },
  ]
  const dagCycles = detectCycles(dagNodes, dagEdges)
  assert.equal(dagCycles.length, 0, 'DAG must have zero cycles')

  // Direct cycle: A -> B -> A
  const cycleEdges = [
    { source: 'A', target: 'B' },
    { source: 'B', target: 'A' },
  ]
  const directCycles = detectCycles(dagNodes, cycleEdges)
  assert.ok(directCycles.length > 0, 'Must detect direct cycle')
  assert.ok(
    directCycles.some((c) => c.includes('A') && c.includes('B')),
    'Cycle path must contain nodes A and B'
  )

  // Complex cycle: A -> B -> C -> D -> B
  const complexNodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }]
  const complexEdges = [
    { source: 'A', target: 'B' },
    { source: 'B', target: 'C' },
    { source: 'C', target: 'D' },
    { source: 'D', target: 'B' },
  ]
  const complexCycles = detectCycles(complexNodes, complexEdges)
  assert.ok(complexCycles.length > 0, 'Must detect multi-node loop')

  // Self loop: A -> A
  const selfLoopEdges = [{ source: 'A', target: 'A' }]
  const selfCycles = detectCycles(dagNodes, selfLoopEdges)
  assert.ok(selfCycles.length > 0, 'Must detect self loop')

  // Disconnected components without cycles
  const disconnectedNodes = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }]
  const disconnectedEdges = [
    { source: '1', target: '2' },
    { source: '3', target: '4' },
  ]
  assert.equal(detectCycles(disconnectedNodes, disconnectedEdges).length, 0)
})

test('topologicalSort generates valid linear topological orders', () => {
  const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }]
  const edges = [
    { source: 'A', target: 'B' },
    { source: 'A', target: 'C' },
    { source: 'B', target: 'D' },
    { source: 'C', target: 'D' },
  ]

  const order = topologicalSort(nodes, edges)
  assert.equal(order.length, 4)

  // Verify prerequisites precede dependents
  const indexOfA = order.indexOf('A')
  const indexOfB = order.indexOf('B')
  const indexOfC = order.indexOf('C')
  const indexOfD = order.indexOf('D')

  assert.ok(indexOfA < indexOfB, 'A must precede B')
  assert.ok(indexOfA < indexOfC, 'A must precede C')
  assert.ok(indexOfB < indexOfD, 'B must precede D')
  assert.ok(indexOfC < indexOfD, 'C must precede D')

  // Handles empty graph
  assert.deepEqual(topologicalSort([], []), [])

  // Handles isolated nodes
  const isolatedNodes = [{ id: 'X' }, { id: 'Y' }, { id: 'Z' }]
  const isolatedOrder = topologicalSort(isolatedNodes, [])
  assert.equal(isolatedOrder.length, 3)
  assert.ok(isolatedOrder.includes('X'))
  assert.ok(isolatedOrder.includes('Y'))
  assert.ok(isolatedOrder.includes('Z'))

  // Handles cyclic graph gracefully without infinite recursion
  const cyclicNodes = [{ id: '1' }, { id: '2' }]
  const cyclicEdges = [
    { source: '1', target: '2' },
    { source: '2', target: '1' },
  ]
  const cyclicOrder = topologicalSort(cyclicNodes, cyclicEdges)
  assert.equal(cyclicOrder.length, 2, 'Must safely recover all nodes despite cycle')
})

test('assignTopologicalLayers calculates accurate depth ranks', () => {
  // A -> B -> D
  // A -> C -> D
  // E (isolated)
  const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }, { id: 'E' }]
  const edges = [
    { source: 'A', target: 'B' },
    { source: 'A', target: 'C' },
    { source: 'B', target: 'D' },
    { source: 'C', target: 'D' },
  ]

  const ranks = assignTopologicalLayers(nodes, edges)

  assert.equal(ranks.get('A'), 0, 'Root node A must have rank 0')
  assert.equal(ranks.get('B'), 1, 'Child node B must have rank 1')
  assert.equal(ranks.get('C'), 1, 'Child node C must have rank 1')
  assert.equal(ranks.get('D'), 2, 'Merge node D must have rank 2')
  assert.equal(ranks.get('E'), 0, 'Isolated node E must have rank 0')

  // Variable path length: A -> B -> C -> D and A -> D
  const varEdges = [
    { source: 'A', target: 'B' },
    { source: 'B', target: 'C' },
    { source: 'C', target: 'D' },
    { source: 'A', target: 'D' },
  ]
  const varRanks = assignTopologicalLayers(
    [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }],
    varEdges
  )
  assert.equal(varRanks.get('D'), 3, 'Longest path must determine rank (rank 3)')

  // Empty graph
  assert.equal(assignTopologicalLayers([], []).size, 0)
})

test('generateCurvedPath creates valid smooth SVG cubic Bezier strings', () => {
  const source = { x: 10, y: 20, width: 200, height: 80 }
  const target = { x: 300, y: 150, width: 200, height: 80 }

  // LR direction
  const pathLR = generateCurvedPath(source, target, 'LR')
  assert.ok(pathLR.startsWith('M 210 60 C'), 'LR path must start at source right anchor')
  assert.ok(pathLR.endsWith('300 190'), 'LR path must end at target left anchor')

  // TB direction
  const pathTB = generateCurvedPath(source, target, 'TB')
  assert.ok(pathTB.startsWith('M 110 100 C'), 'TB path must start at source bottom anchor')
  assert.ok(pathTB.endsWith('400 150'), 'TB path must end at target top anchor')
})

test('computeDagLayout positions nodes and routes edges with valid coordinates', () => {
  const sampleGraph: GraphData = {
    nodes: [
      {
        id: 'n1',
        label: 'Node 1',
        type: 'layer',
        status: 'completed',
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        level: 0,
        slot: 0,
      },
      {
        id: 'n2',
        label: 'Node 2',
        type: 'milestone',
        status: 'in-progress',
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        level: 0,
        slot: 0,
      },
      {
        id: 'n3',
        label: 'Node 3',
        type: 'milestone',
        status: 'pending',
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        level: 0,
        slot: 0,
      },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', type: 'prerequisite' },
      { id: 'e2', source: 'n2', target: 'n3', type: 'sequence' },
    ],
  }

  // 1. Layout in LR mode
  const resultLR = computeDagLayout(sampleGraph, { direction: 'LR' })
  assert.equal(resultLR.graph.nodes.length, 3)
  assert.equal(resultLR.graph.edges.length, 2)

  const n1LR = resultLR.graph.nodes.find((n) => n.id === 'n1')!
  const n2LR = resultLR.graph.nodes.find((n) => n.id === 'n2')!
  const n3LR = resultLR.graph.nodes.find((n) => n.id === 'n3')!

  assert.ok(n1LR.x < n2LR.x, 'In LR mode, rank 0 X must be smaller than rank 1 X')
  assert.ok(n2LR.x < n3LR.x, 'In LR mode, rank 1 X must be smaller than rank 2 X')
  assert.ok(resultLR.bounds.width > 0, 'Bounding box must have positive width')
  assert.ok(resultLR.bounds.height > 0, 'Bounding box must have positive height')

  // Check edge paths precalculated
  for (const edge of resultLR.graph.edges) {
    assert.ok(typeof edge.path === 'string' && edge.path.startsWith('M '))
  }

  // 2. Layout in TB mode
  const resultTB = computeDagLayout(sampleGraph, { direction: 'TB' })
  const n1TB = resultTB.graph.nodes.find((n) => n.id === 'n1')!
  const n2TB = resultTB.graph.nodes.find((n) => n.id === 'n2')!
  const n3TB = resultTB.graph.nodes.find((n) => n.id === 'n3')!

  assert.ok(n1TB.y < n2TB.y, 'In TB mode, rank 0 Y must be smaller than rank 1 Y')
  assert.ok(n2TB.y < n3TB.y, 'In TB mode, rank 1 Y must be smaller than rank 2 Y')

  // 3. Handles empty graph
  const emptyResult = computeDagLayout({ nodes: [], edges: [] })
  assert.equal(emptyResult.graph.nodes.length, 0)
  assert.equal(emptyResult.bounds.width, 0)
})

test('buildRoadmapGraph creates comprehensive graphs across view modes', () => {
  const roadmap = getDefaultRoadmap()

  // 1. Mode 'phases'
  const phasesGraph = buildRoadmapGraph(roadmap, 'phases')
  assert.ok(phasesGraph.nodes.length >= 7, 'Must generate nodes for all 7 curriculum layers')
  assert.ok(phasesGraph.edges.length >= 6, 'Must generate linear progression and integration edges')
  assert.ok(phasesGraph.nodes.some((n) => n.id === 'layer1'))
  assert.ok(phasesGraph.nodes.some((n) => n.id === 'layer7'))
  assert.ok(phasesGraph.nodes.some((n) => n.id === 'capstone-node'))

  // 2. Mode 'milestones'
  const milestonesGraph = buildRoadmapGraph(roadmap, 'milestones')
  assert.equal(milestonesGraph.nodes.length, 12, 'Must include all 12 milestones')
  assert.ok(milestonesGraph.edges.length >= 11, 'Must include prerequisite edges')
  assert.ok(milestonesGraph.nodes.every((n) => n.type === 'milestone'))

  // Verify milestone 1 connects to milestone 2
  const m1ToM2 = milestonesGraph.edges.find(
    (e) => e.source === 'milestone1' && e.target === 'milestone2'
  )
  assert.ok(m1ToM2, 'Milestone 1 must unlock Milestone 2')

  // 3. Mode 'complete'
  const completeGraph = buildRoadmapGraph(roadmap, 'complete')
  assert.ok(completeGraph.nodes.length > 15, 'Must combine layers, milestones, and projects')
  assert.ok(completeGraph.nodes.some((n) => n.type === 'layer'))
  assert.ok(completeGraph.nodes.some((n) => n.type === 'milestone'))
  assert.ok(completeGraph.nodes.some((n) => n.type === 'project'))

  // 4. Corrupted / empty roadmap defense
  const emptyGraph = buildRoadmapGraph({} as Roadmap, 'phases')
  assert.equal(emptyGraph.nodes.length, 0)
  assert.equal(emptyGraph.edges.length, 0)
})

test('buildRoadmapGraph handles partial roadmap objects without throwing', () => {
  // 1. Completely empty layers array, missing milestones and projects
  const partialEmpty = { layers: [] } as unknown as Roadmap
  assert.doesNotThrow(() => {
    const phases = buildRoadmapGraph(partialEmpty, 'phases')
    assert.equal(phases.nodes.length, 0)
    assert.equal(phases.edges.length, 0)
  })

  assert.doesNotThrow(() => {
    const milestones = buildRoadmapGraph(partialEmpty, 'milestones')
    assert.equal(milestones.nodes.length, 0)
    assert.equal(milestones.edges.length, 0)
  })

  assert.doesNotThrow(() => {
    const complete = buildRoadmapGraph(partialEmpty, 'complete')
    assert.equal(complete.nodes.length, 0)
    assert.equal(complete.edges.length, 0)
  })

  // 2. Partial roadmap with populated layers but missing milestones and projects
  const partialWithLayers = {
    layers: [
      {
        id: 'layer1',
        title: 'Phase 1: Foundations',
        status: 'in-progress' as const,
        description: 'Layer 1 description',
        estimatedWeeks: 4,
        modules: [{ id: 'm1', title: 'Module 1', topics: ['t1', 't2'] }],
      },
      {
        id: 'layer2',
        title: 'Phase 2: Advanced',
        status: 'pending' as const,
        description: 'Layer 2 description',
        estimatedWeeks: 6,
        modules: [],
      },
    ],
  } as unknown as Roadmap

  assert.doesNotThrow(() => {
    const phases = buildRoadmapGraph(partialWithLayers, 'phases')
    assert.equal(phases.nodes.length, 2)
    assert.equal(phases.edges.length, 1)
  })

  assert.doesNotThrow(() => {
    const milestones = buildRoadmapGraph(partialWithLayers, 'milestones')
    assert.equal(milestones.nodes.length, 0)
    assert.equal(milestones.edges.length, 0)
  })

  assert.doesNotThrow(() => {
    const complete = buildRoadmapGraph(partialWithLayers, 'complete')
    assert.equal(complete.nodes.length, 2)
    assert.equal(complete.edges.length, 1)
  })
})

test('computeGraphMetrics extracts deep graph structural properties and critical path', () => {
  const graph: GraphData = {
    nodes: [
      { id: '1', label: '1', type: 'layer', status: 'completed', x: 0, y: 0, width: 0, height: 0, level: 0, slot: 0 },
      { id: '2', label: '2', type: 'milestone', status: 'in-progress', x: 0, y: 0, width: 0, height: 0, level: 0, slot: 0 },
      { id: '3', label: '3', type: 'milestone', status: 'pending', x: 0, y: 0, width: 0, height: 0, level: 0, slot: 0 },
      { id: '4', label: '4', type: 'project', status: 'pending', x: 0, y: 0, width: 0, height: 0, level: 0, slot: 0 },
      { id: 'iso', label: 'iso', type: 'layer', status: 'pending', x: 0, y: 0, width: 0, height: 0, level: 0, slot: 0 },
    ],
    edges: [
      { id: 'e1', source: '1', target: '2', type: 'prerequisite' },
      { id: 'e2', source: '2', target: '3', type: 'prerequisite' },
      { id: 'e3', source: '3', target: '4', type: 'prerequisite' },
    ],
  }

  const metrics = computeGraphMetrics(graph)
  assert.equal(metrics.nodeCount, 5)
  assert.equal(metrics.edgeCount, 3)
  assert.equal(metrics.completedCount, 1)
  assert.equal(metrics.inProgressCount, 1)
  assert.equal(metrics.pendingCount, 3)
  assert.equal(metrics.isolatedNodesCount, 1, 'Node iso has no edges')
  assert.equal(metrics.maxDepth, 4, 'Longest chain 1 -> 2 -> 3 -> 4 has depth 4')
  assert.deepEqual(metrics.criticalPath, ['1', '2', '3', '4'])

  // Empty graph metrics
  const emptyMetrics = computeGraphMetrics({ nodes: [], edges: [] })
  assert.equal(emptyMetrics.nodeCount, 0)
  assert.equal(emptyMetrics.maxDepth, 0)
  assert.deepEqual(emptyMetrics.criticalPath, [])
})

test('computeGraphMetrics completes instantly without looping on cyclic graphs', () => {
  // 1. Direct mutual cycle: A <-> B
  const directCycleGraph: GraphData = {
    nodes: [
      { id: 'A', label: 'A', type: 'layer', status: 'pending', x: 0, y: 0, width: 0, height: 0, level: 0, slot: 0 },
      { id: 'B', label: 'B', type: 'layer', status: 'pending', x: 0, y: 0, width: 0, height: 0, level: 0, slot: 0 },
    ],
    edges: [
      { id: 'e1', source: 'A', target: 'B', type: 'prerequisite' },
      { id: 'e2', source: 'B', target: 'A', type: 'prerequisite' },
    ],
  }

  const startTime = Date.now()
  const metricsDirect = computeGraphMetrics(directCycleGraph)
  const elapsed = Date.now() - startTime

  assert.ok(elapsed < 100, `Execution took ${elapsed}ms; must complete instantly without infinite loop`)
  assert.equal(metricsDirect.nodeCount, 2)
  assert.equal(metricsDirect.edgeCount, 2)
  assert.ok(metricsDirect.criticalPath.length <= 2)
  // Ensure criticalPath contains no duplicate nodes
  const uniqueNodes = new Set(metricsDirect.criticalPath)
  assert.equal(uniqueNodes.size, metricsDirect.criticalPath.length)

  // 2. Explicit hasCycles flag
  const flaggedCycleGraph: GraphData = {
    ...directCycleGraph,
    hasCycles: true,
  }
  const metricsFlagged = computeGraphMetrics(flaggedCycleGraph)
  assert.equal(metricsFlagged.nodeCount, 2)
  assert.ok(metricsFlagged.criticalPath.length <= 2)

  // 3. Self loop: A -> A
  const selfLoopGraph: GraphData = {
    nodes: [
      { id: 'A', label: 'A', type: 'layer', status: 'pending', x: 0, y: 0, width: 0, height: 0, level: 0, slot: 0 },
    ],
    edges: [
      { id: 'e1', source: 'A', target: 'A', type: 'prerequisite' },
    ],
  }
  const selfMetrics = computeGraphMetrics(selfLoopGraph)
  assert.equal(selfMetrics.nodeCount, 1)
  assert.deepEqual(selfMetrics.criticalPath, ['A'])

  // 4. Multi-node cycle: A -> B -> C -> A
  const multiCycleGraph: GraphData = {
    nodes: [
      { id: 'A', label: 'A', type: 'layer', status: 'pending', x: 0, y: 0, width: 0, height: 0, level: 0, slot: 0 },
      { id: 'B', label: 'B', type: 'layer', status: 'pending', x: 0, y: 0, width: 0, height: 0, level: 0, slot: 0 },
      { id: 'C', label: 'C', type: 'layer', status: 'pending', x: 0, y: 0, width: 0, height: 0, level: 0, slot: 0 },
    ],
    edges: [
      { id: 'e1', source: 'A', target: 'B', type: 'prerequisite' },
      { id: 'e2', source: 'B', target: 'C', type: 'prerequisite' },
      { id: 'e3', source: 'C', target: 'A', type: 'prerequisite' },
    ],
  }
  const multiMetrics = computeGraphMetrics(multiCycleGraph)
  assert.equal(multiMetrics.nodeCount, 3)
  assert.ok(multiMetrics.criticalPath.length <= 3)
  assert.equal(new Set(multiMetrics.criticalPath).size, multiMetrics.criticalPath.length)
})

test('findNodeNeighbors accurately traces predecessors, successors, and transitive chains', () => {
  // A -> B -> C -> D
  // E -> B
  const graph: GraphData = {
    nodes: [
      { id: 'A', label: 'A', type: 'layer', status: 'completed', x: 0, y: 0, width: 0, height: 0, level: 0, slot: 0 },
      { id: 'E', label: 'E', type: 'layer', status: 'completed', x: 0, y: 0, width: 0, height: 0, level: 0, slot: 0 },
      { id: 'B', label: 'B', type: 'layer', status: 'in-progress', x: 0, y: 0, width: 0, height: 0, level: 0, slot: 0 },
      { id: 'C', label: 'C', type: 'layer', status: 'pending', x: 0, y: 0, width: 0, height: 0, level: 0, slot: 0 },
      { id: 'D', label: 'D', type: 'layer', status: 'pending', x: 0, y: 0, width: 0, height: 0, level: 0, slot: 0 },
    ],
    edges: [
      { id: 'e1', source: 'A', target: 'B', type: 'prerequisite' },
      { id: 'e2', source: 'E', target: 'B', type: 'prerequisite' },
      { id: 'e3', source: 'B', target: 'C', type: 'prerequisite' },
      { id: 'e4', source: 'C', target: 'D', type: 'prerequisite' },
    ],
  }

  const neighborsB = findNodeNeighbors(graph, 'B')
  assert.deepEqual(neighborsB.predecessors.sort(), ['A', 'E'])
  assert.deepEqual(neighborsB.successors, ['C'])
  assert.deepEqual(neighborsB.allAncestors.sort(), ['A', 'E'])
  assert.deepEqual(neighborsB.allDescendants, ['C', 'D'])

  // Root node A has no predecessors
  const neighborsA = findNodeNeighbors(graph, 'A')
  assert.equal(neighborsA.predecessors.length, 0)
  assert.deepEqual(neighborsA.allDescendants, ['B', 'C', 'D'])

  // Leaf node D has no successors
  const neighborsD = findNodeNeighbors(graph, 'D')
  assert.equal(neighborsD.successors.length, 0)
  assert.deepEqual(neighborsD.allAncestors.sort(), ['A', 'B', 'C', 'E'])
})

test('filterGraph removes non-matching nodes and dangling edges safely', () => {
  const graph: GraphData = {
    nodes: [
      { id: '1', label: 'Keep 1', type: 'layer', status: 'completed', x: 0, y: 0, width: 0, height: 0, level: 0, slot: 0 },
      { id: '2', label: 'Drop 2', type: 'milestone', status: 'pending', x: 0, y: 0, width: 0, height: 0, level: 0, slot: 0 },
      { id: '3', label: 'Keep 3', type: 'layer', status: 'completed', x: 0, y: 0, width: 0, height: 0, level: 0, slot: 0 },
    ],
    edges: [
      { id: 'e1', source: '1', target: '2', type: 'prerequisite' },
      { id: 'e2', source: '2', target: '3', type: 'prerequisite' },
      { id: 'e3', source: '1', target: '3', type: 'sequence' },
    ],
  }

  const filtered = filterGraph(graph, (n) => n.type === 'layer')
  assert.equal(filtered.nodes.length, 2)
  assert.equal(filtered.edges.length, 1)
  assert.equal(filtered.edges[0].id, 'e3', 'Only edges between kept nodes must remain')
})
