# ExcaliburIDE — Session Handoff: Collapse Expand Bug

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
  utils/
    layout-utils.ts             ← NEW: tree-walk utilities, toggleNodeVisibility, collectPanelHosts
  components/
    editor-app.ts               ← root shell, owns WorkspaceLayout state
    editor-header.ts            ← top bar, File menu, View menu, Play/Stop, save status
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

Panel visibility toggles travel a different path:

```
editor-header → panel-visibility-toggle ({ panelId: string })
  → editor-app.handlePanelVisibilityToggle
    → toggleNodeVisibility (layout-utils.ts) — runs all-hidden guard + alwaysVisible guard
      → layout-change → split-pane re-renders with hidden node skipped
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
  alwaysVisible?: boolean; // if true, panel cannot be hidden via View menu or API
  meta: { title; icon; category; description? };
}
```

Public API methods: `register`, `resolve`, `create`, `has`, `all`, `byCategory`, `toTabNode`. Note: the method is `resolve(tag)`,
**not** `get(tag)`.

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
- [x] Component registry with factory + defaultProps + collapse config + `alwaysVisible` flag + display metadata
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
- [x] **Panel visibility** — `visible: false` removes panel from layout flow with zero footprint
- [x] **View menu** — lists all PanelHostNodes with checkbox, registry title, tab count; protected panels show lock icon
- [x] **alwaysVisible guard** — panels whose tabs contain an `alwaysVisible` component cannot be hidden
- [x] **All-hidden guard** — hiding blocked if it would leave no visible siblings in a split
- [x] **Visibility persistence** — `visible` flag on `LayoutNodeBase` serializes automatically
- [x] **Click-outside menu dismiss** — `pointerdown` on `window` with `composedPath()` check replaces fragile `@blur`+`setTimeout`

---

## Completed Feature: Panel Visibility

### New file: `src/utils/layout-utils.ts`

Exports:

- `walkTree(node, visitor, parent?, indexInParent?)` — generic depth-first tree walker; visitor returns `false` to stop descent
- `collectPanelHosts(root): PanelHostNode[]` — flat list of all panel-host nodes, used by View menu
- `countVisibleSiblings(root, targetId): number` — counts siblings with `visible !== false`, used by all-hidden guard
- `toggleNodeVisibility(root, targetId): LayoutNode | null` — immutable toggle with both guards; returns `null` if blocked
- `updateNodeInTree(root, targetId, updater): LayoutNode` — structural-sharing point-update used by toggle
- `getPanelLabel(node, registryTitle?): string` — formats "Title (N tabs)" label
- `isNodeVisible(root, targetId): boolean` — accounts for ancestor visibility

### Changes to existing files

**`component-registry.ts`**: Added `alwaysVisible?: boolean` to `ComponentDefinition` interface.

**`split-pane.ts`**:

- `computeChildStyle` — excludes `visible === false` children from flex pool (alongside collapsed)
- `onDividerMouseMove` — blocks drag if either adjacent child is hidden
- `renderSplit` — builds `visibleIndices` list first; hidden children and their adjacent dividers are skipped entirely. Dividers are
  rendered between consecutive visible pairs only. All original-index references (`computeChildStyle(node, i)`,
  `onChildLayoutChange(e, i)`, `getCollapsibleSide(node, i)`) continue to use the pre-filter index so sizes and collapse logic remain
  correct.

**`editor-header.ts`**:

- Added `@property() layout: WorkspaceLayout | null`
- Added `@state() viewMenuOpen` and `toggleViewMenu()`
- `closeAllMenus()` replaces separate close methods; used by both menus and the click-outside handler
- Added `connectedCallback`/`disconnectedCallback` wiring `pointerdown` → `onOutsideClick` on `window`; uses
  `e.composedPath().includes(this)` to correctly detect clicks inside shadow DOM
- Removed all `@blur`+`setTimeout` from menu buttons (was the root cause of fussy click capture)
- `renderViewMenu()` — calls `collectPanelHosts(layout.root)`, renders checkboxed list; calls
  `componentRegistry.resolve(tab.componentTag)` (not `.get()`) for registry title lookup; protected panels (`alwaysVisible`) get
  `.disabled` class + lock icon, no click handler
- Emits `panel-visibility-toggle` event with `{ panelId }` — does NOT mutate tree itself

**`editor-app.ts`**:

- Passes `.layout=${this.layout}` to `<editor-header>`
- Handles `@panel-visibility-toggle` → `handlePanelVisibilityToggle` → calls `toggleNodeVisibility`; if result is `null` (guard
  blocked), logs to `console.debug` and returns without update

---

## Active Bug: Collapse Expand Restores to Wrong Size

### Symptom

When a panel is collapsed (shrinks to 32px strip), the expand button appears correctly on the strip. Clicking the expand button causes
the panel to expand, but instead of restoring to its pre-collapse size it consumes the remaining screen — effectively taking all
available space from its siblings.

### What should happen

Collapsing a panel preserves its `sizes` entry in the `SplitNode.sizes` array unchanged. On expand, `computeChildStyle` renormalizes
flex across non-collapsed siblings using those preserved sizes — so the panel should restore to its original proportional size and
siblings should return to theirs.

### Where to look

The bug likely lives in one of two places:

**1. `computeChildStyle` in `split-pane.ts`**

The renormalization sums `expandedTotal` across non-collapsed children then divides each child's size by that total. If the expanding
panel's own size is accidentally included in `expandedTotal` while it is still flagged `collapsed: true` during the render that
processes the expand click — or if `expandedTotal` ends up being 0 or 1 in a way that makes the ratio degenerate — the panel gets
`flex: 1` and takes everything.

```ts
// Current logic — verify this is correct on the expand transition frame
const expandedTotal = split.children.reduce((sum, c, i) => {
  if (c.visible === false) return sum;
  if (c.type === "panel-host" && c.collapsed) return sum;
  return sum + (split.sizes[i] ?? 0);
}, 0);
const normalizedSize = (split.sizes[index] ?? 0) / (expandedTotal || 1);
```

Key question: when the expand event fires and `collapsed` is set to `false`, does the sizes array still hold the original pre-collapse
values? If anything zeroed out or clamped that entry during the collapse transition, the restored size would be 0, making
`normalizedSize` = 0, and the sibling with a non-zero size would fill everything.

**2. `onCollapseToggle` in `split-pane.ts`**

This is where `collapsed` is toggled. It does a shallow spread of the child node — verify it is not accidentally mutating or zeroing
`sizes` on the parent `SplitNode` during the collapse. The `sizes` array lives on the `SplitNode`, not the `PanelHostNode`, so it
should be untouched by the child spread, but worth confirming.

**3. The collapsed strip expand button in `panel-host.ts`**

The strip's expand button emits `layout-change` with `collapsed: false`. Verify the emitted node is a full copy of the existing node
with only `collapsed` changed — not a reconstructed object that might be missing fields or have stale size hints.

**4. Clicking on Tab headers also creates the problem**

### Suggested debugging approach

1. `console.log` the `split.sizes` array immediately before and after `onCollapseToggle` fires in both directions (collapsing and
   expanding) to confirm sizes are preserved through the round-trip
2. Log `expandedTotal` and `normalizedSize` in `computeChildStyle` for the expanding panel on the first render after expand to see what
   flex value it actually receives
3. If sizes look correct but the panel still fills the screen, the issue may be a CSS flex interaction — check whether the collapsed
   strip's `flex: 0 0 32px` is correctly cleared when `collapsed` goes back to `false`

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

- **ACTIVE BUG**: Collapsed panel expand restores to full screen instead of previous size (see above)
- `panel-host.renderContent()` uses `document.createElement` via registry — reactive prop updates to mounted components require
  `Object.assign` refresh on each render cycle, not true Lit reactivity
- Tab overflow (many tabs) has no overflow handling yet — tab bar scrolls but no overflow menu
- `editor-status` listens for `play-state-change` via `getRootNode()` — fragile if component moves in the tree; should use Lit context
  instead

- No ARIA roles on split panes yet (spec calls for `aria-split-pane` semantics)
