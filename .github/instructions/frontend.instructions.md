---
name: "BIC Hackathon Frontend Standards"
description: "Use when building, modifying, reviewing, or styling React frontend pages, components, routes, state, API integrations, or admin UI in the BIC Hackathon frontend."
applyTo: "src/**"
---

# BIC Hackathon Frontend Developer Instructions

Maintain a consistent, accessible, production-ready React frontend for the BIC Hackathon platform. Follow the existing project architecture and reuse established components, services, hooks, and design patterns before adding new abstractions.

## 1. Technology and Architecture

- Use React with Vite and JavaScript/JSX as configured in `package.json`.
- Use `react-router-dom` for routing. Keep route definitions centralized in `src/router.jsx`.
- Use Zustand for shared client state through stores in `src/store/`.
- Use React Query through `@tanstack/react-query` for server-state caching, loading, mutations, and refetching.
- Keep HTTP access in `src/services/` and reuse the configured API client. Do not scatter raw `fetch` or Axios calls through presentation components.
- Reuse existing components from `src/components/common/` and existing hooks before creating duplicates.
- Keep public customer-facing pages and private admin pages consistent with their existing layout boundaries.
- Preserve existing authentication, hackathon selection, cache invalidation, and event-dispatch behavior.

## 2. Design System

- Use BIC Orange `#ea580c` for primary actions and important accents.
- Use `#d94e09` for hover states where an explicit hover color is needed.
- Use Slate colors for text and borders:
  - Primary text: `text-slate-900`
  - Body text: `text-slate-700`
  - Metadata: `text-slate-500` or `text-slate-400`
  - Borders: `border-slate-200` or `border-slate-200/80`
- Prefer the existing Tailwind utility style used throughout the project.
- Keep layouts responsive, especially at `sm`, `md`, and `lg` breakpoints.
- Use clear spacing, readable hierarchy, and consistent rounded corners. Avoid decorative visual noise.
- Do not introduce a new color palette, typography system, icon family, or component style without a documented reason.

## 3. Standard Admin Header

Every admin section must use an unboxed header directly on the page background:

```jsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
  <div>
    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
      {title}
    </h2>
    <p className="text-xs sm:text-sm text-slate-500 mt-1">
      {subtitle}
    </p>
  </div>

  <button
    type="button"
    className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.99] transition-all cursor-pointer"
    style={{ backgroundColor: '#ea580c' }}
  >
    <Icon className="w-4 h-4" />
    <span>{actionLabel}</span>
  </button>
</div>
```

- Never put this header inside a white card.
- Do not add uppercase category labels, decorative dots, or pulsing indicators above the heading.
- Do not add manual refresh buttons. Data must load on mount and after CRUD mutations.

## 4. Admin Navigation and Global Filtering

- Use sidebar navigation for admin module switching.
- Do not add duplicate horizontal tabs when equivalent views already exist in the sidebar.
- Use URL search parameters such as `?tab=...` for sidebar-controlled subviews.
- The top-right admin navbar must use the global Hackathon Edition selector, not a Sign Out button.
- Sign Out belongs in the sidebar user profile row.
- Preserve the selected admin hackathon behavior from `src/services/api.js`.
- All admin API requests must respect the selected hackathon filter.
- Do not implement search, status, category, or hackathon filtering with in-memory array operations. Send filters to the backend as query parameters and render the returned results directly.
- Debounce text searches before issuing requests.

## 5. Data and API Handling

- Consume backend response structures directly, including `results`, pagination fields, and official `stats`.
- When present, render `stats.total_items`, `stats.active_items`, and `stats.inactive_items` in KPI cards. Do not replace them with array lengths.
- Show loading, empty, and error states explicitly.
- Surface API failures using the project’s toast/error conventions; do not silently swallow errors or show success-shaped fallback data.
- Keep API response mapping in services or hooks when it is reusable.
- Never render raw JSON responses, debug dumps, tokens, or internal error objects to users.
- Pass media paths through `getMediaUrl()` before rendering images or other backend media.

## 6. State Management

- Use local React state for state limited to one component.
- Use Zustand for cross-page client state such as authentication user state, navigation state, and toast state.
- Use React Query for fetched collections, server state, cache invalidation, and mutations.
- Do not add a new React Context when an existing Zustand store or React Query cache is the appropriate solution.
- If changing a shared store, preserve existing selectors, action names, persistence behavior, and event integrations unless the migration updates every consumer.
- Keep derived values derived; do not duplicate them in state unless there is a clear synchronization requirement.

## 7. Modals, Forms, and Notifications

- Lock document scrolling with `useBodyScrollLock` whenever a modal is open.
- Use existing modal, card, button, form, and toast components where possible.
- Validate required form fields before submitting.
- Disable submit actions while a mutation is pending and prevent duplicate submissions.
- Show success and error feedback with `showToast(message, 'success' | 'error')`.
- Keep destructive actions explicit and require confirmation where the existing UX does so.

## 8. Icons and Statuses

- Use professional Lucide icons such as `CheckCircle2`, `BadgeCheck`, `ShieldCheck`, `Clock`, `Shield`, `Award`, `Trophy`, and `Layers`.
- Never use `Sparkles`, emoji-style icons, or playful stars for admin statuses, KPI cards, or verification labels.
- Never use `animate-pulse` or `animate-ping` on status dots, badges, chips, or live indicators.
- Status indicators must be static and visually distinguishable.

## 9. Accessibility and Interaction

- Use semantic HTML and accessible labels for inputs, buttons, dialogs, and navigation.
- Use `button` for actions and links/navigation elements for navigation.
- Preserve keyboard focus behavior and visible focus states.
- Provide meaningful `alt` text for informative images; use empty alt text for decorative images.
- Do not rely on color alone to communicate status.
- Keep touch targets usable on small screens.

## 10. Implementation and Validation

- Make surgical changes and avoid unrelated refactors.
- Search for existing prior art before adding logic or components.
- Keep JSX readable and avoid unnecessary comments.
- Preserve existing behavior unless the task explicitly changes it.
- Run the smallest relevant validation command after changes; use `npm run build` for route, component, or configuration changes when no narrower test exists.
- Do not commit generated build output, secrets, credentials, or environment-specific values.
