// import { LitElement, html, css } from "lit";
// import { customElement, property, state } from "lit/decorators.js";
// import { sharedStyles } from "../styles/shared";
// import type { LayoutNode, SplitNode, PanelHostNode } from "../types/layout";
// import "./panel-host";

// const COLLAPSED_SIZE_PX = 32; // matches --editor-tab-h

// @customElement("split-pane")
// export class SplitPane extends LitElement {
//   static styles = [
//     sharedStyles,
//     css`
//       :host {
//         display: flex;
//         flex: 1;
//         min-width: 0;
//         min-height: 0;
//         overflow: hidden;
//       }
//       .split-h {
//         flex-direction: row;
//       }
//       .split-v {
//         flex-direction: column;
//       }
//       .container {
//         display: flex;
//         flex: 1;
//         min-width: 0;
//         min-height: 0;
//         overflow: hidden;
//       }
//       .child {
//         display: flex;
//         min-width: 0;
//         min-height: 0;
//         overflow: hidden;
//       }
//       .divider-h {
//         width: var(--editor-divider);
//         cursor: col-resize;
//         background: var(--editor-border);
//         flex-shrink: 0;
//         transition: background 0.15s;
//         position: relative;
//         z-index: 10;
//       }
//       .divider-v {
//         height: var(--editor-divider);
//         cursor: row-resize;
//         background: var(--editor-border);
//         flex-shrink: 0;
//         transition: background 0.15s;
//         position: relative;
//         z-index: 10;
//       }
//       .divider-h:hover,
//       .divider-h.dragging,
//       .divider-v:hover,
//       .divider-v.dragging {
//         background: var(--editor-accent);
//       }

//       /* Collapse toggle button on dividers */
//       .collapse-btn {
//         position: absolute;
//         top: 50%;
//         left: 50%;
//         transform: translate(-50%, -50%);
//         width: 16px;
//         height: 16px;
//         border-radius: 50%;
//         background: var(--editor-accent);
//         border: none;
//         cursor: pointer;
//         display: flex;
//         align-items: center;
//         justify-content: center;
//         font-size: 10px;
//         color: var(--editor-bg);
//         opacity: 0;
//         transition: opacity 0.15s;
//         z-index: 20;
//         line-height: 1;
//         padding: 0;
//       }

//       .divider-v .collapse-btn {
//         width: 20px; /* wider to fit ʌ v comfortably */
//         height: 12px; /* shorter since the divider is horizontal */
//         border-radius: 3px; /* pill instead of circle fits better */
//         font-size: 11px;
//       }

//       .divider-h:hover .collapse-btn,
//       .divider-v:hover .collapse-btn,
//       .collapse-btn.always-visible {
//         opacity: 1;
//       }
//     `,
//   ];

//   @property({ type: Object }) node!: LayoutNode;
//   @state() private draggingIndex: number | null = null;

//   private dragStart = { x: 0, y: 0, sizes: [] as number[] };
//   private containerSize = 0;

//   // ── Drag-to-resize ──────────────────────────────────────────────

//   private onDividerMouseDown(e: MouseEvent, index: number) {
//     e.preventDefault();
//     const split = this.node as SplitNode;
//     const container = this.shadowRoot!.querySelector(".container") as HTMLElement;
//     const rect = container.getBoundingClientRect();
//     this.containerSize = split.orientation === "horizontal" ? rect.width : rect.height;
//     this.dragStart = { x: e.clientX, y: e.clientY, sizes: [...split.sizes] };
//     this.draggingIndex = index;

//     const onMove = (ev: MouseEvent) => this.onDividerMouseMove(ev, index);
//     const onUp = () => {
//       this.draggingIndex = null;
//       window.removeEventListener("mousemove", onMove);
//       window.removeEventListener("mouseup", onUp);
//     };
//     window.addEventListener("mousemove", onMove);
//     window.addEventListener("mouseup", onUp);
//   }

//   private onDividerMouseMove(e: MouseEvent, index: number) {
//     const split = this.node as SplitNode;
//     const isH = split.orientation === "horizontal";
//     const delta = isH ? e.clientX - this.dragStart.x : e.clientY - this.dragStart.y;
//     const proportion = delta / this.containerSize;
//     const newSizes = [...this.dragStart.sizes];
//     const minSize = 0.05;

//     // Don't allow dragging a collapsed panel
//     const leftChild = split.children[index] as PanelHostNode;
//     const rightChild = split.children[index + 1] as PanelHostNode;
//     if (leftChild.collapsed || rightChild.collapsed) return;

//     newSizes[index] = Math.max(minSize, this.dragStart.sizes[index] + proportion);
//     newSizes[index + 1] = Math.max(minSize, this.dragStart.sizes[index + 1] - proportion);

//     const origTotal = this.dragStart.sizes[index] + this.dragStart.sizes[index + 1];
//     const newTotal = newSizes[index] + newSizes[index + 1];
//     newSizes[index] = (newSizes[index] / newTotal) * origTotal;
//     newSizes[index + 1] = (newSizes[index + 1] / newTotal) * origTotal;

//     this.emitLayoutChange({ ...split, sizes: newSizes });
//   }

//   // ── Collapse logic ───────────────────────────────────────────────

//   /**
//    * Determines which child the divider at `dividerIndex` can collapse.
//    * A divider sits between children[dividerIndex] and children[dividerIndex+1].
//    * We collapse whichever side is collapsible — preferring "start" (left/top child)
//    * when both are collapsible.
//    */
//   private getCollapsibleSide(split: SplitNode, dividerIndex: number): "before" | "after" | null {
//     const before = split.children[dividerIndex];
//     const after = split.children[dividerIndex + 1];

//     if (!before || !after) return null;

//     // Check already-collapsed state first (either side)
//     if (before.type === "panel-host" && (before as PanelHostNode).collapsed) return "before";
//     if (after.type === "panel-host" && (after as PanelHostNode).collapsed) return "after";

//     // Neither collapsed yet — find which side is a collapsible PanelHostNode
//     if (before.type === "panel-host") {
//       const b = before as PanelHostNode;
//       if (b.collapsible && b.collapseToward === "start") return "before";
//     }
//     if (after.type === "panel-host") {
//       const a = after as PanelHostNode;
//       if (a.collapsible && a.collapseToward === "end") return "after";
//     }

//     // Fallback — either side if collapsible
//     if (before.type === "panel-host" && (before as PanelHostNode).collapsible) return "before";
//     if (after.type === "panel-host" && (after as PanelHostNode).collapsible) return "after";

//     return null;
//   }

//   private onCollapseToggle(e: MouseEvent, dividerIndex: number) {
//     e.stopPropagation();
//     const split = this.node as SplitNode;
//     const side = this.getCollapsibleSide(split, dividerIndex);
//     if (!side) return;

//     const childIndex = side === "before" ? dividerIndex : dividerIndex + 1;
//     const child = split.children[childIndex] as PanelHostNode;
//     const isCollapsing = !child.collapsed;

//     const newChildren = split.children.map((c, i) => {
//       if (i !== childIndex) return c;
//       return { ...c, collapsed: isCollapsing } as PanelHostNode;
//     });

//     this.emitLayoutChange({ ...split, children: newChildren });
//   }

//   private onDividerDblClick(e: MouseEvent, dividerIndex: number) {
//     this.onCollapseToggle(e, dividerIndex);
//   }

//   // ── Child size computation ───────────────────────────────────────

//   /**
//    * Returns the CSS flex string for a child, accounting for collapse.
//    * Collapsed children get a fixed pixel size; the remaining flex space
//    * is redistributed among non-collapsed siblings proportionally.
//    */
//   private computeChildStyle(split: SplitNode, index: number): string {
//     const isH = split.orientation === "horizontal";
//     const child = split.children[index];

//     if (child.type === "panel-host" && child.collapsed) {
//       const dim = isH ? `width: ${COLLAPSED_SIZE_PX}px` : `height: ${COLLAPSED_SIZE_PX}px`;
//       return `flex: 0 0 ${COLLAPSED_SIZE_PX}px; ${dim}; min-width: 0; min-height: 0; display: flex;`;
//     }

//     // Sum only the non-collapsed children's sizes so flex proportions fill remaining space
//     const expandedTotal = split.children.reduce((sum, c, i) => {
//       if (c.type === "panel-host" && c.collapsed) return sum;
//       return sum + (split.sizes[i] ?? 0);
//     }, 0);

//     const normalizedSize = (split.sizes[index] ?? 0) / (expandedTotal || 1);

//     return isH
//       ? `flex: ${normalizedSize}; min-width: 0; min-height: 0; display: flex;`
//       : `flex: ${normalizedSize}; min-height: 0; min-width: 0; display: flex;`;
//   }

//   // ── Divider chevron direction ────────────────────────────────────

//   /**
//    * Returns the arrow character pointing the correct collapse/expand direction.
//    * Horizontal split: ‹ › (left/right)
//    * Vertical split:   ʌ v (up/down)
//    */
//   private chevronLabel(split: SplitNode, dividerIndex: number): string {
//     const side = this.getCollapsibleSide(split, dividerIndex);
//     if (!side) return "";

//     const childIndex = side === "before" ? dividerIndex : dividerIndex + 1;
//     const child = split.children[childIndex] as PanelHostNode;
//     const isH = split.orientation === "horizontal";
//     const isCollapsed = !!child.collapsed;

//     if (isH) {
//       // collapsed "before" (left panel) → expand pointing left ‹, collapse → ›
//       // collapsed "after"  (right panel) → expand pointing right ›, collapse → ‹
//       if (side === "before") return isCollapsed ? "›" : "‹";
//       else return isCollapsed ? "‹" : "›";
//     } else {
//       if (side === "before") return isCollapsed ? "v" : "ʌ";
//       else return isCollapsed ? "ʌ" : "v";
//     }
//   }

//   // ── Layout change propagation ─────────────────────────────────────

//   private onChildLayoutChange(e: CustomEvent<LayoutNode>, childIndex: number) {
//     e.stopPropagation();
//     const split = this.node as SplitNode;
//     const newChildren = [...split.children];
//     newChildren[childIndex] = e.detail;
//     this.emitLayoutChange({ ...split, children: newChildren });
//   }

//   private emitLayoutChange(updatedNode: LayoutNode) {
//     this.dispatchEvent(
//       new CustomEvent("layout-change", {
//         detail: updatedNode,
//         bubbles: true,
//         composed: true,
//       }),
//     );
//   }

//   // ── Rendering ────────────────────────────────────────────────────

//   private renderLeaf(node: PanelHostNode, parentOrientation?: "horizontal" | "vertical") {
//     return html`
//       <panel-host
//         .node=${node}
//         orientation=${parentOrientation ?? "horizontal"}
//         style="flex:1;min-width:0;min-height:0;"
//         @layout-change=${(e: CustomEvent<LayoutNode>) => {
//           e.stopPropagation();
//           this.emitLayoutChange(e.detail);
//         }}
//       ></panel-host>
//     `;
//   }

//   private renderSplit(node: SplitNode) {
//     const isH = node.orientation === "horizontal";
//     const dividerClass = isH ? "divider-h" : "divider-v";
//     const containerClass = isH ? "split-h" : "split-v";

//     const children = node.children.map((child, i) => {
//       const style = this.computeChildStyle(node, i);

//       // Determine if divider button should always be visible (adjacent panel is collapsed)
//       const nextChild = node.children[i + 1] as PanelHostNode | undefined;
//       const dividerHasCollapsed =
//         (child.type === "panel-host" && (child as PanelHostNode).collapsed) ||
//         (nextChild?.type === "panel-host" && (nextChild as PanelHostNode).collapsed);
//       const side = this.getCollapsibleSide(node, i);
//       const canCollapse = side !== null;

//       const divider =
//         i < node.children.length - 1
//           ? html`
//               <div
//                 class="${dividerClass} ${this.draggingIndex === i ? "dragging" : ""}"
//                 @mousedown=${(e: MouseEvent) => this.onDividerMouseDown(e, i)}
//                 @dblclick=${(e: MouseEvent) => this.onDividerDblClick(e, i)}
//               >
//                 ${canCollapse
//                   ? html`
//                       <button
//                         class="collapse-btn ${dividerHasCollapsed ? "always-visible" : ""}"
//                         title="${dividerHasCollapsed ? "Expand panel" : "Collapse panel"}"
//                         @mousedown=${(e: MouseEvent) => e.stopPropagation()}
//                         @click=${(e: MouseEvent) => this.onCollapseToggle(e, i)}
//                       >
//                         ${this.chevronLabel(node, i)}
//                       </button>
//                     `
//                   : html``}
//               </div>
//             `
//           : html``;

//       return html`
//         <div class="child" style=${style} @layout-change=${(e: CustomEvent<LayoutNode>) => this.onChildLayoutChange(e, i)}>
//           ${child.type === "panel-host"
//             ? this.renderLeaf(child as PanelHostNode, node.orientation)
//             : html`<split-pane .node=${child}></split-pane>`}
//         </div>
//         ${divider}
//       `;
//     });

//     return html`<div class="container ${containerClass}">${children}</div>`;
//   }

//   render() {
//     if (!this.node) return html``;
//     if (this.node.type === "panel-host") return this.renderLeaf(this.node as PanelHostNode);
//     return this.renderSplit(this.node as SplitNode);
//   }
// }

import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { sharedStyles } from "../styles/shared";
import type { LayoutNode, SplitNode, PanelHostNode } from "../types/layout";
import "./panel-host";

const COLLAPSED_SIZE_PX = 32;

@customElement("split-pane")
export class SplitPane extends LitElement {
  static styles = [
    sharedStyles,
    css`
      :host {
        display: flex;
        flex: 1;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
      }
      .split-h {
        flex-direction: row;
      }
      .split-v {
        flex-direction: column;
      }
      .container {
        display: flex;
        flex: 1;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
      }
      .child {
        display: flex;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
      }
      .divider-h {
        width: var(--editor-divider);
        cursor: col-resize;
        background: var(--editor-border);
        flex-shrink: 0;
        transition: background 0.15s;
        position: relative;
        z-index: 10;
      }
      .divider-v {
        height: var(--editor-divider);
        cursor: row-resize;
        background: var(--editor-border);
        flex-shrink: 0;
        transition: background 0.15s;
        position: relative;
        z-index: 10;
      }
      .divider-h:hover,
      .divider-h.dragging,
      .divider-v:hover,
      .divider-v.dragging {
        background: var(--editor-accent);
      }
      .collapse-btn {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--editor-accent);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: var(--editor-bg);
        opacity: 0;
        transition: opacity 0.15s;
        z-index: 20;
        line-height: 1;
        padding: 0;
      }
      .divider-v .collapse-btn {
        width: 20px;
        height: 12px;
        border-radius: 3px;
        font-size: 11px;
      }
      .divider-h:hover .collapse-btn,
      .divider-v:hover .collapse-btn,
      .collapse-btn.always-visible {
        opacity: 1;
      }
    `,
  ];

  @property({ type: Object }) node!: LayoutNode;
  @state() private draggingIndex: number | null = null;

  private dragStart = { x: 0, y: 0, sizes: [] as number[] };
  private containerSize = 0;

  // ── Drag-to-resize ──────────────────────────────────────────────

  private onDividerMouseDown(e: MouseEvent, index: number) {
    e.preventDefault();
    const split = this.node as SplitNode;
    const container = this.shadowRoot!.querySelector(".container") as HTMLElement;
    const rect = container.getBoundingClientRect();
    this.containerSize = split.orientation === "horizontal" ? rect.width : rect.height;
    this.dragStart = { x: e.clientX, y: e.clientY, sizes: [...split.sizes] };
    this.draggingIndex = index;

    const onMove = (ev: MouseEvent) => this.onDividerMouseMove(ev, index);
    const onUp = () => {
      this.draggingIndex = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  private onDividerMouseMove(e: MouseEvent, index: number) {
    const split = this.node as SplitNode;
    const isH = split.orientation === "horizontal";
    const delta = isH ? e.clientX - this.dragStart.x : e.clientY - this.dragStart.y;

    // Express delta as a fraction of container, then scale to the sizes pool
    const totalSizes = this.dragStart.sizes.reduce((a, b) => a + b, 0);
    const proportion = (delta / this.containerSize) * totalSizes; // ← scaled to size units
    const minSize = totalSizes * 0.05; // ← 5% of pool, not 0.05 absolute

    const leftChild = split.children[index];
    const rightChild = split.children[index + 1];
    if (leftChild.collapsed || rightChild.collapsed || leftChild.visible === false || rightChild.visible === false) return;

    const newSizes = [...this.dragStart.sizes];
    newSizes[index] = Math.max(minSize, this.dragStart.sizes[index] + proportion);
    newSizes[index + 1] = Math.max(minSize, this.dragStart.sizes[index + 1] - proportion);

    // Keep the pair's total constant
    const origTotal = this.dragStart.sizes[index] + this.dragStart.sizes[index + 1];
    const newTotal = newSizes[index] + newSizes[index + 1];
    newSizes[index] = (newSizes[index] / newTotal) * origTotal;
    newSizes[index + 1] = (newSizes[index + 1] / newTotal) * origTotal;

    this.emitLayoutChange({ ...split, sizes: newSizes });
  }

  // ── Collapse logic ───────────────────────────────────────────────

  private getCollapsibleSide(split: SplitNode, dividerIndex: number): "before" | "after" | null {
    const before = split.children[dividerIndex];
    const after = split.children[dividerIndex + 1];

    if (!before || !after) return null;

    if (before.type === "panel-host" && (before as PanelHostNode).collapsed) return "before";
    if (after.type === "panel-host" && (after as PanelHostNode).collapsed) return "after";

    if (before.type === "panel-host") {
      const b = before as PanelHostNode;
      if (b.collapsible && b.collapseToward === "start") return "before";
    }
    if (after.type === "panel-host") {
      const a = after as PanelHostNode;
      if (a.collapsible && a.collapseToward === "end") return "after";
    }

    if (before.type === "panel-host" && (before as PanelHostNode).collapsible) return "before";
    if (after.type === "panel-host" && (after as PanelHostNode).collapsible) return "after";

    return null;
  }

  private onCollapseToggle(e: MouseEvent, dividerIndex: number) {
    e.stopPropagation();
    const split = this.node as SplitNode;
    const side = this.getCollapsibleSide(split, dividerIndex);
    if (!side) return;

    const childIndex = side === "before" ? dividerIndex : dividerIndex + 1;
    const child = split.children[childIndex] as PanelHostNode;
    const isCollapsing = !child.collapsed;

    const newChildren = split.children.map((c, i) => {
      if (i !== childIndex) return c;
      return { ...c, collapsed: isCollapsing } as PanelHostNode;
    });

    this.emitLayoutChange({ ...split, children: newChildren });
  }

  private onDividerDblClick(e: MouseEvent, dividerIndex: number) {
    this.onCollapseToggle(e, dividerIndex);
  }

  // ── Child size computation ───────────────────────────────────────

  private computeChildStyle(split: SplitNode, index: number): string {
    const isH = split.orientation === "horizontal";
    const child = split.children[index];

    if (child.type === "panel-host" && child.collapsed) {
      const dim = isH ? `width: ${COLLAPSED_SIZE_PX}px` : `height: ${COLLAPSED_SIZE_PX}px`;
      return `flex: 0 0 ${COLLAPSED_SIZE_PX}px; ${dim}; min-width: 0; min-height: 0; display: flex;`;
    }

    // CHANGED: exclude hidden children from the flex pool alongside collapsed ones
    const expandedTotal = split.children.reduce((sum, c, i) => {
      if (c.visible === false) return sum;
      if (c.type === "panel-host" && c.collapsed) return sum;
      return sum + (split.sizes[i] ?? 0);
    }, 0);

    const normalizedSize = (split.sizes[index] ?? 0) / (expandedTotal || 1);

    return isH
      ? `flex: ${normalizedSize}; min-width: 0; min-height: 0; display: flex;`
      : `flex: ${normalizedSize}; min-height: 0; min-width: 0; display: flex;`;
  }

  // ── Divider chevron direction ────────────────────────────────────

  private chevronLabel(split: SplitNode, dividerIndex: number): string {
    const side = this.getCollapsibleSide(split, dividerIndex);
    if (!side) return "";

    const childIndex = side === "before" ? dividerIndex : dividerIndex + 1;
    const child = split.children[childIndex] as PanelHostNode;
    const isH = split.orientation === "horizontal";
    const isCollapsed = !!child.collapsed;

    if (isH) {
      if (side === "before") return isCollapsed ? "›" : "‹";
      else return isCollapsed ? "‹" : "›";
    } else {
      if (side === "before") return isCollapsed ? "v" : "ʌ";
      else return isCollapsed ? "ʌ" : "v";
    }
  }

  // ── Layout change propagation ─────────────────────────────────────

  private onChildLayoutChange(e: CustomEvent<LayoutNode>, childIndex: number) {
    e.stopPropagation();
    const split = this.node as SplitNode;
    const newChildren = [...split.children];
    newChildren[childIndex] = e.detail;
    this.emitLayoutChange({ ...split, children: newChildren });
  }

  private emitLayoutChange(updatedNode: LayoutNode) {
    this.dispatchEvent(
      new CustomEvent("layout-change", {
        detail: updatedNode,
        bubbles: true,
        composed: true,
      }),
    );
  }

  // ── Rendering ────────────────────────────────────────────────────

  private renderLeaf(node: PanelHostNode, parentOrientation?: "horizontal" | "vertical") {
    return html`
      <panel-host .node=${node} orientation=${parentOrientation ?? "horizontal"} style="flex:1;min-width:0;min-height:0;"></panel-host>
    `;
  }

  private renderSplit(node: SplitNode) {
    const isH = node.orientation === "horizontal";
    const dividerClass = isH ? "divider-h" : "divider-v";
    const containerClass = isH ? "split-h" : "split-v";

    const visibleIndices = node.children
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c.visible !== false)
      .map(({ i }) => i);

    const elements = visibleIndices.map((i, position) => {
      const child = node.children[i];
      const style = this.computeChildStyle(node, i);
      const isLastVisible = position === visibleIndices.length - 1;

      const nextVisibleIndex = visibleIndices[position + 1];
      const dividerHasCollapsed =
        !isLastVisible &&
        ((child.type === "panel-host" && (child as PanelHostNode).collapsed) ||
          (nextVisibleIndex !== undefined &&
            node.children[nextVisibleIndex]?.type === "panel-host" &&
            (node.children[nextVisibleIndex] as PanelHostNode).collapsed));

      const side = !isLastVisible ? this.getCollapsibleSide(node, i) : null;
      const canCollapse = side !== null;

      // ARIA: compute size percentage for aria-valuenow
      const expandedTotal = node.children.reduce((sum, c, idx) => {
        if (c.visible === false || (c.type === "panel-host" && c.collapsed)) return sum;
        return sum + (node.sizes[idx] ?? 0);
      }, 0);
      const currentSize = node.sizes[i] ?? 0;
      const valuenow = expandedTotal > 0 ? Math.round((currentSize / expandedTotal) * 100) : 0;

      const divider = !isLastVisible
        ? html`
            <div
              class="${dividerClass} ${this.draggingIndex === i ? "dragging" : ""}"
              role="separator"
              aria-orientation=${isH ? "vertical" : "horizontal"}
              aria-valuenow=${valuenow}
              aria-valuemin="5"
              aria-valuemax="95"
              aria-label=${isH ? "Vertical divider" : "Horizontal divider"}
              @mousedown=${(e: MouseEvent) => this.onDividerMouseDown(e, i)}
              @dblclick=${(e: MouseEvent) => this.onDividerDblClick(e, i)}
            >
              ${canCollapse
                ? html`
                    <button
                      class="collapse-btn ${dividerHasCollapsed ? "always-visible" : ""}"
                      title="${dividerHasCollapsed ? "Expand panel" : "Collapse panel"}"
                      @mousedown=${(e: MouseEvent) => e.stopPropagation()}
                      @click=${(e: MouseEvent) => this.onCollapseToggle(e, i)}
                    >
                      ${this.chevronLabel(node, i)}
                    </button>
                  `
                : html``}
            </div>
          `
        : html``;

      return html`
        <div class="child" style=${style} @layout-change=${(e: CustomEvent<LayoutNode>) => this.onChildLayoutChange(e, i)}>
          ${child.type === "panel-host"
            ? this.renderLeaf(child as PanelHostNode, node.orientation)
            : html`<split-pane .node=${child}></split-pane>`}
        </div>
        ${divider}
      `;
    });

    return html`<div class="container ${containerClass}">${elements}</div>`;
  }

  render() {
    if (!this.node) return html``;
    if (this.node.type === "panel-host") return this.renderLeaf(this.node as PanelHostNode);
    return this.renderSplit(this.node as SplitNode);
  }
}
