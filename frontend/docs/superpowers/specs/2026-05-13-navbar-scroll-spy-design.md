# Navbar Scroll-Spy & Smooth Scroll Design

**Date:** 2026-05-13  
**Branch:** karl/frontend/mapsection  
**Status:** Approved

---

## Goal

Connect the four Navbar tabs (Coverage Map, Providers, Use Cases, Community) to their corresponding landing page sections, with smooth scrolling on click and an active tab that updates automatically as the user scrolls. Mobile drawer must close on navigation and active state must be reflected there too.

---

## Sections & IDs

Each section file receives an `id` on its root `<section>` element:

| Nav label    | Section file                    | `id`           |
|--------------|---------------------------------|----------------|
| Coverage Map | `MapSection.tsx`                | `coverage-map` |
| Providers    | `ProviderScoreboardSection.tsx` | `providers`    |
| Use Cases    | `UseCasesSection.tsx`           | `use-cases`    |
| Community    | `CommunitySection.tsx`          | `community`    |

---

## Navbar Changes (`Navbar.tsx`)

### NAV_LINKS update

Replace the static `active: boolean` flag with a `sectionId: string` field:

```ts
const NAV_LINKS = [
  { label: "Coverage Map", sectionId: "coverage-map" },
  { label: "Providers",    sectionId: "providers" },
  { label: "Use Cases",    sectionId: "use-cases" },
  { label: "Community",   sectionId: "community" },
];
```

### State

```ts
const [activeSection, setActiveSection] = useState("coverage-map");
```

### Scroll-spy (IntersectionObserver)

A single `useEffect` registers one `IntersectionObserver` that watches all 4 section elements simultaneously.

- `threshold: 0` — fires as soon as any part of the section enters/exits the viewport
- `rootMargin: "-80px 0px -50% 0px"` — the "active zone" is the strip from the navbar bottom to the vertical midpoint of the viewport; whichever section's top enters that zone becomes active
- On intersection, pick the entry with `isIntersecting: true` whose `boundingClientRect.top` is closest to (but below) the navbar bottom — this is robust for both short and very tall sections (e.g. MapSection with 500px map on mobile)

The observer is disconnected on cleanup.

### Click handler

```ts
function scrollTo(sectionId: string) {
  document.getElementById(sectionId)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
  setIsOpen(false); // close mobile drawer
  setActiveSection(sectionId); // optimistic update
}
```

Called by both the desktop nav links and mobile drawer links via `onClick`.

---

## Active Tab Indicator

### Desktop

A `<motion.span>` with `layoutId="nav-pill"` is absolutely positioned behind the active link label. Uses Framer Motion layout animation (spring physics) to slide between tabs as `activeSection` changes.

```tsx
{isActive && (
  <motion.span
    layoutId="nav-pill"
    className="absolute inset-0 rounded-md bg-[var(--line-soft)]"
    transition={{ type: "spring", stiffness: 400, damping: 35 }}
  />
)}
```

Each nav link wrapper gets `position: relative` and `overflow: visible`.

### Mobile drawer

Active link color switches to `var(--brand)` — the existing pattern, no pill needed. On tap, the drawer closes via `setIsOpen(false)` inside `scrollTo`.

---

## Responsiveness Checklist

- [ ] Desktop (≥980px): pill indicator visible, hamburger hidden
- [ ] Tablet (768–979px): `btn-loc` (Contribute) visible, hamburger shown, no pill
- [ ] Mobile (<768px): drawer opens/closes, active link highlighted in brand color, closes on tap
- [ ] Sticky navbar offset (80px) applied in IntersectionObserver rootMargin
- [ ] No layout shift when pill animates between tabs

---

## Files Changed

1. `src/sections/landing/MapSection.tsx` — add `id="coverage-map"` to `<section>`
2. `src/sections/landing/ProviderScoreboardSection.tsx` — add `id="providers"` to `<section>`
3. `src/sections/landing/UseCasesSection.tsx` — add `id="use-cases"` to `<section>`
4. `src/sections/landing/CommunitySection.tsx` — add `id="community"` to `<section>`
5. `src/components/Navbar.tsx` — scroll-spy logic, click handler, Framer pill indicator

---

## Out of Scope

- URL hash updates (e.g. `/#providers`) — not needed for v1
- Animated section entrance transitions on scroll — separate task
- HeroSection and StatsSection are not in the nav (intentional, they sit above the tabbed content)
