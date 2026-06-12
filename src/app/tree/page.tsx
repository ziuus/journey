"use client";

import React, { useEffect, useState, useMemo } from "react";
import styles from "./tree.module.css";
import { CheckCircle2, Circle, ChevronLeft } from "lucide-react";
import { RoadmapData, LayerData, RoadmapItem } from "@/lib/storage";
import Link from "next/link";

export default function TreeView() {
  const [data, setData] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTrack, setActiveTrack] = useState<string>("Career & Tech");

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
    
    // Create deep copy
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
      }
    }
  };

  const groupedLayers = useMemo(() => {
    if (!data) return { "Career & Tech": [], "Health & Fitness": [] };
    const groups: Record<string, LayerData[]> = { "Career & Tech": [], "Health & Fitness": [] };
    
    data.layers.forEach(layer => {
      const layerNum = parseInt(layer.id.replace('layer', ''), 10);
      let category = (layerNum >= 8 && layerNum <= 11) ? "Health & Fitness" : "Career & Tech";
      if (!groups[category]) groups[category] = [];
      groups[category].push(layer);
    });

    return groups;
  }, [data]);

  const tracks = Object.keys(groupedLayers);
  const selectedTrack = tracks.includes(activeTrack) ? activeTrack : tracks[0];
  const currentLayers = groupedLayers[selectedTrack] || [];

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
            {tracks.map(track => (
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
                   {layer.items.map(item => (
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
