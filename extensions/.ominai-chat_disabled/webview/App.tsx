import * as React from 'react';
import { useState } from 'react';

// TODO(Phase 2): Wire this up to the ProviderAdapter for real state
const PROVIDERS = [
  { id: 'chatgpt', name: 'ChatGPT', status: 'Connected' },
  { id: 'claude', name: 'Claude', status: 'Not connected' },
  { id: 'gemini', name: 'Gemini', status: 'Free tier' },
  { id: 'deepseek', name: 'DeepSeek', status: 'Not connected' },
  { id: 'local', name: 'Local Model', status: 'Connected' },
];

export default function App() {
  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0]);
  const [autoAssign, setAutoAssign] = useState(true);
  const [message, setMessage] = useState('');
  
  // Mock history
  const [history, setHistory] = useState([
    { role: 'system', content: 'OMINAI Initialized.' },
    { role: 'user', content: 'Make the header blue' },
    { role: 'assistant', content: 'I have updated the header to be blue.', diff: '1 file changed' }
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '10px' }}>
      
      {/* Header / History Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>OMINAI Workspace</h3>
        <button style={{ background: 'var(--vscode-button-background)', color: 'var(--vscode-button-foreground)', border: 'none', padding: '4px 8px', cursor: 'pointer' }}>New Chat</button>
      </div>

      {/* Role Assignment Settings */}
      <div style={{ padding: '10px', background: 'var(--vscode-editor-background)', marginBottom: '10px', borderRadius: '4px' }}>
        <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', cursor: 'pointer' }}>
          <input type="checkbox" checked={autoAssign} onChange={(e) => setAutoAssign(e.target.checked)} />
          Let OMINI choose roles automatically
        </label>
        {!autoAssign && (
          <div style={{ marginTop: '5px', fontSize: '12px', color: 'var(--vscode-descriptionForeground)' }}>
            <div>Reasoning: ChatGPT</div>
            <div>Code writing: Claude</div>
          </div>
        )}
      </div>

      {/* Chat History View */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {history.map((msg, i) => (
          <div key={i} style={{ 
            padding: '8px', 
            borderRadius: '4px',
            background: msg.role === 'user' ? 'var(--vscode-button-secondaryBackground)' : 'var(--vscode-editor-inactiveSelectionBackground)'
          }}>
            <strong>{msg.role === 'user' ? 'You' : 'OMINAI'}</strong>
            <p style={{ margin: '4px 0' }}>{msg.content}</p>
            {msg.diff && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--vscode-editor-background)', padding: '4px', fontSize: '12px' }}>
                <span>{msg.diff}</span>
                <div>
                  <button style={{ marginRight: '4px' }}>Accept</button>
                  <button>Reject</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div style={{ marginTop: '10px' }}>
        <textarea 
          style={{ width: '100%', height: '60px', background: 'var(--vscode-input-background)', color: 'var(--vscode-input-foreground)', border: '1px solid var(--vscode-input-border)', padding: '5px', resize: 'vertical' }}
          placeholder="Ask OMINAI to code..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        
        {/* Provider Selector Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '12px' }}>
          <select 
            style={{ background: 'var(--vscode-dropdown-background)', color: 'var(--vscode-dropdown-foreground)', border: '1px solid var(--vscode-dropdown-border)' }}
            value={selectedProvider.id} 
            onChange={(e) => setSelectedProvider(PROVIDERS.find(p => p.id === e.target.value) || PROVIDERS[0])}>
            {PROVIDERS.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.status})</option>
            ))}
          </select>
          <button style={{ background: 'var(--vscode-button-background)', color: 'var(--vscode-button-foreground)', border: 'none', padding: '4px 8px' }}>Send</button>
        </div>
      </div>
    </div>
  );
}
