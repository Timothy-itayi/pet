import type { GameState } from '../game/rules.ts';
import type { Power } from './power.ts';

export type Panel = 'inbox' | 'runbook' | 'resume' | 'jobs';

/** Screen-only state that isn't worth saving. */
export interface Ui {
  /** Logged in at least once since the page loaded (decides whether login offers Continue or New game). */
  booted: boolean;
  /** Looking around the room, or sitting at the computer. */
  view: 'room' | 'computer';
  /** The camera is gliding into the computer screen. */
  flying?: boolean;
  /** Which part of the room you're looking at. */
  shot: 'overview' | 'wall';
  /** A one-off message in the room's caption, e.g. after clicking the dark screen. */
  note?: string;
  /** An item you've picked up to look at. */
  inspecting?: string;
  power: Power;
  /** Office clock when you last stepped away from the computer, to know if it went to sleep. */
  leftAt?: number;
  panel?: Panel;
  /** Tickets or chat, on the left of the help desk. */
  tab?: 'tickets' | 'chat';
  /** The ticket open on the right of the desk. */
  selected?: string;
  /** The chat open on the right, when you're on the chat tab. */
  chat?: string;
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
