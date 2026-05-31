import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { sharedStyles } from "../styles/shared";
import type { PanelTabNode } from "../types/layout";

@customElement("panel-tab-bar")
export class PanelTabBar extends LitElement {
  static styles = [
    sharedStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
      }
      .tab-bar {
        height: var(--editor-tab-h);
        background: var(--editor-bg);
        border-bottom: 1px solid var(--editor-border);
        display: flex;
        align-items: stretch;
        overflow-x: auto;
        scrollbar-width: none;
      }
      .tab-bar::-webkit-scrollbar {
        display: none;
      }
      .tab {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 0 10px;
        border-right: 1px solid var(--editor-border);
        cursor: pointer;
        color: var(--editor-text2);
        font-size: 11px;
        white-space: nowrap;
        transition:
          background 0.12s,
          color 0.12s;
        position: relative;
        flex-shrink: 0;
        user-select: none;
      }
      .tab:hover {
        background: var(--editor-surface);
        color: var(--editor-text);
      }
      .tab.active {
        background: var(--editor-surface2);
        color: var(--editor-text);
      }
      .tab.active::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--editor-accent);
      }
      .tab.pinned {
        color: var(--editor-accent);
      }
      .dirty-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--editor-accent);
        flex-shrink: 0;
      }
      .close-btn {
        width: 16px;
        height: 16px;
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        color: var(--editor-text3);
        opacity: 0;
        transition:
          opacity 0.12s,
          background 0.12s,
          color 0.12s;
        flex-shrink: 0;
      }
      .tab:hover .close-btn {
        opacity: 1;
      }
      .close-btn:hover {
        background: var(--editor-surface3);
        color: #f06060;
      }
    `,
  ];

  @property({ type: Array }) tabs: PanelTabNode[] = [];
  @property({ type: String }) activeTabId = "";

  private selectTab(id: string) {
    this.dispatchEvent(new CustomEvent("tab-change", { detail: id, bubbles: true, composed: true }));
  }

  private closeTab(e: MouseEvent, id: string) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent("tab-close", { detail: id, bubbles: true, composed: true }));
  }

  render() {
    return html`
      <div class="tab-bar" role="tablist">
        ${this.tabs.map(
          tab => html`
            <div
              class="tab ${tab.id === this.activeTabId ? "active" : ""} ${tab.pinned ? "pinned" : ""}"
              role="tab"
              aria-selected=${tab.id === this.activeTabId}
              @click=${() => this.selectTab(tab.id)}
            >
              ${tab.icon ? html`<span style="font-size:13px">${tab.icon}</span>` : html``}
              ${tab.dirty ? html`<div class="dirty-dot"></div>` : html``}
              <span>${tab.title}</span>
              ${tab.closable && !tab.pinned
                ? html`<div class="close-btn" @click=${(e: MouseEvent) => this.closeTab(e, tab.id)}>×</div>`
                : html``}
            </div>
          `,
        )}
      </div>
    `;
  }
}
