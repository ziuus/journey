import React, { createContext, useContext, useState, useMemo } from 'react';
import { JourneyConfig, journeyConfig } from '../config/journey.config';
import { getPreferences, savePreferences, UserPreferences } from '../lib/preferences';

const ConfigContext = createContext<{
  config: JourneyConfig;
  updateConfig: (newPrefs: UserPreferences) => void;
} | undefined>(undefined);

export const ConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [prefs, setPrefs] = useState<UserPreferences>(() => getPreferences());

  const config = useMemo(() => {
    // Merge defaults with saved user preferences
    return { 
        ...journeyConfig, 
        ...prefs,
        views: { ...journeyConfig.views, ...prefs.views },
        ui: { ...journeyConfig.ui, ...prefs.ui },
        ai: { ...journeyConfig.ai, ...prefs.ai },
        roadmap: { ...journeyConfig.roadmap, ...prefs.roadmap },
    };
  }, [prefs]);

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
  if (!context) throw new Error('useConfig must be used within ConfigProvider');
  return context;
};
