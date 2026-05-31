// import { css } from "lit";
import { unsafeCSS } from "lit";
// Vite resolves this as a raw string at build time
import tailwindStr from "./theme.css?inline";

export const sharedStyles = unsafeCSS(tailwindStr);
