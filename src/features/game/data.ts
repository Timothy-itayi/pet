import type { DayScript, Job, Villager } from './types.ts';

export const COMPANY = 'Burrow & Co.';
export const MANAGER = 'Mr. Grisby';
/** Working weeks so far: Sam's old system, Oktopus for Marketing, then Oktopus for everyone. */
export const DAYS = 15;
/** Enough for a few weeks of bus fare and food, if most days go well: meeting the goal pays for the day. */
export const START_SAVINGS = 80;
export const DAILY_COST = 12;
/** A met goal's lunch voucher covers the day's bus fare and food; a missed one costs you. */
export const GOAL_VOUCHER = 12;
export const MAX_PUSHES = 2;
/** How people feel about you, -3..3. Friends at 1 or above, nemeses at -1 or below. */
export const BOND = { clean: 1, messy: -1, complaint: -2, min: -3, max: 3 } as const;
/** A fix that took this many failed attempts leaves a bad taste. */
export const MESSY_SLIPS = 2;
export const XP = { fix: 2, workaround: 1, note: 1 } as const;

/** The office clock, in minutes since midnight. */
export const OPEN = 9 * 60;
export const CLOSE = 17 * 60;
/** Half an hour before closing, a heads-up that the day is nearly over. */
export const CLOSING_SOON = CLOSE - 30;
/** After 5pm nothing new comes in, but you can stay late to finish up, unpaid, until the building locks. */
export const LOCKUP = 18 * 60;
/** How fast the office clock runs: a full day takes about 10 real minutes. */
export const GAME_MINUTES_PER_SECOND = 0.8;
/** After you ask someone on chat to log a ticket, minutes until it lands in your queue. */
export const TICKET_LANDS_AFTER = 30;
/** Clock minutes each action takes. A fix is faster when your own note tells you what to do. */
export const COST = { update: 2, ask: 2, suggest: 2, resolve: 3, workaround: 10, push: 2, note: 3, askForTicket: 2, unlock: 1, reset: 3 } as const;
/**
 * Office minutes the caller takes, from-to: to answer a question, and to try what you suggested (quicker with a
 * tool of yours). Meanwhile you can work on other tickets.
 */
export const CALLER = {
  low: { answer: [2, 5], tryIt: [5, 10], tool: [2, 3] },
  normal: { answer: [2, 5], tryIt: [5, 10], tool: [2, 3] },
  // It's urgent for them too, so they're quick to get back to you.
  high: { answer: [1, 2], tryIt: [3, 5], tool: [1, 2] },
} as const;
/** What they say when your suggestion works, by mood. */
export const THANKS = ['That\u2019s got it! Thank you!', 'It works now. Thanks.', 'Finally. It works.', 'It works. Don\u2019t expect a thank-you.'] as const;
/** The one morning in week 1 when something turns up on your desk. Loot is rare. */
export const DROP_DAY = 3;
export const REPLIES = {
  first: 'Thanks, we\u2019ve got your ticket and we\u2019re on it.',
  update: 'Quick update: still working on this. Thanks for your patience.',
  pending: 'We\u2019ll pick this up again tomorrow. Sorry for the wait.',
} as const;
/**
 * The IT Service Policy: how every kind of problem is handled. You're the only IT there is, so you work with
 * what the company has.
 */
export const POLICY = [
  'Every request is a ticket. If someone asks on chat, ask them to log one: that\u2019s how it gets fixed and counted.',
  'Reply first, then keep people updated. Nobody gets turned away: it waits until it\u2019s fixed.',
  'Accounts and passwords: check it\u2019s really them against HR, then fix it in Active Directory or Oktopus. IT never sets, reads out or learns anyone\u2019s password.',
  'Hardware: use what we have. Spares cupboard, batteries, the hot-desk PC. Budget freeze: no new hardware.',
  'Software: install from the Company Portal. Nobody gets admin rights.',
  'Joiners, movers and leavers: HR is the source of truth. Apps go to groups, never to people one by one.',
  'Security: report anything odd. Never reset sign-in for a request from outside the company.',
] as const;

/** A worked-around ticket comes back this many days later. */
export const WORKAROUND_RETURNS_AFTER = 2;

export const VILLAGERS = {
  dot: { opener: 'hiii are you free for a quick coffee?? \u2615', name: 'Dot',
    fond: 'Oh thank goodness, it\u2019s you. You\u2019re the only one who listens.',
    grudge: 'Oh. It\u2019s YOU. I told everyone at lunch about last time.' },
  juniper: { opener: 'hey!! do you want to hang out for like 5 min', name: 'Juniper',
    fond: 'You saved me last time! Okay, deep breaths, I trust you.',
    grudge: 'Can I get someone else? No? Fine. FINE.' },
  marlo: { opener: 'Fancy a stroll? My desk. Now-ish.', name: 'Marlo',
    fond: 'My favourite intern. Don\u2019t tell the others.',
    grudge: 'You again. I\u2019ve written a strongly worded memo about you. Unsent. For now.' },
  pip: { opener: 'ribbit. you around? want to see something cool', name: 'Pip',
    fond: 'Ribbit! I brought you a biscuit. Not Biscuit. A biscuit.',
    grudge: 'I remember what you did. Ribbit.' },
  biscuit: { opener: 'HI!! wanna grab a snack?? i have biscuits', name: 'Biscuit',
    fond: 'Hi hi hi! It\u2019s my friend! You\u2019re so good at this!',
    grudge: 'Oh. Hi. I\u2019m not wagging. You can\u2019t tell, but I\u2019m not.' },
  otis: { opener: 'Hoo. A moment of your time, young one?', name: 'Otis',
    fond: 'Ah, the wise one. Hoo.',
    grudge: 'Hoo. Hoo do you think you are.' },
  grisby: { opener: 'Pop by my office. Social call. Bring your toolkit.', name: MANAGER,
    fond: 'Ah, my star intern. Unpaid star, but a star.',
    grudge: 'Make this quick. I have a meeting about you.' },
} satisfies Record<string, Villager>;
export type VillagerId = keyof typeof VILLAGERS;

export const DAY_SCRIPTS: DayScript[] = [
  {
    goal: 2,
    memo: 'Welcome aboard, intern! Resolve two tickets today and we can TALK about pay. No promises. Some promises. Mostly no.',
    metGoal: 'Not bad. Here, a lunch voucher. Pay? Let’s circle back.',
    missedGoal: 'Hmm. Interns who want to be paid usually close tickets.',
  },
  {
    goal: 3,
    memo: 'Day 2. Three tickets, and I need them done with more enthusiasm.',
    rule: 'Budget freeze: no new hardware. Not even a mouse.',
    metGoal: 'Great hustle. Lunch voucher. Pay is “in the pipeline”.',
    missedGoal: 'Disappointing. The pipeline is clogged now. That’s on you.',
  },
  {
    goal: 4,
    memo: 'Goal is 4 today. Also the other intern quit, so it\u2019s busier. I believe in you.',
    metGoal: 'Four! You’re practically staff. Practically. Voucher.',
    missedGoal: 'I told the board you’d do 5. Now I look silly. Honk.',
  },
  {
    goal: 5,
    memo: 'Day 4. Five tickets, minimum. Finance says pay is “not impossible”. Keep it up.',
    rule: 'Nobody gets admin rights. Nobody. Not even me. Especially not me.',
    metGoal: 'Done! Voucher. I’ll mention you in my review. Of myself.',
    missedGoal: 'Not ideal. Finance is now saying “impossible”.',
  },
  {
    goal: 6,
    memo: 'Last day of the week! 6 tickets. The Conversation about pay is next Friday. The board insists. I insist less.',
    metGoal: 'Six! Next Friday, The Conversation. I’ve pencilled it in. In pencil.',
    missedGoal: 'Hmm. The Conversation is still next Friday. I’ve rubbed some of it out.',
  },
  {
    goal: 4,
    memo: 'Week 2! The investors want Oktopus for Marketing, starting TODAY. Sign-on, apps, all of it. Four tickets, and get Marketing on it.',
    rule: 'Apps go to groups, not to people. The Oktopus salesman was very firm.',
    metGoal: 'Marketing are on Oktopus! The investors are thrilled. I took the credit. Voucher.',
    missedGoal: 'The investors asked how Oktopus is going. I said “great”. Make it great.',
  },
  {
    goal: 4,
    memo: 'We have a new starter in Marketing! HR has done their bit. Your bit is everything else. Four tickets.',
    metGoal: 'Fern says her first day was “seamless”. I don’t know what that means but I like it. Voucher.',
    missedGoal: 'Fern spent her first day sharpening pencils. We don’t have pencils.',
  },
  {
    goal: 5,
    memo: 'Basil has moved to Sales. Do whatever IT does when people move. Five tickets.',
    rule: 'People who move teams keep their account. They lose their old team’s things.',
    metGoal: 'Marlo says Basil is selling things already. Voucher.',
    missedGoal: 'Marketing say Basil is still posting on their socials. From Sales.',
  },
  {
    goal: 5,
    memo: 'Sad news: Wren has left us. Also, the auditors are in. Five tickets, and nothing embarrassing please.',
    metGoal: 'The auditors left smiling. Auditors never smile. Voucher.',
    missedGoal: 'The auditors wrote a lot of things down. Some of them were about you.',
  },
  {
    goal: 6,
    memo: 'Friday! 6 tickets, and then: The Conversation. I mean it this time.',
    metGoal: 'Six! About The Conversation: the investors want everyone on Oktopus first. Next Friday. Definitely. Voucher.',
    missedGoal: 'The Conversation is postponed. The investors want everyone on Oktopus first. Next Friday. Probably.',
  },
  {
    goal: 5,
    memo: 'Week 3! The investors want EVERYONE on Oktopus. Today. Five tickets, and the whole company.',
    rule: 'Every department gets its own group. Apps go to departments, never to people.',
    metGoal: 'The whole company on one sign-in! I told the board I did it. Voucher.',
    missedGoal: 'Half the company still has seventeen passwords. One of them is mine.',
  },
  {
    goal: 5,
    memo: 'Finance want Voyago. I want something too, but I’ll tell you in person. Five tickets.',
    rule: 'Least privilege applies to everyone. Even me. Apparently.',
    metGoal: 'Finance are expensing things already. Too many things. Voucher.',
    missedGoal: 'Finance are doing expenses on paper. The paper is also an expense.',
  },
  {
    goal: 6,
    memo: 'A new starter in Finance, and the designers want their toys. Six tickets.',
    metGoal: 'Hazel says Burrow is “very organised”. She hasn’t seen my desk. Voucher.',
    missedGoal: 'Hazel spent the morning with a calculator and no login. She was very polite about it.',
  },
  {
    goal: 6,
    memo: 'Pip is moving to Finance. Do the IT thing. Six tickets.',
    metGoal: 'Pip counted all of Finance’s staplers before lunch. Voucher.',
    missedGoal: 'Pip still thinks they work in Operations. So does Oktopus.',
  },
  {
    goal: 6,
    memo: 'Friday. Hazel has left us already. Six tickets, and then: The Conversation. In my office. I have biscuits.',
    metGoal: 'Six! Come in. Sit down. Let’s have The Conversation.',
    missedGoal: 'We can still have The Conversation. It will be brief. Like Hazel.',
  },
];

export const JOBS: Job[] = [
  {
    id: 'library',
    title: 'Junior IT Support (paid!)',
    company: 'Meadow Library',
    blurb: 'Help patrons and staff with laptops, printers and Wi-Fi. Kind team, real salary, a window.',
    needs: { devices: 36, networks: 14 },
  },
  {
    id: 'ocean',
    title: 'IT Support Technician',
    company: 'Big Ocean Corp',
    blurb: 'Fast-paced team supporting 2,000 staff. Accounts, access and networking experience a must.',
    needs: { devices: 84, networks: 36, access: 90 },
  },
];


export { ISSUES, TICKETS } from './tickets.ts';
export { TOOLS } from './tools.ts';
