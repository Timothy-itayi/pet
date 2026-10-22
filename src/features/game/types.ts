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
  /** What they say when they arrive as your friend, or as your nemesis. */
  fond: string;
  grudge: string;
}

export type Relation = 'friend' | 'neutral' | 'nemesis';

/** One thing on the desk the player can compare: what they said, a screen, a sticker, a runbook page. */
export interface Clue {
  id: string;
  label: string;
  text: string;
  /** Hidden clues only land on the desk once a question reveals them. */
  hidden?: boolean;
}

export const MOODS = ['Calm', 'Annoyed', 'Upset', 'Furious'] as const;
/** Index into MOODS. Pushed past Furious, they storm off to the manager. */
export type Mood = 0 | 1 | 2 | 3;

export interface Question {
  id: string;
  ask: string;
  answer: string;
  reveals?: string;
  /** Useless or condescending questions make the mood worse. */
  annoys?: boolean;
}

export interface Fix {
  id: string;
  label: string;
  /** Shown when the player picks this fix and it's wrong. */
  fail?: string;
}

export interface Ticket {
  id: string;
  day: number;
  who: VillagerId;
  arrival: 'tray' | 'walkup';
  skill: Skill;
  title: string;
  mood: Mood;
  questions: Question[];
  clues: Clue[];
  /** The two clue ids that don't add up. Spotting them unlocks the fixes. */
  mismatch: [string, string];
  fixes: Fix[];
  correctFix: string;
  workaround: string;
  why: string;
  /** Runbook page this ticket repairs or finds when fixed. */
  runbookPage?: string;
}

export type PageStatus = 'ok' | 'outdated' | 'missing' | 'updated';

export interface RunbookPage {
  id: string;
  title: string;
  status: Exclude<PageStatus, 'updated'>;
  text: string;
  /** Corrected text, shown once the player has fixed or found the page. */
  updated: string;
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
