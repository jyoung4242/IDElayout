import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

type EditorFile = {
  name: string;
  lang: string;
  icon: string;
  content: string;
};

const FILES: EditorFile[] = [
  {
    name: "player.ts",
    lang: "typescript",
    icon: "TS",
    content: `import { Actor, Engine, Keys } from "excalibur";

export class Player extends Actor {
  private speed = 200;

  onInitialize(engine: Engine) {
    this.pos.x = engine.halfDrawWidth;
    this.pos.y = engine.halfDrawHeight;
  }

  onPreUpdate(engine: Engine, delta: number) {
    this.vel.x = 0;
    this.vel.y = 0;

    if (engine.input.keyboard.isHeld(Keys.Left)) {
      this.vel.x = -this.speed;
    }
    if (engine.input.keyboard.isHeld(Keys.Right)) {
      this.vel.x = this.speed;
    }
    if (engine.input.keyboard.isHeld(Keys.Up)) {
      this.vel.y = -this.speed;
    }
    if (engine.input.keyboard.isHeld(Keys.Down)) {
      this.vel.y = this.speed;
    }
  }
}`,
  },
  {
    name: "main.ts",
    lang: "typescript",
    icon: "TS",
    content: `import { Engine, DisplayMode, Color } from "excalibur";
import { Player } from "./player";
import { Level1 } from "./scenes/level1";

const game = new Engine({
  width: 1280,
  height: 720,
  displayMode: DisplayMode.FitScreen,
  backgroundColor: Color.fromHex("#1a1a2e"),
});

const player = new Player();
const level1 = new Level1(player);

game.addScene("level1", level1);
game.goToScene("level1");

game.start().then(() => {
  console.log("Game started!");
});`,
  },
  {
    name: "level1.ts",
    lang: "typescript",
    icon: "TS",
    content: `import { Scene, Engine } from "excalibur";
import { Player } from "../player";

export class Level1 extends Scene {
  constructor(private player: Player) {
    super();
  }

  onInitialize(engine: Engine) {
    this.add(this.player);

    // TODO: add tilemap
    // TODO: add enemies
    // TODO: add collectibles
  }

  onActivate() {
    console.log("Level 1 activated");
  }
}`,
  },
  {
    name: "cards.json",
    lang: "json",
    icon: "{}",
    content: `{
  "deck": [
    {
      "id": "card_001",
      "name": "Flamestrike",
      "type": "attack",
      "cost": 2,
      "damage": 8,
      "description": "Deal 8 damage to all enemies.",
      "tags": ["fire", "aoe"]
    },
    {
      "id": "card_002",
      "name": "Iron Shield",
      "type": "defense",
      "cost": 1,
      "block": 12,
      "description": "Gain 12 block.",
      "tags": ["armor"]
    },
    {
      "id": "card_003",
      "name": "Arcane Surge",
      "type": "skill",
      "cost": 0,
      "description": "Draw 2 cards. Gain 1 energy.",
      "tags": ["draw", "energy"]
    }
  ]
}`,
  },
  {
    name: "outline.glsl",
    lang: "glsl",
    icon: "GL",
    content: `#version 300 es
precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform vec4 u_outlineColor;
uniform float u_outlineWidth;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec4 color = texture(u_texture, v_uv);
  vec2 texel = 1.0 / u_resolution;

  float alpha = color.a;
  float maxNeighbor = 0.0;

  for (float x = -u_outlineWidth; x <= u_outlineWidth; x++) {
    for (float y = -u_outlineWidth; y <= u_outlineWidth; y++) {
      vec2 offset = vec2(x, y) * texel;
      maxNeighbor = max(maxNeighbor,
        texture(u_texture, v_uv + offset).a);
    }
  }

  float outline = maxNeighbor - alpha;
  fragColor = mix(color, u_outlineColor, outline);
}`,
  },
];

// Minimal syntax token types
type TokenType = "keyword" | "string" | "number" | "comment" | "type" | "fn" | "punct" | "plain" | "key" | "bracket";

type Token = { type: TokenType; text: string };

// Very lightweight tokenizer — good enough for a mock
function tokenize(line: string, lang: string): Token[] {
  if (lang === "json") return tokenizeJson(line);
  if (lang === "glsl") return tokenizeLang(line, GLSL_KEYWORDS);
  return tokenizeLang(line, TS_KEYWORDS);
}

const TS_KEYWORDS = new Set([
  "import",
  "export",
  "from",
  "class",
  "extends",
  "new",
  "const",
  "let",
  "var",
  "return",
  "if",
  "else",
  "for",
  "while",
  "private",
  "public",
  "this",
  "super",
  "void",
  "string",
  "number",
  "boolean",
  "null",
  "undefined",
  "true",
  "false",
  "async",
  "await",
  "type",
  "interface",
  "implements",
]);

const GLSL_KEYWORDS = new Set([
  "void",
  "float",
  "vec2",
  "vec3",
  "vec4",
  "mat4",
  "uniform",
  "in",
  "out",
  "precision",
  "mediump",
  "highp",
  "lowp",
  "texture",
  "mix",
  "max",
  "min",
  "for",
  "if",
  "else",
  "return",
  "sampler2D",
  "main",
]);

function tokenizeLang(line: string, keywords: Set<string>): Token[] {
  const tokens: Token[] = [];
  // Single-line comment
  const commentIdx = line.indexOf("//");
  const code = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
  const comment = commentIdx >= 0 ? line.slice(commentIdx) : "";

  // Rough tokenizer: split on word boundaries and punctuation
  const regex = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\d+\.?\d*|[A-Za-z_$][\w$]*|[^\w\s]|\s+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(code)) !== null) {
    const text = match[0];
    if (!text) continue;
    if (/^\s+$/.test(text)) {
      tokens.push({ type: "plain", text });
      continue;
    }
    if (/^["'`]/.test(text)) {
      tokens.push({ type: "string", text });
      continue;
    }
    if (/^\d/.test(text)) {
      tokens.push({ type: "number", text });
      continue;
    }
    if (keywords.has(text)) {
      tokens.push({ type: "keyword", text });
      continue;
    }
    if (/^[(){}[\];,.]$/.test(text)) {
      tokens.push({ type: "punct", text });
      continue;
    }
    tokens.push({ type: "plain", text });
  }

  if (comment) tokens.push({ type: "comment", text: comment });
  return tokens;
}

function tokenizeJson(line: string): Token[] {
  const tokens: Token[] = [];
  const regex = /("(?:[^"\\]|\\.)*"|\d+\.?\d*|true|false|null|[{}\[\],:]|\s+)/g;
  let match: RegExpExecArray | null;
  let prevNonSpace = "";
  while ((match = regex.exec(line)) !== null) {
    const text = match[0];
    if (/^\s+$/.test(text)) {
      tokens.push({ type: "plain", text });
      continue;
    }
    if (text === "{" || text === "}" || text === "[" || text === "]") {
      tokens.push({ type: "bracket", text });
      prevNonSpace = text;
      continue;
    }
    if (text === "," || text === ":") {
      tokens.push({ type: "punct", text });
      prevNonSpace = text;
      continue;
    }
    if (/^"/.test(text)) {
      // key if followed by colon (heuristic: previous non-space was { or ,)
      const isKey = prevNonSpace === "{" || prevNonSpace === "," || prevNonSpace === "[";
      tokens.push({ type: isKey ? "key" : "string", text });
      prevNonSpace = text;
      continue;
    }
    if (/^\d/.test(text)) {
      tokens.push({ type: "number", text });
      prevNonSpace = text;
      continue;
    }
    if (text === "true" || text === "false" || text === "null") {
      tokens.push({ type: "keyword", text });
      prevNonSpace = text;
      continue;
    }
    tokens.push({ type: "plain", text });
    prevNonSpace = text;
  }
  return tokens;
}

const TOKEN_COLORS: Record<TokenType, string> = {
  keyword: "var(--editor-accent)",
  string: "#ce9178",
  number: "#b5cea8",
  comment: "#6a9955",
  type: "#4ec9b0",
  fn: "#dcdcaa",
  punct: "var(--editor-text3)",
  plain: "var(--editor-text)",
  key: "#9cdcfe",
  bracket: "#ffd700",
};

@customElement("mock-editor")
export class MockTextEditor extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: var(--editor-bg);
      color: var(--editor-text);
      font-family: "Cascadia Code", "Fira Code", "Consolas", monospace;
      font-size: 13px;
    }

    /* ── Tab bar ── */
    .tab-bar {
      display: flex;
      align-items: flex-end;
      background: var(--editor-bg3);
      border-bottom: 1px solid var(--editor-border);
      flex-shrink: 0;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .tab-bar::-webkit-scrollbar {
      display: none;
    }

    .tab {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 0 12px;
      height: 32px;
      cursor: pointer;
      border-right: 1px solid var(--editor-border);
      background: var(--editor-bg3);
      color: var(--editor-text2);
      white-space: nowrap;
      flex-shrink: 0;
      border-top: 2px solid transparent;
      user-select: none;
    }

    .tab:hover {
      background: var(--editor-bg2);
      color: var(--editor-text);
    }

    .tab.active {
      background: var(--editor-bg);
      color: var(--editor-text);
      border-top-color: var(--editor-accent);
    }

    .tab-icon {
      font-size: 10px;
      font-weight: bold;
      padding: 1px 3px;
      border-radius: 2px;
      background: var(--editor-surface2);
      color: var(--editor-text2);
    }

    .tab.active .tab-icon {
      background: var(--editor-accent);
      color: var(--editor-bg);
    }

    .tab-dirty {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--editor-accent);
      flex-shrink: 0;
    }

    /* ── Editor body ── */
    .editor-body {
      display: flex;
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    /* ── Gutter ── */
    .gutter {
      flex-shrink: 0;
      width: 48px;
      background: var(--editor-bg);
      border-right: 1px solid var(--editor-border);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding-top: 8px;
      user-select: none;
    }

    .line-num {
      height: 20px;
      line-height: 20px;
      text-align: right;
      padding-right: 10px;
      font-size: 12px;
      color: var(--editor-text3);
      flex-shrink: 0;
    }

    .line-num.active-line {
      color: var(--editor-text2);
    }

    /* ── Code area ── */
    .code-scroll {
      flex: 1;
      overflow: auto;
      padding: 8px 0 8px 12px;
      position: relative;
    }

    .code-lines {
      display: flex;
      flex-direction: column;
    }

    .code-line {
      height: 20px;
      line-height: 20px;
      white-space: pre;
      display: flex;
      align-items: center;
      cursor: text;
      padding-right: 32px;
    }

    .code-line:hover {
      background: rgba(255, 255, 255, 0.02);
    }
    .code-line.active-line {
      background: rgba(255, 255, 255, 0.04);
    }
    .code-line.selected-line {
      background: rgba(var(--editor-accent-rgb, 77, 166, 255), 0.12);
    }

    /* Fake cursor */
    .cursor {
      display: inline-block;
      width: 2px;
      height: 14px;
      background: var(--editor-accent);
      vertical-align: middle;
      margin-left: 1px;
      animation: blink 1.1s step-start infinite;
    }

    @keyframes blink {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0;
      }
    }

    /* ── Minimap ── */
    .minimap {
      flex-shrink: 0;
      width: 60px;
      background: var(--editor-bg3);
      border-left: 1px solid var(--editor-border);
      overflow: hidden;
      position: relative;
    }

    .minimap-lines {
      display: flex;
      flex-direction: column;
      padding: 4px 4px;
      gap: 1px;
    }

    .minimap-line {
      height: 2px;
      border-radius: 1px;
      background: var(--editor-surface2);
      opacity: 0.5;
    }

    .minimap-viewport {
      position: absolute;
      left: 0;
      right: 0;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      pointer-events: none;
    }

    /* ── Status bar (editor-local) ── */
    .editor-status {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 0 12px;
      height: 22px;
      background: var(--editor-bg3);
      border-top: 1px solid var(--editor-border);
      font-size: 11px;
      color: var(--editor-text3);
      flex-shrink: 0;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .status-item span {
      color: var(--editor-text2);
    }
  `;

  @property({ type: String }) activeFile: string = "player.ts";

  private _activeLine = 4;
  private _dirty = new Set<string>();

  private _currentFile(): EditorFile {
    return FILES.find(f => f.name === this.activeFile) ?? FILES[0];
  }

  private _lines(): string[] {
    return this._currentFile().content.split("\n");
  }

  private _switchFile(name: string) {
    this.activeFile = name;
    this._activeLine = 1;
    this.requestUpdate();
  }

  private _clickLine(i: number) {
    this._activeLine = i + 1;
    this.requestUpdate();
  }

  private _onKeyDown(e: KeyboardEvent) {
    const lines = this._lines();
    if (e.key === "ArrowDown") {
      this._activeLine = Math.min(lines.length, this._activeLine + 1);
      this.requestUpdate();
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      this._activeLine = Math.max(1, this._activeLine - 1);
      this.requestUpdate();
      e.preventDefault();
    } else if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
      // Mark dirty on any character input
      this._dirty.add(this.activeFile);
      this.requestUpdate();
    }
  }

  private _renderToken(token: Token, key: number) {
    const color = TOKEN_COLORS[token.type];
    return html`<span style="color:${color}" key=${key}>${token.text}</span>`;
  }

  private _renderLine(line: string, i: number, lang: string, activeLine: number) {
    const isActive = i + 1 === activeLine;
    const tokens = tokenize(line || " ", lang);
    const showCursor = isActive;

    return html`
      <div class="code-line ${isActive ? "active-line" : ""}" @click=${() => this._clickLine(i)}>
        ${tokens.map((t, ti) => this._renderToken(t, ti))} ${showCursor ? html`<span class="cursor"></span>` : ""}
      </div>
    `;
  }

  private _minimapLineWidth(line: string): number {
    return Math.min(100, Math.max(8, line.trimEnd().length * 1.2));
  }

  render() {
    const file = this._currentFile();
    const lines = this._lines();
    const totalLines = lines.length;
    const activeLine = this._activeLine;

    // Minimap viewport: show ~30% of lines
    const viewportTop = Math.max(0, (activeLine / totalLines) * 100 - 15);
    const viewportHeight = Math.min(30, (30 / totalLines) * 100);

    return html`
      <!-- Tab bar -->
      <div class="tab-bar" @keydown=${this._onKeyDown} tabindex="0">
        ${FILES.map(
          f => html`
            <div class="tab ${this.activeFile === f.name ? "active" : ""}" @click=${() => this._switchFile(f.name)}>
              <span class="tab-icon">${f.icon}</span>
              ${f.name} ${this._dirty.has(f.name) ? html`<span class="tab-dirty"></span>` : ""}
            </div>
          `,
        )}
      </div>

      <!-- Editor body -->
      <div class="editor-body" tabindex="0" @keydown=${this._onKeyDown}>
        <!-- Gutter -->
        <div class="gutter">
          ${lines.map((_, i) => html` <div class="line-num ${i + 1 === activeLine ? "active-line" : ""}">${i + 1}</div> `)}
        </div>

        <!-- Code -->
        <div class="code-scroll">
          <div class="code-lines">${lines.map((line, i) => this._renderLine(line, i, file.lang, activeLine))}</div>
        </div>

        <!-- Minimap -->
        <div class="minimap">
          <div class="minimap-lines">
            ${lines.map(line => html` <div class="minimap-line" style="width:${this._minimapLineWidth(line)}%"></div> `)}
          </div>
          <div class="minimap-viewport" style="top:${viewportTop}%; height:${viewportHeight}%"></div>
        </div>
      </div>

      <!-- Local status bar -->
      <div class="editor-status">
        <div class="status-item">Ln <span>${activeLine}</span>, Col <span>1</span></div>
        <div class="status-item">Lang <span>${file.lang}</span></div>
        <div class="status-item">Lines <span>${totalLines}</span></div>
        <div class="status-item" style="margin-left:auto">
          ${this._dirty.has(file.name) ? html`<span style="color:var(--editor-accent)">● unsaved</span>` : html`<span>saved</span>`}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "mock-editor": MockTextEditor;
  }
}
