"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import styles from "./tree.module.css";
import {
  CheckCircle2, Circle, ChevronLeft, ChevronRight, ChevronDown, Copy, Check, Pencil, Edit2, Plus, Trash2, X, ListChecks, Maximize2, Sparkles, Layers, Network, ListFilter, ZoomIn, ZoomOut, RotateCcw
} from "lucide-react";
import type { RawRoadmapData, RawLayerData, RawRoadmapItem } from "@/lib/storage";
import { collectTracks, filterLayersByTrack } from "@/lib/roadmap-utils";
import Link from "next/link";

interface BezierCable {
  id: string;
  d: string;
  isDone: boolean;
  isActive: boolean;
}

export default function TreeView() {
  const [data, setData] = useState<RawRoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTrack, setActiveTrack] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // View Mode: 'graph' (DAG Node Tree with Bezier Cables) vs 'spine' (List view)
  const [viewMode, setViewMode] = useState<"graph" | "spine">("graph");
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Pencil Edit Mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Sub-Tree Focus Modal State
  const [focusedItem, setFocusedItem] = useState<RawRoadmapItem | null>(null);
  const [focusedLayerTitle, setFocusedLayerTitle] = useState<string>("");
  const [newSubGoalText, setNewSubGoalText] = useState<string>("");

  // DOM Refs for dynamic SVG Bezier cable layout calculation
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [cables, setCables] = useState<BezierCable[]>([]);

  const registerNodeRef = (id: string, el: HTMLDivElement | null) => {
    if (el) nodeRefs.current.set(id, el);
    else nodeRefs.current.delete(id);
  };

  const toggleExpandNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
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
   * Leverages backend recursive parent auto-completion & mass child completion.
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

  // ── Edit Mode Handlers ────────────────────────────────────────

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
    if (!data || !confirm("Delete this entire layer node?")) return;
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
    if (!data || !confirm("Delete this task node?")) return;
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

  const handleAddLayer = async () => {
    if (!data) return;
    const title = prompt("Enter new layer node title:");
    if (!title || !title.trim()) return;

    const newData: RawRoadmapData = JSON.parse(JSON.stringify(data));
    const newLayer: RawLayerData = {
      id: `layer_${Date.now()}`,
      title: title.trim(),
      description: "Custom tree node",
      items: [],
      track: selectedTrack || "General",
    };
    newData.layers.push(newLayer);
    void persistRoadmap(newData);
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

  // Dynamic SVG Bezier cable calculations between graph nodes
  const calculateCables = useCallback(() => {
    if (!containerRef.current || viewMode !== "graph") return;
    const container = containerRef.current;
    const cRect = container.getBoundingClientRect();
    const newCables: BezierCable[] = [];

    currentLayers.forEach((layer) => {
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

        // If sub-tasks expanded, connect item to child sub-nodes
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
  }, [currentLayers, expandedNodes, viewMode]);

  useEffect(() => {
    const timer = setTimeout(calculateCables, 50);
    window.addEventListener("resize", calculateCables);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculateCables);
    };
  }, [calculateCables, data, expandedNodes, viewMode, zoomLevel]);

  if (loading) return <div className={styles.loading}>Generating Architecture...</div>;

  return (
    <div className={`${styles.container} ${isEditMode ? styles.isEditMode : ""}`}>
      <header className={styles.header}>
        <div className={styles.topRow}>
          <Link href="/" className={styles.backLink}>
            <ChevronLeft size={16} /> Back to Overview
          </Link>

          {/* View Mode Toggle: Graph Node Tree vs Spine View */}
          <div className={styles.viewModeToggle}>
            <button
              onClick={() => setViewMode("graph")}
              className={`${styles.viewModeBtn} ${viewMode === "graph" ? styles.viewModeBtnActive : ""}`}
            >
              <Network size={15} /> Graph Node View
            </button>
            <button
              onClick={() => setViewMode("spine")}
              className={`${styles.viewModeBtn} ${viewMode === "spine" ? styles.viewModeBtnActive : ""}`}
            >
              <ListFilter size={15} /> Spine List View
            </button>
          </div>
        </div>

        <div className={styles.controlsRow}>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>Goal Tree</h1>
            <p className={styles.subtitle}>Interactive DAG graph visualization with smooth Bezier cables and deep sub-tree detailing.</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* PENCIL TOGGLE BUTTON */}
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`${styles.pencilToggleBtn} ${isEditMode ? styles.pencilToggleBtnActive : ""}`}
              title={isEditMode ? "Deactivate Edit Mode" : "Activate Edit Mode"}
              aria-label="Toggle Edit Mode"
            >
              <Pencil size={18} />
            </button>
          </div>
        </div>

        {/* Track Pills Bar */}
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
      </header>

      {/* ── MODE 1: DAG GRAPH NODE TREE VIEW (Reference Match) ───────────────── */}
      {viewMode === "graph" ? (
        <div className={styles.graphCanvasViewport}>
          {/* Floating Canvas Controls */}
          <div className={styles.canvasToolbar}>
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.1, 1.3))}
              className={styles.toolBtn}
              title="Zoom In"
            >
              <ZoomIn size={15} />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.1, 0.7))}
              className={styles.toolBtn}
              title="Zoom Out"
            >
              <ZoomOut size={15} />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className={styles.toolBtn}
              title="Reset Zoom"
            >
              <RotateCcw size={14} />
            </button>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", padding: "0 6px" }}>
              {Math.round(zoomLevel * 100)}%
            </span>
          </div>

          <div
            ref={containerRef}
            className={styles.graphContent}
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Background SVG Cable Overlay */}
            <svg className={styles.svgOverlay}>
              {cables.map((cable) => (
                <path
                  key={cable.id}
                  d={cable.d}
                  className={`${styles.bezierCable} ${cable.isDone ? styles.bezierCableDone : cable.isActive ? styles.bezierCableActive : ""}`}
                />
              ))}
            </svg>

            {/* Hierarchical Node Tree Layout */}
            <div className={styles.graphTreeContainer}>
              {currentLayers.map((layer, lIdx) => {
                const cleanTitle = layer.title.includes("—")
                  ? layer.title.split("—").slice(1).join("—").trim()
                  : layer.title.replace(/^Layer \d+\s*(—|:)\s*/i, "").trim();

                const isEditingLayer = editingId === layer.id;

                return (
                  <div key={layer.id} className={styles.graphLayerSection}>
                    {/* Layer Header Badge */}
                    <div
                      ref={(el) => registerNodeRef(layer.id, el)}
                      className={styles.graphLayerBadge}
                    >
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

                    {/* Nodes Row for this Layer */}
                    <div className={styles.graphNodesRow}>
                      {layer.items.map((item) => {
                        const isDone = item.status === "done";
                        const hasChildren = item.children && item.children.length > 0;
                        const isExpanded = expandedNodes.has(item.id);
                        const doneChildrenCount = hasChildren ? item.children!.filter((c) => c.status === "done").length : 0;
                        const totalChildrenCount = hasChildren ? item.children!.length : 0;
                        const pct = totalChildrenCount > 0 ? Math.round((doneChildrenCount / totalChildrenCount) * 100) : (isDone ? 100 : 0);
                        const isEditingItem = editingId === item.id;

                        return (
                          <div
                            key={item.id}
                            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}
                          >
                            {/* Sleek Node Pill Card */}
                            <div
                              ref={(el) => registerNodeRef(item.id, el)}
                              className={`${styles.graphNodePill} ${isDone ? styles.graphNodeDone : ""} ${focusedItem?.id === item.id ? styles.graphNodeSelected : ""}`}
                              onClick={() => void handleToggleItemStatus(item.id, item.status)}
                            >
                              <div className={styles.nodeHeaderRow}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                                  {isDone ? (
                                    <CheckCircle2 size={16} className={styles.checkIcon} />
                                  ) : (
                                    <Circle size={16} className={styles.pendingIcon} />
                                  )}
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
                                    <span className={`${styles.nodeTitle} ${isDone ? styles.nodeDoneTitle : ""}`}>
                                      {item.title}
                                    </span>
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
                                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                    {isDone ? "Completed" : "Pending"}
                                  </span>
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
                                      title={isExpanded ? "Collapse branch" : "Expand branch"}
                                      style={{ border: "none", background: "transparent" }}
                                    >
                                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Bottom Progress Bar Line (Reference Match) */}
                              <div className={styles.nodeBottomProgressBar}>
                                <div
                                  className={`${styles.nodeBottomProgressFill} ${isDone ? styles.nodeBottomProgressFillDone : ""}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>

                            {/* Sub-Tree Branch (when expanded) */}
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
                                        {isSubDone ? (
                                          <CheckCircle2 size={14} className={styles.checkIcon} />
                                        ) : (
                                          <Circle size={14} className={styles.pendingIcon} />
                                        )}
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
      ) : (
        /* ── MODE 2: STRUCTURED SPINE LIST VIEW ────────────────────────── */
        <div className={styles.treeContainer}>
          <div className={styles.roadmapSpine}>
            {currentLayers.map((layer, idx) => {
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
                        <button onClick={() => setEditingId(null)} className={styles.iconBtn}><X size={14} /></button>
                      </div>
                    ) : (
                      <h2 className={styles.layerTitle}>{cleanTitle}</h2>
                    )}

                    {isEditMode && !isEditingLayer && (
                      <div className={styles.hoverActions} style={{ marginLeft: "12px" }}>
                        <button onClick={() => handleStartEdit(layer.id, layer.title)} className={styles.iconBtn} title="Rename Node"><Edit2 size={13} /></button>
                        <button onClick={() => handleAddItem(layer.id)} className={styles.iconBtn} title="Add Item"><Plus size={13} /></button>
                        <button onClick={() => handleDeleteLayer(layer.id)} className={`${styles.iconBtn} ${styles.iconBtnDanger}`} title="Delete Node"><Trash2 size={13} /></button>
                      </div>
                    )}
                  </div>

                  <div className={styles.branchesContainer}>
                    {layer.items.map((item) => {
                      const isEditingItem = editingId === item.id;
                      const hasChildren = item.children && item.children.length > 0;
                      const isExpanded = expandedNodes.has(item.id);
                      const doneChildrenCount = hasChildren ? item.children!.filter((c) => c.status === "done").length : 0;
                      const totalChildrenCount = hasChildren ? item.children!.length : 0;

                      return (
                        <div
                          key={item.id}
                          className={`${styles.itemBoxWrapper} ${item.status === "done" ? styles.doneWrapper : ""}`}
                          style={{ display: "flex", flexDirection: "column", width: "100%" }}
                        >
                          <div
                            className={`${styles.itemBox} ${item.status === "done" ? styles.itemDone : ""}`}
                            onClick={() => void handleToggleItemStatus(item.id, item.status)}
                            style={{ cursor: "pointer" }}
                          >
                            {item.status === "done" ? (
                              <CheckCircle2 size={18} className={styles.checkIcon} />
                            ) : (
                              <Circle size={18} className={styles.pendingIcon} />
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
                                <button onClick={() => setEditingId(null)} className={styles.iconBtn}><X size={14} /></button>
                              </div>
                            ) : (
                              <span className={styles.itemText}>{item.title}</span>
                            )}

                            {hasChildren && totalChildrenCount > 0 && (
                              <span className={styles.subTaskProgress}>
                                <ListChecks size={12} />
                                {doneChildrenCount}/{totalChildrenCount}
                              </span>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFocusedItem(item);
                                setFocusedLayerTitle(cleanTitle);
                              }}
                              className={styles.focusSubTreeBtn}
                              title="Focus into Sub-Tree View"
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

                            {isEditMode && !isEditingItem ? (
                              <div className={styles.hoverActions} onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => handleAddSubItem(layer.id, item.id)} className={styles.iconBtn} title="Add Sub-task"><Plus size={13} /></button>
                                <button onClick={() => handleStartEdit(item.id, item.title)} className={styles.iconBtn} title="Rename Task"><Edit2 size={13} /></button>
                                <button onClick={() => handleDeleteItem(layer.id, item.id)} className={`${styles.iconBtn} ${styles.iconBtnDanger}`} title="Delete Task"><Trash2 size={13} /></button>
                              </div>
                            ) : (
                              <button
                                className={`${styles.copyBtn} ${copiedId === item.id ? styles.copyBtnCopied : ""}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyItem(item.title, item.id);
                                }}
                                title="Copy to clipboard"
                              >
                                {copiedId === item.id ? <Check size={13} /> : <Copy size={13} />}
                              </button>
                            )}
                          </div>

                          {(isExpanded || (isEditMode && hasChildren)) && hasChildren && (
                            <div className={styles.subTreeContainer}>
                              {item.children!.map((child) => {
                                return (
                                  <div
                                    key={child.id}
                                    className={`${styles.subItemBox} ${child.status === "done" ? styles.subItemDone : ""}`}
                                    onClick={() => void handleToggleItemStatus(child.id, child.status)}
                                    style={{ cursor: "pointer" }}
                                  >
                                    {child.status === "done" ? (
                                      <CheckCircle2 size={15} className={styles.checkIcon} />
                                    ) : (
                                      <Circle size={15} className={styles.pendingIcon} />
                                    )}
                                    <span style={{ flex: 1 }}>{child.title}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {idx < currentLayers.length - 1 && <div className={styles.spineConnector} />}
                </div>
              );
            })}

            {isEditMode && (
              <button
                onClick={handleAddLayer}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  border: "2px dashed var(--border-color)",
                  background: "transparent",
                  color: "var(--text-primary)",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  marginTop: "40px",
                  zIndex: "5",
                }}
              >
                <Plus size={16} /> Add New Layer Node
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── FOCUSED SUB-TREE VIEW MODAL ───────────────────────────────── */}
      {focusedItem && (
        <div className={styles.modalOverlay} onClick={() => setFocusedItem(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.breadcrumbs}>
                <span>Goal Tree</span>
                <span>/</span>
                <span>{selectedTrack}</span>
                <span>/</span>
                <span className={styles.breadcrumbItem}>{focusedLayerTitle || "Layer"}</span>
              </div>

              <div className={styles.modalTitleRow}>
                <h2 className={styles.modalTitle}>{focusedItem.title}</h2>
                <button
                  onClick={() => setFocusedItem(null)}
                  className={styles.closeBtn}
                  title="Close Sub-Tree View"
                >
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
                      <span>Sub-Tree Completion</span>
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
                      <div
                        key={child.id}
                        className={`${styles.subGoalCard} ${isDone ? styles.subGoalDone : ""}`}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                          <button
                            onClick={() => void handleToggleItemStatus(child.id, child.status)}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              padding: 0,
                            }}
                          >
                            {isDone ? (
                              <CheckCircle2 size={20} className={styles.checkIcon} />
                            ) : (
                              <Circle size={20} className={styles.pendingIcon} />
                            )}
                          </button>

                          <span style={{ fontSize: "14.5px", fontWeight: "500", color: "var(--text-primary)" }}>
                            {child.title}
                          </span>
                        </div>

                        <button
                          onClick={() => void handleDeleteSubItem(focusedItem.id, child.id)}
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          title="Delete sub-task"
                        >
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
