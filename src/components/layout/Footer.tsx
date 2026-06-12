"use client";

import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';
import { Terminal, Shield, Code, Layout } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topSection}>
          <div className={styles.brand}>
            <div className={styles.logoGroup}>
              <div className={styles.logoBox}>J</div>
              <span className={styles.logoText}>Journey</span>
            </div>
            <p className={styles.description}>
              Universal architecture for engineering mastery. Built for the next decade of technical and physical evolution.
            </p>
          </div>

          <div className={styles.linksGrid}>
            <div className={styles.linkColumn}>
              <span className={styles.columnTitle}>Navigation</span>
              <Link href="/">Command Home</Link>
              <Link href="/dashboard">System Metrics</Link>
              <Link href="/tree">Goal Tree</Link>
            </div>
            <div className={styles.linkColumn}>
              <span className={styles.columnTitle}>Resources</span>
              <a href="https://github.com/ziuus/journey" target="_blank" rel="noopener noreferrer">Source Code</a>
              <Link href="/settings">Configuration</Link>
            </div>
            <div className={styles.linkColumn}>
              <span className={styles.columnTitle}>Connect</span>
              <div className={styles.socialRow}>
                <a href="#" className={styles.socialLink} title="Github"><Code size={18} /></a>
                <a href="#" className={styles.socialLink} title="Website"><Layout size={18} /></a>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <div className={styles.statusGroup}>
            <div className={styles.statusItem}>
              <Terminal size={12} />
              <span>Protocol: Liquid Glass v1.4.1</span>
            </div>
            <div className={styles.statusItem}>
              <Shield size={12} />
              <span>Encryption: SHA-256 Verified</span>
            </div>
          </div>
          
          <div className={styles.copyright}>
            <span>&copy; {currentYear} Antigravity Labs</span>
            <span className={styles.divider}>|</span>
            <span className={styles.author}>Developed by ziuus</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
