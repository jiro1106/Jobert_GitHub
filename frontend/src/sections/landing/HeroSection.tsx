import { JSX, useState } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import HeroPreviewCards from "./HeroPreviewCards";
import { POPULAR_ROUTES } from "../../types/coverage";

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
        className="absolute inset-0 pointer-events-none"
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
            <em className="not-italic text-[var(--brand)] relative">
              before you travel.
              <span className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-[var(--brand)] opacity-[0.18] rounded-sm" />
            </em>
          </motion.h1>

          {/* Lead */}
          <motion.p
            variants={item}
            className="text-[15px] text-[var(--ink-3)] max-w-[480px] mb-[22px] md:!text-base md:!mb-7"
          >
            SignalPH forecasts mobile network reliability across every barangay,
            road, and route in the Philippines — so you can pick the right SIM
            and avoid dead zones before you leave.
          </motion.p>

          {/* Search tabs + card (single stable container) */}
          <motion.div
            variants={item}
            className="min-h-[260px] sm:min-h-[170px]"
          >
            <div
              className="inline-flex bg-white border border-[var(--line)] rounded-[10px] p-1 mb-[10px]"
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
            {activeTab === "route" && (
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
                    value="Makati, Metro Manila"
                    dotColor="var(--brand)"
                  />
                  <SearchField
                    label="To"
                    value="San Fernando, La Union"
                    dotColor="var(--ink)"
                  />
                  <button className="bg-[var(--brand)] text-white border-0 rounded-[10px] py-[14px] px-[18px] font-semibold text-sm flex items-center justify-center gap-1.5 min-h-12 sm:!py-0 sm:!px-[18px] sm:!text-[13px]">
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
                    className="text-[10.5px] text-[var(--ink-5)] mr-1"
                    style={{ fontFamily: "var(--mono)" }}
                  >
                    Popular →
                  </span>
                  {POPULAR_ROUTES.map((route) => (
                    <button key={route} className="chip">
                      {route}
                    </button>
                  ))}
                </div>
              </>
            )}

            {activeTab === "place" && (
              <div
                className="bg-white border border-[var(--line)] rounded-[14px] p-2 grid grid-cols-1 gap-1 max-w-[560px] sm:!grid-cols-[1fr_auto]"
                style={{
                  boxShadow:
                    "0 10px 30px -12px rgba(15,23,42,0.16), 0 2px 4px rgba(15,23,42,0.04)",
                }}
              >
                <SearchField
                  label="Place"
                  value="e.g. UP Diliman, Tagaytay City"
                  dotColor="var(--brand)"
                />
                <button className="bg-[var(--brand)] text-white border-0 rounded-[10px] py-[14px] px-[18px] font-semibold text-sm flex items-center justify-center gap-1.5 min-h-12 sm:!py-0 sm:!px-[18px] sm:!text-[13px]">
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
            )}

            {activeTab === "live" && (
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
            )}
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
      `}</style>
    </section>
  );
}

function SearchField({
  label,
  value,
  dotColor,
}: {
  label: string;
  value: string;
  dotColor: string;
}) {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-[9px] cursor-text min-h-12 sm:!py-[10px]">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: dotColor }}
      />
      <div>
        <div
          className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-5)] mb-0.5"
          style={{ fontFamily: "var(--mono)" }}
        >
          {label}
        </div>
        <div className="text-[13.5px] font-semibold text-[var(--ink)]">
          {value}
        </div>
      </div>
    </div>
  );
}
