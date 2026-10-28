/**
 * Company phones and Oktopus Verify, from week 4. The auditors' report frees up some budget, and a box of phones
 * turns up in your desk drawer. Each one is set up by hand (a passcode, the Oktopus Verify app), then enrolled to one
 * person by scanning the QR code Oktopus shows for them, and handed over. You go first; after a couple by hand, you
 * switch on self-enrolment and everyone does their own.
 */
import { budgetOn } from './data.ts';
import { MINUTES_A_DAY } from './directory.ts';
import { needsMfa } from './oktopus.ts';
import { clockTime, SELF, type GameState } from './rules.ts';
import { TICKETS } from './tickets.ts';

export interface Phone {
  id: string;
  /** In the drawer, in your hand, or given to whoever it's enrolled to. */
  where: 'drawer' | 'hand' | 'given';
  /** Through the "Hello" screens. */
  setUp: boolean;
  /** A passcode was set during setup. Burrow won't enrol a phone without one. */
  passcode: boolean;
  /** Apps installed from the App Store. */
  apps: string[];
  /** Who it's enrolled to in Oktopus Verify, and when (day * minutes + clock). */
  owner?: string;
  enrolledAt?: number;
  /** Cracked and won't turn on. */
  broken?: true;
  /** A replacement, ordered for this person. */
  for?: string;
  /** Its place in the tray in your drawer, 0 to 5: it always goes back to the same one. */
  slot?: number;
}

/** The auditors' findings come in on day 16, and so does the budget, and so do the phones. */
export const PHONES_DAY = 16;
export const VERIFY = 'verify';

/** Six phones in the box. One of them arrived broken: there's always one. */
export const newPhones = (): Phone[] => Array.from({ length: 6 }, (_, i) => ({ id: `phone-${i + 1}`, where: 'drawer', setUp: false, passcode: false, apps: [], slot: i, ...(i === 5 && { broken: true as const }) }));

const now = (d: GameState) => d.day * MINUTES_A_DAY + d.clock;

/** A change to a phone, on a copy; refused (the same state back) when `change` returns false. */
function withPhone(s: GameState, id: string, change: (p: Phone, d: GameState) => false | undefined): GameState {
  const d = structuredClone(s);
  const phone = d.phones.find((p) => p.id === id);
  return phone && change(phone, d) !== false ? d : s;
}

export const held = (s: GameState) => s.phones.find((p) => p.where === 'hand');

/** Pick a phone up out of the drawer. You only have two hands, and one of them's holding a coffee: anything already held goes back. */
export const takePhone = (s: GameState, id: string) => withPhone(s, id, (p, d) => {
  if (p.where !== 'drawer') return false;
  for (const other of d.phones) if (other.where === 'hand') other.where = 'drawer';
  p.where = 'hand';
});

export const putDown = (s: GameState) => {
  const p = held(s);
  return p ? withPhone(s, p.id, (x) => { x.where = 'drawer'; }) : s;
};

/** Finish the "Hello" screens, with or without a passcode. */
export const setUpPhone = (s: GameState, id: string, passcode: boolean) => withPhone(s, id, (p) => {
  if (p.setUp || p.broken) return false;
  Object.assign(p, { setUp: true, passcode });
});

/** Add a passcode later, in Settings. */
export const addPasscode = (s: GameState, id: string) => withPhone(s, id, (p) => (p.setUp && !p.passcode ? void (p.passcode = true) : false));

export const installApp = (s: GameState, id: string, app: string) => withPhone(s, id, (p) => (p.setUp && !p.apps.includes(app) ? void p.apps.push(app) : false));

/** Why a phone can't be enrolled to someone, in a sentence; undefined when it can. */
export function enrolProblem(s: GameState, id: string, login: string): string | undefined {
  const p = s.phones.find((x) => x.id === id);
  const user = s.okta.users[login];
  if (!p?.setUp) return 'Finish setting the phone up first.';
  if (!p.apps.includes(VERIFY)) return 'Install Oktopus Verify from the App Store first.';
  if (!p.passcode) return 'Burrow requires a passcode on company phones. Set one in Settings, then scan again.';
  if (!user) return `${login} isn’t in Oktopus.`;
  if (user.status !== 'active') return `${user.name} is deactivated in Oktopus. Nobody should be enrolling a phone for them.`;
  if (p.owner && p.owner !== login) return `This phone is already ${s.okta.users[p.owner]?.name ?? p.owner}’s. Use another one.`;
  return undefined;
}

/**
 * Point the phone's camera at whatever's on the monitor. If Oktopus is showing someone's enrolment QR code
 * (`showing`, a login), this phone becomes their Oktopus Verify. Returns the state and what the phone says.
 */
export function scan(s: GameState, id: string, showing: string | undefined): { state: GameState; said: string } {
  if (!showing) return { state: s, said: 'No code in view. Put the QR code on the screen: Oktopus Admin, People, then the person.' };
  const problem = enrolProblem(s, id, showing);
  if (problem) return { state: s, said: problem };
  const state = withPhone(s, id, (p, d) => {
    // One phone each: a phone enrolled before for them is no longer how they sign in.
    for (const other of d.phones) if (other.id !== p.id && other.owner === showing) delete other.owner;
    p.owner = showing;
    p.enrolledAt = now(d);
    d.okta.verify[showing] = p.id;
    d.okta.log.push({ at: now(d), event: 'user.mfa.factor.activate', target: showing });
  });
  return { state, said: `Account added: ${s.okta.users[showing]?.name ?? showing}, Burrow & Co.` };
}

/** Give a phone you've set up to the person it's enrolled to. Yours stays with you. */
export const handOver = (s: GameState, id: string) => withPhone(s, id, (p) => {
  if (p.where !== 'hand' || !p.owner || p.owner === SELF) return false;
  p.where = 'given';
});

/** A six-digit code that changes every half hour of office time, the same on the phone and in the System Log. */
export function verifyCode(phoneId: string, login: string, at: number): string {
  let h = Math.floor(at / 30) * 2654435761;
  for (const c of `${phoneId}:${login}`) h = Math.imul(h ^ c.charCodeAt(0), 2246822519) >>> 0;
  return String(h % 1_000_000).padStart(6, '0');
}

// ---- Pushes ----------------------------------------------------------------------------------------------------

/** Your own sign-in: once you're on Oktopus Verify and the policy covers you, Oktopus wants a push approved each day. */
export const needsPush = (s: GameState) => Boolean(s.okta.verify[SELF]) && needsMfa(s.okta, SELF) && s.pushOk !== s.day;

/** Answer the push for your own sign-in to Oktopus Admin. */
export const answerPush = (s: GameState, yes: boolean) => {
  const d = structuredClone(s);
  if (yes) d.pushOk = d.day;
  d.okta.log.push({ at: now(d), event: yes ? 'user.authentication.auth_via_mfa' : 'user.mfa.okta_verify.deny_push', target: SELF });
  return d;
};

/** On day 18, someone with your password tries to sign in as you, and your phone asks if it's you. It isn't. */
export const ROGUE = { day: 18, at: 11 * 60, where: 'a Windows PC in another country' };
export const roguePending = (s: GameState) => s.day === ROGUE.day && s.clock >= ROGUE.at && !s.rogue && Boolean(s.okta.verify[SELF]);

export const answerRogue = (s: GameState, yes: boolean) => {
  const d = structuredClone(s);
  d.rogue = yes ? 'approved' : 'denied';
  d.okta.log.push({ at: now(d), event: yes ? 'user.authentication.auth_via_mfa' : 'user.mfa.okta_verify.deny_push', target: `${SELF} (${ROGUE.where})` });
  return d;
};

// ---- Ticket checks ---------------------------------------------------------------------------------------------

/** What's still wrong for a "set up a company phone" ticket, in a sentence; undefined once it's done. */
export function verifyProblem(s: GameState, who: string, name: string): string | undefined {
  const phone = s.phones.find((p) => p.id === s.okta.verify[who]);
  if (!phone) {
    return `${who === SELF ? 'You aren’t' : `${name} isn’t`} on Oktopus Verify yet. Take a phone from the desk drawer, set it up, install Oktopus Verify, then scan the code Oktopus shows under People.`;
  }
  if (who !== SELF && phone.where !== 'given') return `${name}’s phone is set up, but it’s still in your hand. Hand it over.`;
  return undefined;
}

/** A lost phone, from week 4: resetting isn't enough any more. They need a new phone, set up and enrolled since they asked. */
export function replacedSince(s: GameState, who: string, since: number): boolean {
  const phone = s.phones.find((p) => p.id === s.okta.verify[who]);
  return Boolean(phone && phone.where === 'given' && (phone.enrolledAt ?? -1) >= since);
}

/** A spare phone set up for someone the right way: what the save script and tests use, and what a good answer looks like. */
export function phoneFor(s: GameState, login: string): GameState {
  const free = s.phones.filter((p) => p.where === 'drawer' && !p.owner && !p.setUp && !p.broken);
  const spare = free.find((p) => p.for === login) ?? free.find((p) => !p.for);
  if (!spare) return s;
  let d = installApp(setUpPhone(takePhone(s, spare.id), spare.id, true), spare.id, VERIFY);
  d = scan(d, spare.id, login).state;
  return login === SELF ? putDown(d) : handOver(d, spare.id);
}

// ---- Broken phones and replacements -----------------------------------------------------------------------------

/** A replacement phone has to be approved by whoever holds the budget, which takes a while. */
export const APPROVER = 'grisby';
export const APPROVAL_MINUTES = 30;

export interface HardwareRequest {
  /** The broken phone it replaces, and who the new one is for, if anyone. */
  phone: string;
  for?: string;
  at: number;
  approvedAt?: number;
  /** Turned down: from week 5 the budget's frozen again. */
  refusedAt?: number;
}

/** Ask for a replacement for the broken phone in your hand. It goes to Mr. Grisby to approve. */
export function requestReplacement(s: GameState, id: string): GameState {
  const p = s.phones.find((x) => x.id === id);
  if (!p?.broken || p.where !== 'hand' || s.requests.some((r) => r.phone === id)) return s;
  const d = structuredClone(s);
  d.requests.push({ phone: id, ...(p.owner && { for: p.owner }), at: now(d) });
  return d;
}

/**
 * Approvals come through while the day goes on (in place: call with a copy). An approved replacement turns up in the
 * drawer, and the broken one goes back to the supplier.
 */
export function settleRequests(d: GameState): void {
  for (const r of d.requests) {
    if (r.approvedAt !== undefined || r.refusedAt !== undefined || now(d) < r.at + APPROVAL_MINUTES) continue;
    // The budget's frozen again: no, and make do with a spare.
    if (budgetOn(d.day) === 'refrozen') { r.refusedAt = now(d); continue; }
    r.approvedAt = now(d);
    // The new one goes in the broken one's place in the tray.
    const slot = d.phones.find((p) => p.id === r.phone)?.slot;
    d.phones = d.phones.filter((p) => p.id !== r.phone);
    const id = `phone-${Math.max(0, ...d.phones.map((p) => Number(p.id.slice(6)) || 0), ...d.requests.map((x) => Number(x.phone.slice(6)) || 0)) + 1}`;
    d.phones.push({ id, where: 'drawer', setUp: false, passcode: false, apps: [], ...(slot !== undefined && { slot }), ...(r.for && { for: r.for }) });
  }
}

/** On day 19 Dot drops her phone in the car park on the way in. */
export const BREAK = { day: 19, who: 'dot' };

/** Someone's company phone breaks: theirs (with them), cracked; one is made broken if they never had one. */
export function breakPhone(d: GameState, login: string): void {
  const phone = d.phones.find((p) => p.owner === login && p.where === 'given');
  if (phone) { phone.broken = true; return; }
  d.phones.push({ id: `phone-${d.phones.length + 1}`, where: 'given', setUp: true, passcode: true, apps: [VERIFY], owner: login, broken: true });
}

// ---- People coming to your desk -----------------------------------------------------------------------------------

/** How long after you enrol someone's phone they wander over for it (office minutes). */
export const PICKUP_AFTER = 10;

export interface Visit { login: string; why: 'pickup' | 'dropoff'; phone: string }

/**
 * Who's at your desk about a phone, if anyone: someone come to collect the phone you set up for them, or to hand in
 * the one they broke. Only while they're in the office and not in a meeting or at lunch.
 */
export function visitor(s: GameState, here: (login: string) => boolean): Visit | undefined {
  const t = now(s);
  for (const p of s.phones) {
    if (!p.owner || p.owner === SELF || !here(p.owner)) continue;
    if (p.broken && p.where === 'given') return { login: p.owner, why: 'dropoff', phone: p.id };
    if (!p.broken && p.where !== 'given' && t >= (p.enrolledAt ?? t) + PICKUP_AFTER) return { login: p.owner, why: 'pickup', phone: p.id };
  }
  return undefined;
}

/** Take a broken phone off someone who's brought it back: it's in your hand now. */
export const takeBroken = (s: GameState, id: string) => withPhone(s, id, (p, d) => {
  if (!p.broken || p.where !== 'given') return false;
  for (const other of d.phones) if (other.where === 'hand') other.where = 'drawer';
  p.where = 'hand';
});

/** What's still wrong for a broken-phone ticket, in a sentence; undefined once they've a working replacement. */
export function replaceProblem(s: GameState, who: string, name: string, since: number): string | undefined {
  const request = s.requests.find((r) => r.for === who && r.at >= since);
  if (!request) {
    const broken = s.phones.find((p) => p.owner === who && p.broken);
    return broken?.where === 'given'
      ? `${name} still has the broken phone. Take it off them when they come over, then ask for a replacement.`
      : `${name}’s phone is broken, and a new one has to be approved. Hold the broken phone and request a replacement.`;
  }
  const phone = s.phones.find((p) => p.id === s.okta.verify[who]);
  if (request.refusedAt !== undefined) {
    // No new phone, so a spare from the drawer it is.
    if (!phone || phone.broken || (phone.enrolledAt ?? -1) < since) return `Mr. Grisby said no: the budget\u2019s frozen again. Set up a spare from your drawer and enrol it to ${name} instead.`;
    return phone.where === 'given' ? undefined : `${name}\u2019s spare is ready. Hand it over when they come for it.`;
  }
  if (request.approvedAt === undefined) return `The replacement is waiting for Mr. Grisby to approve it.`;
  if (!phone || phone.for !== who || (phone.enrolledAt ?? -1) < since) return `The replacement’s in your drawer. Set it up and enrol it to ${name}.`;
  return phone.where === 'given' ? undefined : `${name}’s new phone is ready. Hand it over when they come for it.`;
}

/** Where each phone in the drawer lies: its own slot, or the first free one for a phone that never had one. */
export function drawerSlots(phones: Phone[]): { id: string; slot: number }[] {
  const inDrawer = phones.filter((p) => p.where === 'drawer');
  const taken = new Set(inDrawer.flatMap((p) => (p.slot === undefined ? [] : [p.slot])));
  const free = [0, 1, 2, 3, 4, 5].filter((n) => !taken.has(n));
  return inDrawer.map((p) => ({ id: p.id, slot: p.slot ?? free.shift() ?? 0 }));
}

/** What a phone is, said when you point at it: "Phone 3: new", "Phone 1: yours", "Phone 4: Dot's". */
export function phoneName(s: GameState, id: string): string {
  const p = s.phones.find((x) => x.id === id);
  const n = `Phone ${id.replace('phone-', '')}`;
  if (!p) return n;
  if (p.broken) return `${n}: broken`;
  if (p.owner === SELF) return `${n}: yours`;
  if (p.owner) return `${n}: ${s.okta.users[p.owner]?.name ?? p.owner}\u2019s`;
  if (p.for) return `${n}: new, for ${s.okta.users[p.for]?.name ?? p.for}`;
  return `${n}: ${p.setUp ? 'set up' : 'new'}`;
}

// ---- What people say on their way over ------------------------------------------------------------------------

type Feeling = 'bright' | 'usual' | 'low' | 'late' | 'broken';

/**
 * Their message when they set off for your desk, in their own voice. How they feel depends on what happened: a phone
 * that took days (late), one they broke (broken), or just how their day's going.
 */
const ON_MY_WAY: Record<string, Partial<Record<Feeling, string>>> = {
  dot: {
    bright: 'Is my phone ready?! On my way! I’ve cleared a whole drawer for it.',
    usual: 'On my way over for the phone. Thank you so much for doing it.',
    low: 'Coming for the phone. Sorry, it’s been one of those days. Is it difficult? Please say it isn’t difficult.',
    late: 'Oh! It’s ready! I’d stopped hoping. Sorry. On my way.',
    broken: 'I’m bringing you the pieces now. I’m so sorry. I’ve put them in an envelope. Some of them.',
  },
  otis: {
    bright: 'A phone, set up by IT, in good time. On my way to witness it.',
    usual: 'I’m on my way for the phone.',
    low: 'On my way. I trust it does not require me to make a face at it.',
    late: 'On my way. I had begun minuting its absence.',
    broken: 'I am on my way with what was a phone. I would rather not discuss it.',
  },
  grisby: {
    bright: 'On my way! Company phones! Very modern. Very investor.',
    usual: 'Coming down for my phone. Make it quick, I have a call. On the old phone.',
    low: 'On my way. This had better not want a password AND a phone AND my soul.',
    late: 'Finally. On my way. I was told IT would be quick. I was told this by IT.',
    broken: 'Coming down. Don’t look at the phone. Don’t look at me. It was a very small car.',
  },
  juniper: {
    bright: 'MY PHONE IS READY!! omw!!',
    usual: 'On my way for the phone! Can I put stickers on it?',
    low: 'omw. Please tell me it doesn’t buzz every five minutes.',
    late: 'Is it finally ready?? On my way before it changes its mind.',
    broken: 'On my way. Don’t be cross. It slipped. Off the roof. Of the car park.',
  },
  marlo: {
    bright: 'Phone time! On my way, it’s basically a sales tool.',
    usual: 'On my way down for the phone.',
    low: 'Coming. Quickly though, I’ve got a call in ten.',
    late: 'About time. I’m on my way.',
    broken: 'On my way with the phone. Long story. It involves a pitch and a very enthusiastic handshake.',
  },
  biscuit: {
    bright: 'Ooh! On my way! I’ll bring biscuits.',
    usual: 'On my way for the phone! Thanks a bunch.',
    low: 'Coming over for the phone. I might need you to show me. Twice.',
    late: 'On my way! I thought you’d forgotten me. It happens. A lot.',
    broken: 'Coming over. It went in the dishwasher. I was cleaning it. It’s very clean now.',
  },
  pip: {
    bright: 'On my way. Excited about the phone.',
    usual: 'On my way for the phone.',
    low: 'Coming over. Quietly.',
    late: 'On my way. Was starting to think it was a myth.',
    broken: 'Bringing it over. It went in the pond. Don’t ask why I was at the pond.',
  },
};
const ANYONE: Record<Feeling, string> = {
  bright: 'Is my phone ready? On my way!',
  usual: 'On my way over for the phone. Thanks!',
  low: 'Coming for the phone. Let’s get it over with.',
  late: 'Finally! On my way over.',
  broken: 'On my way with the broken phone. Sorry about this.',
};

/** Took IT more than three hours of office time, from them asking to their phone being ready: they're a bit fed up. */
const LATE_AFTER = 180;

/** What someone says when they set off for your desk about a phone. `mood` is how their day's going. */
export function onMyWay(s: GameState, visit: Visit, mood: 'bright' | 'usual' | 'low'): string {
  const phone = s.phones.find((p) => p.id === visit.phone);
  const asked = TICKETS.find((t) => t.subject === visit.login && (t.issue === 'verify-setup' || t.issue === 'phone-broken') && t.day <= s.day);
  const askedAt = asked ? asked.day * MINUTES_A_DAY + clockTime(asked.at) : undefined;
  const late = visit.why === 'pickup' && askedAt !== undefined && (phone?.enrolledAt ?? 0) - askedAt > LATE_AFTER;
  const feeling: Feeling = visit.why === 'dropoff' ? 'broken' : late ? 'late' : mood;
  return ON_MY_WAY[visit.login]?.[feeling] ?? ANYONE[feeling];
}
