"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { Sparkles } from "lucide-react";

interface RoadmapItem {
  id: string;
  title: string;
  status: 'pending' | 'done';
  goal?: string;
}

interface LayerData {
  id: string;
  title: string;
  description: string;
  items: RoadmapItem[];
}

interface RoadmapData {
  target_roles: string[];
  layers: LayerData[];
  milestones: RoadmapItem[];
  mlops_devops: RoadmapItem[];
  security_ethics: RoadmapItem[];
}

export default function Home() {
  const [data, setData] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const fetchRoadmap = async () => {
    try {
      const res = await fetch('/api/roadmap');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch roadmap:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchRoadmap();
    };
    init();
  }, []);

  const toggleItem = async (type: string, layerId: string | null, itemId: string) => {
    if (!data) return;

    const newData = { ...data };
    let targetItems: RoadmapItem[] = [];

    if (type === 'layer' && layerId) {
      const layer = newData.layers.find(l => l.id === layerId);
      if (layer) targetItems = layer.items;
    } else if (type === 'milestone') {
      targetItems = newData.milestones;
    } else if (type === 'mlops') {
      targetItems = newData.mlops_devops;
    } else if (type === 'security') {
      targetItems = newData.security_ethics;
    }

    const item = targetItems.find(i => i.id === itemId);
    if (item) {
      item.status = item.status === 'pending' ? 'done' : 'pending';
      setData(newData);
      
      // Persist to server
      await fetch('/api/roadmap', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });
    }
  };

  const handleAskAI = async () => {
    if (!chatInput.trim()) return;
    setIsChatLoading(true);
    setAiResponse("Querying Gemini CLI...");
    
    try {
      const res = await fetch('/api/ask-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: chatInput })
      });
      const json = await res.json();
      setAiResponse(json.response || json.error);
    } catch {
      setAiResponse("Failed to connect to AI engine.");
    } finally {
      setIsChatLoading(false);
    }
  };

  if (loading) return <div className={styles.container}>Loading Roadmap...</div>;
  if (!data) return <div className={styles.container}>Error loading data.</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoMark}>J</div>
        <h1 className={styles.title}>Journey Portal</h1>
        <p className={styles.subtitle}>
          Mastering the transition from 2013 fundamentals to 2030 autonomous performance.
        </p>

        <div className={styles.themeSection}>
          <span className={styles.themeLabel}>Core Theme</span>
          <div className={styles.themeDivider} />
          <span className={`${styles.themeYear} ${styles.themeYearOld}`}>Interview Core</span>
          <span className={styles.themeArrow}>⟹</span>
          <span className={`${styles.themeYear} ${styles.themeYearNew}`}>Production AI</span>
        </div>
      </header>

      <section className={styles.dashboard}>
        <div className={styles.sectionLabel}>
          <div className={styles.sectionDot} />
          <span className={styles.sectionTitle}>The Mastery Layers</span>
        </div>

        <div className={styles.cardsGrid}>
          {data.layers.map((layer) => (
            <div
              key={layer.id}
              className={`${styles.card} ${expandedLayer === layer.id ? styles.cardExpanded : ''}`}
              onClick={() => setExpandedLayer(expandedLayer === layer.id ? null : layer.id)}
            >
              <div className={styles.cardContent}>
                <div className={`${styles.cardIcon} ${styles.cardIconDsa}`}>
                  {layer.id === 'layer1' ? '⚡' : layer.id === 'layer2' ? '🧠' : layer.id === 'layer3' ? '🔮' : layer.id === 'layer4' ? '⛓' : '🚀'}
                </div>
                <h3 className={styles.cardTitle}>{layer.title}</h3>
                <p className={styles.cardDescription}>{layer.description}</p>
                
                {expandedLayer === layer.id && (
                  <div className={styles.itemList} onClick={(e) => e.stopPropagation()}>
                    {layer.items.map(item => (
                      <div key={item.id} className={`${styles.itemRow} ${item.status === 'done' ? styles.itemRowDone : ''}`}>
                        <input 
                          type="checkbox" 
                          className={styles.checkbox} 
                          checked={item.status === 'done'} 
                          onChange={() => toggleItem('layer', layer.id, item.id)}
                        />
                        <span className={styles.itemTitle}>{item.title}</span>
                        {item.goal && <span className={styles.cardLevel} style={{marginLeft: 'auto'}}>{item.goal}</span>}
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.cardMeta}>
                  <span className={styles.cardLevel}>{expandedLayer === layer.id ? 'Collapse' : 'Expand'}</span>
                  <span className={styles.cardArrow}>{expandedLayer === layer.id ? '↑' : '→'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* --- Milestones Section --- */}
        <div className={styles.sectionLabel}>
          <div className={styles.sectionDot} />
          <span className={styles.sectionTitle}>Project Milestones</span>
        </div>
        <div className={styles.cardsGrid}>
            <div className={styles.card} style={{gridColumn: '1 / -1', minHeight: 'auto'}}>
               <div className={styles.itemList}>
                  {data.milestones.map(item => (
                    <div key={item.id} className={`${styles.itemRow} ${item.status === 'done' ? styles.itemRowDone : ''}`}>
                      <input 
                        type="checkbox" 
                        className={styles.checkbox} 
                        checked={item.status === 'done'} 
                        onChange={() => toggleItem('milestone', null, item.id)}
                      />
                      <span className={styles.itemTitle}>{item.title}</span>
                    </div>
                  ))}
               </div>
            </div>
        </div>
      </section>

      {/* --- AI Interaction Float --- */}
      <div className={styles.chatContainer}>
         <div className={styles.chatWindow}>
            <div className={styles.chatTitle}>
               <Sparkles size={16} /> Gemini System Engine
            </div>
            {aiResponse && (
               <div className={styles.chatResponse}>
                  {aiResponse}
               </div>
            )}
            <div className={`${styles.chatInputWrapper} ${isChatLoading ? styles.loading : ''}`}>
               <input 
                 type="text" 
                 className={styles.chatInput} 
                 placeholder="Update roadmap or ask..." 
                 value={chatInput}
                 onChange={(e) => setChatInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
               />
               <button className={styles.chatSendBtn} onClick={handleAskAI}>
                  {isChatLoading ? '...' : 'Send'}
               </button>
            </div>
         </div>
      </div>

      <footer className={styles.footer}>
        <p className={styles.footerText}>
          <span className={styles.footerAccent}>Journey</span> — AI Goal Center 2026
        </p>
      </footer>
    </div>
  );
}
