import type { WorkspaceLayout } from "../types/layout";

const STORAGE_KEY = "excalibur-ide:layout";
const BACKUP_KEY = "excalibur-ide:layout-backup";

export interface SaveResult {
  ok: boolean;
  error?: string;
  timestamp: number;
}

export interface LoadResult {
  layout: WorkspaceLayout | null;
  source: "saved" | "backup" | "none";
  timestamp?: number;
  error?: string;
}

function validate(raw: unknown): raw is WorkspaceLayout {
  if (!raw || typeof raw !== "object") return false;
  const w = raw as Record<string, unknown>;
  return typeof w.version === "number" && !!w.root && typeof w.root === "object";
}

export const layoutStorage = {
  save(layout: WorkspaceLayout): SaveResult {
    const timestamp = Date.now();
    try {
      const serialized = JSON.stringify({ ...(layout as object), _savedAt: timestamp });
      localStorage.setItem(STORAGE_KEY, serialized);
      return { ok: true, timestamp };
    } catch (e) {
      const error = e instanceof Error ? e.message : "Unknown error";
      console.error("[Persistence] Save failed:", error);
      return { ok: false, error, timestamp };
    }
  },

  backup(layout: WorkspaceLayout): SaveResult {
    const timestamp = Date.now();
    try {
      const serialized = JSON.stringify({ ...(layout as object), _savedAt: timestamp });
      localStorage.setItem(BACKUP_KEY, serialized);
      return { ok: true, timestamp };
    } catch (e) {
      const error = e instanceof Error ? e.message : "Unknown error";
      console.error("[Persistence] Backup failed:", error);
      return { ok: false, error, timestamp };
    }
  },

  load(): LoadResult {
    // Try primary save first, fall back to backup
    for (const [key, source] of [
      [STORAGE_KEY, "saved"],
      [BACKUP_KEY, "backup"],
    ] as const) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (!validate(parsed)) {
          console.warn(`[Persistence] Invalid layout in "${key}", skipping.`);
          continue;
        }
        return {
          layout: parsed as WorkspaceLayout,
          source,
          timestamp: (parsed as unknown as Record<string, unknown>)["_savedAt"] as number | undefined,
        };
      } catch (e) {
        console.warn(`[Persistence] Could not parse "${key}":`, e);
      }
    }
    return { layout: null, source: "none" };
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(BACKUP_KEY);
  },

  exportJSON(layout: WorkspaceLayout): string {
    return JSON.stringify({ ...(layout as object), _exportedAt: Date.now() }, null, 2);
  },

  importJSON(json: string): WorkspaceLayout {
    const parsed = JSON.parse(json);
    if (!validate(parsed)) {
      throw new Error("Invalid layout file — missing version or root node.");
    }
    return parsed as WorkspaceLayout;
  },
};
