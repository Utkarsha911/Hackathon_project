---
name: admin-standards
description: >-
  Standard layout, design rules, and architectural guidelines for BIC Hackathon admin panel and frontend components.
---

# BIC Hackathon Frontend & Admin Standards

This skill documents mandatory conventions and UI rules established for the BIC Hackathon frontend codebase.

---

## 1. Page Header (Navbar) Standard

Every admin section must strictly follow the standardized header layout (identical to `UserManagement`):

```jsx
{/* Standard Header */}
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
  <div>
    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
      {Title}
    </h2>
    <p className="text-xs sm:text-sm text-slate-500 mt-1">
      {Subtitle}
    </p>
  </div>

  <div className="flex items-center gap-2.5 w-full sm:w-auto">
    <button
      type="button"
      onClick={handleAction}
      className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.99] transition-all cursor-pointer"
      style={{ backgroundColor: '#ea580c' }}
    >
      <Icon className="w-4 h-4" />
      <span>{Action Label}</span>
    </button>
  </div>
</div>
```

### Prohibitions for Headers:
- **NO boxed card wrapper**: Do not wrap headers inside `bg-white rounded-2xl p-6 border...`. Headers must sit cleanly directly on the page background.
- **NO category tags or dots**: Do not place upper labels (e.g. `Operations Center`, `Corporate Partners`) or colored pulsing dots above the `<h2>`.

---

## 2. No Refresh Buttons

- **NO manual refresh buttons**: Never include manual "Refresh" buttons (`RefreshCw`, `RefreshCcw`, or buttons with text "Refresh") in headers, toolbars, or action bars.
- Data fetching must occur automatically on component mount and immediately following any CRUD mutations (create, update, patch, delete).

---

## 3. Sidebar-Only View Navigation (No Duplicate In-Page Tabs)

- When an admin section contains sub-views that exist as child items in the sidebar dropdown (e.g. **Sponsor Management** with *Organizations*, *Sponsor Packages*, *Package Types*, *Sponsorship Breakdown*):
  - **Do NOT render horizontal in-page tab switchers**.
  - View navigation must occur **only by clicking on the sidebar items**.
  - The view state is controlled via URL query parameters (`?tab=...`), reading from `useSearchParams()`.
  - Provide individual search and filter bars inside each view rather than a shared global tab bar.

---

## 4. Backend Stats Consumption

- When backend endpoints return aggregated stats in the response:
  ```json
  {
    "count": 1,
    "next": null,
    "previous": null,
    "results": [...],
    "stats": {
      "total_items": 1,
      "active_items": 1,
      "inactive_items": 0
    }
  }
  ```
- Store the `stats` object in state (`setStats(res.stats)`) and display `total_items`, `active_items`, and `inactive_items` directly on the KPI cards.
- Do not fallback to raw array lengths when official backend `stats` are provided.

---

## 5. Visual Hierarchy & Theme

- **Primary Accent**: `#ea580c` (BIC Orange) with hover state `#d94e09`.
- **Borders & Dividers**: Slate borders `#e2e8f0` / `border-slate-200/80`.
- **Typography**: Dark Slate `#0f172a` for primary headings, `#334155` for body text, `#64748b` / `#94a3b8` for captions and metadata.
- **Modals**:
  - Always lock background scroll using `useBodyScrollLock(isAnyModalOpen)`.
  - Position modal backdrops with `fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4`.
- **Notifications**: Always use `showToast(message, 'success' | 'error')` from `useHackathon()`.
- **Media Paths**: Always pass media strings through `getMediaUrl(path)` to ensure proper prefixing with backend host `http://127.0.0.1:8000`.
- **Output Integrity**: Never dump raw JSON responses or extra filler texts into the user interface.

---

## 6. Admin Schedule Management & Role-Based Access Control (RBAC)

- **Endpoints**:
  - CRUD operations: `/api/v1/hackathons/admin/schedules/` (GET, POST, PUT, PATCH, DELETE)
  - Dedicated Execution Status Update: `/api/v1/hackathons/admin/schedules/{id}/update-status/` (PATCH)
    - Payload fields: `execution_status` (`not_evaluated` | `smooth` | `minor_issues` | `major_issues`) and `remarks`.
- **RBAC Visibility Rules**:
  - **Superusers**: Users with `is_superuser: true` bypass all group restrictions and must see all sections, views, and actions across the admin portal.
  - **Schedule Visibility**: Schedule Management (sidebar dropdown and routes `/admin-control-site/schedules`) must **only** be accessible to users who belong to the group `"admin schedules"` (or `"admin schedule"`). Non-superusers without this group must NOT see the dropdown or have access to the schedule view.
- **Frontend Presentation**:
  - Never display raw API response payloads or debug dumps on screen.
  - Display execution status with dedicated badges (`smooth` = Emerald, `minor_issues` = Amber, `major_issues` = Rose, `not_evaluated` = Slate).
  - Provide a modal trigger for `admin/schedules/update-status` on each schedule card/row.

---

## 7. Backend-Driven Filtering & Search (Never Filter in Frontend)

- **Strict Prohibition**: Never perform in-memory client-side filtering (`array.filter(...)`, etc.) on fetched datasets in frontend components for search terms, category filters, hackathons, or status selections.
- **Backend Delegation**: Always pass search queries and filter parameters directly to backend API endpoints:
  - Text search: Pass `?search=<term>` via query parameters (e.g. `api.sponsors.getAll({ search })`, `api.sponsors.getPackages({ search })`, `api.adminSchedules.getAll({ search })`).
  - Specific filters: Pass query parameters (e.g. `?hackathon=<id>`, `?execution_status=<status>`, `?is_active=true|false`, `?sponsor_type=<id>`).
- **Debounced Input**: For text search inputs, apply a debounce (e.g. 300–400ms) before dispatching the API request to prevent overwhelming the backend on every keystroke.
- **Direct Consumption**: Directly render the data and pagination/stats returned by the backend without running client-side filtering passes.

---

## 8. Top-Bar Hackathon Edition Selector & Global Filtering

- **Header Layout Requirement**: The top-right navbar header in `AdminLayout` replaces any manual Sign Out button with a global Hackathon Edition selector dropdown.
  - Sign Out is accessible exclusively via the sidebar user profile row at the bottom left.
  - The dropdown calls `api.hackathons.getAll({ skipHackathonFilter: true })` on mount and renders all hackathon editions (with version badge and `★ Active` indicator for `is_current: true`).
- **Global API Filtering**:
  - The selected edition ID is managed via `getSelectedAdminHackathon()` and `setSelectedAdminHackathon(id)` in `src/services/api.js`.
  - When active, GET requests dispatched from within the admin panel automatically append `?hackathon=<selected_id>` to all module endpoints (schedules, packages, teams, etc.).
  - When the user changes the selected hackathon, the client triggers `bic_admin_hackathon_changed` and clears the API cache so all active admin views automatically re-fetch data for the newly selected edition.

---

## 9. No Playful or Sparkle Emoji-style Icons

- **Strict Prohibition**: Never use `Sparkles` or cartoonish/playful star icons for administrative indicators, verification statuses, KPI cards, or forms.
- **Enterprise Icon Standard**: Always use clean, professional Lucide enterprise icons:
  - Verification: `CheckCircle2`, `BadgeCheck`, `ShieldCheck`
  - Pending / Evaluation: `Clock`, `Hourglass`, `HelpCircle`
  - Roles & Security: `Shield`, `KeyRound`, `Lock`
  - Milestones & Editions: `Trophy`, `Award`, `Layers`

---

## 10. No Blinking or Pulsing Status Indicators

- **Strict Prohibition**: Do not add blinking, pulsing, or pinging animations (`animate-pulse`, `animate-ping`) to status indicator dots, pills, chips, or badges (e.g. for "Active", "Live", "Verified", or "Operational").
- **Static Solid Indicators**: Status dots must be clean, solid, and static:
  `<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />`
  Animation (`animate-pulse`) is reserved exclusively for skeleton loaders (`bg-slate-200 animate-pulse`) when initial data is actively being fetched.
