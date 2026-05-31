import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { ContextConsumer } from "@lit/context"; // ADD
import { playStateContext } from "../context/play-state"; // ADD
import { sharedStyles } from "../styles/shared";

@customElement("editor-status")
export class EditorStatus extends LitElement {
  static styles = [
    sharedStyles,
    css`
      :host {
        display: flex;
        align-items: center;
        height: var(--editor-status-h);
        background: var(--editor-accent2);
        border-top: 1px solid var(--editor-accent);
        padding: 0 10px;
        gap: 2px;
        flex-shrink: 0;
        font-size: 10px;
        color: rgba(255, 255, 255, 0.85);
        font-family: inherit;
      }
      .item {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 2px 6px;
        border-radius: 3px;
        cursor: pointer;
        white-space: nowrap;
        transition: background 0.12s;
        letter-spacing: 0.02em;
      }
      .item:hover {
        background: rgba(255, 255, 255, 0.12);
      }
      .sep {
        width: 1px;
        height: 12px;
        background: rgba(255, 255, 255, 0.2);
        margin: 0 2px;
        flex-shrink: 0;
      }
      .spacer {
        flex: 1;
      }
      .warn {
        color: #ffd080;
      }
      .err {
        color: #ff9090;
      }
      .fps {
        font-variant-numeric: tabular-nums;
        min-width: 48px;
      }
    `,
  ];

  @state() private fps = 60;
  @state() private branch = "main";
  @state() private errors = 0;
  @state() private warnings = 2;
  @state() private cursorLine = 22;
  @state() private cursorCol = 2;
  @property({ type: String }) saveStatus: "idle" | "saved" | "error" = "idle";
  @property({ type: Number }) lastSavedAt: number | null = null;

  // ── Play state via context ────────────────────────────────────────
  private _playState = new ContextConsumer(this, {
    context: playStateContext,
    subscribe: true, // re-render whenever provider calls setValue()
  });

  private get running(): boolean {
    return this._playState.value?.running ?? false;
  }

  private fpsInterval?: ReturnType<typeof setInterval>;

  override connectedCallback() {
    super.connectedCallback();
    this.fpsInterval = setInterval(() => {
      if (this.running) {
        this.fps = 58 + Math.round(Math.random() * 4);
      }
    }, 800);
    // getRootNode() listener is gone — context handles it
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.fpsInterval);
  }

  private get savedLabel(): string {
    if (!this.lastSavedAt) return "";
    return new Date(this.lastSavedAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  render() {
    return html`
      <div class="item" title="Source branch">⎇ ${this.branch}</div>
      ${this.lastSavedAt
        ? html`
            <div class="sep"></div>
            <div class="item" title="Last saved at ${this.savedLabel}">✓ ${this.savedLabel}</div>
          `
        : html``}
      <div class="sep"></div>

      <div class="item ${this.errors > 0 ? "err" : ""}" title="${this.errors} errors">✕ ${this.errors}</div>
      <div class="item ${this.warnings > 0 ? "warn" : ""}" title="${this.warnings} warnings">⚠ ${this.warnings}</div>

      <div class="sep"></div>
      <div class="item" title="Renderer">⬡ WebGL2</div>
      <div class="spacer"></div>

      <div class="item fps" title="Frames per second">◈ ${this.fps} fps</div>
      <div class="sep"></div>
      <div class="item" title="ExcaliburJS version">ExcaliburJS 0.30</div>
      <div class="sep"></div>
      <div class="item" title="Cursor position">Ln ${this.cursorLine}, Col ${this.cursorCol}</div>
    `;
  }
}
