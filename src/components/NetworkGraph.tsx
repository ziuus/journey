'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Search,
  X,
  Layers,
  Flag,
  Share2,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Info,
  CheckSquare,
  Square,
  Filter,
} from 'lucide-react'
import type { Roadmap } from '@/lib/types'
import {
  type GraphViewMode,
  type GraphNode,
  type GraphEdge,
  type GraphLayoutOptions,
  buildRoadmapGraph,
  computeDagLayout,
  computeGraphMetrics,
  findNodeNeighbors,
} from '@/lib/graph'
import { toggleMilestoneStatusInRoadmap } from '@/lib/goals'

export interface NetworkGraphProps {
  roadmap: Roadmap
  onRoadmapChange?: (updatedRoadmap: Roadmap) => void
  onSelectLayer?: (layerId: string) => void
}

export function NetworkGraph({
  roadmap,
  onRoadmapChange,
  onSelectLayer,
}: NetworkGraphProps) {
  // State for view controls
  const [viewMode, setViewMode] = useState<GraphViewMode>('milestones')
  const [direction, setDirection] = useState<'LR' | 'TB'>('LR')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  // Pan & Zoom transform state
  const [transform, setTransform] = useState({ x: 40, y: 40, scale: 0.95 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // 1. Build raw graph based on view mode
  const rawGraph = useMemo(() => {
    return buildRoadmapGraph(roadmap, viewMode)
  }, [roadmap, viewMode])

  // 2. Compute DAG layout
  const layoutOptions = useMemo<Partial<GraphLayoutOptions>>(() => {
    if (viewMode === 'phases') {
      return {
        direction,
        nodeWidth: 230,
        nodeHeight: 84,
        rankSpacing: 90,
        nodeSpacing: 36,
        padding: { x: 50, y: 50 },
      }
    } else if (viewMode === 'milestones') {
      return {
        direction,
        nodeWidth: 220,
        nodeHeight: 80,
        rankSpacing: 84,
        nodeSpacing: 32,
        padding: { x: 50, y: 50 },
      }
    } else {
      return {
        direction,
        nodeWidth: 210,
        nodeHeight: 74,
        rankSpacing: 80,
        nodeSpacing: 28,
        padding: { x: 50, y: 50 },
      }
    }
  }, [viewMode, direction])

  const { graph, bounds } = useMemo(() => {
    return computeDagLayout(rawGraph, layoutOptions)
  }, [rawGraph, layoutOptions])

  // 3. Compute graph metrics
  const metrics = useMemo(() => computeGraphMetrics(rawGraph), [rawGraph])

  // 4. Neighborhood for selected node
  const selectedNeighbors = useMemo(() => {
    if (!selectedNodeId) return null
    return findNodeNeighbors(rawGraph, selectedNodeId)
  }, [rawGraph, selectedNodeId])

  // 5. Selected node object
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null
    return graph.nodes.find(n => n.id === selectedNodeId) || null
  }, [graph.nodes, selectedNodeId])

  // 6. Highlighted nodes / edges map (based on search query or hovered node)
  const highlightedNodeIds = useMemo(() => {
    const ids = new Set<string>()
    const query = searchQuery.trim().toLowerCase()

    if (query) {
      for (const node of graph.nodes) {
        if (
          node.label.toLowerCase().includes(query) ||
          node.description?.toLowerCase().includes(query) ||
          node.type.toLowerCase().includes(query) ||
          (node.metadata?.skills as string[] | undefined)?.some(s => s.toLowerCase().includes(query))
        ) {
          ids.add(node.id)
        }
      }
    } else if (hoveredNodeId) {
      ids.add(hoveredNodeId)
      const neighbors = findNodeNeighbors(rawGraph, hoveredNodeId)
      neighbors.predecessors.forEach(id => ids.add(id))
      neighbors.successors.forEach(id => ids.add(id))
    } else if (selectedNodeId) {
      ids.add(selectedNodeId)
      if (selectedNeighbors) {
        selectedNeighbors.predecessors.forEach(id => ids.add(id))
        selectedNeighbors.successors.forEach(id => ids.add(id))
      }
    }
    return ids
  }, [graph.nodes, searchQuery, hoveredNodeId, selectedNodeId, selectedNeighbors, rawGraph])

  // Fit to view calculation
  const fitToView = useCallback(() => {
    if (!containerRef.current || bounds.width === 0 || bounds.height === 0) return

    const containerWidth = containerRef.current.clientWidth
    const containerHeight = containerRef.current.clientHeight

    const padding = 60
    const availableWidth = Math.max(100, containerWidth - padding * 2)
    const availableHeight = Math.max(100, containerHeight - padding * 2)

    const scaleX = availableWidth / bounds.width
    const scaleY = availableHeight / bounds.height
    const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 1.25)

    const centerX = (containerWidth - bounds.width * newScale) / 2
    const centerY = (containerHeight - bounds.height * newScale) / 2

    setTransform({
      x: Math.round(centerX),
      y: Math.round(centerY),
      scale: parseFloat(newScale.toFixed(3)),
    })
  }, [bounds])

  // Reset transform
  const resetTransform = useCallback(() => {
    fitToView()
  }, [fitToView])

  // Zoom helpers
  const handleZoomIn = () => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(2.5, parseFloat((prev.scale * 1.2).toFixed(3))),
    }))
  }

  const handleZoomOut = () => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.3, parseFloat((prev.scale / 1.2).toFixed(3))),
    }))
  }

  // Auto-fit on initial render or view change
  useEffect(() => {
    const timer = setTimeout(() => {
      fitToView()
    }, 50)
    return () => clearTimeout(timer)
  }, [viewMode, direction, fitToView])

  // Non-passive wheel listener for smooth zoom towards cursor
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      const rect = container.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9

      setTransform(prev => {
        const nextScale = Math.min(2.5, Math.max(0.3, parseFloat((prev.scale * zoomFactor).toFixed(3))))
        if (nextScale === prev.scale) return prev

        const scaleRatio = nextScale / prev.scale
        const nextX = mouseX - (mouseX - prev.x) * scaleRatio
        const nextY = mouseY - (mouseY - prev.y) * scaleRatio

        return {
          x: Math.round(nextX),
          y: Math.round(nextY),
          scale: nextScale,
        }
      })
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  // Pointer drag event handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag with left mouse or touch
    if (e.button !== 0) return

    // Do not initiate pan if clicking inside an interactive node button
    const target = e.target as HTMLElement | SVGElement
    if (target.closest('[data-interactive="true"]')) return

    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startX: transform.x,
      startY: transform.y,
    }
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId)
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return

    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y

    setTransform(prev => ({
      ...prev,
      x: dragStartRef.current!.startX + dx,
      y: dragStartRef.current!.startY + dy,
    }))
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false)
      dragStartRef.current = null
      if (containerRef.current && containerRef.current.hasPointerCapture(e.pointerId)) {
        containerRef.current.releasePointerCapture(e.pointerId)
      }
    }
  }

  // Handle milestone status toggle directly from graph inspector
  const handleToggleMilestone = useCallback(
    (milestoneId: string) => {
      if (!onRoadmapChange) return
      const updated = toggleMilestoneStatusInRoadmap(roadmap, milestoneId)
      onRoadmapChange(updated)
    },
    [onRoadmapChange, roadmap]
  )

  // Render node icon and badges
  const getNodeTypeBadge = (node: GraphNode) => {
    switch (node.type) {
      case 'layer':
        return { label: 'Phase', bg: 'bg-primary/15 text-primary border-primary/30' }
      case 'milestone':
        return { label: 'Milestone', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30' }
      case 'project':
        return { label: 'Project', bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30' }
      case 'checkpoint':
        return { label: 'Checkpoint', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }
    }
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Top Controls Toolbar: Sleek, Ultra-Minimalist HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-card/90 border border-border/80 rounded-2xl shadow-sm backdrop-blur-md">
        {/* Left: View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-muted/40 border border-border/60 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('milestones')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
              viewMode === 'milestones'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Milestones DAG</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('phases')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
              viewMode === 'phases'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Phases & Layers</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('complete')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
              viewMode === 'complete'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Full Network</span>
          </button>
        </div>

        {/* Center: Search / Filter Nodes */}
        <div className="relative flex items-center min-w-[200px] max-w-xs flex-1">
          <Search className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Highlight node or topic..."
            className="w-full pl-8 pr-7 py-1.5 bg-background border border-border/70 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Layout Orientation, Zoom Controls, Metrics */}
        <div className="flex items-center gap-2">
          {/* Orientation Toggle */}
          <button
            type="button"
            onClick={() => setDirection(prev => (prev === 'LR' ? 'TB' : 'LR'))}
            title={`Switch to ${direction === 'LR' ? 'Vertical (TB)' : 'Horizontal (LR)'} layout`}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-muted/40 border border-border/60 hover:border-primary/40 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {direction === 'LR' ? (
              <>
                <ArrowRight className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">LR</span>
              </>
            ) : (
              <>
                <ArrowDown className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">TB</span>
              </>
            )}
          </button>

          {/* Zoom Buttons */}
          <div className="flex items-center bg-muted/40 border border-border/60 rounded-xl p-0.5">
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom Out (-)"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/70 transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono font-medium text-muted-foreground select-none">
              {Math.round(transform.scale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom In (+)"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/70 transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fit to View */}
          <button
            type="button"
            onClick={fitToView}
            title="Fit to View"
            className="p-2 rounded-xl bg-muted/40 border border-border/60 hover:border-primary/40 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Reset Transform */}
          <button
            type="button"
            onClick={resetTransform}
            title="Reset Graph Position"
            className="p-2 rounded-xl bg-muted/40 border border-border/60 hover:border-primary/40 text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area + Inspector Sidebar */}
      <div className="relative flex flex-col lg:flex-row gap-4 h-[680px] w-full select-none">
        {/* SVG Canvas Container */}
        <div
          ref={containerRef}
          role="region"
          aria-label="Interactive topological graph network canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={cn(
            'relative flex-1 h-full rounded-2xl bg-[#090d16] border border-border/70 overflow-hidden shadow-inner',
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          )}
        >
          {/* Subtle Canvas Watermark & Helper */}
          <div className="absolute top-3 left-4 z-10 pointer-events-none flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-card/70 text-muted-foreground border border-border/40 backdrop-blur-sm">
              {metrics.nodeCount} nodes • {metrics.edgeCount} deps • depth {metrics.maxDepth}
            </span>
            {searchQuery && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-primary/20 text-primary border border-primary/30">
                {highlightedNodeIds.size} matched
              </span>
            )}
          </div>

          <div className="absolute bottom-3 left-4 z-10 pointer-events-none hidden sm:block">
            <p className="text-[10px] font-mono text-muted-foreground/60 bg-card/60 px-2 py-1 rounded border border-border/30 backdrop-blur-sm">
              Drag to pan • Scroll to zoom • Click node to inspect
            </p>
          </div>

          {/* Native SVG Graph Viewport */}
          <svg
            ref={svgRef}
            className="w-full h-full block"
            style={{ touchAction: 'none' }}
          >
            <defs>
              {/* Dot Grid Pattern */}
              <pattern
                id="network-grid"
                width={24}
                height={24}
                patternUnits="userSpaceOnUse"
              >
                <circle cx={1.5} cy={1.5} r={1} fill="rgba(148, 163, 184, 0.12)" />
              </pattern>

              {/* Marker Arrowheads */}
              <marker
                id="arrow-pending"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
              </marker>
              <marker
                id="arrow-active"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0ea5e9" />
              </marker>
              <marker
                id="arrow-completed"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
              </marker>
              <marker
                id="arrow-highlighted"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
              </marker>
            </defs>

            {/* Background Grid */}
            <rect width="100%" height="100%" fill="url(#network-grid)" />

            {/* Transform Group for Pan & Zoom */}
            <g
              transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}
              className="transition-transform duration-75"
            >
              {/* Edges Layer */}
              <g className="edges-layer">
                {graph.edges.map((edge) => {
                  const isHighlighted =
                    highlightedNodeIds.size > 0 &&
                    highlightedNodeIds.has(edge.source) &&
                    highlightedNodeIds.has(edge.target)

                  const isDimmed =
                    highlightedNodeIds.size > 0 &&
                    (!highlightedNodeIds.has(edge.source) || !highlightedNodeIds.has(edge.target))

                  let strokeColor = '#334155' // default slate
                  let markerId = 'arrow-pending'

                  if (isHighlighted) {
                    strokeColor = '#38bdf8'
                    markerId = 'arrow-highlighted'
                  } else if (edge.status === 'completed') {
                    strokeColor = 'rgba(16, 185, 129, 0.7)'
                    markerId = 'arrow-completed'
                  } else if (edge.status === 'active') {
                    strokeColor = 'rgba(14, 165, 233, 0.75)'
                    markerId = 'arrow-active'
                  }

                  return (
                    <g key={edge.id} className="transition-opacity duration-200">
                      <path
                        d={edge.path || ''}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={isHighlighted ? 2.5 : edge.status === 'completed' ? 1.8 : 1.4}
                        strokeDasharray={edge.type === 'parallel' ? '5,5' : undefined}
                        markerEnd={`url(#${markerId})`}
                        opacity={isDimmed ? 0.2 : 1}
                      />
                    </g>
                  )
                })}
              </g>

              {/* Nodes Layer */}
              <g className="nodes-layer">
                {graph.nodes.map((node) => {
                  const isSelected = selectedNodeId === node.id
                  const isHovered = hoveredNodeId === node.id
                  const isMatch = highlightedNodeIds.has(node.id)
                  const isDimmed = highlightedNodeIds.size > 0 && !isMatch

                  const badge = getNodeTypeBadge(node)
                  const isCompleted = node.status === 'completed'
                  const isInProgress = node.status === 'in-progress'

                  // Border and background coloring
                  let cardBg = '#0e1626'
                  let cardBorder = '#1e293b'
                  let statusGlow = ''

                  if (isSelected) {
                    cardBorder = '#38bdf8'
                    cardBg = '#111d33'
                    statusGlow = '0 0 16px rgba(56, 189, 248, 0.35)'
                  } else if (isHovered) {
                    cardBorder = '#0ea5e9'
                    cardBg = '#0f1a2e'
                  } else if (isCompleted) {
                    cardBorder = 'rgba(16, 185, 129, 0.45)'
                  } else if (isInProgress) {
                    cardBorder = 'rgba(14, 165, 233, 0.45)'
                  }

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      data-interactive="true"
                      onClick={() => setSelectedNodeId(prev => (prev === node.id ? null : node.id))}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      className="cursor-pointer transition-opacity duration-200"
                      opacity={isDimmed ? 0.25 : 1}
                    >
                      {/* Node Card Shell */}
                      <rect
                        width={node.width}
                        height={node.height}
                        rx={12}
                        ry={12}
                        fill={cardBg}
                        stroke={cardBorder}
                        strokeWidth={isSelected ? 2 : 1.2}
                        style={{ filter: statusGlow ? `drop-shadow(${statusGlow})` : undefined }}
                      />

                      {/* Header row: Status Indicator + Type Badge */}
                      <g transform="translate(12, 14)">
                        {/* Status Circle */}
                        <circle
                          cx={4}
                          cy={4}
                          r={3.5}
                          fill={
                            isCompleted
                              ? '#10b981'
                              : isInProgress
                              ? '#0ea5e9'
                              : '#64748b'
                          }
                        />

                        {/* Node Type Pill */}
                        <text
                          x={14}
                          y={7}
                          fill="#94a3b8"
                          fontSize="9"
                          fontFamily="ui-monospace, monospace"
                          fontWeight="600"
                          letterSpacing="0.05em"
                        >
                          {badge.label.toUpperCase()}
                        </text>

                        {/* Week / Est badge on top right */}
                        {(node.week !== undefined || node.metadata?.estimatedWeeks) && (
                          <text
                            x={node.width - 24}
                            y={7}
                            textAnchor="end"
                            fill="#64748b"
                            fontSize="9"
                            fontFamily="ui-monospace, monospace"
                          >
                            {node.week !== undefined ? `W${node.week}` : `${node.metadata?.estimatedWeeks}w`}
                          </text>
                        )}
                      </g>

                      {/* Title */}
                      <g transform="translate(12, 38)">
                        <text
                          x={0}
                          y={0}
                          fill={isCompleted ? '#e2e8f0' : '#f8fafc'}
                          fontSize="11.5"
                          fontWeight="600"
                          fontFamily="system-ui, sans-serif"
                        >
                          {node.label.length > 24
                            ? node.label.slice(0, 22) + '…'
                            : node.label}
                        </text>
                      </g>

                      {/* Footer Info: Subtasks or module topics count */}
                      <g transform="translate(12, 58)">
                        {node.metadata?.subtasksTotal ? (
                          <text
                            x={0}
                            y={0}
                            fill="#64748b"
                            fontSize="9.5"
                            fontFamily="ui-monospace, monospace"
                          >
                            {node.metadata.subtasksCompleted}/{node.metadata.subtasksTotal} deliverables done
                          </text>
                        ) : node.metadata?.topicsCount ? (
                          <text
                            x={0}
                            y={0}
                            fill="#64748b"
                            fontSize="9.5"
                            fontFamily="ui-monospace, monospace"
                          >
                            {node.metadata.topicsCount} core curriculum topics
                          </text>
                        ) : (
                          <text
                            x={0}
                            y={0}
                            fill="#64748b"
                            fontSize="9.5"
                            fontFamily="ui-monospace, monospace"
                          >
                            {node.status}
                          </text>
                        )}
                      </g>
                    </g>
                  )
                })}
              </g>
            </g>
          </svg>
        </div>

        {/* Node Inspector Detail Panel: Clean, Compact, High-Density Drawer */}
        {selectedNode && (
          <aside
            aria-label="Node detail inspector"
            className="w-full lg:w-80 p-5 bg-card border border-border/80 rounded-2xl flex flex-col justify-between shadow-lg overflow-y-auto animate-fade-in shrink-0"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 border-b border-border/50 pb-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 font-semibold">
                      {selectedNode.type}
                    </span>
                    {selectedNode.week !== undefined && (
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/40">
                        Week {selectedNode.week}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-foreground leading-tight">
                    {selectedNode.label}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/40 text-xs">
                <span className="text-muted-foreground">Current State:</span>
                <span
                  className={cn(
                    'font-mono font-semibold capitalize flex items-center gap-1',
                    selectedNode.status === 'completed'
                      ? 'text-accent'
                      : selectedNode.status === 'in-progress'
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  {selectedNode.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {selectedNode.status === 'in-progress' && <Clock className="w-3.5 h-3.5" />}
                  {selectedNode.status}
                </span>
              </div>

              {/* Description */}
              {selectedNode.description && (
                <div className="text-xs text-muted-foreground leading-relaxed">
                  <p>{selectedNode.description}</p>
                </div>
              )}

              {/* Metadata details */}
              {selectedNode.metadata && (
                <div className="space-y-2 pt-1 text-xs">
                  {selectedNode.metadata.estimatedWeeks && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Duration:</span>
                      <span className="font-mono text-foreground font-medium">
                        {selectedNode.metadata.estimatedWeeks} weeks
                      </span>
                    </div>
                  )}
                  {selectedNode.metadata.subtasksTotal !== undefined && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Subtasks:</span>
                      <span className="font-mono text-foreground font-medium">
                        {selectedNode.metadata.subtasksCompleted} / {selectedNode.metadata.subtasksTotal}
                      </span>
                    </div>
                  )}
                  {selectedNode.metadata.skills && Array.isArray(selectedNode.metadata.skills) && (
                    <div>
                      <span className="text-muted-foreground text-[11px] block mb-1">Target Skills:</span>
                      <div className="flex flex-wrap gap-1">
                        {(selectedNode.metadata.skills as string[]).slice(0, 5).map((skill, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40 font-mono"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Prerequisites & Dependents */}
              {selectedNeighbors && (
                <div className="space-y-3 pt-2 border-t border-border/50 text-xs">
                  <div>
                    <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider block mb-1">
                      Direct Prerequisites ({selectedNeighbors.predecessors.length})
                    </span>
                    {selectedNeighbors.predecessors.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedNeighbors.predecessors.map((pId) => {
                          const pNode = graph.nodes.find(n => n.id === pId)
                          return (
                            <button
                              key={pId}
                              type="button"
                              onClick={() => setSelectedNodeId(pId)}
                              className="text-[10px] px-2 py-0.5 rounded-lg bg-card hover:bg-primary/20 hover:text-primary border border-border/60 transition-colors text-left"
                            >
                              ← {pNode?.label || pId}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/60 italic">
                        Root node (no prerequisites)
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider block mb-1">
                      Unlocks Downstream ({selectedNeighbors.successors.length})
                    </span>
                    {selectedNeighbors.successors.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedNeighbors.successors.map((sId) => {
                          const sNode = graph.nodes.find(n => n.id === sId)
                          return (
                            <button
                              key={sId}
                              type="button"
                              onClick={() => setSelectedNodeId(sId)}
                              className="text-[10px] px-2 py-0.5 rounded-lg bg-card hover:bg-primary/20 hover:text-primary border border-border/60 transition-colors text-left"
                            >
                              → {sNode?.label || sId}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/60 italic">
                        Terminal node
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="pt-4 border-t border-border/50 mt-4 space-y-2">
              {selectedNode.type === 'milestone' && onRoadmapChange && (
                <button
                  type="button"
                  onClick={() => handleToggleMilestone(selectedNode.id)}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm',
                    selectedNode.status === 'completed'
                      ? 'bg-muted/70 text-muted-foreground hover:bg-muted border border-border/60'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                >
                  {selectedNode.status === 'completed' ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-accent" />
                      <span>Completed (Click to Reopen)</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>Mark Milestone Completed</span>
                    </>
                  )}
                </button>
              )}

              {selectedNode.type === 'layer' && onSelectLayer && (
                <button
                  type="button"
                  onClick={() => onSelectLayer(selectedNode.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Inspect Phase Syllabus</span>
                </button>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
