import type { DayScript, Job, Villager } from './types.ts';

export const COMPANY = 'Burrow & Co.';
export const MANAGER = 'Mr. Grisby';
/** Five working weeks: Sam's old system, Oktopus for Marketing, Oktopus for everyone, security week, the new floor. */
export const DAYS = 25;
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

/**
 * The budget, as the hardware rule sees it: frozen at first; open from day 16, when the auditors free some up for
 * phones (new hardware needs Mr. Grisby's approval); frozen again from day 24, once the new floor and the investors'
 * visit have spent it.
 */
export const BUDGET = { opens: 16, freezes: 24 } as const;
const HARDWARE = {
  frozen: 'Hardware: use what we have. Spares cupboard, batteries, the hot-desk PC. Budget freeze: no new hardware.',
  open: 'Hardware: use what we have first. New or replacement company hardware needs Mr. Grisby\u2019s approval before it\u2019s ordered.',
  refrozen: 'Hardware: use what we have. Spares, the drawer of phones, the hot-desk PC. Budget freeze (again): no new hardware, approved or not.',
} as const;
export const budgetOn = (day: number) => (day >= BUDGET.freezes ? 'refrozen' : day >= BUDGET.opens ? 'open' : 'frozen');

/** The house rules as they stand on a day: the hardware one follows the budget. */
export const policyOn = (day: number): string[] => POLICY.map((rule, i) => (i === 3 ? HARDWARE[budgetOn(day)] : rule));

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
  pip: { opener: 'you around? want to see something cool', name: 'Pip',
    fond: 'Finally! I brought you a biscuit. Not Biscuit. A biscuit.',
    grudge: 'I remember what you did.' },
  biscuit: { opener: 'HI!! wanna grab a snack?? i have biscuits', name: 'Biscuit',
    fond: 'Hi hi hi! It\u2019s my friend! You\u2019re so good at this!',
    grudge: 'Oh. Hi. I\u2019m not smiling. You can\u2019t tell, but I\u2019m not.' },
  otis: { opener: 'A moment of your time, young one?', name: 'Otis',
    fond: 'Ah, the wise one.',
    grudge: 'Who do you think you are.' },
  grisby: { opener: 'Pop by my office. Social call. Bring your toolkit.', name: MANAGER,
    fond: 'Ah, my star intern. Unpaid star, but a star.',
    grudge: 'Make this quick. I have a meeting about you.' },
  clover: { opener: 'Got a minute? Two, if you count the walk. I’ll count it.', name: 'Clover',
    fond: 'You again. Good. You’ve never moved my label printer. Counted.',
    grudge: 'I’ve put you on the clipboard. Under “incidents”. Counted.' },
  moss: { opener: 'hm hm hmmm. you about, chief? got a minute between drops', name: 'Moss',
    fond: 'Chief! Hm hm hmmm. Brought you a coffee from the garage. It’s been in the van a bit.',
    grudge: 'Chief. Hm. No humming today. You know why.' },
  tansy: { opener: 'Quick one before my next call. Free? Let’s close this.', name: 'Tansy',
    fond: 'My favourite person in IT! Which, I know, is a small field. Deal?',
    grudge: 'I’ve got a call in five, so I’ll be brief: you owe me one. Shake on it? No? Fine.' },
  hector: { opener: 'Excuse me. Are you free? I would like to say something. Verbally first, then in writing.', name: 'Hector',
    fond: 'Oh, it’s you. Good. Thank you for last time. I wrote it down.',
    grudge: 'I have noted what happened. In writing. With the time.' },
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
    missedGoal: 'I told the board you’d do 5. Now I look silly.',
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
    missedGoal: 'Not many tickets closed today. Hazel asked if IT is always this quiet. I said yes.',
  },
  {
    goal: 6,
    memo: 'Pip is moving to Finance. Do the IT thing. Six tickets.',
    metGoal: 'Pip counted all of Finance’s staplers before lunch. Voucher.',
    missedGoal: 'Pip moved teams and counted every stapler in Finance. Pip closed more today than you did.',
  },
  {
    goal: 6,
    memo: 'Friday. Hazel has left us already. Six tickets, and then: The Conversation. In my office. I have biscuits.',
    metGoal: 'Six! Ah. The auditors arrive Monday. The Conversation will have to wait one more week. I ate the biscuits. Voucher.',
    missedGoal: 'The auditors arrive Monday, so The Conversation waits a week. Which, frankly, is lucky for you.',
  },
  {
    goal: 5,
    memo: 'The auditors’ report is in. It has findings. Plural. Five tickets, and make the findings go away.',
    rule: 'Leavers are switched off everywhere on their last day. Every system. Every time.',
    metGoal: 'Finding 1: closed. The auditors nodded. Voucher.',
    missedGoal: 'The auditors asked who Sam is and why Sam signed in on Saturday. I said “IT”.',
  },
  {
    goal: 5,
    memo: 'The auditors want everyone signing in with their phones. Including me. I have a phone. Somewhere. Five tickets.',
    rule: 'Policies go on groups, not people. Just like apps.',
    metGoal: 'Everyone has a phone sign-in! Mine works! I signed in four times to check. Voucher.',
    missedGoal: 'The auditors tried my password. It worked. They wrote that down.',
  },
  {
    goal: 6,
    memo: 'People keep finding things in the car park and clicking things in emails. Six tickets. Stop them.',
    metGoal: 'Nobody plugged anything in that they found on the floor. Low bar. Cleared. Voucher.',
    missedGoal: 'I have had a very long talk about USB sticks. Mostly with myself.',
  },
  {
    goal: 6,
    memo: 'Someone pretending to be me tried to get money out of Finance. I would never ask quietly. Six tickets.',
    rule: 'Urgent and secret is how a scam sounds. Check in person.',
    metGoal: 'Dot didn’t pay the fake me. The real me is very grateful. Voucher.',
    missedGoal: 'Finance are now suspicious of every email I send. That’s new. I don’t hate it.',
  },
  {
    goal: 6,
    memo: 'The auditors leave today. Six tickets, and then The Conversation. Truly. I’ve cleared my diary. It was already clear.',
    metGoal: 'Six! The auditors left smiling. The investors, however, have bought us a second floor. The Conversation can wait one more week. On the new floor. Voucher.',
    missedGoal: 'The investors have bought us a whole new floor, so The Conversation moves upstairs. Next Friday. It has a view now.',
  },
  {
    goal: 5,
    memo: 'A NEW FLOOR! Everyone moves up today. Five tickets, and make the internet come too.',
    rule: 'The budget is back, a bit. Spares are fine. Shops are not.',
    metGoal: 'Everyone upstairs is online! I can hear Sales from here. Voucher.',
    missedGoal: 'Half of Sales is upstairs with no internet, shouting at clouds.',
  },
  {
    goal: 5,
    memo: 'A new starter in Sales: Rowan. Desk by the window. Five tickets.',
    metGoal: 'Rowan signed in, got Canvass, and got asked for their phone. Seamless. I’ve learnt that word. Voucher.',
    missedGoal: 'Rowan spent the morning selling things with a pen and paper. Rowan is very good at it, which is worse.',
  },
  {
    goal: 6,
    memo: 'The investors visit today to see the new floor. Give them Wi-Fi. Six tickets.',
    rule: 'Visitors get the guest network. Even investors. Especially investors.',
    metGoal: 'The investors saw the new floor and the slides worked. They want a THIRD floor. Voucher.',
    missedGoal: 'The investors’ slides didn’t load. They looked at the view instead. They liked the view.',
  },
  {
    goal: 6,
    memo: 'The new floor works, mostly. Fix the “mostly”. Six tickets.',
    metGoal: 'Marketing can use the Wi-Fi by the window. Juniper cried. Happy crying. Voucher.',
    missedGoal: 'Marketing have moved their desks next to the lifts. The lift is now very popular.',
  },
  {
    goal: 6,
    memo: 'Friday. Party on the new floor at five. And before it, finally, absolutely: The Conversation. Six tickets.',
    metGoal: 'Six! Come up to the new floor. Bring nothing. Sit down. It’s time for The Conversation.',
    missedGoal: 'Well. It’s still time for The Conversation. Come up. Sit down. Breathe.',
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
    needs: { devices: 200, networks: 108, access: 150 },
  },
  {
    id: 'lighthouse',
    title: 'Junior Security Analyst',
    company: 'Lighthouse Security',
    blurb: 'Help small companies spot phishing, lock down sign-ins and clean up after leavers. You\u2019ll need to know access inside out.',
    needs: { access: 168 },
  },
];


export { ISSUES, TICKETS } from './tickets.ts';
export { TOOLS } from './tools.ts';
