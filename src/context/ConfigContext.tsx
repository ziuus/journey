import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { JourneyConfig, journeyConfig } from '../config/journey.config';
import { getPreferences, savePreferences, UserPreferences } from '../lib/preferences';

const ConfigContext = createContext<{
  config: JourneyConfig;
  updateConfig: (newPrefs: UserPreferences) => void;
} | undefined>(undefined);

export const ConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [prefs, setPrefs] = useState<UserPreferences>(() => getPreferences());

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
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      
      const theme = config.ui.theme === 'system' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : config.ui.theme;
      
      root.setAttribute('data-theme', theme);
      root.style.setProperty('--accent-green', config.ui.accentColor);
      
      if (theme === 'light') {
        root.style.setProperty('--background', '#f5f7f7');
        root.style.setProperty('--text-primary', '#1a1d1d');
        root.style.setProperty('--text-secondary', '#5a6262');
        root.style.setProperty('--glass-bg', 'rgba(0, 0, 0, 0.05)');
      } else {
        root.style.setProperty('--background', '#000000');
        root.style.setProperty('--text-primary', 'rgba(255, 255, 255, 0.95)');
        root.style.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.5)');
        root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.015)');
      }
    }
  }, [config.ui.theme, config.ui.accentColor]);

  const updateConfig = (newPrefs: UserPreferences) => {
    savePreferences(newPrefs);
    setPrefs(getPreferences());
  };

  useEffect(() => {
    const root = document.documentElement;
    const theme = config.ui.theme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : config.ui.theme;
    
    root.setAttribute('data-theme', theme);
    root.style.setProperty('--accent-color', config.ui.accentColor);
    
    // Update body background transition if needed
  }, [config.ui.theme, config.ui.accentColor]);

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
