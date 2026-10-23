import { MAX_PUSHES, VILLAGERS, WORKAROUND_RETURNS_AFTER } from '../game/data.ts';
import {
  canPush, canWorkaround, fix, isKnown, issueOf, minutesLeft, moodName, next, noteTarget, pushBack,
  relation, reply, scriptFor, ticketById, ticketState, toolFor, workaround, writeNote, type GameState, type Outcome, type Status,
} from '../game/rules.ts';
import type { Ticket } from '../game/types.ts';
import { face } from '../art/sprites.ts';
import type { App } from './app.ts';
import { openApp } from './desktop.ts';
import { clockText, h } from './dom.ts';
import { SKILL_NAMES } from './panels.ts';

const STATUS: Record<Status, string> = { new: 'New', open: 'Open', pending: 'Pending', resolved: 'Resolved' };
const PRIORITY = { low: 'Low priority', normal: 'Normal priority', high: 'High priority' } as const;

/** "Reply by 10:50 (8 min)" or "Overdue": the countdown that drives everyone's mood. */
export function dueText(s: GameState, id: string): string {
  const left = minutesLeft(s, id);
  return left > 0 ? `Reply by ${clockText(ticketState(s, id).due)} (${left} min)` : 'Overdue';
}
export const urgent = (s: GameState, id: string) => minutesLeft(s, id) <= 10;

/** Keeps the clock and countdowns moving between full redraws. */
export function refreshTimes(root: HTMLElement, s: GameState): void {
  root.querySelectorAll<HTMLElement>('[data-clock]').forEach((el) => { el.textContent = clockText(s.clock); });
  root.querySelectorAll<HTMLElement>('[data-due]').forEach((el) => {
    const id = el.dataset.due ?? '';
    if (!s.queue.includes(id) && !s.chats.includes(id)) return;
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
    h('span', { 'data-testid': 'goal' }, `Tickets resolved ${state.today.resolved}/${scriptFor(state.day).goal}`),
    state.escort && h('span', { class: 'where-you-are' }, `With ${VILLAGERS[ticketById(state.escort).who].name}`),
    state.place === 'computer' && h('button', { class: 'btn small', onclick: () => openApp(app, 'runbook') }, 'Runbook'),
    state.place === 'computer' && h('button', { class: 'btn small', 'data-testid': 'open-directory', onclick: () => openApp(app, 'directory') }, 'Active Directory'),
  );
}

/** The left of the Service Desk: your ticket queue. People who message you instead are in Burrow Chat. */
function sidebar(app: App): HTMLElement {
  const { state } = app;
  return h('nav', { class: 'queue', 'aria-label': 'Ticket queue' },
    h('h2', { class: 'small-heading queue-title' }, `Tickets (${state.queue.length})`),
    ...ticketList(app));
}

function ticketList(app: App): HTMLElement[] {
  const { state, ui } = app;
  if (!state.queue.length) return [h('p', { class: 'queue-empty' }, 'Nothing in your queue right now. The printer hums ominously.')];
  return state.queue.map((id) => {
    const t = ticketById(id);
    const st = ticketState(state, id);
    const v = VILLAGERS[t.who];
    return h('button', {
      class: `queue-item${id === ui.selected ? ' selected' : ''}`, 'data-testid': `queue-${id}`,
      'aria-current': id === ui.selected ? 'true' : false,
      onclick: () => { ui.selected = id; app.rerender(); },
    },
      h('img', { class: 'sprite tiny', src: face(v, st.mood), alt: '' }),
      h('span', { class: 'queue-text' },
        h('strong', {}, t.title),
        h('span', {}, `${v.name}, ${moodName(st.mood).toLowerCase()}. ${STATUS[st.status]}.`),
        h('span', { class: `due${urgent(state, id) ? ' urgent' : ''}`, 'data-due': id }, dueText(state, id))));
  });
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

export function ticketView(app: App, t: Ticket): HTMLElement {
  const { state } = app;
  const st = ticketState(state, t.id);
  const v = VILLAGERS[t.who];
  const issue = issueOf(t);
  const bond = relation(state, t.who);
  const known = isKnown(state, t);
  const tool = toolFor(state, t);
  const [first, ...later] = st.messages;
  const helping = state.escort === t.id;
  // Alphabetical, so the right answer isn't always in the same spot.
  const fixes = issue.fixes.filter((f) => !st.tried.includes(f.id)).sort((a, b) => a.label.localeCompare(b.label));
  const choice = (props: Record<string, string | boolean | (() => void)>, title: string, detail: string) =>
    h('button', { class: 'btn choice', ...props }, h('strong', {}, title), h('span', {}, detail));

  return h('article', { class: 'ticket-view', 'aria-label': `Ticket: ${t.title}` },
    h('div', { class: 'ticket-info' },
    h('header', { class: 'ticket-head' },
      h('div', {},
        h('h2', {}, t.title),
        h('p', { class: 'meta' }, helping ? `Messaged you on chat. You went over to the ${t.where?.toLowerCase() ?? 'office'}. No ticket.`
          : `${t.via === 'tray' ? 'From the tray' : 'Logged after you asked'}. ${PRIORITY[t.priority]}.`)),
      !helping && h('span', { class: `status-pill ${st.status}`, 'data-testid': 'status' }, STATUS[st.status])),
    h('div', { class: 'who' },
      h('img', { class: 'sprite', src: face(v, st.mood), alt: `${v.name} the ${v.species}, looking ${moodName(st.mood).toLowerCase()}` }),
      h('div', {},
        h('h3', { class: 'who-name' }, v.name),
        h('div', { class: 'badges' },
          h('span', { class: `mood mood-${st.mood}`, 'data-testid': 'mood' }, moodName(st.mood)),
          bond !== 'neutral' && h('span', { class: `bond ${bond}`, 'data-testid': 'bond' }, bond === 'friend' ? '♥ Friend' : 'Nemesis')),
        helping ? h('p', { class: 'due' }, 'They\u2019re right here with you.')
          : h('p', { class: `due${urgent(state, t.id) ? ' urgent' : ''}`, 'data-due': t.id, 'data-testid': 'due' }, dueText(state, t.id)))),
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
      state.place === 'computer' && h('button', { class: 'btn primary send', 'data-testid': 'reply', 'data-autofocus': true, onclick: () => app.set(reply(state, t.id)) },
        st.status === 'new' ? 'Send first reply' : 'Send an update'),
      h('div', { class: 'fixes', role: 'group', 'aria-labelledby': 'fix-heading' },
        h('h3', { id: 'fix-heading', class: 'small-heading' }, 'Fix it'),
        tool && h('button', { class: 'btn fix from-tool', 'data-testid': 'fix-tool', onclick: () => app.set(fix(state, t.id, 'tool')) },
          tool.fixLabel, h('span', { class: 'from-note-tag' }, state.runbook[`tool:${tool.id}`] === 'yours' ? tool.name : `${tool.name}: not in the runbook yet`)),
        // Account tickets are fixed in Active Directory; here you open it on their account, then ask them to try again.
        issue.console && h('p', { class: 'meta' }, 'Sort out their account in Active Directory, then ask them to try again.'),
        issue.console && h('button', {
          class: 'btn fix', 'data-testid': 'open-registry',
          onclick: () => { Object.assign(app.ui, { dirOu: undefined, dirUser: t.who, dirReset: undefined, dirSaid: undefined }); openApp(app, 'directory'); },
        }, 'Open Active Directory on their account'),
        issue.console && h('button', { class: `btn fix${known ? ' from-note' : ''}`, 'data-testid': 'fix-console', onclick: () => app.set(fix(state, t.id, 'console')) },
          'Ask them to try signing in again', known && h('span', { class: 'from-note-tag' }, 'Your note says how')),
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

export function outcomeCard(app: App, o: Outcome): HTMLElement {
  const { state } = app;
  const t = ticketById(o.ticketId);
  const v = VILLAGERS[t.who];
  const issue = issueOf(t);
  const headline = {
    fix: 'Resolved!', workaround: 'Good enough for now', push: 'Set to pending', storm: `${v.name} storms off`,
    asked: 'Please log a ticket',
  }[o.kind];
  const uncounted = o.kind === 'fix' && t.via !== 'tray' && !ticketState(state, t.id).logged;
  const body = {
    fix: issue.why,
    workaround: `${v.name} is happy for now. It’ll probably come back in ${WORKAROUND_RETURNS_AFTER} days. Fix it properly to learn what was really wrong.`,
    push: `${v.name} sighs and shuffles off. They’ll be back tomorrow, grumpier.`,
    asked: `${v.name} rolls their eyes and heads back to their desk to fill one in. It\u2019ll land in your queue soon, a bit grumpier, and this time Mr. Grisby will count it.`,
    storm: `${v.name} has had enough and goes straight to Mr. Grisby to complain. No experience, and it’s on your day report. Send updates so people know you haven’t forgotten them.`,
  }[o.kind];
  const target = noteTarget(state, o);
  const canNote = Boolean(target);
  return h('div', { class: 'overlay' },
    h('section', { class: `outcome ${o.kind}`, role: 'dialog', 'aria-labelledby': 'outcome-title', 'data-testid': 'outcome' },
      h('h2', { id: 'outcome-title' }, headline),
      o.xp > 0 && h('p', { class: 'xp' }, `+${o.xp} ${SKILL_NAMES[issue.skill]} XP`),
      h('p', {}, body),
      uncounted && h('p', { class: 'meta', 'data-testid': 'uncounted' }, `No ticket, so Mr. Grisby won\u2019t count this one. ${v.name} will remember, though.`),
      target && h('div', { class: 'note-pick', role: 'group', 'aria-labelledby': 'note-heading' },
        o.tool
          ? h('h3', { id: 'note-heading' }, `New runbook page: ${target.title}. What does it do?`)
          : h('h3', { id: 'note-heading' }, 'Internal note: what caused it?'),
        h('p', { class: 'meta' }, o.tool
          ? 'It isn\u2019t in the runbook. Write it up so the next person knows.'
          : 'Only you see this. The right note becomes your runbook page, so next time it\u2019s a known issue.'),
        ...target.notes.map((n, i) => h('button', {
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

export const pausedCard = (app: App) => h('div', { class: 'overlay' },
  h('section', { class: 'outcome', role: 'dialog', 'aria-label': 'Paused', 'data-testid': 'paused' },
    h('h2', {}, 'Paused'),
    h('p', {}, 'The office clock has stopped. Take your time.'),
    h('button', { class: 'btn primary', 'data-autofocus': true, onclick: () => { app.ui.paused = false; app.rerender(); } }, 'Resume')));

/** The Service Desk app, in its window: your queue on the left, the ticket you've picked on the right. */
export function serviceDesk(app: App): HTMLElement {
  const { state, ui } = app;
  if (state.phase !== 'desk') return h('div', { class: 'desk-closed' }, h('p', {}, 'The service desk is closed. Nobody\u2019s in on a Saturday. Not even Mr. Grisby.'));
  if (!ui.selected || !state.queue.includes(ui.selected)) ui.selected = state.queue[0];
  const id = ui.selected;
  return h('div', { class: 'desk', 'data-testid': 'desk' },
    statusBar(app),
    h('div', { class: 'desk-body' },
      sidebar(app),
      id ? ticketView(app, ticketById(id)) : h('section', { class: 'ticket-view empty-view' }, h('p', {}, 'Your queue is empty. Check back soon.'))));
}

/** Helping someone in person, away from your computer: the whole screen. */
export const deskScreen = (app: App) => onSiteScreen(app);

/** Away from your computer, helping someone in person: you followed them to their desk, and here's the problem. */
function onSiteScreen(app: App): HTMLElement {
  const { state, ui } = app;
  const id = state.escort;
  const outcome = state.outcomes[0];
  const t = id ? ticketById(id) : undefined;
  return h('main', { class: 'screen desk on-site', 'data-testid': 'desk' },
    statusBar(app),
    t && h('div', { class: 'floor-talk' }, ticketView(app, t)),
    // A moment of walking over, before you see the problem.
    t && h('div', { class: 'walk-over', 'aria-hidden': 'true' },
      h('p', {}, `You follow ${VILLAGERS[t.who].name} to the ${t.where?.toLowerCase() ?? 'office'}\u2026`)),
    ui.paused && !outcome && pausedCard(app),
    outcome && outcomeCard(app, outcome));
}
