import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

type Metric = {
  label: string;
  unit: string;
  value: number;
  max: number;
  warn: number;  // threshold for orange
  crit: number;  // threshold for red
  icon: string;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function jitter(base: number, spread: number) {
  return base + (Math.random() - 0.5) * spread * 2;
}

@customElement("mock-diagnostics")
export class MockDiagnostics extends LitElement {
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

    .diag-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 10px;
      background: var(--editor-bg3);
      border-bottom: 1px solid var(--editor-border);
      flex-shrink: 0;
    }

    .diag-label { color: var(--editor-text2); }

    .fps-badge {
      margin-left: auto;
      font-size: 13px;
      font-weight: bold;
      color: var(--editor-accent);
    }

    .interval-input {
      background: var(--editor-surface);
      border: 1px solid var(--editor-border);
      color: var(--editor-text);
      font-family: monospace;
      font-size: 11px;
      width: 56px;
      padding: 2px 4px;
      border-radius: 3px;
    }

    .interval-input:focus { outline: none; border-color: var(--editor-accent); }

    .diag-body {
      flex: 1;
      overflow-y: auto;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .section-title {
      color: var(--editor-text3);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border-bottom: 1px solid var(--editor-border);
      padding-bottom: 2px;
      margin-bottom: 4px;
    }

    .metric {
      display: grid;
      grid-template-columns: 20px 110px 1fr 52px;
      align-items: center;
      gap: 6px;
    }

    .metric-icon { text-align: center; font-size: 13px; }

    .metric-label { color: var(--editor-text2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .bar-track {
      height: 10px;
      background: var(--editor-surface);
      border-radius: 3px;
      overflow: hidden;
      position: relative;
    }

    .bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.25s ease;
    }

    .bar-fill.ok   { background: #34d399; }
    .bar-fill.warn { background: #fbbf24; }
    .bar-fill.crit { background: #f87171; }

    .metric-val {
      text-align: right;
      color: var(--editor-text);
      white-space: nowrap;
    }

    .spark-row {
      grid-column: 2 / -1;
      height: 24px;
      position: relative;
      overflow: hidden;
    }

    .spark-canvas {
      width: 100%;
      height: 100%;
    }

    .history-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .log-line {
      font-size: 10px;
      color: var(--editor-text3);
      padding: 1px 0;
      border-bottom: 1px solid var(--editor-border);
      display: flex;
      gap: 8px;
    }

    .log-time { color: var(--editor-accent); flex-shrink: 0; }
  `;

  @property({ type: Number }) updateIntervalMs: number = 500;

  private _intervalId: ReturnType<typeof setInterval> | null = null;
  private _tick = 0;

  private _metrics: Metric[] = [
    { label: "Draw Calls",    unit: "",    value: 42,   max: 200,  warn: 100, crit: 150, icon: "🖊" },
    { label: "Entities",      unit: "",    value: 128,  max: 1000, warn: 500, crit: 800, icon: "🔲" },
    { label: "JS Heap",       unit: "MB",  value: 48,   max: 512,  warn: 256, crit: 400, icon: "💾" },
    { label: "GPU Mem",       unit: "MB",  value: 112,  max: 1024, warn: 512, crit: 768, icon: "🎮" },
    { label: "Update (ms)",   unit: "ms",  value: 1.2,  max: 16,   warn: 8,   crit: 14,  icon: "⏱" },
    { label: "Render (ms)",   unit: "ms",  value: 4.8,  max: 16,   warn: 8,   crit: 14,  icon: "🖼" },
    { label: "Physics (ms)",  unit: "ms",  value: 0.9,  max: 16,   warn: 4,   crit: 8,   icon: "⚡" },
    { label: "Texture Binds", unit: "",    value: 18,   max: 64,   warn: 32,  crit: 50,  icon: "🔗" },
  ];

  // Targets for smooth lerping
  private _targets: number[] = this._metrics.map((m) => m.value);

  // Fake spike history for FPS
  private _fpsHistory: number[] = Array.from({ length: 40 }, () => 58 + Math.random() * 4);
  private _fps = 60;

  private _logs: { time: string; msg: string }[] = [
    { time: "00:00.0", msg: "Diagnostics panel initialized" },
    { time: "00:00.1", msg: "ExcaliburJS engine detected" },
    { time: "00:00.2", msg: "Collecting frame metrics…" },
  ];

  connectedCallback() {
    super.connectedCallback();
    this._startInterval();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopInterval();
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("updateIntervalMs")) {
      this._stopInterval();
      this._startInterval();
    }
  }

  private _startInterval() {
    this._stopInterval();
    this._intervalId = setInterval(() => this._update(), Math.max(100, this.updateIntervalMs));
  }

  private _stopInterval() {
    if (this._intervalId !== null) { clearInterval(this._intervalId); this._intervalId = null; }
  }

  private _update() {
    this._tick++;

    // Drift targets slowly with occasional spikes
    this._targets = this._targets.map((t, i) => {
      const m = this._metrics[i];
      let next = jitter(t, m.max * 0.03);
      // Random spike every ~10 ticks
      if (Math.random() < 0.08) next = jitter(m.max * 0.7, m.max * 0.15);
      return Math.max(0, Math.min(m.max, next));
    });

    // Lerp current values toward targets
    this._metrics = this._metrics.map((m, i) => ({
      ...m,
      value: lerp(m.value, this._targets[i], 0.3),
    }));

    // FPS: mostly stable with occasional dips
    const targetFps = Math.random() < 0.05 ? jitter(30, 10) : jitter(60, 2);
    this._fps = lerp(this._fps, Math.max(1, targetFps), 0.2);
    this._fpsHistory.push(this._fps);
    if (this._fpsHistory.length > 40) this._fpsHistory.shift();

    // Occasional log entries
    if (this._tick % 10 === 0) {
      const sec = ((this._tick * this.updateIntervalMs) / 1000).toFixed(1);
      const msgs = [
        "Scene graph traversal complete",
        `Culled ${Math.floor(Math.random() * 20)} off-screen entities`,
        "Audio buffer replenished",
        `GC cycle: freed ${Math.floor(Math.random() * 8)}MB`,
        "Shader cache hit",
      ];
      this._logs.unshift({ time: `00:${sec.padStart(4, "0")}`, msg: msgs[Math.floor(Math.random() * msgs.length)] });
      if (this._logs.length > 8) this._logs.pop();
    }

    this.requestUpdate();
  }

  private _barClass(m: Metric): string {
    if (m.value >= m.crit) return "crit";
    if (m.value >= m.warn) return "warn";
    return "ok";
  }

  private _formatVal(m: Metric): string {
    const v = m.unit === "ms" ? m.value.toFixed(1) : Math.round(m.value).toString();
    return m.unit ? `${v}${m.unit}` : v;
  }

  private _renderSparkline(): string {
    const w = 300;
    const h = 24;
    const max = 65;
    const pts = this._fpsHistory;
    if (pts.length < 2) return "";
    const coords = pts.map((v, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - (v / max) * h;
      return `${x},${y}`;
    });
    return `M${coords.join("L")}`;
  }

  render() {
    const fps = Math.round(this._fps);
    const fpsColor = fps < 30 ? "#f87171" : fps < 50 ? "#fbbf24" : "#34d399";

    return html`
      <div class="diag-toolbar">
        <span class="diag-label">📊 Diagnostics</span>
        <span class="diag-label" style="margin-left:4px">Interval:</span>
        <input
          class="interval-input"
          type="number"
          min="100"
          max="5000"
          step="100"
          .value=${String(this.updateIntervalMs)}
          @change=${(e: Event) => { this.updateIntervalMs = Number((e.target as HTMLInputElement).value); }}
        />
        <span class="diag-label">ms</span>
        <span class="fps-badge" style="color:${fpsColor}">${fps} FPS</span>
      </div>
      <div class="diag-body">

        <!-- FPS Sparkline -->
        <div>
          <div class="section-title">Frame Rate</div>
          <svg class="spark-canvas" viewBox="0 0 300 24" preserveAspectRatio="none" style="display:block;width:100%;height:28px">
            <path d=${this._renderSparkline()} fill="none" stroke="${fpsColor}" stroke-width="1.5" opacity="0.8"/>
            <path d="${this._renderSparkline()} V24 H0 Z" fill="${fpsColor}" opacity="0.12"/>
          </svg>
        </div>

        <!-- Performance metrics -->
        <div>
          <div class="section-title">Performance</div>
          ${this._metrics.map((m) => html`
            <div class="metric">
              <span class="metric-icon">${m.icon}</span>
              <span class="metric-label">${m.label}</span>
              <div class="bar-track">
                <div
                  class="bar-fill ${this._barClass(m)}"
                  style="width:${Math.min(100, (m.value / m.max) * 100).toFixed(1)}%"
                ></div>
              </div>
              <span class="metric-val">${this._formatVal(m)}</span>
            </div>
          `)}
        </div>

        <!-- Log -->
        <div class="history-section">
          <div class="section-title">Event Log</div>
          ${this._logs.map((l) => html`
            <div class="log-line">
              <span class="log-time">${l.time}</span>
              <span>${l.msg}</span>
            </div>
          `)}
        </div>

      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "mock-diagnostics": MockDiagnostics;
  }
}
