import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("mock-shader-preview")
export class MockShaderPreview extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #000;
      color: #fff;
      font-family: monospace;
      font-size: 11px;
      position: relative;
    }

    .sp-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 10px;
      background: rgba(0, 0, 0, 0.6);
      border-bottom: 1px solid var(--editor-border);
      flex-shrink: 0;
      position: relative;
      z-index: 1;
    }

    .sp-label {
      color: var(--editor-text2);
      font-size: 11px;
    }
    .sp-badge {
      font-size: 9px;
      padding: 1px 5px;
      border-radius: 2px;
      background: var(--editor-accent);
      color: var(--editor-bg);
      font-weight: bold;
    }

    .sp-btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #ccc;
      border-radius: 3px;
      padding: 2px 8px;
      cursor: pointer;
      font-size: 11px;
      font-family: monospace;
    }

    .sp-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
    }
    .sp-btn.active {
      background: var(--editor-accent);
      color: var(--editor-bg);
      border-color: var(--editor-accent);
    }

    .canvas-area {
      flex: 1;
      position: relative;
      overflow: hidden;
    }

    /* Shader sim: animated gradient */
    .shader-bg {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #0a0a2e, #1a0533, #0a1a1a, #001a0a);
      background-size: 400% 400%;
      animation: gradientShift 6s ease infinite;
    }

    @keyframes gradientShift {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }

    /* Scanlines overlay */
    .scanlines {
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.08) 2px, rgba(0, 0, 0, 0.08) 4px);
      pointer-events: none;
    }

    /* Animated "glow orbs" simulating shader UV effects */
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(40px);
      opacity: 0.5;
      mix-blend-mode: screen;
    }

    .orb-1 {
      width: 200px;
      height: 200px;
      background: #4466ff;
      animation: orbit1 7s ease-in-out infinite;
    }

    .orb-2 {
      width: 160px;
      height: 160px;
      background: #aa44ff;
      animation: orbit2 5s ease-in-out infinite;
    }

    .orb-3 {
      width: 120px;
      height: 120px;
      background: #00ffcc;
      animation: orbit3 9s ease-in-out infinite;
    }

    @keyframes orbit1 {
      0% {
        top: 20%;
        left: 10%;
      }
      33% {
        top: 60%;
        left: 70%;
      }
      66% {
        top: 10%;
        left: 50%;
      }
      100% {
        top: 20%;
        left: 10%;
      }
    }

    @keyframes orbit2 {
      0% {
        top: 50%;
        left: 60%;
      }
      50% {
        top: 20%;
        left: 20%;
      }
      100% {
        top: 50%;
        left: 60%;
      }
    }

    @keyframes orbit3 {
      0% {
        top: 70%;
        left: 30%;
      }
      33% {
        top: 30%;
        left: 80%;
      }
      66% {
        top: 80%;
        left: 60%;
      }
      100% {
        top: 70%;
        left: 30%;
      }
    }

    /* Grid overlay (UV debug lines) */
    .uv-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
      background-size: 32px 32px;
    }

    .uv-grid.hidden {
      display: none;
    }

    /* HUD overlay */
    .hud {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 6px 10px;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      gap: 16px;
      font-size: 10px;
      color: rgba(255, 255, 255, 0.5);
    }

    .hud-val {
      color: var(--editor-accent);
    }

    .mode-overlay {
      position: absolute;
      top: 8px;
      right: 8px;
      font-size: 10px;
      padding: 2px 6px;
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      color: rgba(255, 255, 255, 0.4);
    }
  `;

  private _showGrid = false;
  private _mode: "gradient" | "plasma" | "noise" = "gradient";
  private _paused = false;
  // private _time = 0;
  private _rafId: number | null = null;
  private _tick = 0;
  private _intervalId: ReturnType<typeof setInterval> | null = null;

  connectedCallback() {
    super.connectedCallback();
    // Lightweight ticker for HUD display
    this._intervalId = setInterval(() => {
      if (!this._paused) {
        this._tick++;
        this.requestUpdate();
      }
    }, 100);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  private _toggleGrid() {
    this._showGrid = !this._showGrid;
    this.requestUpdate();
  }
  private _togglePause() {
    this._paused = !this._paused;
    this.requestUpdate();
  }
  private _cycleMode() {
    const modes: Array<"gradient" | "plasma" | "noise"> = ["gradient", "plasma", "noise"];
    const i = modes.indexOf(this._mode);
    this._mode = modes[(i + 1) % modes.length];
    this.requestUpdate();
  }

  private _fakeUV() {
    const t = (this._tick * 0.1) % 1;
    return { u: t.toFixed(3), v: (1 - t).toFixed(3) };
  }

  render() {
    const uv = this._fakeUV();
    const animState = this._paused ? "animation-play-state: paused" : "";

    return html`
      <div class="sp-toolbar">
        <span class="sp-label">◈ Shader Preview</span>
        <span class="sp-badge">${this._mode}</span>
        <button class="sp-btn" @click=${this._cycleMode}>Mode</button>
        <button class="sp-btn ${this._showGrid ? "active" : ""}" @click=${this._toggleGrid}>UV Grid</button>
        <button class="sp-btn ${this._paused ? "active" : ""}" @click=${this._togglePause}>
          ${this._paused ? "▶ Resume" : "⏸ Pause"}
        </button>
      </div>
      <div class="canvas-area">
        <div class="shader-bg" style="${animState}"></div>
        <div class="orb orb-1" style="${animState}"></div>
        <div class="orb orb-2" style="${animState}"></div>
        <div class="orb orb-3" style="${animState}"></div>
        <div class="scanlines"></div>
        <div class="uv-grid ${this._showGrid ? "" : "hidden"}"></div>
        <div class="mode-overlay">◈ ${this._mode}.glsl</div>
        <div class="hud">
          <span>uv: (<span class="hud-val">${uv.u}</span>, <span class="hud-val">${uv.v}</span>)</span>
          <span>time: <span class="hud-val">${(this._tick * 0.1).toFixed(1)}</span>s</span>
          <span>resolution: <span class="hud-val">auto</span></span>
          <span>blend: <span class="hud-val">screen</span></span>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "mock-shader-preview": MockShaderPreview;
  }
}
