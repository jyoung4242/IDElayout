export type LayoutNodeType = "split" | "panel-host";

export interface LayoutNodeBase {
  id: string;
  type: LayoutNodeType;
  visible?: boolean;
  collapsed?: boolean;
  metadata?: Record<string, unknown>;
}

export interface SplitNode extends LayoutNodeBase {
  type: "split";
  orientation: "horizontal" | "vertical";
  children: LayoutNode[];
  sizes: number[]; // proportional 0–1, must sum to 1
  minSizes?: number[];
  maxSizes?: number[];
  dividerSize?: number;
}

export interface PanelHostNode extends LayoutNodeBase {
  type: "panel-host";
  tabs: PanelTabNode[];
  activeTabId?: string;
  titleBar?: boolean;
  closable?: boolean;
  collapsible?: boolean;
  collapseToward?: "start" | "end";
}

export interface PanelTabNode {
  id: string;
  title: string;
  icon?: string;
  closable?: boolean;
  dirty?: boolean;
  componentTag?: string;
  componentProps?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export type LayoutNode = SplitNode | PanelHostNode;

export interface WorkspaceLayout {
  version: number;
  root: LayoutNode;
  theme?: string;
  metadata?: Record<string, unknown>;
}
