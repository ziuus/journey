export type NodeType = "root" | "layer" | "goal" | "skill" | "milestone" | "task" | "project" | "habit";
export type NodeStatus = "draft" | "approved" | "active" | "in_progress" | "completed" | "blocked" | "rejected" | "archived";
export type NodeSource = "user" | "ai" | "system" | "import";
export type AiAction = "create" | "update" | "delete" | "reorder" | "archive";
export type AiChangeStatus = "pending" | "accepted" | "rejected" | "edited";

export interface RoadmapNode {
  id: string;
  title: string;
  description?: string;
  type: NodeType;
  status: NodeStatus;
  parentId?: string;
  children?: string[]; // array of child node IDs
  dependencies?: string[]; // array of node IDs this node depends on
  progress: number; // 0 to 100
  priority: number; // e.g., 1 (high), 2 (medium), 3 (low)
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
  
  // Original payload reference if needed (for reverse adapter)
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
  edges: Array<{ from: string; to: string; type: string }>; // e.g. type="dependency"
  activeNodeId?: string;
  updatedAt: string;
}

// Interfaces matching the raw API roadmap.json
export interface RawRoadmapItem {
  id: string;
  title: string;
  status: 'pending' | 'done';
  goal?: string;
  notes?: string;
}

export interface RawLayerData {
  id: string;
  title: string;
  description: string;
  category?: string;
  items: RawRoadmapItem[];
}

export interface RawTimelineData {
  id: string;
  months: string;
  goals: string[];
  status: string;
  focus_area: string;
}

export interface RawRoadmapData {
  target_roles: string[];
  layers: RawLayerData[];
  milestones: RawRoadmapItem[];
  mlops_devops?: RawRoadmapItem[];
  security_ethics?: RawRoadmapItem[];
  timeline?: RawTimelineData[];
}
