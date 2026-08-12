"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import styles from "./UnifiedRoadmapView.module.css";
import {
  Network, GitCommitVertical, LayoutList, Table, Search, Pencil, CheckCircle2, Circle, ChevronRight, ChevronDown, Copy, Check, Edit2, Plus, Trash2, X, ListChecks, Maximize2, Sparkles, Layers, ZoomIn, ZoomOut, RotateCcw
} from "lucide-react";
import type { RawRoadmapData, RawLayerData, RawRoadmapItem } from "@/lib/storage";
import { collectTracks, filterLayersByTrack } from "@/lib/roadmap-utils";

type ViewMode = "graph" | "ladder" | "list" | "table";

interface BezierCable {
  id: string;
  d: string;
  isDone: boolean;
  isActive: boolean;
}

interface Props {
  initialViewMode?: ViewMode;
}

export default function UnifiedRoadmapView({ initialViewMode = "graph" }: Props) {
  const [data, setData] = useState<RawRoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTrack, setActiveTrack] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());

  // Active View Mode (persisted in localStorage)
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Pencil Edit Mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Sub-Tree Focus Modal State
  const [focusedItem, setFocusedItem] = useState<RawRoadmapItem | null>(null);
  const [focusedLayerTitle, setFocusedLayerTitle] = useState<string>("");
  const [newSubGoalText, setNewSubGoalText] = useState<string>("");

  // DOM Refs for dynamic SVG Bezier cable layout calculation in graph mode
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [cables, setCables] = useState<BezierCable[]>([]);

  const registerNodeRef = (id: string, el: HTMLDivElement | null) => {
    if (el) nodeRefs.current.set(id, el);
    else nodeRefs.current.delete(id);
  };

  // Restore preferred view mode from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("journey_preferred_view") as ViewMode | null;
      if (saved && ["graph", "ladder", "list", "table"].includes(saved)) {
        setViewMode(saved);
      }
    }
  }, []);

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("journey_preferred_view", mode);
    }
  };

  const toggleExpandNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpandLayer = (id: string) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyItem = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const fetchData = async () => {
    try {
      const res = await fetch("/api/roadmap?userId=local_user");
      const json = await res.json();
      setData(json);

      if (focusedItem) {
        for (const layer of json.layers || []) {
          const found = layer.items.find((i: RawRoadmapItem) => i.id === focusedItem.id);
          if (found) {
            setFocusedItem(found);
            break;
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch roadmap:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const persistRoadmap = async (updatedData: RawRoadmapData) => {
    setData(updatedData);
    try {
      await fetch(`/api/roadmap?userId=local_user`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
    } catch (err) {
      console.error("Failed to sync changes:", err);
    }
  };

  /**
   * Toggle item or sub-task status via PATCH API.
   * Auto-calculates parent completion & mass child status updates.
   */
  const handleToggleItemStatus = async (itemId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "done" ? "pending" : "done";
    try {
      const res = await fetch(`/api/roadmap/item?userId=local_user`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, updates: { status: nextStatus } }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to toggle item status:", err);
    }
  };

  // ── Edit Handlers ─────────────────────────────────────────────

  const handleStartEdit = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditText(currentTitle);
  };

  const handleSaveEdit = async () => {
    if (!data || !editingId || !editText.trim()) {
      setEditingId(null);
      return;
    }
    const newData: RawRoadmapData = JSON.parse(JSON.stringify(data));
    const layer = newData.layers.find((l) => l.id === editingId);
    if (layer) {
      layer.title = editText.trim();
    } else {
      for (const l of newData.layers) {
        const item = l.items.find((i) => i.id === editingId);
        if (item) {
          item.title = editText.trim();
          break;
        }
        for (const parent of l.items) {
          if (parent.children) {
            const child = parent.children.find((c) => c.id === editingId);
            if (child) {
              child.title = editText.trim();
              break;
            }
          }
        }
      }
    }
    setEditingId(null);
    setEditText("");
    void persistRoadmap(newData);
  };

  const handleDeleteLayer = async (layerId: string) => {
    if (!data || !confirm("Delete this layer?")) return;
    const newData: RawRoadmapData = JSON.parse(JSON.stringify(data));
    newData.layers = newData.layers.filter((l) => l.id !== layerId);
    void persistRoadmap(newData);
  };

  const handleAddItem = async (layerId: string) => {
    if (!data) return;
    const title = prompt("Enter new item title:");
    if (!title || !title.trim()) return;

    const newData: RawRoadmapData = JSON.parse(JSON.stringify(data));
    const layer = newData.layers.find((l) => l.id === layerId);
    if (layer) {
      layer.items.push({
        id: `item_${Date.now()}`,
        title: title.trim(),
        status: "pending",
      });
      void persistRoadmap(newData);
    }
  };

  const handleAddSubItem = async (layerId: string, parentItemId: string, customTitle?: string) => {
    if (!data) return;
    const title = customTitle || prompt("Enter sub-task title:");
    if (!title || !title.trim()) return;

    const newData: RawRoadmapData = JSON.parse(JSON.stringify(data));

    for (const l of newData.layers) {
      const parent = l.items.find((i) => i.id === parentItemId);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push({
          id: `sub_${Date.now()}`,
          title: title.trim(),
          status: "pending",
        });
        setExpandedNodes((prev) => new Set(prev).add(parentItemId));
        await persistRoadmap(newData);

        if (focusedItem && focusedItem.id === parentItemId) {
          const updatedParent = l.items.find((i) => i.id === parentItemId);
          if (updatedParent) setFocusedItem(updatedParent);
        }
        break;
      }
    }
  };

  const handleDeleteItem = async (layerId: string, itemId: string) => {
    if (!data || !confirm("Delete this item?")) return;
    const newData: RawRoadmapData = JSON.parse(JSON.stringify(data));
    const layer = newData.layers.find((l) => l.id === layerId);
    if (layer) {
      layer.items = layer.items.filter((i) => i.id !== itemId);
      void persistRoadmap(newData);
    }
  };

  const handleDeleteSubItem = async (parentItemId: string, childId: string) => {
    if (!data) return;
    const newData: RawRoadmapData = JSON.parse(JSON.stringify(data));

    for (const l of newData.layers) {
      const parent = l.items.find((i) => i.id === parentItemId);
      if (parent && parent.children) {
        parent.children = parent.children.filter((c) => c.id !== childId);
        await persistRoadmap(newData);

        if (focusedItem && focusedItem.id === parentItemId) {
          const updatedParent = l.items.find((i) => i.id === parentItemId);
          if (updatedParent) setFocusedItem(updatedParent);
        }
        break;
      }
    }
  };

  // ── Computations ─────────────────────────────────────────────

  const trackLabels = useMemo(() => {
    if (!data) return ["Career & Tech", "Health & Fitness"];
    return collectTracks(data.layers);
  }, [data]);

  const selectedTrack = trackLabels.includes(activeTrack) ? activeTrack : trackLabels[0];

  const currentLayers = useMemo(() => {
    if (!data) return [];
    return filterLayersByTrack(data.layers, selectedTrack);
  }, [data, selectedTrack]);

  const filteredLayers = useMemo(() => {
    if (!searchQuery.trim()) return currentLayers;
    const q = searchQuery.toLowerCase();
    return currentLayers.filter(
      (layer) =>
        layer.title.toLowerCase().includes(q) ||
        layer.items.some(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            (item.children && item.children.some((c) => c.title.toLowerCase().includes(q)))
        )
    );
  }, [currentLayers, searchQuery]);

  // Dynamic SVG Bezier cables calculation for graph mode
  const calculateCables = useCallback(() => {
    if (!containerRef.current || viewMode !== "graph") return;
    const container = containerRef.current;
    const cRect = container.getBoundingClientRect();
    const newCables: BezierCable[] = [];

    filteredLayers.forEach((layer) => {
      const layerEl = nodeRefs.current.get(layer.id);
      if (!layerEl) return;
      const lRect = layerEl.getBoundingClientRect();
      const parentX = lRect.left + lRect.width / 2 - cRect.left;
      const parentY = lRect.bottom - cRect.top;

      layer.items.forEach((item) => {
        const itemEl = nodeRefs.current.get(item.id);
        if (!itemEl) return;
        const iRect = itemEl.getBoundingClientRect();
        const childX = iRect.left + iRect.width / 2 - cRect.left;
        const childY = iRect.top - cRect.top;

        const midY = (parentY + childY) / 2;
        const d = `M ${parentX} ${parentY} C ${parentX} ${midY}, ${childX} ${midY}, ${childX} ${childY}`;

        newCables.push({
          id: `${layer.id}_to_${item.id}`,
          d,
          isDone: item.status === "done",
          isActive: item.status === "active",
        });

        if (expandedNodes.has(item.id) && item.children) {
          const itemBottomY = iRect.bottom - cRect.top;
          item.children.forEach((sub) => {
            const subEl = nodeRefs.current.get(sub.id);
            if (!subEl) return;
            const sRect = subEl.getBoundingClientRect();
            const subX = sRect.left + sRect.width / 2 - cRect.left;
            const subY = sRect.top - cRect.top;
            const subMidY = (itemBottomY + subY) / 2;
            const subD = `M ${childX} ${itemBottomY} C ${childX} ${subMidY}, ${subX} ${subMidY}, ${subX} ${subY}`;

            newCables.push({
              id: `${item.id}_to_${sub.id}`,
              d: subD,
              isDone: sub.status === "done",
              isActive: sub.status === "active",
            });
          });
        }
      });
    });

    setCables(newCables);
  }, [filteredLayers, expandedNodes, viewMode]);

  useEffect(() => {
    const timer = setTimeout(calculateCables, 50);
    window.addEventListener("resize", calculateCables);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculateCables);
    };
  }, [calculateCables, data, expandedNodes, viewMode, zoomLevel]);

  if (loading) return <div className={styles.loading}>Loading Roadmap Engine...</div>;

  return (
    <div className={`${styles.container} ${isEditMode ? styles.isEditMode : ""}`}>
      {/* ── TOP HEADER & UNIFIED VIEW SWITCHER ───────────────────────── */}
      <header className={styles.header}>
        <div className={styles.topRow}>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>Roadmap Engine</h1>
            <p className={styles.subtitle}>
              Unified personal goal tracker with multi-view layout switching (DAG Graph, Ladder Spine, List Cards & Table).
            </p>
          </div>

          {/* VIEW SWITCHER PILL BAR */}
          <div className={styles.viewSwitcherBar} role="tablist" aria-label="Roadmap View Selector">
            <button
              onClick={() => changeViewMode("graph")}
              className={`${styles.viewBtn} ${viewMode === "graph" ? styles.viewBtnActive : ""}`}
              role="tab"
              aria-selected={viewMode === "graph"}
              title="DAG Flowchart Node Tree View"
            >
              <Network size={16} /> DAG Graph
            </button>
            <button
              onClick={() => changeViewMode("ladder")}
              className={`${styles.viewBtn} ${viewMode === "ladder" ? styles.viewBtnActive : ""}`}
              role="tab"
              aria-selected={viewMode === "ladder"}
              title="2-Column Ladder Spine View"
            >
              <GitCommitVertical size={16} /> Ladder
            </button>
            <button
              onClick={() => changeViewMode("list")}
              className={`${styles.viewBtn} ${viewMode === "list" ? styles.viewBtnActive : ""}`}
              role="tab"
              aria-selected={viewMode === "list"}
              title="Expandable List Cards View"
            >
              <LayoutList size={16} /> List
            </button>
            <button
              onClick={() => changeViewMode("table")}
              className={`${styles.viewBtn} ${viewMode === "table" ? styles.viewBtnActive : ""}`}
              role="tab"
              aria-selected={viewMode === "table"}
              title="Structured Data Table View"
            >
              <Table size={16} /> Table
            </button>
          </div>
        </div>

        {/* CONTROLS ROW: SEARCH, TRACK TABS, PENCIL EDIT */}
        <div className={styles.controlsRow}>
          {/* Track Filter Tabs */}
          <div className={styles.trackTabs} role="tablist">
            {trackLabels.map((track) => (
              <button
                key={track}
                onClick={() => setActiveTrack(track)}
                className={`${styles.trackTab} ${selectedTrack === track ? styles.trackTabActive : ""}`}
                role="tab"
                aria-selected={selectedTrack === track}
              >
                {track}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Search Input */}
            <div className={styles.searchBox}>
              <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search roadmap..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            {/* Pencil Edit Toggle Button */}
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`${styles.pencilBtn} ${isEditMode ? styles.pencilBtnActive : ""}`}
              title={isEditMode ? "Deactivate Edit Mode" : "Activate Edit Mode"}
            >
              <Pencil size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── 1. DAG GRAPH VIEW MODE (Reference Match) ──────────────────── */}
      {viewMode === "graph" && (
        <div className={styles.graphCanvasViewport}>
          <div className={styles.canvasToolbar}>
            <button onClick={() => setZoomLevel((z) => Math.min(z + 0.1, 1.3))} className={styles.toolBtn} title="Zoom In"><ZoomIn size={15} /></button>
            <button onClick={() => setZoomLevel((z) => Math.max(z - 0.1, 0.7))} className={styles.toolBtn} title="Zoom Out"><ZoomOut size={15} /></button>
            <button onClick={() => setZoomLevel(1)} className={styles.toolBtn} title="Reset Zoom"><RotateCcw size={14} /></button>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", padding: "0 6px" }}>{Math.round(zoomLevel * 100)}%</span>
          </div>

          <div ref={containerRef} className={styles.graphContent} style={{ transform: `scale(${zoomLevel})` }}>
            <svg className={styles.svgOverlay}>
              {cables.map((cable) => (
                <path
                  key={cable.id}
                  d={cable.d}
                  className={`${styles.bezierCable} ${cable.isDone ? styles.bezierCableDone : cable.isActive ? styles.bezierCableActive : ""}`}
                />
              ))}
            </svg>

            <div className={styles.graphTreeContainer}>
              {filteredLayers.map((layer, lIdx) => {
                const cleanTitle = layer.title.includes("—")
                  ? layer.title.split("—").slice(1).join("—").trim()
                  : layer.title.replace(/^Layer \d+\s*(—|:)\s*/i, "").trim();

                const isEditingLayer = editingId === layer.id;

                return (
                  <div key={layer.id} className={styles.graphLayerSection}>
                    <div ref={(el) => registerNodeRef(layer.id, el)} className={styles.graphLayerBadge}>
                      <span className={styles.graphLayerNumber}>{lIdx + 1}</span>
                      {isEditingLayer ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className={styles.inlineEditInput}
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && void handleSaveEdit()}
                          />
                          <button onClick={handleSaveEdit} className={styles.iconBtn}><Check size={14} /></button>
                        </div>
                      ) : (
                        <span>{cleanTitle}</span>
                      )}

                      {isEditMode && !isEditingLayer && (
                        <div className={styles.hoverActions} style={{ marginLeft: "8px" }}>
                          <button onClick={() => handleStartEdit(layer.id, layer.title)} className={styles.iconBtn} title="Rename Layer"><Edit2 size={12} /></button>
                          <button onClick={() => handleAddItem(layer.id)} className={styles.iconBtn} title="Add Item"><Plus size={12} /></button>
                          <button onClick={() => handleDeleteLayer(layer.id)} className={`${styles.iconBtn} ${styles.iconBtnDanger}`} title="Delete Layer"><Trash2 size={12} /></button>
                        </div>
                      )}
                    </div>

                    <div className={styles.graphNodesRow}>
                      {layer.items.map((item, itemIdx) => {
                        const isDone = item.status === "done";
                        const hasChildren = item.children && item.children.length > 0;
                        const isExpanded = expandedNodes.has(item.id);
                        const doneChildrenCount = hasChildren ? item.children!.filter((c) => c.status === "done").length : 0;
                        const totalChildrenCount = hasChildren ? item.children!.length : 0;
                        const pct = totalChildrenCount > 0 ? Math.round((doneChildrenCount / totalChildrenCount) * 100) : (isDone ? 100 : 0);
                        const isEditingItem = editingId === item.id;

                        return (
                          <div key={`${layer.id}_${item.id}_${itemIdx}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                            <div
                              ref={(el) => registerNodeRef(item.id, el)}
                              className={`${styles.graphNodePill} ${isDone ? styles.graphNodeDone : ""} ${focusedItem?.id === item.id ? styles.graphNodeSelected : ""}`}
                              onClick={() => void handleToggleItemStatus(item.id, item.status)}
                            >
                              <div className={styles.nodeHeaderRow}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                                  {isDone ? <CheckCircle2 size={16} style={{ color: "#10b981" }} /> : <Circle size={16} style={{ color: "var(--text-muted)" }} />}
                                  {isEditingItem ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1 }} onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="text"
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        className={styles.inlineEditInput}
                                        style={{ width: "100%" }}
                                        autoFocus
                                        onKeyDown={(e) => e.key === "Enter" && void handleSaveEdit()}
                                      />
                                      <button onClick={handleSaveEdit} className={styles.iconBtn}><Check size={12} /></button>
                                    </div>
                                  ) : (
                                    <span className={`${styles.nodeTitle} ${isDone ? styles.nodeDoneTitle : ""}`}>{item.title}</span>
                                  )}
                                </div>

                                {isEditMode && !isEditingItem && (
                                  <div className={styles.hoverActions} onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => handleAddSubItem(layer.id, item.id)} className={styles.iconBtn} title="Add Sub-task"><Plus size={12} /></button>
                                    <button onClick={() => handleStartEdit(item.id, item.title)} className={styles.iconBtn} title="Rename Task"><Edit2 size={12} /></button>
                                    <button onClick={() => handleDeleteItem(layer.id, item.id)} className={`${styles.iconBtn} ${styles.iconBtnDanger}`} title="Delete Task"><Trash2 size={12} /></button>
                                  </div>
                                )}
                              </div>

                              <div className={styles.nodeFooterRow}>
                                {hasChildren && totalChildrenCount > 0 ? (
                                  <span className={styles.nodeSubTaskBadge}>
                                    <ListChecks size={11} /> {doneChildrenCount}/{totalChildrenCount}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{isDone ? "Completed" : "Pending"}</span>
                                )}

                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFocusedItem(item);
                                      setFocusedLayerTitle(cleanTitle);
                                    }}
                                    className={styles.focusSubTreeBtn}
                                    title="Focus sub-tree view"
                                  >
                                    <Maximize2 size={11} /> Detail
                                  </button>

                                  {hasChildren && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpandNode(item.id);
                                      }}
                                      className={styles.iconBtn}
                                      style={{ border: "none", background: "transparent" }}
                                    >
                                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className={styles.nodeBottomProgressBar}>
                                <div
                                  className={`${styles.nodeBottomProgressFill} ${isDone ? styles.nodeBottomProgressFillDone : ""}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>

                            {hasChildren && isExpanded && (
                              <div className={styles.graphSubTreeBranch}>
                                <div className={styles.graphSubNodesRow}>
                                  {item.children!.map((sub) => {
                                    const isSubDone = sub.status === "done";
                                    return (
                                      <div
                                        key={sub.id}
                                        ref={(el) => registerNodeRef(sub.id, el)}
                                        className={`${styles.graphSubNodePill} ${isSubDone ? styles.graphSubNodeDone : ""}`}
                                        onClick={() => void handleToggleItemStatus(sub.id, sub.status)}
                                      >
                                        {isSubDone ? <CheckCircle2 size={14} style={{ color: "#10b981" }} /> : <Circle size={14} style={{ color: "var(--text-muted)" }} />}
                                        <span>{sub.title}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 2. LADDER SPINE VIEW MODE ───────────────────────────────── */}
      {viewMode === "ladder" && (
        <div className={styles.ladderContainer}>
          {filteredLayers.map((layer, idx) => {
            const cleanTitle = layer.title.includes("—")
              ? layer.title.split("—").slice(1).join("—").trim()
              : layer.title.replace(/^Layer \d+\s*(—|:)\s*/i, "").trim();

            const isEditingLayer = editingId === layer.id;

            return (
              <div key={layer.id} className={styles.roadmapSection}>
                <div className={styles.layerNode}>
                  <div className={styles.layerNumber}>{idx + 1}</div>
                  {isEditingLayer ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className={styles.inlineEditInput}
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && void handleSaveEdit()}
                      />
                      <button onClick={handleSaveEdit} className={styles.iconBtn}><Check size={14} /></button>
                    </div>
                  ) : (
                    <h2 className={styles.layerTitle}>{cleanTitle}</h2>
                  )}

                  {isEditMode && !isEditingLayer && (
                    <div className={styles.hoverActions} style={{ marginLeft: "12px" }}>
                      <button onClick={() => handleStartEdit(layer.id, layer.title)} className={styles.iconBtn} title="Rename Layer"><Edit2 size={13} /></button>
                      <button onClick={() => handleAddItem(layer.id)} className={styles.iconBtn} title="Add Item"><Plus size={13} /></button>
                      <button onClick={() => handleDeleteLayer(layer.id)} className={`${styles.iconBtn} ${styles.iconBtnDanger}`} title="Delete Layer"><Trash2 size={13} /></button>
                    </div>
                  )}
                </div>

                <div className={styles.branchesContainer}>
                  {layer.items.map((item, itemIdx) => {
                    const isEditingItem = editingId === item.id;
                    const hasChildren = item.children && item.children.length > 0;
                    const isExpanded = expandedNodes.has(item.id);
                    const doneChildrenCount = hasChildren ? item.children!.filter((c) => c.status === "done").length : 0;
                    const totalChildrenCount = hasChildren ? item.children!.length : 0;

                    return (
                      <div
                        key={`ladder_${layer.id}_${item.id}_${itemIdx}`}
                        className={`${styles.itemBoxWrapper} ${item.status === "done" ? styles.doneWrapper : ""}`}
                        style={{ display: "flex", flexDirection: "column", width: "100%" }}
                      >
                        <div
                          className={`${styles.itemBox} ${item.status === "done" ? styles.itemDone : ""}`}
                          onClick={() => void handleToggleItemStatus(item.id, item.status)}
                          style={{ cursor: "pointer" }}
                        >
                          {item.status === "done" ? (
                            <CheckCircle2 size={18} style={{ color: "#10b981" }} />
                          ) : (
                            <Circle size={18} style={{ color: "var(--text-muted)" }} />
                          )}

                          {isEditingItem ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: "1" }} onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className={styles.inlineEditInput}
                                style={{ width: "100%" }}
                                autoFocus
                                onKeyDown={(e) => e.key === "Enter" && void handleSaveEdit()}
                              />
                              <button onClick={handleSaveEdit} className={styles.iconBtn}><Check size={14} /></button>
                            </div>
                          ) : (
                            <span className={styles.itemText}>{item.title}</span>
                          )}

                          {hasChildren && totalChildrenCount > 0 && (
                            <span className={styles.subTaskProgress}>
                              <ListChecks size={12} /> {doneChildrenCount}/{totalChildrenCount}
                            </span>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFocusedItem(item);
                              setFocusedLayerTitle(cleanTitle);
                            }}
                            className={styles.focusSubTreeBtn}
                            title="Focus sub-tree"
                          >
                            <Maximize2 size={11} /> Sub-tree
                          </button>

                          {hasChildren && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandNode(item.id);
                              }}
                              className={styles.iconBtn}
                              style={{ border: "none", background: "transparent" }}
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                          )}
                        </div>

                        {hasChildren && isExpanded && (
                          <div className={styles.subTreeContainer}>
                            {item.children!.map((child) => (
                              <div
                                key={child.id}
                                className={`${styles.subItemBox} ${child.status === "done" ? styles.subItemDone : ""}`}
                                onClick={() => void handleToggleItemStatus(child.id, child.status)}
                                style={{ cursor: "pointer" }}
                              >
                                {child.status === "done" ? <CheckCircle2 size={15} style={{ color: "#10b981" }} /> : <Circle size={15} style={{ color: "var(--text-muted)" }} />}
                                <span style={{ flex: 1 }}>{child.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {idx < filteredLayers.length - 1 && <div className={styles.spineConnector} />}
              </div>
            );
          })}
        </div>
      )}

      {/* ── 3. LIST CARDS VIEW MODE ─────────────────────────────────── */}
      {viewMode === "list" && (
        <div className={styles.listViewContainer}>
          {filteredLayers.map((layer) => {
            const isExpanded = expandedLayers.has(layer.id);
            const doneCount = layer.items.filter((i) => i.status === "done").length;
            const totalCount = layer.items.length;
            const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

            return (
              <div key={layer.id} className={styles.layerCard}>
                <div className={styles.layerCardHeader} onClick={() => toggleExpandLayer(layer.id)}>
                  <div>
                    <h3 style={{ fontSize: "16.5px", fontWeight: "700", marginBottom: "4px" }}>{layer.title}</h3>
                    <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", margin: 0 }}>{layer.description}</p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-muted)" }}>
                      {doneCount}/{totalCount} done ({pct}%)
                    </span>
                    {isExpanded ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className={styles.itemsList}>
                    {layer.items.map((item, itemIdx) => {
                      const isDone = item.status === "done";
                      return (
                        <div key={`list_${layer.id}_${item.id}_${itemIdx}`} className={styles.listItemRow} onClick={() => void handleToggleItemStatus(item.id, item.status)}>
                          {isDone ? <CheckCircle2 size={18} style={{ color: "#10b981" }} /> : <Circle size={18} style={{ color: "var(--text-muted)" }} />}
                          <span style={{ fontSize: "14.5px", fontWeight: "500", textDecoration: isDone ? "line-through" : "none", flex: 1 }}>{item.title}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFocusedItem(item);
                              setFocusedLayerTitle(layer.title);
                            }}
                            className={styles.focusSubTreeBtn}
                          >
                            <Maximize2 size={11} /> Detail
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── 4. TABLE VIEW MODE ───────────────────────────────────────── */}
      {viewMode === "table" && (
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Layer</th>
                <th>Goal Title</th>
                <th>Status</th>
                <th>Sub-Tasks</th>
                <th>Priority</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLayers.flatMap((layer) =>
                layer.items.map((item, itemIdx) => {
                  const isDone = item.status === "done";
                  const subTasks = item.children || [];
                  const subDone = subTasks.filter((s) => s.status === "done").length;

                  return (
                    <tr key={`table_${layer.id}_${item.id}_${itemIdx}`}>
                      <td style={{ fontWeight: "700", color: "var(--text-muted)", fontSize: "12.5px" }}>
                        {layer.title.split("—")[0].trim()}
                      </td>
                      <td style={{ fontWeight: "600" }}>{item.title}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${isDone ? styles.statusDone : item.status === "active" ? styles.statusActive : styles.statusPending}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        {subTasks.length > 0 ? (
                          <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--accent)" }}>
                            {subDone}/{subTasks.length} done
                          </span>
                        ) : (
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>
                      <td style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "var(--text-muted)" }}>
                        {item.priority || "Normal"}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <button onClick={() => void handleToggleItemStatus(item.id, item.status)} className={styles.iconBtn} title="Toggle status">
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => {
                              setFocusedItem(item);
                              setFocusedLayerTitle(layer.title);
                            }}
                            className={styles.focusSubTreeBtn}
                          >
                            <Maximize2 size={11} /> Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── FOCUSED SUB-TREE VIEW MODAL ───────────────────────────────── */}
      {focusedItem && (
        <div className={styles.modalOverlay} onClick={() => setFocusedItem(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.breadcrumbs}>
                <span>Roadmap Engine</span>
                <span>/</span>
                <span>{selectedTrack}</span>
                <span>/</span>
                <span className={styles.breadcrumbItem}>{focusedLayerTitle || "Layer"}</span>
              </div>

              <div className={styles.modalTitleRow}>
                <h2 className={styles.modalTitle}>{focusedItem.title}</h2>
                <button onClick={() => setFocusedItem(null)} className={styles.closeBtn} title="Close Sub-Tree View">
                  <X size={18} />
                </button>
              </div>

              {/* Progress Summary Bar */}
              {(() => {
                const subTasks = focusedItem.children || [];
                const doneCount = subTasks.filter((c) => c.status === "done").length;
                const totalCount = subTasks.length;
                const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : (focusedItem.status === "done" ? 100 : 0);

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600" }}>
                      <span>Sub-Tree Progress</span>
                      <span>{doneCount} of {totalCount} completed ({pct}%)</span>
                    </div>
                    <div className={styles.progressTrack}>
                      <div className={styles.progressBar} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className={styles.modalBody}>
              {focusedItem.children && focusedItem.children.length > 0 && focusedItem.children.every((c) => c.status === "done") && (
                <div className={styles.masteredBanner}>
                  <Sparkles size={18} />
                  <span>Goal Mastered! All sub-tasks under this tree have been completed.</span>
                </div>
              )}

              <div style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Layers size={14} /> Sub-Tasks & Detailed Roadmap
              </div>

              <div className={styles.subGoalList}>
                {(!focusedItem.children || focusedItem.children.length === 0) ? (
                  <p style={{ fontSize: "14px", color: "var(--text-muted)", fontStyle: "italic", padding: "16px 0" }}>
                    No sub-tasks added yet. Add sub-goals below to build out this goal's detailed subtree!
                  </p>
                ) : (
                  focusedItem.children.map((child) => {
                    const isDone = child.status === "done";

                    return (
                      <div key={child.id} className={`${styles.subGoalCard} ${isDone ? styles.subGoalDone : ""}`}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                          <button
                            onClick={() => void handleToggleItemStatus(child.id, child.status)}
                            style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}
                          >
                            {isDone ? <CheckCircle2 size={20} style={{ color: "#10b981" }} /> : <Circle size={20} style={{ color: "var(--text-muted)" }} />}
                          </button>

                          <span style={{ fontSize: "14.5px", fontWeight: "500", color: "var(--text-primary)" }}>{child.title}</span>
                        </div>

                        <button onClick={() => void handleDeleteSubItem(focusedItem.id, child.id)} className={`${styles.iconBtn} ${styles.iconBtnDanger}`} title="Delete sub-task">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                className={styles.addSubGoalRow}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newSubGoalText.trim()) {
                    void handleAddSubItem("", focusedItem.id, newSubGoalText);
                    setNewSubGoalText("");
                  }
                }}
              >
                <input
                  type="text"
                  placeholder="Add new sub-goal to this tree..."
                  value={newSubGoalText}
                  onChange={(e) => setNewSubGoalText(e.target.value)}
                  className={styles.addSubGoalInput}
                />
                <button type="submit" className={styles.addSubGoalSubmit}>
                  <Plus size={15} /> Add Sub-Goal
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
