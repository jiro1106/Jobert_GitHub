import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MOCK_ROUTE_FORECAST } from "../../types/coverage";
import MapComponent, {
  type RouteMetricsFromMap,
} from "../../components/map/MapComponent";
import { ArrowRight } from "lucide-react";
import { PROVIDERS } from "../../constants/providers";

/* ============================================================
   MapSection — Route Forecast block
   Contains: MapCard + RouteSidebar + ForecastChart
   ============================================================ */
export default function MapSection() {
  const forecast = MOCK_ROUTE_FORECAST;
  const [searchParams] = useSearchParams();
  const fromParam = searchParams.get("from") ?? "";
  const toParam = searchParams.get("to") ?? "";
  const [mapRouteMetrics, setMapRouteMetrics] =
    useState<RouteMetricsFromMap | null>(null);

  useEffect(() => {
    setMapRouteMetrics(null);
  }, [fromParam, toParam]);

  const hasRoute = Boolean(fromParam || toParam);
  const fromLabel = fromParam || "Pick a start";
  const toLabel = toParam || "Pick a destination";

  const summaryDistanceKm =
    mapRouteMetrics?.distanceKm ?? forecast.summary.distanceKm;
  const summaryDrivingTimeMin =
    mapRouteMetrics?.durationMin ?? forecast.summary.drivingTimeMin;

  return (
    <section id="coverage-map" className="block" data-section="route-forecast">
      <div className="block-head">
        <div>
          <div className="eyebrow">01 · Route forecast</div>
          <h2 className="text-[30px] font-bold tracking-[-0.6px] leading-[1.2]">
            {hasRoute ? (
              <div className="flex items-center gap-2">
                <span>{fromLabel}</span>
                <ArrowRight strokeWidth={2} />
                <span>{toLabel}</span>
              </div>
            ) : (
              "Choose a route to preview coverage"
            )}
          </h2>
          <div className="h-sub">
            Predicted coverage along your route, based on cell-tower density and
            14,210 community readings.
          </div>
        </div>
      </div>

      {/* Map + sidebar grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 14,
        }}
        className="lg:!grid-cols-[1.55fr_1fr] lg:!gap-[18px]"
      >
        <MapCard
          initialOriginText={fromParam || undefined}
          initialDestinationText={toParam || undefined}
          onRouteMetrics={setMapRouteMetrics}
        />
        <RouteSidebar
          forecast={forecast}
          summaryDistanceKm={summaryDistanceKm}
          summaryDrivingTimeMin={summaryDrivingTimeMin}
        />
      </div>

      <ForecastChart />
    </section>
  );
}

/* ---- Map Card ---- */
function MapCard({
  initialOriginText,
  initialDestinationText,
  onRouteMetrics,
}: {
  initialOriginText?: string;
  initialDestinationText?: string;
  onRouteMetrics?: (metrics: RouteMetricsFromMap | null) => void;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid var(--line)",
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
      }}
    >
      <div style={{ position: "relative", height: 500 }}>
        <MapComponent
          initialOriginText={initialOriginText}
          initialDestinationText={initialDestinationText}
          onRouteMetrics={onRouteMetrics}
        />
      </div>
    </div>
  );
}

/* ---- Route Sidebar ---- */
function RouteSidebar({
  forecast,
  summaryDistanceKm,
  summaryDrivingTimeMin,
}: {
  forecast: typeof MOCK_ROUTE_FORECAST;
  summaryDistanceKm: number;
  summaryDrivingTimeMin: number;
}) {
  const { summary, recommendation, gaps } = forecast;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Trip summary */}
      <div className="panel">
        <div style={{ padding: "18px 18px 8px" }}>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 10.5,
              textTransform: "uppercase",
              color: "var(--ink-5)",
              letterSpacing: "0.06em",
              marginBottom: 6,
            }}
          >
            Trip overview
          </div>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: "-1.2px",
              color: "var(--ink)",
              lineHeight: 1,
            }}
            className="sm:text-[30px]!"
          >
            {summaryDistanceKm.toFixed(1)}
            <sub style={{ fontSize: 16, color: "var(--ink-4)", marginLeft: 4 }}>
              km
            </sub>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            padding: "14px 18px 18px",
            gap: 12,
            borderTop: "1px solid var(--line-soft)",
            marginTop: 14,
          }}
        >
          <TripMetric
            value={`${Math.floor(summaryDrivingTimeMin / 60)}h ${summaryDrivingTimeMin % 60}m`}
            label="Est. drive time"
          />
          <TripMetric
            value={`${summary.strongSignalPct}%`}
            label="Strong signal"
          />
          <TripMetric
            value={String(summary.deadZoneCount)}
            label="Dead zones"
            color="var(--bad)"
          />
        </div>
      </div>

      {/* Recommended SIM */}
      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">
            Best SIM for this trip
            <span className="badge">AI pick</span>
          </div>
          <button className="map-iconbtn" title="Why?">
            <InfoIcon />
          </button>
        </div>
        <div
          className="panel-body"
          style={{ display: "flex", alignItems: "center", gap: 14 }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <img
              src={PROVIDERS[recommendation.provider]?.logo}
              alt={recommendation.name}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              {recommendation.name}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 2 }}>
              {recommendation.reason}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 22,
                fontWeight: 600,
                color: "var(--ok)",
              }}
            >
              {recommendation.score}
            </div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10,
                color: "var(--ink-5)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              /100
            </div>
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
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              color: "var(--ink-4)",
            }}
          >
            {gaps.length} found
          </span>
        </div>
        <div>
          {gaps.map((gap, i) => (
            <div
              key={gap.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "12px 18px",
                borderTop: i === 0 ? 0 : "1px solid var(--line-soft)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--ink-4)",
                  width: 48,
                  flexShrink: 0,
                  paddingTop: 1,
                }}
              >
                km {gap.km}
              </div>
              <div
                className={`gap-icon ${gap.level === "patchy" ? "warn" : ""}`}
              >
                {gap.level === "dead" ? <XSmallIcon /> : <WarnSmallIcon />}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}
                >
                  {gap.name}
                </div>
                <div
                  style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 1 }}
                >
                  {gap.description}
                </div>
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
  const [activeProviders, setActiveProviders] = useState(new Set(["globe"]));
  const [hover, setHover] = useState<{
    svgX: number;
    values: Record<string, number>;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 900,
    H = 200;

  const globePts: [number, number][] = [
    [30, 45],
    [90, 40],
    [150, 50],
    [210, 60],
    [270, 70],
    [330, 130],
    [380, 75],
    [440, 60],
    [500, 50],
    [560, 110],
    [610, 80],
    [670, 60],
    [730, 55],
    [780, 90],
    [830, 60],
    [870, 50],
  ];
  const smartPts: [number, number][] = [
    [30, 60],
    [90, 50],
    [150, 65],
    [210, 80],
    [270, 95],
    [330, 140],
    [380, 100],
    [440, 90],
    [500, 75],
    [560, 130],
    [610, 110],
    [670, 90],
    [730, 80],
    [780, 105],
    [830, 85],
    [870, 75],
  ];
  const ditoPts: [number, number][] = [
    [30, 90],
    [90, 95],
    [150, 110],
    [210, 130],
    [270, 145],
    [330, 175],
    [380, 150],
    [440, 140],
    [500, 135],
    [560, 165],
    [610, 150],
    [670, 130],
    [730, 125],
    [780, 145],
    [830, 130],
    [870, 120],
  ];

  const providerConfig = [
    {
      id: "globe" as const,
      label: PROVIDERS.globe.shortName,
      color: PROVIDERS.globe.color,
      pts: globePts,
      dash: undefined as string | undefined,
    },
    {
      id: "smart" as const,
      label: PROVIDERS.smart.shortName,
      color: PROVIDERS.smart.color,
      pts: smartPts,
      dash: undefined as string | undefined,
    },
    {
      id: "dito" as const,
      label: PROVIDERS.dito.shortName,
      color: PROVIDERS.dito.color,
      pts: ditoPts,
      dash: "5 4" as string | undefined,
    },
  ];

  const deadZones = [
    { x: 305, w: 50, label: "Dead zone", color: "#D03737" },
    { x: 555, w: 40, label: "Patchy", color: "#C77700" },
    { x: 755, w: 32, label: "Patchy", color: "#C77700" },
  ];

  const axis: { km: string; place: string; highlight?: boolean }[] = [
    { km: "0 km", place: "Manila" },
    { km: "50 km", place: "Tarlac" },
    { km: "78 km", place: "Gap", highlight: true },
    { km: "120 km", place: "Dagupan" },
    { km: "160 km", place: "Aringay" },
    { km: "214 km", place: "La Union" },
  ];

  function smoothPath(pts: [number, number][], tension = 0.35): string {
    const d: string[] = [`M ${pts[0][0]} ${pts[0][1]}`];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const cp1x = p1[0] + (p2[0] - p0[0]) * tension;
      const cp1y = p1[1] + (p2[1] - p0[1]) * tension;
      const cp2x = p2[0] - (p3[0] - p1[0]) * tension;
      const cp2y = p2[1] - (p3[1] - p1[1]) * tension;
      d.push(
        `C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2[0]} ${p2[1]}`,
      );
    }
    return d.join(" ");
  }

  function getY(pts: [number, number][], x: number): number {
    for (let i = 0; i < pts.length - 1; i++) {
      if (x >= pts[i][0] && x <= pts[i + 1][0]) {
        const t = (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
        return pts[i][1] + t * (pts[i + 1][1] - pts[i][1]);
      }
    }
    return pts[pts.length - 1][1];
  }

  function yToSignal(y: number) {
    return Math.max(0, Math.min(100, Math.round(((H - y) / H) * 100)));
  }

  function signalLabel(pct: number): { label: string; color: string } {
    if (pct >= 65) return { label: "Strong", color: "#16A34A" };
    if (pct >= 35) return { label: "Moderate", color: "#D97706" };
    return { label: "Weak", color: "#DC2626" };
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    if (svgX < 30 || svgX > 870) {
      setHover(null);
      return;
    }
    const values: Record<string, number> = {};
    for (const p of providerConfig) {
      if (activeProviders.has(p.id))
        values[p.id] = yToSignal(getY(p.pts, svgX));
    }
    setHover({ svgX, values });
  }

  function toggleProvider(id: string) {
    setActiveProviders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div
      style={{
        marginTop: 18,
        background: "white",
        border: "1px solid var(--line)",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <div className="panel-title">Signal strength along route</div>
          <div style={{ fontSize: 11, color: "var(--ink-5)", marginTop: 3 }}>
            Hover to inspect · solid = ML forecast · dashed = community data
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {providerConfig.map((p) => {
            const on = activeProviders.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleProvider(p.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 11px",
                  borderRadius: 20,
                  border: `1.5px solid ${on ? p.color : "var(--line)"}`,
                  background: on ? p.color : "transparent",
                  color: on ? "white" : "var(--ink-4)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <svg
                  width="18"
                  height="8"
                  viewBox="0 0 18 8"
                  style={{ flexShrink: 0 }}
                >
                  <line
                    x1="0"
                    y1="4"
                    x2="18"
                    y2="4"
                    stroke={on ? "rgba(255,255,255,0.9)" : p.color}
                    strokeWidth="2.5"
                    strokeDasharray={p.dash}
                    strokeLinecap="round"
                  />
                </svg>
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div
        style={{
          padding: "18px 18px 0",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div style={{ position: "relative", minWidth: 520 }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            style={{
              width: "100%",
              height: 220,
              display: "block",
              cursor: "crosshair",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHover(null)}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="fillGlobe" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1F4FFF" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#1F4FFF" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="fillSmart" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E11D48" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#E11D48" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Signal quality zone bands */}
            <rect
              x="0"
              y="0"
              width={W}
              height="70"
              fill="#22C55E"
              opacity="0.04"
            />
            <rect
              x="0"
              y="70"
              width={W}
              height="60"
              fill="#F59E0B"
              opacity="0.04"
            />
            <rect
              x="0"
              y="130"
              width={W}
              height="70"
              fill="#EF4444"
              opacity="0.04"
            />
            <line
              x1="0"
              y1="70"
              x2={W}
              y2="70"
              stroke="#22C55E"
              strokeWidth="0.5"
              strokeDasharray="3 4"
              opacity="0.35"
            />
            <line
              x1="0"
              y1="130"
              x2={W}
              y2="130"
              stroke="#EF4444"
              strokeWidth="0.5"
              strokeDasharray="3 4"
              opacity="0.35"
            />

            {/* Zone labels */}
            <text
              x={W - 6}
              y="36"
              textAnchor="end"
              fontFamily="JetBrains Mono"
              fontSize="8"
              fill="#16A34A"
              opacity="0.6"
              fontWeight="600"
            >
              STRONG
            </text>
            <text
              x={W - 6}
              y="103"
              textAnchor="end"
              fontFamily="JetBrains Mono"
              fontSize="8"
              fill="#D97706"
              opacity="0.6"
              fontWeight="600"
            >
              MODERATE
            </text>
            <text
              x={W - 6}
              y="168"
              textAnchor="end"
              fontFamily="JetBrains Mono"
              fontSize="8"
              fill="#DC2626"
              opacity="0.6"
              fontWeight="600"
            >
              WEAK
            </text>

            {/* Grid */}
            <g stroke="#EEF1F7" strokeWidth="0.75">
              {[40, 80, 120, 160].map((y) => (
                <line key={y} x1="0" y1={y} x2={W} y2={y} />
              ))}
            </g>

            {/* Y-axis labels */}
            <g fontFamily="JetBrains Mono" fontSize="9" fill="#94A3B8">
              {(
                [
                  ["100", 14],
                  ["75", 54],
                  ["50", 104],
                  ["25", 154],
                ] as [string, number][]
              ).map(([v, y]) => (
                <text key={v} x="6" y={y}>
                  {v}
                </text>
              ))}
            </g>

            {/* Dead zone bands */}
            {deadZones.map((dz, i) => (
              <g key={i}>
                <rect
                  x={dz.x}
                  y="0"
                  width={dz.w}
                  height={H}
                  fill={dz.color}
                  opacity="0.08"
                />
                <rect
                  x={dz.x}
                  y="0"
                  width={dz.w}
                  height="3"
                  fill={dz.color}
                  opacity="0.5"
                />
                <text
                  x={dz.x + dz.w / 2}
                  y="18"
                  textAnchor="middle"
                  fontFamily="JetBrains Mono"
                  fontSize="7.5"
                  fill={dz.color}
                  fontWeight="700"
                  opacity="0.75"
                >
                  {dz.label.toUpperCase()}
                </text>
              </g>
            ))}

            {/* Area fills */}
            {activeProviders.has("globe") && (
              <path
                d={`${smoothPath(globePts)} L 870 ${H} L 30 ${H} Z`}
                fill="url(#fillGlobe)"
              />
            )}
            {activeProviders.has("smart") && (
              <path
                d={`${smoothPath(smartPts)} L 870 ${H} L 30 ${H} Z`}
                fill="url(#fillSmart)"
              />
            )}

            {/* Provider lines */}
            {providerConfig.map((p) =>
              activeProviders.has(p.id) ? (
                <path
                  key={p.id}
                  d={smoothPath(p.pts)}
                  fill="none"
                  stroke={p.color}
                  strokeWidth={p.id === "globe" ? 2.8 : 2}
                  strokeDasharray={p.dash}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  opacity={p.id === "dito" ? 0.5 : 0.85}
                />
              ) : null,
            )}

            {/* Hover tracker */}
            {hover && (
              <>
                <line
                  x1={hover.svgX}
                  y1="0"
                  x2={hover.svgX}
                  y2={H}
                  stroke="var(--ink)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.25"
                />
                {providerConfig.map((p) =>
                  activeProviders.has(p.id) ? (
                    <circle
                      key={p.id}
                      cx={hover.svgX}
                      cy={H - (hover.values[p.id] / 100) * H}
                      r="4"
                      fill={p.color}
                      stroke="white"
                      strokeWidth="2"
                    />
                  ) : null,
                )}
              </>
            )}
          </svg>

          {/* Hover tooltip */}
          {hover && Object.keys(hover.values).length > 0 && (
            <div
              style={{
                position: "absolute",
                top: 10,
                left: `${(hover.svgX / W) * 100}%`,
                transform:
                  hover.svgX > W * 0.72
                    ? "translateX(-105%)"
                    : hover.svgX < W * 0.25
                      ? "translateX(5%)"
                      : "translateX(-50%)",
                background: "rgba(11,18,32,0.92)",
                backdropFilter: "blur(6px)",
                color: "white",
                borderRadius: 8,
                padding: "7px 11px",
                fontSize: 11,
                fontFamily: "var(--mono)",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                zIndex: 10,
                boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
              }}
            >
              {providerConfig
                .filter((p) => activeProviders.has(p.id))
                .map((p) => {
                  const sig = hover.values[p.id];
                  const { label, color } = signalLabel(sig);
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        padding: "1px 0",
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: p.color,
                          display: "inline-block",
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{ color: "rgba(255,255,255,0.6)", minWidth: 40 }}
                      >
                        {p.label}
                      </span>
                      <span style={{ fontWeight: 700 }}>{sig}%</span>
                      <span style={{ color, fontSize: 10 }}>{label}</span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* X-axis labels */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
            paddingBottom: 16,
            fontFamily: "var(--mono)",
            fontSize: 10,
            color: "var(--ink-5)",
            minWidth: 520,
          }}
        >
          {axis.map((a) => (
            <div
              key={a.km}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <b
                style={{
                  color: a.highlight ? "#D03737" : "var(--ink)",
                  fontWeight: 600,
                  fontSize: 11,
                }}
              >
                {a.km}
              </b>
              <span>{a.place}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Signal zone legend */}
      <div
        style={{
          padding: "10px 18px 12px",
          borderTop: "1px solid var(--line-soft)",
          display: "flex",
          gap: 14,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: "var(--ink-5)",
            fontFamily: "var(--mono)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Signal zones
        </span>
        {[
          { color: "#16A34A", label: "Strong ≥65%", dot: true },
          { color: "#D97706", label: "Moderate 35–65%", dot: true },
          { color: "#DC2626", label: "Weak <35%", dot: true },
          { color: "#D03737", label: "Dead zone", dot: false },
        ].map(({ color, label, dot }) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              color: "var(--ink-4)",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: dot ? "50%" : 2,
                background: color,
                opacity: 0.75,
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Small helper components ---- */
function TripMetric({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 18,
          fontWeight: 600,
          color: color ?? "var(--ink)",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

/* Icon helpers */
function InfoIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
function WarningIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function XSmallIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function WarnSmallIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
