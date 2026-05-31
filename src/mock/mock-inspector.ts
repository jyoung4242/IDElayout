import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

type PropRow = { name: string; value: string; type: "string" | "number" | "boolean" | "color" };

const ENTITY_PROPS: Record<string, PropRow[]> = {
  "entity-001": [
    { name: "name", value: "Player", type: "string" },
    { name: "x", value: "128", type: "number" },
    { name: "y", value: "256", type: "number" },
    { name: "rotation", value: "0", type: "number" },
    { name: "scale", value: "1", type: "number" },
    { name: "visible", value: "true", type: "boolean" },
    { name: "tint", value: "#ffffff", type: "color" },
  ],
  "entity-002": [
    { name: "name", value: "Enemy_Goblin", type: "string" },
    { name: "x", value: "400", type: "number" },
    { name: "y", value: "300", type: "number" },
    { name: "rotation", value: "180", type: "number" },
    { name: "scale", value: "1.5", type: "number" },
    { name: "visible", value: "true", type: "boolean" },
    { name: "hp", value: "30", type: "number" },
    { name: "tint", value: "#ff4444", type: "color" },
  ],
  "entity-003": [
    { name: "name", value: "PowerUp_Star", type: "string" },
    { name: "x", value: "512", type: "number" },
    { name: "y", value: "100", type: "number" },
    { name: "rotation", value: "0", type: "number" },
    { name: "scale", value: "0.75", type: "number" },
    { name: "visible", value: "true", type: "boolean" },
    { name: "tint", value: "#ffd700", type: "color" },
  ],
};

@customElement("mock-inspector")
export class MockInspector extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: var(--editor-bg2);
      color: var(--editor-text);
      font-family: monospace;
      font-size: 12px;
    }

    .inspector-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      background: var(--editor-bg3);
      border-bottom: 1px solid var(--editor-border);
      font-size: 11px;
      color: var(--editor-text2);
      flex-shrink: 0;
    }

    .entity-badge {
      background: var(--editor-accent);
      color: var(--editor-bg);
      border-radius: 3px;
      padding: 1px 6px;
      font-weight: bold;
      font-size: 10px;
    }

    .entity-picker {
      margin-left: auto;
      display: flex;
      gap: 4px;
    }

    .entity-btn {
      background: var(--editor-surface2);
      border: 1px solid var(--editor-border);
      color: var(--editor-text2);
      border-radius: 3px;
      padding: 2px 6px;
      cursor: pointer;
      font-size: 10px;
      font-family: monospace;
    }

    .entity-btn:hover {
      background: var(--editor-surface3);
      color: var(--editor-text);
    }

    .entity-btn.active {
      background: var(--editor-accent);
      color: var(--editor-bg);
      border-color: var(--editor-accent);
    }

    .prop-list {
      flex: 1;
      overflow-y: auto;
      padding: 4px 0;
    }

    .prop-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: center;
      padding: 3px 10px;
      border-bottom: 1px solid var(--editor-border);
      gap: 8px;
    }

    .prop-row:hover {
      background: var(--editor-surface);
    }

    .prop-name {
      color: var(--editor-text2);
      user-select: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .prop-input {
      background: var(--editor-surface2);
      border: 1px solid transparent;
      color: var(--editor-text);
      font-family: monospace;
      font-size: 12px;
      padding: 2px 4px;
      border-radius: 2px;
      width: 100%;
      box-sizing: border-box;
    }

    .prop-input:focus {
      outline: none;
      border-color: var(--editor-accent);
    }

    .prop-input[type="color"] {
      padding: 1px;
      height: 22px;
      cursor: pointer;
    }

    .prop-input[type="checkbox"] {
      width: auto;
      accent-color: var(--editor-accent);
    }

    .no-entity {
      padding: 24px 16px;
      color: var(--editor-text3);
      text-align: center;
    }
  `;

  @property({ type: String }) entityId: string = "entity-001";

  private _localValues: Map<string, string> = new Map();
  private _dirty = false;

  updated(changed: Map<string, unknown>) {
    if (changed.has("entityId")) {
      this._localValues = new Map();
      this._dirty = false;
    }
  }

  private _rows(): PropRow[] {
    return ENTITY_PROPS[this.entityId] ?? [];
  }

  private _getValue(row: PropRow): string {
    return this._localValues.get(row.name) ?? row.value;
  }

  private _onInput(name: string, value: string) {
    this._localValues.set(name, value);
    if (!this._dirty) {
      this._dirty = true;
      this.dispatchEvent(
        new CustomEvent("layout-change", {
          bubbles: true,
          composed: true,
          detail: { dirty: true },
        })
      );
    }
    this.requestUpdate();
  }

  private _switchEntity(id: string) {
    this.entityId = id;
    this.requestUpdate();
  }

  render() {
    const rows = this._rows();
    const entityIds = Object.keys(ENTITY_PROPS);

    return html`
      <div class="inspector-header">
        <span>⚙ Inspector</span>
        <span class="entity-badge">${this.entityId}</span>
        <div class="entity-picker">
          ${entityIds.map(
            (id) => html`
              <button
                class="entity-btn ${this.entityId === id ? "active" : ""}"
                @click=${() => this._switchEntity(id)}
              >
                ${id.split("-")[1]}
              </button>
            `
          )}
        </div>
      </div>
      <div class="prop-list">
        ${rows.length === 0
          ? html`<div class="no-entity">No entity selected</div>`
          : rows.map((row) => this._renderRow(row))}
      </div>
    `;
  }

  private _renderRow(row: PropRow) {
    const value = this._getValue(row);

    let input;
    if (row.type === "boolean") {
      input = html`<input
        class="prop-input"
        type="checkbox"
        .checked=${value === "true"}
        @change=${(e: Event) =>
          this._onInput(row.name, (e.target as HTMLInputElement).checked ? "true" : "false")}
      />`;
    } else if (row.type === "color") {
      input = html`<input
        class="prop-input"
        type="color"
        .value=${value}
        @input=${(e: Event) => this._onInput(row.name, (e.target as HTMLInputElement).value)}
      />`;
    } else {
      input = html`<input
        class="prop-input"
        type=${row.type === "number" ? "number" : "text"}
        .value=${value}
        @input=${(e: Event) => this._onInput(row.name, (e.target as HTMLInputElement).value)}
      />`;
    }

    return html`
      <div class="prop-row">
        <span class="prop-name">${row.name}</span>
        ${input}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "mock-inspector": MockInspector;
  }
}
