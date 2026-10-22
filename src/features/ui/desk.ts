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

/** Left side: the person in front of you, their mood, what they just said, and what you can ask. */
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
      h('p', { class: 'slip-from' }, `From the tray. You walk over to ${v.name}\u2019s desk.`),
      h('h2', {}, t.title),
      back && h('p', { class: 'tag' }, 'Back again')),
    h('div', { class: 'who' },
      h('img', { class: 'sprite', src: face(v, p.mood), alt: `${v.name} the ${v.species}, looking ${moodName(p.mood).toLowerCase()}` }),
      h('div', { class: 'who-text' },
        h('h2', { class: 'who-name' }, v.name),
        h('div', { class: 'badges' },
          h('span', { class: `mood mood-${p.mood}`, 'data-testid': 'mood' }, moodName(p.mood)),
          bond !== 'neutral' && h('span', { class: `bond ${bond}`, 'data-testid': 'bond' },
            bond === 'friend' ? '\u2665 Friend' : 'Nemesis')))),
    h('p', { class: `bubble mood-${p.mood}`, 'aria-live': 'polite', 'data-testid': 'bubble' }, line),
    questions.length > 0 && h('div', { class: 'questions', role: 'group', 'aria-labelledby': 'ask-heading' },
      h('h3', { id: 'ask-heading', class: 'small-heading' }, 'Ask'),
      ...questions.map((q, i) => h('button', {
        class: 'question', 'data-testid': `ask-${q.id}`, 'data-autofocus': i === 0 && !p.found,
        onclick: () => app.set(ask(state, q.id)),
      }, q.ask))),
  );
}

const STEPS = ['Ask questions', 'Spot what\u2019s off', 'Decide'];

/** Right side: where you are in the three steps, the clues you've gathered, and your choices. */
function workbench(app: App, t: Ticket): HTMLElement {
  const { state } = app;
  const p = progressOf(state, t.id);
  const step = p.found ? 3 : p.asked.length > 0 ? 2 : 1;
  const forgiving = relation(state, t.who) === 'friend';
  const pick = (id: string) => {
    const picked = app.ui.picked.includes(id) ? app.ui.picked.filter((x) => x !== id) : [...app.ui.picked, id];
    const [a, b] = picked;
    if (a === undefined || b === undefined) { app.ui.picked = picked; app.rerender(); return; }
    app.set(inspect(state, a, b).state);
  };
  // Alphabetical, so the right answer isn't always in the same spot.
  const fixes = t.fixes.filter((f) => !p.tried.includes(f.id)).sort((a, b) => a.label.localeCompare(b.label));
  const choice = (props: Record<string, string | boolean | (() => void)>, title: string, detail: string) =>
    h('button', { class: 'btn choice', ...props }, h('strong', {}, title), h('span', {}, detail));

  return h('section', { class: 'workbench', 'aria-label': 'Your desk' },
    h('ol', { class: 'steps' }, ...STEPS.map((label, i) => h('li', {
      class: i + 1 < step ? 'done' : i + 1 === step ? 'current' : '',
      'aria-current': i + 1 === step ? 'step' : false,
    }, label))),
    h('p', { class: 'desk-hint', 'data-testid': 'instruction' }, p.found
      ? 'You found it. Pick the fix that matches.'
      : `What you learn lands on your desk. When two cards contradict each other, pick both. ${
        forgiving ? 'Friends don\u2019t mind a wrong guess.' : 'A wrong guess costs patience.'}`),
    h('div', { class: 'cards' }, ...visibleClues(state, t).map((c) => h('button', {
      class: `card${p.found && t.mismatch.includes(c.id) ? ' flagged' : ''}`,
      'aria-pressed': app.ui.picked.includes(c.id) ? 'true' : 'false',
      disabled: p.found,
      'data-testid': `clue-${c.id}`,
      onclick: () => pick(c.id),
    }, h('span', { class: 'card-label' }, c.label), h('span', { class: 'card-text' }, c.text)))),
    state.notice && h('p', { class: 'notice', role: 'alert', 'data-testid': 'notice' }, state.notice),
    h('div', { class: 'decide', role: 'group', 'aria-label': 'Decide what to do' },
      p.found
        ? h('div', { class: 'fixes' }, h('h3', { class: 'small-heading' }, 'Fix it'), ...fixes.map((f, i) => h('button', {
            class: 'btn fix', 'data-testid': `fix-${f.id}`, 'data-autofocus': i === 0,
            onclick: () => app.set(fix(state, f.id)),
          }, f.label)))
        : choice({ disabled: true }, 'Fix it', 'Spot what doesn\u2019t add up first'),
      choice({ 'data-testid': 'workaround', disabled: !canWorkaround(state, t.id), onclick: () => app.set(workaround(state)) },
        'Give them something', canWorkaround(state, t.id) ? t.workaround : 'They won\u2019t take a workaround again'),
      choice({ 'data-testid': 'push', disabled: !canPush(state, t.id), onclick: () => app.set(pushBack(state)) },
        'Push it back', canPush(state, t.id)
          ? `\u201CCome back in a day or two.\u201D ${MAX_PUSHES - p.pushes} left`
          : 'Not again: they\u2019d go to the manager'),
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
  else body = h('div', { class: 'ticket' }, counter(app, t), workbench(app, t));
  return h('main', { class: 'screen desk', 'data-testid': 'desk' },
    statusBar(app), body, app.ui.panel && panel(app, app.ui.panel));
}
