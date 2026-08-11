"use client";
import React from 'react';
import styles from './settings.module.css';
import { useConfig } from '../../context/ConfigContext';
import { Settings, Palette, Eye, Layout, Sliders, Monitor } from 'lucide-react';
import { THEME_COMBOS } from '../../config/themes';

export default function SettingsView() {
  const { config, updateConfig } = useConfig();

  const handleThemeSelect = (themeId: string, defaultAccent: string) => {
    updateConfig({ 
      ui: { 
        ...config.ui, 
        theme: themeId as any, 
        accentColor: defaultAccent 
      } 
    });
  };

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
        <section className={styles.card} style={{ gridColumn: "1 / -1" }}>
          <div className={styles.cardHeader}>
            <Palette className={styles.cardIcon} size={20} />
            <h2 className={styles.cardTitle}>Color Themes</h2>
          </div>
          
          <div className={styles.themeGrid}>
            {THEME_COMBOS.map(theme => (
              <button 
                key={theme.id}
                className={`${styles.themeCardBtn} ${config.ui.theme === theme.id ? styles.themeCardBtnActive : ''}`}
                onClick={() => handleThemeSelect(theme.id, theme.previewAccent)}
                style={{ 
                  background: theme.previewBg,
                  borderColor: config.ui.theme === theme.id ? theme.previewAccent : 'var(--border-color)'
                }}
                title={theme.name}
              >
                <div className={styles.themePreviewHeader}>
                  <span className={styles.themePreviewDot} style={{ background: theme.type === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                  <span className={styles.themePreviewDot} style={{ background: theme.type === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                  <span className={styles.themePreviewDot} style={{ background: theme.type === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                </div>
                <div className={styles.themePreviewBody}>
                  <div className={styles.themePreviewLine} style={{ background: theme.type === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }} />
                  <div className={styles.themePreviewAccent} style={{ background: theme.previewAccent }} />
                </div>
                <div className={styles.themeName} style={{ color: theme.type === 'dark' ? '#fff' : '#000' }}>
                  {theme.name}
                </div>
              </button>
            ))}
          </div>

          <div className={styles.field} style={{ marginTop: '24px' }}>
            <label className={styles.label}>Custom Accent Override</label>
            <div className={styles.colorGrid}>
              <input 
                type="color" 
                value={config.ui.accentColor} 
                onChange={(e) => updateConfig({ ui: { ...config.ui, accentColor: e.target.value } })}
                className={styles.customColor}
              />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>You can override the theme's default accent color here.</span>
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
            </select>
          </div>
        </section>
      </div>
    </div>
  );
}
