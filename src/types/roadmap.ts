export type NodeType = "root" | "layer" | "goal" | "skill" | "milestone" | "task" | "project" | "habit";
export type NodeStatus = "draft" | "approved" | "active" | "in_progress" | "completed" | "blocked" | "rejected" | "archived";
export type NodeSource = "user" | "ai" | "system" | "import";
export type AiAction = "create" | "update" | "delete" | "reorder" | "archive";
export type AiChangeStatus = "pending" | "accepted" | "rejected" | "edited";

// ─── Metadata types (optional extensions) ─────────────────────

/** How deeply to learn / the intended proficiency level */
export type LearningDepth = "master" | "working" | "awareness";
/** Urgency / execution priority */
export type Priority = "critical" | "high" | "medium" | "low";
export type Horizon =
  | "3_months"
  | "6_months"
  | "12_months"
  | "2_years"
  | "5_years"
  | "ongoing";
export type CareerValue = "critical" | "high" | "medium" | "niche";
export type CareerROI = "very_high" | "high" | "medium" | "low";
export type IndustryDemand = "very_high" | "high" | "medium" | "emerging" | "research" | "legacy";
export type TrackName = "career" | "mastery" | "exploration" | "health" | "fitness" | "finance" | "personal" | string;

/**
 * Optional rich metadata for any roadmap item.
 * All fields are optional — existing files without them work unchanged.
 */
export interface ItemMetadata {
  /** How deeply to learn this (master/working/awareness) */
  learning_depth?: LearningDepth;
  /** Urgency / execution priority */
  priority?: Priority;
  /** When this should be tackled */
  horizon?: Horizon;
  /** How much this contributes to near-term career success */
  career_value?: CareerValue;
  /** Career return on investment */
  career_roi?: CareerROI;
  /** Engineering depth / long-term value (1-10) */
  engineering_value?: number;
  /** How likely this is to appear in interviews (1-10) */
  interview_value?: number;
  /** Current market demand */
  industry_demand?: IndustryDemand;
  /** Item IDs this depends on */
  prerequisites?: string[];
  /** Realistic time estimate in hours */
  estimated_hours?: number;
  /** Which parallel track this belongs to */
  track?: TrackName;
  /** Domain category (e.g. "networking", "databases", "ai") */
  category?: string;
  /** What this technology/topic is */
  purpose?: string;
  /** Problem it solves */
  problem_solved?: string;
  /** When to use it */
  when_to_use?: string;
  /** When NOT to use it */
  when_not_to_use?: string;
  /** Major alternatives */
  alternatives?: string[];
  /** Companies known to use this */
  companies_using?: string[];
  /** Learning resources (URLs, book titles, courses) */
  resources?: string[];
  /** Suggested mini / production / capstone projects */
  projects?: {
    mini?: string;
    production?: string;
    capstone?: string;
  };
}

// ─── Roadmap item — the core unit ────────────────────────────

export interface RawRoadmapItem {
  id: string;
  title: string;
  status: "pending" | "active" | "done" | "blocked";
  goal?: string;
  notes?: string;
  /** Optional rich metadata (additive, backward-compatible) */
  metadata?: ItemMetadata;
  // Flat shorthand fields for convenience (merged with metadata at read time)
  learning_depth?: LearningDepth;
  priority?: Priority;
  horizon?: Horizon;
  career_value?: CareerValue;
  career_roi?: CareerROI;
  engineering_value?: number;
  interview_value?: number;
  industry_demand?: IndustryDemand;
  prerequisites?: string[];
  depends_on?: string[];
  estimated_hours?: number;
  actual_hours?: number;
  track?: TrackName;
  category?: string;
  /** Concrete next action the user should take for this item */
  next_action?: string;
  /** When this was last worked on (ISO) */
  last_worked_on?: string;
  /** When this was created / added (ISO) */
  created_at?: string;
  /** Target completion date (ISO) */
  target_date?: string;
  /** Date string YYYY-MM-DD — when item was completed */
  completed_at?: string;
  /** Date string YYYY-MM-DD — snooze until this date */
  snoozed_until?: string;
  /** Blocked metadata */
  blocked_metadata?: {
    blocked_at?: string;
    reason?: string;
  };
  /** Type of work: 'deep_work' | 'interview_prep' | 'project' | 'light_review' | 'other' */
  work_type?: string;
}

// ─── Layer ────────────────────────────────────────────────────

export interface RawLayerData {
  id: string;
  title: string;
  description: string;
  category?: string;
  items: RawRoadmapItem[];
  /** Track for grouping (overrides hardcoded layer-number logic) */
  track?: TrackName;
  /** Domain this layer belongs to */
  domain?: string;
  /** Lucide icon name for dynamic rendering */
  icon?: string;
  /** Arbitrary metadata for future extensibility */
  metadata?: Record<string, unknown>;
}

// ─── Timeline ─────────────────────────────────────────────────

export interface RawTimelineData {
  id: string;
  months: string;
  goals: string[];
  status: string;
  focus_area: string;
}

// ─── Top-level structures ─────────────────────────────────────

export interface Domain {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  domain?: string;
  target_date?: string;
  status?: "active" | "paused" | "completed" | "archived";
  horizon?: string;
  icon?: string;
  tracks?: string[];
}

export interface Track {
  id: TrackName;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
}

// ─── Top-level roadmap document ──────────────────────────────

export interface RawRoadmapData {
  target_roles: string[];
  layers: RawLayerData[];
  milestones: RawRoadmapItem[];
  mlops_devops?: RawRoadmapItem[];
  security_ethics?: RawRoadmapItem[];
  timeline?: RawTimelineData[];

  // New optional top-level structures (all backward-compatible)
  domains?: Domain[];
  goals?: Goal[];
  tracks?: Track[];
  version?: string; // schema version for future migrations
}

// ─── Graph / tree types (unchanged) ──────────────────────────

export interface RoadmapNode {
  id: string;
  title: string;
  description?: string;
  type: NodeType;
  status: NodeStatus;
  parentId?: string;
  children?: string[];
  dependencies?: string[];
  progress: number;
  priority: number;
  estimatedMinutes?: number;
  source: NodeSource;
  approved: boolean;
  locked: boolean;
  reason?: string;
  targetRoles?: string[];
  tags?: string[];
  proofLinks?: string[];
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  originalData?: any;
}

export interface AiChange {
  id: string;
  action: AiAction;
  nodeId: string;
  before?: any;
  after?: any;
  reason: string;
  confidence?: number;
  status: AiChangeStatus;
  createdAt: string;
  createdBy: "agent" | "system";
  isMinor?: boolean;
  targetNodeId?: string;
}

export interface RoadmapGraph {
  nodes: Record<string, RoadmapNode>;
  edges: Array<{ from: string; to: string; type: string }>;
  activeNodeId?: string;
  updatedAt: string;
}
