import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { ProviderScore, RouteForecast } from "../../types/coverage";
import { getProviderScores } from "../../libs/api";
import type { RouteCoords } from "../../pages/LandingPage";
import { MOCK_ROUTE_FORECAST } from "../../types/coverage";
import { PROVIDERS } from "../../constants/providers";

type Scope = "route" | "dest" | "origin";

interface Props {
  activeRoute: RouteCoords | null;
  forecast: RouteForecast | null;
}

export default function ProviderScoreboardSection({
  activeRoute,
  forecast,
}: Props) {
  const [activeScope, setActiveScope] = useState<Scope>("route");
  const [providers, setProviders] = useState<ProviderScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clear state when route is deselected
    if (!activeRoute) {
      abortRef.current?.abort();
      setProviders([]);
      setHasData(false);
      setLoading(false);
      return;
    }

    // "route" scope: reuse forecast data from MapSection — no extra API call
    if (activeScope === "route") {
      if (forecast?.providers?.length) {
        setProviders(forecast.providers);
        setHasData(true);
        setLoading(false);
        setError(null);
      } else {
        // Forecast is still in-flight; show loading until it arrives
        setLoading(true);
        setHasData(false);
      }
      return;
    }

    // "origin" or "dest" scope — dedicated fetch with abort support
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const fetchScores = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getProviderScores(
          activeRoute.originLat,
          activeRoute.originLng,
          activeRoute.destLat,
          activeRoute.destLng,
          activeScope,
          { signal: ac.signal },
        );
        if (ac.signal.aborted) return;
        if (response?.providers?.length > 0) {
          setProviders(response.providers);
          setHasData(true);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Error fetching provider scores:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch scores");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    };

    fetchScores();
    return () => ac.abort();
  }, [activeRoute, activeScope, forecast]);

  const scopes: { id: Scope; label: string }[] = [
    { id: "route", label: "This route" },
    { id: "dest", label: "Destination only" },
    { id: "origin", label: "Origin only" },
  ];

  const bestScore = hasData ? Math.max(...providers.map((p) => p.score)) : -1;

  return (
    <section
      id="providers"
      className="block"
      data-section="provider-scoreboard"
    >
      <div className="block-head">
        <div>
          <div className="eyebrow">02 · Provider scorecard</div>
          <h2 className="text-[30px] font-bold tracking-[-0.6px] leading-[1.2]">
            Side-by-side along this route
          </h2>
          <div className="h-sub">
            Average signal score, fastest speed sample, and forecast confidence
            per provider.
          </div>
        </div>
        <div className="block-head-r">
          <div className="seg">
            {scopes.map((s) => (
              <button
                key={s.id}
                className={activeScope === s.id ? "active" : ""}
                onClick={() => setActiveScope(s.id)}
                disabled={!hasData}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#FEE2E2",
            border: "1px solid #FCA5A5",
            color: "#DC2626",
            fontSize: 13,
            marginBottom: 16,
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      )}

      {/* Empty state — no route selected yet */}
      {!activeRoute && !loading && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "56px 24px",
            border: "1.5px dashed var(--line)",
            borderRadius: 16,
            color: "var(--ink-4)",
            textAlign: "center",
            background: "var(--surface)",
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13V7m0 13 6-3M9 7l6-3m0 16 5.447-2.724A1 1 0 0 0 21 16.382V5.618a1 1 0 0 0-1.447-.894L15 7m0 13V7" />
          </svg>
          <div style={{ fontWeight: 600, fontSize: 15 }}>No route selected</div>
          <div style={{ fontSize: 13 }}>
            Select a route on the map above to compare provider scores
            side-by-side.
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 gap-[14px] sm:!grid-cols-2 lg:!grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                background: "white",
                border: "1px solid var(--line)",
                borderRadius: 14,
                padding: 18,
                height: 200,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            >
              <div
                style={{
                  background: "#EEF1F7",
                  borderRadius: 8,
                  height: 20,
                  width: "60%",
                  marginBottom: 12,
                }}
              />
              <div
                style={{
                  background: "#EEF1F7",
                  borderRadius: 8,
                  height: 40,
                  width: "40%",
                  marginBottom: 16,
                }}
              />
              <div
                style={{
                  background: "#EEF1F7",
                  borderRadius: 8,
                  height: 32,
                  marginBottom: 12,
                }}
              />
              <div
                style={{
                  background: "#EEF1F7",
                  borderRadius: 8,
                  height: 16,
                  width: "80%",
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Live provider cards */}
      {!loading && hasData && (
        <div className="grid grid-cols-1 gap-[14px] sm:!grid-cols-2 lg:!grid-cols-3">
          {providers.map((provider, i) => (
            <motion.div
              key={provider.provider}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.4, ease: "easeOut" }}
            >
              <ProviderCard
                provider={provider}
                isBest={provider.score === bestScore}
              />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

function ProviderCard({
  provider,
  isBest,
}: {
  provider: ProviderScore;
  isBest: boolean;
}) {
  const sparkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sparkRef.current;
    if (!el) return;
    const data = provider.sparklineData ?? [];
    if (!data.length) return;
    const max = Math.max(...data, 1);
    while (el.firstChild) el.removeChild(el.firstChild);
    const baseColor = PROVIDERS[provider.provider]?.color ?? "#94A3B8";
    provider.sparklineData.forEach((v) => {
      const s = document.createElement("span");
      const h = Math.max(3, (v / max) * 32);
      s.style.height = h + "px";
      s.style.borderRadius = "2px";
      s.style.background = baseColor + "bb";
      el.appendChild(s);
    });
  }, [provider]);

  const networkClass =
    provider.network === "5G"
      ? "g5"
      : provider.network === "4G LTE"
        ? "g4"
        : "g3";

  return (
    <div
      className="bg-white rounded-[14px] p-[18px] relative cursor-pointer transition-[transform,box-shadow] duration-[120ms] sm:!p-4 hover:!-translate-y-0.5 hover:!shadow-lg"
      style={{
        border: isBest ? "1px solid var(--brand)" : "1px solid var(--line)",
        boxShadow: isBest
          ? "0 0 0 3px rgba(31,79,255,0.08)"
          : "0 1px 2px rgba(15,23,42,0.04)",
      }}
    >
      {isBest && (
        <div className="absolute -top-[10px] left-4 bg-[var(--brand)] text-white text-[10px] font-bold uppercase tracking-[0.06em] py-[3px] px-[9px] rounded-full">
          Best fit
        </div>
      )}

      <div className="flex items-center justify-between mb-[14px]">
        <div className="flex items-center gap-2.5">
          <div className="prov-tile">
            <img
              src={PROVIDERS[provider.provider]?.logo}
              alt={provider.name}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <div>
            <div className="text-[15px] font-bold">{provider.name}</div>
            <div className="text-[11px] text-[var(--ink-4)]">
              {provider.fullName}
            </div>
          </div>
        </div>
        <span className={`net-tag ${networkClass}`}>{provider.network}</span>
      </div>

      <div className="flex items-baseline gap-1.5 mb-[14px]">
        <span
          className="text-[38px] font-semibold tracking-[-1.5px] text-[var(--ink)] leading-none"
          style={{ fontFamily: "var(--mono)" }}
        >
          {provider.score}
        </span>
        <span
          className="text-[13px] text-[var(--ink-5)]"
          style={{ fontFamily: "var(--mono)" }}
        >
          /100
        </span>
        <span
          className="ml-auto text-[11px] py-[3px] px-[7px] rounded-[4px] font-semibold"
          style={{
            fontFamily: "var(--mono)",
            color: provider.delta >= 0 ? "var(--ok)" : "var(--bad)",
            background:
              provider.delta >= 0 ? "var(--ok-tint)" : "var(--bad-tint)",
          }}
        >
          {provider.delta >= 0 ? "▲" : "▼"} {Math.abs(provider.delta)}
        </span>
      </div>

      <div
        ref={sparkRef}
        className="grid grid-cols-[repeat(28,1fr)] gap-0.5 h-9 items-end mb-[14px]"
      />

      <div className="grid grid-cols-3 pt-3 border-t border-[var(--line-soft)]">
        <ProvStat value={`${provider.avgSpeedMbps} Mbps`} label="Avg speed" />
        <ProvStat
          value={`${provider.strongSignalPct}%`}
          label="Strong sig."
          bordered
        />
        <ProvStat
          value={`${provider.confidencePct}%`}
          label="Confidence"
          bordered
        />
      </div>
    </div>
  );
}

function ProvStat({
  value,
  label,
  bordered,
}: {
  value: string;
  label: string;
  bordered?: boolean;
}) {
  return (
    <div
      style={{
        paddingLeft: bordered ? 12 : undefined,
        paddingRight: bordered ? undefined : 8,
        borderLeft: bordered ? "1px solid var(--line-soft)" : undefined,
      }}
    >
      <div
        className="text-sm font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--mono)" }}
      >
        {value}
      </div>
      <div className="text-[10.5px] text-[var(--ink-4)] mt-0.5">{label}</div>
    </div>
  );
}
