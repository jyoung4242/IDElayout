# ExcaliburIDE — Session Handoff: Panel Visibility

## Project Overview

A modular, IDE-style editor framework for ExcaliburJS built with:

- **Vite** (standalone app, not embedded in a game project)
- **Lit** web components with shadow DOM
- **Tailwind v4** (CSS-first, `@import 'tailwindcss'`) with `@apply` in each component's `static styles`
- **TypeScript** throughout

The spec lives in two documents: `ide.md` (core architecture) and `dev.md` (mock content system).

---

## Project Structure

```
src/
  types/
    layout.ts                   ← all TS interfaces (LayoutNode, SplitNode, PanelHostNode, PanelTabNode, WorkspaceLayout)
  styles/
    theme.css                   ← Tailwind v4 import + CSS custom properties
    shared.ts                   ← sharedStyles CSSResult (?inline import), spread into every component
  components/
    editor-app.ts               ← root shell, owns WorkspaceLayout state
    editor-header.ts            ← top bar, File menu, Play/Stop, save status
    editor-status.ts            ← bottom status bar, fps, branch, save time
    split-pane.ts               ← recursive layout engine
    panel-host.ts               ← tab-aware container, mounts content via MountDirective
    panel-tab-bar.ts            ← tab strip, fires tab-change / tab-close events
  registry/
    component-registry.ts       ← singleton EditorComponentRegistry class
    register-mock-components.ts ← registers all mock components at startup
    index.ts                    ← barrel export
  persistence/
    layout-storage.ts           ← localStorage read/write, JSON export/import
    persistence-manager.ts      ← singleton, owns save/backup schedule, file I/O
    index.ts                    ← barrel export
  mock/
    mock-viewport.ts            ← fake scene viewport
    mock-console.ts             ← fake log output
    mock-tree.ts                ← fake scene hierarchy
    default-layout.ts           ← initial WorkspaceLayout tree used on first load
  main.ts                       ← imports theme.css, register-mock-components, editor-app
index.html
vite.config.ts                  ← @tailwindcss/vite plugin required
```

---

## Key Architecture Decisions

### Layout Tree

The workspace is a recursive serializable tree of `LayoutNode` (either `SplitNode` or `PanelHostNode`). `WorkspaceLayout` wraps the
root node with version and metadata.

```ts
type LayoutNode = SplitNode | PanelHostNode;

interface SplitNode extends LayoutNodeBase {
  type: "split";
  orientation: "horizontal" | "vertical";
  children: LayoutNode[];
  sizes: number[];
  minSizes?: number[];
  maxSizes?: number[];
  dividerSize?: number;
}

interface PanelHostNode extends LayoutNodeBase {
  type: "panel-host";
  tabs: PanelTabNode[];
  activeTabId?: string;
  titleBar?: boolean;
  closable?: boolean;
  collapsible?: boolean;
  collapseToward?: "start" | "end";
}

// LayoutNodeBase carries both visibility flags:
interface LayoutNodeBase {
  id: string;
  type: LayoutNodeType;
  visible?: boolean; // false = removed from layout flow entirely, no footprint
  collapsed?: boolean; // true = stays in tree, shows minimal strip, preserves size
  metadata?: Record<string, unknown>;
}
```

### Event Flow

Layout mutations bubble upward as `layout-change` CustomEvents (composed, bubbling). Each `split-pane` intercepts child events, merges
the updated node into its own children array, and re-emits. `editor-app` receives the complete root `LayoutNode` and rebuilds
`WorkspaceLayout`.

```
panel-host → layout-change (PanelHostNode)
  → caught by renderLeaf wrapper in parent split-pane
    → re-emitted upward
      → onChildLayoutChange merges into SplitNode children
        → re-emitted upward
          → editor-app receives complete root ✓
```

### Component Registry

Singleton `componentRegistry` maps tag strings to `ComponentDefinition`:

```ts
interface ComponentDefinition {
  tag: string;
  factory: () => HTMLElement;
  defaultProps?: Record<string, unknown>;
  collapsible?: boolean;
  defaultCollapseToward?: "start" | "end";
  meta: { title; icon; category; description? };
}
```

### Tailwind + Shadow DOM

`src/styles/shared.ts` uses Vite's `?inline` suffix to import the compiled Tailwind CSS as a string:

```ts
import tailwindStr from "./theme.css?inline";
export const sharedStyles = unsafeCSS(tailwindStr);
```

Every component spreads `sharedStyles` into its `static styles` array.

### Persistence

- **Explicit save**: `Ctrl+S` or File → Save Layout → `localStorage` key `excalibur-ide:layout`
- **Periodic backup**: every 60s → `localStorage` key `excalibur-ide:layout-backup`
- **Export**: downloads `.json` file via blob URL
- **Import**: file input picker, validates schema before applying
- **Load order**: tries primary save first, falls back to backup, then `defaultLayout`

---

## What Is Working

- [x] Recursive split layout with drag-to-resize dividers
- [x] Horizontal and vertical splits, arbitrarily nested
- [x] Panel hosts with tab bars
- [x] Tab switching, tab close, dirty indicators, pinned tabs
- [x] Component registry with factory + defaultProps + collapse config + display metadata
- [x] MountDirective for stable element mounting in shadow DOM
- [x] Mock components: mock-viewport, mock-console, mock-tree
- [x] editor-header with File menu (Save, Export, Import, Reset)
- [x] editor-status with fps counter, branch, warnings, last saved time
- [x] Play/Stop toggle wired through header → editor-app → status
- [x] Persistence: localStorage save/backup, JSON export/import, restore on reload
- [x] Ctrl+S keyboard shortcut
- [x] Save status flash in header and status bar
- [x] **Panel collapse** — divider chevron button + double-click divider to collapse/expand
- [x] **Collapsed strip rendering** — icon + rotated title (vertical splits only) + expand button
- [x] **Flex renormalization** — siblings correctly fill freed space when a panel collapses
- [x] **Collapse persistence** — `collapsed` flag serializes/restores automatically with layout

---

## Completed Feature: Collapse

### How it works

Two flags exist on every `LayoutNode` via `LayoutNodeBase`:

- `collapsed?: boolean` — panel stays in tree, shrinks to a 32px strip, preserves its `sizes` entry for restore
- `visible?: boolean` — **not yet implemented** (next feature)

`PanelHostNode` also carries:

- `collapsible?: boolean` — whether this panel can be collapsed at all
- `collapseToward?: "start" | "end"` — which direction the panel collapses, used by `split-pane` to determine which divider owns the
  collapse button

### Key implementation details

**`split-pane.ts`**

- `getCollapsibleSide(split, dividerIndex)` — determines which child a divider can collapse. Only requires the _collapsing_ side to be
  a `PanelHostNode`; the absorbing sibling can be any node type (fixes left panel collapse where center is a `SplitNode`).
- `computeChildStyle(split, index)` — collapsed children get `flex: 0 0 32px`; non-collapsed children have their sizes renormalized
  against the sum of non-collapsed siblings' sizes only, so freed space is properly redistributed.
- Chevron button on dividers: visible on hover, always visible when adjacent panel is collapsed. Uses filled triangle characters
  (`▲`/`▼`/`‹`/`›`) for legibility.
- Double-click on divider track also triggers collapse toggle.

**`panel-host.ts`**

- Accepts `orientation: "horizontal" | "vertical"` attribute from parent `split-pane`.
- When `node.collapsed === true`, renders a collapsed strip instead of normal tab bar + content.
- Strip class is the _inverse_ of parent orientation: horizontal parent → `"vertical"` strip (narrow column, title rotated); vertical
  parent → `"horizontal"` strip (short bar, title normal).
- Title rotation uses `writing-mode: vertical-rl` + `rotate(180deg)` for correct flex + overflow behavior.
- Clicking strip or expand button emits `layout-change` with `collapsed: false`.

---

## Next Feature: Panel Visibility

### What the spec says

```ts
visible?: boolean  // false = removed from layout flow entirely, no footprint
```

Unlike `collapsed` (which keeps the panel in the tree as a strip), `visible: false` means the panel takes up **zero space** — no strip,
no divider, nothing. From the layout engine's perspective the node is temporarily gone.

### What needs building

**1. Size redistribution on hide**

When a `PanelHostNode` becomes invisible, its sibling(s) must absorb its proportional sizes. Unlike collapse (which uses a fixed 32px
strip and renormalizes flex), hiding should redistribute the hidden panel's `sizes` entry back into the remaining siblings so the
proportions stay meaningful for restore.

Two strategies to consider:

- **Redistribute on hide**: add the hidden panel's size proportionally to siblings at hide time, restore from saved size on show.
  Simpler, but requires storing the pre-hide size somewhere.
- **Filter + renormalize at render time**: keep sizes unchanged, just skip hidden children in the flex calculation (similar to the
  collapse renormalization). Cleaner, no extra storage needed.

The render-time filter approach is recommended — it's consistent with how collapse works and requires no extra mutation.

**2. `split-pane` rendering**

Hidden children should be skipped entirely in `renderSplit` — no `<div class="child">`, no divider. This is different from collapse
where the child div still renders at 32px.

Divider rendering also needs care: if child `i` is hidden, the divider between `i-1` and `i` (or `i` and `i+1`) should not render
either. The cleanest approach is to build the visible children list first, then interleave dividers between them.

**3. Show/hide UI**

Unlike collapse (which lives on the divider), show/hide needs a separate trigger surface since the panel has no footprint when hidden.
Candidates:

- A **View menu** in `editor-header` listing all registered panels with checkboxes
- A **context menu** on the tab bar
- Both (View menu for global toggle, context menu for convenience)

The View menu approach is more discoverable and consistent with standard IDE conventions.

**4. `editor-header` View menu**

`editor-header` doesn't currently have access to the full layout tree — it only knows play state and save status. To power a View menu
it needs either:

- The full `WorkspaceLayout` passed down as a property (simplest)
- A separate flat list of panels passed down
- A custom event query pattern (over-engineered for this use case)

Passing the layout down is recommended. `editor-app` already owns it.

**5. Persistence**

`visible` is already on `LayoutNodeBase` so it serializes automatically. No extra persistence work needed.

### Suggested implementation order

1. Update `split-pane.renderSplit` to skip hidden children and their adjacent dividers — build a filtered visible-children list before
   mapping to elements
2. Update `computeChildStyle` (or its replacement) to renormalize sizes across visible non-collapsed children only
3. Add `WorkspaceLayout` property to `editor-header`
4. Add View menu to `editor-header` listing all `PanelHostNode`s in the tree (needs a tree-walk utility)
5. View menu toggle emits a new `panel-visibility-change` CustomEvent (or reuses `layout-change` with the full updated tree —
   consistency favors `layout-change`)
6. `editor-app` handles the event, walks the tree to find the panel by id, toggles `visible`, rebuilds layout
7. Test persistence round-trip (hide → save → reload → still hidden)

### Open questions for next session

- Should hiding a panel with all siblings also hidden be prevented, or allowed (leaving an empty split)?
- Should the View menu show panels by their tab title or their component registry title?
- When a panel is re-shown after being hidden, should it restore to its original `sizes` position or always append to end? (Render-time
  filter approach restores position automatically.)
- Should `visible: false` be allowed on `SplitNode` as well, or only `PanelHostNode`? (Hiding an entire split subtree could be useful
  but adds complexity.)
- Should there be a keyboard shortcut to toggle panel visibility (e.g. matching VS Code's `Ctrl+B` for sidebar)?

---

## CSS Custom Properties (theme.css)

```css
--editor-bg, --editor-bg2, --editor-bg3
--editor-surface, --editor-surface2, --editor-surface3
--editor-border, --editor-border2
--editor-text, --editor-text2, --editor-text3
--editor-accent, --editor-accent2
--editor-divider: 4px
--editor-tab-h: 32px
--editor-header-h: 40px
--editor-status-h: 24px
```

---

## Known Issues / Tech Debt

- `panel-host.renderContent()` uses `document.createElement` via registry — reactive prop updates to mounted components require
  `Object.assign` refresh on each render cycle, not true Lit reactivity
- File menu in `editor-header` uses `@blur` + `setTimeout` to close — not robust for all interaction patterns, should be replaced with
  a click-outside directive
- Tab overflow (many tabs) has no overflow handling yet — tab bar scrolls but no overflow menu
- `editor-status` listens for `play-state-change` via `getRootNode()` — fragile if component moves in the tree; should use Lit context
  instead
- No ARIA roles on split panes yet (spec calls for `aria-split-pane` semantics)
