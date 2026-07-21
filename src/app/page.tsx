"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import mStyles from "./metrics.module.css";
import {
  Search, Target, CheckCircle2, Zap, ChevronRight, ChevronUp,
  Cpu, Brain, Network, Blocks, Infinity, Bot, ShieldCheck,
  BookOpen, Code, Database, Server, Globe, Lock, Activity,
  Heart, Dumbbell, Wallet, Users, Compass, Star, Rocket, Lightbulb,
  Award, Layers, PieChart, BarChart3, Clock, Calendar,
  Music, Camera, Eye, Flag, Folder, File, MessageCircle, Phone,
  PlusCircle, MinusCircle, AlertCircle, Info, HelpCircle, Settings,
  User, Home as HomeIcon, Menu, MoreHorizontal, ExternalLink, Download, Upload,
  RefreshCw, Power, Trash2, Edit, Map, Terminal, Cloud, Wifi,
  MousePointer, Keyboard, Monitor, Tablet, Smartphone, TreePine, XCircle,
  List, Briefcase
} from "lucide-react";
import type { RawRoadmapData, RawLayerData, RawRoadmapItem } from "@/lib/storage";
import type { Goal, Track } from "@/types/roadmap";
import {
  resolveLayerIcon, resolveLayerTrack, collectTracks, filterLayersByTrack,
} from "@/lib/roadmap-utils";
import { computeDashboard, getTrackLabel, type DashboardState } from "@/lib/execution-recommendations";

// ─── Icon resolver (maps string names to Lucide components) ───

const ICON_COMPONENTS: Record<string, React.ComponentType<{ size?: number }>> = {
  Cpu, Brain, Network, Blocks, Infinity, Bot, ShieldCheck, Target,
  BookOpen, Code, Database, Server, Globe, Lock, Activity,
  Heart, Dumbbell, Wallet, Users, Compass, Star, Rocket, Lightbulb,
  Award, Layers, PieChart, BarChart3, Clock, Calendar,
  Music, Camera, Eye, Flag, Folder, File, MessageCircle, Phone,
  PlusCircle, MinusCircle, CheckCircle2, XCircle, AlertCircle, Info, HelpCircle,
  Settings, User, HomeIcon, Menu, MoreHorizontal, ExternalLink, Download, Upload,
  RefreshCw, Power, Trash2, Edit, Map, Terminal, Cloud, Wifi,
  MousePointer, Keyboard, Monitor, Tablet, Smartphone, TreePine, Zap,
  List, Briefcase,
  Home: HomeIcon,
};

function getIconComponent(iconName: string): React.ComponentType<{ size?: number }> {
  return ICON_COMPONENTS[iconName] || Target;
}

// ─── Highlight text helper ────────────────────────────────────

const HighlightText = ({ text, query }: { text: string, query: string }) => {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
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

// ─── Today Widget (top 3 recommendations on main page) ─────────

const TodayWidget = ({ layers }: { layers: RawLayerData[] }) => {
  const [dash, setDash] = useState<DashboardState | null>(null);

  useEffect(() => {
    if (layers.length > 0) {
      setDash(computeDashboard(layers));
    }
  }, [layers]);

  if (!dash || dash.today.length === 0) return null;

  return (
    <div className={styles.todayWidget}>
      <div className={styles.todayWidgetHeader}>
        <div className={styles.todayWidgetTitleRow}>
          <Zap size={16} className={styles.todayWidgetIcon} />
          <h3 className={styles.todayWidgetTitle}>Today&apos;s Focus</h3>
        </div>
        <a href="/dashboard" className={styles.todayWidgetLink}>
          Full Dashboard →
        </a>
      </div>
      <div className={styles.todayWidgetList}>
        {dash.today.slice(0, 3).map((rec, i) => {
          const { scored } = rec;
          const { item } = scored;
          return (
            <div key={i} className={`${styles.todayWidgetItem} ${item.status === 'active' ? styles.todayWidgetItemActive : ''}`}>
              <div className={styles.todayWidgetScore}>{scored.score}</div>
              <div className={styles.todayWidgetBody}>
                <div className={styles.todayWidgetItemTop}>
                  <span className={styles.todayWidgetItemTitle}>{item.title}</span>
                </div>
                {item.next_action && (
                  <p className={styles.todayWidgetAction}>{item.next_action}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Goal card (primary goal with tracks) ─────────────────────

const GoalCard = ({
  goal,
  tracks,
  allLayers,
  searchQuery,
  onToggleItem,
}: {
  goal: Goal;
  tracks: Track[];
  allLayers: RawLayerData[];
  searchQuery: string;
  onToggleItem: (layerId: string, itemId: string) => void;
}) => {
  const [expandedTracks, setExpandedTracks] = useState<Set<string>>(new Set());

  const toggleTrack = (tid: string) => {
    setExpandedTracks(prev => {
      const next = new Set(prev);
      if (next.has(tid)) next.delete(tid);
      else next.add(tid);
      return next;
    });
  };

  const goalTrackIds = goal.tracks || [];
  const trackItems: Record<string, RawRoadmapItem[]> = {};
  const trackProgress: Record<string, { completed: number; total: number; percent: number }> = {};

  // Collect all items for each track
  for (const layer of allLayers) {
    const lt = layer.track || "";
    if (!goalTrackIds.includes(lt)) continue;

    if (!trackItems[lt]) trackItems[lt] = [];
    for (const item of layer.items) {
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) continue;
      trackItems[lt].push(item);
    }
  }

  // Compute progress per track
  for (const tid of goalTrackIds) {
    const items = trackItems[tid] || [];
    const done = items.filter(i => i.status === "done").length;
    trackProgress[tid] = {
      completed: done,
      total: items.length,
      percent: items.length > 0 ? Math.round((done / items.length) * 100) : 0,
    };
  }

  // Goal-wide progress
  const allGoalItems = Object.values(trackItems).flat();
  const goalDone = allGoalItems.filter(i => i.status === "done").length;
  const goalTotal = allGoalItems.length;
  const goalPercent = goalTotal > 0 ? Math.round((goalDone / goalTotal) * 100) : 0;

  return (
    <section className={styles.goalSection}>
      <div className={styles.goalHeader}>
        <div className={styles.goalIcon}><Target size={24} /></div>
        <div className={styles.goalMeta}>
          <h2 className={styles.goalTitle}>{goal.title}</h2>
          <p className={styles.goalTracks}>{goalTrackIds.length} tracks &middot; {goalTotal} items</p>
        </div>
        <div className={styles.goalProgressWrap}>
          <div className={styles.goalPercent}>{goalPercent}%</div>
          <div className={styles.goalProgressTrack}>
            <div className={styles.goalProgressBar} style={{ width: `${goalPercent}%` }} />
          </div>
          <span className={styles.goalProgressLabel}>{goalDone}/{goalTotal} done</span>
        </div>
      </div>

      <div className={styles.tracksList}>
        {tracks
          .filter(t => goalTrackIds.includes(t.id))
          .map((track) => {
            const items = trackItems[track.id] || [];
            if (items.length === 0 && !searchQuery) return null;
            const prog = trackProgress[track.id] || { completed: 0, total: 0, percent: 0 };
            const isExpanded = expandedTracks.has(track.id);
            const IconComp = getIconComponent(track.icon || "layers");

            return (
              <div key={track.id} className={styles.trackCard}>
                <div
                  className={styles.trackHeader}
                  onClick={() => toggleTrack(track.id)}
                >
                  <div className={styles.trackIconWrap} style={{ color: track.color || "#3b82f6" }}>
                    <IconComp size={18} />
                  </div>
                  <div className={styles.trackInfo}>
                    <span className={styles.trackTitle}>{track.title}</span>
                    <span className={styles.trackProgressMini}>
                      {prog.percent}% &middot; {prog.completed}/{prog.total}
                    </span>
                  </div>
                  <div className={styles.trackMiniBar}>
                    <div className={styles.trackMiniFill} style={{ width: `${prog.percent}%`, background: track.color || "#3b82f6" }} />
                  </div>
                  <span className={styles.trackChevron}>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronRight size={16} />}
                  </span>
                </div>

                {isExpanded && (
                  <div className={styles.trackItems}>
                    {items.length === 0 ? (
                      <div className={styles.trackEmpty}>No items.</div>
                    ) : (
                      items.map((item) => (
                        <div
                          key={item.id}
                          className={`${styles.trackItem} ${item.status === "done" ? styles.trackItemDone : ""}`}
                          onClick={() => onToggleItem(layerOfItem(allLayers, item.id) || "", item.id)}
                        >
                          <div className={styles.checkboxCustom}>
                            {item.status === "done" ? <CheckCircle2 size={16} /> : <div className={styles.circleSmall} />}
                          </div>
                          <span className={styles.trackItemTitle}>
                            <HighlightText text={item.title} query={searchQuery} />
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </section>
  );
};

// ─── Helpers ──────────────────────────────────────────────────

function layerOfItem(layers: RawLayerData[], itemId: string): string | null {
  for (const layer of layers) {
    if (layer.items.some(i => i.id === itemId)) return layer.id;
  }
  return null;
}

function getTrackById(tracks: Track[], id: string): Track | undefined {
  return tracks.find(t => t.id === id);
}

// ─── UserMetrics component ────────────────────────────────────

const UserMetrics = ({ data }: { data: RawRoadmapData }) => {
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

  const skills = data.layers.slice(0, 7).map((l, i) => ({
    label: l.icon
      ? l.icon.charAt(0).toUpperCase() + l.icon.slice(1)
      : ["Systems", "Math/ML", "AI Arch", "Web3", "Frontier", "Agents", "Security"][i] || `Layer ${i + 1}`,
    val: layerStats[i]?.percent || 0,
  }));

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

// ─── Main page ────────────────────────────────────────────────

export default function Home() {
  const [data, setData] = useState<RawRoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTrack, setActiveTrack] = useState<string>("");

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

  const toggleItem = async (layerId: string | null, itemId: string) => {
    if (!data) return;
    const newData: RawRoadmapData = JSON.parse(JSON.stringify(data));
    for (const layer of newData.layers) {
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
        return;
      }
    }
    const mItem = newData.milestones.find(i => i.id === itemId);
    if (mItem) {
      mItem.status = mItem.status === 'pending' ? 'done' : 'pending';
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

  // ── Goal data ──────────────────────────────────────────────

  const primaryGoal = data?.goals?.[0] || null;
  const allTracks = data?.tracks || [];

  if (loading) return <div className={styles.loadingScreen}>Accessing Path...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Journey</h1>
          <p className={styles.subtitle}>Track your path across AI engineering, systems, Web3, and growth.</p>

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

        {/* ── Goal section ───────────────────────────────── */}
        {primaryGoal && data && (
          <div className={styles.goalWrap}>
            <GoalCard
              goal={primaryGoal}
              tracks={allTracks}
              allLayers={data.layers}
              searchQuery={searchQuery}
              onToggleItem={(layerId, itemId) => toggleItem(layerId, itemId)}
            />
          </div>
        )}

        {/* ── Today Widget ───────────────────────────── */}
        {data && <TodayWidget layers={data.layers} />}

        <div className={styles.layoutGrid}>
          <div className={styles.contentColumn}>
            {data && data.milestones.length > 0 && (
              <section className={styles.milestoneSection}>
                <div className={styles.sectionHeader}>
                  <Target size={20} style={{color: 'var(--accent)'}} />
                  <h2 className={styles.sectionTitle}>Key Milestones</h2>
                </div>
                <div className={styles.milestonesHorizontal}>
                  {data.milestones.map(m => (
                    <div
                      key={m.id}
                      className={`${styles.milestoneMiniCard} ${m.status === 'done' ? styles.milestoneDone : ''}`}
                      onClick={() => toggleItem(null, m.id)}
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
                  {trackLabels.map(track => (
                    <button key={track} onClick={() => setActiveTrack(track)} className={`${styles.trackTab} ${selectedTrack === track ? styles.trackTabActive : ''}`}>{track}</button>
                  ))}
                </div>
              </div>

              <div className={styles.layersGrid}>
                {filteredLayers?.map((layer) => {
                  const iconName = resolveLayerIcon(layer);
                  const IconComponent = getIconComponent(iconName);

                  return (
                    <div
                      key={layer.id}
                      id={layer.id}
                      className={`${styles.card} ${expandedLayers.has(layer.id) ? styles.cardExpanded : ''}`}
                      onClick={() => toggleLayerExpansion(layer.id)}
                    >
                      <div className={styles.cardContent}>
                        <div className={`${styles.cardIcon}`}>
                          <IconComponent size={28} />
                        </div>
                        <div className={styles.cardHeader}>
                          <h3 className={styles.cardTitle}><HighlightText text={(layer as any).displayTitle} query={searchQuery} /></h3>
                          <p className={styles.cardDescription}><HighlightText text={layer.description} query={searchQuery} /></p>
                        </div>
                        <div className={styles.layerProgressBlock}>
                          <div className={styles.layerProgressTrack}>
                            <div className={styles.layerProgressBar} style={{ width: `${Math.round((layer.items.filter(item => item.status === 'done').length / layer.items.length) * 100) || 0}%` }} />
                          </div>
                          <span className={styles.layerCount}>{layer.items.length} items</span>
                        </div>

                        {expandedLayers.has(layer.id) && (
                          <div className={styles.expandedContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.itemList}>
                              {layer.items.map(item => (
                                <div
                                  key={item.id}
                                  className={`${styles.itemRow} ${item.status === 'done' ? styles.itemRowDone : ''}`}
                                  onClick={() => toggleItem(layer.id, item.id)}
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
                          <span className={styles.itemCount}>{layer.items.length} items</span>
                          <div className={styles.expandIndicator}>
                            {expandedLayers.has(layer.id) ? <ChevronUp size={20} /> : <ChevronRight size={20} />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </main>

    </div>
  );
}
