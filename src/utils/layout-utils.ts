// src/utils/layout-utils.ts

import type { LayoutNode, SplitNode, PanelHostNode } from "../types/layout";

// ---------------------------------------------------------------------------
// Generic recursive tree walker
// visitor returns false to stop descending into that node's children
// ---------------------------------------------------------------------------
export function walkTree(
  node: LayoutNode,
  visitor: (node: LayoutNode, parent: SplitNode | null, indexInParent: number) => boolean | void,
  parent: SplitNode | null = null,
  indexInParent = 0,
): void {
  const descend = visitor(node, parent, indexInParent);
  if (descend === false) return;
  if (node.type === "split") {
    node.children.forEach((child, i) => walkTree(child, visitor, node, i));
  }
}

// ---------------------------------------------------------------------------
// Collect all PanelHostNodes in tree order (depth-first)
// ---------------------------------------------------------------------------
export function collectPanelHosts(root: LayoutNode): PanelHostNode[] {
  const results: PanelHostNode[] = [];
  walkTree(root, node => {
    if (node.type === "panel-host") results.push(node);
  });
  return results;
}

// ---------------------------------------------------------------------------
// Count how many siblings of a given node would still be visible after hiding it
// Returns Infinity if the parent is not a SplitNode (no siblings → no constraint)
// ---------------------------------------------------------------------------
export function countVisibleSiblings(root: LayoutNode, targetId: string): number {
  let count = Infinity;
  walkTree(root, node => {
    if (node.type === "split") {
      const targetIndex = node.children.findIndex(c => c.id === targetId);
      if (targetIndex !== -1) {
        // count siblings that are visible (visible !== false) and not the target
        count = node.children.filter((c, i) => i !== targetIndex && c.visible !== false).length;
        return false; // found the parent, stop
      }
    }
  });
  return count;
}

// ---------------------------------------------------------------------------
// Toggle visible on a node by id, with all-hidden guard
// Returns a new root node (immutable update), or null if the toggle was blocked
// ---------------------------------------------------------------------------
import { componentRegistry } from "../registry/component-registry";

export function toggleNodeVisibility(root: LayoutNode, targetId: string): LayoutNode | null {
  let target: LayoutNode | null = null;
  walkTree(root, node => {
    if (node.id === targetId) target = node;
  });
  if (!target) return null;

  //@ts-expect-error
  const isCurrentlyVisible = target.visible !== false;

  if (isCurrentlyVisible) {
    // Guard 1: would leave no visible siblings
    const visibleSiblingCount = countVisibleSiblings(root, targetId);
    if (visibleSiblingCount === 0) return null;

    // Guard 2: any tab in this panel uses an alwaysVisible component
    //@ts-expect-error
    if (target.type === "panel-host") {
      //@ts-expect-error
      const isProtected = target.tabs.some(tab => {
        if (!tab.componentTag) return false;
        return componentRegistry.resolve(tab.componentTag)?.alwaysVisible === true;
      });
      if (isProtected) return null;
    }
  }

  return updateNodeInTree(root, targetId, node => ({
    ...node,
    visible: !isCurrentlyVisible,
  }));
}

// ---------------------------------------------------------------------------
// Immutable point-update: walk tree, replace node with given id via updater fn
// Returns a new tree root; all ancestor nodes along the path are new objects,
// unaffected subtrees are shared (structural sharing)
// ---------------------------------------------------------------------------
export function updateNodeInTree(root: LayoutNode, targetId: string, updater: (node: LayoutNode) => LayoutNode): LayoutNode {
  if (root.id === targetId) return updater(root);

  if (root.type === "split") {
    let changed = false;
    const newChildren = root.children.map(child => {
      const updated = updateNodeInTree(child, targetId, updater);
      if (updated !== child) changed = true;
      return updated;
    });
    if (!changed) return root;
    return { ...root, children: newChildren };
  }

  return root; // PanelHostNode with non-matching id, no children to recurse
}

// ---------------------------------------------------------------------------
// Get a display label for a PanelHostNode for use in menus
// Format: "Title (N tabs)"  or  "Title (1 tab)"
// Falls back to node id if no registry title is available
// ---------------------------------------------------------------------------
export function getPanelLabel(node: PanelHostNode, registryTitle?: string): string {
  const title = registryTitle ?? node.tabs[0]?.title ?? node.id;
  const count = node.tabs.length;
  const tabWord = count === 1 ? "tab" : "tabs";
  return `${title} (${count} ${tabWord})`;
}

// ---------------------------------------------------------------------------
// Shallow check: is a given node effectively visible in the layout?
// A node is invisible if it or any ancestor has visible === false
// (split-pane handles this at render time, but useful for external checks)
// ---------------------------------------------------------------------------
export function isNodeVisible(root: LayoutNode, targetId: string): boolean {
  // DFS tracking ancestor visibility
  function search(node: LayoutNode, ancestorHidden: boolean): boolean | null {
    const hidden = ancestorHidden || node.visible === false;
    if (node.id === targetId) return !hidden;
    if (node.type === "split") {
      for (const child of node.children) {
        const result = search(child, hidden);
        if (result !== null) return result;
      }
    }
    return null;
  }
  return search(root, false) ?? true;
}
