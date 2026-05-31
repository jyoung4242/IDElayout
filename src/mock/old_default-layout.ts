import type { WorkspaceLayout } from "../types/layout";

export const defaultLayout: WorkspaceLayout = {
  version: 1,
  root: {
    id: "root",
    type: "split",
    orientation: "horizontal",
    sizes: [0.18, 0.55, 0.27],
    children: [
      {
        id: "left",
        type: "panel-host",
        tabs: [{ id: "scene-tree", title: "Scene", icon: "🌲", pinned: true, componentTag: "mock-tree" }],
        activeTabId: "scene-tree",
        collapsible: true,
        collapseToward: "start",
      },
      {
        id: "center",
        type: "split",
        orientation: "vertical",
        sizes: [0.7, 0.3],
        children: [
          {
            id: "center-top",
            type: "panel-host",
            tabs: [{ id: "viewport", title: "Viewport", icon: "🎮", pinned: true, componentTag: "mock-viewport" }],
            activeTabId: "viewport",
            collapsible: false,
          },
          {
            id: "center-bottom",
            type: "panel-host",
            tabs: [
              { id: "console", title: "Console", icon: "⬛", closable: true, componentTag: "mock-console" },
              { id: "problems", title: "Problems", icon: "⚠️", closable: true, dirty: true, componentTag: "mock-console" },
            ],
            activeTabId: "console",
            collapsible: true,
            collapseToward: "end",
          },
        ],
      },
      {
        id: "right",
        type: "panel-host",
        tabs: [{ id: "inspector", title: "Inspector", icon: "🔧", pinned: true, componentTag: "mock-tree" }],
        activeTabId: "inspector",
        collapsible: true,
        collapseToward: "end",
      },
    ],
  },
};
