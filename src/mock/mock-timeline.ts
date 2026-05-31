import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

const TRACKS = [
  { name: "root", color: "#4da6ff" },
  { name: "body", color: "#a78bfa" },
  { name: "head", color: "#34d399" },
  { name: "arm_L", color: "#fbbf24" },
  { name: "arm_R", color: "#f87171" },
  { name: "leg_L", color: "#fb923c" },
  { name: "leg_R", color: "#e879f9" },
];

// Each track has sparse keyframe data as frame indices
const KEYFRAMES: Record<string, number[]> = {
  root:  [0, 8, 16, 24, 32, 40, 48, 56, 64],
  body:  [0, 4, 12, 20, 28, 36, 44, 52, 60],
  head:  [0, 6, 14, 22, 36, 50, 64],
  arm_L: [0, 3, 9, 15, 21, 30, 45, 60],
  arm_R: [0, 5, 11, 17, 26, 35, 50, 63],
  leg_L: [0, 2, 8, 16, 24, 32, 48, 56, 64],
  leg_R: [0, 4, 10, 18, 26, 34, 42, 54, 64],
};

const FRAME_W = 16;
const TRACK_H = 28;
const HEADER_H = 28;
const LABEL_W = 80;
const RULER_INTERVAL = 8;

@customElement("mock-timeline")
export class MockTimeline extends LitElement {
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
      font-size: 11px;
    }

    .tl-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 10px;
      background: var(--editor-bg3);
      border-bottom: 1px solid var(--editor-border);
      flex-shrink: 0;
    }

    .tl-label { color: var(--editor-text2); }

    .tl-ctrl {
      background: var(--editor-surface2);
      border: 1px solid var(--editor-border);
      color: var(--editor-text2);
      border-radius: 3px;
      padding: 2px 8px;
      cursor: pointer;
      font-size: 13px;
    }

    .tl-ctrl:hover { background: var(--editor-surface3); color: var(--editor-text); }
    .tl-ctrl.active { background: var(--editor-accent); color: var(--editor-bg); border-color: var(--editor-accent); }

    .frame-count-input {
      background: var(--editor-surface);
      border: 1px solid var(--editor-border);
      color: var(--editor-text);
      font-family: monospace;
      font-size: 11px;
      width: 52px;
      padding: 2px 4px;
      border-radius: 3px;
    }

    .frame-count-input:focus { outline: none; border-color: var(--editor-accent); }

    .tl-body {
      display: flex;
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    /* Fixed label column */
    .track-labels {
      flex-shrink: 0;
      width: ${LABEL_W}px;
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--editor-border);
      background: var(--editor-bg3);
      z-index: 1;
    }

    .label-header {
      height: ${HEADER_H}px;
      border-bottom: 1px solid var(--editor-border);
      display: flex;
      align-items: center;
      padding: 0 8px;
      color: var(--editor-text3);
      font-size: 10px;
      flex-shrink: 0;
    }

    .track-label {
      height: ${TRACK_H}px;
      display: flex;
      align-items: center;
      padding: 0 8px;
      gap: 6px;
      border-bottom: 1px solid var(--editor-border);
      flex-shrink: 0;
    }

    .track-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .track-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--editor-text2);
    }

    /* Scrollable tracks area */
    .tracks-scroll {
      flex: 1;
      overflow-x: auto;
      overflow-y: hidden;
      position: relative;
    }

    .tracks-canvas {
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .ruler-row {
      height: ${HEADER_H}px;
      display: flex;
      align-items: flex-end;
      border-bottom: 2px solid var(--editor-border);
      flex-shrink: 0;
      position: sticky;
      top: 0;
      background: var(--editor-bg3);
      z-index: 1;
    }

    .ruler-tick {
      position: absolute;
      bottom: 0;
      width: ${FRAME_W}px;
      text-align: center;
      font-size: 9px;
      color: var(--editor-text3);
      user-select: none;
    }

    .ruler-tick-mark {
      position: absolute;
      bottom: 0;
      width: 1px;
      background: var(--editor-border);
    }

    .ruler-tick-major {
      color: var(--editor-text2);
    }

    .track-row {
      height: ${TRACK_H}px;
      border-bottom: 1px solid var(--editor-border);
      position: relative;
      flex-shrink: 0;
    }

    .track-row:hover { background: var(--editor-surface); }

    .frame-cell {
      position: absolute;
      top: 0;
      height: 100%;
      width: ${FRAME_W}px;
      border-right: 1px solid var(--editor-border);
      box-sizing: border-box;
    }

    .keyframe-diamond {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(45deg);
      width: 9px;
      height: 9px;
      border-radius: 1px;
    }

    .playhead {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      z-index: 2;
      pointer-events: none;
    }

    .playhead-top {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-left: -3px;
    }
  `;

  @property({ type: Number }) frameCount: number = 64;

  private _playing = false;
  private _currentFrame = 0;
  private _rafId: number | null = null;
  private _lastTime: number | null = null;
  private _fps = 24;

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stop();
  }

  private _play() {
    this._playing = true;
    this._lastTime = null;
    const loop = (now: number) => {
      if (!this._playing) return;
      if (this._lastTime !== null) {
        const delta = now - this._lastTime;
        this._currentFrame = (this._currentFrame + delta * this._fps / 1000) % this.frameCount;
        this.requestUpdate();
      }
      this._lastTime = now;
      this._rafId = requestAnimationFrame(loop);
    };
    this._rafId = requestAnimationFrame(loop);
    this.requestUpdate();
  }

  private _stop() {
    this._playing = false;
    if (this._rafId !== null) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    this.requestUpdate();
  }

  private _togglePlay() {
    this._playing ? this._stop() : this._play();
  }

  private _rewind() { this._currentFrame = 0; this.requestUpdate(); }

  render() {
    const frames = Math.max(8, Math.min(256, this.frameCount));
    const totalW = frames * FRAME_W;
    const cf = Math.floor(this._currentFrame) % frames;

    return html`
      <div class="tl-toolbar">
        <span class="tl-label">⏱ Timeline</span>
        <button class="tl-ctrl" @click=${this._rewind} title="Rewind">⏮</button>
        <button class="tl-ctrl ${this._playing ? "active" : ""}" @click=${this._togglePlay}>
          ${this._playing ? "⏸" : "▶"}
        </button>
        <span class="tl-label" style="margin-left:4px">Frame: ${cf} / ${frames - 1}</span>
        <span class="tl-label" style="margin-left:auto">Frames:</span>
        <input
          class="frame-count-input"
          type="number"
          min="8"
          max="256"
          step="8"
          .value=${String(this.frameCount)}
          @change=${(e: Event) => {
            this.frameCount = Number((e.target as HTMLInputElement).value);
            this._currentFrame = 0;
          }}
        />
      </div>
      <div class="tl-body">
        <div class="track-labels">
          <div class="label-header">Track</div>
          ${TRACKS.map(
            (t) => html`
              <div class="track-label">
                <div class="track-dot" style="background:${t.color}"></div>
                <span class="track-name">${t.name}</span>
              </div>
            `
          )}
        </div>
        <div class="tracks-scroll">
          <div class="tracks-canvas" style="width:${totalW}px; min-width:100%">
            <!-- Ruler -->
            <div class="ruler-row" style="width:${totalW}px; position:relative">
              ${Array.from({ length: frames }, (_, i) => {
                const isMajor = i % RULER_INTERVAL === 0;
                return html`
                  <div
                    class="ruler-tick ${isMajor ? "ruler-tick-major" : ""}"
                    style="left:${i * FRAME_W}px; bottom: ${isMajor ? "2px" : "0"}"
                  >
                    ${isMajor ? String(i) : ""}
                    <div
                      class="ruler-tick-mark"
                      style="height:${isMajor ? "8px" : "4px"}"
                    ></div>
                  </div>
                `;
              })}
              <!-- Playhead in ruler -->
              <div
                class="playhead"
                style="left:${cf * FRAME_W + FRAME_W / 2}px; background: var(--editor-accent)"
              >
                <div class="playhead-top" style="background: var(--editor-accent)"></div>
              </div>
            </div>

            <!-- Track rows -->
            ${TRACKS.map(
              (track) => html`
                <div class="track-row" style="width:${totalW}px">
                  ${Array.from({ length: frames }, (_, i) => html`
                    <div class="frame-cell" style="left:${i * FRAME_W}px">
                      ${KEYFRAMES[track.name]?.includes(i)
                        ? html`<div class="keyframe-diamond" style="background:${track.color}"></div>`
                        : ""}
                    </div>
                  `)}
                  <!-- Playhead overlay -->
                  <div
                    class="playhead"
                    style="left:${cf * FRAME_W + FRAME_W / 2}px; background: var(--editor-accent); opacity: 0.35"
                  ></div>
                </div>
              `
            )}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "mock-timeline": MockTimeline;
  }
}
