## Plan — UX polish pass

### 1. Keep pasted URL after error or success
- Stop wiping the input on summarize failure. The input value is independent of the card's `text`/`textError` state — only clear it when the user clears it.
- On success: also keep the URL in the input (in both single and multi mode). User can manually clear or paste a new one to replace.
- In **single mode**, pasting/dropping a NEW (different) URL replaces the current card and auto-scrolls to top; same URL = no-op.

### 2. Stop button with progress icon
- While `textStatus === "loading"`: the Summarize button becomes a Stop button showing a spinning `Loader2` icon (lucide, `animate-spin`) next to the "Stop" label.
- Click → `AbortController.abort()` → status returns to `idle`, input untouched.

### 3. Replace toggle labels
- "Auto-summarize on paste/drop" → a small `Zap` icon-only button (lucide). Tooltip: *"Auto-summarize on paste or drop"*. Filled/gold tint when ON, muted outline when OFF.
- Both "Auto" and "Multi-summary" become **toggle buttons** (shadcn `Toggle`) instead of checkboxes — Zap icon for auto, `Layers` icon + "Multi" label for multi-summary. More compact, more tactile.

### 4. Single-mode bottom box (restore old behavior)
- The bottom "Add another video" input remains visible **in single mode too**.
- In single mode: pasting / button-click in the bottom box replaces the current (only) card and smooth-scrolls to top.
- In multi mode: appends a new card (current behavior).
- Header text adapts: *"Summarize another video"* (single) vs *"Add another video"* (multi).

### 5. Collapsible chat history
- Default state for each card's chat: only the latest exchange (last user + last assistant) is fully expanded.
- All prior messages render as one-line previews (truncated, muted) with a chevron to expand that single message.
- A small **"Expand all / Collapse all"** link sits above the chat list when there are >1 prior exchanges.
- State is in-memory only (resets on reload) to avoid bloating persisted session.

### 6. Per-card Clear button (multi mode)
- Already in the spec but verify each card header has a visible `✕` Clear button.
- Tooltip *"Remove this summary"*. Confirm dialog only if the card has chat history or a generated image; otherwise remove silently.

### 7. Long title overflow
- Truncate the displayed title with CSS (`truncate` + `max-w`) so the row never pushes the right-side buttons off-screen.
- Full title available via `title=` attribute (native tooltip) and inside the saved HTML.
- Card header layout: `flex items-center min-w-0 gap-2` with title in a `min-w-0 flex-1 truncate` span and action buttons in a `shrink-0` group.

---

## Files touched
- `src/routes/index.tsx` — input persistence on error/success; Stop button with `Loader2`; Toggle components for Auto/Multi; bottom-box behavior branching on `multiMode`; collapsible chat UI; per-card Clear confirmation; title truncation classes.
- No new files, no new deps (lucide `Zap`, `Layers`, `Loader2`, `ChevronDown` already available; shadcn `Toggle` already in components).

No backend, schema, or server-function changes.
