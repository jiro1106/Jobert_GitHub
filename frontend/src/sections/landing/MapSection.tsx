import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { RouteForecast } from "../../types/coverage";
import MapComponent, {
  type RouteMetricsFromMap,
} from "../../components/map/MapComponent";
import type { TravelMode } from "../../types/coverage";
import { getRouteForecast } from "../../libs/api";
import { ArrowRight } from "lucide-react";
import type { RouteCoords } from "../../pages/LandingPage";
import { PROVIDERS } from "../../constants/providers";

/* ============================================================
   MapSection — Route Forecast block
   Contains: MapCard + RouteSidebar + ForecastChart
   ============================================================ */
interface MapSectionProps {
  onRouteActive?: (coords: RouteCoords | null) => void;
  onForecastReady?: (forecast: RouteForecast | null) => void;
}

export default function MapSection({
  onRouteActive,
  onForecastReady,
}: MapSectionProps) {
  const [forecast, setForecast] = useState<RouteForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const fromParam = searchParams.get("from") ?? "";
  const toParam = searchParams.get("to") ?? "";
  const [mapRouteMetrics, setMapRouteMetrics] =
    useState<RouteMetricsFromMap | null>(null);
  const forecastAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const nav = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    if (nav?.type === "reload") {
      setSearchParams({}, { replace: true });
    }
  }, []);

  useEffect(() => {
    setMapRouteMetrics(null);
  }, [fromParam, toParam]);

  useEffect(() => {
    return () => {
      forecastAbortRef.current?.abort();
    };
  }, []);

  const hasRoute = Boolean(fromParam || toParam);
  const fromLabel = fromParam || "Pick a start";
  const toLabel = toParam || "Pick a destination";

  const summaryDistanceKm =
    mapRouteMetrics?.distanceKm ?? forecast?.summary?.distanceKm ?? 0;
  const summaryDrivingTimeMin =
    mapRouteMetrics?.durationMin ?? forecast?.summary?.drivingTimeMin ?? 0;

  // Handle route coordinates from map
  const handleRouteCoordinates = async (
    coords: {
      originLat: number;
      originLng: number;
      originName: string;
      destLat: number;
      destLng: number;
      destName: string;
    } | null,
  ) => {
    if (!coords) {
      forecastAbortRef.current?.abort();
      forecastAbortRef.current = null;
      setError(null);
      setForecast(null);
      onForecastReady?.(null);
      onRouteActive?.(null);
      return;
    }

    forecastAbortRef.current?.abort();
    const ac = new AbortController();
    forecastAbortRef.current = ac;

    // Notify parent immediately so scoreboard shows loading state
    onRouteActive?.(coords);

    try {
      setLoading(true);
      setError(null);
      const result = await getRouteForecast(
        coords.originLat,
        coords.originLng,
        coords.originName,
        coords.destLat,
        coords.destLng,
        coords.destName,
        undefined,
        { signal: ac.signal },
      );
      if (ac.signal.aborted) return;
      const strongRaw = result?.summary?.strongSignalPct;
      const strong =
        typeof strongRaw === "number" ? strongRaw : Number(strongRaw);
      const hasValidShape =
        result?.summary != null &&
        result?.recommendation != null &&
        typeof result.recommendation.name === "string" &&
        Array.isArray(result.gaps) &&
        Array.isArray(result.providers) &&
        result.providers.length > 0 &&
        Number.isFinite(strong);

      if (hasValidShape) {
        const normalized: RouteForecast = {
          ...result,
          summary: {
            ...result.summary,
            strongSignalPct: strong,
            deadZoneCount: Number(result.summary.deadZoneCount) || 0,
            distanceKm: Number(result.summary.distanceKm) || 0,
            drivingTimeMin: Number(result.summary.drivingTimeMin) || 0,
          },
        };
        setForecast(normalized);
        onForecastReady?.(normalized);
        setError(null);
      } else {
        console.warn("API shape invalid:", result);
        onForecastReady?.(null);
        setError("Backend returned incomplete data. Select a route to retry.");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("Forecast error:", err);
      onForecastReady?.(null);
      setError(
        err instanceof Error ? err.message : "Failed to fetch forecast.",
      );
    } finally {
      setLoading(false);
    }
  };

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
            Predicted coverage along your route from registered cell towers and
            nearby community reports.
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
          onRouteCoordinates={handleRouteCoordinates}
        />
        <RouteSidebar
          forecast={forecast}
          summaryDistanceKm={summaryDistanceKm}
          summaryDrivingTimeMin={summaryDrivingTimeMin}
          loading={loading}
          error={error}
        />
      </div>

      {forecast && <ForecastChart forecast={forecast} />}
    </section>
  );
}

/* ---- Map Card ---- */
function MapCard({
  initialOriginText,
  initialDestinationText,
  onRouteMetrics,
  onRouteCoordinates,
}: {
  initialOriginText?: string;
  initialDestinationText?: string;
  onRouteMetrics?: (metrics: RouteMetricsFromMap | null) => void;
  onRouteCoordinates?: (
    coords: {
      originLat: number;
      originLng: number;
      originName: string;
      destLat: number;
      destLng: number;
      destName: string;
    } | null,
  ) => void;
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
          onRouteCoordinates={onRouteCoordinates}
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
  loading,
  error,
}: {
  forecast: RouteForecast | null;
  summaryDistanceKm: number;
  summaryDrivingTimeMin: number;
  loading?: boolean;
  error?: string | null;
}) {
  const summary = forecast?.summary;
  const recommendation = forecast?.recommendation;
  const gaps = forecast?.gaps ?? [];

  // Empty state — no route selected yet
  if (!forecast && !loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "48px 24px",
            border: "1.5px dashed var(--line)",
            borderRadius: 16,
            color: "var(--ink-4)",
            textAlign: "center",
            background: "var(--surface)",
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            Select a route to see the forecast
          </div>
          <div style={{ fontSize: 12 }}>
            Use the search bar on the map to pick an origin and destination.
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && !forecast) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {[120, 100, 160].map((h, i) => (
          <div
            key={i}
            className="panel"
            style={{ height: h, animation: "pulse 1.5s ease-in-out infinite" }}
          >
            <div style={{ padding: 18 }}>
              <div
                style={{
                  background: "#EEF1F7",
                  borderRadius: 8,
                  height: 12,
                  width: "50%",
                  marginBottom: 10,
                }}
              />
              <div
                style={{
                  background: "#EEF1F7",
                  borderRadius: 8,
                  height: 28,
                  width: "35%",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {loading && (
        <div
          style={{
            padding: "8px 14px",
            backgroundColor: "#EFF6FF",
            border: "1px solid #BFDBFE",
            borderRadius: 8,
            fontSize: 12,
            color: "#1D4ED8",
          }}
        >
          ⏳ Analysing route signal coverage…
        </div>
      )}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#FEE2E2",
            border: "1px solid #FCA5A5",
            borderRadius: 8,
            fontSize: 13,
            color: "#DC2626",
          }}
        >
          {error}
        </div>
      )}
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
            value={`${summary?.strongSignalPct ?? 0}%`}
            label="Strong signal"
          />
          <TripMetric
            value={String(summary?.deadZoneCount ?? 0)}
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
              {recommendation?.name ?? "Unknown"}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 2 }}>
              {recommendation?.reason}
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
              {recommendation?.score ?? 0}
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

/* ---- Forecast Chart — real data-driven ---- */
function ForecastChart({ forecast }: { forecast: RouteForecast }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{
    svgX: number;
    values: Record<string, number>;
  } | null>(null);

  const W = 900,
    H = 200;
  const MARGIN = 30;

  const origin = forecast.origin.label;
  const destination = forecast.destination.label;
  const axisPoints = [0, 0.2, 0.4, 0.6, 0.8, 1.0].map((t) => ({
    km: Math.round(t * forecast.summary.distanceKm),
  }));

  // Build provider lines from real sparkline data
  const providerConfig = useMemo(() => {
    const DASHES: (string | undefined)[] = [undefined, undefined, "5 4", "3 2"];
    const usableW = W - MARGIN * 2;
    return forecast.providers.map((p, idx) => {
      const meta = PROVIDERS[p.provider as keyof typeof PROVIDERS];
      const sparkline =
        Array.isArray(p.sparklineData) && p.sparklineData.length >= 2
          ? p.sparklineData
          : Array.from({ length: 28 }, () => p.score);
      const n = sparkline.length;
      const pts: [number, number][] = sparkline.map((v, i) => [
        MARGIN + (i / (n - 1)) * usableW,
        H - (v / 100) * H,
      ]);
      return {
        id: p.provider,
        label: meta?.shortName ?? p.name,
        color: meta?.color ?? "#94A3B8",
        pts,
        dash: DASHES[idx],
      };
    });
  }, [forecast.providers]);

  const [activeProviders, setActiveProviders] = useState<Set<string>>(
    () => new Set(providerConfig.map((p) => p.id)),
  );

  // Reset when forecast changes (new route selected)
  useEffect(() => {
    setActiveProviders(new Set(providerConfig.map((p) => p.id)));
  }, [providerConfig]);

  // Build dead zones from real gap data
  const deadZones = useMemo(() => {
    const usableW = W - MARGIN * 2;
    const totalKm = forecast.summary.distanceKm || 1;
    return forecast.gaps.map((gap) => {
      const centerX = MARGIN + (gap.km / totalKm) * usableW;
      const w = gap.level === "dead" ? 50 : 40;
      return {
        x: centerX - w / 2,
        w,
        label: gap.level === "dead" ? "Dead zone" : "Patchy",
        color: gap.level === "dead" ? "#D03737" : "#C77700",
      };
    });
  }, [forecast.gaps, forecast.summary.distanceKm]);

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
          <div className="panel-title">
            Predicted signal strength along route
          </div>
          <div className="h-sub" style={{ fontSize: 12, marginTop: 2 }}>
            Based on live tower data · toggle providers below
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {forecast.providers?.map((p) => {
            const meta = PROVIDERS[p.provider as keyof typeof PROVIDERS];
            if (!meta) return null;
            return (
              <button
                key={p.provider}
                className={`prov-toggle ${activeProviders.has(p.provider) ? "active" : ""}`}
                onClick={() => toggleProvider(p.provider)}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: activeProviders.has(p.provider)
                      ? "white"
                      : meta.color,
                  }}
                />
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div
        style={{
          padding: "14px 14px 18px",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
        className="md:!py-[18px] md:!px-6 md:!overflow-x-visible"
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
              {providerConfig.slice(0, 2).map((p) => (
                <linearGradient
                  key={p.id}
                  id={`fill-${p.id}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={p.color} stopOpacity="0.13" />
                  <stop offset="100%" stopColor={p.color} stopOpacity="0" />
                </linearGradient>
              ))}
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

            {/* Area fills — first two providers only */}
            {providerConfig.slice(0, 2).map((p) =>
              activeProviders.has(p.id) && p.pts.length >= 2 ? (
                <path
                  key={p.id}
                  d={`${smoothPath(p.pts)} L ${W - MARGIN} ${H} L ${MARGIN} ${H} Z`}
                  fill={`url(#fill-${p.id})`}
                />
              ) : null,
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
            gap: 4,
          }}
          className="md:!text-[10px] md:!min-w-0"
        >
          {axisPoints.map((a, i) => (
            <div
              key={a.km}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <b style={{ fontWeight: 600, fontSize: 11, color: "var(--ink)" }}>
                {a.km} km
              </b>
              <span>
                {i === 0
                  ? origin.split(",")[0]
                  : i === axisPoints.length - 1
                    ? destination.split(",")[0]
                    : ""}
              </span>
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
