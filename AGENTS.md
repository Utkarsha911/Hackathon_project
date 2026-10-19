# Agent Rules: BIC Hackathon Frontend Guidelines

These rules are unconditionally active for all operations in this workspace:

1. **Header Layout Standard**:
   - All admin sections must use the standard unboxed flex header:
     `<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">`
     - Left: `h2` (`text-xl sm:text-2xl font-bold tracking-tight text-slate-900`) and subtitle `p` (`text-xs sm:text-sm text-slate-500 mt-1`).
     - Right: Orange action button (`#ea580c`) with icon (`w-4 h-4`) and shadow.
   - Do NOT wrap headers in white cards or add upper uppercase tags/dots.

2. **No Refresh Buttons**:
   - NEVER add manual refresh buttons in headers, tables, or cards.
   - Data loads automatically on mount and after CRUD operations.

3. **Sidebar-Only View Switching**:
   - Do NOT render duplicate horizontal in-page tabs for modules that have dropdown items in the sidebar.
   - Use URL search parameters (`?tab=...`) driven exclusively by sidebar clicks.

4. **Consume Backend Stats**:
   - Always extract `"stats": { "total_items", "active_items", "inactive_items" }` from API responses and render them on KPI stat cards.

5. **Design System**:
   - Accent color: `#ea580c` (BIC Orange).
   - Modal scroll lock: always apply `useBodyScrollLock`.
   - Media URLs: always wrap paths with `getMediaUrl()`.
   - Never output raw JSON API responses.
