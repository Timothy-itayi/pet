import type { VillagerId } from './data.ts';
import type { Department } from './directory.ts';
import type { FlowTask } from './flows.ts';

export type Skill = 'devices' | 'networks' | 'access';
export const SKILLS: readonly Skill[] = ['devices', 'networks', 'access'];

export interface Villager {
  name: string;
  /** How they start a chat when they want something fixed but don't want to log a ticket. */
  opener: string;
  /** What they say when they arrive as your friend, or as your nemesis. */
  fond: string;
  grudge: string;
}

export type Relation = 'friend' | 'neutral' | 'nemesis';

export const MOODS = ['Calm', 'Annoyed', 'Upset', 'Furious'] as const;
/** Index into MOODS. Pushed past Furious, they storm off to the manager. */
export type Mood = 0 | 1 | 2 | 3;

export type Priority = 'low' | 'normal' | 'high';

export const AREAS = ['Kitchen', 'Meeting room', 'Finance corner', 'Open office'] as const;
export type Area = (typeof AREAS)[number];

export interface Fix {
  /** Too serious to keep quiet: whoever it was for goes to Mr. Grisby about it. */
  grave?: true;
  id: string;
  label: string;
  /** Shown when the player picks this fix and it's wrong. */
  fail?: string;
  /** A sensible step to try first that just wasn't the cause this time: what they say after trying it. No harm done. */
  ruledOut?: string;
  /** What they say when it works, if not the usual thanks. */
  works?: string;
  /** In the notebook, what this fix would mean is wrong, in plain words ("Airplane mode is on"). The label if not given. */
  suspect?: string;
  /** How much it costs to test: 1 a quick check, 2 a bit of effort, 3 drastic. Sam tested the simplest first. */
  effort?: 1 | 2 | 3;
}

/** A work note the player types, which becomes a runbook page. It counts if it says what was really wrong. */
export interface Note {
  /** A good note: what the page says if yours wasn't saved (an older save). */
  example: string;
  /** Words that show you know what was really wrong, matched from the start of a word. A note needs one. */
  keys: string[];
}

/** A question you can ask the caller while troubleshooting. */
export interface Ask {
  id: string;
  text: string;
  /** Their answer when this ticket has nothing to say about it. */
  none: string;
  /** Which of Sam's steps it is: gathering context ("what changed?"), or isolating ("one person or everyone?"). */
  step?: 'context' | 'isolate';
  /** The suspects (fix ids) this question's answer rules out, usually. Never the ticket's real cause. */
  rulesOut?: string[];
}

/** Something you can see on the ticket: what's on their screen, a sticker, a cable. */
export interface Detail {
  label: string;
  text: string;
  /** The question that gets the caller to tell you this. Without one, IT can see it already (HR, the portal, a log). */
  ask?: string;
}

/** 'yours' means you rewrote the page with an internal note. */
export type PageStatus = 'ok' | 'outdated' | 'missing' | 'yours';

/**
 * Problems fixed in an admin console rather than by picking from a list. Active Directory: unlock, reset, disable.
 * Oktopus: setting Marketing up, giving them their app, and a joiner, mover, leaver and lost phone.
 */
export type ConsoleFix = 'unlock' | 'reset' | 'disable' | 'okta-setup' | 'okta-app' | 'joiner' | 'mover' | 'leaver' | 'mfa' | 'mfa-policy' | 'flow' | 'verify' | 'replace';

/** A kind of problem. Several tickets can be the same issue, which is what makes your notes useful. */
export interface Issue {
  id: string;
  /** The house rule (1-based, in POLICY) for how this kind of problem is handled. */
  rule: number;
  title: string;
  skill: Skill;
  /** The old runbook's page for this issue, as you first find it. */
  page: { status: Exclude<PageStatus, 'yours'>; text: string };
  /** Questions that find out what's really going on. */
  asks: Ask[];
  fixes: Fix[];
  /** The usual fix. A ticket can have a different real cause: see Ticket.fixedBy. */
  correctFix: string;
  /**
   * Fixed in Active Directory rather than by picking from the list: unlock the account, or reset the password.
   * The ticket checks the account itself when you ask them to try again.
   */
  console?: ConsoleFix;
  /** The work note you type after fixing it. */
  note: Note;
  why: string;
}

export interface Ticket {
  id: string;
  day: number;
  /** Arrival time on the office clock, e.g. '9:10'. */
  at: string;
  who: VillagerId;
  /** 'floor' means they catch you in the office with no ticket; you only see them if you walk the floor. */
  via: 'tray' | 'walkup' | 'floor';
  /** Where in the office the problem is: where a floor request waits, or where a walk-up leads you. */
  where?: Area;
  priority: Priority;
  issue: string;
  title: string;
  message: string;
  details: Detail[];
  workaround: string;
  mood: Mood;
  /** When this one's cause isn't the usual one: the suggestion that actually fixes it. */
  fixedBy?: string;
  /** Oktopus tickets: who's joining, moving or leaving (by login). */
  subject?: string;
  /** Accounts that should be switched off in Active Directory (by login). Sam's, unless it says otherwise. */
  subjects?: string[];
  /** Oktopus tickets: the departments to set up, or that should have the app. */
  team?: Department[];
  /** Oktopus tickets: the app from the catalog. */
  app?: string;
  /** Workflows tickets: what the flow should do (an HR change, the leaver sweep, the report). */
  flow?: FlowTask;
  /** A leaver flow that also switches them off in Active Directory, not just Oktopus. */
  everywhere?: true;
  /** From week 3, joiners, movers and leavers should be handled by a flow, not by hand. */
  automate?: true;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  blurb: string;
  needs: Partial<Record<Skill, number>>;
}

export interface DayScript {
  goal: number;
  memo: string;
  rule?: string;
  metGoal: string;
  missedGoal: string;
}

/**
 * Loot: something left on your desk that gives you a faster fix for one kind of problem.
 * It isn't in the runbook: after you first use it, you write its page.
 */
export interface Tool {
  id: string;
  /** Who leaves it. 'sam' means it was in Sam's bottom drawer: what you get with no friends. */
  from: VillagerId | 'sam';
  name: string;
  /** The note it comes with, read on your desk the morning it arrives. */
  gift: string;
  issue: string;
  fixLabel: string;
  /** Its runbook page, which you type after you first use it. */
  note: Note;
}
