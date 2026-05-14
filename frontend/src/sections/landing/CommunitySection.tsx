export default function CommunitySection() {
  return (
    <section id="community" className="block" data-section="community">
      {/* Section header */}
      <div className="mb-10">
        <div className="eyebrow mb-2.5">04 · Community</div>
        <h2 className="text-[30px] font-bold tracking-[-0.6px] leading-[1.2]">
          Forecasts get better with every report
        </h2>
        <p className="text-(--ink-4) text-[14.5px] mt-3 max-w-3xl">
          SignalPH combines NTC cell-site data with anonymous, opt-in readings
          from the field. Your signal check helps the next traveler.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 items-stretch lg:grid-cols-[1.3fr_1fr] lg:gap-6">
        {/* Contribute card */}
        <div className="bg-white border border-(--line) rounded-2xl p-8 flex flex-col gap-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div>
            <h3 className="text-[18px] font-bold tracking-[-0.3px]">
              Contribute a reading in 10 seconds
            </h3>
            <p className="text-(--ink-4) text-[14px] mt-2">
              Pin your current location, pick your network, and we'll read the
              signal automatically — no account required.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <ActionTile
              icon={<SignalIcon />}
              title="Submit a signal check"
              subtitle="Share a reading from where you are right now"
            />
            <ActionTile
              icon={<MapPinIcon />}
              title="Flag a dead zone"
              subtitle="Mark a stretch where signal disappears entirely"
            />
            <ActionTile
              icon={<GaugeIcon />}
              title="Verify a speed test"
              subtitle="Confirm Mbps for your SIM at this location"
            />
            <ActionTile
              icon={<CheckIcon />}
              title="Confirm a forecast"
              subtitle="Tell us if our prediction matched reality"
            />
          </div>

          <div className="border-t border-(--line-soft) pt-5 grid grid-cols-3 gap-3">
            {[
              ["42,318", "Reports today"],
              ["8,941", "Active contributors"],
              ["94%", "Reports verified"],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="mono text-[18px] font-semibold text-(--ink)">
                  {n}
                </div>
                <div className="text-[11px] text-(--ink-4)">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile app dark card */}
        <div className="bg-[linear-gradient(160deg,#0B1220_0%,#1F2A3D_100%)] text-white rounded-2xl border border-[#1F2A3D] p-9 relative overflow-hidden flex flex-col gap-3">
          {/* Glow */}
          <div className="absolute top-[-40%] right-[-40%] w-90 h-90 bg-[radial-gradient(circle,rgba(31,79,255,0.45),transparent_70%)] pointer-events-none" />

          <div className="relative">
            <div className="mono text-[10.5px] uppercase tracking-[0.08em] text-[#94A3B8] mb-3">
              Trip mode · Coming soon
            </div>
            <h3 className="text-[22px] font-bold tracking-[-0.6px] leading-[1.15] max-w-70">
              Drive with live signal forecasting in your pocket.
            </h3>
            <p className="text-[#CBD5E1] text-[13px] max-w-70 mb-1.5 mt-2">
              The SignalPH mobile app gives turn-by-turn signal warnings and
              caches your route map for offline use.
            </p>
            <ul className="list-none flex flex-col gap-1.75 mb-4">
              {[
                "Voice alerts before each dead zone",
                "Offline-first route caching",
                "Auto-submit anonymous readings",
              ].map((f) => (
                <li
                  key={f}
                  className="text-[12.5px] text-[#E2E8F0] flex gap-2 items-center"
                >
                  <span className="w-1.25 h-1.25 rounded-full bg-[#4ADE80] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button
                className="btn btn-brand"
                onClick={() => alert("Thanks! We'll notify you when the app launches.")}
              >
                Notify me
              </button>
            </div>
          </div>

          {/* Decorative phone mockup */}
          <div className="absolute -right-2.5 -bottom-7.5 w-42.5 aspect-1/2 bg-[#0B1220] border-[6px] border-[#1F2A3D] rounded-3xl overflow-hidden shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] rotate-[8deg]">
            <div className="px-2.5 py-3.5 mono text-[8px] text-[#94A3B8] flex justify-between">
              <span>9:41</span>
              <span>5G ●●●</span>
            </div>
            <div className="px-3 text-white text-[9px] leading-[1.3]">
              <div className="mono text-[7px] text-[#94A3B8] tracking-[0.08em] uppercase">
                In 2.4 km
              </div>
              <div className="font-bold text-[11px] mt-0.5">
                Dead zone ahead
              </div>
              <div className="mt-3.5 h-12.5 rounded-md bg-[linear-gradient(90deg,#14A06A_0%,#14A06A_50%,#D03737_50%,#D03737_65%,#C77700_65%,#C77700_80%,#14A06A_80%)]" />
              <div className="flex justify-between mono text-[6px] text-[#94A3B8] mt-0.75">
                <span>0</span>
                <span className="text-[#D03737]">!</span>
                <span>214 km</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ActionTile({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="border border-(--line) rounded-[12px] p-5 bg-(--tint)">
      <div className="w-8 h-8 rounded-lg bg-white border border-(--line) grid place-items-center text-(--brand) mb-3.5">
        {icon}
      </div>
      <div className="text-[13.5px] font-semibold text-(--ink)">{title}</div>
      <div className="text-[12px] text-(--ink-4) mt-1 leading-snug">{subtitle}</div>
    </div>
  );
}

function SignalIcon() {
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
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function MapPinIcon() {
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
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function GaugeIcon() {
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
      <path d="M12 2a10 10 0 1 0 10 10" />
      <path d="M12 12 7 7" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CheckIcon() {
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
