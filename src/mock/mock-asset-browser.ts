import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

type AssetEntry = {
  name: string;
  ext: string;
  size: string;
  icon: string;
  category: string;
};

const ASSETS: AssetEntry[] = [
  { name: "player_idle", ext: "png", size: "4 KB", icon: "🖼", category: "Sprites" },
  { name: "player_run", ext: "png", size: "12 KB", icon: "🖼", category: "Sprites" },
  { name: "player_jump", ext: "png", size: "6 KB", icon: "🖼", category: "Sprites" },
  { name: "goblin_walk", ext: "png", size: "9 KB", icon: "🖼", category: "Sprites" },
  { name: "tileset_dungeon", ext: "png", size: "64 KB", icon: "🖼", category: "Tiles" },
  { name: "tileset_cave", ext: "png", size: "48 KB", icon: "🖼", category: "Tiles" },
  { name: "bg_forest", ext: "png", size: "128 KB", icon: "🌄", category: "Backgrounds" },
  { name: "bg_sky", ext: "png", size: "96 KB", icon: "🌄", category: "Backgrounds" },
  { name: "music_theme", ext: "ogg", size: "2.1 MB", icon: "🎵", category: "Audio" },
  { name: "sfx_jump", ext: "wav", size: "18 KB", icon: "🔊", category: "Audio" },
  { name: "sfx_hurt", ext: "wav", size: "12 KB", icon: "🔊", category: "Audio" },
  { name: "sfx_coin", ext: "wav", size: "8 KB", icon: "🔊", category: "Audio" },
  { name: "font_pixel", ext: "png", size: "3 KB", icon: "🔤", category: "Fonts" },
  { name: "shader_outline", ext: "glsl", size: "1 KB", icon: "◈", category: "Shaders" },
  { name: "shader_water", ext: "glsl", size: "2 KB", icon: "◈", category: "Shaders" },
  { name: "map_level1", ext: "json", size: "22 KB", icon: "🗺", category: "Maps" },
  { name: "map_level2", ext: "json", size: "31 KB", icon: "🗺", category: "Maps" },
  { name: "cards_wonderland", ext: "json", size: "14 KB", icon: "🃏", category: "Data" },
];

const EXT_COLORS: Record<string, string> = {
  png: "#4da6ff",
  ogg: "#a78bfa",
  wav: "#a78bfa",
  glsl: "#34d399",
  json: "#fbbf24",
  default: "#94a3b8",
};

@customElement("mock-asset-browser")
export class MockAssetBrowser extends LitElement {
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

    .toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 10px;
      background: var(--editor-bg3);
      border-bottom: 1px solid var(--editor-border);
      flex-shrink: 0;
    }

    .toolbar-label {
      color: var(--editor-text2);
      font-size: 11px;
    }

    .view-toggle {
      display: flex;
      gap: 2px;
      margin-left: auto;
    }

    .toggle-btn {
      background: var(--editor-surface2);
      border: 1px solid var(--editor-border);
      color: var(--editor-text2);
      border-radius: 3px;
      padding: 2px 8px;
      cursor: pointer;
      font-size: 13px;
      line-height: 1;
    }

    .toggle-btn:hover { background: var(--editor-surface3); }
    .toggle-btn.active {
      background: var(--editor-accent);
      color: var(--editor-bg);
      border-color: var(--editor-accent);
    }

    .filter-input {
      background: var(--editor-surface);
      border: 1px solid var(--editor-border);
      color: var(--editor-text);
      font-family: monospace;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 3px;
      width: 120px;
    }

    .filter-input:focus { outline: none; border-color: var(--editor-accent); }

    .asset-area {
      flex: 1;
      overflow: auto;
      padding: 8px;
    }

    /* ---- GRID VIEW ---- */
    .grid-view {
      display: grid;
      grid-template-columns: repeat(auto-fill, 80px);
      gap: 8px;
      min-width: max-content; /* intentionally overflows to test containment */
    }

    .grid-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px 4px;
      border-radius: 4px;
      cursor: pointer;
      border: 1px solid transparent;
      user-select: none;
    }

    .grid-item:hover { background: var(--editor-surface); border-color: var(--editor-border); }
    .grid-item.selected { background: var(--editor-surface2); border-color: var(--editor-accent); }

    .grid-icon { font-size: 28px; line-height: 1; }

    .grid-name {
      font-size: 10px;
      color: var(--editor-text2);
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: 100%;
    }

    .grid-ext {
      font-size: 9px;
      padding: 1px 4px;
      border-radius: 2px;
      color: var(--editor-bg);
      font-weight: bold;
    }

    /* ---- LIST VIEW ---- */
    .list-view { display: flex; flex-direction: column; gap: 1px; }

    .list-item {
      display: grid;
      grid-template-columns: 24px 1fr 64px 60px;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      border-radius: 3px;
      cursor: pointer;
      border: 1px solid transparent;
      user-select: none;
    }

    .list-item:hover { background: var(--editor-surface); }
    .list-item.selected { background: var(--editor-surface2); border-color: var(--editor-accent); }

    .list-icon { font-size: 14px; text-align: center; }

    .list-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--editor-text);
    }

    .list-ext {
      font-size: 10px;
      padding: 1px 5px;
      border-radius: 2px;
      color: var(--editor-bg);
      font-weight: bold;
      text-align: center;
    }

    .list-size { color: var(--editor-text3); font-size: 11px; text-align: right; }
  `;

  @property({ type: String }) viewMode: "grid" | "list" = "grid";

  private _selected: string | null = null;
  private _filter = "";

  private _filteredAssets() {
    const q = this._filter.toLowerCase();
    return q ? ASSETS.filter((a) => a.name.includes(q) || a.ext.includes(q) || a.category.toLowerCase().includes(q)) : ASSETS;
  }

  private _extColor(ext: string) {
    return EXT_COLORS[ext] ?? EXT_COLORS.default;
  }

  render() {
    const assets = this._filteredAssets();

    return html`
      <div class="toolbar">
        <span class="toolbar-label">🗂 Assets (${assets.length})</span>
        <input
          class="filter-input"
          placeholder="filter…"
          .value=${this._filter}
          @input=${(e: Event) => { this._filter = (e.target as HTMLInputElement).value; this.requestUpdate(); }}
        />
        <div class="view-toggle">
          <button class="toggle-btn ${this.viewMode === "grid" ? "active" : ""}" @click=${() => { this.viewMode = "grid"; }}>⊞</button>
          <button class="toggle-btn ${this.viewMode === "list" ? "active" : ""}" @click=${() => { this.viewMode = "list"; }}>☰</button>
        </div>
      </div>
      <div class="asset-area">
        ${this.viewMode === "grid" ? this._renderGrid(assets) : this._renderList(assets)}
      </div>
    `;
  }

  private _renderGrid(assets: AssetEntry[]) {
    return html`
      <div class="grid-view">
        ${assets.map(
          (a) => html`
            <div
              class="grid-item ${this._selected === a.name ? "selected" : ""}"
              @click=${() => { this._selected = a.name; this.requestUpdate(); }}
            >
              <span class="grid-icon">${a.icon}</span>
              <span class="grid-name">${a.name}</span>
              <span class="grid-ext" style="background:${this._extColor(a.ext)}">${a.ext}</span>
            </div>
          `
        )}
      </div>
    `;
  }

  private _renderList(assets: AssetEntry[]) {
    return html`
      <div class="list-view">
        ${assets.map(
          (a) => html`
            <div
              class="list-item ${this._selected === a.name ? "selected" : ""}"
              @click=${() => { this._selected = a.name; this.requestUpdate(); }}
            >
              <span class="list-icon">${a.icon}</span>
              <span class="list-name">${a.name}</span>
              <span class="list-ext" style="background:${this._extColor(a.ext)}">${a.ext}</span>
              <span class="list-size">${a.size}</span>
            </div>
          `
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "mock-asset-browser": MockAssetBrowser;
  }
}
