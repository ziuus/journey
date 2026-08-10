/**
 * Shared utilities for data-driven roadmap rendering.
 * All functions maintain backward compatibility with the old layer-number-based logic.
 */

import type { RawLayerData, RawRoadmapItem, TrackName } from "@/types/roadmap";

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
  list: "List",
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

  // Use layer title as track label if it's a top-level named goal/roadmap
  if (layer.title) {
    const cleanTitle = layer.title.includes("—")
      ? layer.title.split("—")[0].trim()
      : layer.title;
    if (cleanTitle && cleanTitle.length < 35 && !cleanTitle.startsWith("Layer ")) {
      return { track: layer.id, label: cleanTitle };
    }
  }

  // Check if layer items specify a track
  const itemTrack = layer.items?.find((i) => i.track)?.track;
  if (itemTrack) {
    return { track: itemTrack, label: trackToLabel(itemTrack) };
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
    skills: "Skills",
    projects: "Projects",
    dsa_interviews: "DSA & Interviews",
    system_design: "System Design",
    ai_engineering: "AI Engineering",
    agentic_systems: "Building AI & Agentic Systems",
    ai_llms: "Building AI & LLMs",
    backend_cloud_infra: "Backend / Cloud / Infra",
    portfolio_resume: "Portfolio / GitHub / Resume",
    applications_networking: "Applications / Networking",
    weekly_review: "Weekly Review",
  };
  return labels[track] || track.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Collect unique track labels from layers (preserving order).
 */
export function collectTracks(layers: RawLayerData[]): string[] {
  const trackSet = new Set<string>();

  // Always include 'All Roadmaps' first for complete overview
  trackSet.add("All Roadmaps");

  for (const layer of layers) {
    const { label } = resolveLayerTrack(layer);
    trackSet.add(label);
  }

  return Array.from(trackSet);
}

/**
 * Filter layers by a track label.
 */
export function filterLayersByTrack(layers: RawLayerData[], trackLabel: string): RawLayerData[] {
  if (!trackLabel || trackLabel === "All Roadmaps") {
    return layers;
  }
  return layers.filter((layer) => {
    const { label } = resolveLayerTrack(layer);
    return label === trackLabel;
  });
}

// ─── Goal progress ────────────────────────────────────────────

export function computeGoalProgress(
  layers: RawLayerData[],
  trackIds: string[],
): { completed: number; total: number; percent: number } {
  let total = 0;
  let done = 0;
  for (const layer of layers) {
    if (!trackIds.includes(layer.track || "")) continue;
    for (const item of layer.items) {
      total++;
      if (item.status === "done") done++;
    }
  }
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return { completed: done, total, percent };
}

export function computeTrackProgress(
  layers: RawLayerData[],
): Record<string, { completed: number; total: number; percent: number }> {
  const map: Record<string, { items: number; done: number }> = {};
  for (const layer of layers) {
    const track = layer.track || "";
    if (!map[track]) map[track] = { items: 0, done: 0 };
    for (const item of layer.items) {
      map[track].items++;
      if (item.status === "done") map[track].done++;
    }
  }
  const result: Record<string, { completed: number; total: number; percent: number }> = {};
  for (const [track, stats] of Object.entries(map)) {
    result[track] = {
      completed: stats.done,
      total: stats.items,
      percent: stats.items > 0 ? Math.round((stats.done / stats.items) * 100) : 0,
    };
  }
  return result;
}
