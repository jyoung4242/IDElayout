import "./styles/theme.css";
import { themeManager } from "./persistence/theme-manager";
import "./registry/register-mock-components";
import "./components/editor-app";

themeManager.load(); // ← apply persisted theme before first render
