import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/full_logo.png";

const NAV_LINKS = [
  { label: "Coverage Map", sectionId: "coverage-map" },
  { label: "Providers", sectionId: "providers" },
  { label: "Use Cases", sectionId: "use-cases" },
  { label: "Community", sectionId: "community" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const isScrollingRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sectionIds = NAV_LINKS.map((l) => l.sectionId);
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: "-80px 0px -50% 0px",
        threshold: 0,
      },
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  function scrollToTop() {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    isScrollingRef.current = true;
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsOpen(false);
    setActiveSection("");
    scrollTimerRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 1000);
  }

  function scrollTo(sectionId: string) {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    isScrollingRef.current = true;
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setIsOpen(false);
    setActiveSection(sectionId);
    scrollTimerRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 1000);
  }

  return (
    <>
      <nav
        style={{
          height: 80,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          position: "sticky",
          top: 0,
          zIndex: 50,
          gap: 12,
        }}
        className="md:!h-[80px] md:!px-7"
      >
        {/* Logo */}
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); scrollToTop(); }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            width: "fit-content",
            cursor: "pointer",
          }}
        >
          <img
            src={logo}
            alt="SignalPH Logo"
            style={{ height: 80, width: "auto" }}
          />
        </a>

        {/* Nav links via CSS class approach */}
        <div
          style={{
            display: "none",
            gap: 4,
            alignItems: "center",
          }}
          className="nav-links-desktop"
        >
          {NAV_LINKS.map(({ label, sectionId }) => {
            const isActive = activeSection === sectionId;
            return (
              <a
                key={label}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(sectionId);
                }}
                style={{
                  position: "relative",
                  fontSize: 13,
                  color: isActive ? "var(--ink)" : "var(--ink-3)",
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontWeight: 500,
                  cursor: "pointer",
                  zIndex: 0,
                }}
              >
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      exit={{ opacity: 0, transition: { duration: 0.15 } }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 6,
                        background: "var(--line-soft)",
                        zIndex: -1,
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                </AnimatePresence>
                <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
              </a>
            );
          })}
        </div>

        {/* Right actions */}
        <div
          id="nav-right"
          style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
          {/* Location button — hidden on mobile */}
          <button className="btn" style={{ display: "none" }} id="btn-loc">
            Contribute
          </button>
          <button className="btn btn-primary">Login</button>
          {/* Hamburger — hidden above 980px */}
          <button
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 38,
              background: "white",
              border: "1px solid var(--line)",
              borderRadius: 8,
              color: "var(--ink-2)",
            }}
            id="hamburger"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            {isOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        style={{
          position: "fixed",
          inset: "80px 0 0 0",
          background: "white",
          zIndex: 49,
          padding: 16,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform .25s ease",
          borderTop: "1px solid var(--line)",
        }}
      >
        {NAV_LINKS.map(({ label, sectionId }) => {
          const isActive = activeSection === sectionId;
          return (
            <a
              key={label}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                scrollTo(sectionId);
              }}
              style={{
                display: "block",
                padding: "14px 4px",
                fontSize: 16,
                fontWeight: 600,
                color: isActive ? "var(--brand)" : "var(--ink)",
                borderBottom: "1px solid var(--line-soft)",
                cursor: "pointer",
              }}
            >
              {label}
            </a>
          );
        })}
        <div
          style={{
            marginTop: 16,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <button className="btn">Contribute</button>
          <button className="btn btn-primary">Get the app</button>
        </div>
      </div>

      {/* Desktop nav links injection via style tag — media query approach */}
      <style>{`
        @media (min-width: 980px) {
          nav {
            display: grid !important;
            grid-template-columns: 1fr auto 1fr !important;
          }
          .nav-links-desktop { display: flex !important; justify-content: center; }
          #nav-right { justify-self: end; }
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

function MenuIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
