"use client";

import React, { useEffect, useState, useMemo } from "react";
import styles from "./tree.module.css";
import { CheckCircle2, Circle, ChevronLeft, Copy, Check } from "lucide-react";
import type { RawRoadmapData, RawLayerData, RawRoadmapItem } from "@/lib/storage";
import {
  collectTracks, filterLayersByTrack,
  getPriorityBadge, getHorizonBadge
} from "@/lib/roadmap-utils";
import Link from "next/link";

// ─── Badge component ──────────────────────────────────────────

const Badge = ({ label, color }: { label: string; color: string }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      fontSize: "9px",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      color,
      border: `1px solid ${color}33`,
      background: `${color}14`,
      padding: "1px 5px",
      borderRadius: "3px",
      marginLeft: "4px",
      verticalAlign: "middle",
    }}
  >
    {label}
  </span>
);

export default function TreeView() {
  const [data, setData] = useState<RawRoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTrack, setActiveTrack] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyItem = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const fetchData = async () => {
    try {
      const res = await fetch('/api/roadmap?userId=local_user');
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

  const toggleItem = async (layerId: string, itemId: string) => {
    if (!data) return;

    const newData: RawRoadmapData = JSON.parse(JSON.stringify(data));
    const layer = newData.layers.find(l => l.id === layerId);
    if (!layer) return;

    const item = layer.items.find(i => i.id === itemId);
    if (item) {
      item.status = item.status === 'pending' ? 'done' : 'pending';
      setData(newData);

      try {
        await fetch(`/api/roadmap?userId=local_user`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newData)
        });
      } catch (err) {
        console.error('Failed to sync changes:', err);
      }
    }
  };

  // ── Data-driven track grouping ──────────────────────────────

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
    <div className={styles.container}>
      <div className={styles.glowOverlay} />

      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Link href="/" className={styles.backLink}>
            <ChevronLeft size={16} /> Back
          </Link>
          <h1 className={styles.title}>Goal Tree</h1>
          <p className={styles.subtitle}>Structural visualization of your path to absolute mastery.</p>
        </div>

        <div className={styles.controls}>
          <div className={styles.trackTabs}>
            {trackLabels.map(track => (
              <button
                key={track}
                onClick={() => setActiveTrack(track)}
                className={`${styles.trackTab} ${selectedTrack === track ? styles.trackTabActive : ''}`}
              >
                {track}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className={styles.treeContainer}>
        <div className={styles.roadmapSpine}>
          {currentLayers.map((layer, idx) => {
             const cleanTitle = layer.title.includes('—')
                ? layer.title.split('—').slice(1).join('—').trim()
                : layer.title.replace(/^Layer \d+\s*(—|:)\s*/i, '').trim();

             return (
               <div key={layer.id} className={styles.roadmapSection}>
                 <div className={styles.layerNode}>
                   <div className={styles.layerNumber}>{idx + 1}</div>
                   <h2 className={styles.layerTitle}>{cleanTitle}</h2>
                 </div>

                 <div className={styles.branchesContainer}>
                   {layer.items.map(item => {
                      const priorityBadge = getPriorityBadge(item);
                      const horizonBadge = getHorizonBadge(item);

                      return (
                        <div
                          key={item.id}
                          className={`${styles.itemBoxWrapper} ${item.status === 'done' ? styles.doneWrapper : ''}`}
                          onClick={() => toggleItem(layer.id, item.id)}
                        >
                          <div className={`${styles.itemBox} ${item.status === 'done' ? styles.itemDone : ''}`}>
                            {item.status === 'done' ? (
                              <CheckCircle2 size={18} className={styles.checkIcon} />
                            ) : (
                              <Circle size={18} className={styles.pendingIcon} />
                            )}
                            <span className={styles.itemText}>{item.title}</span>
                            {priorityBadge && <Badge {...priorityBadge} />}
                            {horizonBadge && <Badge {...horizonBadge} />}
                            <button
                              className={`${styles.copyBtn} ${copiedId === item.id ? styles.copyBtnCopied : ''}`}
                              onClick={(e) => { e.stopPropagation(); copyItem(item.title, item.id); }}
                              aria-label="Copy goal"
                              title="Copy to clipboard"
                            >
                              {copiedId === item.id ? <Check size={13} /> : <Copy size={13} />}
                            </button>
                          </div>
                        </div>
                      );
                   })}
                 </div>

                 {idx < currentLayers.length - 1 && <div className={styles.spineConnector} />}
               </div>
             );
          })}
        </div>
      </div>
    </div>
  );
}
