import { JourneyConfig, JourneyView, journeyConfig } from "../config/journey.config";

export type UserPreferences = Partial<JourneyConfig>;

const PREF_KEY = "journey_user_prefs";

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
    // Simple top-level shallow merge
    const updated = { ...current, ...prefs };
    localStorage.setItem(PREF_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save preferences", e);
  }
}

export function getActiveView(): JourneyView {
  const prefs = getPreferences();
  return (prefs.lastView as JourneyView) || (prefs.defaultView as JourneyView) || journeyConfig.defaultView;
}
