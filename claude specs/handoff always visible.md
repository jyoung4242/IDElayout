# ExcaliburIDE — Session Handoff: Workspace Panel Always-Visible

## Sprint Goal

Investigate and implement `visible?: boolean` support on panels, with the specific requirement that the **main workspace panel is
always visible** (i.e. it cannot be hidden by the user).

---

## Background

The IDE uses a modular panel layout system. Two related but distinct concepts exist:

| Concept      | Behavior                                                   | Strip / Divider footprint         |
| ------------ | ---------------------------------------------------------- | --------------------------------- |
| **Collapse** | Panel collapses to a narrow strip; chevron control remains | Yes — strip + divider stay in DOM |
| **Visible**  | Panel is entirely absent from layout; zero space           | No — no strip, no divider         |

The `visible` feature was planned after collapse was implemented. Hidden panels take zero space with no strip or divider footprint —
this is the key distinction from collapse.

The **main workspace panel** should be hardcoded (or configured) as `visible: true` with no way for the user to toggle it off.

---

## What to Investigate First

### 1. How is the panel config currently shaped?

Find the panel definition type/interface (likely in `src/types` or co-located with the layout engine). Check whether a
`visible?: boolean` field already exists or needs to be added.

### 2. How does the layout engine consume panel config?

Trace how panels are iterated to produce flex children. The `visible` check should gate a panel out of that iteration entirely — no
strip, no divider rendered for it.

### 3. Where is the main workspace panel defined?

Find where the workspace panel is instantiated/configured and confirm it's the correct candidate for `alwaysVisible` / `visible: true`
enforcement.

### 4. Is there a `canHide` or `alwaysVisible` guard needed?

Decide whether to use:

- `visible: true` (default) / `visible: false` (hidden) as a runtime-toggleable flag, **plus**
- A separate `alwaysVisible?: boolean` or `canHide?: boolean` flag that prevents the UI from ever offering a hide control for that
  panel

Or simply: the workspace panel's `visible` is set to `true` and no hide affordance is rendered for it.

---

## Relevant Prior Work

- **Collapse feature** (last sprint) — implemented strip rendering, chevron controls, and flex-weight renormalization when a panel
  collapses. The `visible` implementation will follow a similar pattern but must remove the panel from layout entirely rather than
  rendering a strip.
- **`editor-header.ts`** — theme menu outside-click bug fixed this sprint (see prior handoff). No relation to panel visibility but
  confirms the header component is stable.

---

## Files Likely to Touch

| File                                  | Expected change                                            |
| ------------------------------------- | ---------------------------------------------------------- |
| Panel type/interface                  | Add `visible?: boolean`, `alwaysVisible?: boolean`         |
| Layout engine / panel renderer        | Gate panel rendering on `visible !== false`                |
| Workspace panel config/definition     | Set `visible: true`, `alwaysVisible: true` (or equivalent) |
| Hide/show UI controls (if they exist) | Suppress hide affordance when `alwaysVisible` is set       |

---

## Checklist

- [ ] Locate panel config type and confirm shape
- [ ] Decide on `visible` + `alwaysVisible` vs. a single approach
- [ ] Add `visible?: boolean` to panel type (default `true`)
- [ ] Update layout engine to skip hidden panels entirely (no strip, no divider)
- [ ] Mark workspace panel as always-visible in config
- [ ] Suppress any hide UI affordance for always-visible panels
- [ ] Smoke test: hidden panel leaves zero layout footprint
- [ ] Smoke test: workspace panel has no hide control and cannot be hidden
- [ ] Regression: collapse still works independently of visibility

---

## Critical Invariants — Do Not Regress

| Rule                                                                                       | Why                                                                                                 |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `visible: false` means zero layout footprint — no strip, no divider                        | This is what distinguishes it from collapse                                                         |
| Collapse and visibility are orthogonal flags                                               | A panel could be `visible: true, collapsed: true` (strip shown) or `visible: false` (nothing shown) |
| `alwaysVisible` panels must have no hide affordance in the UI                              | Prevent the user from accidentally hiding the workspace                                             |
| Flex-weight renormalization (from collapse sprint) must still work after a panel is hidden | Remaining visible panels should fill the space correctly                                            |
