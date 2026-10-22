import type { DayScript, Job, Villager } from './types.ts';

export const COMPANY = 'Burrow & Co.';
export const MANAGER = 'Mr. Grisby';
export const DAYS = 5;
export const START_SAVINGS = 50;
export const DAILY_COST = 12;
export const GOAL_VOUCHER = 8;
export const MAX_PUSHES = 2;
/** How people feel about you, -3..3. Friends at 1 or above, nemeses at -1 or below. */
export const BOND = { clean: 1, messy: -1, storm: -2, min: -3, max: 3 } as const;
/** A fix with this many slips (missed reply-by times, wrong fixes) leaves a bad taste. */
export const MESSY_SLIPS = 2;
export const XP = { fix: 2, workaround: 1, note: 1 } as const;

/** The office clock, in minutes since midnight. */
export const OPEN = 9 * 60;
export const CLOSE = 17 * 60;
/** How fast the office clock runs: a full day takes about 10 real minutes. */
export const GAME_MINUTES_PER_SECOND = 0.8;
/** Minutes until someone expects a first reply. Walk-ups are standing right there. */
export const REPLY_WITHIN = { walkup: 15, chat: 45, high: 20, normal: 40, low: 90 } as const;
/** After you ask someone on chat to log a ticket, minutes until it lands in your queue. */
export const TICKET_LANDS_AFTER = 30;
/** "Can it wait?" on chat: they message you again this many minutes later. */
export const CHAT_LATER = 60;
/** After a reply, minutes until they expect the next update; after a missed one, minutes of grace. */
export const UPDATE_EVERY = 60;
export const GRACE_AFTER_MISS = 30;
/** Friends give you more time, nemeses less. */
export const PATIENCE = { friend: 1.5, neutral: 1, nemesis: 0.7 } as const;
/** Clock minutes each action takes. A fix is faster when your own note tells you what to do. */
export const COST = { update: 2, fix: 15, knownFix: 5, toolFix: 5, wrongFix: 15, workaround: 10, push: 2, note: 3, goOver: 5, askForTicket: 2 } as const;
/** The one morning in week 1 when something turns up on your desk. Loot is rare. */
export const DROP_DAY = 3;
export const REPLIES = {
  first: 'Thanks, we\u2019ve got your ticket and we\u2019re on it.',
  update: 'Quick update: still working on this. Thanks for your patience.',
  pending: 'We\u2019ll pick this up again tomorrow. Sorry for the wait.',
} as const;
/** A worked-around ticket comes back this many days later. */
export const WORKAROUND_RETURNS_AFTER = 2;

export const VILLAGERS = {
  dot: { opener: 'hiii are you free for a quick coffee?? \u2615', name: 'Dot', species: 'duck', ears: 'none', fur: '#f4f1e6', beak: '#f2a33a',
    fond: 'Oh thank goodness, it\u2019s you. You\u2019re the only one who listens.',
    grudge: 'Oh. It\u2019s YOU. I told everyone at lunch about last time.' },
  juniper: { opener: 'hey!! do you want to hang out for like 5 min', name: 'Juniper', species: 'rabbit', ears: 'long', fur: '#d9c2a7',
    fond: 'You saved me last time! Okay, deep breaths, I trust you.',
    grudge: 'Can I get someone else? No? Fine. FINE.' },
  marlo: { opener: 'Fancy a stroll? My desk. Now-ish.', name: 'Marlo', species: 'hedgehog', ears: 'round', fur: '#8a6a4f',
    fond: 'My favourite intern. Don\u2019t tell the others.',
    grudge: 'You again. I\u2019ve written a strongly worded memo about you. Unsent. For now.' },
  pip: { opener: 'ribbit. you around? want to see something cool', name: 'Pip', species: 'frog', ears: 'none', fur: '#7fbf6a',
    fond: 'Ribbit! I brought you a biscuit. Not Biscuit. A biscuit.',
    grudge: 'I remember what you did. Ribbit.' },
  biscuit: { opener: 'HI!! wanna grab a snack?? i have biscuits', name: 'Biscuit', species: 'dog', ears: 'floppy', fur: '#c98d52',
    fond: 'Hi hi hi! It\u2019s my friend! You\u2019re so good at this!',
    grudge: 'Oh. Hi. I\u2019m not wagging. You can\u2019t tell, but I\u2019m not.' },
  otis: { opener: 'Hoo. A moment of your time, young one?', name: 'Otis', species: 'owl', ears: 'pointy', fur: '#9c8670', beak: '#e7b84a',
    fond: 'Ah, the wise one. Hoo.',
    grudge: 'Hoo. Hoo do you think you are.' },
  grisby: { opener: 'Pop by my office. Social call. Bring your toolkit.', name: MANAGER, species: 'goose', ears: 'none', fur: '#e9e9e4', beak: '#e8762f',
    fond: 'Ah, my star intern. Unpaid star, but a star.',
    grudge: 'Make this quick. I have a meeting about you.' },
} satisfies Record<string, Villager>;
export type VillagerId = keyof typeof VILLAGERS;

export const DAY_SCRIPTS: DayScript[] = [
  {
    goal: 1,
    memo: 'Welcome aboard, intern! Resolve a ticket today and we can TALK about pay. No promises. Some promises. Mostly no.',
    metGoal: 'Not bad. Here, a lunch voucher. Pay? Let’s circle back.',
    missedGoal: 'Hmm. Interns who want to be paid usually close tickets.',
  },
  {
    goal: 2,
    memo: 'Day 2. Two tickets, and I need them done with more enthusiasm.',
    rule: 'Budget freeze: no new hardware. Not even a mouse.',
    metGoal: 'Great hustle. Lunch voucher. Pay is “in the pipeline”.',
    missedGoal: 'Disappointing. The pipeline is clogged now. That’s on you.',
  },
  {
    goal: 2,
    memo: 'Goal is 2 today. Also the other intern quit, so it\u2019s busier. I believe in you.',
    metGoal: 'Two! You’re practically staff. Practically. Voucher.',
    missedGoal: 'I told the board you’d do 3. Now I look silly. Honk.',
  },
  {
    goal: 2,
    memo: 'Day 4. Two tickets, minimum. Finance says pay is “not impossible”. Keep it up.',
    rule: 'Nobody gets admin rights. Nobody. Not even me. Especially not me.',
    metGoal: 'Done! Voucher. I’ll mention you in my review. Of myself.',
    missedGoal: 'Not ideal. Finance is now saying “impossible”.',
  },
  {
    goal: 3,
    memo: 'Last day of the week! 3 tickets and we’ll have The Conversation about pay.',
    metGoal: 'Three! Come see me after. About The Conversation.',
    missedGoal: 'Well. We’ll still have The Conversation. It’s shorter now.',
  },
];

export const JOBS: Job[] = [
  {
    id: 'library',
    title: 'Junior IT Support (paid!)',
    company: 'Meadow Library',
    blurb: 'Help patrons and staff with laptops, printers and Wi-Fi. Kind team, real salary, a window.',
    needs: { devices: 14, networks: 8 },
  },
  {
    id: 'ocean',
    title: 'IT Support Technician',
    company: 'Big Ocean Corp',
    blurb: 'Fast-paced team supporting 2,000 staff. Accounts, access and networking experience a must.',
    needs: { devices: 20, networks: 14, access: 12 },
  },
];


export { ISSUES, TICKETS } from './tickets.ts';
export { TOOLS } from './tools.ts';
