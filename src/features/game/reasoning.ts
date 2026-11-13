/**
 * Sam's method, written into every kind of problem: which of Sam's steps each question is (gather context, or
 * isolate and divide), which suspects its answer usually rules out, what each fix would mean is wrong (the suspect),
 * which question in the bank it answers (its kind), and how much it costs to test (1 a quick check, 3 drastic).
 * Applied onto ISSUES in tickets.ts.
 *
 * An answer only rules suspects out when the ticket really has that clue, and never the ticket's real cause.
 */
import type { Kind } from './questions.ts';
import type { Ask, Fix } from './types.ts';

type Asks = Record<string, Pick<Ask, 'step' | 'rulesOut'> & { kind: Kind }>;
type Fixes = Record<string, Pick<Fix, 'suspect' | 'effort'>>;
/** A question for gathering context, or for isolating: which question in the bank it answers, and what it rules out. */
const c = (kind: Kind, ...rulesOut: string[]) => ({ step: 'context', kind, rulesOut }) as const;
const i = (kind: Kind, ...rulesOut: string[]) => ({ step: 'isolate', kind, rulesOut }) as const;
const RESTART = { suspect: 'It just needs a restart', effort: 1 } as const;

export const REASONING: Record<string, { asks: Asks; fixes: Fixes }> = {
  'paper-jam': {
    asks: { screen: c('symptom', 'ink', 'driver'), tray: c('symptom'), others: i('scope') },
    fixes: { offon: RESTART, jam: { suspect: 'Paper’s jammed in a tray', effort: 1 }, ink: { suspect: 'It’s out of ink', effort: 2 }, driver: { suspect: 'The printer driver’s broken', effort: 3 } },
  },
  'airplane-mode': {
    asks: { settings: c('symptom'), others: i('scope', 'router', 'isp'), changed: c('change') },
    fixes: {
      offon: RESTART,
      airplane: { suspect: 'Airplane mode is on', effort: 1 },
      router: { suspect: 'The office router is down', effort: 3 },
      isp: { suspect: 'The internet provider is down', effort: 3 },
    },
  },
  'slow-laptop': {
    asks: { uptime: c('tried', 'new'), apps: i('scope'), disk: c('symptom', 'delete') },
    fixes: { restart: { suspect: 'It hasn’t been restarted in weeks', effort: 1 }, new: { suspect: 'The laptop is worn out', effort: 3 }, delete: { suspect: 'The disk is full', effort: 2 } },
  },
  'wrong-charger': {
    asks: { charger: c('power', 'battery', 'reset'), sticker: c('symptom'), age: c('change') },
    fixes: { offon: RESTART, swap: { suspect: 'It’s on the wrong charger', effort: 1 }, battery: { suspect: 'The battery’s dying', effort: 2 }, reset: { suspect: 'The software’s broken', effort: 3 } },
  },
  'printer-driver': {
    asks: { ports: c('where', 'cd'), how: c('tried'), printer: c('where') },
    fixes: { offon: RESTART, download: { suspect: 'It needs the current driver', effort: 1 }, cd: { suspect: 'It needs the driver from the old CD', effort: 2 }, usb: { suspect: 'It has to be plugged in by cable', effort: 3 } },
  },
  'guest-wifi': {
    asks: { network: c('symptom', 'router', 'remap'), password: c('tried'), drive: i('scope') },
    fixes: { offon: RESTART, staff: { suspect: 'They’re on the wrong Wi-Fi', effort: 1 }, router: { suspect: 'The router’s down', effort: 3 }, remap: { suspect: 'The shared drive link is broken', effort: 2 } },
  },
  'monitor-input': {
    asks: { screen: c('symptom', 'replace', 'driver'), cable: c('power'), power: i('power', 'replace') },
    fixes: { offon: RESTART, input: { suspect: 'The screen’s on the wrong input', effort: 1 }, replace: { suspect: 'The screen’s dead', effort: 3 }, driver: { suspect: 'The graphics driver’s broken', effort: 2 } },
  },
  'default-printer': {
    asks: { settings: c('symptom', 'restart', 'toner'), near: i('symptom'), others: i('scope', 'restart', 'toner') },
    fixes: { offon: RESTART, default: { suspect: 'It’s printing to the wrong printer', effort: 1 }, restart: { suspect: 'The printer near them is stuck', effort: 2 }, toner: { suspect: 'It’s out of toner', effort: 2 } },
  },
  'admin-request': {
    asks: { what: c('who'), portal: c('tried', 'admin', 'share'), why: c('who') },
    fixes: { portal: { suspect: 'It’s in the Company Portal already', effort: 1 }, admin: { suspect: 'They need admin rights', effort: 3 }, share: { suspect: 'They need your login', effort: 3 } },
  },
  'cable-unplugged': {
    asks: { screen: c('symptom', 'reinstall'), under: i('power', 'wifi', 'reinstall'), cleaners: c('change') },
    fixes: { offon: RESTART, plug: { suspect: 'The network cable’s come out', effort: 1 }, wifi: { suspect: 'The PC needs Wi-Fi instead', effort: 3 }, reinstall: { suspect: 'Windows is broken', effort: 3 } },
  },
  'password-expired': {
    asks: { error: c('symptom'), where: i('scope'), changed: c('change') },
    fixes: { walk: { suspect: 'Their password has expired', effort: 1 }, expiry: { suspect: 'Expiry is the problem, not the password', effort: 2 }, set: { suspect: 'They need IT to set one for them', effort: 2 } },
  },
  'mouse-battery': {
    asks: { kind: c('power', 'driver'), keyboard: i('scope', 'driver'), dropped: c('change') },
    fixes: {
      offon: RESTART, battery: { suspect: 'Flat batteries', effort: 1 }, spare: { suspect: 'The mouse itself is broken', effort: 2 },
      driver: { suspect: 'The mouse driver’s broken', effort: 3 }, new: { suspect: 'It needs a brand new mouse', effort: 3 },
    },
  },
  'caps-lock': {
    asks: { keyboard: c('power'), error: c('symptom', 'unlock'), changed: c('change', 'reset') },
    fixes: { caps: { suspect: 'Caps Lock is on', effort: 1 }, reset: { suspect: 'They’ve forgotten their password', effort: 2 }, unlock: { suspect: 'The account is locked', effort: 2 } },
  },
  'locked-out': { asks: { error: c('symptom'), devices: c('change'), keyboard: i('power') }, fixes: {} },
  'forgot-password': { asks: { error: c('symptom'), changed: c('change'), keyboard: i('power') }, fixes: {} },
  disable: { asks: { who: c('who'), when: c('change'), asked: c('who') }, fixes: {} },
  'okta-setup': { asks: { who: c('who'), when: c('who'), apps: c('who') }, fixes: {} },
  'okta-app': { asks: { which: c('who'), who: i('scope'), dashboard: c('symptom') }, fixes: {} },
  joiner: { asks: { start: c('who'), role: c('who'), hr: i('change') }, fixes: {} },
  mover: { asks: { team: c('who'), apps: i('who'), hr: c('change') }, fixes: {} },
  leaver: { asks: { when: c('change'), access: i('symptom'), laptop: c('where') }, fixes: {} },
  mfa: { asks: { phone: c('change'), verify: i('who'), where: i('where') }, fixes: {} },
  'mfa-phish': {
    asks: { phone: c('change'), verify: i('who'), where: i('where') },
    fixes: { reset: { suspect: 'It’s really Juniper, locked out', effort: 2 }, verify: { suspect: 'It might not be Juniper at all', effort: 1 }, forward: { suspect: 'It’s Mr. Grisby’s decision', effort: 2 } },
  },
  'okta-rollout': { asks: { who: c('who'), when: c('who'), groups: c('who') }, fixes: {} },
  'okta-admin': {
    asks: { what: c('who'), often: c('repeat'), see: i('who', 'super', 'share') },
    fixes: { super: { suspect: 'He needs full admin rights', effort: 3 }, report: { suspect: 'He just needs to see who has what', effort: 1 }, share: { suspect: 'He needs your login', effort: 3 } },
  },
  'stale-accounts': { asks: { who: c('who'), where: i('where'), used: c('change') }, fixes: {} },
  'mfa-everyone': { asks: { who: c('who'), why: c('change'), how: i('who') }, fixes: {} },
  phish: {
    asks: { from: c('symptom', 'open'), clicked: c('tried'), others: i('scope') },
    fixes: { report: { suspect: 'It’s phishing, and others will get it too', effort: 1 }, open: { suspect: 'You can’t tell without opening it', effort: 3 }, delete: { suspect: 'It’s harmless junk', effort: 1 } },
  },
  'shared-login': {
    asks: { who: c('who'), password: c('scope'), why: c('who') },
    fixes: { own: { suspect: 'One login, shared by too many people', effort: 2 }, change: { suspect: 'The password got out', effort: 1 }, note: { suspect: 'IT doesn’t know the password', effort: 1 } },
  },
  'usb-stick': {
    asks: { where: c('where'), label: c('symptom'), plugged: c('tried') },
    fixes: { handin: { suspect: 'It’s bait: never plug it in', effort: 1 }, look: { suspect: 'It’s someone’s lost stick', effort: 1 }, spare: { suspect: 'It’s only risky on a work PC', effort: 2 } },
  },
  phished: { asks: { typed: c('tried'), when: c('change'), link: c('symptom') }, fixes: {} },
  'ceo-fraud': {
    asks: { from: c('symptom', 'pay', 'reply'), asked: c('who'), check: i('tried') },
    fixes: { verify: { suspect: 'It might not be him', effort: 1 }, pay: { suspect: 'It’s really from the boss', effort: 1 }, reply: { suspect: 'Replying to it will tell you', effort: 1 } },
  },
  'dhcp-full': {
    asks: { address: c('symptom'), others: i('scope', 'router'), when: c('change') },
    fixes: { offon: RESTART, pool: { suspect: 'The router’s run out of addresses to hand out', effort: 2 }, fixed: { suspect: 'Each laptop needs a fixed address', effort: 3 }, router: { suspect: 'The router’s down', effort: 2 } },
  },
  'ip-conflict': {
    asks: { message: c('symptom', 'new', 'cable'), when: i('repeat'), set: c('change') },
    fixes: { offon: RESTART, reserve: { suspect: 'Two devices share one address', effort: 2 }, new: { suspect: 'It’s dying', effort: 3 }, cable: { suspect: 'A bad network cable', effort: 2 } },
  },
  'switch-port': {
    asks: { lights: c('power'), other: i('scope', 'reinstall'), icon: c('symptom') },
    fixes: { offon: RESTART, port: { suspect: 'That wall socket is dead', effort: 2 }, reinstall: { suspect: 'The network driver’s broken', effort: 3 }, wifi: { suspect: 'Wired isn’t worth fixing', effort: 1 } },
  },
  'guest-network': {
    asks: { who: c('who'), need: i('who'), now: c('symptom') },
    fixes: { guest: { suspect: 'Visitors need internet, not our network', effort: 1 }, staff: { suspect: 'They need the staff network', effort: 1 }, hotspot: { suspect: 'They need your phone', effort: 1 } },
  },
  'wifi-deadspot': {
    asks: { bars: c('symptom'), where: c('where'), others: i('scope', 'router') },
    fixes: { move: { suspect: 'They’re just too far from the Wi-Fi', effort: 1 }, ap: { suspect: 'That end of the floor has no access point', effort: 2 }, booster: { suspect: 'They need a booster', effort: 2 }, router: { suspect: 'The router’s down', effort: 2 } },
  },
  dns: {
    asks: { error: c('symptom'), outside: i('scope', 'isp', 'reinstall'), changed: c('change') },
    fixes: { offon: RESTART, dns: { suspect: 'It’s using the wrong name server (DNS)', effort: 2 }, reinstall: { suspect: 'The browser’s broken', effort: 3 }, isp: { suspect: 'The internet’s down', effort: 3 } },
  },
  'verify-setup': { asks: { which: c('where'), how: c('who'), when: c('who') }, fixes: {} },
  'phone-broken': { asks: { what: c('change'), on: c('power'), spare: c('tried') }, fixes: {} },
  'mfa-fatigue': { asks: { pushes: c('symptom'), tapped: c('tried'), signing: i('who') }, fixes: {} },
  'flow-build': { asks: { what: c('who'), when: c('who'), check: i('who') }, fixes: {} },
};
