import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import { sharedStyles } from "../styles/shared";

@customElement("mock-tree")
export class MockTree extends LitElement {
  static styles = [
    sharedStyles,
    css`
      :host {
        display: flex;
        flex: 1;
        flex-direction: column;
        overflow: hidden;
        background: var(--editor-bg2);
      }
      .tree {
        flex: 1;
        overflow-y: auto;
        padding: 8px 0;
      }
      .node {
        padding: 3px 8px;
        font-size: 11px;
        cursor: pointer;
        color: var(--editor-text2);
        display: flex;
        align-items: center;
        gap: 6px;
        transition: background 0.1s;
      }
      .node:hover {
        background: var(--editor-surface);
        color: var(--editor-text);
      }
      .node.selected {
        background: rgba(124, 106, 247, 0.12);
        color: var(--editor-accent);
      }
      .indent {
        padding-left: 20px;
      }
    `,
  ];

  private selected = "player";

  private select(id: string) {
    this.selected = id;
    this.requestUpdate();
  }

  render() {
    const n = (id: string, label: string, indent = false) => html`
      <div class="node ${indent ? "indent" : ""} ${this.selected === id ? "selected" : ""}" @click=${() => this.select(id)}>
        ${label}
      </div>
    `;
    return html`
      <div class="tree">
        ${n("root", "🎮 TowerDefense")} ${n("player", "👤 Player", true)} ${n("enemy1", "👾 Enemy_01", true)}
        ${n("tower", "🏰 Tower_A", true)} ${n("map", "🗺️ MapGenerator", true)} ${n("fog", "🌫️ FogActor", true)}
        ${n("power", "⚡ PowerGraph", true)} ${n("camera", "📷 Camera")}
      </div>
    `;
  }
}
