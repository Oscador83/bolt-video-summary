# Plan — next iteration

## 1. Top-bar layout fix
Move **Recent** dropdown and **theme toggle** into the top-right of the first (controls) card, sitting on the same row as the length options. The empty band above the controls disappears; controls card becomes the topmost element.

## 2. Default theme = light
Light mode loads by default. User's choice still persists in localStorage.

## 3. URL input — true empty placeholder
Replace the pre-filled `value` with a real `placeholder` attribute. Field is empty on load; placeholder disappears on focus/typing — no need to click left of the box.

## 4. Drag-and-drop YouTube URL onto the input
Make the input + surrounding card a drop zone:
- Accept `text/uri-list` and `text/plain` from drag events.
- Extract a YouTube URL (reuse existing `extractVideoId` regex/parse).
- Visual highlight on drag-over (dashed accent border).
- On valid drop: auto-fill the input. (Auto-submit is **off** by default — easier to undo a wrong drop.)
- Works cross-window today: dragging a YT thumbnail or the tab itself from another window/screen will hand over the URL.

## 5. Recent history — cap at 10, dedupe by videoId
Newest first; if a videoId is already in the list, move it to the top instead of duplicating.

## 6. Visual summary viewer — proper modal
Replace current "open in new window" with an in-app modal:
- Backdrop dim + close on ✕ button, click-outside, or Esc.
- Pan by pointer drag (mouse / touch).
- Zoom with wheel and pinch (clamped 0.25× – 8×).
- "Open in new tab" stays as a secondary action for second-screen use.
- Detail slider (*simple / medium / detailed*) keeps current 3 levels — just refined prompts so *detailed* truly pushes a dense mind-map-style infographic. With zoom available, legibility ceiling is higher.

## 7. OSVidSum signature
Tiny footer micro-mark, centered or right-aligned at the bottom of the page:
- Monogram glyph (inline SVG, ~16px): interlocked `O` + `S`, with the S's curve subtly suggesting a play triangle. Muted gold stroke (`oklch(0.78 0.13 85)`).
- Wordmark beside it: `OSVidSum` in thin uppercase tracked text. `OS` in muted gold, `VidSum` in `muted-foreground`.
- Works in both light and dark themes (gold token defined once in `styles.css`).

## 8. Model labels — centralize
Create `src/lib/models.ts` exporting `TEXT_MODEL_ID`, `TEXT_MODEL_LABEL`, `IMAGE_MODEL_ID`, `IMAGE_MODEL_LABEL`. Both server functions and the UI import from this single file. Changing models in 2 months = edit one file.

## 9. Dormant "check for newer models" reminder
On app load, read `lastModelCheckAt` from localStorage.
- If missing → set to today.
- If older than 60 days → show a small dismissible banner: *"It's been 2 months since we last checked for newer AI models. Ask the assistant if there are better options."*
- Dismiss = update timestamp to today. Zero backend.

## 10. Friendlier transcript-error message + client-side fallback (best-effort)
- Detect the YouTube "Transcript is disabled / blocked" error pattern.
- Show a friendlier message: *"YouTube is temporarily blocking transcript requests from our server. This usually clears up in a few minutes — try again shortly."*
- **Best-effort fallback**: when server-side fetch fails with that specific error, try fetching the transcript client-side via a small list of public CORS proxies (e.g. `corsproxy.io`, `r.jina.ai`). If any succeeds, send the transcript text to the existing `summarizeVideo` server fn (new variant accepting a pre-fetched transcript). Clearly flagged as fallback; if all proxies fail, show the friendlier error.

---

## Out of scope (parked for later, on purpose)
- Mermaid / SVG "diagram mode" as a second visual-summary type.
- Browser extension + cursor-mode + "click-a-video-to-summarize" flow (drag-and-drop in item 4 is the first step toward this).
- Desktop app packaging.
- Auto-updating model IDs.

---

## Technical notes
- **Files touched**: `src/routes/index.tsx` (layout, drop zone, modal, banner, footer, recent dedupe, placeholder), `src/lib/api/summarize.functions.ts` (accept pre-fetched transcript, friendlier error), `src/lib/models.ts` (new), `src/styles.css` (gold token).
- **No new dependencies**. Modal/pan/zoom built with native pointer events + CSS transforms. CORS proxies are plain `fetch` calls.
- **No backend / DB changes**. Everything client-side + existing server fns.
- **Drag-and-drop**: uses standard HTML5 DnD API, no library needed.

---

Ready to build when you approve. Say if you want to drop any item (e.g. the CORS-proxy fallback if you'd rather wait) or add anything I missed.