"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import styles from "./page.module.css";
import mStyles from "./metrics.module.css";
import { Sparkles, Search, Target, CheckCircle2, Zap, ChevronRight, ChevronUp, Cpu, Brain, Network, Blocks, Infinity, Bot, ShieldCheck } from "lucide-react";
import { gsap } from "gsap";

interface RoadmapItem {
  id: string;
  title: string;
  status: 'pending' | 'done';
  goal?: string;
  notes?: string;
}

interface LayerData {
  id: string;
  title: string;
  description: string;
  category?: string;
  items: RoadmapItem[];
}

interface RoadmapData {
  target_roles: string[];
  layers: LayerData[];
  milestones: RoadmapItem[];
  mlops_devops: RoadmapItem[];
  security_ethics: RoadmapItem[];
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
  const currentPhase = activeLayers[0] || { phase: "Ascended", title: "All Layers Mastered" };

  const skills = [
    { label: "Systems", val: layerStats[0]?.percent || 0 },
    { label: "Math/ML", val: layerStats[1]?.percent || 0 },
    { label: "AI Arch", val: layerStats[2]?.percent || 0 },
    { label: "Web3", val: layerStats[3]?.percent || 0 },
    { label: "Frontier", val: layerStats[4]?.percent || 0 },
    { label: "Agents", val: layerStats[5]?.percent || 0 },
    { label: "Security", val: layerStats[6]?.percent || 0 },
    { label: "Human", val: Math.round(((layerStats[7]?.percent || 0) + (layerStats[8]?.percent || 0) + (layerStats[9]?.percent || 0) + (layerStats[10]?.percent || 0)) / 4) || 0 },
  ];

  const radarPoints = skills.map((s, i) => {
    const angle = (i / skills.length) * 2 * Math.PI - Math.PI / 2;
    const r = (s.val / 100) * 40 + 5;
    return `${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`;
  }).join(' ');

  return (
    <div className={mStyles.metricsHub}>
      <div className={mStyles.hudGrid}>
        {/* Module 1: Vitality HUD */}
        <div className={mStyles.hudCard}>
          <div className={mStyles.cardLabel}>
            <span>Core Vitality</span>
            <Target size={12} />
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
              <span className={mStyles.statLab}>Mastered</span>
            </div>
            <div className={mStyles.statItem}>
              <span className={mStyles.statVal}>{totalItems - doneItems}</span>
              <span className={mStyles.statLab}>Remaining</span>
            </div>
          </div>
        </div>

        {/* Module 2: Neural Map HUD */}
        <div className={mStyles.hudCard}>
          <div className={mStyles.cardLabel}>
            <span>Neural Distribution</span>
            <Brain size={12} />
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
              const left = 50 + 58 * Math.cos(angle);
              const top = 50 + 58 * Math.sin(angle);
              return (
                <div key={i} className={mStyles.labelBadge} style={{ left: `${left}%`, top: `${top}%` }}>
                  {s.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Module 3: Active Horizon HUD */}
        <div className={mStyles.hudCard}>
          <div className={mStyles.cardLabel}>
            <span>Active Horizon</span>
            <Zap size={12} />
          </div>
          <div className={mStyles.horizonFeed}>
            {activeLayers.map((s, i) => (
              <div key={i} className={mStyles.horizonItem}>
                <div className={i === 0 ? mStyles.activeDot : mStyles.miniFlowDot} />
                <div className={mStyles.horizonInfo}>
                  <span className={mStyles.horizonTitle}>{s.title}</span>
                  <span className={mStyles.horizonPercent}>{s.percent}% Optimized</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={mStyles.statusStrip}>
        <div className={mStyles.statusLeft}>
          <div className={mStyles.liveCore}>
            <div className={mStyles.pulse} />
            <span>Core Engine Online</span>
          </div>
          <span>System: Liquid Glass v1.3</span>
        </div>
        <div className={mStyles.statusRight}>
          Next Module: {currentPhase.phase}
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
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTrack, setActiveTrack] = useState<string>("Career & Tech");
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUserId("local_user");
  }, []);

  const fetchRoadmap = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/roadmap?userId=${id}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch roadmap:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) void fetchRoadmap(userId);
  }, [userId]);

  useEffect(() => {
    if (!loading && data && containerRef.current) {
      gsap.fromTo(`.${styles.card}`, 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "power2.out" }
      );
    }
  }, [loading, data]);

  const toggleLayerExpansion = (layerId: string) => {
    setExpandedLayers(prev => {
      const next = new Set(prev);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  };

  const toggleItem = async (type: string, layerId: string | null, itemId: string) => {
    if (!data || !userId) return;
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
        await fetch(`/api/roadmap?userId=${userId}`, {
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
    if (!data) return { "Career & Tech": [], "Health & Fitness": [], "Other": [] };
    const groups: Record<string, LayerData[]> = { "Career & Tech": [], "Health & Fitness": [], "Other": [] };
    
    data.layers.forEach(layer => {
      const layerNum = parseInt(layer.id.replace('layer', ''), 10);
      let category = (layerNum >= 8 && layerNum <= 11) ? "Health & Fitness" : (layer.id.startsWith('layer') ? "Career & Tech" : "Other");
      if (!groups[category]) groups[category] = [];
      groups[category].push(layer);
    });

    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => parseInt(a.id.replace('layer', ''), 10) - parseInt(b.id.replace('layer', ''), 10));
    });

    Object.keys(groups).forEach(k => { if (groups[k].length === 0) delete groups[k]; });
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

  const nextStep = useMemo(() => {
    if (!data) return null;
    const pendingMilestone = data.milestones.find(m => m.status === 'pending');
    if (pendingMilestone) return { ...pendingMilestone, type: 'Milestone' };

    for (const layer of data.layers) {
      const pendingItem = layer.items.find(i => i.status === 'pending');
      if (pendingItem) return { ...pendingItem, type: layer.title.split('—')[0].trim() };
    }
    return null;
  }, [data]);

  if (loading) return <div className={styles.loadingScreen}>Initializing Journey...</div>;

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.glowOverlay} />
      <header className={styles.header}>
        <div className={styles.hero}>
          <div className={styles.eyebrow}>Unified Mastery Engine</div>
          <h1 className={styles.title}>Journey</h1>
          <p className={styles.subtitle}>Unifying technical mastery and biological optimization for the next decade of engineering.</p>
          
          {nextStep && (
            <div className={styles.spotlight}>
              <div className={styles.spotlightBadge}><Zap size={10} /> Recommended Next Step</div>
              <div className={styles.spotlightContent}>
                <div className={styles.spotlightContext}>{nextStep.type}</div>
                <div className={styles.spotlightTitle}>{nextStep.title}</div>
              </div>
              <button 
                className={styles.spotlightAction}
                onClick={() => {
                  const targetLayer = data?.layers.find(l => l.items.some(i => i.id === nextStep.id));
                  if (targetLayer) {
                    const layerNum = parseInt(targetLayer.id.replace('layer', ''), 10);
                    const category = (layerNum >= 8 && layerNum <= 11) ? "Health & Fitness" : "Career & Tech";
                    setActiveTrack(category);
                    if (!expandedLayers.has(targetLayer.id)) toggleLayerExpansion(targetLayer.id);
                    setTimeout(() => {
                      document.getElementById(targetLayer.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                  }
                }}
              >
                Go to Goal <ChevronRight size={14} />
              </button>
            </div>
          )}

          {data && <UserMetrics data={data} />}
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.layoutGrid}>
          <div className={styles.contentColumn}>
            {data && data.milestones.length > 0 && (
              <section className={styles.milestoneSection}>
                <div className={styles.sectionHeader}>
                  <Target size={18} className={styles.sideIcon} style={{color: 'var(--accent-green)'}} />
                  <h2 className={styles.sectionTitle}>High-Level Milestones</h2>
                </div>
                <div className={styles.milestonesHorizontal}>
                  {data.milestones.map(m => (
                    <div 
                      key={m.id} 
                      className={`${styles.milestoneMiniCard} ${m.status === 'done' ? styles.milestoneDone : ''} ${m.id === nextStep?.id ? styles.milestoneFocused : ''}`}
                      onClick={() => toggleItem('milestone', null, m.id)}
                    >
                      <div className={styles.milestoneCheck}>
                        {m.status === 'done' ? <CheckCircle2 size={16} /> : <div className={styles.milestoneDot} />}
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
                  <Search size={18} className={styles.searchIcon} />
                  <input type="text" className={styles.searchInput} placeholder="Search skills..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  {searchQuery && <button className={styles.searchClear} onClick={() => setSearchQuery("")}>&times;</button>}
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
                    <div className={styles.cardGlow} />
                    <div className={styles.cardContent}>
                      <div className={`${styles.cardIcon}`}>
                        {layer.id === 'layer1' ? <Cpu size={24} /> : 
                         layer.id === 'layer2' ? <Brain size={24} /> : 
                         layer.id === 'layer3' ? <Network size={24} /> : 
                         layer.id === 'layer4' ? <Blocks size={24} /> : 
                         layer.id === 'layer5' ? <Infinity size={24} /> : 
                         layer.id === 'layer6' ? <Bot size={24} /> : 
                         layer.id === 'layer7' ? <ShieldCheck size={24} /> : 
                         <Target size={24} />}
                      </div>
                      <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}><HighlightText text={(layer as any).displayTitle} query={searchQuery} /></h3>
                        <p className={styles.cardDescription}><HighlightText text={layer.description} query={searchQuery} /></p>
                      </div>
                      <div className={styles.layerProgressBlock}>
                        <div className={styles.layerProgressTrack}><div className={styles.layerProgressBar} style={{ width: `${Math.round((layer.items.filter(item => item.status === 'done').length / layer.items.length) * 100) || 0}%`, backgroundColor: 'var(--accent-green)' }} /></div>
                      </div>
                      
                      {expandedLayers.has(layer.id) && (
                        <div className={styles.expandedContent} onClick={(e) => e.stopPropagation()}>
                          <div className={styles.itemList}>
                            {layer.items.map(item => (
                              <div 
                                key={item.id} 
                                className={`${styles.itemRow} ${item.status === 'done' ? styles.itemRowDone : ''} ${item.id === nextStep?.id ? styles.itemFocused : ''}`}
                                onClick={() => toggleItem('layer', layer.id, item.id)}
                              >
                                <div className={styles.checkboxCustom}>
                                  {item.status === 'done' ? <CheckCircle2 size={14} /> : <div className={styles.circleSmall} />}
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
                          {expandedLayers.has(layer.id) ? <ChevronUp size={16} /> : <ChevronRight size={16} />}
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
