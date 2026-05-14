import { JSX, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import HeroPreviewCards from "./HeroPreviewCards";
import { POPULAR_ROUTES } from "../../types/coverage";
import { ArrowRight } from "lucide-react";

type SearchTab = "route" | "place" | "live";

const TABS: { id: SearchTab; label: string; icon: JSX.Element }[] = [
  {
    id: "route",
    label: "Plan a route",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-3.25 h-3.25"
      >
        <path d="M5 12h14M13 5l7 7-7 7" />
      </svg>
    ),
  },
  {
    id: "place",
    label: "Check a place",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-[13px] h-[13px]"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    id: "live",
    label: "Live now",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-[13px] h-[13px]"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function HeroSection() {
  const [activeTab, setActiveTab] = useState<SearchTab>("route");
  const [routeFrom, setRouteFrom] = useState("Makati, Metro Manila");
  const [routeTo, setRouteTo] = useState("San Fernando, La Union");
  const [placeQuery, setPlaceQuery] = useState("");
  const navigate = useNavigate();

  const popularRoutes = useMemo(() => POPULAR_ROUTES, []);

  const goToMap = (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from?.trim()) params.set("from", from.trim());
    if (to?.trim()) params.set("to", to.trim());
    const query = params.toString();
    navigate(query ? `/maps?${query}` : "/maps");
  };

  const handleForecast = () => {
    const params = new URLSearchParams();
    if (routeFrom.trim()) params.set("from", routeFrom.trim());
    if (routeTo.trim()) params.set("to", routeTo.trim());
    const query = params.toString();
    navigate(query ? `/?${query}` : "/", { replace: true });

    const target = document.getElementById("coverage-map");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    goToMap(routeFrom, routeTo);
  };

  const handlePlaceCheck = () => {
    if (!placeQuery.trim()) return;
    goToMap(undefined, placeQuery);
  };

  const applyPopularRoute = (route: string) => {
    const parts = route.split("→").map((part) => part.trim());
    if (parts.length === 2) {
      setRouteFrom(parts[0]);
      setRouteTo(parts[1]);
      return;
    }
    const fallback = route.split("->").map((part) => part.trim());
    if (fallback.length === 2) {
      setRouteFrom(fallback[0]);
      setRouteTo(fallback[1]);
    }
  };

  return (
    <section
      className="relative min-h-screen flex flex-col justify-center pt-8 px-4 pb-7 border-b border-[var(--line)] overflow-hidden md:!pt-14 md:!px-7 md:!pb-9"
      style={{
        background: `
          radial-gradient(ellipse 60% 80% at 70% 0%, rgba(31,79,255,0.07), transparent 60%),
          linear-gradient(180deg, #FFFFFF 0%, var(--bg) 100%)
        `,
      }}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none hero-grid"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse 120% 100% at 50% 0%, black 20%, transparent 90%)",
        }}
      />

      <div className="relative max-w-[1180px] mx-auto grid grid-cols-1 gap-10 items-center lg:!grid-cols-[1.15fr_1fr] lg:!gap-14">
        {/* Left column */}
        <motion.div variants={container} initial="hidden" animate="show">
          {/* Headline */}
          <motion.h1
            variants={item}
            className="font-extrabold leading-[1.05] tracking-[-1.2px] text-[var(--ink)] mb-[14px]"
            style={{ fontSize: "clamp(28px, 7vw, 56px)" }}
          >
            Know your signal,
            <br />
            <em
              className="not-italic relative"
              style={{
                backgroundImage:
                  "linear-gradient(110deg, var(--brand) 0%, #4F6BFF 45%, #3D5AFF 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
              }}
            >
              before you travel
              <span className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-[var(--brand)] opacity-[0.18] rounded-sm" />
            </em>
          </motion.h1>

          {/* Lead */}
          <motion.p
            variants={item}
            className="pt-2 text-[15px] text-[var(--ink-3)] max-w-[480px] mb-[22px] md:!text-base md:!mb-7"
          >
            SignalPH forecasts mobile network reliability across every barangay,
            road, and route in the Philippines — so you can pick the right SIM
            and avoid dead zones before you leave.
          </motion.p>

          {/* Search tabs + card (stable container — grid overlap prevents layout shift) */}
          <motion.div variants={item}>
            <div
              className="inline-flex bg-white border border-(--line) rounded-[10px] p-1 mb-[10px]"
              role="tablist"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold py-[6px] px-3 rounded-[7px] border-0"
                  style={{
                    background:
                      activeTab === tab.id ? "var(--ink)" : "transparent",
                    color: activeTab === tab.id ? "white" : "var(--ink-4)",
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/*
              All three panels are always in the DOM, stacked in the same grid cell.
              The container height is locked to the tallest panel (RouteSearchCard).
              Inactive panels are invisible and non-interactive — no layout shift.
            */}
            <div className="grid">
              <div
                style={{ gridArea: "1/1" }}
                className={`transition-opacity duration-150 ease-in-out ${
                  activeTab === "route"
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
                }`}
                aria-hidden={activeTab !== "route"}
              >
                <RouteSearchCard
                  fromValue={routeFrom}
                  toValue={routeTo}
                  onFromChange={setRouteFrom}
                  onToChange={setRouteTo}
                  onSubmit={handleForecast}
                  onPickRoute={applyPopularRoute}
                  popularRoutes={popularRoutes}
                />
              </div>

              <div
                style={{ gridArea: "1/1" }}
                className={`transition-opacity duration-150 ease-in-out ${
                  activeTab === "place"
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
                }`}
                aria-hidden={activeTab !== "place"}
              >
                <PlaceSearchCard
                  value={placeQuery}
                  onChange={setPlaceQuery}
                  onSubmit={handlePlaceCheck}
                />
              </div>

              <div
                style={{ gridArea: "1/1" }}
                className={`transition-opacity duration-150 ease-in-out ${
                  activeTab === "live"
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
                }`}
                aria-hidden={activeTab !== "live"}
              >
                <LiveCard />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right column — preview cards, desktop only */}
        <div className="hidden hero-right-col">
          <HeroPreviewCards />
        </div>
      </div>

      <style>{`
        @media (min-width: 980px) {
          .hero-right-col { display: block !important; }
        }
        @keyframes hero-grid-drift {
          from { background-position: 0 0; }
          to { background-position: 32px 32px; }
        }
        .hero-grid {
          animation: hero-grid-drift 5s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-grid { animation: none; }
        }
      `}</style>
    </section>
  );
}

function SearchField({
  label,
  value,
  dotColor,
  placeholder,
  onChange,
  onSubmit,
}: {
  label: string;
  value: string;
  dotColor: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-[9px] cursor-text min-h-12 sm:!py-[10px]">
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: dotColor }}
      />
      <div>
        <div
          className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-5)] mb-0.5"
          style={{ fontFamily: "var(--mono)" }}
        >
          {label}
        </div>
        <input
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSubmit?.();
          }}
          placeholder={placeholder}
          className="w-full bg-transparent text-[13.5px] font-semibold text-[var(--ink)] outline-none"
        />
      </div>
    </div>
  );
}

function RouteSearchCard({
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  onSubmit,
  onPickRoute,
  popularRoutes,
}: {
  fromValue: string;
  toValue: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onSubmit: () => void;
  onPickRoute: (route: string) => void;
  popularRoutes: readonly string[];
}) {
  return (
    <>
      <div
        className="bg-white border border-[var(--line)] rounded-[14px] p-2 grid grid-cols-1 gap-1 max-w-[560px] sm:!grid-cols-[1fr_1fr_auto]"
        style={{
          boxShadow:
            "0 10px 30px -12px rgba(15,23,42,0.16), 0 2px 4px rgba(15,23,42,0.04)",
        }}
      >
        <SearchField
          label="From"
          value={fromValue}
          onChange={onFromChange}
          onSubmit={onSubmit}
          dotColor="var(--brand)"
          placeholder="Origin"
        />
        <SearchField
          label="To"
          value={toValue}
          onChange={onToChange}
          onSubmit={onSubmit}
          dotColor="var(--ink)"
          placeholder="Destination"
        />
        <button
          onClick={onSubmit}
          className="bg-[var(--brand)] text-white border-0 rounded-[10px] py-[14px] px-[18px] font-semibold text-sm flex items-center justify-center gap-1.5 min-h-12 sm:!py-0 sm:!px-[18px] sm:!text-[13px]"
        >
          Forecast
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="mt-[14px] flex flex-wrap gap-1.5 items-center min-w-xl">
        <span
          className="text-[10.5px] text-(--ink-5) mr-1"
          style={{ fontFamily: "var(--mono)" }}
        >
          Popular →
        </span>
        {popularRoutes.map((route) => (
          <button
            key={route}
            className="chip"
            onClick={() => onPickRoute(route)}
          >
            {route}
          </button>
        ))}
      </div>
    </>
  );
}

function PlaceSearchCard({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div
      className="bg-white border border-[var(--line)] rounded-[14px] p-2 grid grid-cols-1 gap-1 max-w-[560px] sm:!grid-cols-[1fr_auto]"
      style={{
        boxShadow:
          "0 10px 30px -12px rgba(15,23,42,0.16), 0 2px 4px rgba(15,23,42,0.04)",
      }}
    >
      <SearchField
        label="Place"
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        dotColor="var(--brand)"
        placeholder="e.g. UP Diliman, Tagaytay City"
      />
      <button
        onClick={onSubmit}
        className="bg-[var(--brand)] text-white border-0 rounded-[10px] py-[14px] px-[18px] font-semibold text-sm flex items-center justify-center gap-1.5 min-h-12 sm:!py-0 sm:!px-[18px] sm:!text-[13px]"
      >
        Check Signal
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </button>
    </div>
  );
}

function LiveCard() {
  return (
    <div
      className="bg-white border border-[var(--line)] rounded-[14px] p-4 max-w-[560px] flex items-center gap-4"
      style={{
        boxShadow:
          "0 10px 30px -12px rgba(15,23,42,0.16), 0 2px 4px rgba(15,23,42,0.04)",
      }}
    >
      <div className="w-10 h-10 rounded-full bg-[var(--brand-tint)] flex items-center justify-center flex-shrink-0">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--brand)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
          <line x1="9" y1="3" x2="9" y2="18" />
          <line x1="15" y1="6" x2="15" y2="21" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-[var(--ink)]">
          Live Signal Map
        </div>
        <div className="text-[12px] text-[var(--ink-4)] mt-0.5">
          Real-time coverage visualization is coming soon.
        </div>
      </div>
      <button
        disabled
        className="flex-shrink-0 bg-[var(--tint)] text-[var(--ink-5)] border border-[var(--line)] rounded-[10px] py-[10px] px-4 font-semibold text-[13px] cursor-not-allowed"
      >
        Coming Soon
      </button>
    </div>
  );
}
