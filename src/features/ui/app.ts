import type { Department } from '../game/directory.ts';
import type { GameState } from '../game/rules.ts';
import type { OktaPage } from './oktopus.ts';
import type { Power } from './power.ts';

/** The programs on the computer, each in its own window. */
export type AppId = 'desk' | 'chat' | 'directory' | 'okta' | 'browser' | 'mail' | 'runbook' | 'policy' | 'resume' | 'jobs' | 'trash';

/** An open window: where it is, and whether it's minimised to the taskbar or maximised. */
export interface Win {
  id: AppId;
  x: number;
  y: number;
  w: number;
  h: number;
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
  /** Already on screen: it slid in once and shouldn't slide in again on every redraw. */
  shown?: boolean;
}

/** Screen-only state that isn't worth saving. */
export interface Ui {
  /** Logged in at least once since the page loaded (decides whether login offers Continue or New game). */
  booted: boolean;
  /** Looking around the room, or sitting at the computer. */
  view: 'room' | 'computer';
  /** The day is over: the computer shuts down and the camera pulls back before the day's summary shows. */
  windingDown?: boolean;
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
  /** ServiceSoon: the list or incident form you're looking at, the form's tab, and the resolution you've picked. */
  snView?: 'list' | 'resolved' | 'form';
  snTab?: 'notes' | 'resolution';
  snCode?: 'fix' | 'workaround';
  /** The work note you're typing on a card, kept across redraws. */
  noteDraft?: string;
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
  /** Oktopus: the page you're on, and the person, app or identity check you've opened there. */
  oktaPage?: OktaPage;
  oktaUser?: string;
  oktaApp?: string;
  oktaVerify?: string;
  /** Burrow Chat: a channel you're reading, or a direct message (ui.chat) when unset. */
  channel?: 'general' | 'service-desk';
  /** The mail you're reading, by day (the newest when unset). */
  mailDay?: number;
  /** Ridge: open tabs (each with its own back/forward history), the one in front, and announcements you've liked. */
  tabs?: { history: string[]; at: number }[];
  tab?: number;
  liked?: string[];
  /** Burrow Hub: whose photo is open full size, over their profile. */
  viewing?: string;
  /** You emptied the Recycle Bin. Sam's files are gone for good. */
  trashEmptied?: boolean;
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
