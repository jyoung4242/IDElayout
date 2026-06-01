# ExcaliburIDE — Session Handoff: Two New Mock Components

## Sprint Goal

Add two new mock panel components to the IDE:

1. **`mock-project-config`** — project settings form with editable fields
2. **`mock-level-editor`** — tile-placement canvas tool

Both follow the exact same pattern established by `mock-editor`, `mock-inspector`, etc.

---

## Component 1: `mock-project-config`

### What it is

A simple project settings panel. Editable fields only — no persistence required, just realistic UI.

### Suggested fields

| Field            | Type                      | Notes                    |
| ---------------- | ------------------------- | ------------------------ |
| Project Name     | text input                | e.g. "My Excalibur Game" |
| Version          | text input                | e.g. "0.1.0"             |
| Resolution       | two number inputs (W × H) | e.g. 800 × 600           |
| Background Color | color picker              | hex value                |
| Gravity          | number input              | e.g. 9.8                 |
| Physics Enabled  | checkbox                  |                          |
| Target FPS       | number input              | e.g. 60                  |
| Entry Scene      | text input                | e.g. "MainScene"         |

### Implementation checklist

- [ ] Create `src/mock/mock-project-config.ts`
- [ ] Component extends `LitElement`, uses `sharedStyles`
- [ ] No persistence — fields are just reactive state (`@state()`)
- [ ] Add a "Save" button that fires a custom event (no-op is fine)
- [ ] Register custom element as `"mock-project-config"`
- [ ] Add `declare global { interface HTMLElementTagNameMap { "mock-project-config": MockProjectConfig } }` at the bottom
- [ ] Import in `register-mock-components.ts`
- [ ] Add registry block in `register-mock-components.ts`:

```ts
componentRegistry.register({
  tag: "mock-project-config",
  factory: () => document.createElement("mock-project-config"),
  collapsible: false,
  alwaysVisible: false,
  meta: {
    title: "Project Config",
    icon: "⚙️",
    category: "tool",
    description: "Project settings and configuration",
  },
});
```

- [ ] Add a tab entry in `default-layout.ts` with `componentTag: "mock-project-config"`

---

## Component 2: `mock-level-editor`

### What it is

A tile-placement canvas tool. Looks and feels like a basic tilemap editor — a grid the user can paint tiles onto, a small palette on
the side, and basic toolbar controls. No real asset loading needed; tiles can be colored blocks.

### Suggested features

| Feature             | Notes                                                                   |
| ------------------- | ----------------------------------------------------------------------- |
| Grid canvas         | e.g. 20×15 tiles at 32px each, rendered on a `<canvas>`                 |
| Tile palette        | 6–8 colored swatches the user clicks to select the active tile          |
| Paint on click/drag | mousedown + mousemove fills the hovered cell with the active tile color |
| Erase mode          | a designated "eraser" swatch or keyboard shortcut (`E`)                 |
| Clear button        | resets all tiles to empty                                               |
| Coordinates display | shows current hovered tile row/col in a status bar                      |
| Grid toggle         | button to show/hide the grid lines                                      |

### Implementation checklist

- [ ] Create `src/mock/mock-level-editor.ts`
- [ ] Component extends `LitElement`, uses `sharedStyles`
- [ ] Canvas rendering via `<canvas>` element accessed through `this.renderRoot.querySelector("canvas")`
- [ ] Use `@state()` for: `activeTile`, `tiles: number[][]`, `showGrid`, `hoverCell`
- [ ] `tiles` is a 2D array initialized to `0` (empty); each palette swatch maps to an index
- [ ] Redraw canvas in `updated()` lifecycle hook after any state change
- [ ] Paint on `mousedown` + `mousemove` (only while button held — track with a flag)
- [ ] Register custom element as `"mock-level-editor"`
- [ ] Add `declare global { interface HTMLElementTagNameMap { "mock-level-editor": MockLevelEditor } }` at the bottom
- [ ] Import in `register-mock-components.ts`
- [ ] Add registry block in `register-mock-components.ts`:

```ts
componentRegistry.register({
  tag: "mock-level-editor",
  factory: () => document.createElement("mock-level-editor"),
  collapsible: false,
  alwaysVisible: false,
  meta: {
    title: "Level Editor",
    icon: "🗺️",
    category: "tool",
    description: "Tile-based level placement canvas",
  },
});
```

- [ ] Add a tab entry in `default-layout.ts` with `componentTag: "mock-level-editor"`

---

## Critical Invariants (Do Not Regress)

| Rule                                                                                                                 | Why                                          |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Tab field is `title`, never `label`                                                                                  | Known regression trigger                     |
| `componentRegistry.resolve(tag)`, never `.get(tag)`                                                                  | `.get()` silently returns undefined          |
| `shared.ts` contains **only** `css\`\`` tokens — no imports                                                          | Tailwind preflight breaks shadow DOM display |
| `theme.css` imported in `main.ts` only                                                                               | Must stay in light DOM                       |
| All `componentTag` values in `default-layout.ts` must have a matching entry in `register-mock-components.ts`         | Silent render failure otherwise              |
| Custom element tag in `customElements.define()`, registry `tag`, and `componentTag` in layout must all match exactly | The bug fixed this sprint — don't repeat it  |

---

## File Map (Stable Reference)

```
src/
  main.ts
  editor-app.ts
  context/
    play-state.ts
  components/
    editor-header.ts
    editor-status.ts
    split-pane.ts
    panel-host.ts
  mock/
    mock-viewport.ts
    mock-console.ts
    mock-tree.ts
    mock-inspector.ts
    mock-asset-browser.ts
    mock-timeline.ts
    mock-shader-preview.ts
    mock-diagnostics.ts
    mock-editor.ts
    mock-project-config.ts   ← NEW this sprint
    mock-level-editor.ts     ← NEW this sprint
    default-layout.ts
  registry/
    component-registry.ts
    register-mock-components.ts
  types/
    layout.ts
  styles/
    shared.ts
    theme.css
  utils/
    layout-utils.ts
  persistence.ts
```

---

## What Was Stable Coming Into This Sprint

- All previously registered mock components rendering correctly
- `mock-editor` bug fixed — tag mismatch (`mock-texteditor` → `mock-editor`) resolved
- `componentRegistry.resolve()` confirmed correct at all call sites
- `sharedStyles` architecture correct — do not revert
- Layout editor tool (`layout-editor.html`) — standalone, complete, no issues
