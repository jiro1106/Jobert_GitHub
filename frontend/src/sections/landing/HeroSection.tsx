import { useState } from 'react';
import { motion } from 'framer-motion';
import HeroPreviewCards from './HeroPreviewCards';
import { POPULAR_ROUTES } from '../../types/coverage';

type SearchTab = 'route' | 'place' | 'live';

const TABS: { id: SearchTab; label: string; icon: JSX.Element }[] = [
  {
    id: 'route',
    label: 'Plan a route',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 13, height: 13 }}>
        <path d="M5 12h14M13 5l7 7-7 7"/>
      </svg>
    ),
  },
  {
    id: 'place',
    label: 'Check a place',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 13, height: 13 }}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
  {
    id: 'live',
    label: 'Live now',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 13, height: 13 }}>
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
];

/* Staggered animation container */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

export default function HeroSection() {
  const [activeTab, setActiveTab] = useState<SearchTab>('route');

  return (
    <section style={{
      position: 'relative',
      padding: '32px 16px 28px',
      background: `
        radial-gradient(ellipse 60% 80% at 70% 0%, rgba(31,79,255,0.07), transparent 60%),
        linear-gradient(180deg, #FFFFFF 0%, var(--bg) 100%)
      `,
      borderBottom: '1px solid var(--line)',
      overflow: 'hidden',
    }}
    className="md:!pt-14 md:!px-7 md:!pb-9"
    >
      {/* Grid background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(var(--line-soft) 1px, transparent 1px), linear-gradient(90deg, var(--line-soft) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        maskImage: 'radial-gradient(ellipse 60% 80% at 50% 0%, black 0%, transparent 70%)',
        opacity: 0.6,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        maxWidth: 1180,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 40,
        alignItems: 'center',
      }}
      className="lg:!grid-cols-[1.15fr_1fr] lg:!gap-14"
      >
        {/* Left column */}
        <motion.div variants={container} initial="hidden" animate="show">
          {/* Eyebrow */}
          <motion.div variants={item}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 10px 5px 8px',
              border: '1px solid var(--line)',
              background: 'white',
              borderRadius: 999,
              fontFamily: 'var(--mono)',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.04em',
              color: 'var(--ink-3)',
              marginBottom: 22,
            }}>
              <span className="live-dot blue" />
              Predictive coverage · Philippines
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={item} style={{
            fontSize: 'clamp(28px, 7vw, 56px)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-1.2px',
            color: 'var(--ink)',
            marginBottom: 14,
          }}>
            Know your signal,<br />
            <em style={{ fontStyle: 'normal', color: 'var(--brand)', position: 'relative' }}>
              before you travel.
              <span style={{
                position: 'absolute',
                left: 0, right: 0, bottom: -2,
                height: 2,
                background: 'var(--brand)',
                opacity: 0.18,
                borderRadius: 2,
              }} />
            </em>
          </motion.h1>

          {/* Lead */}
          <motion.p variants={item} style={{
            fontSize: 15,
            color: 'var(--ink-3)',
            maxWidth: 480,
            marginBottom: 22,
          }}
          className="md:!text-base md:!mb-7"
          >
            SignalPH forecasts mobile network reliability across every barangay, road,
            and route in the Philippines — so you can pick the right SIM and avoid dead
            zones before you leave.
          </motion.p>

          {/* Search tabs */}
          <motion.div variants={item}>
            <div style={{
              display: 'inline-flex',
              background: 'white',
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: 4,
              marginBottom: 10,
            }}
            role="tablist"
            >
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    border: 0,
                    background: activeTab === tab.id ? 'var(--ink)' : 'transparent',
                    color: activeTab === tab.id ? 'white' : 'var(--ink-4)',
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '6px 12px',
                    borderRadius: 7,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Search card */}
          <motion.div variants={item}>
            <div style={{
              background: 'white',
              border: '1px solid var(--line)',
              borderRadius: 14,
              padding: 8,
              boxShadow: '0 10px 30px -12px rgba(15,23,42,0.16), 0 2px 4px rgba(15,23,42,0.04)',
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 4,
              maxWidth: 560,
            }}
            className="sm:!grid-cols-[1fr_1fr_auto]"
            >
              <SearchField label="From" value="Makati, Metro Manila"      dotColor="var(--brand)" />
              <SearchField label="To"   value="San Fernando, La Union"    dotColor="var(--ink)" />
              <button style={{
                background: 'var(--brand)',
                color: 'white',
                border: 0,
                borderRadius: 10,
                padding: '14px 18px',
                fontWeight: 600,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                minHeight: 48,
              }}
              className="sm:!py-0 sm:!px-[18px] sm:!text-[13px]"
              >
                Forecast
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M13 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </motion.div>

          {/* Quick popular routes */}
          <motion.div variants={item} style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-5)', marginRight: 4 }}>Popular →</span>
            {POPULAR_ROUTES.map(route => (
              <button key={route} className="chip">{route}</button>
            ))}
          </motion.div>
        </motion.div>

        {/* Right column — preview cards, desktop only */}
        <div style={{ display: 'none' }} className="hero-right-col">
          <HeroPreviewCards />
        </div>
      </div>

      <style>{`
        @media (min-width: 980px) {
          .hero-right-col { display: block !important; }
        }
      `}</style>
    </section>
  );
}

function SearchField({ label, value, dotColor }: { label: string; value: string; dotColor: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 12px',
      borderRadius: 9,
      cursor: 'text',
      minHeight: 48,
    }}
    className="sm:!py-[10px]"
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      <div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-5)', marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{value}</div>
      </div>
    </div>
  );
}
