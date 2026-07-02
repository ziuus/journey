/**
 * Shared utilities for data-driven roadmap rendering.
 * All functions maintain backward compatibility with the old layer-number-based logic.
 */

import type { RawLayerData, RawRoadmapItem, TrackName, Priority, Horizon } from "@/types/roadmap";

// ─── Icon map ─────────────────────────────────────────────────

/**
 * Standard Lucide icon names mapped to import names.
 * Add new icons here when a layer sets `icon` in its data.
 */
const ICON_MAP: Record<string, string> = {
  cpu: "Cpu",
  brain: "Brain",
  network: "Network",
  blocks: "Blocks",
  infinity: "Infinity",
  bot: "Bot",
  shield: "ShieldCheck",
  target: "Target",
  zap: "Zap",
  book: "BookOpen",
  code: "Code",
  database: "Database",
  server: "Server",
  globe: "Globe",
  lock: "Lock",
  activity: "Activity",
  heart: "Heart",
  dumbbell: "Dumbbell",
  wallet: "Wallet",
  users: "Users",
  compass: "Compass",
  tree: "TreePine",
  star: "Star",
  rocket: "Rocket",
  lightbulb: "Lightbulb",
  award: "Award",
  layers: "Layers",
  pie: "PieChart",
  bar: "BarChart3",
  clock: "Clock",
  calendar: "Calendar",
  filter: "Filter",
  search: "Search",
  music: "Music",
  camera: "Camera",
  eye: "Eye",
  flag: "Flag",
  folder: "Folder",
  file: "File",
  message: "MessageCircle",
  phone: "Phone",
  plus: "PlusCircle",
  minus: "MinusCircle",
  check: "CheckCircle2",
  x: "XCircle",
  alert: "AlertCircle",
  info: "Info",
  help: "HelpCircle",
  settings: "Settings",
  user: "User",
  home: "Home",
  menu: "Menu",
  more: "MoreHorizontal",
  external: "ExternalLink",
  download: "Download",
  upload: "Upload",
  refresh: "RefreshCw",
  power: "Power",
  trash: "Trash2",
  edit: "Edit",
  copy: "Copy",
  link: "Link",
  map: "Map",
  terminal: "Terminal",
  cloud: "Cloud",
  wifi: "Wifi",
  mouse: "MousePointer",
  keyboard: "Keyboard",
  monitor: "Monitor",
  tablet: "Tablet",
  phone_icon: "Smartphone",
};

/**
 * Resolve a Lucide icon name from layer data.
 * Falls back to the old layer-number-based mapping if no icon is set.
 */
export function resolveLayerIcon(layer: RawLayerData): string {
  if (layer.icon) {
    return ICON_MAP[layer.icon.toLowerCase()] || "Target";
  }

  // Backward-compatible fallback: hardcoded layer-number mapping
  const fallback: Record<string, string> = {
    layer1: "Cpu",
    layer2: "Brain",
    layer3: "Network",
    layer4: "Blocks",
    layer5: "Infinity",
    layer6: "Bot",
    layer7: "ShieldCheck",
  };

  return fallback[layer.id] || "Target";
}

// ─── Track resolution ─────────────────────────────────────────

const DEFAULT_TRACKS: TrackName[] = ["career", "mastery", "exploration", "health", "fitness", "personal"];

/**
 * Resolve the display track name for a layer.
 * If the layer has a `track` field, use it.
 * Otherwise fall back to the old layer-number logic:
 *   layers 8-11 → "Health & Fitness"
 *   everything else → "Career & Tech"
 *
 * Returns the raw track value and a display-friendly label.
 */
export function resolveLayerTrack(layer: RawLayerData): { track: string; label: string } {
  if (layer.track) {
    return { track: layer.track, label: trackToLabel(layer.track) };
  }

  // Backward-compatible fallback
  const layerNum = parseInt(layer.id.replace("layer", ""), 10);
  if (layerNum >= 8 && layerNum <= 11) {
    return { track: "health_fitness", label: "Health & Fitness" };
  }

  return { track: "career_tech", label: "Career & Tech" };
}

/**
 * Convert a track identifier to a human-readable label.
 */
export function trackToLabel(track: string): string {
  const labels: Record<string, string> = {
    career: "Career",
    mastery: "Engineering Mastery",
    exploration: "Exploration",
    health: "Health",
    fitness: "Fitness",
    personal: "Personal Growth",
    finance: "Finance",
    business: "Business",
    health_fitness: "Health & Fitness",
    career_tech: "Career & Tech",
  };
  return labels[track] || track.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Collect unique track labels from layers (preserving order).
 * Falls back to the two default tracks if no layer has a track field.
 */
export function collectTracks(layers: RawLayerData[]): string[] {
  const trackSet = new Set<string>();

  for (const layer of layers) {
    const { label } = resolveLayerTrack(layer);
    trackSet.add(label);
  }

  if (trackSet.size === 0) {
    return ["Career & Tech", "Health & Fitness"];
  }

  // Sort: career-type tracks first, then health/personal
  const priority = ["career", "mastery", "exploration", "career_tech"];
  return Array.from(trackSet).sort((a, b) => {
    const aIdx = priority.findIndex((p) => a.toLowerCase().includes(p));
    const bIdx = priority.findIndex((p) => b.toLowerCase().includes(p));
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });
}

/**
 * Filter layers by a track label.
 */
export function filterLayersByTrack(layers: RawLayerData[], trackLabel: string): RawLayerData[] {
  return layers.filter((layer) => {
    const { label } = resolveLayerTrack(layer);
    return label === trackLabel;
  });
}

// ─── Metadata helpers ─────────────────────────────────────────

const PRIORITY_LABELS: Record<Priority, string> = {
  master: "Master",
  working: "Working",
  awareness: "Awareness",
};

const PRIORITY_COLORS: Record<Priority, string> = {
  master: "#22c55e",
  working: "#eab308",
  awareness: "#6366f1",
};

const HORIZON_LABELS: Record<Horizon, string> = {
  "3_months": "3M",
  "6_months": "6M",
  "12_months": "1Y",
  "2_years": "2Y",
  "5_years": "5Y",
  ongoing: "∞",
};

const HORIZON_COLORS: Record<Horizon, string> = {
  "3_months": "#ef4444",
  "6_months": "#f97316",
  "12_months": "#eab308",
  "2_years": "#22c55e",
  "5_years": "#3b82f6",
  ongoing: "#8b5cf6",
};

const CAREER_VALUE_COLORS: Record<string, string> = {
  critical: "#22c55e",
  high: "#3b82f6",
  medium: "#eab308",
  niche: "#8b5cf6",
};

/**
 * Get display data for an item's priority badge.
 * Returns null if no priority is set.
 */
export function getPriorityBadge(item: RawRoadmapItem): { label: string; color: string } | null {
  const p = item.priority || item.metadata?.priority;
  if (!p || !(p in PRIORITY_LABELS)) return null;
  return { label: PRIORITY_LABELS[p as Priority], color: PRIORITY_COLORS[p as Priority] };
}

/**
 * Get display data for an item's horizon badge.
 * Returns null if no horizon is set.
 */
export function getHorizonBadge(item: RawRoadmapItem): { label: string; color: string } | null {
  const h = item.horizon || item.metadata?.horizon;
  if (!h || !(h in HORIZON_LABELS)) return null;
  return { label: HORIZON_LABELS[h as Horizon], color: HORIZON_COLORS[h as Horizon] };
}

/**
 * Get display data for an item's career value badge.
 * Returns null if no career value is set.
 */
export function getCareerValueBadge(item: RawRoadmapItem): { label: string; color: string } | null {
  const cv = item.career_value || item.metadata?.career_value;
  if (!cv) return null;
  const color = CAREER_VALUE_COLORS[cv] || "#6b7280";
  return { label: cv.charAt(0).toUpperCase() + cv.slice(1), color };
}

/**
 * Get display data for an item's engineering value badge.
 */
export function getEngineeringValue(item: RawRoadmapItem): number | null {
  const ev = item.engineering_value ?? item.metadata?.engineering_value;
  return typeof ev === "number" ? ev : null;
}

/**
 * Normalize item: if it has a `metadata` object, merge top-level shortcuts into it
 * so that frontend reads from one place. Returns a shallow copy.
 */
export function normalizeItem(item: RawRoadmapItem): RawRoadmapItem & { resolved: { priority?: Priority; horizon?: Horizon; career_value?: string; engineering_value?: number } } {
  const meta = item.metadata || {};
  return {
    ...item,
    resolved: {
      priority: (item.priority || meta.priority) as Priority | undefined,
      horizon: (item.horizon || meta.horizon) as Horizon | undefined,
      career_value: item.career_value || meta.career_value,
      engineering_value: item.engineering_value ?? meta.engineering_value,
    },
  };
}
