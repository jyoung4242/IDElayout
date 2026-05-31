# ExcaliburJS Editor Framework — Specification Summary

## Project Goal

Create a modular, IDE-style editor framework for ExcaliburJS using Lit.

The framework is intended to serve as the foundational infrastructure for future editor tooling while remaining:

- Content agnostic
- Themeable
- Composable
- Serializable
- Extensible
- IDE-oriented

The current focus is on layout infrastructure and workspace management rather than editor-specific functionality.

## Core Architectural Philosophy

The editor framework should:

- Use Lit web components throughout
- Utilize recursive split-based layouts
- Support tabbed panel workspaces
- Separate layout orchestration from content rendering
- Remain agnostic to actual editor tools/content
- Support future extensibility without overengineering the initial implementation

The architecture should resemble the flexibility of:

- Visual Studio Code
- Godot
- JetBrains
- IntelliJ IDEA
- Unity
- Unreal Engine

## Workspace Layout System Recursive Split Layouts

The editor workspace is structured as a recursive tree of layout nodes.

Supported layout capabilities include:

- Horizontal splits
- Vertical splits
- Arbitrary recursive nesting
- Resizable regions
- Collapsible regions
- Hidden regions
- Persistent sizing state

##2 Panel Hosts

The original "panel" concept evolved into:

### Panel Hosts

A panel host is a tab-aware layout container responsible for:

- Managing tabs
- Managing active views
- Rendering optional panel chrome
- Hosting arbitrary Lit content
- Participating in split layouts

Panel hosts remain content agnostic.

### Tabbed Panels

Tabbed panels are now considered a core foundational feature.

Supported capabilities include:

- Multiple tabs per panel host
- Active tab switching
- Closable tabs
- Optional pinned tabs
- Dirty-state indicators
- Dynamic tabregistration/removal
- Tab overflow handling

Future extensibility considerations include:

- Drag-reordering tabs
- Dragging tabs between hosts
- Detached/floating tabs
- Split-from-tab workflows

These are deferred for later phases.

### Header and Status Bar

#### Header Bar

Persistent top-level composable region intended for future Lit components such as:

- Project title
- Theme selection
- Build/compile controls
- Tool controls
- Scene selection
- Search/actions

The header acts as a flexible shell rather than a hardcoded toolbar.

#### Status Bar

Persistent bottom utility region supporting future widgets such as:

- FPS
- Notifications
- Compile state
- Cursor position
- Grid snapping
- Git status

Like the header, it remains composable and content agnostic.

#### Theme System

The editor uses a centralized holistic theme architecture based primarily on CSS custom properties.

The theme system should support:

- Light/dark modes
- Accent color changes
- Typography adjustments
- Radius scales
- Shadows/elevation
- Divider styling
- Panel styling
- Tab styling
- Hover/active/focus states

The system emphasizes broad visual customization through a minimal set of configurable variables.

### Layout Tree Data Model

The workspace layout is represented as a recursive serializable tree.

#### Layout Node Types

Currently defined node types:

```ts
type LayoutNode = SplitNode | PanelHostNode;
```

#### Base Layout Node

All nodes share common metadata:

```ts
interface LayoutNodeBase {
  id: string;
  type: LayoutNodeType;

  visible?: boolean;

  collapsed?: boolean;

  metadata?: Record<string, unknown>;
}
```

#### Split Nodes

Split nodes represent recursive workspace subdivisions.

Responsibilities include:

- Orientation management
- Child layout
- Divider relationships
- Relative sizing

Structure:

```ts
interface SplitNode extends LayoutNodeBase {
  type: "split";

  orientation: "horizontal" | "vertical";

  children: LayoutNode[];

  sizes: number[];

  minSizes?: number[];

  maxSizes?: number[];

  dividerSize?: number;
}
```

Key decisions:

- Relative proportional sizing preferred
- Recursive nesting supported Split nodes own resize orchestration

#### Panel Host Nodes

Panel hosts represent tabbed workspace regions.

Structure:

```ts
interface PanelHostNode extends LayoutNodeBase {
  type: "panel-host";

  tabs: PanelTabNode[];

  activeTabId?: string;

  titleBar?: boolean;

  closable?: boolean;
}
```

Responsibilities include:

- Tab management
- Active tab tracking
- Visibility/collapse state

#### Tab Nodes

Tabs are descriptors for dynamically mounted Lit components.

Structure:

```ts
interface PanelTabNode {
  id: string;

  title: string;

  icon?: string;

  closable?: boolean;

  pinned?: boolean;

  dirty?: boolean;

  componentTag?: string;

  componentProps?: Record<string, unknown>;

  metadata?: Record<string, unknown>;
}
```

Important architectural decision:

Tabs do NOT contain actual rendered content.

Instead they describe:

- What Lit component to instantiate
- What props to pass
- Metadata/state about the view

This enables:

- Serialization
- Dynamic registration
- Plugin extensibility
- Lazy loading
- Workspace restoration

### Component Rendering Philosophy

Rendering flow:

- Resolve active tab
- Read componentTag
- Instantiate corresponding Lit component
- Pass componentProps

Potential future registry:

```ts
interface EditorComponentRegistry {
  [tagName: string]: ComponentDefinition;
}
```

### Visibility and Collapse Model

#### Visible

```ts
visible?: boolean;
```

When false:

- Removed from layout flow
- No rendered footprint

#### Collapsed

```ts
collapsed?: boolean;
```

When true:

- Remains in layout tree
- Minimal collapsed representation shown
- Previous size preserved

### Persistence Goals

The layout system is designed for full serialization and restoration.

Potential wrapper:

```ts
interface WorkspaceLayout {
  version: number;

  root: LayoutNode;

  theme?: string;

  metadata?: Record<string, unknown>;
}
```

Persistence targets may include:

- localStorage
- Workspace files
- Future cloud sync

### Accessibility Goals

The editor framework should support:

- Keyboard resizing
- Keyboard tab switching
- Keyboard collapse/expand
- Focus management
- ARIA split-pane semantics
- ARIA tab semantics
- Screen reader compatibility Current Technical Direction

Recommended stack:

- TypeScript
- Lit
- CSS
- Custom Properties
- Pointer Events API
- ResizeObserver
