import { createContext } from "@lit/context";

export interface PlayState {
  running: boolean;
}

export const playStateContext = createContext<PlayState>(Symbol("play-state"));
