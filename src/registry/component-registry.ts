// src/registry/component-registry.ts
import type { PanelTabNode } from "../types/layout";

export interface ComponentDefinition {
  tag: string;
  factory: () => HTMLElement;
  defaultProps?: Record<string, unknown>;
  collapsible?: boolean;
  defaultCollapseToward?: "start" | "end";
  meta: ComponentMeta;
  alwaysVisible?: boolean;
}
export interface ComponentMeta {
  title: string;
  icon: string;
  category: ComponentCategory;
  description?: string;
}

export type ComponentCategory = "viewport" | "scene" | "inspector" | "asset" | "console" | "code" | "tool" | "mock";

class EditorComponentRegistry {
  private registry = new Map<string, ComponentDefinition>();

  register(def: ComponentDefinition): void {
    if (this.registry.has(def.tag)) {
      console.warn(`[Registry] "${def.tag}" is already registered — overwriting.`);
    }
    this.registry.set(def.tag, def);
  }

  resolve(tag: string): ComponentDefinition | undefined {
    const def = this.registry.get(tag);
    if (!def) {
      console.warn(`[Registry] No component registered for tag "${tag}".`);
    }
    return def;
  }

  create(tag: string, overrideProps?: Record<string, unknown>): HTMLElement | null {
    const def = this.resolve(tag);
    if (!def) return null;

    const el = def.factory();
    const props = { ...def.defaultProps, ...overrideProps };
    Object.assign(el, props);
    return el;
  }

  has(tag: string): boolean {
    return this.registry.has(tag);
  }

  all(): ComponentDefinition[] {
    return [...this.registry.values()];
  }

  byCategory(category: ComponentCategory): ComponentDefinition[] {
    return this.all().filter(def => def.meta.category === category);
  }

  // Builds a tab descriptor from a registered component —
  // useful for spawning new tabs programmatically
  toTabNode(tag: string, overrides?: Partial<PanelTabNode>): PanelTabNode | null {
    const def = this.resolve(tag);
    if (!def) return null;
    return {
      id: `${tag}-${Date.now()}`,
      title: def.meta.title,
      icon: def.meta.icon,
      componentTag: def.tag,
      componentProps: def.defaultProps,
      closable: true,
      ...overrides,
    };
  }
}

// Singleton export — import this anywhere
export const componentRegistry = new EditorComponentRegistry();
