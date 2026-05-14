import { MOCK_USE_CASES } from "../../types/coverage";
import { PROVIDERS } from "../../constants/providers";

const USER_SEGMENTS = [
  {
    id: "commuters",
    label: "Daily commuters",
    share: 38,
    color: "#3457FF",
    coverage: 86,
    speed: 74,
    offline: 22,
  },
  {
    id: "travelers",
    label: "Intercity travelers",
    share: 27,
    color: "#14B8A6",
    coverage: 78,
    speed: 66,
    offline: 41,
  },
  {
    id: "field",
    label: "Field teams",
    share: 21,
    color: "#F59E0B",
    coverage: 92,
    speed: 61,
    offline: 63,
  },
  {
    id: "events",
    label: "Event crews",
    share: 14,
    color: "#EF4444",
    coverage: 70,
    speed: 82,
    offline: 28,
  },
] as const;

const PRIORITY_LEGEND = [
  { key: "coverage", label: "Coverage", color: "#3457FF" },
  { key: "speed", label: "Speed", color: "#14B8A6" },
  { key: "offline", label: "Offline", color: "#F59E0B" },
] as const;

type PriorityKey = (typeof PRIORITY_LEGEND)[number]["key"];
type UserSegment = (typeof USER_SEGMENTS)[number];

export default function UseCasesSection() {
  return (
    <section id="use-cases" className="block" data-section="use-cases">
      <div className="block-head">
        <div>
          <div className="eyebrow">03 · Who uses SignalPH</div>
          <h2 className="text-[30px] font-bold tracking-[-0.6px] leading-[1.2]">
            Built for every kind of traveler
          </h2>
          <div className="h-sub">
            From daily commuters to field workers — see which SIM works best for
            your journey type.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-[14px] lg:!grid-cols-2 lg:!gap-[18px]">
        {/* Use case table */}
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Popular use cases</div>
            <span
              className="text-[10px] text-[var(--ink-5)] uppercase tracking-[0.05em]"
              style={{ fontFamily: "var(--mono)" }}
            >
              Best SIM
            </span>
          </div>
          <div>
            {MOCK_USE_CASES.map((uc, i) => (
              <div
                key={uc.id}
                className="grid grid-cols-[32px_1fr_auto] gap-[14px] items-center py-[14px] px-[18px] cursor-pointer hover:!bg-[var(--tint)]"
                style={{
                  borderTop: i === 0 ? 0 : "1px solid var(--line-soft)",
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--brand-tint)] text-[var(--brand-ink)] grid place-items-center">
                  <uc.icon size={16} strokeWidth={2.2} />
                </div>

                <div>
                  <div className="text-[13.5px] font-semibold text-[var(--ink)]">
                    {uc.title}
                  </div>
                  <div className="text-[11.5px] text-[var(--ink-4)] mt-px">
                    {uc.subtitle}
                  </div>
                </div>

                <div className="flex items-center gap-2 font-bold text-[13px]">
                  <img
                    src={PROVIDERS[uc.bestProvider].logo}
                    alt={PROVIDERS[uc.bestProvider].shortName}
                    style={{
                      width: 24,
                      height: 24,
                      objectFit: "contain",
                    }}
                  />
                  {PROVIDERS[uc.bestProvider].shortName}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User comparisons */}
        <div className="panel flex flex-col">
          <div className="panel-head">
            <div className="panel-title">
              <span className="text-sm">✦</span>
              User comparisons
              <span className="badge">Mock</span>
            </div>
          </div>

          <div className="p-[18px] flex flex-col gap-4">
            <div
              className="rounded-2xl border border-[var(--line)] p-[14px]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(52,87,255,0.08), rgba(20,184,166,0.06))",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-semibold text-[var(--ink)]">
                  User mix by trip type
                </div>
                <div className="text-[10px] text-[var(--ink-4)]">% of chats</div>
              </div>

              <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-white border border-[var(--line)] flex">
                {USER_SEGMENTS.map((segment) => (
                  <div
                    key={segment.id}
                    style={{
                      width: `${segment.share}%`,
                      background: segment.color,
                    }}
                  />
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {USER_SEGMENTS.map((segment) => (
                  <div
                    key={segment.id}
                    className="flex items-center gap-2 text-[11px] text-[var(--ink-4)]"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: segment.color }}
                    />
                    <span className="text-[var(--ink)] font-medium">
                      {segment.label}
                    </span>
                    <span>{segment.share}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {USER_SEGMENTS.map((segment) => (
                <div
                  key={segment.id}
                  className="rounded-2xl border border-[var(--line)] bg-white p-[14px]"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[12px] font-semibold text-[var(--ink)]">
                      {segment.label}
                    </div>
                    <span
                      className="text-[10px] uppercase tracking-[0.08em] text-[var(--ink-4)]"
                      style={{ fontFamily: "var(--mono)" }}
                    >
                      Priority index
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {PRIORITY_LEGEND.map((legend) => {
                      const value = segment[legend.key as PriorityKey] as UserSegment[PriorityKey];
                      return (
                        <div key={legend.key}>
                          <div className="flex items-center justify-between text-[10px] text-[var(--ink-4)]">
                            <span>{legend.label}</span>
                            <span>{value}</span>
                          </div>
                          <div className="mt-1 h-2 w-full rounded-full bg-[var(--tint)]">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${value}%`,
                                background: legend.color,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
