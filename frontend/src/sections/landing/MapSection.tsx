import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { RouteForecast } from "../../types/coverage";
import MapComponent, {
  type RouteMetricsFromMap,
} from "../../components/map/MapComponent";
import type { TravelMode } from "../../types/coverage";
import { getRouteForecast } from "../../lib/api";
import { ArrowRight } from "lucide-react";
import type { RouteCoords } from "../../pages/LandingPage";

/* ============================================================
   MapSection — Route Forecast block
   Contains: MapCard + RouteSidebar + ForecastChart
   ============================================================ */
interface MapSectionProps {
  onRouteActive?: (coords: RouteCoords | null) => void;
}

export default function MapSection({ onRouteActive }: MapSectionProps) {
  const [forecast, setForecast] = useState<RouteForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const fromParam = searchParams.get("from") ?? "";
  const toParam = searchParams.get("to") ?? "";
  const [mapRouteMetrics, setMapRouteMetrics] =
    useState<RouteMetricsFromMap | null>(null);
  const forecastAbortRef = useRef<AbortController | null>(null);

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
  const handleRouteCoordinates = async (coords: {originLat: number; originLng: number; originName: string; destLat: number; destLng: number; destName: string} | null) => {
    if (!coords) {
      forecastAbortRef.current?.abort();
      forecastAbortRef.current = null;
      setError(null);
      setForecast(null);
      onRouteActive?.(null);
      return;
    }

    forecastAbortRef.current?.abort();
    const ac = new AbortController();
    forecastAbortRef.current = ac;

    // Immediately notify parent so scoreboard starts loading too
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
        { signal: ac.signal }
      );
      if (ac.signal.aborted) return;
      const strongRaw = result?.summary?.strongSignalPct;
      const strong = typeof strongRaw === "number" ? strongRaw : Number(strongRaw);
      const hasValidShape =
        result?.summary != null &&
        result?.recommendation != null &&
        typeof result.recommendation.name === "string" &&
        Array.isArray(result.gaps) &&
        Array.isArray(result.providers) &&
        result.providers.length > 0 &&
        Number.isFinite(strong);

      if (hasValidShape) {
        setForecast({
          ...result,
          summary: {
            ...result.summary,
            strongSignalPct: strong,
            deadZoneCount: Number(result.summary.deadZoneCount) || 0,
            distanceKm: Number(result.summary.distanceKm) || 0,
            drivingTimeMin: Number(result.summary.drivingTimeMin) || 0,
          },
        });
        setError(null);
      } else {
        console.warn("API shape invalid:", result);
        setError("Backend returned incomplete data. Select a route to retry.");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("Forecast error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch forecast.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="coverage-map" className="block" data-section="route-forecast">
      <div className="block-head">
        <div>
          <div className="eyebrow">01 · Route forecast</div>
          <h2 className="h-section flex-row" style={{ marginTop: 6 }}>
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

/* ---- Mode segmented control ---- */
function ModeSegment() {
  const [active, setActive] = useState<TravelMode>("drive");
  const modes: { id: TravelMode; label: string }[] = [
    { id: "drive", label: "Drive" },
    { id: "bus", label: "Bus" },
    { id: "walk", label: "Walk" },
  ];
  return (
    <div className="seg">
      {modes.map((m) => (
        <button
          key={m.id}
          className={active === m.id ? "active" : ""}
          onClick={() => setActive(m.id)}
        >
          {m.label}
        </button>
      ))}
    </div>
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
  onRouteCoordinates?: (coords: {originLat: number; originLng: number; originName: string; destLat: number; destLng: number; destName: string} | null) => void;
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
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Select a route to see the forecast</div>
          <div style={{ fontSize: 12 }}>Use the search bar on the map to pick an origin and destination.</div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && !forecast) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {[120, 100, 160].map((h, i) => (
          <div key={i} className="panel" style={{ height: h, animation: "pulse 1.5s ease-in-out infinite" }}>
            <div style={{ padding: 18 }}>
              <div style={{ background: "#EEF1F7", borderRadius: 8, height: 12, width: "50%", marginBottom: 10 }} />
              <div style={{ background: "#EEF1F7", borderRadius: 8, height: 28, width: "35%" }} />
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
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "var(--ok-tint)",
              color: "var(--ok)",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: 18,
              fontFamily: "var(--mono)",
              border: "1px solid #BDE7CF",
              flexShrink: 0,
            }}
          >
            {recommendation?.name?.[0] ?? "?"}
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
  const [activeProviders, setActiveProviders] = useState(new Set(["globe"]));

  function toggleProvider(p: string) {
    setActiveProviders((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  const CHART_W = 900;
  const CHART_H = 200;
  const PAD_LEFT = 24;
  const PAD_RIGHT = 10;
  const PAD_TOP = 10;
  const PAD_BOT = 10;
  const innerW = CHART_W - PAD_LEFT - PAD_RIGHT;
  const innerH = CHART_H - PAD_TOP - PAD_BOT;

  const providerMeta: Record<string, { color: string; label: string; dash?: string }> = {
    globe: { color: "#1F4FFF", label: "Globe" },
    smart: { color: "#E11D48", label: "Smart" },
    dito:  { color: "#4F46E5", label: "DITO", dash: "4 4" },
  };

  // Build polyline path from sparkline data (0-100 → SVG Y coords)
  function sparkToPath(data: number[]): string {
    if (!data?.length) return "";
    const n = data.length;
    return data
      .map((v, i) => {
        const x = PAD_LEFT + (i / (n - 1)) * innerW;
        const y = PAD_TOP + innerH - (Math.max(0, Math.min(100, v)) / 100) * innerH;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }

  // Build fill path (close to bottom)
  function sparkToFill(data: number[]): string {
    if (!data?.length) return "";
    const n = data.length;
    const line = data
      .map((v, i) => {
        const x = PAD_LEFT + (i / (n - 1)) * innerW;
        const y = PAD_TOP + innerH - (Math.max(0, Math.min(100, v)) / 100) * innerH;
        return `${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" L ");
    const lastX = (PAD_LEFT + innerW).toFixed(1);
    const firstX = PAD_LEFT.toFixed(1);
    const botY = (PAD_TOP + innerH).toFixed(1);
    return `M ${line.split(" L ")[0]} L ${line.split(" L ").slice(1).join(" L ")} L ${lastX} ${botY} L ${firstX} ${botY} Z`;
  }

  // Axis labels based on route distance
  const distKm = forecast.summary?.distanceKm ?? 0;
  const axisPoints = distKm > 0
    ? [0, 0.25, 0.5, 0.75, 1].map(f => ({
        km: Math.round(f * distKm),
        x: PAD_LEFT + f * innerW,
      }))
    : [];

  const origin = forecast.origin?.label ?? "Origin";
  const destination = forecast.destination?.label ?? "Destination";

  const gridYs = [25, 50, 75];

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
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
        className="sm:!flex-row sm:!items-center sm:!p-[14px_18px]"
      >
        <div>
          <div className="panel-title">Predicted signal strength along route</div>
          <div className="h-sub" style={{ fontSize: 12, marginTop: 2 }}>
            Based on live tower data · toggle providers below
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {forecast.providers?.map((p) => {
            const meta = providerMeta[p.provider];
            if (!meta) return null;
            return (
              <button
                key={p.provider}
                className={`prov-toggle ${activeProviders.has(p.provider) ? "active" : ""}`}
                onClick={() => toggleProvider(p.provider)}
              >
                <span
                  style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: activeProviders.has(p.provider) ? "white" : meta.color,
                  }}
                />
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{ padding: "14px 14px 18px", overflowX: "auto", WebkitOverflowScrolling: "touch" }}
        className="md:!py-[18px] md:!px-6 md:!overflow-x-visible"
      >
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          preserveAspectRatio="none"
          style={{ width: "100%", minWidth: 520, height: 180, display: "block" }}
          className="md:!min-w-0 md:!h-[200px]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {forecast.providers?.map((p) => (
              <linearGradient key={p.provider} id={`fill-${p.provider}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={providerMeta[p.provider]?.color ?? "#999"} stopOpacity="0.16" />
                <stop offset="100%" stopColor={providerMeta[p.provider]?.color ?? "#999"} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {/* Grid lines */}
          <g stroke="#EEF1F7" strokeWidth="1">
            {gridYs.map((pct) => {
              const y = PAD_TOP + innerH - (pct / 100) * innerH;
              return <line key={pct} x1={PAD_LEFT} y1={y} x2={CHART_W - PAD_RIGHT} y2={y} />;
            })}
          </g>

          {/* Y-axis labels */}
          <g fontFamily="JetBrains Mono" fontSize="9" fill="#94A3B8">
            {gridYs.map((pct) => {
              const y = PAD_TOP + innerH - (pct / 100) * innerH + 3;
              return <text key={pct} x="2" y={y}>{pct}</text>;
            })}
          </g>

          {/* Provider lines */}
          {forecast.providers?.map((p) => {
            if (!activeProviders.has(p.provider)) return null;
            const meta = providerMeta[p.provider];
            if (!meta || !p.sparklineData?.length) return null;
            const linePath = sparkToPath(p.sparklineData);
            const fillPath = sparkToFill(p.sparklineData);
            const isBest = p.provider === forecast.providers[0]?.provider;
            return (
              <g key={p.provider}>
                {isBest && (
                  <path d={fillPath} fill={`url(#fill-${p.provider})`} />
                )}
                <path
                  d={linePath}
                  fill="none"
                  stroke={meta.color}
                  strokeWidth={isBest ? "2.8" : "2"}
                  strokeDasharray={meta.dash}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  opacity={isBest ? 1 : 0.6}
                />
              </g>
            );
          })}
        </svg>

        {/* X-axis */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 6,
            fontFamily: "var(--mono)",
            fontSize: 9,
            color: "var(--ink-5)",
            minWidth: 520,
            gap: 4,
          }}
          className="md:!text-[10px] md:!min-w-0"
        >
          {axisPoints.map((a, i) => (
            <div key={a.km} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <b style={{ fontWeight: 600, fontSize: 11, color: "var(--ink)" }}>{a.km} km</b>
              <span>{i === 0 ? origin.split(",")[0] : i === axisPoints.length - 1 ? destination.split(",")[0] : ""}</span>
            </div>
          ))}
        </div>
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

function RouteStop({ label, dotColor }: { label: string; dotColor: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: dotColor,
        }}
      />
      {label}
    </span>
  );
}

function RouteArrow() {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        width: 14,
        height: 1,
        background: "var(--ink-5)",
      }}
    >
      <span
        style={{
          position: "absolute",
          right: -1,
          top: -3,
          width: 0,
          height: 0,
          borderLeft: "5px solid var(--ink-5)",
          borderTop: "3.5px solid transparent",
          borderBottom: "3.5px solid transparent",
        }}
      />
    </span>
  );
}

/* Icon helpers */
function ShareIcon() {
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
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
function SaveIcon() {
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
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1.5 14a2 2 0 0 1-2 2H8.5a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
function PlusIcon() {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function RerouteIcon() {
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
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}
function FullscreenIcon() {
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
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}
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
