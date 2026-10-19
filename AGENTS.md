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

6. **Backend-Driven Filtering & Search (Never Filter in Frontend)**:
   - NEVER perform client-side filtering (`.filter()`, `.find()`, etc.) in frontend memory on fetched collections for search queries or dropdown filters.
   - Always delegate filtering, searching, and status queries to backend API endpoints via query parameters (e.g. `?search=...`, `?execution_status=...`, `?is_active=...`, `?hackathon=...`).
   - Directly consume and render the backend's returned `results` and `stats`.

7. **Top-Bar Hackathon Edition Selector & Global Filtering**:
   - The top-right navbar must feature the global Hackathon Edition selector (fetching editions from `api.hackathons.getAll()`) instead of a Sign Out button (sign out is maintained in the sidebar user profile row).
   - The selected edition filters every API request dispatched across the admin panel via `?hackathon=<id>`.

8. **No Playful/Sparkle Icons (No Emoji-style Icons)**:
   - NEVER use `Sparkles` or playful star/sparkle/emoji-style icons for administrative statuses, KPI cards, or verification labels.
   - Always use clean, professional enterprise icons (e.g. `CheckCircle2`, `BadgeCheck`, `ShieldCheck`, `Clock`, `Shield`, `Award`).

9. **No Blinking or Pulsing Status Indicators**:
   - NEVER add blinking, pulsing, or pinging animations (`animate-pulse`, `animate-ping`) to status indicator dots, pills, or chips (e.g. for "Active", "Live", or "Verified").
   - Status dots and badges must remain solid and static (e.g. `<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />`) to maintain a clean, distraction-free interface.


