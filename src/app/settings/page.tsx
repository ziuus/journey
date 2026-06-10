"use client";
import React from 'react';
import styles from './settings.module.css';
import { useConfig } from '../../context/ConfigContext';

export default function SettingsView() {
  const { config, updateConfig } = useConfig();

  return (
    <div className={styles.container}>
      <h1>Settings</h1>
      <section className={styles.section}>
        <h2>General</h2>
        <div className={styles.field}>
          <label>
            Default View:
            <select 
              value={config.defaultView} 
              onChange={(e) => updateConfig({ defaultView: e.target.value as any })}
              className={styles.select}
            >
              <option value="tree">Tree</option>
              <option value="dashboard">Dashboard</option>
              <option value="focus">Focus</option>
              <option value="review">Review</option>
            </select>
          </label>
        </div>
      </section>
      <section className={styles.section}>
        <h2>UI Density</h2>
        <div className={styles.field}>
            <label>
              <input type="radio" name="density" value="comfortable" checked={config.ui.density === "comfortable"} onChange={() => updateConfig({ ui: { ...config.ui, density: "comfortable" } })} />
              Comfortable
            </label>
            <label>
              <input type="radio" name="density" value="compact" checked={config.ui.density === "compact"} onChange={() => updateConfig({ ui: { ...config.ui, density: "compact" } })} />
              Compact
            </label>
        </div>
      </section>
    </div>
  );
}
