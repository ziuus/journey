#!/usr/bin/env python3
import os

content = r''''use client';

import React, { useEffect, useState } from 'react';
import styles from './dashboard.module.css';
import {
  Target, Brain, Zap, Activity, Award, BarChart3,
  AlertTriangle, Clock, Flame, CheckCircle2, Circle, ArrowRight,
  CalendarDays, CalendarRange, ListTodo, Hash, TrendingUp
} from 'lucide-react';
import type { RawRoadmapData } from '@/lib/storage';
import type { ScoredItem, TodayRecommendation, WeekGroup, DashboardState } from '@/lib/execution-recommendations';
import {
  computeDashboard, scoreItem, getTrackLabel
} from '@/lib/execution-recommendations';

// ─── Badge ─────────────────────────────────────────────────────

const Badge = ({ label, color }: { label: string; color?: string }) => (
  <span className={styles.badge} style={color ? { borderColor: color, color } : undefined}>
    {label}
  </span>
);

// ─── Priority badge with color ─────────────────────────────────

const priorityColor = (p?: string) => {
  switch (p) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    case 'low': return '#6b7280';
    default: return undefined;
  }
};

const horizonLabel = (h?: string) => {
  switch (h) {
    case '3_months': return '3M';
    case '6_months': return '6M';
    case '12_months': return '1Y';
    case '2_years': return '2Y';
    case '5_years': return '5Y';
    default: return h ?? '';
  }
};

// ─── Today Card ────────────────────────────────────────────────

const TodayCard = ({ rec }: { rec: TodayRecommendation }) => {
  const { scored } = rec;
  const { item } = scored;
  const isActive = item.status === 'active';

  return (
    <div className={`${styles.todayCard} ${isActive ? styles.todayCardActive : ''}`}>
      <div className={styles.todayCardHeader}>
        <span className={styles.todayScore}>{scored.score}</span>
        <div className={styles.todayBadges}>
          <Badge label={getTrackLabel(item.track)} />
          {item.priority && <Badge label={item.priority.toUpperCase()} color={priorityColor(item.priority)} />}
          {item.horizon && <Badge label={horizonLabel(item.horizon)} />}
        </div>
      </div>
      <h3 className={styles.todayTitle}>{item.title}</h3>
      {item.next_action && (
        <p className={styles.todayAction}>
          <ArrowRight size={12} className={styles.actionArrow} />
          {item.next_action}
        </p>
      )}
      <p className={styles.todayReason}>{rec.reason}</p>
      <div className={styles.todayMeta}>
        <span className={styles.metaItem}>
          <Hash size={10} /> IV:{item.interview_value ?? '?'} · EV:{item.engineering_value ?? '?'}
        </span>
        {scored.blocked && (
          <span className={styles.metaBlocked}>
            <AlertTriangle size={10} /> Blocked
          </span>
        )}
        {scored.isOverdue && (
          <span className={styles.metaOverdue}>
            <Clock size={10} /> Overdue
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Scored Item Row ────────────────────────────────────────────

const ScoredRow = ({ scored }: { scored: ScoredItem }) => (
  <div className={styles.scoredRow}>
    <div className={styles.scoredInfo}>
      <span className={styles.scoredTitle}>{scored.item.title}</span>
      <span className={styles.scoredTrack}>{getTrackLabel(scored.item.track)}</span>
    </div>
    <div className={styles.scoredBadges}>
      {scored.item.priority && <Badge label={scored.item.priority.toUpperCase()} color={priorityColor(scored.item.priority)} />}
      {scored.item.horizon && <Badge label={horizonLabel(scored.item.horizon)} />}
      {scored.blocked && <Badge label="BLOCKED" color="#ef4444" />}
      <span className={styles.scoredScore}>{scored.score}</span>
    </div>
  </div>
);

// ─── This Week Group ────────────────────────────────────────────

const WeekGroupCard = ({ group }: { group: WeekGroup }) => (
  <div className={styles.weekGroup}>
    <h3 className={styles.weekGroupTitle}>{group.label}</h3>
    <div className={styles.weekItems}>
      {group.items.map((s, i) => (
        <div key={i} className={styles.weekItem}>
          <Circle size={12} className={styles.weekBullet} />
          <div className={styles.weekItemInfo}>
            <span className={styles.weekItemTitle}>{s.item.title}</span>
            {s.item.next_action && (
              <span className={styles.weekItemAction}>{s.item.next_action}</span>
            )}
          </div>
          <span className={styles.weekItemScore}>{s.score}</span>
        </div>
      ))}
    </div>
  </div>
);

// ─── Main Dashboard Component ──────────────────────────────────

export default function ExecutionDashboard() {
  const [dashboard, setDashboard] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const res = await fetch('/api/roadmap?userId=local_user');
        const json: RawRoadmapData = await res.json();
        const state = computeDashboard(json.layers);
        setDashboard(state);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    void fetchRoadmap();
  }, []);

  if (loading) return <div className={styles.loading}>Accessing Core...</div>;
  if (error) return <div className={styles.loading}>Error: {error}</div>;
  if (!dashboard) return <div className={styles.loading}>No data</div>;

  const { today, thisWeek, highestROI, blocked, overdue } = dashboard;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.eyebrow}><Activity size={12} /> Execution OS</div>
        <h1 className={styles.title}>What Should I Do Now?</h1>
        <p className={styles.subtitle}>AI-driven daily recommendations — prioritised by ROI, urgency, and dependencies.</p>
      </header>

      <div className={styles.main}>
        {/* ─── Today View ───────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Zap size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Today&apos;s Focus</h2>
            <span className={styles.sectionCount}>{today.length} of 5 slots</span>
          </div>
          {today.length === 0 ? (
            <div className={styles.empty}>No recommendations yet. Start by adding items to your roadmap.</div>
          ) : (
            <div className={styles.todayGrid}>
              {today.map((rec, i) => (
                <TodayCard key={i} rec={rec} />
              ))}
            </div>
          )}
        </section>

        {/* ─── This Week View ────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <CalendarDays size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>This Week</h2>
          </div>
          {thisWeek.length === 0 ? (
            <div className={styles.empty}>Weekly view — grouping by track category.</div>
          ) : (
            <div className={styles.weekGrid}>
              {thisWeek.map((group, i) => (
                <WeekGroupCard key={i} group={group} />
              ))}
            </div>
          )}
        </section>

        {/* ─── Two-column: Highest ROI + Blocked ──────────────── */}
        <div className={styles.splitGrid}>
          {/* Highest ROI Now */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <TrendingUp size={20} className={styles.sectionIcon} />
              <h2 className={styles.sectionTitle}>Highest ROI Now</h2>
            </div>
            {highestROI.length === 0 ? (
              <div className={styles.empty}>No high-ROI items identified.</div>
            ) : (
              <div className={styles.scoredList}>
                {highestROI.map((s, i) => (
                  <ScoredRow key={i} scored={s} />
                ))}
              </div>
            )}
          </section>

          {/* Blocked Items */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <AlertTriangle size={20} className={styles.sectionIcon} />
              <h2 className={styles.sectionTitle}>Blocked Items</h2>
              {blocked.length > 0 && (
                <span className={styles.sectionCount}>{blocked.length} blocked</span>
              )}
            </div>
            {blocked.length === 0 ? (
              <div className={styles.empty}>
                <CheckCircle2 size={16} />
                <span>No blocked items. All dependencies are met.</span>
              </div>
            ) : (
              <div className={styles.scoredList}>
                {blocked.map((s, i) => (
                  <div key={i} className={styles.blockedRow}>
                    <div className={styles.scoredInfo}>
                      <span className={styles.scoredTitle}>{s.item.title}</span>
                      <span className={styles.blockedBy}>Needs: {s.blockedBy.join(', ')}</span>
                    </div>
                    <Badge label="BLOCKED" color="#ef4444" />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ─── Overdue / Stale ──────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Clock size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Overdue &amp; Stale</h2>
          </div>
          {overdue.length === 0 ? (
            <div className={styles.empty}>
              <Clock size={14} />
              <span>No date data yet. Add <code>target_date</code> or <code>last_worked_on</code> to items to track overdue and stale items.</span>
            </div>
          ) : (
            <div className={styles.scoredList}>
              {overdue.map((s, i) => (
                <div key={i} className={styles.scoredRow}>
                  <div className={styles.scoredInfo}>
                    <span className={styles.scoredTitle}>{s.item.title}</span>
                    <span className={styles.scoredTrack}>
                      {s.isOverdue ? 'Overdue' : 'Stale'}
                      {s.item.target_date ? ` · Due: ${s.item.target_date}` : ''}
                      {s.item.last_worked_on ? ` · Last: ${s.item.last_worked_on}` : ''}
                    </span>
                  </div>
                  <Badge label={s.isOverdue ? 'OVERDUE' : 'STALE'} color={s.isOverdue ? '#ef4444' : '#f97316'} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
'''

path = os.path.expanduser('~/Projects/journey/src/app/dashboard/page.tsx')
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"Written {len(content)} bytes to {path}")
