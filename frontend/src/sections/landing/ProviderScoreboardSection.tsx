import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MOCK_ROUTE_FORECAST } from '../../types/coverage';
import type { ProviderScore } from '../../types/coverage';

type Scope = 'route' | 'dest' | 'origin';

export default function ProviderScoreboardSection() {
  const [activeScope, setActiveScope] = useState<Scope>('route');

  const scopes: { id: Scope; label: string }[] = [
    { id: 'route',  label: 'This route' },
    { id: 'dest',   label: 'Destination only' },
    { id: 'origin', label: 'Origin only' },
  ];

  const providers = MOCK_ROUTE_FORECAST.providers;
  const bestScore = Math.max(...providers.map(p => p.score));

  return (
    <section className="block" data-section="provider-scoreboard">
      <div className="block-head">
        <div>
          <div className="eyebrow">02 · Provider scorecard</div>
          <h2 className="h-section" style={{ marginTop: 6 }}>Side-by-side along this route</h2>
          <div className="h-sub">Average signal score, fastest speed sample, and forecast confidence per provider.</div>
        </div>
        <div className="block-head-r">
          <div className="seg">
            {scopes.map(s => (
              <button
                key={s.id}
                className={activeScope === s.id ? 'active' : ''}
                onClick={() => setActiveScope(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 14,
      }}
      className="sm:!grid-cols-2 lg:!grid-cols-3"
      >
        {providers.map((provider, i) => (
          <motion.div
            key={provider.provider}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.4, ease: 'easeOut' }}
          >
            <ProviderCard provider={provider} isBest={provider.score === bestScore} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function ProviderCard({ provider, isBest }: { provider: ProviderScore; isBest: boolean }) {
  const sparkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sparkRef.current;
    if (!el) return;
    const max = Math.max(...provider.sparklineData);
    while (el.firstChild) el.removeChild(el.firstChild);
    provider.sparklineData.forEach(v => {
      const s = document.createElement('span');
      const h = Math.max(3, (v / max) * 32);
      s.style.height = h + 'px';
      s.style.borderRadius = '2px';
      const colorMap: Record<string, string> = { globe: '#1F4FFFcc', smart: '#E11D48aa', dito: '#4F46E599' };
      s.style.background = colorMap[provider.provider] ?? '#94A3B8';
      el.appendChild(s);
    });
  }, [provider]);

  const networkClass = provider.network === '5G' ? 'g5' : provider.network === '4G LTE' ? 'g4' : 'g3';

  return (
    <div style={{
      background: 'white',
      border: isBest ? '1px solid var(--brand)' : '1px solid var(--line)',
      borderRadius: 14,
      padding: 18,
      boxShadow: isBest
        ? '0 0 0 3px rgba(31,79,255,0.08)'
        : '0 1px 2px rgba(15,23,42,0.04)',
      position: 'relative',
      cursor: 'pointer',
      transition: 'transform .12s, box-shadow .12s',
    }}
    className="sm:!p-4 hover:!-translate-y-0.5 hover:!shadow-lg"
    >
      {isBest && (
        <div style={{
          position: 'absolute',
          top: -10,
          left: 16,
          background: 'var(--brand)',
          color: 'white',
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          padding: '3px 9px',
          borderRadius: 999,
        }}>
          Best fit
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className={`prov-tile ${provider.provider}`}>{provider.name[0]}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{provider.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{provider.fullName}</div>
          </div>
        </div>
        <span className={`net-tag ${networkClass}`}>{provider.network}</span>
      </div>

      {/* Score */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 38, fontWeight: 600, letterSpacing: '-1.5px', color: 'var(--ink)', lineHeight: 1 }}>
          {provider.score}
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink-5)' }}>/100</span>
        <span style={{
          marginLeft: 'auto',
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: provider.delta >= 0 ? 'var(--ok)' : 'var(--bad)',
          background: provider.delta >= 0 ? 'var(--ok-tint)' : 'var(--bad-tint)',
          padding: '3px 7px',
          borderRadius: 4,
          fontWeight: 600,
        }}>
          {provider.delta >= 0 ? '▲' : '▼'} {Math.abs(provider.delta)}
        </span>
      </div>

      {/* Sparkline */}
      <div
        ref={sparkRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(28, 1fr)',
          gap: 2,
          height: 36,
          alignItems: 'flex-end',
          marginBottom: 14,
        }}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', paddingTop: 12, borderTop: '1px solid var(--line-soft)' }}>
        <ProvStat value={`${provider.avgSpeedMbps} Mbps`}    label="Avg speed" />
        <ProvStat value={`${provider.strongSignalPct}%`}      label="Strong sig." bordered />
        <ProvStat value={`${provider.confidencePct}%`}        label="Confidence" bordered />
      </div>
    </div>
  );
}

function ProvStat({ value, label, bordered }: { value: string; label: string; bordered?: boolean }) {
  return (
    <div style={{
      paddingLeft: bordered ? 12 : undefined,
      paddingRight: bordered ? undefined : 8,
      borderLeft: bordered ? '1px solid var(--line-soft)' : undefined,
    }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{value}</div>
      <div style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 2 }}>{label}</div>
    </div>
  );
}
