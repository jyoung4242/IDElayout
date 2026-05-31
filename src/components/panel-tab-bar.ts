// src/components/panel-tab-bar.ts
import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { sharedStyles } from "../styles/shared";
import type { PanelTabNode } from "../types/layout";

@customElement("panel-tab-bar")
export class PanelTabBar extends LitElement {
  static styles = [
    sharedStyles,
    css`
      :host {
        display: flex;
        align-items: stretch;
        height: var(--editor-tab-h, 32px);
        background: var(--editor-bg2);
        border-bottom: 1px solid var(--editor-border);
        overflow: hidden;
        position: relative;
      }

      .tab-scroll-region {
        display: flex;
        align-items: stretch;
        overflow-x: hidden; /* clips, not scrolls — JS controls scrollLeft */
        flex: 1 1 0;
        min-width: 0;
        scroll-behavior: smooth;
      }

      .tab {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 0 10px;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        font-size: 12px;
        color: var(--editor-text2);
        border-right: 1px solid var(--editor-border);
        user-select: none;
        transition: background 0.1s;
      }

      .tab:hover {
        background: var(--editor-surface2);
      }

      .tab.active {
        background: var(--editor-surface);
        color: var(--editor-text);
        border-bottom: 2px solid var(--editor-accent);
      }

      .tab.pinned .pin-icon {
        opacity: 0.6;
        font-size: 10px;
      }

      .tab-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        border-radius: 3px;
        opacity: 0;
        font-size: 11px;
        color: var(--editor-text3);
        transition:
          opacity 0.1s,
          background 0.1s;
      }

      .tab:hover .tab-close {
        opacity: 1;
      }

      .tab-close:hover {
        background: var(--editor-surface3);
        color: var(--editor-text);
      }

      .dirty-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--editor-accent);
        flex-shrink: 0;
      }

      /* ── Overflow button ─────────────────────────────────── */
      .overflow-btn {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 0 8px;
        cursor: pointer;
        font-size: 13px;
        color: var(--editor-text2);
        border-left: 1px solid var(--editor-border);
        background: var(--editor-bg2);
        transition:
          background 0.1s,
          color 0.1s;
        position: relative;
        user-select: none;
      }

      .overflow-btn:hover {
        background: var(--editor-surface2);
        color: var(--editor-text);
      }

      .overflow-badge {
        font-size: 10px;
        background: var(--editor-accent);
        color: #fff;
        border-radius: 9px;
        padding: 1px 5px;
        line-height: 1.4;
        font-weight: 600;
      }

      /* ── Overflow dropdown ───────────────────────────────── */
      .overflow-menu {
        position: fixed;
        z-index: 9999;
        background: var(--editor-surface);
        border: 1px solid var(--editor-border2);
        border-radius: 6px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        min-width: 180px;
        max-height: 320px;
        overflow-y: auto;
        padding: 4px 0;
      }

      .overflow-menu-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 12px;
        color: var(--editor-text2);
        white-space: nowrap;
        transition: background 0.1s;
      }

      .overflow-menu-item:hover {
        background: var(--editor-surface2);
        color: var(--editor-text);
      }

      .overflow-menu-item.active {
        color: var(--editor-accent);
        font-weight: 600;
      }

      .overflow-menu-item .item-icon {
        font-size: 13px;
      }
    `,
  ];

  @property({ type: Array }) tabs: PanelTabNode[] = [];
  @property({ type: String }) activeTabId?: string;

  @state() private overflowOpen = false;
  @state() private overflowCount = 0;
  @state() private hiddenTabIds = new Set<string>();
  @state() private menuX = 0;
  @state() private menuY = 0;

  private scrollRegion: HTMLElement | null = null;
  private ro: ResizeObserver | null = null;
  private boundClickOutside = this._onClickOutside.bind(this);

  // ── Lifecycle ──────────────────────────────────────────────

  firstUpdated() {
    this.scrollRegion = this.shadowRoot!.querySelector(".tab-scroll-region");
    if (this.scrollRegion) {
      this.ro = new ResizeObserver(() => this._measureOverflow());
      this.ro.observe(this.scrollRegion);
      // Also observe host (outer width changes)
      this.ro.observe(this);
    }
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("tabs") || changed.has("activeTabId")) {
      // After DOM settles, re-measure and ensure active tab is scrolled into view
      requestAnimationFrame(() => {
        this._measureOverflow();
        this._scrollActiveIntoView();
      });
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.ro?.disconnect();
    window.removeEventListener("pointerdown", this.boundClickOutside, true);
  }

  // ── Overflow measurement ────────────────────────────────────

  private _measureOverflow() {
    const region = this.scrollRegion;
    if (!region) return;

    const regionRect = region.getBoundingClientRect();
    const tabEls = Array.from(region.querySelectorAll<HTMLElement>(".tab"));

    const newHidden = new Set<string>();

    for (const el of tabEls) {
      const rect = el.getBoundingClientRect();
      // Tab is "hidden" if its right edge exceeds the region's right edge
      const fullyVisible = rect.left >= regionRect.left - 1 && rect.right <= regionRect.right + 1;
      if (!fullyVisible) {
        const id = el.dataset.tabId;
        if (id) newHidden.add(id);
      }
    }

    this.hiddenTabIds = newHidden;
    this.overflowCount = newHidden.size;
  }

  private _scrollActiveIntoView() {
    const region = this.scrollRegion;
    if (!region || !this.activeTabId) return;

    const activeEl = region.querySelector<HTMLElement>(`[data-tab-id="${this.activeTabId}"]`);
    if (!activeEl) return;

    const regionRect = region.getBoundingClientRect();
    const elRect = activeEl.getBoundingClientRect();

    if (elRect.left < regionRect.left) {
      region.scrollLeft -= regionRect.left - elRect.left + 8;
    } else if (elRect.right > regionRect.right) {
      region.scrollLeft += elRect.right - regionRect.right + 8;
    }

    requestAnimationFrame(() => this._measureOverflow());
  }

  // ── Click outside dismiss ───────────────────────────────────

  private _onClickOutside(e: PointerEvent) {
    const path = e.composedPath();
    const btn = this.shadowRoot?.querySelector(".overflow-btn");
    const menu = this.shadowRoot?.querySelector(".overflow-menu");
    if (!path.includes(btn as EventTarget) && !path.includes(menu as EventTarget)) {
      this.overflowOpen = false;
      window.removeEventListener("pointerdown", this.boundClickOutside, true);
    }
  }

  // ── Event handlers ─────────────────────────────────────────

  private _onTabClick(tab: PanelTabNode) {
    this.dispatchEvent(new CustomEvent("tab-change", { detail: tab.id, bubbles: true, composed: true }));
  }

  private _onTabClose(e: Event, tab: PanelTabNode) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent("tab-close", { detail: tab.id, bubbles: true, composed: true }));
  }

  private _toggleOverflow(e: MouseEvent) {
    this.overflowOpen = !this.overflowOpen;
    if (this.overflowOpen) {
      const btn = (e.currentTarget as HTMLElement).getBoundingClientRect();
      this.menuX = btn.right;
      this.menuY = btn.bottom;
      window.addEventListener("pointerdown", this.boundClickOutside, true);
    } else {
      window.removeEventListener("pointerdown", this.boundClickOutside, true);
    }
  }

  private _selectOverflowTab(tabId: string) {
    this.overflowOpen = false;
    window.removeEventListener("pointerdown", this.boundClickOutside, true);
    this.dispatchEvent(new CustomEvent("tab-change", { detail: tabId, bubbles: true, composed: true }));
    // After tab is active, scroll it into view
    requestAnimationFrame(() => this._scrollActiveIntoView());
  }

  // ── Render ─────────────────────────────────────────────────

  private _renderTab(tab: PanelTabNode) {
    const isActive = tab.id === this.activeTabId;
    return html`
      <div
        class="tab ${isActive ? "active" : ""} "
        role="tab"
        aria-selected=${isActive ? "true" : "false"}
        tabindex=${isActive ? "0" : "-1"}
        data-tab-id="${tab.id}"
        @click=${() => this._onTabClick(tab)}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this._onTabClick(tab);
          }
        }}
        title=${tab.title}
      >
        ${tab.icon ? html`<span aria-hidden="true">${tab.icon}</span>` : ""}
        <span>${tab.title}</span>
        ${tab.dirty ? html`<span class="dirty-dot" aria-label="unsaved changes"></span>` : ""}
      </div>
    `;
  }

  render() {
    const hiddenTabs = this.tabs.filter(t => this.hiddenTabIds.has(t.id));

    return html`
      <div class="tab-scroll-region" role="tablist" aria-label="Panel tabs">${this.tabs.map(t => this._renderTab(t))}</div>

      ${this.overflowCount > 0
        ? html`
            <div class="overflow-btn" @click=${this._toggleOverflow} title="More tabs">
              <span>›</span>
              <span class="overflow-badge">${this.overflowCount}</span>
            </div>
          `
        : ""}
      ${this.overflowOpen
        ? html`
            <div class="overflow-menu" style="right: 8px; top: calc(var(--editor-tab-h, 32px) + 2px); position: absolute;">
              ${hiddenTabs.map(
                tab => html`
                  <div
                    class="overflow-menu-item ${tab.id === this.activeTabId ? "active" : ""}"
                    @click=${() => this._selectOverflowTab(tab.id)}
                  >
                    ${tab.icon ? html`<span class="item-icon">${tab.icon}</span>` : ""}
                    <span>${tab.title}</span>
                    ${tab.dirty ? html`<span class="dirty-dot"></span>` : ""}
                  </div>
                `,
              )}
            </div>
          `
        : ""}
    `;
  }
}
