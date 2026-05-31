# Additional Specification — Development Mock Content System

## Purpose

The editor framework should include a lightweight mock content system intended purely for development, testing, and layout iteration.

This allows the layout framework to be exercised independently from real editor tooling.

The goal is to rapidly validate:

- Split behavior
- Resize interactions
- Collapse mechanics
- Tab systems
- Overflow handling
- Theming Header/status composition
- Workspace persistence
- Rendering performance

without requiring actual editor implementations.

## Core Philosophy

Mock content components are:

- Disposable
- Lightweight
- Generic
- Visually distinct
- Development-oriented

They are NOT production editor tools.

They exist to stress and validate the workspace/layout infrastructure.

## Mock Component Goals

The system should make it trivial to:

- Spawn fake panels
- Create arbitrary tab layouts
- Test deeply nested split trees
- Exercise resizing/collapse edge cases
- Validate theme behavior
- Test overflow scenarios
- Rapidly prototype workspace arrangements

## Mock Component Requirements

Mock components should support:

- Arbitrary titles
- Randomized content
- Adjustable minimum sizes
- Adjustable preferred sizes
- Optional icons
- Optional fake toolbar content
- Optional scrollable content
- Optional stress-test rendering

## Suggested Mock Components

### Mock Text Panel

Simple placeholder content:

`Lorem ipsum / diagnostics / fake logs`

Used for:

- Scroll testing
- Typography validation
- Theme validation

### Mock Tree Panel

Fake hierarchical structures.

Used for:

- Sidebar sizing
- Overflow behavior
- Scroll interactions

Example:

Scene ├── Player ├── Enemy └── Environment

### Mock Grid Panel

Renders grid-like fake content.

Used for:

- Asset browser simulations
- Dense layout testing

### Mock Viewport Panel

Fake "editor viewport" surface.

Used for:

- Center workspace sizing
- Focus validation
- Performance testing

Potential features:

- Animated background
- Grid overlay
- Fake scene bounds

### Mock Console Panel

Streaming fake log output.

Used for:

- Bottom panel sizing
- Auto-scroll testing
- Overflow testing

### Development Utility Components Workspace Generator

A helper system should exist to generate randomized layouts.

Purpose:

- Stress testing
- Rapid UI iteration
- Persistence validation

Example capabilities:

- Generate random split trees
- Spawn random tab counts
- Randomize panel visibility
- Randomize collapsed states

### Mock Registry Integration

Mock components should integrate through the same component registry system as real editor tools.

Example:

```ts
{
  componentTag: "mock-console-panel";
}
```

This ensures:

- Realistic rendering paths
- Accurate lifecycle testing
- Registry validation
- Serialization validation

### Theme Validation Goals

Mock content should intentionally exercise:

- Typography
- Scrollbars
- Focus states
- Hover states
- Active tabs
- Borders
- Shadows
- Divider visibility

### Layout Stress Testing Goals

Mock layouts should help validate:

- Recursive nesting
- Tiny panel constraints
- Divider edge cases
- Hidden/collapsed restoration
- Resize persistence
- Tab overflow handling
- Performance under large trees
