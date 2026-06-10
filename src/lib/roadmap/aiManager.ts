import { AiChange, RoadmapNode, AiAction } from "../../types/roadmap";
import { roadmapStore } from "./store";

export class AiManager {
  static createChange(
    action: AiAction,
    nodeId: string,
    before: any,
    after: any,
    reason: string
  ): AiChange {
    const change: AiChange = {
      id: crypto.randomUUID(),
      action,
      nodeId,
      before,
      after,
      reason,
      status: "pending",
      createdAt: new Date().toISOString(),
      createdBy: "agent",
    };
    roadmapStore.addChange(change);
    return change;
  }

  static applyChange(changeId: string) {
    roadmapStore.applyChange(changeId);
  }

  static rejectChange(changeId: string) {
    roadmapStore.rejectChange(changeId);
  }
}
