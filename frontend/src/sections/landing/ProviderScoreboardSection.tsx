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
    <section id="providers" className="block" data-section="provider-scoreboard">
      <div className="block-head">
        <div>
          <div className="eyebrow">02 · Provider scorecard</div>
          <h2 className="h-section mt-[6px]">Side-by-side along this route</h2>
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

      <div className="grid grid-cols-1 gap-[14px] sm:!grid-cols-2 lg:!grid-cols-3">
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
    <div
      className="bg-white rounded-[14px] p-[18px] relative cursor-pointer transition-[transform,box-shadow] duration-[120ms] sm:!p-4 hover:!-translate-y-0.5 hover:!shadow-lg"
      style={{
        border: isBest ? '1px solid var(--brand)' : '1px solid var(--line)',
        boxShadow: isBest
          ? '0 0 0 3px rgba(31,79,255,0.08)'
          : '0 1px 2px rgba(15,23,42,0.04)',
      }}
    >
      {isBest && (
        <div className="absolute -top-[10px] left-4 bg-[var(--brand)] text-white text-[10px] font-bold uppercase tracking-[0.06em] py-[3px] px-[9px] rounded-full">
          Best fit
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-[14px]">
        <div className="flex items-center gap-2.5">
          <div className={`prov-tile ${provider.provider}`}>{provider.name[0]}</div>
          <div>
            <div className="text-[15px] font-bold">{provider.name}</div>
            <div className="text-[11px] text-[var(--ink-4)]">{provider.fullName}</div>
          </div>
        </div>
        <span className={`net-tag ${networkClass}`}>{provider.network}</span>
      </div>

      {/* Score */}
      <div className="flex items-baseline gap-1.5 mb-[14px]">
        <span
          className="text-[38px] font-semibold tracking-[-1.5px] text-[var(--ink)] leading-none"
          style={{ fontFamily: 'var(--mono)' }}
        >
          {provider.score}
        </span>
        <span className="text-[13px] text-[var(--ink-5)]" style={{ fontFamily: 'var(--mono)' }}>/100</span>
        <span
          className="ml-auto text-[11px] py-[3px] px-[7px] rounded-[4px] font-semibold"
          style={{
            fontFamily: 'var(--mono)',
            color: provider.delta >= 0 ? 'var(--ok)' : 'var(--bad)',
            background: provider.delta >= 0 ? 'var(--ok-tint)' : 'var(--bad-tint)',
          }}
        >
          {provider.delta >= 0 ? '▲' : '▼'} {Math.abs(provider.delta)}
        </span>
      </div>

      {/* Sparkline */}
      <div
        ref={sparkRef}
        className="grid grid-cols-[repeat(28,1fr)] gap-0.5 h-9 items-end mb-[14px]"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 pt-3 border-t border-[var(--line-soft)]">
        <ProvStat value={`${provider.avgSpeedMbps} Mbps`}    label="Avg speed" />
        <ProvStat value={`${provider.strongSignalPct}%`}      label="Strong sig." bordered />
        <ProvStat value={`${provider.confidencePct}%`}        label="Confidence" bordered />
      </div>
    </div>
  );
}

function ProvStat({ value, label, bordered }: { value: string; label: string; bordered?: boolean }) {
  return (
    <div
      style={{
        paddingLeft: bordered ? 12 : undefined,
        paddingRight: bordered ? undefined : 8,
        borderLeft: bordered ? '1px solid var(--line-soft)' : undefined,
      }}
    >
      <div className="text-sm font-semibold text-[var(--ink)]" style={{ fontFamily: 'var(--mono)' }}>{value}</div>
      <div className="text-[10.5px] text-[var(--ink-4)] mt-0.5">{label}</div>
    </div>
  );
}
