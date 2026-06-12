"use client";
import React from 'react';
import styles from './settings.module.css';
import { useConfig } from '../../context/ConfigContext';
import { Settings, Palette, Eye, Layout, Sliders, Moon, Sun, Monitor } from 'lucide-react';

export default function SettingsView() {
  const { config, updateConfig } = useConfig();

  const accentColors = [
    { label: 'Neon Green', value: '#a8ff60' },
    { label: 'Royal Blue', value: '#007aff' },
    { label: 'Electric Purple', value: '#bf5af2' },
    { label: 'Flame Orange', value: '#ff9500' },
    { label: 'Crimson Red', value: '#ff3b30' },
    { label: 'Cyber Cyan', value: '#60efff' },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.eyebrow}><Settings size={12} /> System Configuration</div>
          <h1 className={styles.title}>Preferences</h1>
          <p className={styles.subtitle}>Customize your mastery engine to align with your personal aesthetic and cognitive flow.</p>
        </div>
      </header>

      <div className={styles.grid}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <Palette className={styles.cardIcon} size={20} />
            <h2 className={styles.cardTitle}>Appearance & Theme</h2>
          </div>
          
          <div className={styles.field}>
            <label className={styles.label}>Visual Mode</label>
            <div className={styles.themeToggle}>
              <button 
                onClick={() => updateConfig({ ui: { ...config.ui, theme: 'light' } })}
                className={`${styles.themeBtn} ${config.ui.theme === 'light' ? styles.themeBtnActive : ''}`}
              >
                <Sun size={16} /> Light
              </button>
              <button 
                onClick={() => updateConfig({ ui: { ...config.ui, theme: 'dark' } })}
                className={`${styles.themeBtn} ${config.ui.theme === 'dark' ? styles.themeBtnActive : ''}`}
              >
                <Moon size={16} /> Dark
              </button>
              <button 
                onClick={() => updateConfig({ ui: { ...config.ui, theme: 'system' } })}
                className={`${styles.themeBtn} ${config.ui.theme === 'system' ? styles.themeBtnActive : ''}`}
              >
                <Monitor size={16} /> System
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Accent Highlight</label>
            <div className={styles.colorGrid}>
              {accentColors.map(color => (
                <button 
                  key={color.value}
                  className={`${styles.colorCircle} ${config.ui.accentColor === color.value ? styles.colorCircleActive : ''}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => updateConfig({ ui: { ...config.ui, accentColor: color.value } })}
                  title={color.label}
                />
              ))}
              <input 
                type="color" 
                value={config.ui.accentColor} 
                onChange={(e) => updateConfig({ ui: { ...config.ui, accentColor: e.target.value } })}
                className={styles.customColor}
              />
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <Eye className={styles.cardIcon} size={20} />
            <h2 className={styles.cardTitle}>Interface Density</h2>
          </div>
          <div className={styles.densityGroup}>
            <button 
              onClick={() => updateConfig({ ui: { ...config.ui, density: 'comfortable' } })}
              className={`${styles.densityBtn} ${config.ui.density === 'comfortable' ? styles.densityBtnActive : ''}`}
            >
              <Layout size={18} />
              <div className={styles.btnText}>
                <strong>Comfortable</strong>
                <span>Maximum focus with generous spacing</span>
              </div>
            </button>
            <button 
              onClick={() => updateConfig({ ui: { ...config.ui, density: 'compact' } })}
              className={`${styles.densityBtn} ${config.ui.density === 'compact' ? styles.densityBtnActive : ''}`}
            >
              <Sliders size={18} />
              <div className={styles.btnText}>
                <strong>Compact</strong>
                <span>Information density for power users</span>
              </div>
            </button>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <Monitor className={styles.cardIcon} size={20} />
            <h2 className={styles.cardTitle}>Startup Behavior</h2>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Default Landing View</label>
            <select 
              value={config.defaultView} 
              onChange={(e) => updateConfig({ defaultView: e.target.value as any })}
              className={styles.select}
            >
              <option value="dashboard">Dashboard (Cinematic)</option>
              <option value="tree">Goal Tree (Graph)</option>
              <option value="focus">Deep Focus Mode</option>
              <option value="review">Progress Review</option>
            </select>
          </div>
        </section>
      </div>
    </div>
  );
}
