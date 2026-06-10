import React from 'react';
import styles from './focus.module.css';

export default function FocusView() {
  return (
    <div className={styles.container}>
      <h2>Focus Mode</h2>
      <p>One active sub-task displayed at a time.</p>
    </div>
  );
}
