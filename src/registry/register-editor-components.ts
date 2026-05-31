// src/registry/register-editor-components.ts
import { componentRegistry } from "./component-registry";
// import "../panels/shader-lab-panel"; //example

componentRegistry.register({
  tag: "shader-lab-panel",
  factory: () => document.createElement("shader-lab-panel"),
  defaultProps: { mode: "fragment" },
  meta: {
    title: "ShaderLab",
    icon: "✨",
    category: "tool",
    description: "GLSL shader editor and preview",
  },
});
