import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { sharedStyles } from "../styles/shared";

const COLS = 20;
const ROWS = 15;
const TILE_SIZE = 32;

// Index 0 = empty; indices 1–8 map to palette colors
const PALETTE: { label: string; color: string }[] = [
  { label: "Eraser", color: "transparent" },
  { label: "Stone", color: "#6b7280" },
  { label: "Dirt", color: "#92400e" },
  { label: "Grass", color: "#16a34a" },
  { label: "Water", color: "#2563eb" },
  { label: "Lava", color: "#dc2626" },
  { label: "Sand", color: "#ca8a04" },
  { label: "Ice", color: "#7dd3fc" },
  { label: "Wood", color: "#78350f" },
];

function emptyGrid(): number[][] {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

@customElement("mock-level-editor")
export class MockLevelEditor extends LitElement {
  static styles = [
    sharedStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
        box-sizing: border-box;
        user-select: none;
      }

      .toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border-bottom: 1px solid var(--color-border, #333);
        flex-shrink: 0;
      }

      .toolbar-label {
        font-size: 11px;
        color: var(--color-text-muted, #888);
      }

      .toolbar button {
        background: var(--color-input-bg, #2a2a2a);
        color: var(--color-text, #ccc);
        border: 1px solid var(--color-border, #444);
        border-radius: 3px;
        padding: 3px 10px;
        font-size: 11px;
        font-family: inherit;
        cursor: pointer;
      }

      .toolbar button:hover {
        border-color: var(--color-accent, #5b8fff);
        color: #fff;
      }

      .toolbar button.active {
        background: var(--color-accent, #5b8fff);
        border-color: var(--color-accent, #5b8fff);
        color: #fff;
      }

      .main {
        display: flex;
        flex: 1;
        overflow: hidden;
      }

      .palette {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 8px 6px;
        border-right: 1px solid var(--color-border, #333);
        flex-shrink: 0;
        overflow-y: auto;
      }

      .swatch {
        width: 28px;
        height: 28px;
        border-radius: 3px;
        border: 2px solid transparent;
        cursor: pointer;
        box-sizing: border-box;
        flex-shrink: 0;
        position: relative;
      }

      .swatch.active {
        border-color: var(--color-accent, #5b8fff);
      }

      .swatch.eraser {
        background: var(--color-input-bg, #1e1e1e);
        border-color: var(--color-border, #444);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
      }

      .swatch.eraser.active {
        border-color: var(--color-accent, #5b8fff);
      }

      .canvas-wrap {
        flex: 1;
        overflow: auto;
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        padding: 8px;
      }

      canvas {
        display: block;
        cursor: crosshair;
        image-rendering: pixelated;
      }

      .status-bar {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 3px 10px;
        border-top: 1px solid var(--color-border, #333);
        font-size: 11px;
        color: var(--color-text-muted, #888);
        flex-shrink: 0;
      }

      .status-bar span {
        font-family: monospace;
      }
    `,
  ];

  @state() private activeTile = 1;
  @state() private tiles: number[][] = emptyGrid();
  @state() private showGrid = true;
  @state() private hoverCell: { col: number; row: number } | null = null;

  private isPainting = false;

  // ── Canvas rendering ──────────────────────────────────────────────────────

  private get canvas(): HTMLCanvasElement | null {
    return this.renderRoot.querySelector("canvas");
  }

  private drawCanvas() {
    const c = this.canvas;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const W = COLS * TILE_SIZE;
    const H = ROWS * TILE_SIZE;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#111118";
    ctx.fillRect(0, 0, W, H);

    // Tiles
    for (let r = 0; r < ROWS; r++) {
      for (let col = 0; col < COLS; col++) {
        const idx = this.tiles[r][col];
        if (idx > 0) {
          ctx.fillStyle = PALETTE[idx].color;
          ctx.fillRect(col * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // Hover highlight
    if (this.hoverCell) {
      const { col, row } = this.hoverCell;
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }

    // Grid lines
    if (this.showGrid) {
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 0.5;
      for (let col = 0; col <= COLS; col++) {
        ctx.beginPath();
        ctx.moveTo(col * TILE_SIZE, 0);
        ctx.lineTo(col * TILE_SIZE, H);
        ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * TILE_SIZE);
        ctx.lineTo(W, r * TILE_SIZE);
        ctx.stroke();
      }
    }
  }

  updated() {
    this.drawCanvas();
  }

  // ── Input helpers ─────────────────────────────────────────────────────────

  private cellFromEvent(e: MouseEvent): { col: number; row: number } | null {
    const c = this.canvas;
    if (!c) return null;
    const rect = c.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    const row = Math.floor((e.clientY - rect.top) / TILE_SIZE);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
    return { col, row };
  }

  private paintCell(cell: { col: number; row: number }) {
    const next = this.tiles.map(r => [...r]);
    next[cell.row][cell.col] = this.activeTile === 0 ? 0 : this.activeTile;
    this.tiles = next;
  }

  private handleMouseDown(e: MouseEvent) {
    this.isPainting = true;
    const cell = this.cellFromEvent(e);
    if (cell) this.paintCell(cell);
  }

  private handleMouseMove(e: MouseEvent) {
    const cell = this.cellFromEvent(e);
    this.hoverCell = cell;
    if (this.isPainting && cell) this.paintCell(cell);
  }

  private handleMouseUp() {
    this.isPainting = false;
  }

  private handleMouseLeave() {
    this.isPainting = false;
    this.hoverCell = null;
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "e" || e.key === "E") this.activeTile = 0;
  };

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("mouseup", this.handleMouseUp.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this.handleKeyDown);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  render() {
    const { hoverCell } = this;

    return html`
      <div class="toolbar">
        <span class="toolbar-label">Level Editor</span>
        <button class=${this.showGrid ? "active" : ""} @click=${() => (this.showGrid = !this.showGrid)} title="Toggle grid">
          Grid
        </button>
        <button @click=${() => (this.tiles = emptyGrid())} title="Clear all tiles">Clear</button>
      </div>

      <div class="main">
        <div class="palette">
          ${PALETTE.map(
            (p, i) => html`
              <div
                class="swatch ${i === 0 ? "eraser" : ""} ${this.activeTile === i ? "active" : ""}"
                style=${i > 0 ? `background:${p.color}` : ""}
                title=${p.label}
                @click=${() => (this.activeTile = i)}
              >
                ${i === 0 ? "✕" : ""}
              </div>
            `,
          )}
        </div>

        <div class="canvas-wrap">
          <canvas
            width=${COLS * TILE_SIZE}
            height=${ROWS * TILE_SIZE}
            @mousedown=${this.handleMouseDown}
            @mousemove=${this.handleMouseMove}
            @mouseleave=${this.handleMouseLeave}
          ></canvas>
        </div>
      </div>

      <div class="status-bar">
        <span> ${hoverCell ? `Col: ${hoverCell.col}  Row: ${hoverCell.row}` : "—"} </span>
        <span>Active: ${PALETTE[this.activeTile].label}</span>
        <span>${COLS}×${ROWS} @ ${TILE_SIZE}px</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "mock-level-editor": MockLevelEditor;
  }
}
