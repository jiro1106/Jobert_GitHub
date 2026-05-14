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
  const towers: { x: number; y: number; r: number; strength: "strong" | "mid" | "weak" }[] = [
    { x: 65,  y: 225, r: 78, strength: "strong" },
    { x: 145, y: 195, r: 68, strength: "strong" },
    { x: 215, y: 160, r: 58, strength: "weak"   },
    { x: 290, y: 100, r: 68, strength: "mid"    },
    { x: 348, y: 55,  r: 78, strength: "strong" },
  ];

  const strengthFill: Record<"strong" | "mid" | "weak", string> = {
    strong: "url(#tw-strong)",
    mid:    "url(#tw-mid)",
    weak:   "url(#tw-weak)",
  };

  return (
    <svg
      viewBox="0 0 400 280"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="hbg" cx="50%" cy="40%" r="80%">
          <stop offset="0%" stopColor="#E8F0FA" />
          <stop offset="100%" stopColor="#D2DEEF" />
        </radialGradient>
        <radialGradient id="tw-strong" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#14A06A" stopOpacity="0.5" />
          <stop offset="55%" stopColor="#14A06A" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#14A06A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="tw-mid" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C77700" stopOpacity="0.42" />
          <stop offset="60%" stopColor="#C77700" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#C77700" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="tw-weak" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D03737" stopOpacity="0.42" />
          <stop offset="60%" stopColor="#D03737" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#D03737" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Map base */}
      <rect width="400" height="280" fill="url(#hbg)" />

      {/* Subtle road network */}
      <g stroke="#B7C5DA" fill="none" strokeLinecap="round" opacity="0.45">
        <path d="M 0 252 Q 100 240 200 215 Q 300 188 400 138" strokeWidth="3" />
        <path d="M 40 30 Q 130 95 210 145 Q 290 200 390 245" strokeWidth="2.5" />
        <path d="M 200 0 L 200 280" strokeWidth="1.2" opacity="0.4" />
        <path d="M 0 140 L 400 140" strokeWidth="1.2" opacity="0.4" />
      </g>

      {/* Tower coverage heatmap — circles overlap to form stronger zones */}
      <g style={{ mixBlendMode: "multiply" }}>
        {towers.map((t, i) => (
          <circle
            key={`cov-${i}`}
            cx={t.x}
            cy={t.y}
            r={t.r}
            fill={strengthFill[t.strength]}
          />
        ))}
      </g>

      {/* Tower range outlines — thin dashed circle for visual context */}
      <g fill="none" stroke="#0B1220" strokeWidth="0.6" strokeDasharray="2 3" opacity="0.22">
        {towers.map((t, i) => (
          <circle key={`range-${i}`} cx={t.x} cy={t.y} r={t.r} />
        ))}
      </g>

      {/* Route — split into healthy and degraded segments */}
      {/* white halo for contrast */}
      <path
        d="M 60 230 Q 110 220 155 205 Q 200 188 230 168 Q 270 138 305 105 Q 325 80 340 50"
        fill="none"
        stroke="white"
        strokeWidth="6.5"
        strokeLinecap="round"
        opacity="0.75"
      />
      {/* healthy: Manila → mid */}
      <path
        d="M 60 230 Q 110 220 155 205 Q 195 190 215 175"
        fill="none"
        stroke="#1F4FFF"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* dead zone segment */}
      <path
        d="M 215 175 Q 230 165 255 150"
        fill="none"
        stroke="#D03737"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="5 3"
      />
      {/* healthy: mid → La Union */}
      <path
        d="M 255 150 Q 285 125 305 105 Q 325 80 340 50"
        fill="none"
        stroke="#1F4FFF"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Cell towers */}
      {towers.map((t, i) => (
        <g key={`tower-${i}`} transform={`translate(${t.x}, ${t.y})`}>
          {/* signal pulse */}
          <circle r="11" fill="none" stroke="#0B1220" strokeWidth="0.7" opacity="0.25" />
          {/* tower icon — mast + base */}
          <line x1="0" y1="-10" x2="0" y2="3" stroke="#0B1220" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M -3.5 3 L 0 -2.5 L 3.5 3 Z" fill="#0B1220" opacity="0.9" />
          {/* signal waves */}
          <path d="M -3 -10 Q -5.5 -12 -3 -14" fill="none" stroke="#1F4FFF" strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />
          <path d="M 3 -10 Q 5.5 -12 3 -14" fill="none" stroke="#1F4FFF" strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />
          {/* top dot */}
          <circle cx="0" cy="-11" r="1.3" fill="#1F4FFF" />
        </g>
      ))}

      {/* Endpoint markers */}
      <circle cx="60" cy="230" r="7" fill="#1F4FFF" stroke="white" strokeWidth="3" />
      <circle cx="340" cy="50" r="7" fill="#0B1220" stroke="white" strokeWidth="3" />

      {/* Dead-zone warning */}
      <g>
        <circle cx="232" cy="166" r="10" fill="white" stroke="#D03737" strokeWidth="1.8" />
        <text
          x="232"
          y="170"
          textAnchor="middle"
          fontFamily="JetBrains Mono"
          fontSize="10.5"
          fontWeight="700"
          fill="#D03737"
        >
          !
        </text>
      </g>

      {/* Labels */}
      <g fontFamily="Plus Jakarta Sans" fill="#475569" fontWeight="600" fontSize="9">
        <text x="60" y="252">Manila</text>
        <text x="318" y="35">La Union</text>
      </g>
    </svg>
  );
}
