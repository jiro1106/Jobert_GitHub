# Routing Design — SignalPH Frontend

**Date:** 2026-05-13  
**Scope:** Install React Router v7, wire up 3 routes, stub pages only. No login/report UI yet.

---

## Decision

React Router v7 (`react-router` package) with `createBrowserRouter`. Chosen over TanStack Router because:
- 3 simple routes, no complex URL state or typed search params needed
- Industry standard for Vite SPAs, 12M+ weekly downloads, stable
- TanStack Router's advantages (typed search params, loader data) are not yet needed

---

## Routes

| Path | Component | Access |
|------|-----------|--------|
| `/` | `HomePage` | Public |
| `/login` | `LoginPage` | Public |
| `/report` | `ReportPage` | Protected (redirect to `/login` if not authenticated) |

---

## Architecture

### Root Layout (`src/layouts/RootLayout.tsx`)
Renders the shared shell once for all routes:
- `StatusStrip` (top ticker)
- `Navbar`
- `<Outlet />` (page content injected here)
- `Footer`
- `MobileStickyBar`

`HomePage` currently wraps its own layout manually. After this change, `RootLayout` handles the shell and `HomePage` renders only its page content (no layout duplication).

### Router (`src/router/index.tsx`)
`createBrowserRouter` with the full route tree defined up front:

```tsx
createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/login', element: <LoginPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/report', element: <ReportPage /> },
        ],
      },
    ],
  },
])
```

### ProtectedRoute (`src/components/ProtectedRoute.tsx`)
Reads `isAuthenticated` (hardcoded `false` for now). If false, renders `<Navigate to="/login" replace />`. If true, renders `<Outlet />`. When real auth is implemented, only this boolean changes.

### App.tsx
Replaces `return <HomePage />` with `return <RouterProvider router={router} />`.

---

## Files Changed

| File | Change |
|------|--------|
| `package.json` | Add `react-router` dependency |
| `src/App.tsx` | Replace `<HomePage />` with `<RouterProvider router={router} />` |
| `src/router/index.tsx` | New — route definitions |
| `src/layouts/RootLayout.tsx` | New — shared shell |
| `src/components/ProtectedRoute.tsx` | New — auth guard |
| `src/pages/LoginPage.tsx` | New — stub only |
| `src/pages/ReportPage.tsx` | New — stub only |
| `src/pages/HomePage.tsx` | Remove layout wrapper imports (StatusStrip, Navbar, Footer, MobileStickyBar) — handled by RootLayout |

---

## Out of Scope

- Login UI, form, or auth logic
- Report form UI
- Real authentication (Supabase, JWT, etc.)
- Route-level code splitting / lazy loading
