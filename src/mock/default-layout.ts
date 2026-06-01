import type { WorkspaceLayout } from "../types/layout";

export const defaultLayout: WorkspaceLayout = {
  version: 1,
  root: {
    id: "root-split",
    type: "split",
    orientation: "horizontal",
    sizes: [1, 1, 1],
    children: [
      {
        id: "node-3r144s",
        type: "split",
        orientation: "horizontal",
        sizes: [1],
        children: [
          {
            id: "node-1e57sg",
            type: "split",
            orientation: "vertical",
            sizes: [1, 1],
            children: [
              {
                id: "node-c87ixo",
                type: "panel-host",
                titleBar: true,
                tabs: [
                  { id: "tab-r4fxsr", title: "Object Tree", componentTag: "mock-tree" },
                  { id: "tab-joibaw", title: "Assets", componentTag: "mock-asset-browser" },
                ],
              },
              {
                id: "node-jmtacd",
                type: "panel-host",
                titleBar: true,
                tabs: [{ id: "tab-vv31xw", title: "Project Config", componentTag: "mock-project-config" }],
              },
            ],
          },
        ],
      },
      {
        id: "node-5g8u8h",
        type: "split",
        orientation: "vertical",
        sizes: [1],
        children: [
          {
            id: "node-7txxzb",
            type: "split",
            orientation: "vertical",
            sizes: [1, 1],
            children: [
              {
                id: "node-542lcq",
                type: "panel-host",
                titleBar: true,
                tabs: [
                  { id: "tab-kq0azt", title: "Scene Editor", componentTag: "mock-viewport" },
                  { id: "tab-3vqtvi", title: "Level Editor", componentTag: "mock-level-editor" },
                  { id: "tab-6uk6py", title: "Script Editor", componentTag: "mock-editor" },
                  { id: "tab-2sfxf5", title: "Shader Editor", componentTag: "mock-shader-preview" },
                ],
              },
              {
                id: "node-v3pal8",
                type: "panel-host",
                titleBar: true,
                collapsible: true,
                closable: true,
                collapseToward: "end",
                tabs: [{ id: "tab-0090fc", title: "console Log", componentTag: "mock-console" }],
              },
            ],
          },
        ],
      },
      {
        id: "node-vu2le7",
        type: "panel-host",
        titleBar: true,
        collapsible: true,
        closable: true,
        collapseToward: "end",
        tabs: [{ id: "tab-r2ddpm", title: "Property Inspector", componentTag: "mock-inspector" }],
      },
    ],
  },
};
