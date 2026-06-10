"use client";

import React, { useState } from 'react';
// Move CSS to a local file or use global/inline
import { useConfig } from '../context/ConfigContext';

export default function AiGoalGenerator({ roadmapContext }: { roadmapContext: string }) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const { config } = useConfig();
  
  // Inline styles for simplicity to avoid import issues for now
  const containerStyle = { padding: '20px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '20px', marginTop: '20px' };
  const textareaStyle: React.CSSProperties = { width: '100%', height: '100px', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '12px', color: 'white', margin: '10px 0', resize: 'vertical' };
  const buttonStyle = { background: '#00ff87', color: '#050a0a', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' };
  const responseStyle = { marginTop: '20px', padding: '15px', background: 'rgba(0, 255, 135, 0.05)', borderRadius: '12px', whiteSpace: 'pre-wrap', fontSize: '14px' };

  const handleGenerate = async () => {
    setLoading(true);
    setResponse('');
    try {
      const res = await fetch('/api/ask-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          roadmapContext,
          apiKey: localStorage.getItem('gemini_api_key'),
          model: 'gemini-2.5-flash',
        }),
      });
      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      console.error(error);
      setResponse('Failed to generate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h3>AI Goal Assistant</h3>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="What would you like to achieve?"
        style={textareaStyle}
      />
      <button onClick={handleGenerate} disabled={loading} style={buttonStyle}>
        {loading ? 'Thinking...' : 'Generate Roadmap Update'}
      </button>
      {response && <div style={responseStyle}>{response}</div>}
    </div>
  );
}
