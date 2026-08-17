import { useState, useRef, useEffect } from 'react';
import { C } from '../constants/colors';
import { I } from './icons';
import { useAI } from '../hooks/useAI';

export default function AIBox() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, loading, error, ask, clear } = useAI();
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  function submit(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    ask(input.trim());
    setInput('');
  }

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ position: 'fixed', bottom: 24, right: 24, width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#818cf8)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(59,130,246,.4)', zIndex: 1000 }}
      >
        <I.ai size={18} stroke="#fff" />
      </button>

      {/* Panel */}
      {open && (
        <div style={{ position: 'fixed', bottom: 80, right: 24, width: 340, maxHeight: 480, background: C.surf, border: '1px solid var(--c-border)', borderRadius: 16, display: 'flex', flexDirection: 'column', zIndex: 999, boxShadow: '0 24px 64px var(--c-stat-shadow)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--c-divider)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>AI Assistant</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>Ask anything about the dashboard</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={clear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 11, padding: '3px 8px' }}>Clear</button>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><I.x size={14} /></button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: C.muted, fontSize: 12 }}>
                Ask about submission rates, pending faculty, or system status.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '8px 12px', borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px', background: m.role === 'user' ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : 'var(--c-soft-bg)', fontSize: 12, color: m.role === 'user' ? '#fff' : C.text, lineHeight: 1.5 }}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', padding: '8px 12px', borderRadius: '12px 12px 12px 4px', background: 'var(--c-soft-bg)', fontSize: 12, color: C.muted }}>
                Thinking…
              </div>
            )}
            {error && <div style={{ fontSize: 11, color: C.red, textAlign: 'center' }}>{error}</div>}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={submit} style={{ padding: '10px 12px', borderTop: '1px solid var(--c-divider)', display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="ifield"
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--c-input-border)', background: 'var(--c-input-bg)', fontSize: 12, color: C.text, fontFamily: 'inherit' }}
            />
            <button type="submit" disabled={loading} style={{ padding: '8px 12px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
              <I.send size={13} stroke="#fff" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
