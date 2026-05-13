import { motion } from 'framer-motion';
import { MOCK_STATS } from '../../types/coverage';

export default function StatsSection() {
  return (
    <div className="border-t border-[var(--line)] bg-white">
      <div className="max-w-[1180px] mx-auto px-4 grid grid-cols-2 md:!px-7 md:!grid-cols-4">
        {MOCK_STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: 'easeOut' }}
            className="py-4 px-[14px] border-r border-r-[var(--line)] border-b border-b-[var(--line-soft)] flex items-center gap-3 min-w-0 md:!py-[18px] md:!px-6 md:!border-b-0 md:!gap-[14px]"
          >
            <div
              className="text-[22px] font-semibold tracking-[-0.5px] text-[var(--ink)] leading-none flex-shrink-0 md:!text-[26px]"
              style={{ fontFamily: 'var(--mono)' }}
            >
              {stat.value}
            </div>
            <div className="text-[11px] text-[var(--ink-4)] leading-[1.3] min-w-0 md:!text-[11.5px]">
              <b className="text-[var(--ink)] font-semibold block">{stat.label}</b>
              {stat.sublabel}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Fix borders: 2nd cell no right border on mobile; all 4 visible on md */}
      <style>{`
        @media (max-width: 767px) {
          /* 2nd and 4th cells (0-indexed: 1 and 3) lose right border */
          .stats-cell:nth-child(2n) { border-right: 0 !important; }
        }
        @media (min-width: 768px) {
          /* Last cell loses right border */
          .stats-cell:last-child { border-right: 0 !important; }
          .stats-cell:nth-child(2) { border-right: 1px solid var(--line) !important; }
        }
      `}</style>
    </div>
  );
}
