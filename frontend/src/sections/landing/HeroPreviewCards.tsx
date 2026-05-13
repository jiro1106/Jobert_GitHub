import { useEffect, useRef } from 'react';

/* The layered preview cards shown on the right side of the hero (desktop only) */
export default function HeroPreviewCards() {
  const barsRef = useRef<HTMLDivElement>(null);

  /* Render forecast bar chart by appending child spans */
  useEffect(() => {
    const el = barsRef.current;
    if (!el) return;
    const vals = [82,86,88,84,80,82,78,72,40,28,46,70,84,86,82,80,84,86,82,80,78,82,86,90];
    while (el.firstChild) el.removeChild(el.firstChild);
    vals.forEach(v => {
      const s = document.createElement('span');
      s.style.height = (v / 100 * 36) + 'px';
      s.style.borderRadius = '2px';
      let c = '#14A06A';
      if (v < 40) c = '#D03737';
      else if (v < 65) c = '#C77700';
      s.style.background = c;
      el.appendChild(s);
    });
  }, []);

  return (
    <div className="relative h-[380px]">
      {/* Mini map card */}
      <div
        className="absolute top-0 left-[30px] right-0 bottom-[60px] bg-white border border-[var(--line)] rounded-2xl p-[14px] overflow-hidden"
        style={{ boxShadow: '0 20px 50px -20px rgba(15,23,42,0.18), 0 2px 6px rgba(15,23,42,0.05)' }}
      >
        <div className="w-full h-full rounded-[10px] overflow-hidden bg-[#E5EEF7] relative">
          <MiniMapSVG />
        </div>
      </div>

      {/* Forecast strip card */}
      <div
        className="absolute w-[260px] -bottom-[18px] -right-[18px] bg-white border border-[var(--line)] rounded-2xl p-[14px]"
        style={{ boxShadow: '0 20px 50px -20px rgba(15,23,42,0.18), 0 2px 6px rgba(15,23,42,0.05)' }}
      >
        <div className="flex items-center justify-between mb-[10px]">
          <span className="text-xs font-bold text-[var(--ink)]">Globe · Best fit</span>
          <span className="text-[10px] text-[var(--ink-5)]" style={{ fontFamily: 'var(--mono)' }}>87 / 100</span>
        </div>
        <div
          ref={barsRef}
          className="grid grid-cols-[repeat(24,1fr)] gap-0.5 h-9 items-end mb-2"
        />
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--ink-4)]">Strong coverage</span>
          <span className="font-semibold text-[var(--ink)]" style={{ fontFamily: 'var(--mono)' }}>82% of route</span>
        </div>
      </div>

      {/* Origin pin chip */}
      <div
        className="absolute -top-[14px] -left-[10px] bg-white border border-[var(--line)] rounded-2xl py-[10px] px-3 flex items-center gap-2.5"
        style={{ boxShadow: '0 20px 50px -20px rgba(15,23,42,0.18), 0 2px 6px rgba(15,23,42,0.05)' }}
      >
        <div className="w-7 h-7 rounded-lg bg-[var(--brand)] text-white grid place-items-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div>
          <div
            className="text-[10px] text-[var(--ink-5)] tracking-[0.06em] uppercase"
            style={{ fontFamily: 'var(--mono)' }}
          >Live</div>
          <div className="text-[13px] font-bold">Manila → La Union</div>
        </div>
      </div>
    </div>
  );
}

function MiniMapSVG() {
  return (
    <svg viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="hbg" cx="50%" cy="40%" r="80%">
          <stop offset="0%" stopColor="#E8F0FA"/>
          <stop offset="100%" stopColor="#D2DEEF"/>
        </radialGradient>
        <radialGradient id="hok" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#14A06A" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#14A06A" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="hbad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D03737" stopOpacity="0.45"/>
          <stop offset="100%" stopColor="#D03737" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="400" height="280" fill="url(#hbg)"/>
      <ellipse cx="80" cy="220" rx="120" ry="80" fill="url(#hok)"/>
      <ellipse cx="330" cy="60" rx="100" ry="70" fill="url(#hok)"/>
      <ellipse cx="220" cy="140" rx="70" ry="50" fill="url(#hbad)"/>
      <g stroke="#B7C5DA" fill="none" strokeLinecap="round" opacity="0.7">
        <path d="M 0 230 Q 60 220 110 210" strokeWidth="6"/>
        <path d="M 110 210 Q 160 200 200 180 Q 250 150 290 110 Q 320 80 340 50" strokeWidth="6"/>
        <path d="M 0 230 Q 60 220 110 210" strokeWidth="2.5" stroke="#E8EFF8"/>
        <path d="M 110 210 Q 160 200 200 180 Q 250 150 290 110 Q 320 80 340 50" strokeWidth="2.5" stroke="#E8EFF8"/>
      </g>
      <path d="M 60 230 Q 110 220 160 200 Q 220 175 270 130 Q 310 90 340 50"
            fill="none" stroke="#1F4FFF" strokeWidth="4" strokeLinecap="round"/>
      <path d="M 200 180 Q 230 165 250 150"
            fill="none" stroke="#D03737" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="60" cy="230" r="7" fill="#1F4FFF" stroke="white" strokeWidth="3"/>
      <circle cx="340" cy="50" r="7" fill="#0B1220" stroke="white" strokeWidth="3"/>
      <g>
        <circle cx="225" cy="167" r="11" fill="white" stroke="#D03737" strokeWidth="2"/>
        <text x="225" y="171" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="11" fontWeight="700" fill="#D03737">!</text>
      </g>
      <g fontFamily="Plus Jakarta Sans" fill="#475569" fontWeight="600" fontSize="9">
        <text x="60" y="252">Manila</text>
        <text x="318" y="35">La Union</text>
      </g>
    </svg>
  );
}
