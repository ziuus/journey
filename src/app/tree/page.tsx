"use client";

import React, { useEffect, useState, useMemo } from "react";
import styles from "./tree.module.css";
import { CheckCircle2, Circle } from "lucide-react";
import { RoadmapData, LayerData } from "@/lib/storage";

export default function TreeView() {
  const [data, setData] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTrack, setActiveTrack] = useState<string>("Career & Tech");

  const fetchRoadmap = async () => {
    try {
      const res = await fetch(`/api/roadmap?userId=local_user`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch roadmap:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRoadmap();
  }, []);

  const toggleItem = async (layerId: string, itemId: string) => {
    if (!data) return;
    const newData: RoadmapData = JSON.parse(JSON.stringify(data));
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
        void fetchRoadmap();
      }
    }
  };

  const groupedLayers = useMemo(() => {
    if (!data) return {};
    const groups: Record<string, LayerData[]> = { "Career & Tech": [], "Health & Fitness": [], "Other": [] };
    
    data.layers.forEach(layer => {
      const layerNum = parseInt(layer.id.replace('layer', ''), 10);
      let category = (layerNum >= 8 && layerNum <= 11) ? "Health & Fitness" : (layer.id.startsWith('layer') ? "Career & Tech" : "Other");
      groups[category].push(layer);
    });

    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => parseInt(a.id.replace('layer', ''), 10) - parseInt(b.id.replace('layer', ''), 10));
      if (groups[key].length === 0) delete groups[key];
    });
    
    return groups;
  }, [data]);

  const tracks = Object.keys(groupedLayers);
  const selectedTrack = tracks.includes(activeTrack) ? activeTrack : tracks[0];
  const currentLayers = groupedLayers[selectedTrack] || [];

  if (loading) return <div className={styles.loading}>Initializing Mastery Flow...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Goal Tree</h1>
          <p className={styles.subtitle}>An interactive structural graph of your absolute progression.</p>
        </div>

        <div className={styles.controls}>
          <div className={styles.trackTabs}>
            {tracks.map(t => (
              <button key={t} onClick={() => setActiveTrack(t)} className={`${styles.trackTab} ${selectedTrack === t ? styles.trackTabActive : ''}`}>
                {t}
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
                    <h3 className={styles.layerTitle}>{cleanTitle}</h3>
                 </div>
                 
                 <div className={styles.branchesContainer}>
                   {layer.items.map((item) => (
                     <div 
                       key={item.id} 
                       className={`${styles.itemBoxWrapper} ${item.status === 'done' ? styles.doneWrapper : ''}`}
                       onClick={() => toggleItem(layer.id, item.id)}
                     >
                       <div className={`${styles.itemBox} ${item.status === 'done' ? styles.itemDone : ''}`}>
                         {item.status === 'done' ? <CheckCircle2 size={16} className={styles.checkIcon} /> : <Circle size={16} className={styles.pendingIcon} />}
                         <span className={styles.itemText}>{item.title}</span>
                       </div>
                     </div>
                   ))}
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
