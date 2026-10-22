import { MAX_PUSHES, VILLAGERS, WORKAROUND_RETURNS_AFTER } from '../game/data.ts';
import {
  ask, canPush, canWorkaround, currentTicket, endDay, fix, goTo, inspect, moodName, next, progressOf,
  pushBack, relation, scriptFor, ticketById, visibleClues, workaround, type Outcome,
} from '../game/rules.ts';
import type { Ticket } from '../game/types.ts';
import { face } from '../art/sprites.ts';
import type { App } from './app.ts';
import { h, money } from './dom.ts';
import { panel, SKILL_NAMES } from './panels.ts';

const villager = (t: Ticket) => VILLAGERS[t.who];

function statusBar(app: App): HTMLElement {
  const { state } = app;
  const goal = scriptFor(state.day).goal;
  return h('header', { class: 'status' },
    h('span', {}, `Day ${state.day}`),
    h('span', { 'data-testid': 'goal' }, `Closed ${state.today.closed}/${goal}`),
    h('span', {}, `Waiting: ${state.queue.length}`),
    h('span', {}, `Savings ${money(state.savings)}`),
    h('button', { class: 'btn small', onclick: () => { app.ui.panel = 'runbook'; app.rerender(); } }, 'Runbook'),
    h('button', { class: 'btn small', onclick: () => app.set(goTo(state, 'desktop')) }, 'Computer'),
  );
}

/** The person in front of you: their face shows their mood, the bubble shows their latest answer. */
function counter(app: App, t: Ticket): HTMLElement {
  const { state } = app;
  const v = villager(t);
  const p = progressOf(state, t.id);
  const back = p.pushes > 0 || p.workedAround;
  const lastAsked = t.questions.find((q) => q.id === p.asked.at(-1));
  const said = t.clues.find((c) => c.id === 'said')?.text ?? t.title;
  const bond = relation(state, t.who);
  const greeting = bond === 'friend' ? `${v.fond} ` : bond === 'nemesis' ? `${v.grudge} ` : back ? 'It\u2019s me again. ' : '';
  const line = lastAsked?.answer ?? greeting + said;
  const questions = t.questions.filter((q) => !p.asked.includes(q.id));
  return h('section', { class: 'counter', 'aria-label': 'Who needs help' },
    t.arrival === 'tray' && h('div', { class: 'slip' },
      h('p', { class: 'meta' }, `Ticket from the tray \u00B7 you walk over to ${v.name}\u2019s desk`),
      h('h2', {}, t.title),
      back && h('p', { class: 'tag' }, 'BACK AGAIN')),
    h('div', { class: 'visitor' },
      h('figure', { class: 'who' },
        h('img', { class: 'sprite', src: face(v, p.mood), alt: `${v.name} the ${v.species}, looking ${moodName(p.mood).toLowerCase()}` }),
        h('figcaption', { class: `mood mood-${p.mood}`, 'data-testid': 'mood' }, `${v.name} \u00B7 ${moodName(p.mood)}`),
        bond !== 'neutral' && h('span', { class: `bond ${bond}`, 'data-testid': 'bond' },
          bond === 'friend' ? '\u2665 Friend' : 'Nemesis')),
      h('div', { class: 'talk' },
        h('p', { class: `bubble mood-${p.mood}`, 'aria-live': 'polite', 'data-testid': 'bubble' }, line),
        questions.length > 0 && h('div', { class: 'questions', role: 'group', 'aria-label': 'Ask a question' },
          ...questions.map((q, i) => h('button', {
            class: 'question', 'data-testid': `ask-${q.id}`, 'data-autofocus': i === 0 && !p.found,
            onclick: () => app.set(ask(state, q.id)),
          }, `\u25B6 ${q.ask}`))))),
  );
}

function clues(app: App, t: Ticket): HTMLElement {
  const { state } = app;
  const found = progressOf(state, t.id).found;
  const kind = relation(state, t.who) === 'friend';
  const pick = (id: string) => {
    const picked = app.ui.picked.includes(id) ? app.ui.picked.filter((x) => x !== id) : [...app.ui.picked, id];
    const [a, b] = picked;
    if (a === undefined || b === undefined) { app.ui.picked = picked; app.rerender(); return; }
    app.set(inspect(state, a, b).state);
  };
  return h('section', { class: 'clues', 'aria-label': 'Things on your desk' },
    h('p', { class: 'instruction', 'data-testid': 'instruction' }, found
      ? 'Found it. Now pick a fix.'
      : `Ask questions; what you learn lands here. Spot two things that don\u2019t add up? Pick both. ${
        kind ? 'Friends don\u2019t mind a wrong guess.' : 'A wrong guess costs patience.'}`),
    h('div', { class: 'cards' }, ...visibleClues(state, t).map((c, i) => h('button', {
      class: `card${found && t.mismatch.includes(c.id) ? ' flagged' : ''}`,
      'aria-pressed': app.ui.picked.includes(c.id) ? 'true' : 'false',
      disabled: found,
      'data-testid': `clue-${c.id}`,
      'data-autofocus': i === 0 && !found && progressOf(state, t.id).asked.length >= t.questions.length,
      onclick: () => pick(c.id),
    }, h('span', { class: 'card-label' }, c.label), h('span', {}, c.text)))),
  );
}

function actions(app: App, t: Ticket): HTMLElement {
  const { state } = app;
  const p = progressOf(state, t.id);
  // Alphabetical, so the right answer isn't always in the same spot.
  const fixes = t.fixes.filter((f) => !p.tried.includes(f.id)).sort((a, b) => a.label.localeCompare(b.label));
  return h('section', { class: 'actions', 'aria-label': 'What do you do?' },
    p.found && h('div', { class: 'fixes' }, ...fixes.map((f, i) => h('button', {
      class: 'btn fix', 'data-testid': `fix-${f.id}`, 'data-autofocus': i === 0,
      onclick: () => app.set(fix(state, f.id)),
    }, f.label))),
    h('div', { class: 'row' },
      !p.found && h('button', { class: 'btn', disabled: true, title: 'Spot what doesn’t add up first' }, 'Fix it (find the problem first)'),
      h('button', {
        class: 'btn', 'data-testid': 'workaround', disabled: !canWorkaround(state, t.id),
        onclick: () => app.set(workaround(state)),
      }, canWorkaround(state, t.id) ? `Give them something: ${t.workaround}` : 'They won’t take a workaround again'),
      h('button', {
        class: 'btn', 'data-testid': 'push', disabled: !canPush(state, t.id),
        onclick: () => app.set(pushBack(state)),
      }, canPush(state, t.id)
        ? `Push it back (${MAX_PUSHES - p.pushes} left)`
        : 'Can’t push again: they’d go to the manager'),
    ),
  );
}

function outcomeCard(app: App, o: Outcome): HTMLElement {
  const t = ticketById(o.ticketId);
  const v = villager(t);
  const headline = { fix: 'Fixed!', workaround: 'Good enough for now', push: 'Come back in a day or two', storm: `${v.name} storms off` }[o.kind];
  const body = {
    fix: t.why,
    workaround: `${v.name} is happy for now. It’ll probably come back in ${WORKAROUND_RETURNS_AFTER} days. Fix it properly to learn what was really wrong.`,
    push: `${v.name} sighs and shuffles off. They’ll be back tomorrow, grumpier.`,
    storm: `${v.name} has had enough and goes straight to Mr. Grisby’s office to complain. No experience, and it’ll be on your day report. Useless questions and wrong fixes wear people’s patience down.`,
  }[o.kind];
  return h('section', { class: `outcome ${o.kind}`, role: 'status', 'data-testid': 'outcome' },
    h('h2', {}, headline),
    o.xp > 0 && h('p', { class: 'xp' }, `+${o.xp} ${SKILL_NAMES[t.skill]} XP`),
    h('p', {}, body),
    h('button', { class: 'btn primary', 'data-testid': 'next', 'data-autofocus': true, onclick: () => app.set(next(app.state)) }, 'Next'),
  );
}

export function deskScreen(app: App): HTMLElement {
  const { state } = app;
  const t = currentTicket(state);
  let body: HTMLElement;
  if (state.outcome) body = outcomeCard(app, state.outcome);
  else if (!t) body = h('section', { class: 'empty' },
    h('p', {}, 'Nobody’s waiting. The printer hums ominously.'),
    h('button', { class: 'btn primary', 'data-testid': 'clock-out', 'data-autofocus': true, onclick: () => app.set(endDay(state)) }, 'Clock out'));
  else body = h('div', { class: 'ticket' },
    counter(app, t),
    clues(app, t),
    state.notice && h('p', { class: 'notice', role: 'alert', 'data-testid': 'notice' }, state.notice),
    actions(app, t));
  return h('main', { class: 'screen desk', 'data-testid': 'desk' },
    statusBar(app), body, app.ui.panel && panel(app, app.ui.panel));
}
