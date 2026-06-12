"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import mStyles from "./metrics.module.css";
import { Search, Target, CheckCircle2, Zap, ChevronRight, ChevronUp, Cpu, Brain, Network, Blocks, Infinity, Bot, ShieldCheck } from "lucide-react";

interface RoadmapItem {
  id: string;
  title: string;
  status: 'pending' | 'done';
}

interface LayerData {
  id: string;
  title: string;
  description: string;
  items: RoadmapItem[];
}

interface RoadmapData {
  layers: LayerData[];
  milestones: RoadmapItem[];
}

const HighlightText = ({ text, query }: { text: string, query: string }) => {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className={styles.highlight}>{part}</span>
        ) : (
          part
        )
      )}
    </>
  );
};

const UserMetrics = ({ data }: { data: RoadmapData }) => {
  const totalItems = data.layers.reduce((acc, l) => acc + l.items.length, 0);
  const doneItems = data.layers.reduce((acc, l) => acc + l.items.filter(i => i.status === 'done').length, 0);
  const progressPercent = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  const layerStats = data.layers.map(l => ({
    id: l.id,
    title: l.title.includes('—') ? l.title.split('—').slice(1).join('—').trim() : l.title.replace(/^Layer \d+\s*(—|:)\s*/i, '').trim(),
    phase: l.title.split('—')[0].trim(),
    percent: Math.round((l.items.filter(i => i.status === 'done').length / l.items.length) * 100)
  }));

  const activeLayers = layerStats.filter(s => s.percent < 100).slice(0, 3);
  const currentPhase = activeLayers[0] || { phase: "Mastered", title: "Complete" };

  const skills = [
    { label: "Systems", val: layerStats[0]?.percent || 0 },
    { label: "Math/ML", val: layerStats[1]?.percent || 0 },
    { label: "AI Arch", val: layerStats[2]?.percent || 0 },
    { label: "Web3", val: layerStats[3]?.percent || 0 },
    { label: "Frontier", val: layerStats[4]?.percent || 0 },
    { label: "Agents", val: layerStats[5]?.percent || 0 },
    { label: "Security", val: layerStats[6]?.percent || 0 },
    { label: "Basics", val: Math.round(((layerStats[7]?.percent || 0) + (layerStats[8]?.percent || 0) + (layerStats[9]?.percent || 0) + (layerStats[10]?.percent || 0)) / 4) || 0 },
  ];

  const radarPoints = skills.map((s, i) => {
    const angle = (i / skills.length) * 2 * Math.PI - Math.PI / 2;
    const r = (s.val / 100) * 40 + 5;
    return `${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`;
  }).join(' ');

  return (
    <div className={mStyles.metricsHub}>
      <div className={mStyles.hudGrid}>
        <div className={mStyles.hudCard}>
          <div className={mStyles.cardLabel}>
            <span>Overall Progress</span>
            <Target size={14} />
          </div>
          <div className={mStyles.vitalityValue}>
            <span className={mStyles.bigPercent}>{progressPercent}</span>
            <span className={mStyles.percentSymbol}>%</span>
          </div>
          <div className={mStyles.progressHUD}>
            <div className={mStyles.progressBar} style={{ width: `${progressPercent}%` }} />
          </div>
          <div className={mStyles.statRow}>
            <div className={mStyles.statItem}>
              <span className={mStyles.statVal}>{doneItems}</span>
              <span className={mStyles.statLab}>Completed</span>
            </div>
            <div className={mStyles.statItem}>
              <span className={mStyles.statVal}>{totalItems - doneItems}</span>
              <span className={mStyles.statLab}>Remaining</span>
            </div>
          </div>
        </div>

        <div className={mStyles.hudCard}>
          <div className={mStyles.cardLabel}>
            <span>Skill Vector</span>
            <Brain size={14} />
          </div>
          <div className={mStyles.radarContainer}>
            <svg viewBox="0 0 100 100" className={mStyles.radarSvg}>
              <circle cx="50" cy="50" r="45" className={mStyles.radarGrid} />
              <circle cx="50" cy="50" r="30" className={mStyles.radarGrid} />
              <circle cx="50" cy="50" r="15" className={mStyles.radarGrid} />
              <polygon points={radarPoints} className={mStyles.radarArea} />
            </svg>
            {skills.map((s, i) => {
              const angle = (i / skills.length) * 2 * Math.PI - Math.PI / 2;
              const left = 50 + 62 * Math.cos(angle);
              const top = 50 + 62 * Math.sin(angle);
              return (
                <div key={i} className={mStyles.labelBadge} style={{ left: `${left}%`, top: `${top}%` }}>
                  {s.label}
                </div>
              );
            })}
          </div>
        </div>

        <div className={mStyles.hudCard}>
          <div className={mStyles.cardLabel}>
            <span>Active Modules</span>
            <Zap size={14} />
          </div>
          <div className={mStyles.horizonFeed}>
            {activeLayers.map((s, i) => (
              <div key={i} className={mStyles.horizonItem}>
                <div className={i === 0 ? mStyles.activeDot : mStyles.miniFlowDot} />
                <div className={mStyles.horizonInfo}>
                  <span className={mStyles.horizonTitle}>{s.title}</span>
                  <span className={mStyles.horizonPercent}>{s.percent}% Mastered</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [data, setData] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTrack, setActiveTrack] = useState<string>("Career & Tech");
  
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchRoadmap = async () => {
    setLoading(true);
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

  const toggleLayerExpansion = (layerId: string) => {
    setExpandedLayers(prev => {
      const next = new Set(prev);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  };

  const toggleItem = async (type: string, layerId: string | null, itemId: string) => {
    if (!data) return;
    const newData: RoadmapData = JSON.parse(JSON.stringify(data));
    let targetItems: RoadmapItem[] = [];
    if (type === 'layer' && layerId) {
      const layer = newData.layers.find(l => l.id === layerId);
      if (layer) targetItems = layer.items;
    } else if (type === 'milestone') {
      targetItems = newData.milestones;
    }

    const item = targetItems.find(i => i.id === itemId);
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
  
  const displayLayers = useMemo(() => {
    return currentLayers.map((layer, index) => {
      const cleanTitle = layer.title.includes('—') 
        ? layer.title.split('—').slice(1).join('—').trim() 
        : layer.title.replace(/^Layer \d+\s*(—|:)\s*/i, '').trim();
      
      return {
        ...layer,
        displayTitle: `Layer ${index + 1} — ${cleanTitle}`
      };
    });
  }, [currentLayers]);

  const filteredLayers = displayLayers.filter(layer => 
    layer.displayTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    layer.items.some(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <div className={styles.loadingScreen}>Accessing Path...</div>;

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.glowOverlay} />
      <header className={styles.header}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Journey</h1>
          <p className={styles.subtitle}>A visual architecture for tracking mastery across technical and physical horizons.</p>
          
          <div className={styles.heroActions}>
            <Link href="/tree" className={styles.primaryAction}>
              Goal Tree <ChevronRight size={20} />
            </Link>
            <Link href="/dashboard" className={styles.secondaryAction}>
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {data && <UserMetrics data={data} />}
        
        <div className={styles.layoutGrid} style={{ marginTop: '80px' }}>
          <div className={styles.contentColumn}>
            {data && data.milestones.length > 0 && (
              <section className={styles.milestoneSection}>
                <div className={styles.sectionHeader}>
                  <Target size={20} style={{color: 'var(--accent-color)'}} />
                  <h2 className={styles.sectionTitle}>Key Milestones</h2>
                </div>
                <div className={styles.milestonesHorizontal}>
                  {data.milestones.map(m => (
                    <div 
                      key={m.id} 
                      className={`${styles.milestoneMiniCard} ${m.status === 'done' ? styles.milestoneDone : ''}`}
                      onClick={() => toggleItem('milestone', null, m.id)}
                    >
                      <div className={styles.milestoneCheck}>
                        {m.status === 'done' ? <CheckCircle2 size={18} /> : <div className={styles.milestoneDot} />}
                      </div>
                      <span className={styles.milestoneTitle}>{m.title}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className={styles.roadmapSection}>
              <div className={styles.controlsRow}>
                <div className={styles.searchBox}>
                  <Search size={20} className={styles.searchIcon} />
                  <input type="text" className={styles.searchInput} placeholder="Search modules..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className={styles.trackTabs}>
                  {tracks.map(track => (
                    <button key={track} onClick={() => setActiveTrack(track)} className={`${styles.trackTab} ${selectedTrack === track ? styles.trackTabActive : ''}`}>{track}</button>
                  ))}
                </div>
              </div>

              <div className={styles.layersGrid}>
                {filteredLayers?.map((layer) => (
                  <div 
                    key={layer.id} 
                    id={layer.id} 
                    className={`${styles.card} ${expandedLayers.has(layer.id) ? styles.cardExpanded : ''}`} 
                    onClick={() => toggleLayerExpansion(layer.id)}
                  >
                    <div className={styles.cardContent}>
                      <div className={`${styles.cardIcon}`}>
                        {layer.id === 'layer1' ? <Cpu size={28} /> : 
                         layer.id === 'layer2' ? <Brain size={28} /> : 
                         layer.id === 'layer3' ? <Network size={28} /> : 
                         layer.id === 'layer4' ? <Blocks size={28} /> : 
                         layer.id === 'layer5' ? <Infinity size={28} /> : 
                         layer.id === 'layer6' ? <Bot size={28} /> : 
                         layer.id === 'layer7' ? <ShieldCheck size={28} /> : 
                         <Target size={28} />}
                      </div>
                      <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}><HighlightText text={(layer as any).displayTitle} query={searchQuery} /></h3>
                        <p className={styles.cardDescription}><HighlightText text={layer.description} query={searchQuery} /></p>
                      </div>
                      <div className={styles.layerProgressBlock}>
                        <div className={styles.layerProgressTrack}>
                          <div className={styles.layerProgressBar} style={{ width: `${Math.round((layer.items.filter(item => item.status === 'done').length / layer.items.length) * 100) || 0}%` }} />
                        </div>
                      </div>
                      
                      {expandedLayers.has(layer.id) && (
                        <div className={styles.expandedContent} onClick={(e) => e.stopPropagation()}>
                          <div className={styles.itemList}>
                            {layer.items.map(item => (
                              <div 
                                key={item.id} 
                                className={`${styles.itemRow} ${item.status === 'done' ? styles.itemRowDone : ''}`}
                                onClick={() => toggleItem('layer', layer.id, item.id)}
                              >
                                <div className={styles.checkboxCustom}>
                                  {item.status === 'done' ? <CheckCircle2 size={16} /> : <div className={styles.circleSmall} />}
                                </div>
                                <span className={styles.itemTitle}><HighlightText text={item.title} query={searchQuery} /></span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className={styles.cardFooter}>
                        <span className={styles.itemCount}>{layer.items.length} Nodes</span>
                        <div className={styles.expandIndicator}>
                          {expandedLayers.has(layer.id) ? <ChevronUp size={20} /> : <ChevronRight size={20} />}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <span className={styles.footerBrand}>Journey Portal</span>
          <span className={styles.footerYear}>2026 Edition</span>
        </div>
      </footer>
    </div>
  );
}
