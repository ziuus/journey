import { RoadmapGraph, RoadmapNode, AiChange } from "../../types/roadmap";
import { normalizeRoadmap } from "./normalizeRoadmap";
import { journeyConfig } from "../../config/journey.config";
import fs from "fs";
import path from "path";

const ROADMAP_PATH = path.join(process.cwd(), "data", "roadmap.json");

export class RoadmapStore {
  private graph: RoadmapGraph;
  private changes: AiChange[] = [];

  constructor() {
    this.graph = { nodes: {}, edges: [], updatedAt: new Date().toISOString() };
  }

  async load() {
    const rawData = JSON.parse(fs.readFileSync(ROADMAP_PATH, "utf-8"));
    this.graph = normalizeRoadmap(rawData);
  }

  getGraph(): RoadmapGraph {
    return this.graph;
  }

  getNode(id: string): RoadmapNode | undefined {
    return this.graph.nodes[id];
  }

  addChange(change: AiChange) {
    this.changes.push(change);
  }

  applyChange(changeId: string) {
    const change = this.changes.find(c => c.id === changeId);
    if (change) {
      change.status = "accepted";
      // Additional logic to update the graph based on change.after
      if (journeyConfig.ai.protectPinnedGoals && change.targetNodeId) {
        const node = this.getNode(change.targetNodeId);
        if (node?.isPinned) {
          console.warn("Attempted to modify a pinned goal. Auto-acceptance blocked.");
          change.status = "rejected";
          return;
        }
      }
      // Apply the change...
    }
  }

  processAutoAcceptance() {
    if (journeyConfig.ai.allowAutoMinorUpdates) {
      this.changes.forEach(change => {
        if (change.status === "pending" && change.isMinor) {
          this.applyChange(change.id);
        }
      });
    }
  }

  rejectChange(changeId: string) {
    const change = this.changes.find(c => c.id === changeId);
    if (change) {
      change.status = "rejected";
    }
  }

  getPendingChanges(): AiChange[] {
    return this.changes.filter(c => c.status === "pending");
  }

  async persist() {
    // Note: For now, we only update the in-memory graph.
    // Full JSON backward-compatibility persistence needs a reverse adapter.
    this.graph.updatedAt = new Date().toISOString();
  }
}

export const roadmapStore = new RoadmapStore();
