import { DAILY_COST, GOAL_VOUCHER, JOBS, MANAGER, VILLAGERS } from '../game/data.ts';
import { goHome, newGame, peopleWho, scriptFor } from '../game/rules.ts';
import { face } from '../art/sprites.ts';
import type { App } from './app.ts';
import { h, money } from './dom.ts';

export function dayEndScreen(app: App): HTMLElement {
  const { state } = app;
  const { today } = state;
  const script = scriptFor(state.day);
  return h('main', { class: 'screen day-end', 'data-testid': 'day-end' },
    h('h1', {}, `Day ${state.day} done`),
    h('dl', { class: 'summary' },
      h('dt', {}, 'Tickets resolved'), h('dd', {}, `${today.resolved} (goal ${script.goal})`),
      h('dt', {}, 'Set to pending'), h('dd', {}, today.pushed),
      h('dt', {}, 'Missed reply-by times'), h('dd', { 'data-testid': 'missed' }, today.missed),
      h('dt', {}, 'Fixes that didn’t work'), h('dd', {}, today.wrongFixes),
      h('dt', {}, 'Runbook pages you wrote'), h('dd', {}, today.notes),
      h('dt', {}, 'Complaints to Grisby'), h('dd', { 'data-testid': 'complaints' }, today.complaints),
      h('dt', {}, 'Experience earned'), h('dd', {}, `+${today.xp} XP`),
      h('dt', {}, 'Pay'), h('dd', {}, '$0 (unpaid internship)'),
      today.voucher && h('dt', {}, 'Lunch voucher'), today.voucher && h('dd', {}, `+${money(GOAL_VOUCHER)}`),
      h('dt', {}, 'Bus fare and food'), h('dd', {}, `-${money(DAILY_COST)}`),
      h('dt', {}, 'Savings'), h('dd', { 'data-testid': 'savings' }, money(state.savings)),
    ),
    today.bonds.length > 0 && h('ul', { class: 'bonds', 'data-testid': 'bond-changes' }, ...today.bonds.map(({ who, now }) =>
      h('li', { class: `bond ${now}` }, `${VILLAGERS[who].name} ${{
        friend: 'is now your friend \u2665 They\u2019ll be kinder, and they\u2019re a reference on your r\u00E9sum\u00E9.',
        nemesis: 'is now your nemesis. They\u2019ll remember this.',
        neutral: 'has moved on. You\u2019re back to neutral.',
      }[now]}`))),
    h('div', { class: 'toast inline' },
      h('img', { class: 'sprite small', src: face(VILLAGERS.grisby), alt: '' }),
      h('p', {}, `${MANAGER}: ${today.voucher ? script.metGoal : script.missedGoal}`)),
    state.savings <= 0 && h('p', { class: 'notice' }, 'Your savings are gone.'),
    h('button', { class: 'btn primary', 'data-testid': 'go-home', 'data-autofocus': true, onclick: () => app.set(goHome(state)) }, 'Go home'),
  );
}

const list = new Intl.ListFormat('en', { type: 'conjunction' });

export function endingScreen(app: App): HTMLElement {
  const { state } = app;
  const job = JOBS.find((j) => j.id === state.jobId);
  const friends = peopleWho(state, 'friend').map((id) => VILLAGERS[id].name);
  const nemeses = peopleWho(state, 'nemesis').map((id) => VILLAGERS[id].name);
  const refs = friends.length
    ? ` ${list.format(friends)} gave you glowing references.`
    : ' You didn\u2019t have any references, but your r\u00E9sum\u00E9 did the talking.';
  const grudges = nemeses.length ? ` ${list.format(nemeses)} did not come to your leaving drinks.` : '';
  const ending = {
    hired: {
      title: 'You’re hired!',
      text: `${job?.company ?? 'They'} called back. ${job?.title ?? 'A real job'}. In the interview you talked about printers that were just jammed, a runbook that was years out of date, and why you didn’t give anyone admin rights. They loved it.${refs}${grudges} Your last day at Burrow & Co. is Friday. ${MANAGER} asks if you can still “pop in on weekends”. You cannot.`,
    },
    burnout: {
      title: 'Burnt out',
      text: 'The bus fare ran out before the promises did. You hand in your badge. You learned a lot, but it’s hard to keep going without being paid. Next time, close more tickets and get your résumé onto that job board sooner.',
    },
    stay: {
      title: 'Same desk, forever',
      text: `You take ${MANAGER}’s offer. Minimum wage, same desk, still no phone. It’s a start, and your résumé says “IT Support” now. The job board is still there, whenever you’re ready.`,
    },
  }[state.ending ?? 'stay'];
  return h('main', { class: `screen ending ${state.ending ?? ''}`, 'data-testid': 'ending' },
    h('h1', {}, ending.title),
    h('p', {}, ending.text),
    h('button', { class: 'btn primary', 'data-autofocus': true, onclick: () => app.set(newGame()) }, 'Play again'),
  );
}
