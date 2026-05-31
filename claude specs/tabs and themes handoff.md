# ExcaliburIDE — Session Handoff: Tab Overflow & Theme Management

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
    layout-utils.ts             ← tree-walk utilities, toggleNodeVisibility, collectPanelHosts
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
`onChildLayoutChange(e, i)`. The only exception is the top-level `render()` path when `this.node` is itself a `panel-host` (no parent
split), which handles forwarding inline.

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

### Persistence

- **Explicit save**: `Ctrl+S` or File → Save Layout → `localStorage` key `excalibur-ide:layout`
- **Periodic backup**: every 60s → `localStorage` key `excalibur-ide:layout-backup`
- **Export**: downloads `.json` file via blob URL
- **Import**: file input picker, validates schema before applying
- **Load order**: tries primary save first, falls back to backup, then `defaultLayout`

---

## What Is Working (Fully Complete)

- [x] Recursive split layout with drag-to-resize dividers
- [x] Horizontal and vertical splits, arbitrarily nested
- [x] Panel hosts with tab bars
- [x] Tab switching, tab close, dirty indicators, pinned tabs
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
- [x] Collapse direction-aware title rotation (`collapseToward: "end"` uses `transform: none`, `"start"` uses `rotate(180deg)`)
- [x] Flex renormalization — siblings correctly fill freed space on collapse/expand
- [x] Collapse persistence — `collapsed` flag serializes/restores automatically
- [x] Panel visibility — `visible: false` removes panel with zero footprint
- [x] View menu — checkbox list with registry title, tab count, lock icon for protected panels
- [x] alwaysVisible guard — panels with an `alwaysVisible` component cannot be hidden
- [x] All-hidden guard — hiding blocked if it would leave no visible siblings
- [x] Visibility persistence — `visible` flag serializes automatically
- [x] Click-outside menu dismiss — `pointerdown` on `window` with `composedPath()` check

---

## Bugs Fixed This Session (Do Not Reintroduce)

### 1. Collapse/expand restores to full screen

**Root cause**: `renderLeaf` in `split-pane.ts` had its own `@layout-change` handler that called `this.emitLayoutChange(e.detail)`
directly — forwarding the bare `PanelHostNode` as the new layout root, bypassing `onChildLayoutChange` and destroying the entire split
tree.

**Fix**: Removed the `@layout-change` handler from `renderLeaf` entirely. Events now bubble naturally to the `.child` wrapper div's
handler in `renderSplit`, which correctly merges via `onChildLayoutChange(e, i)`. The `render()` top-level path (when `this.node` is a
lone `panel-host`) handles forwarding inline.

### 2. Collapsed title rotated wrong direction for right-side panels

**Root cause**: CSS unconditionally applied `transform: rotate(180deg)` to all `.collapsed-strip.vertical .collapsed-title` regardless
of `collapseToward`.

**Fix**: In `renderCollapsed()` in `panel-host.ts`, inline style overrides rotation based on `this.node.collapseToward`:

- `collapseToward === "end"` (right/bottom panel): `writing-mode: vertical-rl; transform: none;` — reads top-to-bottom ✓
- default (left/top panel): CSS `rotate(180deg)` applies — reads bottom-to-top ✓

---

## Next Features To Implement

### Feature 1: Tab Overflow

**Problem**: When a `panel-host` has more tabs than fit in the tab bar width, tabs currently just overflow with no handling.

**Desired behavior**:

- Tab bar scrolls horizontally (already partially works), AND
- An overflow chevron button (`›`) appears at the right end of the tab bar when tabs overflow
- Clicking it opens a dropdown menu listing all tabs not currently fully visible
- Selecting a tab from the dropdown activates it (and scrolls it into view if possible)
- The overflow button badge shows the count of hidden tabs

**Where this lives**: `panel-tab-bar.ts` entirely. No layout tree changes needed.

**Implementation notes**:

- Use a `ResizeObserver` on the tab strip container to detect when scrollWidth > clientWidth
- Track scroll position with `@state() private scrollLeft = 0` and a `@state() private overflowCount = 0`
- The overflow dropdown is a positioned overlay (similar to the View menu in `editor-header.ts`) — use the same click-outside
  `pointerdown` + `composedPath()` pattern already established
- Pinned tabs should always be visible (left-anchored, never scrolled out); overflow only applies to unpinned tabs
- The overflow button should sit outside the scrollable region (not scroll with tabs) — flex layout with `overflow: hidden` on the
  scroll container and `flex-shrink: 0` on the overflow button

### Feature 2: Theme Management

**Problem**: The IDE currently has a single hardcoded dark theme via CSS custom properties in `theme.css`. There is no way to switch
themes at runtime.

**Desired behavior**:

- A theme picker in `editor-header.ts` (View menu or a dedicated Theme menu)
- At minimum: Dark (current), Light, and one additional theme (e.g. "Monokai" or "Solarized")
- Theme selection persists to `localStorage` key `excalibur-ide:theme`
- Theme applies by swapping a `data-theme` attribute on `<html>` or the root `editor-app` host element
- All CSS custom properties redefine under each `[data-theme="..."]` selector in `theme.css`

**Architecture**:

Theme switching should live in a new `src/persistence/theme-manager.ts` singleton (parallel to `persistence-manager.ts`):

```ts
export type ThemeId = "dark" | "light" | "monokai"; // extend as needed

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  icon?: string;
}

export const THEMES: ThemeDefinition[] = [
  { id: "dark", label: "Dark", icon: "🌑" },
  { id: "light", label: "Light", icon: "☀️" },
  { id: "monokai", label: "Monokai", icon: "🎨" },
];

class ThemeManager {
  private current: ThemeId = "dark";
  private readonly STORAGE_KEY = "excalibur-ide:theme";

  load() {
    /* read localStorage, call apply() */
  }
  apply(id: ThemeId) {
    /* set data-theme on documentElement, write localStorage */
  }
  get active(): ThemeId {
    return this.current;
  }
}

export const themeManager = new ThemeManager();
```

**CSS structure in `theme.css`**:

```css
/* Default (dark) — existing properties stay here */
:root {
  --editor-bg: #1a1a1a;
  /* ... all current properties ... */
}

[data-theme="light"] {
  --editor-bg: #f5f5f5;
  --editor-text: #1a1a1a;
  /* ... light overrides ... */
}

[data-theme="monokai"] {
  --editor-bg: #272822;
  --editor-text: #f8f8f2;
  /* ... monokai overrides ... */
}
```

**Integration points**:

- `main.ts`: call `themeManager.load()` at startup before first render
- `editor-header.ts`: add Theme menu (or fold into View menu) that calls `themeManager.apply(id)` and emits a `theme-change` event so
  `editor-app` can re-render the checkmark if needed
- `editor-app.ts`: listen for `theme-change` if the header needs to reflect active theme (optional — `themeManager.active` can be read
  directly)

**Note on shadow DOM**: CSS custom properties pierce shadow DOM boundaries natively — setting them on `:root` or `[data-theme]` on
`<html>` will propagate into all shadow roots automatically. No per-component changes needed for theming.

---

## CSS Custom Properties Reference (theme.css)

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

All of these must be defined in every theme block.

---

## Known Issues / Tech Debt (Carry Forward)

- `panel-host.renderContent()` uses `document.createElement` via registry — reactive prop updates to mounted components require
  `Object.assign` refresh on each render cycle, not true Lit reactivity
- `editor-status` listens for `play-state-change` via `getRootNode()` — fragile if component moves in the tree; should use Lit context
  instead
- No ARIA roles on split panes yet (spec calls for `aria-split-pane` semantics)
- Tab overflow (current session target)
