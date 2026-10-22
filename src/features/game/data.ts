import type { DayScript, Job, RunbookPage, Villager } from './types.ts';

export const COMPANY = 'Burrow & Co.';
export const MANAGER = 'Mr. Grisby';
export const DAYS = 5;
export const START_SAVINGS = 50;
export const DAILY_COST = 12;
export const GOAL_VOUCHER = 8;
export const MAX_PUSHES = 2;
/** How people feel about you, -3..3. Friends at 1 or above, nemeses at -1 or below. */
export const BOND = { clean: 1, messy: -1, storm: -2, min: -3, max: 3 } as const;
/** A fix with this many slips (annoying questions, wrong guesses, wrong fixes) leaves a bad taste. */
export const MESSY_SLIPS = 2;
export const XP = { fix: 2, workaround: 1 } as const;
/** A worked-around ticket comes back this many days later. */
export const WORKAROUND_RETURNS_AFTER = 2;

export const VILLAGERS = {
  dot: { name: 'Dot', species: 'duck', ears: 'none', fur: '#f4f1e6', beak: '#f2a33a',
    fond: 'Oh thank goodness, it\u2019s you. You\u2019re the only one who listens.',
    grudge: 'Oh. It\u2019s YOU. I told everyone at lunch about last time.' },
  juniper: { name: 'Juniper', species: 'rabbit', ears: 'long', fur: '#d9c2a7',
    fond: 'You saved me last time! Okay, deep breaths, I trust you.',
    grudge: 'Can I get someone else? No? Fine. FINE.' },
  marlo: { name: 'Marlo', species: 'hedgehog', ears: 'round', fur: '#8a6a4f',
    fond: 'My favourite intern. Don\u2019t tell the others.',
    grudge: 'You again. I\u2019ve written a strongly worded memo about you. Unsent. For now.' },
  pip: { name: 'Pip', species: 'frog', ears: 'none', fur: '#7fbf6a',
    fond: 'Ribbit! I brought you a biscuit. Not Biscuit. A biscuit.',
    grudge: 'I remember what you did. Ribbit.' },
  biscuit: { name: 'Biscuit', species: 'dog', ears: 'floppy', fur: '#c98d52',
    fond: 'Hi hi hi! It\u2019s my friend! You\u2019re so good at this!',
    grudge: 'Oh. Hi. I\u2019m not wagging. You can\u2019t tell, but I\u2019m not.' },
  otis: { name: 'Otis', species: 'owl', ears: 'pointy', fur: '#9c8670', beak: '#e7b84a',
    fond: 'Ah, the wise one. Hoo.',
    grudge: 'Hoo. Hoo do you think you are.' },
  grisby: { name: MANAGER, species: 'goose', ears: 'none', fur: '#e9e9e4', beak: '#e8762f',
    fond: 'Ah, my star intern. Unpaid star, but a star.',
    grudge: 'Make this quick. I have a meeting about you.' },
} satisfies Record<string, Villager>;
export type VillagerId = keyof typeof VILLAGERS;

export const DAY_SCRIPTS: DayScript[] = [
  {
    goal: 2,
    memo: 'Welcome aboard, intern! Close 2 tickets today and we can TALK about pay. No promises. Some promises. Mostly no.',
    metGoal: 'Not bad. Here, a lunch voucher. Pay? Let’s circle back.',
    missedGoal: 'Hmm. Interns who want to be paid usually close tickets.',
  },
  {
    goal: 2,
    memo: 'Day 2. Same goal, but I need it done with more enthusiasm.',
    rule: 'Budget freeze: no new hardware. Not even a mouse.',
    metGoal: 'Great hustle. Lunch voucher. Pay is “in the pipeline”.',
    missedGoal: 'Disappointing. The pipeline is clogged now. That’s on you.',
  },
  {
    goal: 3,
    memo: 'Goal is 3 today. The bar is raised because I believe in you. Also the other intern quit.',
    metGoal: 'Three! You’re practically staff. Practically. Voucher.',
    missedGoal: 'I told the board you’d do 3. Now I look silly. Honk.',
  },
  {
    goal: 3,
    memo: 'Day 4. Finance says pay is “not impossible”. Keep it up.',
    rule: 'Nobody gets admin rights. Nobody. Not even me. Especially not me.',
    metGoal: 'Solid. Voucher. I’ll mention you in my review. Of myself.',
    missedGoal: 'Not ideal. Finance is now saying “impossible”.',
  },
  {
    goal: 4,
    memo: 'Last day of the week! 4 tickets and we’ll have The Conversation about pay.',
    metGoal: 'Four! Come see me after. About The Conversation.',
    missedGoal: 'Well. We’ll still have The Conversation. It’s shorter now.',
  },
];

export const RUNBOOK: RunbookPage[] = [
  {
    id: 'slow-laptop',
    title: 'Laptop running slow',
    status: 'outdated',
    text: 'Request a new laptop from Purchasing. (Written 2009)',
    updated: 'Restart first, then install waiting updates. Most “slow” laptops just haven’t been restarted in weeks.',
  },
  {
    id: 'printer-driver',
    title: 'Adding a printer',
    status: 'outdated',
    text: 'Install the printer driver from the CD in the top drawer.',
    updated: 'Download the current driver from the printer maker’s website. New laptops have no disc drive.',
  },
  {
    id: 'default-printer',
    title: 'Prints going to the wrong printer',
    status: 'missing',
    text: '(This page has been torn out. Someone wrote “sorry” in the margin.)',
    updated: 'Check which printer is set as the default. Set it to the one nearest the person’s desk.',
  },
  {
    id: 'guest-wifi',
    title: 'Staff Wi-Fi vs guest Wi-Fi',
    status: 'ok',
    text: 'Staff devices use Burrow-Staff. Burrow-Guest only reaches the internet, never the shared drive or printers.',
    updated: 'Staff devices use Burrow-Staff. Burrow-Guest only reaches the internet, never the shared drive or printers.',
  },
  {
    id: 'admin-rights',
    title: 'Someone asks for admin rights',
    status: 'missing',
    text: '(Coffee stain. Unreadable.)',
    updated: 'Give people only the access they need. If an app is in the Company Portal, install it from there: no admin needed.',
  },
];

export const JOBS: Job[] = [
  {
    id: 'library',
    title: 'Junior IT Support (paid!)',
    company: 'Meadow Library',
    blurb: 'Help patrons and staff with laptops, printers and Wi-Fi. Kind team, real salary, a window.',
    needs: { devices: 8, networks: 4 },
  },
  {
    id: 'ocean',
    title: 'IT Support Technician',
    company: 'Big Ocean Corp',
    blurb: 'Fast-paced team supporting 2,000 staff. Accounts, access and networking experience a must.',
    needs: { devices: 12, networks: 8, access: 8 },
  },
];


export { TICKETS } from './tickets.ts';
