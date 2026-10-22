import { MAX_PUSHES, VILLAGERS, WORKAROUND_RETURNS_AFTER } from '../game/data.ts';
import {
  canClockOut, canPush, canWorkaround, clockOut, fix, goTo, isKnown, issueOf, minutesLeft, moodName, next, pushBack,
  relation, reply, scriptFor, ticketById, ticketState, workaround, writeNote, type GameState, type Outcome, type Status,
} from '../game/rules.ts';
import type { Ticket } from '../game/types.ts';
import { face } from '../art/sprites.ts';
import type { App } from './app.ts';
import { clockText, h, money } from './dom.ts';
import { panel, SKILL_NAMES } from './panels.ts';

const STATUS: Record<Status, string> = { new: 'New', open: 'Open', pending: 'Pending', resolved: 'Resolved' };
const PRIORITY = { low: 'Low priority', normal: 'Normal priority', high: 'High priority' } as const;

/** "Reply by 10:50 (8 min)" or "Overdue": the countdown that drives everyone's mood. */
function dueText(s: GameState, id: string): string {
  const left = minutesLeft(s, id);
  return left > 0 ? `Reply by ${clockText(ticketState(s, id).due)} (${left} min)` : 'Overdue';
}
const urgent = (s: GameState, id: string) => minutesLeft(s, id) <= 10;

/** Keeps the clock and countdowns moving between full redraws. */
export function refreshTimes(root: HTMLElement, s: GameState): void {
  root.querySelectorAll<HTMLElement>('[data-clock]').forEach((el) => { el.textContent = clockText(s.clock); });
  root.querySelectorAll<HTMLElement>('[data-due]').forEach((el) => {
    const id = el.dataset.due ?? '';
    if (!s.queue.includes(id)) return;
    el.textContent = dueText(s, id);
    el.classList.toggle('urgent', urgent(s, id));
  });
}

function statusBar(app: App): HTMLElement {
  const { state, ui } = app;
  const toggle = () => { ui.paused = !ui.paused; app.rerender(); };
  return h('header', { class: 'status' },
    h('span', {}, `Day ${state.day}`),
    h('span', { class: 'clock', 'data-clock': true, 'data-testid': 'clock' }, clockText(state.clock)),
    h('button', { class: 'btn small', 'data-testid': 'pause', 'aria-pressed': ui.paused ? 'true' : 'false', onclick: toggle },
      ui.paused ? 'Resume' : 'Pause'),
    h('span', { 'data-testid': 'goal' }, `Resolved ${state.today.resolved}/${scriptFor(state.day).goal}`),
    h('span', {}, `Savings ${money(state.savings)}`),
    h('button', { class: 'btn small', onclick: () => { app.ui.panel = 'runbook'; app.rerender(); } }, 'Runbook'),
    h('button', { class: 'btn small', onclick: () => app.set(goTo(state, 'desktop')) }, 'Computer'),
  );
}

function queueList(app: App, selected: string | undefined): HTMLElement {
  const { state } = app;
  const nextAt = state.arriving[0]?.at;
  return h('nav', { class: 'queue', 'aria-label': 'Ticket queue' },
    h('h2', { class: 'small-heading' }, `Queue (${state.queue.length})`),
    ...state.queue.map((id) => {
      const t = ticketById(id);
      const st = ticketState(state, id);
      const v = VILLAGERS[t.who];
      return h('button', {
        class: `queue-item${id === selected ? ' selected' : ''}`, 'data-testid': `queue-${id}`,
        'aria-current': id === selected ? 'true' : false,
        onclick: () => { app.ui.selected = id; app.rerender(); },
      },
        h('img', { class: 'sprite tiny', src: face(v, st.mood), alt: '' }),
        h('span', { class: 'queue-text' },
          h('strong', {}, t.title),
          h('span', {}, `${v.name}, ${moodName(st.mood).toLowerCase()}. ${STATUS[st.status]}.`),
          h('span', { class: `due${urgent(state, id) ? ' urgent' : ''}`, 'data-due': id }, dueText(state, id))));
    }),
    !state.queue.length && h('div', { class: 'queue-empty' },
      h('p', {}, 'Nobody’s waiting. The printer hums ominously.'),
      nextAt !== undefined && h('p', {}, `Next ticket around ${clockText(nextAt)}.`),
      canClockOut(state) && h('button', {
        class: 'btn primary', 'data-testid': 'clock-out', 'data-autofocus': true, onclick: () => app.set(clockOut(state)),
      }, 'Clock out early')),
  );
}

function runbookBox(s: GameState, t: Ticket): HTMLElement {
  const issue = issueOf(t);
  const status = s.runbook[issue.id];
  const yours = status === 'yours';
  const text = yours ? issue.notes.find((n) => n.right)?.text : issue.page.text;
  return h('section', { class: `runbook-box${yours ? ' yours' : ''}`, 'data-testid': 'runbook-box' },
    h('h3', { class: 'small-heading' }, yours ? 'Known issue: your note' : status === 'missing' ? 'Runbook: page missing' : 'Old runbook says'),
    h('p', {}, `${issue.title}. ${text}`));
}

function ticketView(app: App, t: Ticket): HTMLElement {
  const { state } = app;
  const st = ticketState(state, t.id);
  const v = VILLAGERS[t.who];
  const issue = issueOf(t);
  const bond = relation(state, t.who);
  const known = isKnown(state, t);
  const [first, ...later] = st.messages;
  // Alphabetical, so the right answer isn't always in the same spot.
  const fixes = issue.fixes.filter((f) => !st.tried.includes(f.id)).sort((a, b) => a.label.localeCompare(b.label));
  const choice = (props: Record<string, string | boolean | (() => void)>, title: string, detail: string) =>
    h('button', { class: 'btn choice', ...props }, h('strong', {}, title), h('span', {}, detail));

  return h('article', { class: 'ticket-view', 'aria-label': `Ticket: ${t.title}` },
    h('div', { class: 'ticket-info' },
    h('header', { class: 'ticket-head' },
      h('div', {},
        h('h2', {}, t.title),
        h('p', { class: 'meta' }, `${t.via === 'walkup' ? 'Walked up to your desk' : 'From the tray'}. ${PRIORITY[t.priority]}.`)),
      h('span', { class: `status-pill ${st.status}`, 'data-testid': 'status' }, STATUS[st.status])),
    h('div', { class: 'who' },
      h('img', { class: 'sprite', src: face(v, st.mood), alt: `${v.name} the ${v.species}, looking ${moodName(st.mood).toLowerCase()}` }),
      h('div', {},
        h('h3', { class: 'who-name' }, v.name),
        h('div', { class: 'badges' },
          h('span', { class: `mood mood-${st.mood}`, 'data-testid': 'mood' }, moodName(st.mood)),
          bond !== 'neutral' && h('span', { class: `bond ${bond}`, 'data-testid': 'bond' }, bond === 'friend' ? '♥ Friend' : 'Nemesis')),
        h('p', { class: `due${urgent(state, t.id) ? ' urgent' : ''}`, 'data-due': t.id, 'data-testid': 'due' }, dueText(state, t.id)))),
    first && h('p', { class: 'opening msg them', 'data-testid': 'opening' },
      h('span', { class: 'msg-meta' }, `${v.name}, ${clockText(first.at)}`), h('span', {}, first.text)),
    t.details.length > 0 && h('dl', { class: 'details', 'data-testid': 'details' }, ...t.details.flatMap((d) => [h('dt', {}, d.label), h('dd', {}, d.text)])),
    runbookBox(state, t),
    later.length > 0 && h('h3', { class: 'small-heading' }, 'Since then'),
    h('ol', { class: 'conversation', 'aria-label': 'Conversation since then', 'data-testid': 'conversation' }, ...later.map((m) =>
      h('li', { class: `msg ${m.from}` },
        h('span', { class: 'msg-meta' }, `${m.from === 'you' ? 'You' : v.name}, ${clockText(m.at)}`),
        h('span', {}, m.text)))),
    ),
    h('section', { class: 'decide', 'aria-label': 'What do you do?' },
      state.notice?.ticketId === t.id && h('p', { class: 'notice', role: 'alert', 'data-testid': 'notice' }, state.notice.text),
      h('button', { class: 'btn primary send', 'data-testid': 'reply', 'data-autofocus': true, onclick: () => app.set(reply(state, t.id)) },
        st.status === 'new' ? 'Send first reply' : 'Send an update'),
      h('div', { class: 'fixes', role: 'group', 'aria-labelledby': 'fix-heading' },
        h('h3', { id: 'fix-heading', class: 'small-heading' }, 'Fix it'),
        ...fixes.map((f) => h('button', {
          class: `btn fix${known && f.id === issue.correctFix ? ' from-note' : ''}`, 'data-testid': `fix-${f.id}`,
          onclick: () => app.set(fix(state, t.id, f.id)),
        }, f.label, known && f.id === issue.correctFix && h('span', { class: 'from-note-tag' }, 'Your note says this')))),
      h('div', { class: 'row' },
        choice({ 'data-testid': 'workaround', disabled: !canWorkaround(state, t.id), onclick: () => app.set(workaround(state, t.id)) },
          'Give them something', canWorkaround(state, t.id) ? t.workaround : 'They won’t take a workaround again'),
        choice({ 'data-testid': 'push', disabled: !canPush(state, t.id), onclick: () => app.set(pushBack(state, t.id)) },
          'Set to pending', canPush(state, t.id)
            ? `Back tomorrow. ${MAX_PUSHES - st.pushes} left`
            : 'Not again: they’d go to the manager'))),
  );
}

function outcomeCard(app: App, o: Outcome): HTMLElement {
  const { state } = app;
  const t = ticketById(o.ticketId);
  const v = VILLAGERS[t.who];
  const issue = issueOf(t);
  const headline = { fix: 'Resolved!', workaround: 'Good enough for now', push: 'Set to pending', storm: `${v.name} storms off` }[o.kind];
  const body = {
    fix: issue.why,
    workaround: `${v.name} is happy for now. It’ll probably come back in ${WORKAROUND_RETURNS_AFTER} days. Fix it properly to learn what was really wrong.`,
    push: `${v.name} sighs and shuffles off. They’ll be back tomorrow, grumpier.`,
    storm: `${v.name} has had enough and goes straight to Mr. Grisby to complain. No experience, and it’s on your day report. Send updates so people know you haven’t forgotten them.`,
  }[o.kind];
  const canNote = o.kind === 'fix' && !o.noted && state.runbook[issue.id] !== 'yours';
  return h('div', { class: 'overlay' },
    h('section', { class: `outcome ${o.kind}`, role: 'dialog', 'aria-labelledby': 'outcome-title', 'data-testid': 'outcome' },
      h('h2', { id: 'outcome-title' }, headline),
      o.xp > 0 && h('p', { class: 'xp' }, `+${o.xp} ${SKILL_NAMES[issue.skill]} XP`),
      h('p', {}, body),
      canNote && h('div', { class: 'note-pick', role: 'group', 'aria-labelledby': 'note-heading' },
        h('h3', { id: 'note-heading' }, 'Internal note: what caused it?'),
        h('p', { class: 'meta' }, 'Only you see this. The right note becomes your runbook page, so next time it’s a known issue.'),
        ...issue.notes.map((n, i) => h('button', {
          class: `btn note${o.wrongNote === i ? ' wrong' : ''}`, 'data-testid': `note-${i}`, disabled: o.wrongNote === i,
          'data-autofocus': i === 0, onclick: () => app.set(writeNote(state, i)),
        }, n.text)),
        o.wrongNote !== undefined && h('p', { class: 'notice', role: 'alert' }, 'That’s not what fixed it. Try another.')),
      o.noted && h('p', { class: 'stamp', 'data-testid': 'noted' }, '✎ Saved to your runbook.'),
      h('button', {
        class: `btn${canNote ? '' : ' primary'}`, 'data-testid': 'next', 'data-autofocus': !canNote,
        onclick: () => app.set(next(state)),
      }, canNote ? 'Skip the note' : 'Next')),
  );
}

export function deskScreen(app: App): HTMLElement {
  const { state, ui } = app;
  if (!ui.selected || !state.queue.includes(ui.selected)) ui.selected = state.queue[0];
  const t = ui.selected ? ticketById(ui.selected) : undefined;
  const outcome = state.outcomes[0];
  return h('main', { class: 'screen desk', 'data-testid': 'desk' },
    statusBar(app),
    h('div', { class: 'desk-body' },
      queueList(app, ui.selected),
      t ? ticketView(app, t) : h('section', { class: 'ticket-view empty-view' }, h('p', {}, 'Pick a ticket from the queue when one comes in.'))),
    ui.paused && !outcome && h('div', { class: 'overlay' },
      h('section', { class: 'outcome', role: 'dialog', 'aria-label': 'Paused', 'data-testid': 'paused' },
        h('h2', {}, 'Paused'),
        h('p', {}, 'The office clock has stopped. Take your time.'),
        h('button', { class: 'btn primary', 'data-autofocus': true, onclick: () => { ui.paused = false; app.rerender(); } }, 'Resume'))),
    outcome && outcomeCard(app, outcome),
    ui.panel && panel(app, ui.panel));
}
