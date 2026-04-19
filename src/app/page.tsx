"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import styles from "./page.module.css";
import { Sparkles, Terminal as TerminalIcon, X, Send, Command, ChevronRight, Activity, Search, Image as ImageIcon } from "lucide-react";

interface RoadmapItem {
  id: string;
  title: string;
  status: 'pending' | 'done';
  goal?: string;
  notes?: string;
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

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  command?: string;
  imagePreview?: string;
}

// Helper to highlight matching text
const HighlightText = ({ text, query }: { text: string, query: string }) => {
  if (!query.trim()) return <>{text}</>;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className={styles.highlight}>{part}</span>
        ) : (
          part
        )
      )}
    </>
  );
};

export default function Home() {
  const [data, setData] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [searchQuery, setSearchWrapper] = useState("");
  
  // Terminal State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [messageQueue, setMessageQueue] = useState<{prompt: string, image?: string}[]>([]);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  
  // History State
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tempInput, setTempInput] = useState("");
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const fetchChatHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const json = await res.json();
      if (json.messages && json.messages.length > 0) {
        setMessages(json.messages);
      } else {
        setMessages([{ role: 'system', content: 'Gemini CLI Bridge active. Type /help for options.' }]);
      }
      if (json.commandHistory) {
        setHistory(json.commandHistory);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const saveHistoryToServer = async (newMessages: ChatMessage[], newHistory: string[]) => {
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, commandHistory: newHistory })
      });
    } catch (err) {
      console.error("Failed to persist history:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchRoadmap(), fetchChatHistory()]);
    };
    init();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [chatInput]);

  // Message Queue Logic
  useEffect(() => {
    if (messageQueue.length > 0 && !isChatLoading) {
      const nextRequest = messageQueue[0];
      processAIRequest(nextRequest.prompt, nextRequest.image);
      setMessageQueue(prev => prev.slice(1));
    }
  }, [messageQueue, isChatLoading]);

  const handleHistoryNav = (direction: 'up' | 'down') => {
    if (history.length === 0) return;
    let newIndex = historyIndex;
    if (direction === 'up') {
      if (historyIndex === -1) setTempInput(chatInput);
      newIndex = Math.min(historyIndex + 1, history.length - 1);
    } else {
      newIndex = Math.max(historyIndex - 1, -1);
    }
    if (newIndex !== historyIndex) {
      setHistoryIndex(newIndex);
      setChatInput(newIndex === -1 ? tempInput : history[history.length - 1 - newIndex]);
    }
  };

  const toggleItem = async (type: string, layerId: string | null, itemId: string) => {
    if (!data) return;
    const newData = { ...data };
    let targetItems: RoadmapItem[] = [];
    if (type === 'layer' && layerId) {
      const layer = newData.layers.find(l => l.id === layerId);
      if (layer) targetItems = layer.items;
    } else if (type === 'milestone') {
      targetItems = newData.milestones;
    }
    const item = targetItems.find(i => i.id === itemId);
    if (item) {
      item.status = item.status === 'pending' ? 'done' : 'pending';
      setData(newData);
      await fetch('/api/roadmap', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });
    }
  };

  const processAIRequest = async (prompt: string, image?: string) => {
    setIsChatLoading(true);
    try {
      const res = await fetch('/api/ask-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, image })
      });
      const json = await res.json();
      
      const assistantMsg: ChatMessage = { 
        role: 'assistant', 
        content: json.response || json.error,
        command: json.executed_command 
      };
      setMessages(prev => {
         const updated = [...prev, assistantMsg];
         saveHistoryToServer(updated, history);
         return updated;
      });
      fetchRoadmap();
    } catch {
      setMessages(prev => [...prev, { role: 'system', content: 'Bridge error: Failed to connect to local CLI.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleAskAI = async () => {
    const input = chatInput.trim();
    if (!input) return;

    if (input === '/clear') {
      const newMsgs: ChatMessage[] = [{ role: 'system', content: 'Terminal cleared.' }];
      setMessages(newMsgs);
      setHistory(prev => [input, ...prev]);
      setHistoryIndex(-1);
      setChatInput("");
      setAttachedImage(null);
      await saveHistoryToServer(newMsgs, [input, ...history]);
      return;
    }

    if (input === '/help') {
      const helpMsg = `Available Commands:\n/clear - Reset window\n/help - Show options\nAI can update roadmap: "Mark Python as done"`;
      setMessages(prev => [...prev, { role: 'user', content: input }, { role: 'system', content: helpMsg }]);
      setHistory(prev => [input, ...prev]);
      setHistoryIndex(-1);
      setChatInput("");
      return;
    }
    
    const userMsg: ChatMessage = { role: 'user', content: input, imagePreview: attachedImage || undefined };
    setMessages(prev => [...prev, userMsg]);
    setHistory(prev => [input, ...prev]);
    setHistoryIndex(-1);
    setChatInput("");
    
    setMessageQueue(prev => [...prev, { prompt: input, image: attachedImage || undefined }]);
    setAttachedImage(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filtered Data for Search
  const filteredLayers = data?.layers.filter(layer => 
    layer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    layer.items.some(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <div className={styles.container}>Loading Roadmap...</div>;

  return (
    <div className={styles.container}>
      <button className={styles.toggleBtn} onClick={() => setIsPanelOpen(true)}>
         <TerminalIcon size={24} />
      </button>

      <aside className={`${styles.sidePanel} ${isPanelOpen ? styles.sidePanelOpen : ''}`}>
         <div className={styles.panelHeader}>
            <div className={styles.chatTitle} style={{margin:0}}>
               <Command size={16} /> Agent Command Center
            </div>
            <button onClick={() => setIsPanelOpen(false)} style={{background:'none', border:'none', color:'white', cursor:'pointer'}}>
               <X size={20} />
            </button>
         </div>

         <div className={styles.terminalContainer} ref={scrollRef}>
            {messages.map((msg, i) => (
               <div key={i} className={styles.terminalMessage}>
                  <div className={`${styles.messageRole} ${msg.role === 'system' ? 'opacity-30' : ''}`}>
                     {msg.role}
                  </div>
                  {msg.imagePreview && (
                    <div style={{ marginBottom: '8px' }}>
                       <img src={msg.imagePreview} alt="upload" style={{ maxWidth: '100%', borderRadius: '12px', border: '1px solid var(--glass-border)' }} />
                    </div>
                  )}
                  <div className={styles.messageContent}>
                    {msg.content.split('\n').map((line, li) => (
                      <div key={li} className={line.trim().startsWith('/') ? styles.slashCommand : ''}>
                        {line}
                      </div>
                    ))}
                  </div>
                  {msg.command && (
                     <div className={styles.commandTag}>
                        <ChevronRight size={10} /> {msg.command}
                     </div>
                  )}
               </div>
            ))}
            {isChatLoading && (
               <div className={styles.terminalMessage}>
                  <div className={styles.messageRole}>assistant</div>
                  <div className={styles.messageContent}>
                     <span className="animate-pulse">Processing intent...</span>
                  </div>
               </div>
            )}
         </div>

         <div className={styles.panelFooter}>
            {attachedImage && (
               <div style={{ position: 'relative', padding: '12px 12px 0' }}>
                  <img src={attachedImage} alt="preview" style={{ height: '60px', borderRadius: '8px', border: '1px solid var(--accent-green)' }} />
                  <button 
                    onClick={() => setAttachedImage(null)}
                    style={{ position: 'absolute', top: '4px', left: '64px', background: 'black', borderRadius: '50%', border: 'none', color: 'white', cursor: 'pointer', padding: '2px' }}
                  >
                    <X size={12} />
                  </button>
               </div>
            )}
            <div className={`${styles.chatInputWrapper} ${isChatLoading && messageQueue.length === 0 ? styles.loading : ''}`}>
               <button 
                 className={styles.chatSendBtn} 
                 onClick={() => fileInputRef.current?.click()}
                 style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
               >
                  <ImageIcon size={14} />
               </button>
               <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
               <textarea 
                 ref={textareaRef}
                 className={styles.chatInput} 
                 placeholder="Enter command or goal..." 
                 value={chatInput}
                 onChange={(e) => setChatInput(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     handleAskAI();
                   } else if (e.key === 'ArrowUp' && (chatInput.trim() === '' || historyIndex !== -1)) {
                     e.preventDefault();
                     handleHistoryNav('up');
                   } else if (e.key === 'ArrowDown' && historyIndex !== -1) {
                     e.preventDefault();
                     handleHistoryNav('down');
                   }
                 }}
                 style={{ 
                    resize: 'none', 
                    minHeight: '44px',
                    color: chatInput.trim().startsWith('/') ? '#ff9f0a' : '#f5f5f7'
                 }}
               />
               <button className={styles.chatSendBtn} onClick={handleAskAI} style={{ alignSelf: 'flex-end', height: '44px' }}>
                  {messageQueue.length > 0 ? <Activity size={14} className="animate-spin" /> : <Send size={14} />}
               </button>
            </div>
         </div>
      </aside>

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

      <div style={{display: 'flex', justifyContent: 'center', width: '100%'}}>
          <div className={styles.searchWrapper}>
             <Search size={20} className={styles.searchIcon} />
             <input 
                type="text" 
                className={styles.searchInput} 
                placeholder="Search for skills, technologies, or layers..." 
                value={searchQuery}
                onChange={(e) => setSearchWrapper(e.target.value)}
             />
          </div>
      </div>

      <section className={styles.dashboard}>
        <div className={styles.sectionLabel}>
          <div className={styles.sectionDot} />
          <span className={styles.sectionTitle}>The Mastery Layers</span>
        </div>

        <div className={styles.cardsGrid}>
          {filteredLayers?.map((layer) => (
            <div
              key={layer.id}
              className={`${styles.card} ${expandedLayer === layer.id ? styles.cardExpanded : ''}`}
              onClick={() => setExpandedLayer(expandedLayer === layer.id ? null : layer.id)}
            >
              <div className={styles.cardContent}>
                <div className={`${styles.cardIcon} ${
                  layer.id === 'layer1' ? styles.cardIconDsa : 
                  layer.id === 'layer2' ? styles.cardIconMl : 
                  layer.id === 'layer3' ? styles.cardIconDl : 
                  layer.id === 'layer4' ? styles.cardIconWeb3 : 
                  layer.id === 'layer5' ? styles.cardIconAiWeb3 :
                  layer.id === 'layer6' ? styles.cardIconDl :
                  styles.cardIconWeb3
                }`}>
                  {layer.id === 'layer1' ? '⚡' : layer.id === 'layer2' ? '🧠' : layer.id === 'layer3' ? '🔮' : layer.id === 'layer4' ? '⛓' : layer.id === 'layer5' ? '🚀' : layer.id === 'layer6' ? '⚙️' : '🔐'}
                </div>
                <h3 className={styles.cardTitle}>
                  <HighlightText text={layer.title} query={searchQuery} />
                </h3>
                <p className={styles.cardDescription}>
                  <HighlightText text={layer.description} query={searchQuery} />
                </p>
                
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
                        <span className={styles.itemTitle}>
                           <HighlightText text={item.title} query={searchQuery} />
                        </span>
                        {item.goal && (
                           <span className={styles.cardLevel} style={{marginLeft: 'auto'}}>
                              <HighlightText text={item.goal} query={searchQuery} />
                           </span>
                        )}
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

        <div className={styles.sectionLabel}>
          <div className={styles.sectionDot} />
          <span className={styles.sectionTitle}>Project Milestones</span>
        </div>
        <div className={styles.cardsGrid}>
            <div className={styles.card} style={{gridColumn: '1 / -1', minHeight: 'auto'}}>
               <div className={styles.itemList}>
                  {data?.milestones.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
                    <div key={item.id} className={`${styles.itemRow} ${item.status === 'done' ? styles.itemRowDone : ''}`}>
                      <input 
                        type="checkbox" 
                        className={styles.checkbox} 
                        checked={item.status === 'done'} 
                        onChange={() => toggleItem('milestone', null, item.id)}
                      />
                      <span className={styles.itemTitle}>
                         <HighlightText text={item.title} query={searchQuery} />
                      </span>
                    </div>
                  ))}
               </div>
            </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <p className={styles.footerText}>
          <span className={styles.footerAccent}>Journey</span> — AI Goal Center 2026
        </p>
      </footer>
    </div>
  );
}
