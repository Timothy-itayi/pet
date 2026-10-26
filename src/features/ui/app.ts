import type { Channel } from '../game/channels.ts';
import type { FlowRun } from '../game/flows.ts';
import type { Department } from '../game/directory.ts';
import type { GameState } from '../game/rules.ts';
import type { OktaPage } from './oktopus.ts';
import type { Power } from './power.ts';

/** The programs on the computer, each in its own window. */
export type AppId = 'desk' | 'chat' | 'directory' | 'okta' | 'browser' | 'mail' | 'runbook' | 'policy' | 'resume' | 'jobs' | 'trash';

/** An open window: where it is, and whether it's minimised to the taskbar or maximised. */
export type PhoneScreen = 'home' | 'passcode' | 'store' | 'settings' | 'verify' | 'verify-add' | 'scan';

export interface Win {
  id: AppId;
  x: number;
  y: number;
  w: number;
  h: number;
  min?: boolean;
  max?: boolean;
}

/** A notification in the corner of the screen. Clicking it opens `app`, on `ticket`, `channel` or the direct message from `dm` if there is one. */
export interface Toast {
  id: number;
  app: AppId;
  from: string;
  text: string;
  ticket?: string;
  channel?: Channel;
  dm?: string;
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
  shot: 'overview' | 'wall' | 'drawer';
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
  /** Paused (when, in real ms): the office clock stops until you resume. */
  paused?: number;
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
  /** Oktopus: why the last thing you tried wasn't done, if it wasn't. */
  oktaSaid?: string;
  oktaUser?: string;
  /** Oktopus Workflows: the flow open in the editor, an output picked to wire, where the card palette is open, the
   * last test run, whether wires show, a message about the last thing tried, and an input being typed into. */
  flowOpen?: string;
  flowPick?: { card: string; field: string };
  flowAdd?: number;
  flowTest?: FlowRun;
  flowMappings?: boolean;
  flowSaid?: string;
  flowTyping?: string;
  /** People opened (▸) into their fields, as card:output. */
  flowOpened?: string[];
  /** A flow you've asked to delete, waiting for "Are you sure?". */
  flowDeleting?: string;
  /** Sam's duck: which ticket it's talking about and how many times you've asked; issues it's piped up on itself. */
  duck?: { ticket: string; times: number };
  duckSpoke?: string[];
  /** Notebook suspects already stamped RULED OUT, so the stamp only thunks down once. */
  stamped?: string[];
  /** On the lesson card: you've chosen to put your notebook entry in your own words too. */
  ownWords?: boolean;
  /** The phone in your hand is held up to your face; which of its screens is open; what it said last; a passcode being typed. */
  phoneUp?: boolean;
  phoneScreen?: PhoneScreen;
  phoneSaid?: string;
  phoneCode?: string;
  /** You said no to your own sign-in push; Oktopus waits until you ask it to send another. */
  pushDenied?: boolean;
  /** Oktopus Admin: whose Oktopus Verify enrolment QR code is on the screen. */
  oktaEnrol?: string;
  /** How far the flow canvas is scrolled sideways, and a card just added to scroll to. */
  flowScrollX?: number;
  flowScrollTo?: number;
  oktaApp?: string;
  oktaVerify?: string;
  /** Burrow Chat: a channel you're reading, or a direct message (ui.ping from a colleague, ui.chat about a ticket) when unset. */
  channel?: Channel;
  ping?: string;
  /** When (stampOf) you last looked at each channel or direct message, for the unread counts. */
  seen?: Record<string, number>;
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
