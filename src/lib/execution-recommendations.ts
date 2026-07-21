/**
 * Execution recommendation engine.
 * Domain-agnostic scoring of roadmap items to answer "What should I do now?"
 *
 * Scoring weighs:
 *   - priority (critical=100 … low=10)
 *   - horizon (3M=100 … 5Y=5)
 *   - career_roi (very_high=100 … low=10)
 *   - interview_value (0–10 mapped to 0–100)
 *   - engineering_value (0–10 mapped to 0–50)
 *   - blocked_penalty (−200 if unmet deps exist)
 *   - status_bonus (active=30, pending=20)
 *   - next_action bonus (+20 if a concrete next_action is set)
 *   - foundational bonus (+3 per downstream dependent item)
 *   - vagueness penalty (−30 if no next_action set and title > 4 words)
 */

import type { RawRoadmapItem, RawLayerData } from "@/types/roadmap";

// ─── Types ──────────────────────────────────────────────────────

export interface ScoredItem {
  item: RawRoadmapItem;
  layerTitle: string;
  layerId: string;
  score: number;
  blocked: boolean;
  blockedBy: string[];
  trackLabel: string;
  isOverdue: boolean;
  isStale: boolean;
  /** Number of other items that depend on this one (foundational score) */
  dependents: number;
  /** Items that this one unlocks when completed (titles) */
  unlocks: string[];
}

export interface TodayRecommendation {
  scored: ScoredItem;
  reason: string;
  /** Daily grouping category */
  dailySlot: "deep_work" | "interview_dsa" | "project" | "light_review" | "wildcard";
}

export interface WeekGroup {
  label: string;
  items: ScoredItem[];
}

export interface DashboardState {
  today: TodayRecommendation[];
  thisWeek: WeekGroup[];
  highestROI: ScoredItem[];
  blocked: ScoredItem[];
  overdue: ScoredItem[];
}

// ─── Constants ──────────────────────────────────────────────────

const PRIORITY_WEIGHT: Record<string, number> = {
  critical: 100,
  high: 60,
  medium: 30,
  low: 10,
};

const HORIZON_WEIGHT: Record<string, number> = {
  "3_months": 100,
  "6_months": 60,
  "12_months": 35,
  "2_years": 15,
  "5_years": 5,
  ongoing: 20,
};

const ROI_WEIGHT: Record<string, number> = {
  very_high: 100,
  high: 60,
  medium: 30,
  low: 10,
};

// ─── Helpers ────────────────────────────────────────────────────

function safeNum(v: unknown, def = 0): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isNaN(n) ? def : n;
  }
  return def;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Today as YYYY-MM-DD */
function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function countWords(s: string): number {
  return s.trim().split(/\s+/).length;
}

// ─── Core scoring ───────────────────────────────────────────────

export function scoreItem(
  item: RawRoadmapItem,
  dependentCount = 0,
): number {
  let s = 0;

  // Priority
  s += PRIORITY_WEIGHT[item.priority ?? ""] ?? 10;

  // Horizon
  s += HORIZON_WEIGHT[item.horizon ?? ""] ?? 10;

  // Career ROI
  const cr = item.career_roi ?? item.metadata?.career_roi;
  s += ROI_WEIGHT[cr ?? ""] ?? 10;

  // Interview value (0–10 → 0–100)
  s += clamp(safeNum(item.interview_value, 0), 0, 10) * 10;

  // Engineering value (0–10 → 0–50)
  s += clamp(safeNum(item.engineering_value, 0), 0, 10) * 5;

  // Status bonus
  s += item.status === "active" ? 30 : item.status === "pending" ? 20 : 0;

  // Next action bonus (+20 if a concrete next_action is set)
  if (item.next_action && item.next_action.trim().length > 0) {
    s += 20;
  }

  // Foundational bonus (+3 per dependent item)
  s += dependentCount * 3;

  // Vagueness penalty (−30 if no next_action and broad title)
  if (!item.next_action || item.next_action.trim().length === 0) {
    if (countWords(item.title) >= 5) {
      s -= 30;
    }
  }

  return s;
}

// ─── Track label extraction ─────────────────────────────────────

export function getTrackLabel(track?: string): string {
  const MAP: Record<string, string> = {
    skills: "Skills",
    projects: "Projects",
    dsa_interviews: "DSA & Interviews",
    system_design: "System Design",
    ai_engineering: "AI Engineering",
    backend_cloud_infra: "Backend / Cloud / Infra",
    portfolio_resume: "Portfolio / Resume",
    applications_networking: "Applications / Networking",
    health_fitness: "Health & Fitness",
    interview_prep: "Interview Prep",
    portfolio_application: "Portfolio / Application",
  };
  return MAP[track ?? ""] ?? track ?? "General";
}

/** Map track -> daily grouping slot */
function trackToDailySlot(track?: string): TodayRecommendation["dailySlot"] {
  switch (track) {
    case "system_design":
    case "ai_engineering":
    case "backend_cloud_infra":
    case "skills":
      return "deep_work";
    case "dsa_interviews":
    case "interview_prep":
      return "interview_dsa";
    case "projects":
    case "portfolio_resume":
    case "applications_networking":
    case "portfolio_application":
      return "project";
    case "health_fitness":
      return "light_review";
    default:
      return "light_review";
  }
}

// ─── Dependency helpers ─────────────────────────────────────────

export function buildIdMap(layers: RawLayerData[]): Map<string, RawRoadmapItem> {
  const m = new Map<string, RawRoadmapItem>();
  for (const layer of layers) {
    for (const item of layer.items) {
      m.set(item.id, item);
    }
  }
  return m;
}

export function getBlockedBy(
  item: RawRoadmapItem,
  idMap: Map<string, RawRoadmapItem>,
): string[] {
  const deps = item.depends_on ?? item.prerequisites ?? [];
  return deps.filter((depId) => {
    const dep = idMap.get(depId);
    return !dep || dep.status !== "done";
  });
}

/** Resolve a list of dependency IDs to human-readable item titles. */
export function resolveBlockedByTitles(
  blockedBy: string[],
  idMap: Map<string, RawRoadmapItem>,
): string[] {
  return blockedBy.map((depId) => {
    const dep = idMap.get(depId);
    return dep ? dep.title : depId;
  });
}

/**
 * Count how many items in the dataset depend on this item.
 * An item X depends on item Y if Y appears in X.depends_on[].
 */
export function countDependents(
  itemId: string,
  layers: RawLayerData[],
): number {
  let count = 0;
  for (const layer of layers) {
    for (const other of layer.items) {
      const deps = other.depends_on ?? other.prerequisites ?? [];
      if (deps.includes(itemId)) count++;
    }
  }
  return count;
}

/**
 * Return human-readable titles of items this item unlocks when completed.
 */
export function getUnlocks(
  itemId: string,
  layers: RawLayerData[],
): string[] {
  const unlocked: string[] = [];
  for (const layer of layers) {
    for (const other of layer.items) {
      const deps = other.depends_on ?? other.prerequisites ?? [];
      if (deps.includes(itemId) && other.status !== "done") {
        unlocked.push(other.title);
      }
    }
  }
  return unlocked;
}

// ─── Collect all items with context ─────────────────────────────

export function collectItems(
  layers: RawLayerData[],
  trackFilter?: string,
): ScoredItem[] {
  const idMap = buildIdMap(layers);
  const results: ScoredItem[] = [];

  for (const layer of layers) {
    for (const item of layer.items) {
      // Skip completed and blocked items
      if (item.status === "done" || item.status === "blocked") continue;

      // Skip snoozed items
      if (item.snoozed_until) {
        try {
          const snoozeDate = new Date(item.snoozed_until);
          const now = new Date();
          if (!isNaN(snoozeDate.getTime()) && snoozeDate >= now) continue;
        } catch {
          // bad date — don't skip
        }
      }

      // Optional track filter
      if (trackFilter && item.track !== trackFilter) continue;

      const blockedBy = getBlockedBy(item, idMap);
      const dependentCount = countDependents(item.id, layers);
      const score = scoreItem(item, dependentCount);

      results.push({
        item,
        layerTitle: layer.title,
        layerId: layer.id,
        score,
        blocked: blockedBy.length > 0,
        blockedBy,
        trackLabel: getTrackLabel(item.track),
        isOverdue: false,
        isStale: false,
        dependents: dependentCount,
        unlocks: getUnlocks(item.id, layers),
      });
    }
  }

  return results;
}

// ─── Overdue / stale detection ──────────────────────────────────

export function computeOverdueStale(scored: ScoredItem[]): void {
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  for (const s of scored) {
    // Overdue: target_date in the past and not done
    if (s.item.target_date) {
      const t = new Date(s.item.target_date).getTime();
      if (!isNaN(t) && t < now) {
        s.isOverdue = true;
      }
    }

    // Stale: not worked on in 30+ days
    if (s.item.last_worked_on) {
      const lw = new Date(s.item.last_worked_on).getTime();
      if (!isNaN(lw) && now - lw > THIRTY_DAYS) {
        s.isStale = true;
      }
    }

    // Also stale if created long ago and never worked on
    if (!s.item.last_worked_on && s.item.created_at) {
      const ca = new Date(s.item.created_at).getTime();
      if (!isNaN(ca) && now - ca > THIRTY_DAYS) {
        s.isStale = true;
      }
    }
  }
}

// ─── Daily grouping (v3: 4-5 balanced slots) ────────────────────

const DAILY_SLOTS: TodayRecommendation["dailySlot"][] = [
  "deep_work",
  "interview_dsa",
  "project",
  "light_review",
  "wildcard",
];

export function getTodayRecommendations(
  layers: RawLayerData[],
): TodayRecommendation[] {
  const scored = collectItems(layers);
  computeOverdueStale(scored);

  // Apply blocked penalty
  for (const s of scored) {
    if (s.blocked) s.score -= 200;
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Assign items to daily slots
  const slotMap = new Map<TodayRecommendation["dailySlot"], ScoredItem[]>();

  for (const slot of DAILY_SLOTS) {
    slotMap.set(slot, []);
  }

  for (const s of scored) {
    const slot = trackToDailySlot(s.item.track);
    const arr = slotMap.get(slot)!;
    if (arr.length < 3) {
      arr.push(s);
    }
  }

  // Pick best per slot
  const selected: TodayRecommendation[] = [];

  // 1) deep_work — highest scoring single deep work item
  const deepWorkItems = slotMap.get("deep_work")!;
  if (deepWorkItems.length > 0) {
    selected.push({
      scored: deepWorkItems[0],
      reason: buildReason(deepWorkItems[0]),
      dailySlot: "deep_work",
    });
  }

  // 2) interview_dsa — best DSA/interview item
  const dsaItems = slotMap.get("interview_dsa")!;
  if (dsaItems.length > 0) {
    selected.push({
      scored: dsaItems[0],
      reason: buildReason(dsaItems[0]),
      dailySlot: "interview_dsa",
    });
  }

  // 3) project — best project/portfolio item
  const projectItems = slotMap.get("project")!;
  if (projectItems.length > 0) {
    selected.push({
      scored: projectItems[0],
      reason: buildReason(projectItems[0]),
      dailySlot: "project",
    });
  }

  // 4) light_review — best light review item
  const lightItems = slotMap.get("light_review")!;
  if (lightItems.length > 0) {
    selected.push({
      scored: lightItems[0],
      reason: buildReason(lightItems[0]),
      dailySlot: "light_review",
    });
  }

  // 5) wildcard — best remaining item (any slot) that isn't already picked
  const pickedIds = new Set(selected.map((r) => r.scored.item.id));
  const wildcardCandidates = scored.filter((s) => !pickedIds.has(s.item.id));
  if (wildcardCandidates.length > 0) {
    selected.push({
      scored: wildcardCandidates[0],
      reason: buildReason(wildcardCandidates[0]),
      dailySlot: "wildcard",
    });
  }

  return selected;
}

function buildReason(s: ScoredItem): string {
  const parts: string[] = [];

  if (s.item.next_action) {
    parts.push("Next action ready");
  }
  if (s.item.priority === "critical") {
    parts.push("Critical priority");
  } else if (s.item.priority === "high") {
    parts.push("High priority");
  }
  if (s.item.horizon === "3_months") {
    parts.push("Due within 3 months");
  } else if (s.item.horizon === "6_months") {
    parts.push("Due within 6 months");
  }
  if (s.dependents > 0) {
    parts.push(`Unlocks ${s.dependents} item${s.dependents > 1 ? "s" : ""}`);
  }
  if (s.blocked) {
    parts.push(`Blocked by: ${s.blockedBy.join(", ")}`);
  } else if (s.isOverdue) {
    parts.push("Overdue");
  } else if (s.isStale) {
    parts.push("Hasn't been touched in a while");
  }

  if (parts.length === 0) {
    parts.push("Recommended based on overall score");
  }

  return parts.join(" · ");
}

// ─── This Week View ─────────────────────────────────────────────

const WEEK_GROUPS = [
  "Skills",
  "Projects",
  "Interview Prep",
  "System Design",
  "Portfolio / Application",
];

export function getThisWeekView(
  layers: RawLayerData[],
): WeekGroup[] {
  const scored = collectItems(layers);
  computeOverdueStale(scored);

  // Apply blocked penalty
  for (const s of scored) {
    if (s.blocked) s.score -= 200;
  }

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  const groups: WeekGroup[] = WEEK_GROUPS.map((label) => ({
    label,
    items: [] as ScoredItem[],
  }));

  const TRACK_MAP: Record<string, string> = {
    skills: "Skills",
    projects: "Projects",
    dsa_interviews: "Interview Prep",
    interview_prep: "Interview Prep",
    system_design: "System Design",
    portfolio_resume: "Portfolio / Application",
    applications_networking: "Portfolio / Application",
    portfolio_application: "Portfolio / Application",
  };

  for (const s of scored) {
    const groupLabel = TRACK_MAP[s.item.track ?? ""];
    if (!groupLabel) continue;

    const group = groups.find((g) => g.label === groupLabel);
    if (!group) continue;

    if (group.items.length < 3) {
      group.items.push(s);
    }
  }

  return groups.filter((g) => g.items.length > 0);
}

// ─── Highest ROI Now ────────────────────────────────────────────

export function getHighestROI(
  layers: RawLayerData[],
  maxCount = 6,
): ScoredItem[] {
  const scored = collectItems(layers);
  computeOverdueStale(scored);

  const filtered = scored.filter(
    (s) => s.item.priority === "critical" || s.item.priority === "high",
  );

  const nearHorizons = new Set(["3_months", "6_months", "12_months"]);
  const horizonFiltered = filtered.filter((s) =>
    nearHorizons.has(s.item.horizon ?? ""),
  );

  const highValue = horizonFiltered.filter((s) => {
    const cr = s.item.career_roi ?? "";
    const iv = safeNum(s.item.interview_value, 0);
    const ev = safeNum(s.item.engineering_value, 0);
    return (
      cr === "very_high" || cr === "high" || iv >= 7 || ev >= 7
    );
  });

  highValue.sort((a, b) => b.score - a.score);
  return highValue.slice(0, maxCount);
}

// ─── Blocked Items ──────────────────────────────────────────────

export function getBlockedItems(
  layers: RawLayerData[],
): ScoredItem[] {
  const idMap = buildIdMap(layers);
  const blocked: ScoredItem[] = [];

  for (const layer of layers) {
    for (const item of layer.items) {
      if (item.status === "done") continue;
      const blockedBy = getBlockedBy(item, idMap);
      if (blockedBy.length > 0) {
        const dependentCount = countDependents(item.id, layers);
        const score = scoreItem(item, dependentCount);
        blocked.push({
          item,
          layerTitle: layer.title,
          layerId: layer.id,
          score,
          blocked: true,
          blockedBy,
          trackLabel: getTrackLabel(item.track),
          isOverdue: false,
          isStale: false,
          dependents: dependentCount,
          unlocks: getUnlocks(item.id, layers),
        });
      }
    }
  }

  return blocked;
}

// ─── Overdue Items ──────────────────────────────────────────────

export function getOverdueItems(
  layers: RawLayerData[],
): ScoredItem[] {
  const scored = collectItems(layers);
  computeOverdueStale(scored);
  return scored.filter((s) => s.isOverdue || s.isStale);
}

// ─── All-in-one ─────────────────────────────────────────────────

export function computeDashboard(layers: RawLayerData[]): DashboardState {
  return {
    today: getTodayRecommendations(layers),
    thisWeek: getThisWeekView(layers),
    highestROI: getHighestROI(layers),
    blocked: getBlockedItems(layers),
    overdue: getOverdueItems(layers),
  };
}
