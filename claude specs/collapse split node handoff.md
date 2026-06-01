# ExcaliburIDE — Session Handoff: Split-Node Collapse

## Sprint Goal

Investigate whether `SplitNode` can support collapsing, and if so, design and implement it. Currently `collapsed` and `collapsible`
only exist on `PanelHostNode`. A collapsible `SplitNode` would let an entire column or row (containing multiple panel-hosts) collapse
to a strip as a unit.

---

## Background & Motivation

The current collapse system only works at the `PanelHostNode` level. This covers simple cases like collapsing a single sidebar panel,
but breaks down when a sidebar is itself a `SplitNode` containing stacked panels — e.g. the right sidebar in `newerdefault-layout.ts`
(`right-sidebar`: a vertical split of `inspector-host` and `diagnostics-host`). Collapsing those panels individually leaves two
separate strips; collapsing the whole column as a unit is often what the user actually wants.

---

## What Currently Exists

| Feature                                                      | Scope                                                                  | Location                       |
| ------------------------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------ |
| `collapsed?: boolean`                                        | `LayoutNodeBase` (inherited by both node types)                        | `src/types/layout.ts`          |
| `collapsible?: boolean`, `collapseToward?: "start" \| "end"` | `PanelHostNode` only                                                   | `src/types/layout.ts`          |
| `getCollapsibleSide()`                                       | Checks `before`/`after` child — **only handles `panel-host` children** | `split-pane.ts`                |
| `onCollapseToggle()`                                         | Mutates `collapsed` on a `PanelHostNode` child                         | `split-pane.ts`                |
| `computeChildStyle()`                                        | Skips collapsed children from flex pool                                | `split-pane.ts`                |
| Collapsed strip rendering                                    | `renderCollapsed()` in `panel-host.ts`                                 | `src/components/panel-host.ts` |
| Drag guard                                                   | Skips drag-resize if either adjacent child is collapsed                | `split-pane.ts` line 141       |

**Key gap**: `getCollapsibleSide()` explicitly type-checks `before.type === "panel-host"` before allowing collapse. A `SplitNode` child
is never returned as collapsible, so the chevron button never appears on a divider adjacent to a split-node child.

---

## Questions to Answer During Investigation

### 1. Where does `collapsible` / `collapseToward` need to be added?

Currently those fields live only on `PanelHostNode`. Options:

- **Move them to `LayoutNodeBase`** — makes all node types collapsible by config, clean and uniform.
- **Keep them on `PanelHostNode` and duplicate onto `SplitNode`** — more verbose, but avoids changing the shared base.

Moving to `LayoutNodeBase` is almost certainly cleaner. Confirm no consumers rely on `PanelHostNode`-specific typing for those fields
before doing so.

### 2. What does a collapsed `SplitNode` look like visually?

A collapsed `PanelHostNode` renders a `collapsed-strip` via `panel-host.ts`. A collapsed `SplitNode` has no equivalent — `split-pane`
renders nothing for it today. Options:

- **Delegate to a shared collapsed-strip component/helper** used by both `panel-host` and `split-pane`.
- **Render a minimal strip inline in `split-pane`** when the node is a collapsed `SplitNode` — similar to how `panel-host` does it but
  without tab info (just a generic "Column" or the first tab title of the first child panel-host).
- **Have `split-pane` render its collapsed state and delegate the strip to `panel-host` of its first leaf child** — complex, avoid.

The strip title for a collapsed `SplitNode` needs a label strategy. Candidates: first `PanelHostNode` leaf's first tab title, a
`metadata.label` field, or a hardcoded fallback.

### 3. How does `getCollapsibleSide()` need to change?

Currently:

```ts
if (before.type === "panel-host" && (before as PanelHostNode).collapsed) return "before";
if (after.type === "panel-host" && (after as PanelHostNode).collapsed) return "after";

if (before.type === "panel-host") {
  /* collapsible check */
}
if (after.type === "panel-host") {
  /* collapsible check */
}
```

It needs to accept `SplitNode` children too. The `collapsed` state check at the top already uses `LayoutNodeBase` fields and will work
once the type-guard is loosened. The `collapsible`/`collapseToward` checks need to handle `SplitNode` once those fields exist on it.

### 4. How does `computeChildStyle()` change?

It currently checks `child.type === "panel-host" && child.collapsed`. This needs to generalize to `child.collapsed` regardless of type
(both `SplitNode` and `PanelHostNode`). The `COLLAPSED_SIZE_PX` strip dimension is the same either way.

### 5. How does `onCollapseToggle()` change?

Currently casts to `PanelHostNode`. If `SplitNode` also carries `collapsed`, the cast can be dropped — just spread `collapsed` onto the
child regardless of type.

### 6. Persistence / saved layout compatibility

Saved layouts may not have `collapsible`/`collapseToward` on `SplitNode`s. Ensure defaults (`collapsible` absent = not collapsible,
`collapsed` absent = not collapsed) are handled gracefully without migration.

---

## Files to Touch

| File                              | Expected change                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `src/types/layout.ts`             | Move `collapsible` and `collapseToward` from `PanelHostNode` to `LayoutNodeBase`; or add them to `SplitNode` |
| `src/components/split-pane.ts`    | Update `getCollapsibleSide`, `computeChildStyle`, `onCollapseToggle`, and add split-node strip rendering     |
| `src/components/panel-host.ts`    | Possibly extract `renderCollapsed` to a shared helper if split-pane reuses it                                |
| `src/mock/newerdefault-layout.ts` | Mark `right-sidebar` (vertical split) as `collapsible: true, collapseToward: "end"` for smoke testing        |
| `src/mock/default-layout.ts`      | Same if applicable                                                                                           |

---

## Candidate Layout Nodes for Testing

In `newerdefault-layout.ts`:

- **`right-sidebar`** (`id: "right-sidebar"`, vertical split of inspector + diagnostics) — prime candidate for split-node collapse
  toward `"end"` (right edge). This is the main motivating use case.
- **`bottom-strip`** (`id: "bottom-strip"`, horizontal split of console + timeline) — could collapse toward `"end"` (bottom).
- **`left-sidebar`** is already a `panel-host`, not a split — no change needed there.

---

## Critical Invariants — Do Not Regress

| Rule                                                                                     | Why                                                                       |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `PanelHostNode` collapse still works exactly as before                                   | Existing behavior must not break                                          |
| `visible: false` and `collapsed: true` remain orthogonal                                 | Hidden panels stay hidden; collapsed panels show a strip                  |
| `alwaysVisible` panels/nodes cannot be collapsed                                         | Guard needed — same logic as the visibility guard                         |
| Flex-weight renormalization excludes collapsed split-nodes from the pool                 | Same `computeChildStyle` rule as for collapsed panel-hosts                |
| Drag-resize guard still blocks resizing across a collapsed child, regardless of its type | The line 141 check generalizes automatically if the type-guard is removed |
| A collapsed `SplitNode` renders a strip (not nothing)                                    | Zero-footprint is `visible: false`; a strip is `collapsed: true`          |

---

## Checklist

- [ ] Confirm `collapsible` / `collapseToward` move to `LayoutNodeBase` (or stay on both node types)
- [ ] Decide on strip label strategy for collapsed `SplitNode`
- [ ] Update `getCollapsibleSide()` to accept split-node children
- [ ] Update `computeChildStyle()` to check `child.collapsed` without type-gating on `panel-host`
- [ ] Update `onCollapseToggle()` to not cast to `PanelHostNode`
- [ ] Implement collapsed strip rendering path in `split-pane` (or shared helper)
- [ ] Mark `right-sidebar` collapsible in `newerdefault-layout.ts` for smoke testing
- [ ] Smoke test: split-node strip appears and clicking it expands
- [ ] Smoke test: collapse button appears on divider adjacent to a collapsible split-node
- [ ] Regression: `PanelHostNode` collapse unaffected
- [ ] Regression: `visible: false` panels still take zero space with no strip
