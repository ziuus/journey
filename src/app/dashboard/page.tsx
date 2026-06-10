import React from 'react';
import styles from './dashboard.module.css';
import AiGoalGenerator from '../../components/AiGoalGenerator';

export default function DashboardView() {
  const roadmapContext = "Current roadmap: [Insert serialized roadmap data here or use a hook to get it]";

  return (
    <div className={styles.container}>
      <h1>Dashboard View</h1>
      <p>Cinematic progress and top-level stats.</p>
      <AiGoalGenerator roadmapContext={roadmapContext} />
    </div>
  );
}
