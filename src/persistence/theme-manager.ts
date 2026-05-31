export type ThemeId = "dark" | "light" | "monokai";

export const THEMES: ThemeDefinition[] = [
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
  { id: "monokai", label: "Monokai" },
];

// And remove icon from the interface:
export interface ThemeDefinition {
  id: ThemeId;
  label: string;
}

class ThemeManager {
  private current: ThemeId = "dark";
  private readonly STORAGE_KEY = "excalibur-ide:theme";

  load() {
    const saved = localStorage.getItem(this.STORAGE_KEY) as ThemeId | null;
    const valid = THEMES.map(t => t.id);
    this.apply(saved && valid.includes(saved) ? saved : "dark");
  }

  apply(id: ThemeId) {
    this.current = id;
    document.documentElement.setAttribute("data-theme", id);
    localStorage.setItem(this.STORAGE_KEY, id);
    window.dispatchEvent(new CustomEvent("theme-change", { detail: id }));
  }

  get active(): ThemeId {
    return this.current;
  }
}

export const themeManager = new ThemeManager();
