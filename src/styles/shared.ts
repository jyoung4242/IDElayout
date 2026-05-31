import { unsafeCSS } from "lit";
import tokensStr from "./tokens.css?inline";

export const sharedStyles = unsafeCSS(tokensStr);
