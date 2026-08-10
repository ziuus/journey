import { JourneyConfig, JourneyView, journeyConfig } from "../config/journey.config";

export type UserPreferences = Partial<JourneyConfig>;

const PREF_KEY = "journey_user_prefs";

function deepMerge(target: any, source: any): any {
  if (!source) return target;
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object"
    ) {
      output[key] = deepMerge(target[key], source[key]);
    } else if (source[key] !== undefined) {
      output[key] = source[key];
    }
  }
  return output;
}

export function getPreferences(): UserPreferences {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem(PREF_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse preferences", e);
  }
  return {};
}

export function savePreferences(prefs: UserPreferences): void {
  if (typeof window === "undefined") return;
  try {
    const current = getPreferences();
    const updated = deepMerge(current, prefs);
    localStorage.setItem(PREF_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save preferences", e);
  }
}

export function getActiveView(): JourneyView {
  const prefs = getPreferences();
  return (prefs.lastView as JourneyView) || (prefs.defaultView as JourneyView) || journeyConfig.defaultView;
}
