/**
 * A save at the start of any day, with every day before it played properly: for testing a later week by hand.
 *
 *   node scripts/save-at.ts 11         writes scripts/saves/day11.json (git ignores the folder)
 *
 * Load it in the game from the browser console on the dev server:
 *   localStorage.setItem('pet-save-v1', await (await fetch('/scripts/saves/day11.json')).text()); location.reload();
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { DAYS } from '../src/features/game/data.ts';
import type { Department } from '../src/features/game/directory.ts';
import { addApp, addGroup, addRule, assignApp, createFromHr, resetMfa, setActive, updateFromHr } from '../src/features/game/identity.ts';
import { CATALOG, hrOn } from '../src/features/game/oktopus.ts';
import {
  askForTicket, clockOut, fixFor, goHome, goTo, issueOf, newGame, next, resetPassword, resolve, setEnabled, suggest, tick, ticketById, unlockAccount, type GameState,
} from '../src/features/game/rules.ts';

function teams(s: GameState, team: readonly string[] = ['Marketing']): GameState {
  for (const r of hrOn(s.day).filter((x) => team.includes(x.dept) && x.status === 'active')) s = createFromHr(s, r.login);
  for (const dept of team) {
    s = addGroup(s, `DEPT-${dept}`);
    if (!s.okta.rules.some((r) => 'dept' in r && r.dept === dept)) s = addRule(s, { group: `DEPT-${dept}`, dept: dept as Department });
  }
  return s;
}

function app(s: GameState, id = 'hootsweet', team: readonly string[] = ['Marketing']): GameState {
  const group = `APP-${CATALOG.find((c) => c.id === id)?.name ?? id}-Users`;
  s = addGroup(addApp(teams(s, team), id), group);
  for (const dept of team) if (!s.okta.rules.some((r) => r.group === group && 'memberOf' in r && r.memberOf === `DEPT-${dept}`)) s = addRule(s, { group, memberOf: `DEPT-${dept}` });
  return assignApp(s, id, group);
}

/** The console work for a ticket, done the right way. */
function admin(s: GameState, id: string): GameState {
  const t = ticketById(id);
  switch (issueOf(t).console) {
    case 'unlock': return unlockAccount(s, t.who);
    case 'reset': return resetPassword(s, t.who, { mustChange: true, unlock: true });
    case 'disable': return setEnabled(s, 'sam', false);
    case 'okta-setup': return teams(s, t.team);
    case 'okta-app': return app(s, t.app, t.team);
    case 'joiner': return createFromHr(s, t.subject ?? '');
    case 'mover': return updateFromHr(s, t.subject ?? '');
    case 'leaver': return setActive(s, t.subject ?? '', false);
    case 'mfa': return resetMfa(s, t.who);
    case undefined: return s;
  }
}

function solve(s: GameState, id: string): GameState {
  if (s.chats.includes(id)) return next(askForTicket(s, id));
  const t = ticketById(id);
  s = suggest(admin(s, id), id, issueOf(t).console ? 'console' : fixFor(t));
  while (s.tickets[id]?.caller && s.tickets[id]?.caller?.doing !== 'confirmed' && !s.outcomes.length && s.clock < 18 * 60) s = tick(s, 1);
  return next(resolve(s, id));
}

const day = Number(process.argv[2]);
if (!Number.isInteger(day) || day < 1 || day > DAYS) throw new Error(`Give a day from 1 to ${DAYS}.`);
let s = newGame(12345);
while (s.day < day) {
  s = goTo(s, 'desk');
  while (s.phase === 'desk' && s.clock < 17 * 60) {
    const id = s.queue[0] ?? s.chats[0];
    s = s.outcomes.length ? next(s) : id ? solve(s, id) : tick(s, 1);
  }
  while (s.outcomes.length) s = next(s);
  s = goHome(clockOut(s));
}
mkdirSync('scripts/saves', { recursive: true });
writeFileSync(`scripts/saves/day${day}.json`, JSON.stringify(s));
console.log(`scripts/saves/day${day}.json: day ${s.day}, ${s.phase}, savings $${s.savings}, ${Object.keys(s.okta.users).length} people in Oktopus.`);
