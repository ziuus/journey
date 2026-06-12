"use client";

import React, { useEffect, useState } from "react";
import styles from "./dashboard.module.css";
import mStyles from "../metrics.module.css";
import { Target, Brain, Zap, Cpu, ShieldCheck, Activity, Award, BarChart3 } from "lucide-react";

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

  const activeLayers = layerStats.filter(s => s.percent < 100).slice(0, 4);
  const currentPhase = activeLayers[0] || { phase: "Ascended", title: "Complete" };

  const skills = [
    { label: "Systems", val: layerStats[0]?.percent || 0 },
    { label: "Math/ML", val: layerStats[1]?.percent || 0 },
    { label: "AI Arch", val: layerStats[2]?.percent || 0 },
    { label: "Web3", val: layerStats[3]?.percent || 0 },
    { label: "Frontier", val: layerStats[4]?.percent || 0 },
    { label: "Agents", val: layerStats[5]?.percent || 0 },
    { label: "Security", val: layerStats[6]?.percent || 0 },
    { label: "Foundations", val: Math.round(((layerStats[7]?.percent || 0) + (layerStats[8]?.percent || 0) + (layerStats[9]?.percent || 0) + (layerStats[10]?.percent || 0)) / 4) || 0 },
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
            <span>Core Vitality</span>
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
              <span className={mStyles.statLab}>Mastered</span>
            </div>
            <div className={mStyles.statItem}>
              <span className={mStyles.statVal}>{totalItems - doneItems}</span>
              <span className={mStyles.statLab}>Pending</span>
            </div>
          </div>
        </div>

        <div className={mStyles.hudCard}>
          <div className={mStyles.cardLabel}>
            <span>Neural Mapping</span>
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
            <span>Active Horizon</span>
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

export default function DashboardView() {
  const [data, setData] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    void fetchRoadmap();
  }, []);

  if (loading) return <div className={styles.loading}>Accessing Core...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.eyebrow}><Activity size={12} /> System Diagnostics</div>
          <h1 className={styles.title}>Mastery Command</h1>
          <p className={styles.subtitle}>Real-time performance metrics and high-altitude architectural overview.</p>
        </div>
      </header>

      <div className={styles.main}>
        {data && <UserMetrics data={data} />}

        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <Award className={styles.cardIcon} size={20} />
              <h2 className={styles.cardTitle}>Milestone Analytics</h2>
            </div>
            <div className={styles.milestoneGrid}>
              {data?.milestones.map(m => (
                <div key={m.id} className={`${styles.milestoneItem} ${m.status === 'done' ? styles.milestoneDone : ''}`}>
                  <div className={styles.statusDot} />
                  <span>{m.title}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <BarChart3 className={styles.cardIcon} size={20} />
              <h2 className={styles.cardTitle}>Engine Status</h2>
            </div>
            <div className={styles.statusList}>
              <div className={styles.statusRow}>
                <span>System Protocol</span>
                <span className={styles.statusVal}>Liquid Glass v1.4</span>
              </div>
              <div className={styles.statusRow}>
                <span>Neural Synapse</span>
                <span className={styles.statusVal}>Active</span>
              </div>
              <div className={styles.statusRow}>
                <span>Data Integrity</span>
                <span className={styles.statusVal}>Verified</span>
              </div>
              <div className={styles.statusRow}>
                <span>Core Sync</span>
                <span className={styles.statusVal}>Online</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
