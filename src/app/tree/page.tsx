"use client";

import React, { useEffect, useState, useMemo } from "react";
import styles from "./tree.module.css";
import {
  CheckCircle2, Circle, ChevronLeft, Copy, Check, Pencil, Edit2, Plus, Trash2, X
} from "lucide-react";
import type { RawRoadmapData, RawLayerData, RawRoadmapItem } from "@/lib/storage";
import { collectTracks, filterLayersByTrack } from "@/lib/roadmap-utils";
import Link from "next/link";

export default function TreeView() {
  const [data, setData] = useState<RawRoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTrack, setActiveTrack] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pencil Edit Mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

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

  const toggleItem = async (layerId: string, itemId: string) => {
    if (!data) return;

    const newData: RawRoadmapData = JSON.parse(JSON.stringify(data));
    const layer = newData.layers.find((l) => l.id === layerId);
    if (!layer) return;

    const item = layer.items.find((i) => i.id === itemId);
    if (item) {
      item.status = item.status === "pending" ? "done" : "pending";
      void persistRoadmap(newData);
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

  const handleDeleteItem = async (layerId: string, itemId: string) => {
    if (!data) return;
    const newData: RawRoadmapData = JSON.parse(JSON.stringify(data));
    const layer = newData.layers.find((l) => l.id === layerId);
    if (layer) {
      layer.items = layer.items.filter((i) => i.id !== itemId);
      void persistRoadmap(newData);
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

  if (loading) return <div className={styles.loading}>Generating Architecture...</div>;

  return (
    <div className={`${styles.container} ${isEditMode ? styles.isEditMode : ""}`}>
      <header className={styles.header}>
        <div className={styles.topRow}>
          <Link href="/" className={styles.backLink}>
            <ChevronLeft size={16} /> Back
          </Link>
        </div>

        <div className={styles.controlsRow}>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>Goal Tree</h1>
            <p className={styles.subtitle}>Structural visualization of your path to absolute mastery.</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* PENCIL TOGGLE BUTTON */}
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`${styles.pencilToggleBtn} ${isEditMode ? styles.pencilToggleBtnActive : ""}`}
              title={isEditMode ? "Deactivate Edit Mode" : "Activate Edit Mode"}
            >
              <Pencil size={18} />
            </button>
          </div>
        </div>

        {/* Track Pills Bar */}
        <div className={styles.trackTabs}>
          {trackLabels.map((track) => (
            <button
              key={track}
              onClick={() => setActiveTrack(track)}
              className={`${styles.trackTab} ${selectedTrack === track ? styles.trackTabActive : ""}`}
            >
              {track}
            </button>
          ))}
        </div>
      </header>

      <div className={styles.treeContainer}>
        <div className={styles.roadmapSpine}>
          {currentLayers.map((layer, idx) => {
            const cleanTitle = layer.title.includes("—")
              ? layer.title.split("—").slice(1).join("—").trim()
              : layer.title.replace(/^Layer \d+\s*(—|:)\s*/i, "").trim();

            const isEditingLayer = editingId === layer.id;

            return (
              <div key={layer.id} className={styles.roadmapSection}>
                {/* Layer Node Header */}
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

                  {/* HOVER EDIT ACTIONS FOR LAYER NODE (Only visible in Edit Mode on hover) */}
                  {isEditMode && !isEditingLayer && (
                    <div className={styles.hoverActions} style={{ marginLeft: "12px" }}>
                      <button onClick={() => handleStartEdit(layer.id, layer.title)} className={styles.iconBtn} title="Rename Node"><Edit2 size={13} /></button>
                      <button onClick={() => handleAddItem(layer.id)} className={styles.iconBtn} title="Add Item"><Plus size={13} /></button>
                      <button onClick={() => handleDeleteLayer(layer.id)} className={`${styles.iconBtn} ${styles.iconBtnDanger}`} title="Delete Node"><Trash2 size={13} /></button>
                    </div>
                  )}
                </div>

                {/* Branches Container */}
                <div className={styles.branchesContainer}>
                  {layer.items.map((item) => {
                    const isEditingItem = editingId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`${styles.itemBoxWrapper} ${item.status === "done" ? styles.doneWrapper : ""}`}
                      >
                        <div
                          className={`${styles.itemBox} ${item.status === "done" ? styles.itemDone : ""}`}
                          onClick={() => toggleItem(layer.id, item.id)}
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

                          {/* HOVER EDIT ACTIONS FOR ITEM (Only visible in Edit Mode on hover) */}
                          {isEditMode && !isEditingItem ? (
                            <div className={styles.hoverActions} onClick={(e) => e.stopPropagation()}>
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
                              aria-label="Copy goal"
                              title="Copy to clipboard"
                            >
                              {copiedId === item.id ? <Check size={13} /> : <Copy size={13} />}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {idx < currentLayers.length - 1 && <div className={styles.spineConnector} />}
              </div>
            );
          })}

          {/* ADD NEW LAYER NODE BUTTON IN TREE VIEW (Only in Edit Mode) */}
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
    </div>
  );
}
