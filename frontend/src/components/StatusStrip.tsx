export default function StatusStrip() {
  return (
    <div className="bg-(--ink) text-[#CBD5E1] text-[11px] py-[7px] px-4 flex items-center justify-center gap-[14px] overflow-x-auto whitespace-nowrap [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <span className="inline-flex items-center gap-1.5 text-white font-medium">
        <span className="live-dot" />
        Live data
      </span>
      <span className="opacity-40">/</span>
      <span>NTC + community · 42,318 reports today</span>
      <span className="opacity-40">/</span>
      <span>Manila ↔ La Union route forecast updated 4 min ago</span>
      <span className="opacity-40">/</span>
      <span>3 active outages in NCR · 1 in Cebu</span>
    </div>
  );
}
