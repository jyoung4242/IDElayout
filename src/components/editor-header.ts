// import { LitElement, html, css } from "lit";
// import { customElement, property, state } from "lit/decorators.js";
// import { sharedStyles } from "../styles/shared";

// @customElement("editor-header")
// export class EditorHeader extends LitElement {
//   static styles = [
//     sharedStyles,
//     css`
//       :host {
//         display: flex;
//         align-items: center;
//         height: var(--editor-header-h);
//         background: var(--editor-bg);
//         border-bottom: 1px solid var(--editor-border);
//         padding: 0 12px;
//         gap: 6px;
//         flex-shrink: 0;
//         font-size: 12px;
//         position: relative;
//       }
//       .logo {
//         display: flex;
//         align-items: center;
//         gap: 6px;
//         margin-right: 6px;
//       }
//       .logo-mark {
//         width: 20px;
//         height: 20px;
//         background: var(--editor-accent);
//         border-radius: 4px;
//         display: flex;
//         align-items: center;
//         justify-content: center;
//         font-size: 10px;
//         font-weight: 700;
//         color: #fff;
//         flex-shrink: 0;
//       }
//       .logo-name {
//         font-size: 12px;
//         font-weight: 600;
//         color: var(--editor-text);
//         letter-spacing: 0.04em;
//       }
//       .sep {
//         width: 1px;
//         height: 16px;
//         background: var(--editor-border2);
//         margin: 0 4px;
//         flex-shrink: 0;
//       }
//       .spacer {
//         flex: 1;
//       }
//       .menu-btn {
//         padding: 4px 10px;
//         border-radius: 4px;
//         border: 1px solid transparent;
//         background: transparent;
//         color: var(--editor-text2);
//         font-size: 11px;
//         font-family: inherit;
//         cursor: pointer;
//         transition:
//           background 0.12s,
//           color 0.12s;
//         white-space: nowrap;
//         position: relative;
//       }
//       .menu-btn:hover {
//         background: var(--editor-surface2);
//         color: var(--editor-text);
//         border-color: var(--editor-border);
//       }
//       .menu-btn.open {
//         background: var(--editor-surface2);
//         color: var(--editor-text);
//         border-color: var(--editor-border);
//       }
//       .dropdown {
//         position: absolute;
//         top: calc(100% + 2px);
//         left: 0;
//         background: var(--editor-surface);
//         border: 1px solid var(--editor-border2);
//         border-radius: 5px;
//         padding: 4px 0;
//         min-width: 200px;
//         z-index: 100;
//         box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
//       }
//       .dropdown-item {
//         display: flex;
//         align-items: center;
//         justify-content: space-between;
//         padding: 6px 12px;
//         cursor: pointer;
//         color: var(--editor-text2);
//         font-size: 11px;
//         transition:
//           background 0.1s,
//           color 0.1s;
//         gap: 24px;
//       }
//       .dropdown-item:hover {
//         background: var(--editor-surface2);
//         color: var(--editor-text);
//       }
//       .dropdown-item.danger:hover {
//         color: #f06060;
//       }
//       .dropdown-sep {
//         height: 1px;
//         background: var(--editor-border);
//         margin: 4px 0;
//       }
//       .shortcut {
//         color: var(--editor-text3);
//         font-size: 10px;
//         flex-shrink: 0;
//       }
//       .action-btn {
//         padding: 4px 10px;
//         border-radius: 4px;
//         border: 1px solid var(--editor-border2);
//         background: transparent;
//         color: var(--editor-text2);
//         font-size: 11px;
//         font-family: inherit;
//         cursor: pointer;
//         transition:
//           background 0.12s,
//           color 0.12s;
//         white-space: nowrap;
//       }
//       .action-btn:hover {
//         background: var(--editor-surface2);
//         color: var(--editor-text);
//       }
//       .play-btn {
//         padding: 4px 14px;
//         border-radius: 4px;
//         border: 1px solid var(--editor-accent);
//         background: var(--editor-accent2);
//         color: #fff;
//         font-size: 11px;
//         font-family: inherit;
//         cursor: pointer;
//         transition: background 0.12s;
//         white-space: nowrap;
//       }
//       .play-btn:hover {
//         background: var(--editor-accent);
//       }
//       .play-btn.running {
//         background: #7a2020;
//         border-color: #f06060;
//       }
//       .play-btn.running:hover {
//         background: #9a2828;
//       }
//       .status-badge {
//         padding: 2px 8px;
//         border-radius: 3px;
//         font-size: 10px;
//         letter-spacing: 0.04em;
//         background: rgba(62, 207, 142, 0.12);
//         color: #3ecf8e;
//       }
//       .status-badge.stopped {
//         background: rgba(255, 255, 255, 0.06);
//         color: var(--editor-text3);
//       }
//       .save-flash {
//         font-size: 10px;
//         padding: 2px 8px;
//         border-radius: 3px;
//         transition: opacity 0.3s;
//       }
//       .save-flash.saved {
//         color: #3ecf8e;
//         background: rgba(62, 207, 142, 0.1);
//       }
//       .save-flash.error {
//         color: #f06060;
//         background: rgba(240, 96, 96, 0.1);
//       }
//     `,
//   ];

//   @property({ type: String }) saveStatus: "idle" | "saved" | "error" = "idle";
//   @property({ type: Number }) lastSavedAt: number | null = null;
//   @state() private running = false;
//   @state() private fileMenuOpen = false;

//   private toggleFileMenu() {
//     this.fileMenuOpen = !this.fileMenuOpen;
//   }

//   private closeFileMenu() {
//     this.fileMenuOpen = false;
//   }

//   private emit(type: string) {
//     this.closeFileMenu();
//     this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true }));
//   }

//   private togglePlay() {
//     this.running = !this.running;
//     this.dispatchEvent(
//       new CustomEvent("play-state-change", {
//         detail: { running: this.running },
//         bubbles: true,
//         composed: true,
//       }),
//     );
//   }

//   private renderFileMenu() {
//     if (!this.fileMenuOpen) return html``;
//     return html`
//       <div class="dropdown">
//         <div class="dropdown-item" @click=${() => this.emit("save")}>
//           <span>Save Layout</span>
//           <span class="shortcut">Ctrl+S</span>
//         </div>
//         <div class="dropdown-sep"></div>
//         <div class="dropdown-item" @click=${() => this.emit("export-layout")}>
//           <span>Export Layout…</span>
//         </div>
//         <div class="dropdown-item" @click=${() => this.emit("import-layout")}>
//           <span>Import Layout…</span>
//         </div>
//         <div class="dropdown-sep"></div>
//         <div class="dropdown-item danger" @click=${() => this.emit("clear-layout")}>
//           <span>Reset to Default</span>
//         </div>
//       </div>
//     `;
//   }

//   override render() {
//     return html`
//       <div class="logo">
//         <div class="logo-mark">Ex</div>
//         <span class="logo-name">ExcaliburIDE</span>
//       </div>

//       <div class="sep"></div>

//       <div style="position:relative;">
//         <button
//           class="menu-btn ${this.fileMenuOpen ? "open" : ""}"
//           @click=${this.toggleFileMenu}
//           @blur=${() => setTimeout(() => this.closeFileMenu(), 150)}
//         >
//           File
//         </button>
//         ${this.renderFileMenu()}
//       </div>

//       <button class="menu-btn">Edit</button>
//       <button class="menu-btn">View</button>
//       <button class="menu-btn">Scene</button>
//       <button class="menu-btn">Build</button>

//       <div class="spacer"></div>

//       ${this.saveStatus !== "idle"
//         ? html` <span class="save-flash ${this.saveStatus}"> ${this.saveStatus === "saved" ? "✓ Saved" : "✕ Save failed"} </span> `
//         : html``}

//       <div class="status-badge ${this.running ? "" : "stopped"}">${this.running ? "● RUNNING" : "○ STOPPED"}</div>

//       <div class="sep"></div>

//       <button class="action-btn">⚙ Settings</button>
//       <button class="play-btn ${this.running ? "running" : ""}" @click=${this.togglePlay}>
//         ${this.running ? "⏹ Stop" : "▶ Play"}
//       </button>
//     `;
//   }
// }

import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { sharedStyles } from "../styles/shared";
import type { WorkspaceLayout, PanelHostNode } from "../types/layout";
import { collectPanelHosts } from "../utils/layout-utils";
import { componentRegistry } from "../registry/component-registry";

@customElement("editor-header")
export class EditorHeader extends LitElement {
  static styles = [
    sharedStyles,
    css`
      :host {
        display: flex;
        align-items: center;
        height: var(--editor-header-h);
        background: var(--editor-bg);
        border-bottom: 1px solid var(--editor-border);
        padding: 0 12px;
        gap: 6px;
        flex-shrink: 0;
        font-size: 12px;
        position: relative;
      }
      .logo {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-right: 6px;
      }
      .logo-mark {
        width: 20px;
        height: 20px;
        background: var(--editor-accent);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 700;
        color: #fff;
        flex-shrink: 0;
      }
      .logo-name {
        font-size: 12px;
        font-weight: 600;
        color: var(--editor-text);
        letter-spacing: 0.04em;
      }
      .sep {
        width: 1px;
        height: 16px;
        background: var(--editor-border2);
        margin: 0 4px;
        flex-shrink: 0;
      }
      .spacer {
        flex: 1;
      }
      .menu-btn {
        padding: 4px 10px;
        border-radius: 4px;
        border: 1px solid transparent;
        background: transparent;
        color: var(--editor-text2);
        font-size: 11px;
        font-family: inherit;
        cursor: pointer;
        transition:
          background 0.12s,
          color 0.12s;
        white-space: nowrap;
        position: relative;
      }
      .menu-btn:hover {
        background: var(--editor-surface2);
        color: var(--editor-text);
        border-color: var(--editor-border);
      }
      .menu-btn.open {
        background: var(--editor-surface2);
        color: var(--editor-text);
        border-color: var(--editor-border);
      }
      .dropdown {
        position: absolute;
        top: calc(100% + 2px);
        left: 0;
        background: var(--editor-surface);
        border: 1px solid var(--editor-border2);
        border-radius: 5px;
        padding: 4px 0;
        min-width: 200px;
        z-index: 100;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      }
      .dropdown-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 12px;
        cursor: pointer;
        color: var(--editor-text2);
        font-size: 11px;
        transition:
          background 0.1s,
          color 0.1s;
        gap: 24px;
      }
      .dropdown-item:hover {
        background: var(--editor-surface2);
        color: var(--editor-text);
      }
      .dropdown-item.danger:hover {
        color: #f06060;
      }
      .dropdown-item.disabled {
        opacity: 0.4;
        cursor: not-allowed;
        pointer-events: none;
      }
      .dropdown-sep {
        height: 1px;
        background: var(--editor-border);
        margin: 4px 0;
      }
      .shortcut {
        color: var(--editor-text3);
        font-size: 10px;
        flex-shrink: 0;
      }

      /* View menu specifics */
      .view-item-left {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .view-checkbox {
        width: 12px;
        height: 12px;
        border: 1px solid var(--editor-border2);
        border-radius: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 9px;
        color: var(--editor-accent);
        background: transparent;
      }
      .view-checkbox.checked {
        background: var(--editor-accent2);
        border-color: var(--editor-accent);
      }
      .view-label {
        font-size: 11px;
        color: inherit;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .view-tab-count {
        font-size: 10px;
        color: var(--editor-text3);
        flex-shrink: 0;
        margin-left: auto;
        padding-left: 12px;
      }

      .action-btn {
        padding: 4px 10px;
        border-radius: 4px;
        border: 1px solid var(--editor-border2);
        background: transparent;
        color: var(--editor-text2);
        font-size: 11px;
        font-family: inherit;
        cursor: pointer;
        transition:
          background 0.12s,
          color 0.12s;
        white-space: nowrap;
      }
      .action-btn:hover {
        background: var(--editor-surface2);
        color: var(--editor-text);
      }
      .play-btn {
        padding: 4px 14px;
        border-radius: 4px;
        border: 1px solid var(--editor-accent);
        background: var(--editor-accent2);
        color: #fff;
        font-size: 11px;
        font-family: inherit;
        cursor: pointer;
        transition: background 0.12s;
        white-space: nowrap;
      }
      .play-btn:hover {
        background: var(--editor-accent);
      }
      .play-btn.running {
        background: #7a2020;
        border-color: #f06060;
      }
      .play-btn.running:hover {
        background: #9a2828;
      }
      .status-badge {
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 10px;
        letter-spacing: 0.04em;
        background: rgba(62, 207, 142, 0.12);
        color: #3ecf8e;
      }
      .status-badge.stopped {
        background: rgba(255, 255, 255, 0.06);
        color: var(--editor-text3);
      }
      .save-flash {
        font-size: 10px;
        padding: 2px 8px;
        border-radius: 3px;
        transition: opacity 0.3s;
      }
      .save-flash.saved {
        color: #3ecf8e;
        background: rgba(62, 207, 142, 0.1);
      }
      .save-flash.error {
        color: #f06060;
        background: rgba(240, 96, 96, 0.1);
      }
      .view-lock {
        font-size: 9px;
        color: var(--editor-text3);
        flex-shrink: 0;
        padding-left: 8px;
      }
    `,
  ];

  @property({ type: String }) saveStatus: "idle" | "saved" | "error" = "idle";
  @property({ type: Number }) lastSavedAt: number | null = null;
  // NEW: full layout tree for View menu population
  @property({ type: Object }) layout: WorkspaceLayout | null = null;

  @state() private running = false;
  @state() private fileMenuOpen = false;
  @state() private viewMenuOpen = false;

  // ── Menu helpers ─────────────────────────────────────────────────

  // Add to connectedCallback / disconnectedCallback lifecycle
  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener("pointerdown", this.onOutsideClick);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("pointerdown", this.onOutsideClick);
  }

  private onOutsideClick = (e: PointerEvent) => {
    if (!this.fileMenuOpen && !this.viewMenuOpen) return;
    // composed path walks through shadow DOM boundaries
    const path = e.composedPath();
    if (!path.includes(this)) {
      this.closeAllMenus();
    }
  };

  private toggleFileMenu() {
    this.fileMenuOpen = !this.fileMenuOpen;
    if (this.fileMenuOpen) this.viewMenuOpen = false;
  }

  private toggleViewMenu() {
    this.viewMenuOpen = !this.viewMenuOpen;
    if (this.viewMenuOpen) this.fileMenuOpen = false;
  }

  private closeAllMenus() {
    this.fileMenuOpen = false;
    this.viewMenuOpen = false;
  }

  private emit(type: string) {
    this.closeAllMenus();
    this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true }));
  }

  // ── Play toggle ───────────────────────────────────────────────────

  private togglePlay() {
    this.running = !this.running;
    this.dispatchEvent(
      new CustomEvent("play-state-change", {
        detail: { running: this.running },
        bubbles: true,
        composed: true,
      }),
    );
  }

  // ── View menu: panel visibility toggle ───────────────────────────

  /**
   * Resolve a display title for a panel from the component registry.
   * Uses the first tab's componentTag to look up meta.title; falls back
   * to the tab title, then the node id.
   */
  private getPanelTitle(node: PanelHostNode): string {
    const firstTab = node.tabs[0];
    if (firstTab?.componentTag) {
      const def = componentRegistry.resolve(firstTab.componentTag);
      if (def?.meta?.title) return def.meta.title;
    }
    return firstTab?.title ?? node.id;
  }

  private onTogglePanelVisible(node: PanelHostNode) {
    // Emit layout-change with the panel id — editor-app does the actual
    // tree mutation + guard check via toggleNodeVisibility
    this.dispatchEvent(
      new CustomEvent("panel-visibility-toggle", {
        detail: { panelId: node.id },
        bubbles: true,
        composed: true,
      }),
    );
    // Keep the menu open so the user can toggle multiple panels in one session
  }

  // ── File menu render ─────────────────────────────────────────────

  private renderFileMenu() {
    if (!this.fileMenuOpen) return html``;
    return html`
      <div class="dropdown">
        <div class="dropdown-item" @click=${() => this.emit("save")}>
          <span>Save Layout</span>
          <span class="shortcut">Ctrl+S</span>
        </div>
        <div class="dropdown-sep"></div>
        <div class="dropdown-item" @click=${() => this.emit("export-layout")}>
          <span>Export Layout…</span>
        </div>
        <div class="dropdown-item" @click=${() => this.emit("import-layout")}>
          <span>Import Layout…</span>
        </div>
        <div class="dropdown-sep"></div>
        <div class="dropdown-item danger" @click=${() => this.emit("clear-layout")}>
          <span>Reset to Default</span>
        </div>
      </div>
    `;
  }

  // ── View menu render ─────────────────────────────────────────────
  private isPanelProtected(node: PanelHostNode): boolean {
    return node.tabs.some(tab => {
      if (!tab.componentTag) return false;
      return componentRegistry.resolve(tab.componentTag)?.alwaysVisibile === true;
    });
  }
  private renderViewMenu() {
    if (!this.viewMenuOpen) return html``;

    const panels = this.layout ? collectPanelHosts(this.layout.root) : [];
    return html`
      <div class="dropdown">
        ${panels.length === 0
          ? html`
              <div class="dropdown-item disabled">
                <span>No panels registered</span>
              </div>
            `
          : panels.map(panel => {
              const isVisible = panel.visible !== false;
              const title = this.getPanelTitle(panel);
              const tabCount = panel.tabs.length;
              const tabWord = tabCount === 1 ? "tab" : "tabs";

              const isProtected = this.isPanelProtected(panel);

              return html`
                <div
                  class="dropdown-item ${isProtected ? "disabled" : ""}"
                  @click=${isProtected ? undefined : () => this.onTogglePanelVisible(panel)}
                >
                  <div class="view-item-left">
                    <div class="view-checkbox ${isVisible ? "checked" : ""}">${isVisible ? "✓" : ""}</div>
                    <span class="view-label">${title}</span>
                  </div>
                  <span class="view-tab-count">
                    ${isProtected ? html`<span class="view-lock">🔒</span>` : html`${tabCount} ${tabWord}`}
                  </span>
                </div>
              `;
            })}
      </div>
    `;
  }

  // ── Root render ───────────────────────────────────────────────────

  override render() {
    return html`
      <div class="logo">
        <div class="logo-mark">Ex</div>
        <span class="logo-name">ExcaliburIDE</span>
      </div>

      <div class="sep"></div>

      <div style="position:relative;">
        <button class="menu-btn ${this.fileMenuOpen ? "open" : ""}" @click=${this.toggleFileMenu}>File</button>
        ${this.renderFileMenu()}
      </div>

      <button class="menu-btn">Edit</button>

      <div style="position:relative;">
        <button class="menu-btn ${this.viewMenuOpen ? "open" : ""}" @click=${this.toggleViewMenu}>View</button>
        ${this.renderViewMenu()}
      </div>

      <button class="menu-btn">Scene</button>
      <button class="menu-btn">Build</button>

      <div class="spacer"></div>

      ${this.saveStatus !== "idle"
        ? html`<span class="save-flash ${this.saveStatus}"> ${this.saveStatus === "saved" ? "✓ Saved" : "✕ Save failed"} </span>`
        : html``}

      <div class="status-badge ${this.running ? "" : "stopped"}">${this.running ? "● RUNNING" : "○ STOPPED"}</div>

      <div class="sep"></div>

      <button class="action-btn">⚙ Settings</button>
      <button class="play-btn ${this.running ? "running" : ""}" @click=${this.togglePlay}>
        ${this.running ? "⏹ Stop" : "▶ Play"}
      </button>
    `;
  }
}
