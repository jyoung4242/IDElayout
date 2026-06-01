import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { sharedStyles } from "../styles/shared";

@customElement("mock-project-config")
export class MockProjectConfig extends LitElement {
  static styles = [
    sharedStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: auto;
        box-sizing: border-box;
      }

      .config-panel {
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .section-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--color-text-muted, #888);
        margin: 8px 0 4px 0;
        padding-bottom: 4px;
        border-bottom: 1px solid var(--color-border, #333);
      }

      .field-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .field-row label {
        flex: 0 0 120px;
        font-size: 12px;
        color: var(--color-text, #ccc);
      }

      .field-row input[type="text"],
      .field-row input[type="number"] {
        flex: 1;
        background: var(--color-input-bg, #1e1e1e);
        border: 1px solid var(--color-border, #444);
        color: var(--color-text, #ccc);
        border-radius: 3px;
        padding: 4px 7px;
        font-size: 12px;
        font-family: inherit;
        outline: none;
        min-width: 0;
      }

      .field-row input[type="text"]:focus,
      .field-row input[type="number"]:focus {
        border-color: var(--color-accent, #5b8fff);
      }

      .field-row input[type="color"] {
        flex: 0 0 48px;
        height: 26px;
        border: 1px solid var(--color-border, #444);
        border-radius: 3px;
        background: none;
        cursor: pointer;
        padding: 1px;
      }

      .field-row input[type="checkbox"] {
        width: 14px;
        height: 14px;
        cursor: pointer;
        accent-color: var(--color-accent, #5b8fff);
      }

      .resolution-group {
        display: flex;
        align-items: center;
        gap: 6px;
        flex: 1;
      }

      .resolution-group input {
        flex: 1;
        min-width: 0;
      }

      .resolution-sep {
        font-size: 12px;
        color: var(--color-text-muted, #888);
      }

      .color-hex {
        flex: 1;
        font-size: 11px;
        color: var(--color-text-muted, #888);
        font-family: monospace;
      }

      .save-bar {
        padding: 10px 16px;
        border-top: 1px solid var(--color-border, #333);
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: auto;
      }

      button {
        background: var(--color-accent, #5b8fff);
        color: #fff;
        border: none;
        border-radius: 3px;
        padding: 5px 14px;
        font-size: 12px;
        font-family: inherit;
        cursor: pointer;
      }

      button:hover {
        filter: brightness(1.15);
      }

      button.secondary {
        background: var(--color-input-bg, #2a2a2a);
        color: var(--color-text, #ccc);
        border: 1px solid var(--color-border, #444);
      }
    `,
  ];

  @state() private projectName = "My Excalibur Game";
  @state() private version = "0.1.0";
  @state() private resolutionW = 800;
  @state() private resolutionH = 600;
  @state() private backgroundColor = "#1a1a2e";
  @state() private gravity = 9.8;
  @state() private physicsEnabled = true;
  @state() private targetFps = 60;
  @state() private entryScene = "MainScene";
  @state() private saved = false;

  private handleSave() {
    this.dispatchEvent(
      new CustomEvent("project-config-save", {
        bubbles: true,
        composed: true,
        detail: {
          projectName: this.projectName,
          version: this.version,
          resolution: { w: this.resolutionW, h: this.resolutionH },
          backgroundColor: this.backgroundColor,
          gravity: this.gravity,
          physicsEnabled: this.physicsEnabled,
          targetFps: this.targetFps,
          entryScene: this.entryScene,
        },
      }),
    );
    this.saved = true;
    setTimeout(() => (this.saved = false), 2000);
  }

  private handleReset() {
    this.projectName = "My Excalibur Game";
    this.version = "0.1.0";
    this.resolutionW = 800;
    this.resolutionH = 600;
    this.backgroundColor = "#1a1a2e";
    this.gravity = 9.8;
    this.physicsEnabled = true;
    this.targetFps = 60;
    this.entryScene = "MainScene";
  }

  render() {
    return html`
      <div class="config-panel">
        <div class="section-title">General</div>

        <div class="field-row">
          <label>Project Name</label>
          <input
            type="text"
            .value=${this.projectName}
            @input=${(e: InputEvent) => (this.projectName = (e.target as HTMLInputElement).value)}
          />
        </div>

        <div class="field-row">
          <label>Version</label>
          <input
            type="text"
            .value=${this.version}
            @input=${(e: InputEvent) => (this.version = (e.target as HTMLInputElement).value)}
          />
        </div>

        <div class="field-row">
          <label>Entry Scene</label>
          <input
            type="text"
            .value=${this.entryScene}
            @input=${(e: InputEvent) => (this.entryScene = (e.target as HTMLInputElement).value)}
          />
        </div>

        <div class="section-title">Display</div>

        <div class="field-row">
          <label>Resolution</label>
          <div class="resolution-group">
            <input
              type="number"
              .value=${String(this.resolutionW)}
              min="1"
              @input=${(e: InputEvent) => (this.resolutionW = Number((e.target as HTMLInputElement).value))}
            />
            <span class="resolution-sep">×</span>
            <input
              type="number"
              .value=${String(this.resolutionH)}
              min="1"
              @input=${(e: InputEvent) => (this.resolutionH = Number((e.target as HTMLInputElement).value))}
            />
          </div>
        </div>

        <div class="field-row">
          <label>Background Color</label>
          <input
            type="color"
            .value=${this.backgroundColor}
            @input=${(e: InputEvent) => (this.backgroundColor = (e.target as HTMLInputElement).value)}
          />
          <span class="color-hex">${this.backgroundColor}</span>
        </div>

        <div class="field-row">
          <label>Target FPS</label>
          <input
            type="number"
            .value=${String(this.targetFps)}
            min="1"
            max="240"
            @input=${(e: InputEvent) => (this.targetFps = Number((e.target as HTMLInputElement).value))}
          />
        </div>

        <div class="section-title">Physics</div>

        <div class="field-row">
          <label>Physics Enabled</label>
          <input
            type="checkbox"
            .checked=${this.physicsEnabled}
            @change=${(e: Event) => (this.physicsEnabled = (e.target as HTMLInputElement).checked)}
          />
        </div>

        <div class="field-row">
          <label>Gravity</label>
          <input
            type="number"
            .value=${String(this.gravity)}
            step="0.1"
            ?disabled=${!this.physicsEnabled}
            @input=${(e: InputEvent) => (this.gravity = Number((e.target as HTMLInputElement).value))}
          />
        </div>
      </div>

      <div class="save-bar">
        <button class="secondary" @click=${this.handleReset}>Reset</button>
        <button @click=${this.handleSave}>${this.saved ? "✓ Saved" : "Save"}</button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "mock-project-config": MockProjectConfig;
  }
}
