import type { WorkspaceLayout } from "../types/layout";
import { layoutStorage, type SaveResult } from "./layout-storage";

export interface PersistenceOptions {
  backupIntervalMs?: number; // default 60_000 (1 min)
}

export type PersistenceEvent =
  | { type: "saved"; timestamp: number }
  | { type: "backed-up"; timestamp: number }
  | { type: "save-failed"; error: string }
  | { type: "imported"; layout: WorkspaceLayout }
  | { type: "cleared" };

type PersistenceListener = (event: PersistenceEvent) => void;

class PersistenceManager {
  private backupInterval?: ReturnType<typeof setInterval>;
  private listeners = new Set<PersistenceListener>();
  private currentLayout: WorkspaceLayout | null = null;
  private options: Required<PersistenceOptions> = {
    backupIntervalMs: 60_000,
  };

  init(layout: WorkspaceLayout, options?: PersistenceOptions) {
    this.currentLayout = layout;
    if (options) this.options = { ...this.options, ...options };
    this.startBackupTimer();
  }

  // Called by editor-app on every layout change so backup always has latest
  setLayout(layout: WorkspaceLayout) {
    this.currentLayout = layout;
  }

  // Explicit save — called by Ctrl+S or save button
  save(): SaveResult {
    if (!this.currentLayout) {
      return { ok: false, error: "No layout to save", timestamp: Date.now() };
    }
    const result = layoutStorage.save(this.currentLayout);
    this.emit(result.ok ? { type: "saved", timestamp: result.timestamp } : { type: "save-failed", error: result.error! });
    return result;
  }

  load() {
    return layoutStorage.load();
  }

  exportToFile(layout: WorkspaceLayout) {
    const json = layoutStorage.exportJSON(layout);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `excalibur-ide-layout-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importFromFile(): Promise<WorkspaceLayout> {
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return reject(new Error("No file selected"));
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const layout = layoutStorage.importJSON(reader.result as string);
            this.currentLayout = layout;
            this.emit({ type: "imported", layout });
            resolve(layout);
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = () => reject(new Error("File read failed"));
        reader.readAsText(file);
      };
      input.click();
    });
  }

  clearSaved() {
    layoutStorage.clear();
    this.emit({ type: "cleared" });
  }

  on(listener: PersistenceListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener); // returns unsubscribe fn
  }

  destroy() {
    this.stopBackupTimer();
    this.listeners.clear();
  }

  private startBackupTimer() {
    this.stopBackupTimer();
    this.backupInterval = setInterval(() => {
      if (!this.currentLayout) return;
      const result = layoutStorage.backup(this.currentLayout);
      if (result.ok) {
        this.emit({ type: "backed-up", timestamp: result.timestamp });
      }
    }, this.options.backupIntervalMs);
  }

  private stopBackupTimer() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = undefined;
    }
  }

  private emit(event: PersistenceEvent) {
    this.listeners.forEach(l => l(event));
  }
}

export const persistenceManager = new PersistenceManager();
