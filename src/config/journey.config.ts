export type JourneyView = "tree" | "dashboard";

export interface JourneyConfig {
  appName: string;
  defaultView: JourneyView;
  lastView?: JourneyView;
  views: {
    tree: boolean;
    dashboard: boolean;
  };
  ui: {
    theme: "dark" | "light" | "system";
    accentColor: string;
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
  defaultView: "dashboard",
  views: {
    tree: true,
    dashboard: true,
  },
  ui: {
    theme: "dark",
    accentColor: "#a8ff60",
    density: "comfortable",
    showHero: true,
    showRadar: true,
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
