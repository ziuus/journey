"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import styles from "./page.module.css";
import mStyles from "./metrics.module.css";
import { Sparkles, Search, LayoutDashboard, Target, Clock, CheckCircle2, PlusCircle, Zap, ChevronRight, ChevronUp } from "lucide-react";
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

interface HistoryEntry {
  timestamp: string;
  action: 'update_status' | 'add_goal';
  details: {
    type?: string;
    itemId: string;
    title: string;
    status: string;
    layerId?: string;
    goal?: string;
  };
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

const ProgressTimeline = ({ history }: { history: HistoryEntry[] }) => {
  if (history.length === 0) {
    return (
      <div className={styles.timelineEmpty}>
        <Clock size={16} />
        <span>No recent activity recorded.</span>
      </div>
    );
  }

  return (
    <div className={styles.timeline}>
      {history.slice(-8).reverse().map((entry, i) => (
        <div key={i} className={styles.timelineItem}>
          <div className={styles.timelineIndicator}>
            <div className={styles.timelineLine} />
            <div className={styles.timelineDot}>
              {entry.action === 'update_status' ? <CheckCircle2 size={12} /> : <PlusCircle size={12} />}
            </div>
          </div>
          <div className={styles.timelineContent}>
            <div className={styles.timelineHeader}>
              <span className={styles.timelineAction}>
                {entry.action === 'update_status' ? 'Updated' : 'Added'}
              </span>
              <span className={styles.timelineTime}>
                {new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className={styles.timelineTitle}>{entry.details.title}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const UserMetrics = ({ data }: { data: RoadmapData }) => {
  const totalItems = data.layers.reduce((acc, l) => acc + l.items.length, 0) + data.milestones.length;
  const doneItems = data.layers.reduce((acc, l) => acc + l.items.filter(i => i.status === 'done').length, 0) + data.milestones.filter(i => i.status === 'done').length;
  const progressPercent = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  const layerStats = data.layers.map(l => ({
    title: l.title.split('—')[0].trim(),
    percent: Math.round((l.items.filter(i => i.status === 'done').length / l.items.length) * 100)
  }));

  const currentPhase = layerStats.findIndex(s => s.percent < 100);
  const phaseTitle = currentPhase !== -1 ? `Phase ${currentPhase + 1}` : "Fully Mastered";

  const skills = [
    { label: "Systems", val: layerStats[0]?.percent || 0 },
    { label: "Math/ML", val: layerStats[1]?.percent || 0 },
    { label: "Deep Learning", val: layerStats[2]?.percent || 0 },
    { label: "Web3", val: layerStats[3]?.percent || 0 },
    { label: "Frontier AI", val: layerStats[4]?.percent || 0 },
    { label: "Agents", val: layerStats[5]?.percent || 0 },
    { label: "Crypto AI", val: layerStats[6]?.percent || 0 },
    { label: "Biological", val: Math.round(((layerStats[7]?.percent || 0) + (layerStats[8]?.percent || 0) + (layerStats[9]?.percent || 0) + (layerStats[10]?.percent || 0)) / 4) || 0 },
  ];

  const radarPoints = skills.map((s, i) => {
    const angle = (i / skills.length) * 2 * Math.PI - Math.PI / 2;
    const r = (s.val / 100) * 40 + 5;
    return `${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`;
  }).join(' ');

  return (
    <section className={styles.metricsSection}>
      <div className={mStyles.metricsGrid}>
        <div className={mStyles.metricCard}>
          <div className={mStyles.metricHeader}>
            <span className={mStyles.metricLabel}>Core Mastery</span>
            <div className={mStyles.liveBadge}>
              <div className={mStyles.pulse} /> Live
            </div>
          </div>
          <div className={mStyles.metricValue}>
            <span className={mStyles.valueAccent}>{progressPercent}</span>
            <span className={mStyles.valueTotal}>/ 100</span>
          </div>
          <div className={mStyles.progressTrack}><div className={mStyles.progressBar} style={{width: `${progressPercent}%`}} /></div>
          <div className={mStyles.statGrid}>
            <div className={mStyles.statItem}><span className={mStyles.statValue}>{doneItems}</span><span className={mStyles.statLabel}>Completed</span></div>
            <div className={mStyles.statItem}><span className={mStyles.statValue}>{totalItems - doneItems}</span><span className={mStyles.statLabel}>Remaining</span></div>
          </div>
        </div>

        <div className={mStyles.metricCard}>
          <div className={mStyles.metricHeader}><span className={mStyles.metricLabel}>Skill Vectors</span><Sparkles size={14} className={mStyles.headerIcon} /></div>
          <div className={mStyles.radarContainer}>
            <svg viewBox="0 0 100 100" className={mStyles.radarSvg}>
              <circle cx="50" cy="50" r="45" className={mStyles.radarGrid} />
              <circle cx="50" cy="50" r="30" className={mStyles.radarGrid} />
              <circle cx="50" cy="50" r="15" className={mStyles.radarGrid} />
              {skills.map((_, i) => {
                const angle = (i / skills.length) * 2 * Math.PI - Math.PI / 2;
                return <line key={i} x1="50" y1="50" x2={50 + 45 * Math.cos(angle)} y2={50 + 45 * Math.sin(angle)} className={mStyles.radarGrid} />;
              })}
              <polygon points={radarPoints} className={mStyles.radarArea} />
              {skills.map((s, i) => {
                const angle = (i / skills.length) * 2 * Math.PI - Math.PI / 2;
                const x = 50 + 48 * Math.cos(angle);
                const y = 50 + 48 * Math.sin(angle);
                return (
                  <text key={i} x={x} y={y} className={mStyles.radarLabel} textAnchor="middle" dominantBaseline="middle">
                    {s.label}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        <div className={mStyles.metricCard}>
          <div className={mStyles.metricHeader}><span className={mStyles.metricLabel}>Phase Status</span><Target size={14} className={mStyles.headerIcon} /></div>
          <div className={mStyles.metricValue}>{phaseTitle}</div>
          <div className={mStyles.layerBreakdown}>
            {layerStats.map((s, i) => (
              <div key={i} className={mStyles.layerMiniRow}>
                <div className={mStyles.layerMiniHeader}><span>{s.title}</span><span>{s.percent}%</span></div>
                <div className={mStyles.layerMiniTrack}><div className={mStyles.layerMiniBar} style={{width: `${s.percent}%`}} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default function Home() {
  const [data, setData] = useState<RoadmapData | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [searchQuery, setSearchWrapper] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [newGoalByLayer, setNewGoalByLayer] = useState<Record<string, string>>({});
  const [focusMode, setFocusMode] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUserId("local_user");
    setIsLoginOpen(false);
  }, []);

  const fetchRoadmap = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/roadmap?userId=${id}`);
      const json = await res.json();
      if (json.error && res.status === 404) {
        setData({
          target_roles: ["Developer"],
          layers: [],
          milestones: [],
          mlops_devops: [],
          security_ethics: []
        });
      } else {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch roadmap:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/progress-history');
      if (res.ok) {
        const json = await res.json();
        setHistory(json);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  useEffect(() => {
    if (userId) {
      void fetchRoadmap(userId);
      void fetchHistory();
    }
  }, [userId]);

  useEffect(() => {
    if (!loading && data && containerRef.current) {
      gsap.fromTo(`.${styles.card}`, 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "power2.out" }
      );
    }
  }, [loading, data]);

  const toggleItem = async (type: string, layerId: string | null, itemId: string) => {
    if (!data || !userId) return;
    const newData: RoadmapData = JSON.parse(JSON.stringify(data));
    const previousData = data;

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
        const res = await fetch(`/api/roadmap?userId=${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newData)
        });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        void fetchHistory();
      } catch (err) {
        console.error('Failed to sync changes:', err);
        setData(previousData);
      }
    }
  };

  const addGoal = async (layerId: string, title: string) => {
    if (!data || !userId || !title.trim()) return;
    const newData: RoadmapData = JSON.parse(JSON.stringify(data));
    const previousData = data;
    const layer = newData.layers.find(l => l.id === layerId);
    
    if (layer) {
      const newItem: RoadmapItem = {
        id: `item_${layer.id}_${layer.items.length + 1}_${title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`,
        title: title.trim(),
        status: 'pending'
      };
      layer.items.push(newItem);
      setData(newData);
      setNewGoalByLayer((current) => ({ ...current, [layerId]: '' }));
      try {
        const res = await fetch(`/api/roadmap?userId=${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newData)
        });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        void fetchHistory();
      } catch (err) {
        console.error('Failed to add goal:', err);
        setData(previousData);
        setNewGoalByLayer((current) => ({ ...current, [layerId]: title }));
      }
    }
  };

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUserId("local_user");
    setIsLoginOpen(false);
  };

  const handleLogout = () => {
    setData(null);
    setHistory([]);
    setUserId(null);
    setIsLoginOpen(true);
  };

  const [activeTrack, setActiveTrack] = useState<string>("Career & Tech");
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid');

  const groupedLayers = useMemo(() => {
    if (!data) return { "Career & Tech": [], "Health & Fitness": [], "Other": [] };
    const groups: Record<string, LayerData[]> = { "Career & Tech": [], "Health & Fitness": [], "Other": [] };
    data.layers.forEach(layer => {
      let category = layer.category;
      if (!category) {
        if (['layer8', 'layer9', 'layer10', 'layer11'].includes(layer.id)) {
          category = "Health & Fitness";
        } else if (layer.id.startsWith('layer')) {
          category = "Career & Tech";
        } else {
          category = "Other";
        }
      }
      if (!groups[category]) groups[category] = [];
      groups[category].push(layer);
    });
    Object.keys(groups).forEach(k => { if (groups[k].length === 0) delete groups[k]; });
    return groups;
  }, [data]);

  const tracks = Object.keys(groupedLayers);
  const selectedTrack = tracks.includes(activeTrack) ? activeTrack : tracks[0];
  const currentLayers = groupedLayers[selectedTrack] || [];
  const filteredLayers = currentLayers.filter(layer => 
    layer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    layer.items.some(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeMilestoneId = useMemo(() => {
    if (!data) return null;
    return data.milestones.find(m => m.status === 'pending')?.id || null;
  }, [data]);

  const overview = useMemo(() => {
    if (!data) return null;

    const layerItems = data.layers.reduce((acc, layer) => acc + layer.items.length, 0);
    const doneLayerItems = data.layers.reduce((acc, layer) => acc + layer.items.filter(item => item.status === 'done').length, 0);
    const doneMilestones = data.milestones.filter(item => item.status === 'done').length;
    const total = layerItems + data.milestones.length;
    const done = doneLayerItems + doneMilestones;

    return {
      total,
      done,
      remaining: Math.max(total - done, 0),
      percent: total > 0 ? Math.round((done / total) * 100) : 0,
      roles: data.target_roles.length,
      milestones: data.milestones.length,
    };
  }, [data]);

  if (isLoginOpen) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.logoMark}>J</div>
          <h2 className={styles.cardTitle}>Journey Portal</h2>
          <p className={styles.cardDescription}>Sign in to access your personal biological and technical roadmap.</p>
          <form onSubmit={handleLogin}>
            <button type="submit" className={styles.loginBtn}>
              Sign In with Google
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) return <div className={styles.loadingScreen}>Initializing Journey...</div>;

  return (
    <div className={styles.container} ref={containerRef}>
      <header className={styles.header}>
        <div className={styles.topBar}>
          <div className={styles.brand}>
            <div className={styles.logoMarkSmall}>J</div>
            <span className={styles.brandName}>Journey</span>
          </div>
          <div className={styles.headerActions}>
            <button onClick={() => setFocusMode(!focusMode)} className={`${styles.actionBtn} ${focusMode ? styles.actionBtnActive : ''}`}>
              <Zap size={14} /> {focusMode ? 'Focus Active' : 'Focus Mode'}
            </button>
            <div className={styles.userSection}>
              <span className={styles.userId}>{userId}</span>
              <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
            </div>
          </div>
        </div>
        
        <div className={styles.hero}>
          <div className={styles.eyebrow}>Unified Mastery Engine</div>
          <h1 className={styles.title}>Journey</h1>
          <p className={styles.subtitle}>Unifying technical mastery and biological optimization for the next decade of engineering.</p>
          {overview && (
            <div className={styles.heroStats}>
              <div className={styles.heroStatCard}>
                <span className={styles.heroStatValue}>{overview.percent}%</span>
                <span className={styles.heroStatLabel}>overall progress</span>
              </div>
              <div className={styles.heroStatCard}>
                <span className={styles.heroStatValue}>{overview.remaining}</span>
                <span className={styles.heroStatLabel}>active goals</span>
              </div>
              <div className={styles.heroStatCard}>
                <span className={styles.heroStatValue}>{overview.roles}</span>
                <span className={styles.heroStatLabel}>target roles</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.layoutGrid}>
          <div className={styles.contentColumn}>
            <section className={styles.roadmapSection}>
              <div className={styles.sectionIntro}>
                <div>
                  <span className={styles.sectionKicker}>Roadmap</span>
                  <h2 className={styles.sectionTitle}>Choose one track, then expand only what you need.</h2>
                </div>
                <p className={styles.sectionCopy}>A calmer board for scanning progress, finding the next skill, and keeping attention on the current path.</p>
              </div>

              <div className={styles.controlsRow}>
                <div className={styles.searchBox}>
                  <Search size={18} className={styles.searchIcon} />
                  <input 
                    type="text" 
                    className={styles.searchInput} 
                    placeholder="Search skills, tech, or layers..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchWrapper(e.target.value)} 
                  />
                </div>
                
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
                
                <div className={styles.viewToggles}>
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`${styles.trackTab} ${viewMode === 'grid' ? styles.trackTabActive : ''}`}
                  >
                    Grid
                  </button>
                  <button 
                    onClick={() => setViewMode('tree')}
                    className={`${styles.trackTab} ${viewMode === 'tree' ? styles.trackTabActive : ''}`}
                  >
                    Tree
                  </button>
                </div>
              </div>

              {viewMode === 'grid' ? (
              <div className={styles.layersGrid}>
              {filteredLayers?.map((layer) => (
                <div 
                  key={layer.id} 
                  className={`${styles.card} ${expandedLayer === layer.id ? styles.cardExpanded : ''}`} 
                  onClick={() => setExpandedLayer(expandedLayer === layer.id ? null : layer.id)}
                >
                  <div className={styles.cardGlow} />
                  <div className={styles.cardContent}>
                    <div className={`${styles.cardIcon} ${styles[`icon_${layer.id}`] || styles.iconDefault}`}>
                      {layer.id === 'layer1' ? '⚡' : layer.id === 'layer2' ? '🧠' : layer.id === 'layer3' ? '🔮' : layer.id === 'layer4' ? '⛓️' : layer.id === 'layer5' ? '🌌' : layer.id === 'layer6' ? '🤖' : layer.id === 'layer7' ? '🔐' : '🎯'}
                    </div>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}><HighlightText text={layer.title} query={searchQuery} /></h3>
                      <p className={styles.cardDescription}><HighlightText text={layer.description} query={searchQuery} /></p>
                    </div>
                    <div className={styles.layerProgressBlock}>
                      <div className={styles.layerProgressHeader}>
                        <span>{layer.items.filter(item => item.status === 'done').length} completed</span>
                        <span>{Math.round((layer.items.filter(item => item.status === 'done').length / layer.items.length) * 100) || 0}%</span>
                      </div>
                      <div className={styles.layerProgressTrack}>
                        <div
                          className={styles.layerProgressBar}
                          style={{ width: `${Math.round((layer.items.filter(item => item.status === 'done').length / layer.items.length) * 100) || 0}%` }}
                        />
                      </div>
                    </div>
                    
                    {expandedLayer === layer.id && (
                      <div className={styles.expandedContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.itemList}>
                          {layer.items.map(item => (
                            <div key={item.id} className={`${styles.itemRow} ${item.status === 'done' ? styles.itemRowDone : ''}`}>
                              <div className={styles.checkboxWrapper}>
                                <input type="checkbox" className={styles.checkbox} checked={item.status === 'done'} onChange={() => toggleItem('layer', layer.id, item.id)} />
                              </div>
                              <div className={styles.itemInfo}>
                                <span className={styles.itemTitle}><HighlightText text={item.title} query={searchQuery} /></span>
                                {item.goal && <span className={styles.itemGoal}>{item.goal}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            addGoal(layer.id, newGoalByLayer[layer.id] || '');
                          }}
                          className={styles.addGoalForm}
                        >
                          <input
                            value={newGoalByLayer[layer.id] || ''}
                            onChange={(e) => setNewGoalByLayer((current) => ({ ...current, [layer.id]: e.target.value }))}
                            placeholder="Add custom goal..."
                            className={styles.addGoalInput}
                          />
                          <button type="submit" className={styles.addGoalBtn}>Add</button>
                        </form>
                      </div>
                    )}
                    
                    <div className={styles.cardFooter}>
                      <span className={styles.itemCount}>{layer.items.length} Items</span>
                      <div className={styles.expandIndicator}>
                        {expandedLayer === layer.id ? <ChevronUp size={16} /> : <ChevronRight size={16} />}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
              ) : (
                <div className={styles.treeView}>
                  {filteredLayers?.map((layer) => (
                    <div key={layer.id} className={styles.treeLayer}>
                      <div className={styles.treeLayerHeader} onClick={() => setExpandedLayer(expandedLayer === layer.id ? null : layer.id)}>
                        <div className={styles.treeLayerIcon}>
                          {expandedLayer === layer.id ? <ChevronUp size={18} /> : <ChevronRight size={18} />}
                        </div>
                        <div className={styles.treeLayerTitleGroup}>
                          <h3 className={styles.treeLayerTitle}><HighlightText text={layer.title} query={searchQuery} /></h3>
                          <span className={styles.treeLayerProgressText}>
                            {layer.items.filter(item => item.status === 'done').length} / {layer.items.length} items completed
                          </span>
                        </div>
                      </div>
                      
                      {expandedLayer === layer.id && (
                        <div className={styles.treeLayerContent}>
                          <div className={styles.treeItemList}>
                            {layer.items.map(item => (
                              <div key={item.id} className={`${styles.treeItemRow} ${item.status === 'done' ? styles.treeItemDone : ''}`}>
                                <div className={styles.checkboxWrapper}>
                                  <input type="checkbox" className={styles.checkbox} checked={item.status === 'done'} onChange={() => toggleItem('layer', layer.id, item.id)} />
                                </div>
                                <div className={styles.treeItemInfo}>
                                  <span className={styles.treeItemTitle}><HighlightText text={item.title} query={searchQuery} /></span>
                                  {item.goal && <span className={styles.treeItemGoal}>{item.goal}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
