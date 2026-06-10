export type JourneyView = "tree" | "dashboard" | "focus" | "review";

export interface JourneyConfig {
  appName: string;
  defaultView: JourneyView;
  lastView?: JourneyView; // Added for persistence
  views: {
    tree: boolean;
    dashboard: boolean;
    focus: boolean;
    review: boolean;
  };
  ui: {
    density: "comfortable" | "compact";
    showHero: boolean;
    showRadar: boolean;
    showCommandCenter: boolean;
    showRecentActivity: boolean;
  };
  ai: {
    requireApprovalForMajorChanges: boolean;
    showChangeReasons: boolean;
    allowAutoMinorUpdates: boolean;
    protectPinnedGoals: boolean;
  };
  roadmap: {
    maxActiveGoals: number;
    maxWeeklyTasks: number;
    maxDailyTasks: number;
    defaultExpandedDepth: number;
    showHealthAndLifeLayers: boolean;
  };
}

export const journeyConfig: JourneyConfig = {
  appName: "Journey",
  defaultView: "tree",
  views: {
    tree: true,
    dashboard: true,
    focus: true,
    review: true,
  },
  ui: {
    density: "comfortable",
    showHero: false,
    showRadar: false,
    showCommandCenter: true,
    showRecentActivity: true,
  },
  ai: {
    requireApprovalForMajorChanges: true,
    showChangeReasons: true,
    allowAutoMinorUpdates: true,
    protectPinnedGoals: true,
  },
  roadmap: {
    maxActiveGoals: 3,
    maxWeeklyTasks: 5,
    maxDailyTasks: 3,
    defaultExpandedDepth: 2,
    showHealthAndLifeLayers: true,
  },
};
