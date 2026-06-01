# ExcaliburIDE — Session Handoff: Theme + Editor Registration Debug

## Sprint Goal

Two bugs to resolve this session, in priority order:

1. **Editor component not fully registered** — the editor is not rendering in the layout despite appearing to be wired up

---

## Bug 1: Editor Not Rendering in Layout (Priority)

### Symptom

The editor component (likely `editor-app` or a sub-component) does not render when the layout resolves its panel host's `componentTag`.
The panel slot is present in the DOM but the component is either missing, blank, or throwing a silent error.

### Likely Suspects (check in this order)

**1. Component not registered in `register-mock-components.ts`**

Every component that appears as a `componentTag` in `default-layout.ts` must be explicitly registered. Check
`src/registry/register-mock-components.ts` — confirm the tag is present:

```ts
registry.define("mock-your-component", YourComponent);
```

If the tag is missing here, `componentRegistry.resolve(tag)` returns `undefined` and the panel renders nothing with no console error.

**2. `componentRegistry.resolve()` vs `.get()`**

The correct call is `.resolve(tag)` — never `.get(tag)`. If any call site uses `.get()`, it will silently fail. Grep the codebase:

```bash
grep -r "registry.get(" src/
```

**3. Custom element not defined before layout renders**

If the component is a native custom element (not just a registry entry), it must be `customElements.define()`'d before `panel-host`
tries to stamp it. Check that the import of the component file is at the top of `main.ts` or `register-mock-components.ts`, not
lazy/async.

**4. `panel-host` stamping logic**

In `src/components/panel-host.ts`, find where it resolves and stamps the active tab's component. Confirm it is calling
`componentRegistry.resolve(tab.componentTag)` and actually appending the result to the shadow DOM. Add a temporary `console.log` here
to verify `tag` and `resolved` are both non-null at runtime.

**5. `componentTag` field name in `default-layout.ts`**

Confirm the tab entry uses `componentTag`, not `component`, `tag`, or any other variant. This is a known regression trigger.
Cross-reference against `src/types/layout.ts`:

```ts
interface PanelTabNode {
  componentTag?: string; // ← this exact field name
}
```

### Quick Diagnostic Sequence

```ts
// Temporarily add to panel-host.ts onInitialize or render:
const tag = this.activeTab?.componentTag;
const resolved = componentRegistry.resolve(tag);
console.log("[panel-host]", this.node.id, { tag, resolved });
```

If `resolved` is `undefined`, the registration is the problem. If `tag` is `undefined`, the layout data is the problem. If both are
defined but nothing renders, the stamping/append logic is the problem.

---

## File Map (Stable Reference)

```
src/
  main.ts                         ← must import theme.css here (light DOM only)
  editor-app.ts
  context/
    play-state.ts
  components/
    editor-header.ts
    editor-status.ts
    split-pane.ts
    panel-host.ts                 ← Bug 1: check resolve() + stamp logic here
  mock/
    mock-viewport.ts
    mock-console.ts
    mock-tree.ts
    mock-inspector.ts
    mock-asset-browser.ts
    mock-timeline.ts
    mock-shader-preview.ts
    mock-diagnostics.ts
    default-layout.ts             ← Bug 1: confirm componentTag field name on all tabs
  registry/
    component-registry.ts         ← Bug 1: confirm resolve() not get()
    register-mock-components.ts   ← Bug 1: confirm all tags registered here
  types/
    layout.ts                     ← source of truth for PanelTabNode.componentTag
  styles/
    shared.ts                     ← Bug 2: tokens only, no imports, no unsafeCSS
    theme.css                     ← Bug 2: @import "tailwindcss" + :root tokens, light DOM only
  utils/
    layout-utils.ts
  persistence.ts
```

---

## Critical Invariants (Do Not Regress)

| Rule                                                                                                         | Why                                          |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| Tab field is `title`, never `label`                                                                          | Known regression trigger                     |
| `componentRegistry.resolve(tag)`, never `.get(tag)`                                                          | `.get()` silently returns undefined          |
| `shared.ts` contains **only** `css\`\`` tokens — no imports                                                  | Tailwind preflight breaks shadow DOM display |
| `theme.css` imported in `main.ts` only                                                                       | Must stay in light DOM                       |
| All `componentTag` values in `default-layout.ts` must have a matching entry in `register-mock-components.ts` | Silent render failure otherwise              |

---

## What Was Stable Coming Into This Sprint

- Layout editor tool (`layout-editor.html`) — standalone, complete, no issues
- `sharedStyles` refactor from previous session — correct architecture, do not revert
- `default-layout.ts` structure — valid, loads correctly in the editor tool
- `styleMap` refactor — still deferred, valid future cleanup task
