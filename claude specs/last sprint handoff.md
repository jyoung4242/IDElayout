# ExcaliburIDE — Session Handoff: Tech Debt Sprint

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
    theme.css                   ← Tailwind v4 import + CSS custom properties (3 themes)
    shared.ts                   ← sharedStyles CSSResult (?inline import), spread into every component
  utils/
    layout-utils.ts             ← tree-walk utilities, toggleNodeVisibility, collectPanelHosts
  components/
    editor-app.ts               ← root shell, owns WorkspaceLayout state
    editor-header.ts            ← top bar, File/View/Theme menus, Play/Stop, save status
    editor-status.ts            ← bottom status bar, fps, branch, save time
    split-pane.ts               ← recursive layout engine
    panel-host.ts               ← tab-aware container, mounts content via MountDirective
    panel-tab-bar.ts            ← tab strip with overflow chevron + dropdown
  registry/
    component-registry.ts       ← singleton EditorComponentRegistry class
    register-mock-components.ts ← registers all mock components at startup
    index.ts                    ← barrel export
  persistence/
    layout-storage.ts           ← localStorage read/write, JSON export/import
    persistence-manager.ts      ← singleton, owns save/backup schedule, file I/O
    theme-manager.ts            ← singleton ThemeManager, applies data-theme to <html>
    index.ts                    ← barrel export (includes theme-manager)
  mock/
    mock-viewport.ts            ← fake scene viewport
    mock-console.ts             ← fake log output
    mock-tree.ts                ← fake scene hierarchy
    default-layout.ts           ← initial WorkspaceLayout tree used on first load
  main.ts                       ← imports theme.css, calls themeManager.load(), register-mock-components, editor-app
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

interface PanelTabNode {
  id: string;
  title: string; // NB: field is `title`, NOT `label`
  icon?: string;
  closable?: boolean;
  pinned?: boolean; // present in type but pinning UI is NOT implemented — do not add it
  dirty?: boolean;
  componentTag?: string;
  componentProps?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

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
  → caught by .child wrapper div in parent split-pane (onChildLayoutChange)
    → merges into SplitNode children, re-emits full SplitNode upward
      → editor-app receives complete root ✓
```

**Critical**: `renderLeaf` in `split-pane.ts` does NOT have a `@layout-change` handler — events bubble naturally to the `.child` div's
`onChildLayoutChange(e, i)`.

Panel visibility toggles travel a different path:

```
editor-header → panel-visibility-toggle ({ panelId: string })
  → editor-app.handlePanelVisibilityToggle
    → toggleNodeVisibility (layout-utils.ts)
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
  alwaysVisible?: boolean;
  meta: { title; icon; category; description? };
}
```

Public API: `register`, `resolve(tag)` (not `.get()`), `create`, `has`, `all`, `byCategory`, `toTabNode`.

### Tailwind + Shadow DOM

`src/styles/shared.ts` uses Vite's `?inline` suffix to import the compiled Tailwind CSS as a string:

```ts
import tailwindStr from "./theme.css?inline";
export const sharedStyles = unsafeCSS(tailwindStr);
```

Every component spreads `sharedStyles` into its `static styles` array.

### Theme System

`themeManager` singleton in `src/persistence/theme-manager.ts`:

```ts
export type ThemeId = "dark" | "light" | "monokai";

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
}

export const THEMES: ThemeDefinition[] = [
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
  { id: "monokai", label: "Monokai" },
];
```

- `themeManager.load()` — called in `main.ts` before first render; reads `localStorage` key `excalibur-ide:theme`
- `themeManager.apply(id)` — sets `data-theme` on `document.documentElement`, writes localStorage, dispatches `theme-change` on
  `window`
- CSS custom properties in `theme.css` are defined under `:root` (dark default), `[data-theme="light"]`, and `[data-theme="monokai"]`
- CSS custom properties pierce shadow DOM natively — no per-component changes needed

`editor-header.ts` listens for `window` `theme-change` events to update the checkmark in the Theme menu. Theme menu uses the same
`.menu-btn` / `.dropdown` / `.dropdown-item` CSS classes as File and View menus — do not use `.menu-wrap`, `.header-btn`,
`.dropdown-menu`, or `.menu-item` (those classes do not exist).

### Tab Overflow (`panel-tab-bar.ts`)

- `.tab-scroll-region` uses `overflow-x: hidden` — JS owns `scrollLeft` directly
- `ResizeObserver` on both the scroll region and `:host` triggers `_measureOverflow()`
- `_measureOverflow()` uses `getBoundingClientRect()` comparisons to find tabs whose right edge exceeds the region's right edge
- Overflow chevron button (`.overflow-btn`) sits outside the scroll region with `flex-shrink: 0`
- Badge shows count of hidden tabs
- Dropdown uses same click-outside `pointerdown` + `composedPath()` pattern as other menus
- Tab field is `tab.title` (NOT `tab.label`) — this caused a regression previously; do not reintroduce

### Persistence

- **Explicit save**: `Ctrl+S` or File → Save Layout → `localStorage` key `excalibur-ide:layout`
- **Periodic backup**: every 60s → `localStorage` key `excalibur-ide:layout-backup`
- **Theme**: `localStorage` key `excalibur-ide:theme`
- **Export**: downloads `.json` file via blob URL
- **Import**: file input picker, validates schema before applying
- **Load order**: tries primary save first, falls back to backup, then `defaultLayout`

---

## What Is Working (Fully Complete)

- [x] Recursive split layout with drag-to-resize dividers
- [x] Horizontal and vertical splits, arbitrarily nested
- [x] Panel hosts with tab bars
- [x] Tab switching, tab close, dirty indicators
- [x] Component registry with factory + defaultProps + collapse config + `alwaysVisible` + display metadata
- [x] MountDirective for stable element mounting in shadow DOM
- [x] Mock components: mock-viewport, mock-console, mock-tree
- [x] editor-header with File menu (Save, Export, Import, Reset)
- [x] editor-status with fps counter, branch, warnings, last saved time
- [x] Play/Stop toggle wired through header → editor-app → status
- [x] Persistence: localStorage save/backup, JSON export/import, restore on reload
- [x] Ctrl+S keyboard shortcut
- [x] Save status flash in header and status bar
- [x] Panel collapse — divider chevron button + double-click divider
- [x] Collapsed strip rendering — icon + rotated title + expand button
- [x] Collapse direction-aware title rotation
- [x] Flex renormalization — siblings correctly fill freed space on collapse/expand
- [x] Collapse persistence
- [x] Panel visibility — `visible: false` removes panel with zero footprint
- [x] View menu — checkbox list with registry title, tab count, lock icon for protected panels
- [x] alwaysVisible guard — panels with an `alwaysVisible` component cannot be hidden
- [x] All-hidden guard — hiding blocked if it would leave no visible siblings
- [x] Visibility persistence
- [x] Click-outside menu dismiss — `pointerdown` on `window` with `composedPath()` check
- [x] Tab overflow — ResizeObserver, scroll region, overflow chevron + badge, dropdown
- [x] Theme management — ThemeManager singleton, Dark/Light/Monokai, data-theme on html, localStorage persistence
- [x] Theme menu in editor-header — matches File/View menu styling exactly

---

## Bugs Fixed (Do Not Reintroduce)

### 1. Collapse/expand restores to full screen

`renderLeaf` in `split-pane.ts` must NOT have its own `@layout-change` handler. Events bubble naturally to the `.child` wrapper div's
`onChildLayoutChange(e, i)`.

### 2. Collapsed title rotated wrong direction for right-side panels

In `renderCollapsed()` in `panel-host.ts`, inline style overrides rotation based on `this.node.collapseToward`:

- `collapseToward === "end"`: `writing-mode: vertical-rl; transform: none;`
- default: CSS `rotate(180deg)` applies

### 3. Theme menu rendering inside header bar (not as dropdown)

Theme menu must use the same wrapper pattern as File/View — `<div style="position:relative;">` containing `.menu-btn` and `.dropdown`.
Do NOT use `.menu-wrap` / `.header-btn` / `.dropdown-menu` / `.menu-item`.

### 4. Tab labels not rendering

`PanelTabNode.title` is the correct field name. Using `tab.label` (which does not exist) renders blank tabs.

---

## Sprint Target: Tech Debt

The next session should resolve all three outstanding tech debt items. Do not add new features until these are closed.

### TD-1: `panel-host` prop reactivity

**Problem**: `panel-host.renderContent()` uses `document.createElement` via registry and refreshes props with `Object.assign` on every
render cycle. This is not true Lit reactivity — prop updates may be missed or fire unnecessarily.

**Goal**: Mounted components should receive prop updates through a proper reactive channel. Options to evaluate:

- Lit `@property` / `@state` on the mounted element with a stable reference
- A reactive controller that diffs props and only calls `Object.assign` when props actually change
- Moving to a `MountDirective` that accepts a props map and handles diffing internally

**Where this lives**: `panel-host.ts`, `MountDirective`

### TD-2: `editor-status` fragile event listener

**Problem**: `editor-status` listens for `play-state-change` via `this.getRootNode()` — this breaks if the component moves in the tree,
and is not idiomatic Lit.

**Goal**: Replace with Lit context (`@lit/context`) so `editor-app` provides play state as context and `editor-status` consumes it
without DOM traversal.

**Steps**:

1. Define a `playStateContext` token in a shared `src/context/play-state.ts`
2. `editor-app` provides it via `ContextProvider`
3. `editor-status` consumes it via `ContextConsumer`
4. Remove the `getRootNode()` listener entirely

**Where this lives**: `editor-app.ts`, `editor-status.ts`, new `src/context/play-state.ts`

### TD-3: No ARIA roles on split panes

**Problem**: Split panes have no accessibility semantics. The spec calls for `aria-split-pane` semantics.

**Goal**: Add appropriate ARIA roles and attributes to `split-pane.ts` and `panel-host.ts`:

- `role="region"` or `role="group"` on panel hosts with `aria-label` derived from the active tab title
- Divider elements should have `role="separator"` with `aria-orientation`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Tab bar should use `role="tablist"`, individual tabs `role="tab"`, content area `role="tabpanel"`

**Where this lives**: `split-pane.ts`, `panel-host.ts`, `panel-tab-bar.ts`

---

## CSS Custom Properties Reference (theme.css)

All of these must be defined in every theme block (`:root`, `[data-theme="light"]`, `[data-theme="monokai"]`):

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

## Known Issues / Carry Forward

- Tab overflow chevron: pinned tab left-anchoring described but not implemented — `pinned` field exists on `PanelTabNode` but pinning
  UI is intentionally absent. Do not add a pin icon to the tab bar.
- `_boundClickOutside` — was referenced in an intermediate draft of `editor-header.ts` but is not defined. Confirm it has been fully
  removed. The correct outside-click handler is `onOutsideClick` registered in `connectedCallback`.
- `onOutsideClick` in `editor-header.ts` must guard all three menu flags: `fileMenuOpen`, `viewMenuOpen`, AND `themeMenuOpen`. Verify
  the guard condition reads: `if (!this.fileMenuOpen && !this.viewMenuOpen && !this.themeMenuOpen) return;`
