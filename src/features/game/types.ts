import type { VillagerId } from './data.ts';

export type Skill = 'devices' | 'networks' | 'access';
export const SKILLS: readonly Skill[] = ['devices', 'networks', 'access'];

export type Ears = 'pointy' | 'round' | 'long' | 'floppy' | 'none';

export interface Villager {
  name: string;
  species: string;
  ears: Ears;
  fur: string;
  beak?: string;
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
}

/** Something you can see on the ticket: what's on their screen, a sticker, a cable. */
export interface Detail {
  label: string;
  text: string;
}

/** 'yours' means you rewrote the page with an internal note. */
export type PageStatus = 'ok' | 'outdated' | 'missing' | 'yours';

/**
 * Problems fixed in an admin console rather than by picking from a list. Active Directory: unlock, reset, disable.
 * Oktopus: setting Marketing up, giving them their app, and a joiner, mover, leaver and lost phone.
 */
export type ConsoleFix = 'unlock' | 'reset' | 'disable' | 'okta-setup' | 'okta-app' | 'joiner' | 'mover' | 'leaver' | 'mfa';

/** A kind of problem. Several tickets can be the same issue, which is what makes your notes useful. */
export interface Issue {
  id: string;
  /** The house rule (1-based, in POLICY) for how this kind of problem is handled. */
  rule: number;
  title: string;
  skill: Skill;
  /** The old runbook's page for this issue, as you first find it. */
  page: { status: Exclude<PageStatus, 'yours'>; text: string };
  fixes: Fix[];
  correctFix: string;
  /**
   * Fixed in Active Directory rather than by picking from the list: unlock the account, or reset the password.
   * The ticket checks the account itself when you ask them to try again.
   */
  console?: ConsoleFix;
  /** Internal-note choices after fixing. Exactly one is right. */
  notes: { text: string; right?: true }[];
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
  /** Choices for its runbook page after you first use it. Exactly one is right. */
  notes: { text: string; right?: true }[];
}
