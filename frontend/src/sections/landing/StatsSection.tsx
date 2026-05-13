import { motion } from 'framer-motion';
import { MOCK_STATS } from '../../types/coverage';

export default function StatsSection() {
  return (
    <div style={{ borderTop: '1px solid var(--line)', background: 'white' }}>
      <div style={{
        maxWidth: 1180,
        margin: '0 auto',
        padding: '0 16px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
      }}
      className="md:!px-7 md:!grid-cols-4"
      >
        {MOCK_STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: 'easeOut' }}
            style={{
              padding: '16px 14px',
              borderRight: '1px solid var(--line)',
              borderBottom: '1px solid var(--line-soft)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minWidth: 0,
              /* Remove right border for every 2nd cell on mobile, last cell on desktop */
            }}
            className="md:!py-[18px] md:!px-6 md:!border-b-0 md:!gap-[14px]"
          >
            <div style={{
              fontFamily: 'var(--mono)',
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-0.5px',
              color: 'var(--ink)',
              lineHeight: 1,
              flexShrink: 0,
            }}
            className="md:!text-[26px]"
            >
              {stat.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)', lineHeight: 1.3, minWidth: 0 }}
            className="md:!text-[11.5px]"
            >
              <b style={{ color: 'var(--ink)', fontWeight: 600, display: 'block' }}>{stat.label}</b>
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
