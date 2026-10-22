import type { GameState } from '../game/rules.ts';

export type Panel = 'inbox' | 'runbook' | 'resume' | 'jobs';

/** Screen-only state that isn't worth saving. */
export interface Ui {
  booted: boolean;
  panel?: Panel;
  /** The ticket open on the right of the desk. */
  selected?: string;
  /** Player pause: stops the office clock. */
  paused: boolean;
}

export interface App {
  state: GameState;
  ui: Ui;
  hasSave: boolean;
  set(next: GameState): void;
  rerender(): void;
  /** Update clock and countdown text in place, without rebuilding the screen. */
  refreshTimes(): void;
}
