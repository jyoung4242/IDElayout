# ExcaliburIDE — Session Handoff

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

interface SplitNode {
  type: "split";
  orientation: "horizontal" | "vertical";
  children: LayoutNode[];
  sizes: number[]; // proportional 0–1, sum to 1
  // + visible?, collapsed?, minSizes?, maxSizes?, dividerSize?
}

interface PanelHostNode {
  type: "panel-host";
  tabs: PanelTabNode[];
  activeTabId?: string;
  // + visible?, collapsed?, titleBar?, closable?
}

interface PanelTabNode {
  id: string;
  title: string;
  componentTag?: string; // registry key
  componentProps?: Record<string, unknown>;
  icon?;
  closable?;
  pinned?;
  dirty?;
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
  meta: { title; icon; category; description? };
}
```

`panel-host` calls `componentRegistry.create(tag, props)` to instantiate content. A `MountDirective` (Lit directive) appends the
element imperatively into the shadow DOM without Lit diffing it. A `contentCache` Map on `panel-host` keeps elements alive across
renders.

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
- `_savedAt` / `_exportedAt` timestamps are cast via `(layout as object)` to avoid polluting `WorkspaceLayout` type

---

## What Is Working

- [x] Recursive split layout with drag-to-resize dividers
- [x] Horizontal and vertical splits, arbitrarily nested
- [x] Panel hosts with tab bars
- [x] Tab switching (activeTabId bubbles correctly through split tree)
- [x] Tab close (removes tab, activates next, evicts content cache)
- [x] Dirty tab indicators, pinned tabs
- [x] Component registry with factory + defaultProps + display metadata
- [x] MountDirective for stable element mounting in shadow DOM
- [x] Mock components: mock-viewport, mock-console, mock-tree
- [x] editor-header with File menu (Save, Export, Import, Reset)
- [x] editor-status with fps counter, branch, warnings, last saved time
- [x] Play/Stop toggle wired through header → editor-app → status
- [x] Persistence: localStorage save/backup, JSON export/import, restore on reload
- [x] Ctrl+S keyboard shortcut
- [x] Save status flash in header and status bar

---

## Next Feature: Collapse

### What the spec says

Two distinct visibility states exist on any `LayoutNode`:

```ts
visible?: boolean    // false = removed from layout flow entirely, no footprint
collapsed?: boolean  // true = stays in tree, shows minimal collapsed chrome, preserves size
```

### What needs building

**1. Collapsed state in `SplitNode`** When a child of a split is collapsed:

- Its flex size should shrink to a minimal fixed width/height (e.g. 32px for a collapsed sidebar)
- The adjacent sibling should expand to fill the freed space
- The divider adjacent to the collapsed panel should either hide or become a collapse toggle
- The previously set `sizes` entry should be preserved so it can be restored on expand
- Collapsing should be configured in component registry, as its too complicated to self determine

**2. Collapsed chrome in `panel-host`** When `collapsed === true`, `panel-host` should render a minimal strip:

- Vertical text showing the active tab title (rotated 90°)
- A single expand button
- No tab bar, no content

**3. Collapse toggle UI**

- A collapse button should appear on dividers (visible on hover)
- Clicking collapses the panel on the corresponding side
- The button should flip direction to act as expand when already collapsed

**4. State persistence** `collapsed` is already part of `LayoutNodeBase` and will serialize/restore automatically since it lives on the
node. No extra persistence work needed.

### Suggested implementation order

1. Add collapse toggle button to `split-pane` dividers
2. Handle `collapsed` in `split-pane` size calculation (clamp to min strip width)
3. Add collapsed rendering mode to `panel-host`
4. Wire expand back through the same `layout-change` event system
5. Test persistence round-trip (collapse → save → reload → still collapsed)

### Open questions for next session

- Should collapse be per-panel-host or per-split-child? (Spec implies per node)
- Minimum collapsed strip size: 32px? 24px? Match `--editor-tab-h`?
- Should the collapsed strip show an icon or the panel title or both?
- Should double-clicking a divider collapse/expand (common IDE pattern)?
- How to specify collapse direction, or binding side, so that panel collapses to the binding edge?

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
