import type { GameState } from '../game/rules.ts';

export type Panel = 'inbox' | 'runbook' | 'resume' | 'jobs';

/** Screen-only state that isn't worth saving. */
export interface Ui {
  booted: boolean;
  panel?: Panel;
  picked: string[];
}

export interface App {
  state: GameState;
  ui: Ui;
  hasSave: boolean;
  set(next: GameState): void;
  rerender(): void;
}
