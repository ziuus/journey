import Link from 'next/link';
import styles from './Navigation.module.css';

export default function Navigation() {
  return (
    <nav className={styles.nav}>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/tree">Tree</Link>
      <Link href="/focus">Focus</Link>
      <Link href="/review">Review</Link>
      <Link href="/settings">Settings</Link>
    </nav>
  );
}
