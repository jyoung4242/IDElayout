import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { sharedStyles } from "../styles/shared";
import type { PanelHostNode, PanelTabNode } from "../types/layout";
import { componentRegistry } from "../registry";
import "./panel-tab-bar";

@customElement("panel-host")
export class PanelHost extends LitElement {
  static styles = [
    sharedStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: var(--editor-bg2);
      }
      .content {
        flex: 1;
        min-height: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .no-content {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        color: var(--editor-text3);
        gap: 6px;
      }
      .unregistered {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        color: var(--editor-text3);
        gap: 4px;
      }
      .unregistered code {
        font-size: 10px;
        background: var(--editor-surface2);
        padding: 2px 6px;
        border-radius: 3px;
        color: var(--editor-text2);
      }

      /* ── Collapsed strip ─────────────────────────────────── */
      .collapsed-strip {
        display: flex;
        flex: 1;
        align-items: center;
        justify-content: space-between;
        background: var(--editor-surface);
        border: 1px solid var(--editor-border);
        overflow: hidden;
        cursor: pointer;
        user-select: none;
      }
      /* Horizontal strip (parent is vertical split — collapsed panel is full-width, short) */
      .collapsed-strip.horizontal {
        flex-direction: row;
        padding: 0 6px;
        height: 100%;
      }
      /* Vertical strip (parent is horizontal split — collapsed panel is full-height, narrow) */
      .collapsed-strip.vertical {
        flex-direction: column-reverse;
        padding: 6px 0;
        width: 100%;
      }
      .collapsed-strip:hover {
        background: var(--editor-surface2);
      }

      .collapsed-icon {
        font-size: 14px;
        line-height: 1;
        flex-shrink: 0;
      }
      .collapsed-title {
        font-size: 10px;
        color: var(--editor-text2);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
      }
      /* Rotate title only for vertical strips (narrow column) */
      .collapsed-strip.vertical .collapsed-title {
        writing-mode: vertical-rl;
        text-orientation: mixed;
        transform: rotate(180deg);
        text-overflow: clip;
      }
      .collapsed-strip.horizontal .collapsed-title {
        margin-left: 6px;
      }
      .collapsed-strip.vertical .collapsed-title {
        margin-top: 6px;
      }

      .expand-btn {
        background: none;
        border: none;
        color: var(--editor-text2);
        cursor: pointer;
        font-size: 10px;
        padding: 2px;
        border-radius: 3px;
        line-height: 1;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .expand-btn:hover {
        background: var(--editor-surface3);
        color: var(--editor-text);
      }
    `,
  ];

  @property({ type: Object }) node!: PanelHostNode;
  @property({ type: String }) orientation: "horizontal" | "vertical" = "horizontal";

  private contentCache = new Map<string, HTMLElement>();

  private get activeTab(): PanelTabNode | undefined {
    const id = this.node.activeTabId ?? this.node.tabs[0]?.id;
    return this.node.tabs.find(t => t.id === id);
  }

  private pruneCache() {
    const liveTags = new Set(this.node.tabs.map(t => t.componentTag).filter(Boolean));
    for (const key of this.contentCache.keys()) {
      if (!liveTags.has(key)) this.contentCache.delete(key);
    }
  }

  private resolveContent(): HTMLElement | null {
    const tab = this.activeTab;
    if (!tab?.componentTag) return null;
    this.pruneCache();

    const cached = this.contentCache.get(tab.componentTag);
    if (cached) {
      if (tab.componentProps) Object.assign(cached, tab.componentProps);
      return cached;
    }

    const el = componentRegistry.create(tab.componentTag, tab.componentProps ?? {});
    if (!el) return null;
    this.contentCache.set(tab.componentTag, el);
    return el;
  }

  private emitLayoutChange(updated: PanelHostNode) {
    this.dispatchEvent(
      new CustomEvent("layout-change", {
        detail: updated,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleTabChange(e: CustomEvent<string>) {
    this.emitLayoutChange({ ...this.node, activeTabId: e.detail });
  }

  private handleTabClose(e: CustomEvent<string>) {
    const closedTab = this.node.tabs.find(t => t.id === e.detail);
    if (closedTab?.componentTag) this.contentCache.delete(closedTab.componentTag);

    const tabs = this.node.tabs.filter(t => t.id !== e.detail);
    const activeTabId = this.node.activeTabId === e.detail ? tabs[0]?.id : this.node.activeTabId;
    this.emitLayoutChange({ ...this.node, tabs, activeTabId });
  }

  private handleExpand(e: MouseEvent) {
    e.stopPropagation();
    this.emitLayoutChange({ ...this.node, collapsed: false });
  }

  // ── Collapsed strip rendering ─────────────────────────────────────

  private renderCollapsed() {
    const tab = this.activeTab;
    const icon = tab?.icon ?? "";
    const title = tab?.title ?? this.node.tabs[0]?.title ?? "Panel";

    const stripClass = this.orientation === "horizontal" ? "vertical" : "horizontal";

    // For vertical strips (horizontal split), flip rotation based on collapse direction.
    // collapseToward "end" (right/bottom) needs the opposite rotation from "start" (left/top).
    const titleStyle =
      this.orientation === "horizontal" && this.node.collapseToward === "end"
        ? "writing-mode: vertical-rl; text-orientation: mixed; transform: none;"
        : "";

    const expandChevron = this.orientation === "horizontal" ? "›" : "v";

    return html`
      <div class="collapsed-strip ${stripClass}" title="Expand ${title}" @click=${this.handleExpand}>
        <span class="collapsed-icon">${icon}</span>
        <span class="collapsed-title" style=${titleStyle}>${title}</span>
        <button class="expand-btn" title="Expand" @click=${this.handleExpand}>${expandChevron}</button>
      </div>
    `;
  }

  // ── Normal content rendering ──────────────────────────────────────

  private renderContent() {
    const tab = this.activeTab;

    if (!tab?.componentTag) {
      return html`<div class="no-content">Empty panel</div>`;
    }

    if (!componentRegistry.has(tab.componentTag)) {
      return html`
        <div class="unregistered">
          <span>Unregistered component</span>
          <code>${tab.componentTag}</code>
        </div>
      `;
    }

    const el = this.resolveContent();
    if (!el) return html`<div class="no-content">Failed to create component</div>`;

    return html` <div class="content" style="flex:1;min-height:0;display:flex;flex-direction:column;" ${refCallback(el)}></div> `;
  }

  render() {
    if (!this.node) return html``;

    if (this.node.collapsed) {
      return this.renderCollapsed();
    }

    return html`
      <panel-tab-bar
        .tabs=${this.node.tabs}
        .activeTabId=${this.node.activeTabId ?? this.node.tabs[0]?.id ?? ""}
        @tab-change=${this.handleTabChange}
        @tab-close=${this.handleTabClose}
      ></panel-tab-bar>
      ${this.renderContent()}
    `;
  }
}

// ── MountDirective ────────────────────────────────────────────────────────────

import { directive, Directive } from "lit/directive.js";
import type { ElementPart } from "lit";

class MountDirective extends Directive {
  private el: HTMLElement | null = null;

  override update(part: ElementPart, [el]: [HTMLElement]) {
    if (this.el !== el) {
      part.element.innerHTML = "";
      part.element.appendChild(el);
      this.el = el;
    }
  }

  render() {
    return "";
  }
}

const refCallback = directive(MountDirective);
