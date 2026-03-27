# ✏️ Tiptap Track Changes Editor

A lightweight, inline track changes editor built with **Tiptap v3** and **React** — inspired by Microsoft Word's review mode. Type to create insertions, press Backspace/Delete to mark deletions, and hover any change to accept or reject it.

![Track Changes Demo](https://img.shields.io/badge/Status-Working_Demo-brightgreen) ![React](https://img.shields.io/badge/React-19-blue) ![Tiptap](https://img.shields.io/badge/Tiptap-3.x-purple) ![Vite](https://img.shields.io/badge/Vite-8-yellow)

---

## Features

- **Inline tracked insertions** — new text appears highlighted in green with a bottom border
- **Inline tracked deletions** — deleted text stays visible with red strikethrough instead of being removed
- **Hover to review** — floating accept/reject pill appears below the change (Word-style positioning)
- **Sidebar panel** — lists all pending changes with per-change accept/reject buttons
- **Accept All / Reject All** — bulk actions from the toolbar
- **Markup toggle** — switch between tracked markup view and clean final view
- **Smart change grouping** — consecutive keystrokes share a single `changeId` with zero debouncing
- **Paste support** — pasted text is automatically tracked as an insertion
- **Rich text toolbar** — bold, italic, underline, lists, undo/redo

## How It Works

The core architecture avoids `appendTransaction` (which fires per-keystroke and creates per-character changes). Instead, it uses three ProseMirror plugin hooks:

| Hook | Purpose |
|------|---------|
| `handleTextInput` | Intercepts typing **before** ProseMirror processes it. Inserts text with an `insertion` mark. Uses `findMarkAttributesNearRange()` to check if there's an adjacent insertion — if yes, inherits its `changeId` so consecutive typing is always one change. |
| `handleKeyDown` | Intercepts Backspace/Delete. Instead of removing text, applies a `deletion` mark (red strikethrough). If the target is already a tracked insertion, removes it entirely. |
| `handlePaste` | Intercepts paste events and routes pasted text through the same insertion logic. |

This is the same approach used by production track-changes implementations — no timers, no debouncing, no diffing.

## Project Structure

```
src/
├── extensions/
│   ├── InsertionMark.js          # Tiptap Mark for tracked insertions
│   ├── DeletionMark.js           # Tiptap Mark for tracked deletions
│   └── TrackChangesBehavior.js   # ProseMirror plugin (handleTextInput, handleKeyDown, handlePaste)
├── utils/
│   └── trackChangeUtils.js       # Pure functions: findChangeRange, findMarkAttributesNearRange, etc.
├── components/
│   └── TrackChangesEditor.jsx    # Main editor component with toolbar, sidebar, floating menu
├── index.css                     # All styles
├── App.jsx
└── main.jsx
```

## Getting Started

```bash
# Clone the repo
git clone https://github.com/pawansoni007/tiptap_track_changes.git
cd tiptap-track-changes

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
```

Output goes to `dist/`. You can preview the production build with:

```bash
npm run preview
```

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tiptap/react` | 3.x | React bindings for Tiptap |
| `@tiptap/starter-kit` | 3.x | Basic editor extensions (paragraphs, bold, italic, lists, history) |
| `@tiptap/pm` | 3.x | ProseMirror state, Plugin, PluginKey |
| `@tiptap/extension-underline` | 3.x | Underline formatting |
| `react` | 19.x | UI |
| `vite` | 8.x | Build tool |

## How Accept/Reject Works

| Action | Insertion Mark | Deletion Mark |
|--------|---------------|---------------|
| **Accept** | Remove the mark, keep the text (it becomes normal text) | Delete the text entirely (the deletion is confirmed) |
| **Reject** | Delete the text entirely (the insertion is undone) | Remove the mark, keep the text (the deletion is undone) |

## Extending This

**Add author names:** The mark attributes already have a `createdAt` field. Add an `author` field to `createChangeAttributes()` and display it in the floating menu.

**Persist to backend:** Hook into Tiptap's `onUpdate` callback, grab `editor.getJSON()`, and POST it to your API. The tracked marks serialize cleanly to JSON.

**Real-time collaboration:** Pair with Yjs or Hocuspocus. The marks travel with the document structure, so CRDT sync works naturally.

**Comments:** Add a third mark type (`comment`) with the same pattern — a ProseMirror mark with a `commentId` attribute, rendered as a highlight.

## License

MIT

---

Built with [Tiptap](https://tiptap.dev) and [Vite](https://vite.dev).
