# Navbar Scroll-Spy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the four Navbar tabs to their landing page sections with smooth scroll-on-click and a scroll-spy active indicator that updates as the user scrolls, with a Framer Motion animated pill on desktop and brand-color highlight on mobile.

**Architecture:** Each section gets an `id`; a single `IntersectionObserver` in Navbar watches all four and updates `activeSection` state; clicking a tab calls `scrollIntoView({ behavior: 'smooth' })` and sets the active state optimistically. On desktop, a `<motion.span layoutId="nav-pill">` slides between tab labels via Framer layout animation.

**Tech Stack:** React 18, TypeScript, Framer Motion v12, native IntersectionObserver, Tailwind CSS

---

### Task 1: Add `id` attributes to all four section files

**Files:**
- Modify: `src/sections/landing/MapSection.tsx` (line 14)
- Modify: `src/sections/landing/ProviderScoreboardSection.tsx` (line 21)
- Modify: `src/sections/landing/UseCasesSection.tsx` (line 52)
- Modify: `src/sections/landing/CommunitySection.tsx` (line 2)

- [ ] **Step 1: Add `id="coverage-map"` to MapSection**

In `src/sections/landing/MapSection.tsx`, find the root `<section>` and add the id:

```tsx
// Before
<section className="block" data-section="route-forecast">

// After
<section id="coverage-map" className="block" data-section="route-forecast">
```

- [ ] **Step 2: Add `id="providers"` to ProviderScoreboardSection**

In `src/sections/landing/ProviderScoreboardSection.tsx`:

```tsx
// Before
<section className="block" data-section="provider-scoreboard">

// After
<section id="providers" className="block" data-section="provider-scoreboard">
```

- [ ] **Step 3: Add `id="use-cases"` to UseCasesSection**

In `src/sections/landing/UseCasesSection.tsx`:

```tsx
// Before
<section className="block" data-section="use-cases">

// After
<section id="use-cases" className="block" data-section="use-cases">
```

- [ ] **Step 4: Add `id="community"` to CommunitySection**

In `src/sections/landing/CommunitySection.tsx`:

```tsx
// Before
<section className="block" data-section="community">

// After
<section id="community" className="block" data-section="community">
```

- [ ] **Step 5: Verify in browser**

Start dev server if not running: `npm run dev`

Open `http://localhost:5173`. Open DevTools → Elements. Confirm that each of the four sections has the correct `id` attribute. Paste in the console:
```js
['coverage-map','providers','use-cases','community'].every(id => !!document.getElementById(id))
// Expected: true
```

- [ ] **Step 6: Commit**

```bash
git add src/sections/landing/MapSection.tsx src/sections/landing/ProviderScoreboardSection.tsx src/sections/landing/UseCasesSection.tsx src/sections/landing/CommunitySection.tsx
git commit -m "feat: add section ids for navbar scroll targets"
```

---

### Task 2: Refactor NAV_LINKS and add activeSection state to Navbar

**Files:**
- Modify: `src/components/Navbar.tsx`

- [ ] **Step 1: Replace NAV_LINKS with sectionId-based array**

Replace the existing `NAV_LINKS` constant at the top of `src/components/Navbar.tsx`:

```tsx
// Remove this:
const NAV_LINKS = [
  { label: "Coverage Map", active: true },
  { label: "Providers", active: false },
  { label: "Use Cases", active: false },
  { label: "Community", active: false },
];

// Add this:
const NAV_LINKS = [
  { label: "Coverage Map", sectionId: "coverage-map" },
  { label: "Providers",    sectionId: "providers" },
  { label: "Use Cases",    sectionId: "use-cases" },
  { label: "Community",   sectionId: "community" },
];
```

- [ ] **Step 2: Add `activeSection` state inside the Navbar component**

Inside `export default function Navbar()`, add the state alongside the existing `isOpen` state:

```tsx
const [isOpen, setIsOpen] = useState(false);
const [activeSection, setActiveSection] = useState("coverage-map");
```

- [ ] **Step 3: Fix TypeScript — remove unused `active` references**

The map calls in the JSX currently destructure `{ label, active }`. Update both render sites (desktop nav links and mobile drawer) to destructure `{ label, sectionId }` instead and derive the active boolean inline:

Desktop nav links (find the `.nav-links-desktop` div):
```tsx
{NAV_LINKS.map(({ label, sectionId }) => {
  const isActive = activeSection === sectionId;
  return (
    <a
      key={label}
      href="#"
      style={{
        fontSize: 13,
        color: isActive ? "var(--ink)" : "var(--ink-3)",
        padding: "6px 12px",
        borderRadius: 6,
        fontWeight: 500,
        background: isActive ? "var(--line-soft)" : "transparent",
      }}
    >
      {label}
    </a>
  );
})}
```

Mobile drawer links:
```tsx
{NAV_LINKS.map(({ label, sectionId }) => {
  const isActive = activeSection === sectionId;
  return (
    <a
      key={label}
      href="#"
      onClick={() => setIsOpen(false)}
      style={{
        display: "block",
        padding: "14px 4px",
        fontSize: 16,
        fontWeight: 600,
        color: isActive ? "var(--brand)" : "var(--ink)",
        borderBottom: "1px solid var(--line-soft)",
      }}
    >
      {label}
    </a>
  );
})}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors. Fix any remaining `active` references if they appear.

- [ ] **Step 5: Commit**

```bash
git add src/components/Navbar.tsx
git commit -m "feat: refactor NAV_LINKS to use sectionId, add activeSection state"
```

---

### Task 3: Add IntersectionObserver scroll-spy

**Files:**
- Modify: `src/components/Navbar.tsx`

- [ ] **Step 1: Add `useEffect` import**

Make sure the import at the top of `Navbar.tsx` includes `useEffect`:

```tsx
import { useState, useEffect } from "react";
```

- [ ] **Step 2: Add the scroll-spy useEffect inside Navbar**

Add this block inside `export default function Navbar()`, after the state declarations:

```tsx
useEffect(() => {
  const sectionIds = NAV_LINKS.map((l) => l.sectionId);
  const elements = sectionIds
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null);

  const observer = new IntersectionObserver(
    (entries) => {
      // Find the intersecting entry whose top is closest to the navbar bottom
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length > 0) {
        setActiveSection(visible[0].target.id);
      }
    },
    {
      // rootMargin: pushes the "active zone" to be the strip between
      // the 80px navbar and the vertical midpoint of the viewport.
      // This means a section becomes active as its top enters that zone.
      rootMargin: "-80px 0px -50% 0px",
      threshold: 0,
    }
  );

  elements.forEach((el) => observer.observe(el));

  return () => observer.disconnect();
}, []);
```

- [ ] **Step 3: Verify scroll-spy in browser**

1. Open `http://localhost:5173`
2. Scroll slowly down the page
3. Watch the Navbar — the active tab (currently still the static background style) should switch as each section scrolls into the active zone
4. Open DevTools Console and confirm no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/Navbar.tsx
git commit -m "feat: add IntersectionObserver scroll-spy to Navbar"
```

---

### Task 4: Add scrollTo click handler and wire up nav links

**Files:**
- Modify: `src/components/Navbar.tsx`

- [ ] **Step 1: Add `scrollTo` helper inside Navbar**

Add this function inside `export default function Navbar()`, after the `useEffect`:

```tsx
function scrollTo(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
  setIsOpen(false);         // close mobile drawer
  setActiveSection(sectionId); // optimistic update before observer fires
}
```

- [ ] **Step 2: Wire desktop nav links to use scrollTo**

Update the desktop nav link map to call `scrollTo` on click. Change `href="#"` to `href="#"` (keep it, for semantics) and add `onClick`:

```tsx
{NAV_LINKS.map(({ label, sectionId }) => {
  const isActive = activeSection === sectionId;
  return (
    <a
      key={label}
      href="#"
      onClick={(e) => { e.preventDefault(); scrollTo(sectionId); }}
      style={{
        fontSize: 13,
        color: isActive ? "var(--ink)" : "var(--ink-3)",
        padding: "6px 12px",
        borderRadius: 6,
        fontWeight: 500,
        background: isActive ? "var(--line-soft)" : "transparent",
        cursor: "pointer",
        position: "relative",
      }}
    >
      {label}
    </a>
  );
})}
```

- [ ] **Step 3: Wire mobile drawer links to use scrollTo**

Update the mobile drawer link map:

```tsx
{NAV_LINKS.map(({ label, sectionId }) => {
  const isActive = activeSection === sectionId;
  return (
    <a
      key={label}
      href="#"
      onClick={(e) => { e.preventDefault(); scrollTo(sectionId); }}
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
```

- [ ] **Step 4: Verify click-to-scroll in browser**

1. Desktop: click each nav tab — confirm smooth scroll to the correct section
2. Mobile (DevTools → responsive, width <768px): open hamburger, tap a link — confirm smooth scroll AND drawer closes
3. Tablet (768–979px): hamburger is shown; same mobile test applies

- [ ] **Step 5: Commit**

```bash
git add src/components/Navbar.tsx
git commit -m "feat: add scrollTo click handler and wire nav links"
```

---

### Task 5: Add Framer Motion animated active pill on desktop

**Files:**
- Modify: `src/components/Navbar.tsx`

- [ ] **Step 1: Add Framer Motion import**

At the top of `Navbar.tsx`, add:

```tsx
import { motion } from "framer-motion";
```

- [ ] **Step 2: Replace desktop nav link `<a>` with relative wrapper + motion pill**

The active background currently comes from `background: isActive ? "var(--line-soft)" : "transparent"` on the `<a>` itself. Replace this with a wrapper that holds a `<motion.span>` pill underneath the label, so Framer can animate it between tabs:

```tsx
{NAV_LINKS.map(({ label, sectionId }) => {
  const isActive = activeSection === sectionId;
  return (
    <a
      key={label}
      href="#"
      onClick={(e) => { e.preventDefault(); scrollTo(sectionId); }}
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
      {isActive && (
        <motion.span
          layoutId="nav-pill"
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
      <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
    </a>
  );
})}
```

Key points:
- The `layoutId="nav-pill"` is the same string on all tabs — Framer recognises it as the same element and animates it between mounts
- `zIndex: -1` on the pill keeps it behind the text
- The label is wrapped in `<span style={{ position: "relative", zIndex: 1 }}>` so it sits above the pill

- [ ] **Step 3: Verify pill animation on desktop**

1. Open `http://localhost:5173` at ≥980px viewport width
2. Click each nav tab — the pill background should spring-slide between tabs
3. Scroll the page — the pill should also update as sections enter the viewport
4. Confirm no layout shift (the nav height stays 80px)

- [ ] **Step 4: Verify mobile is unaffected**

1. Resize to <768px
2. Open the drawer — no pill, active link is `var(--brand)` color only
3. Tap a link — drawer closes, page scrolls

- [ ] **Step 5: Commit**

```bash
git add src/components/Navbar.tsx
git commit -m "feat: add Framer Motion animated pill indicator to desktop navbar"
```

---

### Task 6: Responsiveness final check

**Files:** No code changes — verification only.

- [ ] **Step 1: Mobile (<768px)**
  - Hamburger menu visible, Contribute button hidden
  - Active link in drawer shows `var(--brand)` color
  - Tapping a link closes drawer and scrolls smoothly
  - Scroll-spy updates the active item in the drawer if it's re-opened mid-scroll

- [ ] **Step 2: Tablet (768–979px)**
  - Hamburger still shown (desktop nav links hidden)
  - Contribute button visible (`#btn-loc`)
  - Same drawer behavior as mobile

- [ ] **Step 3: Desktop (≥980px)**
  - Nav links visible, hamburger hidden
  - Pill slides smoothly between tabs
  - Logo at `height: 44px, width: auto` — no distortion
  - Sticky navbar stays at 80px, no layout shift during pill animation

- [ ] **Step 4: Scroll edge cases**
  - Scroll above `MapSection` (into HeroSection/StatsSection) — active tab stays on "Coverage Map" (first tab, no tab goes inactive)
  - Scroll to bottom (CommunitySection fully visible) — "Community" tab is active
  - Fast scroll — observer fires correctly, no stuck active state

- [ ] **Step 5: Final commit if any fixes applied**

```bash
git add -p
git commit -m "fix: responsiveness adjustments for navbar scroll-spy"
```

---

## Responsiveness Checklist Summary

| Breakpoint | Nav links | Hamburger | Active indicator |
|------------|-----------|-----------|-----------------|
| <768px     | Hidden    | Shown     | Brand color text in drawer |
| 768–979px  | Hidden    | Shown     | Brand color text in drawer |
| ≥980px     | Shown     | Hidden    | Framer Motion spring pill |
