import { useState, useRef, useEffect } from 'react';
import { MOCK_USE_CASES, MOCK_CHAT_MESSAGES } from '../../types/coverage';
import type { ChatMessage } from '../../types/coverage';

const PROVIDER_COLORS: Record<string, string> = {
  globe: '#1F4FFF',
  smart: '#E11D48',
  dito:  '#4F46E5',
};

const QUICK_PROMPTS = [
  'Which SIM for Baguio trip?',
  'Signal near EDSA?',
  'Globe vs Smart in Cebu?',
];

export default function UseCasesSection() {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, isTyping]);

  function send(text: string) {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    /* Simulated bot reply — PLACEHOLDER for real agent response */
    setTimeout(() => {
      setIsTyping(false);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: 'Based on 14,210 community readings along this route, Globe provides the most consistent 4G LTE coverage through rural stretches.',
        citation: 'Crowdsourced Summary Agent',
      };
      setMessages(prev => [...prev, botMsg]);
    }, 1400);
  }

  return (
    <section className="block" data-section="use-cases">
      <div className="block-head">
        <div>
          <div className="eyebrow">03 · Who uses SignalPH</div>
          <h2 className="h-section" style={{ marginTop: 6 }}>Built for every kind of traveler</h2>
          <div className="h-sub">From daily commuters to field workers — see which SIM works best for your journey type.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}
      className="lg:!grid-cols-2 lg:!gap-[18px]"
      >
        {/* Use case table */}
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Popular use cases</div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Best SIM</span>
          </div>
          <div>
            {MOCK_USE_CASES.map((uc, i) => (
              <div key={uc.id} style={{
                display: 'grid',
                gridTemplateColumns: '32px 1fr auto',
                gap: 14,
                alignItems: 'center',
                padding: '14px 18px',
                borderTop: i === 0 ? 0 : '1px solid var(--line-soft)',
                cursor: 'pointer',
              }}
              className="hover:!bg-[var(--tint)]"
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand-tint)', color: 'var(--brand-ink)', display: 'grid', placeItems: 'center', fontSize: 16 }}>
                  {uc.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{uc.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 1 }}>{uc.subtitle}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: PROVIDER_COLORS[uc.bestProvider] }} />
                  {uc.bestProvider.charAt(0).toUpperCase() + uc.bestProvider.slice(1)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI assistant chat */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-head">
            <div className="panel-title">
              <span style={{ fontSize: 14 }}>✦</span>
              Ask SignalPH
              <span className="badge">AI</span>
            </div>
          </div>

          {/* Chat body */}
          <div
            ref={bodyRef}
            style={{
              flex: 1,
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              background: 'var(--tint)',
              borderBottom: '1px solid var(--line)',
              minHeight: 240,
              overflowY: 'auto',
            }}
          >
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  maxWidth: '88%',
                  padding: '10px 13px',
                  borderRadius: 12,
                  fontSize: 13,
                  lineHeight: 1.5,
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.role === 'user' ? 'var(--ink)' : 'white',
                  border: msg.role === 'bot' ? '1px solid var(--line)' : 'none',
                  color: msg.role === 'user' ? 'white' : 'var(--ink)',
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 12,
                  borderBottomLeftRadius: msg.role === 'bot' ? 4 : 12,
                }}
              >
                {msg.text}
                {msg.citation && (
                  <div style={{ marginTop: 6 }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      background: 'var(--brand-tint)',
                      color: 'var(--brand-ink)',
                      borderRadius: 5,
                      padding: '3px 7px',
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      fontWeight: 600,
                    }}>
                      ↗ {msg.citation}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div style={{
                display: 'inline-flex',
                gap: 3,
                alignSelf: 'flex-start',
                padding: '9px 12px',
                background: 'white',
                border: '1px solid var(--line)',
                borderRadius: 12,
                borderBottomLeftRadius: 4,
              }}>
                {[0, 0.2, 0.4].map((delay, i) => (
                  <span key={i} style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: 'var(--ink-5)',
                    animation: `bounce 1.2s ${delay}s infinite`,
                  }} />
                ))}
              </div>
            )}
          </div>

          {/* Quick prompts */}
          <div style={{ display: 'flex', gap: 6, padding: '10px 14px', borderBottom: '1px solid var(--line-soft)', overflowX: 'auto' }}>
            {QUICK_PROMPTS.map(prompt => (
              <button
                key={prompt}
                onClick={() => send(prompt)}
                style={{
                  flexShrink: 0,
                  border: '1px solid var(--line)',
                  background: 'white',
                  borderRadius: 999,
                  padding: '5px 11px',
                  fontSize: 11.5,
                  fontWeight: 500,
                  color: 'var(--ink-3)',
                  whiteSpace: 'nowrap',
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: 8, padding: '12px 14px', alignItems: 'center' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send(input); }}
              placeholder="Ask about signal coverage…"
              style={{
                flex: 1,
                border: '1px solid var(--line)',
                borderRadius: 9,
                padding: '9px 12px',
                fontSize: 13,
                fontFamily: 'inherit',
                outline: 'none',
                color: 'var(--ink)',
              }}
            />
            <button
              onClick={() => send(input)}
              style={{
                background: 'var(--brand)',
                color: 'white',
                border: 0,
                borderRadius: 9,
                width: 36,
                height: 36,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M13 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
