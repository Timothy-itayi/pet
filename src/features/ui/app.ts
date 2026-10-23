import type { Department } from '../game/directory.ts';
import type { GameState } from '../game/rules.ts';
import type { Power } from './power.ts';

/** The programs on the computer, each in its own window. */
export type AppId = 'desk' | 'chat' | 'directory' | 'browser' | 'mail' | 'runbook' | 'resume' | 'jobs' | 'trash';

/** An open window: where it is, and whether it's minimised to the taskbar or maximised. */
export interface Win {
  id: AppId;
  x: number;
  y: number;
  min?: boolean;
  max?: boolean;
}

/** A notification in the corner of the screen. Clicking it opens `app`, on `ticket` if there is one. */
export interface Toast {
  id: number;
  app: AppId;
  from: string;
  text: string;
  ticket?: string;
}

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
  /** The ticket open on the right of the desk. */
  selected?: string;
  /** The chat open on the right, when you're on the chat tab. */
  chat?: string;
  /** Active Directory: the folder you're looking in (all of them when unset), the account picked, and the Reset Password box. */
  dirOu?: Department;
  dirUser?: string;
  dirReset?: { mustChange: boolean; unlock: boolean };
  /** Active Directory's last message, e.g. "The password for Dot has been changed." */
  dirSaid?: string;
  /** Open windows, back to front. */
  windows: Win[];
  /** The Start menu is open. */
  startOpen?: boolean;
  /** Notifications showing in the corner, newest last. */
  toasts: Toast[];
  /** Burrow Chat: a channel you're reading, or a direct message (ui.chat) when unset. */
  channel?: 'general' | 'service-desk';
  /** The mail you're reading, by day (the newest when unset). */
  mailDay?: number;
  /** You emptied the Recycle Bin. Sam's files are gone for good. */
  trashEmptied?: boolean;
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
