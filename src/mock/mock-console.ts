import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import { sharedStyles } from "../styles/shared";

const LOGS = [
  { level: "ok", msg: "[Engine] ExcaliburJS initialized · WebGL2" },
  { level: "info", msg: "[Scene] Loading TowerDefense..." },
  { level: "warn", msg: "[InputMapper] No gamepad detected" },
  { level: "err", msg: "[CableSegment] Physics body null ref" },
  { level: "ok", msg: "[HaloMaterial] Shader compiled" },
];

@customElement("mock-console")
export class MockConsole extends LitElement {
  static styles = [
    sharedStyles,
    css`
      :host {
        display: flex;
        flex: 1;
        flex-direction: column;
        overflow: hidden;
      }
      .log-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
        font-size: 11px;
        line-height: 1.6;
      }
      .ok {
        color: #3ecf8e;
      }
      .info {
        color: var(--editor-text2);
      }
      .warn {
        color: #f0a500;
      }
      .err {
        color: #f06060;
      }
      .time {
        color: var(--editor-text3);
        margin-right: 8px;
      }
    `,
  ];
  render() {
    return html`
      <div class="log-list">
        ${LOGS.map(
          (l, i) => html` <div><span class="time">00:0${i}.${100 + i * 37}</span><span class="${l.level}">${l.msg}</span></div> `,
        )}
      </div>
    `;
  }
}
