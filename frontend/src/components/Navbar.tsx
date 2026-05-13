import { useState } from 'react';

const NAV_LINKS = [
  { label: 'Route forecast', active: true },
  { label: 'Coverage map',   active: false },
  { label: 'Providers',      active: false },
  { label: 'Community',      active: false },
  { label: 'About',          active: false },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <nav style={{
        height: 56,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--line)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        gap: 12,
      }}
      className="md:!h-[60px] md:!px-7"
      >
        {/* Logo */}
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo-mark" />
          <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px' }}>
            Signal<span style={{ color: 'var(--brand)' }}>PH</span>
          </div>
        </a>

        {/* Desktop nav links — hidden below 980px */}
        <div className="hidden items-center gap-1" style={{ display: 'none' }}
          /* Tailwind hidden below lg handled via media query in inline approach */
        />
        <div style={{ display: 'none' }} className="nav-mid-desktop">
          {/* rendered via CSS below */}
        </div>

        {/* Nav links via CSS class approach */}
        <div style={{
          display: 'none',
          gap: 4,
          alignItems: 'center',
        }}
        className="nav-links-desktop"
        >
          {NAV_LINKS.map(({ label, active }) => (
            <a
              key={label}
              href="#"
              style={{
                fontSize: 13,
                color: active ? 'var(--ink)' : 'var(--ink-3)',
                padding: '6px 12px',
                borderRadius: 6,
                fontWeight: 500,
                background: active ? 'var(--line-soft)' : 'transparent',
              }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Location button — hidden on mobile */}
          <button className="btn" style={{ display: 'none' }} id="btn-loc">
            <LocationIcon />
            Use my location
          </button>
          <button className="btn btn-primary">Get the app</button>
          {/* Hamburger — hidden above 980px */}
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              background: 'white',
              border: '1px solid var(--line)',
              borderRadius: 8,
              color: 'var(--ink-2)',
            }}
            id="hamburger"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setIsOpen(prev => !prev)}
          >
            {isOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div style={{
        position: 'fixed',
        inset: '56px 0 0 0',
        background: 'white',
        zIndex: 49,
        padding: 16,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .25s ease',
        borderTop: '1px solid var(--line)',
      }}>
        {NAV_LINKS.map(({ label, active }) => (
          <a
            key={label}
            href="#"
            onClick={() => setIsOpen(false)}
            style={{
              display: 'block',
              padding: '14px 4px',
              fontSize: 16,
              fontWeight: 600,
              color: active ? 'var(--brand)' : 'var(--ink)',
              borderBottom: '1px solid var(--line-soft)',
            }}
          >
            {label}
          </a>
        ))}
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="btn">
            <LocationIcon />
            Use my location
          </button>
          <button className="btn btn-primary">Get the app</button>
        </div>
      </div>

      {/* Desktop nav links injection via style tag — media query approach */}
      <style>{`
        @media (min-width: 980px) {
          .nav-links-desktop { display: flex !important; }
          #hamburger { display: none !important; }
          #btn-loc { display: inline-flex !important; }
        }
        @media (min-width: 768px) {
          #btn-loc { display: inline-flex !important; }
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

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
