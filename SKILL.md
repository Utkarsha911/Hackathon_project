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

- When an admin section contains sub-views that exist as child items in the sidebar dropdown (e.g. **Sponsor Management** with *Sponsors Directory*, *Sponsor Packages*, *Package Types*, *Sponsorship Breakdown*):
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
