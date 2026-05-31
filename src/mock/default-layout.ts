import type { WorkspaceLayout } from "../types/layout";

export const defaultLayout: WorkspaceLayout = {
  version: 1,
  root: {
    id: "root",
    type: "split",
    orientation: "horizontal",
    sizes: [15, 65, 20],
    minSizes: [5, 30, 10],
    children: [
      // ── Left sidebar ────────────────────────────────────────────────────────
      {
        id: "left-sidebar",
        type: "panel-host",
        titleBar: true,
        closable: false,
        collapsible: true,
        collapseToward: "start",
        activeTabId: "tab-tree",
        tabs: [
          {
            id: "tab-tree",
            title: "Scene",
            icon: "🌲",
            closable: false,
            dirty: false,
            componentTag: "mock-tree",
          },
          {
            id: "tab-assets",
            title: "Assets",
            icon: "🗂",
            closable: false,
            dirty: false,
            componentTag: "mock-asset-browser",
            componentProps: { viewMode: "grid" },
          },
        ],
      },

      // ── Center column ──────────────────────────────────────────────────────
      {
        id: "center-column",
        type: "split",
        orientation: "vertical",
        sizes: [70, 30],
        minSizes: [20, 15],
        children: [
          {
            id: "viewport-host",
            type: "panel-host",
            titleBar: true,
            closable: false,
            collapsible: false,
            activeTabId: "tab-viewport",
            tabs: [
              {
                id: "tab-viewport",
                title: "Viewport",
                icon: "🎮",
                closable: false,
                dirty: false,
                componentTag: "mock-viewport",
              },
              {
                id: "tab-shader",
                title: "Shader Preview",
                icon: "◈",
                closable: true,
                dirty: false,
                componentTag: "mock-shader-preview",
              },
            ],
          },
          {
            id: "bottom-strip",
            type: "split",
            orientation: "horizontal",
            sizes: [50, 50],
            minSizes: [20, 20],
            children: [
              {
                id: "console-host",
                type: "panel-host",
                titleBar: true,
                closable: false,
                collapsible: false,
                activeTabId: "tab-console",
                tabs: [
                  {
                    id: "tab-console",
                    title: "Console",
                    icon: "💬",
                    closable: false,
                    dirty: false,
                    componentTag: "mock-console",
                  },
                ],
              },
              {
                id: "timeline-host",
                type: "panel-host",
                titleBar: true,
                closable: false,
                collapsible: false,
                activeTabId: "tab-timeline",
                tabs: [
                  {
                    id: "tab-timeline",
                    title: "Timeline",
                    icon: "⏱",
                    closable: false,
                    dirty: false,
                    componentTag: "mock-timeline",
                    componentProps: { frameCount: 64 },
                  },
                ],
              },
            ],
          },
        ],
      },

      // ── Right sidebar ──────────────────────────────────────────────────────
      {
        id: "right-sidebar",
        type: "split",
        orientation: "vertical",
        sizes: [50, 50],
        minSizes: [15, 15],
        children: [
          {
            id: "inspector-host",
            type: "panel-host",
            titleBar: true,
            closable: false,
            collapsible: false,
            activeTabId: "tab-inspector",
            tabs: [
              {
                id: "tab-inspector",
                title: "Inspector",
                icon: "⚙",
                closable: false,
                dirty: false,
                componentTag: "mock-inspector",
                componentProps: { entityId: "entity-001" },
              },
            ],
          },
          {
            id: "diagnostics-host",
            type: "panel-host",
            titleBar: true,
            closable: false,
            collapsible: true,
            collapseToward: "end",
            activeTabId: "tab-diagnostics",
            tabs: [
              {
                id: "tab-diagnostics",
                title: "Diagnostics",
                icon: "📊",
                closable: false,
                dirty: false,
                componentTag: "mock-diagnostics",
                componentProps: { updateIntervalMs: 500 },
              },
            ],
          },
        ],
      },
    ],
  },
};
