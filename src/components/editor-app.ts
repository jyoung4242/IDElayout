// import { LitElement, html, css } from "lit";
// import { customElement, state } from "lit/decorators.js";
// import { sharedStyles } from "../styles/shared";
// import type { WorkspaceLayout } from "../types/layout";
// import type { LayoutNode } from "../types/layout";
// import { defaultLayout } from "../mock/default-layout";
// import { persistenceManager } from "../persistence";
// import "./editor-header";
// import "./editor-status";
// import "./split-pane";

// @customElement("editor-app")
// export class EditorApp extends LitElement {
//   static styles = [
//     sharedStyles,
//     css`
//       :host {
//         display: flex;
//         flex-direction: column;
//         width: 100vw;
//         height: 100vh;
//         overflow: hidden;
//         background: var(--editor-bg3);
//       }
//       .workspace {
//         flex: 1;
//         min-height: 0;
//         display: flex;
//         overflow: hidden;
//       }
//     `,
//   ];

//   @state() layout: WorkspaceLayout = defaultLayout;
//   @state() private lastSavedAt: number | null = null;
//   @state() private saveStatus: "idle" | "saved" | "error" = "idle";
//   private saveStatusTimer?: ReturnType<typeof setTimeout>;

//   override connectedCallback() {
//     super.connectedCallback();
//     this.initPersistence();
//     this.initKeyboardShortcuts();
//   }

//   override disconnectedCallback() {
//     super.disconnectedCallback();
//     persistenceManager.destroy();
//     window.removeEventListener("keydown", this.onKeyDown);
//   }

//   private initPersistence() {
//     const { layout, source, timestamp } = persistenceManager.load();

//     if (layout) {
//       console.log(`[App] Restored layout from ${source} (saved ${timestamp ? new Date(timestamp).toLocaleTimeString() : "unknown"})`);
//       this.layout = layout;
//     } else {
//       console.log("[App] No saved layout found, using default.");
//     }

//     persistenceManager.init(this.layout, { backupIntervalMs: 60_000 });

//     persistenceManager.on(event => {
//       if (event.type === "saved") {
//         this.lastSavedAt = event.timestamp;
//         this.setSaveStatus("saved");
//         this.dispatchEvent(
//           new CustomEvent("save-status", {
//             detail: { status: "saved", timestamp: event.timestamp },
//             bubbles: true,
//             composed: true,
//           }),
//         );
//       }
//       if (event.type === "save-failed") {
//         this.setSaveStatus("error");
//       }
//       if (event.type === "imported") {
//         this.layout = event.layout;
//       }
//     });
//   }

//   private initKeyboardShortcuts() {
//     window.addEventListener("keydown", this.onKeyDown);
//   }

//   private onKeyDown = (e: KeyboardEvent) => {
//     if ((e.ctrlKey || e.metaKey) && e.key === "s") {
//       e.preventDefault();
//       persistenceManager.save();
//     }
//   };

//   private setSaveStatus(status: "saved" | "error") {
//     this.saveStatus = status;
//     clearTimeout(this.saveStatusTimer);
//     this.saveStatusTimer = setTimeout(() => {
//       this.saveStatus = "idle";
//     }, 2500);
//   }

//   private handleLayoutChange(e: CustomEvent<LayoutNode>) {
//     e.stopPropagation();
//     this.layout = { ...this.layout, root: e.detail };
//     persistenceManager.setLayout(this.layout);
//   }

//   private handleSave() {
//     persistenceManager.save();
//   }

//   private handleExport() {
//     persistenceManager.exportToFile(this.layout);
//   }

//   private async handleImport() {
//     try {
//       await persistenceManager.importFromFile();
//     } catch (e) {
//       console.error("[App] Import failed:", e);
//     }
//   }

//   private handleClearSaved() {
//     persistenceManager.clearSaved();
//     this.layout = defaultLayout;
//     persistenceManager.setLayout(this.layout);
//   }

//   render() {
//     return html`
//       <editor-header
//         .saveStatus=${this.saveStatus}
//         .lastSavedAt=${this.lastSavedAt}
//         @save=${this.handleSave}
//         @export-layout=${this.handleExport}
//         @import-layout=${this.handleImport}
//         @clear-layout=${this.handleClearSaved}
//         @play-state-change=${(e: CustomEvent) =>
//           this.dispatchEvent(new CustomEvent("play-state-change", { detail: e.detail, bubbles: true, composed: true }))}
//       ></editor-header>
//       <div class="workspace">
//         <split-pane
//           .node=${this.layout.root}
//           @layout-change=${(e: CustomEvent<LayoutNode>) => this.handleLayoutChange(e)}
//         ></split-pane>
//       </div>
//       <editor-status .saveStatus=${this.saveStatus} .lastSavedAt=${this.lastSavedAt}></editor-status>
//     `;
//   }
// }
import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { sharedStyles } from "../styles/shared";
import type { WorkspaceLayout } from "../types/layout";
import type { LayoutNode } from "../types/layout";
import { defaultLayout } from "../mock/default-layout";
import { persistenceManager } from "../persistence";
import { toggleNodeVisibility } from "../utils/layout-utils"; // NEW
import "./editor-header";
import "./editor-status";
import "./split-pane";

@customElement("editor-app")
export class EditorApp extends LitElement {
  static styles = [
    sharedStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        background: var(--editor-bg3);
      }
      .workspace {
        flex: 1;
        min-height: 0;
        display: flex;
        overflow: hidden;
      }
    `,
  ];

  @state() layout: WorkspaceLayout = defaultLayout;
  @state() private lastSavedAt: number | null = null;
  @state() private saveStatus: "idle" | "saved" | "error" = "idle";
  private saveStatusTimer?: ReturnType<typeof setTimeout>;

  override connectedCallback() {
    super.connectedCallback();
    this.initPersistence();
    this.initKeyboardShortcuts();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    persistenceManager.destroy();
    window.removeEventListener("keydown", this.onKeyDown);
  }

  private initPersistence() {
    const { layout, source, timestamp } = persistenceManager.load();

    if (layout) {
      console.log(`[App] Restored layout from ${source} (saved ${timestamp ? new Date(timestamp).toLocaleTimeString() : "unknown"})`);
      this.layout = layout;
    } else {
      console.log("[App] No saved layout found, using default.");
    }

    persistenceManager.init(this.layout, { backupIntervalMs: 60_000 });

    persistenceManager.on(event => {
      if (event.type === "saved") {
        this.lastSavedAt = event.timestamp;
        this.setSaveStatus("saved");
        this.dispatchEvent(
          new CustomEvent("save-status", {
            detail: { status: "saved", timestamp: event.timestamp },
            bubbles: true,
            composed: true,
          }),
        );
      }
      if (event.type === "save-failed") {
        this.setSaveStatus("error");
      }
      if (event.type === "imported") {
        this.layout = event.layout;
      }
    });
  }

  private initKeyboardShortcuts() {
    window.addEventListener("keydown", this.onKeyDown);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      persistenceManager.save();
    }
  };

  private setSaveStatus(status: "saved" | "error") {
    this.saveStatus = status;
    clearTimeout(this.saveStatusTimer);
    this.saveStatusTimer = setTimeout(() => {
      this.saveStatus = "idle";
    }, 2500);
  }

  private handleLayoutChange(e: CustomEvent<LayoutNode>) {
    e.stopPropagation();
    this.layout = { ...this.layout, root: e.detail };
    persistenceManager.setLayout(this.layout);
  }

  // NEW: handle panel-visibility-toggle from editor-header's View menu
  private handlePanelVisibilityToggle(e: CustomEvent<{ panelId: string }>) {
    e.stopPropagation();
    const newRoot = toggleNodeVisibility(this.layout.root, e.detail.panelId);
    if (newRoot === null) {
      // Blocked by all-hidden guard — silently ignore
      console.debug(`[App] Visibility toggle for "${e.detail.panelId}" blocked: would leave no visible siblings.`);
      return;
    }
    this.layout = { ...this.layout, root: newRoot };
    persistenceManager.setLayout(this.layout);
  }

  private handleSave() {
    persistenceManager.save();
  }

  private handleExport() {
    persistenceManager.exportToFile(this.layout);
  }

  private async handleImport() {
    try {
      await persistenceManager.importFromFile();
    } catch (e) {
      console.error("[App] Import failed:", e);
    }
  }

  private handleClearSaved() {
    persistenceManager.clearSaved();
    this.layout = defaultLayout;
    persistenceManager.setLayout(this.layout);
  }

  render() {
    return html`
      <editor-header
        .saveStatus=${this.saveStatus}
        .lastSavedAt=${this.lastSavedAt}
        .layout=${this.layout}
        @save=${this.handleSave}
        @export-layout=${this.handleExport}
        @import-layout=${this.handleImport}
        @clear-layout=${this.handleClearSaved}
        @panel-visibility-toggle=${(e: CustomEvent<{ panelId: string }>) => this.handlePanelVisibilityToggle(e)}
        @play-state-change=${(e: CustomEvent) =>
          this.dispatchEvent(new CustomEvent("play-state-change", { detail: e.detail, bubbles: true, composed: true }))}
      ></editor-header>
      <div class="workspace">
        <split-pane
          .node=${this.layout.root}
          @layout-change=${(e: CustomEvent<LayoutNode>) => this.handleLayoutChange(e)}
        ></split-pane>
      </div>
      <editor-status .saveStatus=${this.saveStatus} .lastSavedAt=${this.lastSavedAt}></editor-status>
    `;
  }
}
