import { componentRegistry } from "./component-registry";

// Existing mocks
import "../mock/mock-viewport";
import "../mock/mock-console";
import "../mock/mock-tree";

// New mocks
import "../mock/mock-inspector";
import "../mock/mock-asset-browser";
import "../mock/mock-timeline";
import "../mock/mock-shader-preview";
import "../mock/mock-diagnostics";
import "../mock/mock-editor";
import "../mock/mock-project";
import "../mock/mock-level-editor";

// ── Existing registrations ──────────────────────────────────────────────────

componentRegistry.register({
  tag: "mock-viewport",
  factory: () => document.createElement("mock-viewport"),
  collapsible: false,
  alwaysVisible: false,
  meta: {
    title: "Viewport",
    icon: "🎮",
    category: "viewport",
    description: "Fake scene canvas",
  },
});

componentRegistry.register({
  tag: "mock-console",
  factory: () => document.createElement("mock-console"),
  collapsible: false,
  alwaysVisible: false,
  meta: {
    title: "Console",
    icon: "💬",
    category: "console",
    description: "Fake log output",
  },
});

componentRegistry.register({
  tag: "mock-tree",
  factory: () => document.createElement("mock-tree"),
  collapsible: true,
  defaultCollapseToward: "start",
  alwaysVisible: false,
  meta: {
    title: "Scene",
    icon: "🌲",
    category: "scene",
    description: "Fake hierarchy tree",
  },
});

// ── New registrations ───────────────────────────────────────────────────────

componentRegistry.register({
  tag: "mock-inspector",
  factory: () => document.createElement("mock-inspector"),
  defaultProps: { entityId: "entity-001" },
  collapsible: false,
  alwaysVisible: false,
  meta: {
    title: "Inspector",
    icon: "⚙",
    category: "inspector",
    description: "Entity property editor",
  },
});

componentRegistry.register({
  tag: "mock-asset-browser",
  factory: () => document.createElement("mock-asset-browser"),
  defaultProps: { viewMode: "grid" },
  collapsible: false,
  alwaysVisible: false,
  meta: {
    title: "Assets",
    icon: "🗂",
    category: "asset",
    description: "Game asset browser",
  },
});

componentRegistry.register({
  tag: "mock-timeline",
  factory: () => document.createElement("mock-timeline"),
  defaultProps: { frameCount: 64 },
  collapsible: false,
  alwaysVisible: false,
  meta: {
    title: "Timeline",
    icon: "⏱",
    category: "tool", // no "animation" category; "tool" is the closest fit
    description: "Animation timeline editor",
  },
});

componentRegistry.register({
  tag: "mock-shader-preview",
  factory: () => document.createElement("mock-shader-preview"),
  collapsible: false,
  alwaysVisible: false,
  meta: {
    title: "Shader Preview",
    icon: "◈",
    category: "viewport",
    description: "Live shader preview panel",
  },
});

componentRegistry.register({
  tag: "mock-diagnostics",
  factory: () => document.createElement("mock-diagnostics"),
  defaultProps: { updateIntervalMs: 500 },
  collapsible: false,
  alwaysVisible: false,
  meta: {
    title: "Diagnostics",
    icon: "📊",
    category: "console", // output/profiler lives alongside console tooling
    description: "Performance profiler",
  },
});

componentRegistry.register({
  tag: "mock-editor",
  factory: () => document.createElement("mock-editor"),
  collapsible: false,
  alwaysVisible: false,
  meta: {
    title: "Code Editor",
    icon: "📝",
    category: "code",
    description: "Fake code editor with syntax highlighting",
  },
});

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
