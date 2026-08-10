"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Navigation.module.css";
import { LayoutDashboard, GitBranch, Settings, Home, Compass, Sun, Moon } from "lucide-react";
import { useConfig } from "../context/ConfigContext";

export default function Navigation() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { config, updateConfig } = useConfig();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tree", label: "Goal Tree", icon: GitBranch },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const toggleTheme = () => {
    const nextTheme = config.ui.theme === "dark" ? "light" : "dark";
    updateConfig({ ui: { ...config.ui, theme: nextTheme } });
  };

  return (
    <header className={`${styles.navWrapper} ${scrolled ? styles.navWrapperScrolled : ""}`}>
      <div className={styles.floatingPill}>
        {/* Brand */}
        <Link href="/" className={styles.brand}>
          <div className={styles.brandIcon}>
            <Compass size={16} />
          </div>
          <span className={styles.brandText}>Journey</span>
        </Link>

        {/* Center Nav Links */}
        <nav className={styles.linksSegment}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className={styles.actionsGroup}>
          <button
            onClick={toggleTheme}
            className={styles.themeToggleBtn}
            title={`Switch to ${config.ui.theme === "dark" ? "light" : "dark"} mode`}
          >
            {config.ui.theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>
    </header>
  );
}
