import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { JourneyConfig, journeyConfig } from "../config/journey.config";
import { getPreferences, savePreferences, UserPreferences } from "../lib/preferences";

const ConfigContext = createContext<{
  config: JourneyConfig;
  updateConfig: (newPrefs: UserPreferences) => void;
} | undefined>(undefined);

export const ConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [prefs, setPrefs] = useState<UserPreferences>({});

  // Client-side mount: load saved preferences from localStorage
  useEffect(() => {
    setPrefs(getPreferences());
  }, []);

  const config = useMemo(() => {
    return {
      ...journeyConfig,
      ...prefs,
      views: { ...journeyConfig.views, ...prefs.views },
      ui: { ...journeyConfig.ui, ...prefs.ui },
      ai: { ...journeyConfig.ai, ...prefs.ai },
      roadmap: { ...journeyConfig.roadmap, ...prefs.roadmap },
    };
  }, [prefs]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;

      const theme =
        config.ui.theme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : config.ui.theme;

      root.setAttribute("data-theme", theme);
      root.setAttribute("data-density", config.ui.density || "comfortable");

      const accent = config.ui.accentColor || "#007aff";
      root.style.setProperty("--accent", accent);
      root.style.setProperty("--accent-color", accent);
      root.style.setProperty("--accent-glow", `${accent}33`);
      root.style.setProperty("--accent-dim", `${accent}1A`);
    }
  }, [config.ui.theme, config.ui.accentColor, config.ui.density]);

  const updateConfig = (newPrefs: UserPreferences) => {
    savePreferences(newPrefs);
    setPrefs(getPreferences());
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) throw new Error("useConfig must be used within ConfigProvider");
  return context;
};
