"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navigation.module.css';
import { LayoutDashboard, GitBranch, Zap, Sparkles, Settings, Home } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/tree', label: 'Goal Tree', icon: GitBranch },
    { href: '/focus', label: 'Deep Focus', icon: Zap },
    { href: '/review', label: 'AI Review', icon: Sparkles },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
      <div className={styles.navContainer}>
        <Link href="/" className={styles.logo}>
          <div className={styles.logoBox}>J</div>
          <span className={styles.logoText}>Journey</span>
        </Link>

        <div className={styles.links}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className={styles.navActions}>
            <div className={styles.statusIndicator}>
                <div className={styles.pulse} />
                <span>Live Core</span>
            </div>
        </div>
      </div>
    </nav>
  );
}
