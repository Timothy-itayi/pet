/**
 * Sam's method, written into every kind of problem: which of Sam's steps each question is (gather context, or
 * isolate and divide), which suspects its answer usually rules out, what each fix would mean is wrong (the suspect),
 * and how much it costs to test (1 a quick check, 3 drastic). Applied onto ISSUES in tickets.ts.
 *
 * An answer only rules suspects out when the ticket really has that clue, and never the ticket's real cause.
 */
import type { Ask, Fix } from './types.ts';

type Asks = Record<string, Pick<Ask, 'step' | 'rulesOut'>>;
type Fixes = Record<string, Pick<Fix, 'suspect' | 'effort'>>;
const C = { step: 'context' } as const;
const I = { step: 'isolate' } as const;
const out = (step: typeof C | typeof I, ...rulesOut: string[]) => ({ ...step, rulesOut });
const RESTART = { suspect: 'It just needs a restart', effort: 1 } as const;

export const REASONING: Record<string, { asks: Asks; fixes: Fixes }> = {
  'paper-jam': {
    asks: { screen: out(C, 'ink', 'driver'), tray: C, others: I },
    fixes: { offon: RESTART, jam: { suspect: 'Paper’s jammed in a tray', effort: 1 }, ink: { suspect: 'It’s out of ink', effort: 2 }, driver: { suspect: 'The printer driver’s broken', effort: 3 } },
  },
  'airplane-mode': {
    asks: { settings: C, others: out(I, 'router', 'isp'), changed: C },
    fixes: {
      offon: RESTART,
      airplane: { suspect: 'Airplane mode is on', effort: 1 },
      router: { suspect: 'The office router is down', effort: 3 },
      isp: { suspect: 'The internet provider is down', effort: 3 },
    },
  },
  'slow-laptop': {
    asks: { uptime: out(C, 'new'), apps: I, disk: out(C, 'delete') },
    fixes: { restart: { suspect: 'It hasn’t been restarted in weeks', effort: 1 }, new: { suspect: 'The laptop is worn out', effort: 3 }, delete: { suspect: 'The disk is full', effort: 2 } },
  },
  'wrong-charger': {
    asks: { charger: out(C, 'battery', 'reset'), sticker: C, age: C },
    fixes: { offon: RESTART, swap: { suspect: 'It’s on the wrong charger', effort: 1 }, battery: { suspect: 'The battery’s dying', effort: 2 }, reset: { suspect: 'The software’s broken', effort: 3 } },
  },
  'printer-driver': {
    asks: { ports: out(C, 'cd'), how: C, printer: C },
    fixes: { offon: RESTART, download: { suspect: 'It needs the current driver', effort: 1 }, cd: { suspect: 'It needs the driver from the old CD', effort: 2 }, usb: { suspect: 'It has to be plugged in by cable', effort: 3 } },
  },
  'guest-wifi': {
    asks: { network: out(C, 'router', 'remap'), password: C, drive: I },
    fixes: { offon: RESTART, staff: { suspect: 'They’re on the wrong Wi-Fi', effort: 1 }, router: { suspect: 'The router’s down', effort: 3 }, remap: { suspect: 'The shared drive link is broken', effort: 2 } },
  },
  'monitor-input': {
    asks: { screen: out(C, 'replace', 'driver'), cable: C, power: out(I, 'replace') },
    fixes: { offon: RESTART, input: { suspect: 'The screen’s on the wrong input', effort: 1 }, replace: { suspect: 'The screen’s dead', effort: 3 }, driver: { suspect: 'The graphics driver’s broken', effort: 2 } },
  },
  'default-printer': {
    asks: { settings: out(C, 'restart', 'toner'), near: I, others: out(I, 'restart', 'toner') },
    fixes: { offon: RESTART, default: { suspect: 'It’s printing to the wrong printer', effort: 1 }, restart: { suspect: 'The printer near them is stuck', effort: 2 }, toner: { suspect: 'It’s out of toner', effort: 2 } },
  },
  'admin-request': {
    asks: { what: C, portal: out(C, 'admin', 'share'), why: C },
    fixes: { portal: { suspect: 'It’s in the Company Portal already', effort: 1 }, admin: { suspect: 'They need admin rights', effort: 3 }, share: { suspect: 'They need your login', effort: 3 } },
  },
  'cable-unplugged': {
    asks: { screen: out(C, 'reinstall'), under: out(I, 'wifi', 'reinstall'), cleaners: C },
    fixes: { offon: RESTART, plug: { suspect: 'The network cable’s come out', effort: 1 }, wifi: { suspect: 'The PC needs Wi-Fi instead', effort: 3 }, reinstall: { suspect: 'Windows is broken', effort: 3 } },
  },
  'password-expired': {
    asks: { error: C, where: I, changed: C },
    fixes: { walk: { suspect: 'Their password has expired', effort: 1 }, expiry: { suspect: 'Expiry is the problem, not the password', effort: 2 }, set: { suspect: 'They need IT to set one for them', effort: 2 } },
  },
  'mouse-battery': {
    asks: { kind: out(C, 'driver'), keyboard: out(I, 'driver'), dropped: C },
    fixes: {
      offon: RESTART, battery: { suspect: 'Flat batteries', effort: 1 }, spare: { suspect: 'The mouse itself is broken', effort: 2 },
      driver: { suspect: 'The mouse driver’s broken', effort: 3 }, new: { suspect: 'It needs a brand new mouse', effort: 3 },
    },
  },
  'caps-lock': {
    asks: { keyboard: C, error: out(C, 'unlock'), changed: out(C, 'reset') },
    fixes: { caps: { suspect: 'Caps Lock is on', effort: 1 }, reset: { suspect: 'They’ve forgotten their password', effort: 2 }, unlock: { suspect: 'The account is locked', effort: 2 } },
  },
  'locked-out': { asks: { error: C, devices: C, keyboard: I }, fixes: {} },
  'forgot-password': { asks: { error: C, changed: C, keyboard: I }, fixes: {} },
  disable: { asks: { who: C, when: C, asked: C }, fixes: {} },
  'okta-setup': { asks: { who: C, when: C, apps: C }, fixes: {} },
  'okta-app': { asks: { which: C, who: I, dashboard: C }, fixes: {} },
  joiner: { asks: { start: C, role: C, hr: I }, fixes: {} },
  mover: { asks: { team: C, apps: I, hr: C }, fixes: {} },
  leaver: { asks: { when: C, access: I, laptop: C }, fixes: {} },
  mfa: { asks: { phone: C, verify: I, where: I }, fixes: {} },
  'mfa-phish': {
    asks: { phone: C, verify: I, where: I },
    fixes: { reset: { suspect: 'It’s really Juniper, locked out', effort: 2 }, verify: { suspect: 'It might not be Juniper at all', effort: 1 }, forward: { suspect: 'It’s Mr. Grisby’s decision', effort: 2 } },
  },
  'okta-rollout': { asks: { who: C, when: C, groups: C }, fixes: {} },
  'okta-admin': {
    asks: { what: C, often: C, see: out(I, 'super', 'share') },
    fixes: { super: { suspect: 'He needs full admin rights', effort: 3 }, report: { suspect: 'He just needs to see who has what', effort: 1 }, share: { suspect: 'He needs your login', effort: 3 } },
  },
  'stale-accounts': { asks: { who: C, where: I, used: C }, fixes: {} },
  'mfa-everyone': { asks: { who: C, why: C, how: I }, fixes: {} },
  phish: {
    asks: { from: out(C, 'open'), clicked: C, others: I },
    fixes: { report: { suspect: 'It’s phishing, and others will get it too', effort: 1 }, open: { suspect: 'You can’t tell without opening it', effort: 3 }, delete: { suspect: 'It’s harmless junk', effort: 1 } },
  },
  'shared-login': {
    asks: { who: C, password: C, why: C },
    fixes: { own: { suspect: 'One login, shared by too many people', effort: 2 }, change: { suspect: 'The password got out', effort: 1 }, note: { suspect: 'IT doesn’t know the password', effort: 1 } },
  },
  'usb-stick': {
    asks: { where: C, label: C, plugged: C },
    fixes: { handin: { suspect: 'It’s bait: never plug it in', effort: 1 }, look: { suspect: 'It’s someone’s lost stick', effort: 1 }, spare: { suspect: 'It’s only risky on a work PC', effort: 2 } },
  },
  phished: { asks: { typed: C, when: C, link: C }, fixes: {} },
  'ceo-fraud': {
    asks: { from: out(C, 'pay', 'reply'), asked: C, check: I },
    fixes: { verify: { suspect: 'It might not be him', effort: 1 }, pay: { suspect: 'It’s really from the boss', effort: 1 }, reply: { suspect: 'Replying to it will tell you', effort: 1 } },
  },
  'dhcp-full': {
    asks: { address: C, others: out(I, 'router'), when: C },
    fixes: { offon: RESTART, pool: { suspect: 'The router’s run out of addresses to hand out', effort: 2 }, fixed: { suspect: 'Each laptop needs a fixed address', effort: 3 }, router: { suspect: 'The router’s down', effort: 2 } },
  },
  'ip-conflict': {
    asks: { message: out(C, 'new', 'cable'), when: I, set: C },
    fixes: { offon: { suspect: 'The printer just needs a restart', effort: 1 }, reserve: { suspect: 'Two devices share one address', effort: 2 }, new: { suspect: 'The printer’s dying', effort: 3 }, cable: { suspect: 'A bad network cable', effort: 2 } },
  },
  'switch-port': {
    asks: { lights: C, other: out(I, 'reinstall'), icon: C },
    fixes: { offon: RESTART, port: { suspect: 'That wall socket is dead', effort: 2 }, reinstall: { suspect: 'The network driver’s broken', effort: 3 }, wifi: { suspect: 'Wired isn’t worth fixing', effort: 1 } },
  },
  'guest-network': {
    asks: { who: C, need: I, now: C },
    fixes: { guest: { suspect: 'Visitors need internet, not our network', effort: 1 }, staff: { suspect: 'They need the staff network', effort: 1 }, hotspot: { suspect: 'They need your phone', effort: 1 } },
  },
  'wifi-deadspot': {
    asks: { bars: C, where: C, others: out(I, 'router') },
    fixes: { move: { suspect: 'They’re just too far from the Wi-Fi', effort: 1 }, ap: { suspect: 'That end of the floor has no access point', effort: 2 }, booster: { suspect: 'They need a booster', effort: 2 }, router: { suspect: 'The router’s down', effort: 2 } },
  },
  dns: {
    asks: { error: C, outside: out(I, 'isp', 'reinstall'), changed: C },
    fixes: { offon: RESTART, dns: { suspect: 'It’s using the wrong name server (DNS)', effort: 2 }, reinstall: { suspect: 'The browser’s broken', effort: 3 }, isp: { suspect: 'The internet’s down', effort: 3 } },
  },
  'verify-setup': { asks: { which: C, how: C, when: C }, fixes: {} },
  'phone-broken': { asks: { what: C, on: C, spare: C }, fixes: {} },
  'mfa-fatigue': { asks: { pushes: C, tapped: C, signing: I }, fixes: {} },
  'flow-build': { asks: { what: C, when: C, check: I }, fixes: {} },
};
