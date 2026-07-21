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
              A goal-tracking engine for AI engineering, systems, Web3, and career growth.
            </p>
          </div>

          <div className={styles.linksGrid}>
            <div className={styles.linkColumn}>
              <Link href="/">Home</Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/tree">Goal Tree</Link>
            </div>
            <div className={styles.linkColumn}>
              <a href="https://github.com/ziuus/journey" target="_blank" rel="noopener noreferrer">GitHub</a>
              <Link href="/settings">Settings</Link>
            </div>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <div className={styles.copyright}>
            <span>&copy; {currentYear}</span>
            <span className={styles.divider}>|</span>
            <span>Journey</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
