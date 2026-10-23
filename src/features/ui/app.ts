import type { Department } from '../game/directory.ts';
import type { GameState } from '../game/rules.ts';
import type { Power } from './power.ts';

export type Panel = 'inbox' | 'runbook' | 'resume' | 'jobs' | 'directory' | 'intranet';

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
  /** The runbook, open at this two-page spread, while you're holding it. */
  book?: number;
  /** The desk lamp is switched off. */
  lampOff?: boolean;
  /** Sips taken from Sam's mug (it's empty after SIPS.length). */
  sips?: number;
  power: Power;
  /** When (performance.now()) you stepped away from the computer, to know if it has locked or gone to sleep. Cleared when you sit back down. */
  leftAt?: number;
  panel?: Panel;
  /** Tickets or chat, on the left of the help desk. */
  tab?: 'tickets' | 'chat';
  /** The ticket open on the right of the desk. */
  selected?: string;
  /** The chat open on the right, when you're on the chat tab. */
  chat?: string;
  /** Active Registry: the folder you're looking in (all of them when unset), the account picked, and the Reset Password box. */
  dirOu?: Department;
  dirUser?: string;
  dirReset?: { mustChange: boolean; unlock: boolean };
  /** Active Registry's last message, e.g. "The password for Dot has been changed." */
  dirSaid?: string;
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
