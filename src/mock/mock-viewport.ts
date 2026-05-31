import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import { sharedStyles } from "../styles/shared";

@customElement("mock-viewport")
export class MockViewport extends LitElement {
  static styles = [
    sharedStyles,
    css`
      :host {
        display: flex;
        flex: 1;
        flex-direction: column;
        overflow: hidden;
        background: #0d0e10;
      }
      .grid {
        flex: 1;
        background-image:
          linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
        background-size: 24px 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .bounds {
        width: 220px;
        height: 140px;
        border: 1.5px dashed rgba(124, 106, 247, 0.5);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(124, 106, 247, 0.5);
        font-size: 11px;
      }
    `,
  ];
  render() {
    return html`
      <div class="grid">
        <div class="bounds">Scene Bounds</div>
      </div>
    `;
  }
}
