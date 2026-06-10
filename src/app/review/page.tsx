"use client";
import React, { useState, useEffect } from 'react';
import styles from './review.module.css';
import { AiChange } from '../../types/roadmap';

export default function ReviewView() {
  const [changes, setChanges] = useState<AiChange[]>([]);

  useEffect(() => {
    fetch('/api/changes')
      .then(res => res.json())
      .then(setChanges);
  }, []);

  const handleAction = async (changeId: string, action: 'accept' | 'reject') => {
    await fetch('/api/changes', {
      method: 'POST',
      body: JSON.stringify({ changeId, action }),
      headers: { 'Content-Type': 'application/json' }
    });
    setChanges(changes.filter(c => c.id !== changeId));
  };

  return (
    <div className={styles.container}>
      <h2>AI Review Queue</h2>
      {changes.length === 0 ? (
        <p>No pending changes.</p>
      ) : (
        <ul className={styles.changeList}>
          {changes.map(change => (
            <li key={change.id} className={styles.changeItem}>
              <p><strong>Action:</strong> {change.action}</p>
              <p><strong>Reason:</strong> {change.reason}</p>
              <div className={styles.actions}>
                <button onClick={() => handleAction(change.id, 'accept')}>Accept</button>
                <button onClick={() => handleAction(change.id, 'reject')}>Reject</button>
                {change.isMinor && <button onClick={() => handleAction(change.id, 'accept')}>Auto-Accept Minor</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
