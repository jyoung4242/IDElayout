import { componentRegistry } from "./component-registry";
import "../mock/mock-viewport";
import "../mock/mock-console";
import "../mock/mock-tree";

componentRegistry.register({
  tag: "mock-viewport",
  factory: () => document.createElement("mock-viewport"),
  defaultProps: {},
  collapsible: false,
  meta: {
    title: "Viewport",
    icon: "🎮",
    category: "viewport",
    description: "Fake scene viewport for layout testing",
  },
  alwaysVisible: true,
});

componentRegistry.register({
  tag: "mock-console",
  factory: () => document.createElement("mock-console"),
  defaultProps: {},
  collapsible: true,
  defaultCollapseToward: "end",
  meta: {
    title: "Console",
    icon: "⬛",
    category: "console",
    description: "Streaming fake log output",
  },
});

componentRegistry.register({
  tag: "mock-tree",
  factory: () => document.createElement("mock-tree"),
  defaultProps: {},
  collapsible: true,
  defaultCollapseToward: "start",
  meta: {
    title: "Scene Tree",
    icon: "🌲",
    category: "scene",
    description: "Fake hierarchical scene structure",
  },
});
