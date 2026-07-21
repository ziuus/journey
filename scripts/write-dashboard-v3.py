#!/usr/bin/env python3
import os

content = '''\
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import styles from './dashboard.module.css';
import {
  Target, Brain, Zap, Activity, Award, BarChart3,
  AlertTriangle, Clock, Flame, CheckCircle2, Circle, ArrowRight,
  CalendarDays, CalendarRange, ListTodo, Hash, TrendingUp,
  Play, Square, Check, Ban, Timer, Edit3, X, ChevronDown,
  Unlock, Layers, GripVertical, Loader2,
} from 'lucide-react';
import type { RawRoadmapData, RawRoadmapItem } from '@/lib/storage';
import type { ScoredItem, TodayRecommendation, WeekGroup, DashboardState } from '@/lib/execution-recommendations';
import {
  computeDashboard,
  scoreItem,
  getTrackLabel,
  resolveBlockedByTitles,
  buildIdMap,
  getUnlocks,
} from '@/lib/execution-recommendations';

// ─── Badge ─────────────────────────────────────────────────────

const Badge = ({ label, color }: { label: string; color?: string }) => (
  <span className={styles.badge} style={color ? { borderColor: color, color } : undefined}>
    {label}
  </span>
);

// ─── Priority / horizon helpers ─────────────────────────────────

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

/** Human label for daily slot */
const slotLabel = (slot: TodayRecommendation['dailySlot']): string => {
  switch (slot) {
    case 'deep_work': return 'Deep Work';
    case 'interview_dsa': return 'Interview / DSA';
    case 'project': return 'Project';
    case 'light_review': return 'Light Review';
    case 'wildcard': return 'Wildcard';
  }
};

const slotIcon = (slot: TodayRecommendation['dailySlot']) => {
  switch (slot) {
    case 'deep_work': return <Brain size={14} />;
    case 'interview_dsa': return <Hash size={14} />;
    case 'project': return <Award size={14} />;
    case 'light_review': return <Activity size={14} />;
    case 'wildcard': return <Zap size={14} />;
  }
};

// ─── Inline Next Action Editor ──────────────────────────────────

const InlineEditor = ({
  value,
  onSave,
  onCancel,
}: {
  value: string;
  onSave: (v: string) => void;
  onCancel: () => void;
}) => {
  const [text, setText] = useState(value);
  return (
    <div className={styles.inlineEditor}>
      <input
        className={styles.inlineInput}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What is the next action?"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave(text);
          if (e.key === 'Escape') onCancel();
        }}
      />
      <button className={styles.inlineSaveBtn} onClick={() => onSave(text)} title="Save">
        <Check size={14} />
      </button>
      <button className={styles.inlineCancelBtn} onClick={onCancel} title="Cancel">
        <X size={14} />
      </button>
    </div>
  );
};

// ─── Snooze Modal ───────────────────────────────────────────────

const SnoozeDialog = ({
  onConfirm,
  onCancel,
}: {
  onConfirm: (until: string) => void;
  onCancel: () => void;
}) => {
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Snooze Until</h3>
        <input
          className={styles.modalInput}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <div className={styles.modalActions}>
          <button className={styles.modalBtnCancel} onClick={onCancel}>Cancel</button>
          <button className={styles.modalBtnConfirm} onClick={() => onConfirm(date)}>Snooze</button>
        </div>
      </div>
    </div>
  );
};

// ─── Action Button Row ──────────────────────────────────────────

interface ActionBarProps {
  item: RawRoadmapItem;
  onAction: (action: string, payload?: Record<string, unknown>) => Promise<void>;
}

const ActionBar = ({ item, onAction }: ActionBarProps) => {
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (action: string, payload?: Record<string, unknown>) => {
    setBusy(action);
    try {
      await onAction(action, payload);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={styles.actionBar}>
      {item.status !== 'active' && item.status !== 'done' && (
        <button
          className={styles.actionBtn}
          onClick={() => act('start')}
          disabled={busy !== null}
          title="Start working on this"
        >
          {busy === 'start' ? <Loader2 size={12} className={styles.spin} /> : <Play size={12} />}
          Start
        </button>
      )}
      {item.status !== 'done' && (
        <button
          className={`${styles.actionBtn} ${styles.actionDone}`}
          onClick={() => act('done')}
          disabled={busy !== null}
          title="Mark as done"
        >
          {busy === 'done' ? <Loader2 size={12} className={styles.spin} /> : <Check size={12} />}
          Done
        </button>
      )}
      <button
        className={styles.actionBtn}
        onClick={() => act('snooze')}
        disabled={busy !== null}
        title="Snooze this item"
      >
        {busy === 'snooze' ? <Loader2 size={12} className={styles.spin} /> : <Timer size={12} />}
        Snooze
      </button>
      {item.status !== 'blocked' && item.status !== 'done' && (
        <button
          className={`${styles.actionBtn} ${styles.actionBlock}`}
          onClick={() => act('block')}
          disabled={busy !== null}
          title="Mark as blocked"
        >
          {busy === 'block' ? <Loader2 size={12} className={styles.spin} /> : <Ban size={12} />}
          Block
        </button>
      )}
      <button
        className={styles.actionBtn}
        onClick={() => act('edit_next')}
        disabled={busy !== null}
        title="Edit next action"
      >
        <Edit3 size={12} />
        Next
      </button>
    </div>
  );
};

// ─── Today Card (with actions + unlock) ────────────────────────

const TodayCard = ({
  rec,
  onAction,
  onEditNextAction,
  editingNextId,
  nextActionBuffer,
  setNextActionBuffer,
  onSaveNextAction,
  onCancelEditNext,
  onSnoozeClick,
  snoozeItemId,
}: {
  rec: TodayRecommendation;
  onAction: (item: RawRoadmapItem, action: string, payload?: Record<string, unknown>) => Promise<void>;
  onEditNextAction: (item: RawRoadmapItem) => void;
  editingNextId: string | null;
  nextActionBuffer: string;
  setNextActionBuffer: (v: string) => void;
  onSaveNextAction: (item: RawRoadmapItem) => Promise<void>;
  onCancelEditNext: () => void;
  onSnoozeClick: (item: RawRoadmapItem) => void;
  snoozeItemId: string | null;
}) => {
  const { scored, dailySlot } = rec;
  const { item } = scored;
  const isActive = item.status === 'active';
  const isEditing = editingNextId === item.id;

  return (
    <div className={`${styles.todayCard} ${isActive ? styles.todayCardActive : ''}`}>
      {/* Slot label */}
      <div className={styles.todaySlot}>
        {slotIcon(dailySlot)}
        <span>{slotLabel(dailySlot)}</span>
      </div>

      <div className={styles.todayCardHeader}>
        <span className={styles.todayScore}>{scored.score}</span>
        <div className={styles.todayBadges}>
          <Badge label={getTrackLabel(item.track)} />
          {item.priority && <Badge label={item.priority.toUpperCase()} color={priorityColor(item.priority)} />}
          {item.horizon && <Badge label={horizonLabel(item.horizon)} />}
        </div>
      </div>
      <h3 className={styles.todayTitle}>{item.title}</h3>

      {/* Next action with inline edit */}
      {isEditing ? (
        <InlineEditor
          value={nextActionBuffer}
          onSave={(v) => {
            setNextActionBuffer(v);
            onSaveNextAction(item);
          }}
          onCancel={onCancelEditNext}
        />
      ) : (
        item.next_action && (
          <p className={styles.todayAction}>
            <ArrowRight size={12} className={styles.actionArrow} />
            {item.next_action}
          </p>
        )
      )}

      {/* Unlock display */}
      {scored.unlocks.length > 0 && (
        <div className={styles.unlockDisplay}>
          <Unlock size={11} />
          <span>
            Completing unlocks {scored.unlocks.length} item{scored.unlocks.length > 1 ? 's' : ''}:
            {' '}{scored.unlocks.slice(0, 2).join(', ')}
            {scored.unlocks.length > 2 ? ` +${scored.unlocks.length - 2} more` : ''}
          </span>
        </div>
      )}

      <p className={styles.todayReason}>{rec.reason}</p>

      <div className={styles.todayMeta}>
        <span className={styles.metaItem}>
          <Hash size={10} /> IV:{item.interview_value ?? '?'} · EV:{item.engineering_value ?? '?'}
        </span>
        {scored.blocked && (
          <span className={styles.metaBlocked}><AlertTriangle size={10} /> Blocked</span>
        )}
        {scored.isOverdue && (
          <span className={styles.metaOverdue}><Clock size={10} /> Overdue</span>
        )}
        {scored.dependents > 0 && (
          <span className={styles.metaDeps}>Unlocks {scored.dependents}</span>
        )}
      </div>

      <ActionBar item={item} onAction={(action, payload) => onAction(item, action, payload)} />

      {snoozeItemId === item.id && (
        <SnoozeDialog
          onConfirm={(until) => onAction(item, 'snooze', { snoozed_until: until })}
          onCancel={() => onSnoozeClick(null as unknown as RawRoadmapItem)}
        />
      )}

      {item.snoozed_until && (
        <div className={styles.snoozeBadge}>
          <Clock size={10} /> Snoozed until {item.snoozed_until}
        </div>
      )}
    </div>
  );
};

// ─── Scored Item Row (with actions) ────────────────────────────

const ScoredRow = ({
  scored,
  onAction,
  onEditNextAction,
  editingNextId,
  nextActionBuffer,
  setNextActionBuffer,
  onSaveNextAction,
  onCancelEditNext,
  onSnoozeClick,
  snoozeItemId,
}: {
  scored: ScoredItem;
  onAction: (item: RawRoadmapItem, action: string, payload?: Record<string, unknown>) => Promise<void>;
  onEditNextAction: (item: RawRoadmapItem) => void;
  editingNextId: string | null;
  nextActionBuffer: string;
  setNextActionBuffer: (v: string) => void;
  onSaveNextAction: (item: RawRoadmapItem) => Promise<void>;
  onCancelEditNext: () => void;
  onSnoozeClick: (item: RawRoadmapItem) => void;
  snoozeItemId: string | null;
}) => {
  const { item } = scored;
  const isEditing = editingNextId === item.id;

  return (
    <div className={styles.scoredRow}>
      <div className={styles.scoredInfo}>
        <span className={styles.scoredTitle}>{item.title}</span>
        <span className={styles.scoredTrack}>{getTrackLabel(item.track)}</span>

        {/* Unlock display */}
        {scored.unlocks.length > 0 && (
          <span className={styles.scoredUnlock}>
            <Unlock size={10} /> Unlocks {scored.unlocks.length} item{scored.unlocks.length > 1 ? 's' : ''}
          </span>
        )}

        {isEditing ? (
          <InlineEditor
            value={nextActionBuffer}
            onSave={(v) => {
              setNextActionBuffer(v);
              onSaveNextAction(item);
            }}
            onCancel={onCancelEditNext}
          />
        ) : (
          item.next_action && (
            <span className={styles.scoredAction}>
              <ArrowRight size={10} /> {item.next_action}
            </span>
          )
        )}
      </div>
      <div className={styles.scoredBadges}>
        {item.priority && <Badge label={item.priority.toUpperCase()} color={priorityColor(item.priority)} />}
        {item.horizon && <Badge label={horizonLabel(item.horizon)} />}
        {scored.blocked && <Badge label="BLOCKED" color="#ef4444" />}
        <span className={styles.scoredScore}>{scored.score}</span>
      </div>
      <ActionBar item={item} onAction={(action, payload) => onAction(item, action, payload)} />

      {snoozeItemId === item.id && (
        <SnoozeDialog
          onConfirm={(until) => onAction(item, 'snooze', { snoozed_until: until })}
          onCancel={() => onSnoozeClick(null as unknown as RawRoadmapItem)}
        />
      )}
    </div>
  );
};

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

// ─── Blocked Row (read-only, no actions) ───────────────────────

const BlockedRow = ({
  scored,
  idMap,
}: {
  scored: ScoredItem;
  idMap: Map<string, RawRoadmapItem>;
}) => (
  <div className={styles.blockedRow}>
    <div className={styles.scoredInfo}>
      <span className={styles.scoredTitle}>{scored.item.title}</span>
      <span className={styles.blockedBy}>
        Needs: {resolveBlockedByTitles(scored.blockedBy, idMap).join(', ')}
      </span>
    </div>
    <Badge label="BLOCKED" color="#ef4444" />
  </div>
);

// ─── Overdue Row ────────────────────────────────────────────────

const OverdueRow = ({ scored }: { scored: ScoredItem }) => (
  <div className={styles.scoredRow}>
    <div className={styles.scoredInfo}>
      <span className={styles.scoredTitle}>{scored.item.title}</span>
      <span className={styles.scoredTrack}>
        {scored.isOverdue ? 'Overdue' : 'Stale'}
        {scored.item.target_date ? ` \u00b7 Due: ${scored.item.target_date}` : ''}
        {scored.item.last_worked_on ? ` \u00b7 Last: ${scored.item.last_worked_on}` : ''}
      </span>
    </div>
    <Badge label={scored.isOverdue ? 'OVERDUE' : 'STALE'} color={scored.isOverdue ? '#ef4444' : '#f97316'} />
  </div>
);

// ─── Main Dashboard Component ──────────────────────────────────

export default function ExecutionDashboard() {
  const [dashboard, setDashboard] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [idMap, setIdMap] = useState<Map<string, RawRoadmapItem> | null>(null);

  // Inline next action editor state
  const [editingNextId, setEditingNextId] = useState<string | null>(null);
  const [nextActionBuffer, setNextActionBuffer] = useState('');
  const [snoozeItemId, setSnoozeItemId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/roadmap?userId=local_user');
      const json: RawRoadmapData = await res.json();
      const state = computeDashboard(json.layers);
      setDashboard(state);
      setIdMap(buildIdMap(json.layers));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData, refreshKey]);

  /** Unified action handler: calls PATCH API, then re-fetches */
  const handleAction = async (
    item: RawRoadmapItem,
    action: string,
    payload?: Record<string, unknown>,
  ) => {
    if (action === 'snooze') {
      // Show snooze dialog, don't patch yet
      setSnoozeItemId(item.id);
      return;
    }
    if (action === 'edit_next') {
      setNextActionBuffer(item.next_action ?? '');
      setEditingNextId(item.id);
      return;
    }

    const updates: Record<string, unknown> = {};
    switch (action) {
      case 'start':
        updates.status = 'active';
        break;
      case 'done':
        updates.status = 'done';
        break;
      case 'block':
        updates.status = 'blocked';
        break;
      case 'snooze_confirm':
        updates.snoozed_until = payload?.snoozed_until as string;
        updates.status = 'pending';
        setSnoozeItemId(null);
        break;
      default:
        return;
    }

    if (Object.keys(updates).length === 0) return;
    await performPatch(item.id, updates);
  };

  const handleEditNextAction = (item: RawRoadmapItem) => {
    setNextActionBuffer(item.next_action ?? '');
    setEditingNextId(item.id);
  };

  const handleSaveNextAction = async (item: RawRoadmapItem) => {
    await performPatch(item.id, { next_action: nextActionBuffer });
    setEditingNextId(null);
  };

  const handleCancelEditNext = () => {
    setEditingNextId(null);
  };

  const handleSnoozeClick = (item: RawRoadmapItem) => {
    if (item) {
      setSnoozeItemId(item.id);
    } else {
      setSnoozeItemId(null);
    }
  };

  const performPatch = async (itemId: string, updates: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/roadmap/item?userId=local_user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, updates }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        console.error('PATCH failed:', res.status, errBody);
        return;
      }
      // Force re-fetch
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('PATCH error:', err);
    }
  };

  if (loading) return <div className={styles.loading}>Accessing Core...</div>;
  if (error) return <div className={styles.loading}>Error: {error}</div>;
  if (!dashboard) return <div className={styles.loading}>No data</div>;

  const { today, thisWeek, highestROI, blocked, overdue } = dashboard;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.eyebrow}><Activity size={12} /> Execution OS</div>
        <h1 className={styles.title}>What Should I Do Now?</h1>
        <p className={styles.subtitle}>AI-driven daily recommendations \u2014 prioritised by ROI, urgency, dependencies, and unlock potential.</p>
      </header>

      <div className={styles.main}>
        {/* ─── Today View (4-5 balanced slots) ──────────────── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Zap size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Today&#39;s Focus</h2>
            <span className={styles.sectionCount}>{today.length} items</span>
          </div>
          {today.length === 0 ? (
            <div className={styles.empty}>No recommendations yet. Start by adding items to your roadmap.</div>
          ) : (
            <div className={styles.todayGrid}>
              {today.map((rec, i) => (
                <TodayCard
                  key={i}
                  rec={rec}
                  onAction={handleAction}
                  onEditNextAction={handleEditNextAction}
                  editingNextId={editingNextId}
                  nextActionBuffer={nextActionBuffer}
                  setNextActionBuffer={setNextActionBuffer}
                  onSaveNextAction={handleSaveNextAction}
                  onCancelEditNext={handleCancelEditNext}
                  onSnoozeClick={handleSnoozeClick}
                  snoozeItemId={snoozeItemId}
                />
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
            <div className={styles.empty}>Weekly view \u2014 grouping by track category.</div>
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
                  <ScoredRow
                    key={i}
                    scored={s}
                    onAction={handleAction}
                    onEditNextAction={handleEditNextAction}
                    editingNextId={editingNextId}
                    nextActionBuffer={nextActionBuffer}
                    setNextActionBuffer={setNextActionBuffer}
                    onSaveNextAction={handleSaveNextAction}
                    onCancelEditNext={handleCancelEditNext}
                    onSnoozeClick={handleSnoozeClick}
                    snoozeItemId={snoozeItemId}
                  />
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
                  <BlockedRow key={i} scored={s} idMap={idMap!} />
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
                <OverdueRow key={i} scored={s} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
'''

path = os.path.expanduser("~/Projects/journey/src/app/dashboard/page.tsx")
with open(path, "w", encoding="utf-8") as f:
    f.write(content.strip())
print(f"Written {len(content.strip())} bytes to {path}")
