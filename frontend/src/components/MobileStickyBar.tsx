export default function MobileStickyBar() {
  return (
    <>
      <div style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid var(--line)',
        padding: 'calc(10px + env(safe-area-inset-bottom, 0px)) 16px 10px',
        display: 'flex',
        gap: 8,
        zIndex: 40,
        boxShadow: '0 -4px 16px rgba(15,23,42,0.06)',
      }}
      className="md:!hidden"
      >
        <button className="btn" style={{ flex: 1, justifyContent: 'center', height: 44 }}>
          <LocationIcon />
          Coverage here
        </button>
        <button className="btn btn-brand" style={{ flex: 1, justifyContent: 'center', height: 44 }}>
          <ArrowIcon />
          Plan route
        </button>
      </div>

      {/* Ensure body has bottom padding on mobile to avoid overlap */}
      <style>{`
        @media (min-width: 768px) {
          .mobile-sticky-bar { display: none !important; }
        }
      `}</style>
    </>
  );
}

function LocationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M5 12h14M13 5l7 7-7 7"/>
    </svg>
  );
}
