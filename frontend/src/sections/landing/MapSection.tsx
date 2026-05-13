import { useState } from 'react';
import { MOCK_ROUTE_FORECAST } from '../../types/coverage';
import GoogleMaps from '../../components/map/GoogleMaps';
import type { TravelMode } from '../../types/coverage';

/* ============================================================
   MapSection — Route Forecast block
   Contains: MapCard + RouteSidebar + ForecastChart
   ============================================================ */
export default function MapSection() {
  const forecast = MOCK_ROUTE_FORECAST;

  return (
    <section className="block" data-section="route-forecast">
      <div className="block-head">
        <div>
          <div className="eyebrow">01 · Route forecast</div>
          <h2 className="h-section" style={{ marginTop: 6 }}>
            Manila → San Fernando, La Union
          </h2>
          <div className="h-sub">
            Predicted coverage along your route, based on cell-tower density and 14,210 community readings.
          </div>
        </div>
        <div className="block-head-r">
          <ModeSegment />
          <button className="btn">
            <ShareIcon /> Share
          </button>
          <button className="btn btn-brand">
            <SaveIcon /> Save trip
          </button>
        </div>
      </div>

      {/* Map + sidebar grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 14,
      }}
      className="lg:!grid-cols-[1.55fr_1fr] lg:!gap-[18px]"
      >
        <MapCard />
        <RouteSidebar forecast={forecast} />
      </div>

      <ForecastChart />
    </section>
  );
}

/* ---- Mode segmented control ---- */
function ModeSegment() {
  const [active, setActive] = useState<TravelMode>('drive');
  const modes: { id: TravelMode; label: string }[] = [
    { id: 'drive', label: 'Drive' },
    { id: 'bus',   label: 'Bus' },
    { id: 'walk',  label: 'Walk' },
  ];
  return (
    <div className="seg">
      {modes.map(m => (
        <button
          key={m.id}
          className={active === m.id ? 'active' : ''}
          onClick={() => setActive(m.id)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

/* ---- Map Card ---- */
function MapCard() {
  return (
    <div style={{
      background: 'white',
      border: '1px solid var(--line)',
      borderRadius: 16,
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
    }}>
      <div style={{ position: 'relative', height: 500 }}>
        <GoogleMaps />
      </div>
    </div>
  );
}

/* ---- Route Sidebar ---- */
function RouteSidebar({ forecast }: { forecast: typeof MOCK_ROUTE_FORECAST }) {
  const { summary, recommendation, gaps } = forecast;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Trip summary */}
      <div className="panel">
        <div style={{ padding: '18px 18px 8px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, textTransform: 'uppercase', color: 'var(--ink-5)', letterSpacing: '0.06em', marginBottom: 6 }}>
            Trip overview
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 600, letterSpacing: '-1.2px', color: 'var(--ink)', lineHeight: 1 }}
          className="sm:!text-[30px]"
          >
            {summary.distanceKm}
            <sub style={{ fontSize: 16, color: 'var(--ink-4)', marginLeft: 4 }}>km</sub>
          </div>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          padding: '14px 18px 18px',
          gap: 12,
          borderTop: '1px solid var(--line-soft)',
          marginTop: 14,
        }}>
          <TripMetric value={`${Math.floor(summary.drivingTimeMin/60)}h ${summary.drivingTimeMin % 60}m`} label="Est. drive time" />
          <TripMetric value={`${summary.strongSignalPct}%`} label="Strong signal" />
          <TripMetric value={String(summary.deadZoneCount)} label="Dead zones" color="var(--bad)" />
        </div>
      </div>

      {/* Recommended SIM */}
      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">
            Best SIM for this trip
            <span className="badge">AI pick</span>
          </div>
          <button className="map-iconbtn" title="Why?"><InfoIcon /></button>
        </div>
        <div className="panel-body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'var(--ok-tint)',
            color: 'var(--ok)',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 800,
            fontSize: 18,
            fontFamily: 'var(--mono)',
            border: '1px solid #BDE7CF',
            flexShrink: 0,
          }}>
            {recommendation.name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{recommendation.name}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 2 }}>{recommendation.reason}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 600, color: 'var(--ok)' }}>{recommendation.score}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>/100</div>
          </div>
        </div>
      </div>

      {/* Signal gaps */}
      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">
            <WarningIcon />
            Signal gaps detected
          </div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)' }}>{gaps.length} found</span>
        </div>
        <div>
          {gaps.map((gap, i) => (
            <div key={gap.id} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '12px 18px',
              borderTop: i === 0 ? 0 : '1px solid var(--line-soft)',
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: 'var(--ink-4)', width: 48, flexShrink: 0, paddingTop: 1 }}>
                km {gap.km}
              </div>
              <div className={`gap-icon ${gap.level === 'patchy' ? 'warn' : ''}`}>
                {gap.level === 'dead' ? <XSmallIcon /> : <WarnSmallIcon />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{gap.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 1 }}>{gap.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- Forecast Chart ---- */
function ForecastChart() {
  const [activeProviders, setActiveProviders] = useState(new Set(['globe']));

  function toggleProvider(p: string) {
    setActiveProviders(prev => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  }

  const providers = [
    { id: 'globe', label: 'Globe', color: '#1F4FFF' },
    { id: 'smart', label: 'Smart', color: '#E11D48' },
    { id: 'dito',  label: 'DITO',  color: '#4F46E5' },
  ];

  const axis = [
    { km: '0 km',   place: 'Manila' },
    { km: '50 km',  place: 'Tarlac' },
    { km: '78 km',  place: 'Gap', highlight: true },
    { km: '120 km', place: 'Dagupan' },
    { km: '160 km', place: 'Aringay' },
    { km: '214 km', place: 'La Union', bold: true },
  ];

  return (
    <div style={{ marginTop: 18, background: 'white', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
      className="sm:!flex-row sm:!items-center sm:!p-[14px_18px]"
      >
        <div>
          <div className="panel-title">Predicted signal strength along route</div>
          <div className="h-sub" style={{ fontSize: 12, marginTop: 2 }}>Solid line = ML forecast · dotted = community-verified</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {providers.map(p => (
            <button
              key={p.id}
              className={`prov-toggle ${activeProviders.has(p.id) ? 'active' : ''}`}
              onClick={() => toggleProvider(p.id)}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: activeProviders.has(p.id) ? 'white' : p.color }} />
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: '14px 14px 18px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}
      className="md:!py-[18px] md:!px-6 md:!overflow-x-visible"
      >
        <svg viewBox="0 0 900 200" preserveAspectRatio="none" style={{ width: '100%', minWidth: 520, height: 180, display: 'block' }}
        className="md:!min-w-0 md:!h-[200px]"
        xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="fillGlobe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1F4FFF" stopOpacity="0.18"/>
              <stop offset="100%" stopColor="#1F4FFF" stopOpacity="0"/>
            </linearGradient>
          </defs>
          {/* Grid */}
          <g stroke="#EEF1F7" strokeWidth="1">
            {[40,80,120,160].map(y => <line key={y} x1="0" y1={y} x2="900" y2={y}/>)}
          </g>
          {/* Labels */}
          <g fontFamily="JetBrains Mono" fontSize="9" fill="#94A3B8">
            {[['100',36],['75',76],['50',116],['25',156]].map(([v,y]) => (
              <text key={v} x="6" y={y}>{v}</text>
            ))}
          </g>
          {/* Dead zone bands */}
          <rect x="305" y="0" width="50"  height="200" fill="#D03737" opacity="0.06"/>
          <rect x="555" y="0" width="40"  height="200" fill="#C77700" opacity="0.06"/>
          <rect x="755" y="0" width="32"  height="200" fill="#C77700" opacity="0.06"/>
          {/* Smart line */}
          {activeProviders.has('smart') && (
            <path d="M 30 60 L 90 50 L 150 65 L 210 80 L 270 95 L 330 140 L 380 100 L 440 90 L 500 75 L 560 130 L 610 110 L 670 90 L 730 80 L 780 105 L 830 85 L 870 75"
                  fill="none" stroke="#E11D48" strokeWidth="2" opacity="0.55" strokeLinejoin="round" strokeLinecap="round"/>
          )}
          {/* DITO line */}
          {activeProviders.has('dito') && (
            <path d="M 30 90 L 90 95 L 150 110 L 210 130 L 270 145 L 330 175 L 380 150 L 440 140 L 500 135 L 560 165 L 610 150 L 670 130 L 730 125 L 780 145 L 830 130 L 870 120"
                  fill="none" stroke="#4F46E5" strokeWidth="2" opacity="0.45" strokeDasharray="4 4" strokeLinejoin="round"/>
          )}
          {/* Globe fill + line */}
          {activeProviders.has('globe') && (
            <>
              <path d="M 30 45 L 90 40 L 150 50 L 210 60 L 270 70 L 330 130 L 380 75 L 440 60 L 500 50 L 560 110 L 610 80 L 670 60 L 730 55 L 780 90 L 830 60 L 870 50 L 870 200 L 30 200 Z"
                    fill="url(#fillGlobe)"/>
              <path d="M 30 45 L 90 40 L 150 50 L 210 60 L 270 70 L 330 130 L 380 75 L 440 60 L 500 50 L 560 110 L 610 80 L 670 60 L 730 55 L 780 90 L 830 60 L 870 50"
                    fill="none" stroke="#1F4FFF" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round"/>
              <line x1="380" y1="0" x2="380" y2="200" stroke="#0B1220" strokeWidth="1" strokeDasharray="3 3" opacity="0.4"/>
              <circle cx="380" cy="75" r="5" fill="#1F4FFF" stroke="white" strokeWidth="2"/>
              <text x="380" y="20" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fill="#475569" fontWeight="600">82 / 100</text>
            </>
          )}
        </svg>

        {/* Axis labels */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          fontFamily: 'var(--mono)',
          fontSize: 9,
          color: 'var(--ink-5)',
          minWidth: 520,
          gap: 4,
        }}
        className="md:!text-[10px] md:!min-w-0"
        >
          {axis.map(a => (
            <div key={a.km} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <b style={{
                color: a.highlight ? '#D03737' : 'var(--ink)',
                fontWeight: 600,
                fontSize: 11,
              }}>
                {a.km}
              </b>
              <span>{a.place}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- Small helper components ---- */
function TripMetric({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 600, color: color ?? 'var(--ink)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function RouteStop({ label, dotColor }: { label: string; dotColor: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 600 }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: dotColor }} />
      {label}
    </span>
  );
}

function RouteArrow() {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: 14, height: 1, background: 'var(--ink-5)' }}>
      <span style={{ position: 'absolute', right: -1, top: -3, width: 0, height: 0, borderLeft: '5px solid var(--ink-5)', borderTop: '3.5px solid transparent', borderBottom: '3.5px solid transparent' }} />
    </span>
  );
}

/* Icon helpers */
function ShareIcon()      { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>; }
function SaveIcon()       { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1.5 14a2 2 0 0 1-2 2H8.5a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>; }
function PlusIcon()       { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function RerouteIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>; }
function FullscreenIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>; }
function InfoIcon()       { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>; }
function WarningIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function XSmallIcon()     { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function WarnSmallIcon()  { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/><circle cx="12" cy="12" r="10"/></svg>; }

