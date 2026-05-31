# ExcaliburIDE — Session Handoff: CSS Layout & Vite Issues

## Project Overview

A modular, IDE-style editor framework for ExcaliburJS built with:

- **Vite** (standalone app, not embedded in a game project)
- **Lit** web components with shadow DOM
- **Tailwind v4** (CSS-first, `@import 'tailwindcss'`) with `@apply` in each component's `static styles`
- **TypeScript** throughout

---

## State Coming Into This Session

All mock panels are working. The layout tree renders correctly. Slider drag-to-resize is fixed.
The app is stable — no runtime errors, no console noise beyond Lit dev mode warning and missing favicon.

---

## Current Bug: Workspace Not Filling Viewport

### Symptom

`editor-header` and `editor-status` stretch full width correctly.
The `.workspace` div inside `editor-app`'s shadow root does **not** stretch to fill the remaining
viewport height — it appears clamped to the content width/height of its children rather than
expanding to fill available space.

### Expected layout

```
┌──────────────────────────────────┐  ← 100vw
│ editor-header (40px)             │
├──────────────────────────────────┤
│ .workspace (flex: 1, min-h: 0)   │  ← should fill remaining height
│   └── split-pane (flex: 1)       │
│         └── ... panels           │
├──────────────────────────────────┤
│ editor-status (24px)             │
└──────────────────────────────────┘
```

### Relevant CSS in `editor-app.ts`

```ts
static styles = [
  sharedStyles,
  css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: var(--editor-bg3);
    }
    .workspace {
      flex: 1;
      min-height: 0;
      display: flex;
      overflow: hidden;
    }
  `,
];
```

### Suspected causes (investigate in order)

1. **`sharedStyles` interference** — `sharedStyles` is composed into every component via
   `static styles = [sharedStyles, css`...`]`. It may be setting `box-sizing`, `display`, or
   `width`/`height` rules on `:host` or `*` that override or conflict with the per-component
   styles. Check `src/styles/shared.ts` first.

2. **Tailwind v4 base reset** — Tailwind v4's preflight/base may be injecting global styles
   (e.g. `*, *::before, *::after { box-sizing: border-box }` or block-level display resets)
   that don't pierce shadow DOM but may affect the top-level `<editor-app>` element in light DOM.
   Vite's CSS pipeline processes Tailwind before Lit sees it — confirm whether Tailwind base
   styles are being applied to the host document and whether they affect `editor-app`'s sizing.

3. **`editor-app` host element not stretching in light DOM** — Even with `:host { height: 100vh }`
   inside the shadow root, the host element (`<editor-app>`) lives in light DOM. If `body` or
   `html` don't have `height: 100%` / `margin: 0`, the host may not expand correctly.
   Check `src/styles/global.css` (or equivalent) and `index.html`.

4. **`split-pane` not propagating flex correctly** — `split-pane` has `:host { display: flex; flex: 1 }`
   but if the `.workspace` div isn't sized, `split-pane` has nothing to flex into. This is
   downstream of cause 3 — fix the workspace sizing first.

### DevTools inspection to do at session start

```
// In DevTools Elements panel:
// 1. Select .workspace div inside editor-app's shadow root
// 2. Check computed width/height — is it 0? auto? content-sized?
// 3. Check if flex: 1 is being applied or overridden
// 4. Select <editor-app> in light DOM, check its computed height
// 5. Check <body> and <html> computed height
```

---

## Vite Dev/Build Issues to Discuss

### Known: Tailwind v4 CSS-first config in Vite

Tailwind v4 uses `@import 'tailwindcss'` in a CSS entry file rather than a `tailwind.config.js`.
Vite needs `@tailwindcss/vite` plugin (not PostCSS) for this to work correctly in dev and build.
Confirm `vite.config.ts` has:

```ts
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
});
```

If using PostCSS instead, `@apply` inside Lit's `css\`...\`` tagged templates will **not** be
processed — Vite only runs PostCSS on `.css` files, not on template literals. This is a common
source of silent style failures in Lit + Tailwind v4 projects.

### Known: `@apply` in Lit shadow DOM

Tailwind utility classes used via `@apply` inside `static styles` work correctly **only** if
Vite processes them at build time. At runtime, shadow DOM blocks Tailwind's stylesheet from
piercing in. So `@apply flex items-center` in a Lit component is fine; using the class string
directly (`class="flex items-center"`) in a shadow root template is not, unless you're also
injecting Tailwind's stylesheet into each shadow root (not recommended).

### To investigate

- Does `vite build` produce correct output or does it fail / produce unstyled output?
- Are there any `@apply` rules in `sharedStyles` or component styles that silently no-op in dev
  but would break in production build?
- Is HMR (hot module reload) correctly invalidating Lit component styles when `sharedStyles`
  changes, or does a full page reload always required?

---

## `styleMap` Discussion Notes

Lit's `styleMap` directive (`import { styleMap } from 'lit/directives/style-map.js'`) is
currently **not used** — inline styles in `split-pane.ts` are built as raw strings:

```ts
// Current approach in computeChildStyle()
return `flex: ${normalizedSize}; min-width: 0; min-height: 0; display: flex;`;
// Applied as:
html`<div class="child" style=${style}>...</div>`
```

### Why `styleMap` would be better

- Lit diffs style properties individually rather than replacing the whole `style` attribute string
- Avoids accidental style clobbering if other code touches the element's style
- TypeScript-friendly (object keys are typed)
- Cleaner to read and extend

### Proposed refactor for `computeChildStyle`

```ts
import { styleMap } from 'lit/directives/style-map.js';

// Return a StyleInfo object instead of a string
private computeChildStyleMap(split: SplitNode, index: number): Record<string, string> {
  const isH = split.orientation === "horizontal";
  const child = split.children[index];

  if (child.type === "panel-host" && child.collapsed) {
    return {
      flex: `0 0 ${COLLAPSED_SIZE_PX}px`,
      [isH ? "width" : "height"]: `${COLLAPSED_SIZE_PX}px`,
      minWidth: "0",
      minHeight: "0",
      display: "flex",
    };
  }

  const expandedTotal = split.children.reduce((sum, c, i) => {
    if (c.visible === false || (c.type === "panel-host" && c.collapsed)) return sum;
    return sum + (split.sizes[i] ?? 0);
  }, 0);

  const normalizedSize = (split.sizes[index] ?? 0) / (expandedTotal || 1);

  return {
    flex: String(normalizedSize),
    minWidth: "0",
    minHeight: "0",
    display: "flex",
  };
}

// Usage in renderSplit:
html`<div class="child" style=${styleMap(this.computeChildStyleMap(node, i))} ...>`
```

This is a clean refactor with no behavior change — good candidate for this session if the CSS
debugging goes quickly.

---

## Architecture Reference (Stable — Do Not Change)

### Layout Types (`src/types/layout.ts`)

```ts
export type LayoutNodeType = "split" | "panel-host";
export type ComponentCategory = "viewport" | "scene" | "inspector" | "asset" | "console" | "code" | "tool" | "mock";

interface LayoutNodeBase {
  id: string;
  type: LayoutNodeType;
  visible?: boolean;
  collapsed?: boolean;
  metadata?: Record<string, unknown>;
}

interface SplitNode extends LayoutNodeBase {
  type: "split";
  orientation: "horizontal" | "vertical";
  children: LayoutNode[];
  sizes: number[]; // flex proportions, relative to each other, need not sum to 1 or 100
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
  title: string; // NOT label — using label is a known regression trigger
  icon?: string;
  closable?: boolean;
  pinned?: boolean; // field exists; pinning UI not implemented
  dirty?: boolean;
  componentTag?: string;
  componentProps?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export type LayoutNode = SplitNode | PanelHostNode;

export interface WorkspaceLayout {
  version: number;
  root: LayoutNode;
  theme?: string;
  metadata?: Record<string, unknown>;
}
```

### Component Registry API (`src/registry/component-registry.ts`)

```ts
interface ComponentDefinition {
  tag: string;
  factory: () => HTMLElement;
  defaultProps?: Record<string, unknown>;
  collapsible?: boolean;
  defaultCollapseToward?: "start" | "end";
  alwaysVisible?: boolean;
  meta: {
    title: string;
    icon: string;
    category: ComponentCategory;
    description?: string;
  };
}
```

- `componentRegistry.register(def)` — register
- `componentRegistry.resolve(tag)` — get definition (NOT `.get()`)
- `componentRegistry.create(tag, props)` — instantiate
- `componentRegistry.has(tag)` — existence check
- `componentRegistry.all()` — all definitions
- `componentRegistry.byCategory(cat)` — filtered list
- `componentRegistry.toTabNode(tag, overrides?)` — builds a `PanelTabNode`

### Event Flow (Do Not Change)

```
panel-host → layout-change (PanelHostNode)
  → caught by .child wrapper div in parent split-pane (onChildLayoutChange)
    → merges into SplitNode, re-emits full SplitNode upward
      → editor-app receives complete root ✓
```

Panel visibility toggles:
```
editor-header → panel-visibility-toggle ({ panelId: string })
  → editor-app.handlePanelVisibilityToggle
    → toggleNodeVisibility (layout-utils.ts)
      → layout-change → split-pane re-renders with hidden node skipped
```

### Drag Resize (Fixed This Session)

`onDividerMouseMove` in `split-pane.ts` scales `proportion` to the sizes pool:

```ts
const totalSizes = this.dragStart.sizes.reduce((a, b) => a + b, 0);
const proportion = (delta / this.containerSize) * totalSizes;
const minSize = totalSizes * 0.05;
```

Do not revert to the old `const proportion = delta / this.containerSize` — that assumed 0–1
normalized sizes and is wrong for integer flex weights.

---

## Known Invariants (Do Not Regress)

- Tab field is `tab.title` — never `tab.label`
- `componentRegistry.resolve(tag)` — never `.get(tag)`
- `defaultLayout` exports a `WorkspaceLayout` (with `version` and `root`) — not a bare `LayoutNode`
- `persistenceManager.load()` must guard against `"undefined"` string in localStorage:
  ```ts
  if (saved && saved !== "undefined") {
    try { this.layout = JSON.parse(saved); }
    catch { localStorage.removeItem(key); this.layout = structuredClone(defaultLayout); }
  }
  ```
- `handleClearSaved` must use `structuredClone(defaultLayout)` not raw `defaultLayout` to avoid
  mutating the module-level constant during drag operations
- `pinned` field exists on `PanelTabNode` but pinning UI is intentionally absent
- `onOutsideClick` in `editor-header.ts` must guard all three menu flags:
  `if (!this.fileMenuOpen && !this.viewMenuOpen && !this.themeMenuOpen) return;`

---

## CSS Custom Properties Reference

All must be defined in every theme block in `src/styles/theme.css`:

```
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

CSS custom properties pierce shadow DOM natively — no per-component theme changes needed.

---

## File Map

```
src/
  main.ts
  editor-app.ts               ← layout root, persistence, play state context provider
  context/
    play-state.ts             ← playStateContext token + PlayState interface
  components/
    editor-header.ts          ← menu bar, visibility toggles, play button
    editor-status.ts          ← status bar, play state consumer
    split-pane.ts             ← recursive layout renderer, drag resize
    panel-host.ts             ← tab bar, MountDirective, content mount
  mock/
    mock-viewport.ts
    mock-console.ts
    mock-tree.ts
    mock-inspector.ts         ← prop reactivity exercise (entityId → property sets)
    mock-asset-browser.ts     ← grid/list toggle, horizontal overflow test
    mock-timeline.ts          ← RAF playback, horizontal scroll, disconnectedCallback cleanup
    mock-shader-preview.ts    ← CSS animated shader sim, interval cleanup
    mock-diagnostics.ts       ← setInterval metrics, sparkline, disconnectedCallback cleanup
    default-layout.ts         ← exports WorkspaceLayout (version + root), not bare LayoutNode
  registry/
    component-registry.ts
    register-mock-components.ts  ← categories use ComponentCategory type (lowercase)
  types/
    layout.ts
  styles/
    shared.ts                 ← composed into every component — suspected CSS conflict source
    theme.css                 ← CSS custom properties, all three theme blocks
  utils/
    layout-utils.ts           ← toggleNodeVisibility
  persistence.ts              ← persistenceManager, load/save/import/export
```
