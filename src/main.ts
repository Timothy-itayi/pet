import './style.css';
import { GAME_MINUTES_PER_SECOND } from './features/game/data.ts';
import { newGame, tick, type GameState } from './features/game/rules.ts';
import { loadGame, saveGame } from './features/save/save.ts';
import type { App } from './features/ui/app.ts';
import { bootScreen } from './features/ui/boot.ts';
import { deskScreen, refreshTimes } from './features/ui/desk.ts';
import { desktopScreen } from './features/ui/desktop.ts';
import { dayEndScreen, endingScreen } from './features/ui/endings.ts';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app');
const saved = loadGame();

const app: App = {
  state: saved ?? newGame(),
  ui: { booted: false, paused: false },
  hasSave: saved !== undefined,
  set(next) {
    if (next.phase !== app.state.phase) app.ui.panel = undefined;
    app.state = next;
    saveGame(next);
    app.rerender();
  },
  rerender() {
    const { phase } = app.state;
    const screen =
      !app.ui.booted || phase === 'boot' ? bootScreen(app)
      : phase === 'desktop' ? desktopScreen(app)
      : phase === 'desk' ? deskScreen(app)
      : phase === 'dayEnd' ? dayEndScreen(app)
      : endingScreen(app);
    // Re-rendering drops focus: keep it on the same control if it still exists, else the screen's main action.
    const was = (document.activeElement as HTMLElement | null)?.dataset.testid;
    root.replaceChildren(screen);
    const same = was ? screen.querySelector<HTMLElement>(`[data-testid="${was}"]:not(:disabled)`) : null;
    const dialog = screen.querySelector<HTMLElement>('[role="dialog"] [data-autofocus]');
    (dialog ?? same ?? screen.querySelector<HTMLElement>('[data-autofocus]'))?.focus();
  },
  refreshTimes() {
    refreshTimes(root, app.state);
  },
};

/** Did this tick change more than the clock? Then redraw; otherwise just move the times on. */
const bigChange = (a: GameState, b: GameState) =>
  a.phase !== b.phase || a.outcomes.length !== b.outcomes.length || a.queue.join() !== b.queue.join() ||
  a.floor.join() !== b.floor.join() || a.today.missed !== b.today.missed;

// The office clock: it only runs at the desk, and stops while paused, reading a window, or in another tab.
setInterval(() => {
  if (!app.ui.booted || app.ui.paused || app.ui.panel || document.hidden) return;
  const next = tick(app.state, GAME_MINUTES_PER_SECOND);
  if (next === app.state) return;
  if (bigChange(app.state, next)) { app.set(next); return; }
  app.state = next;
  saveGame(next);
  app.refreshTimes();
}, 1000);

app.rerender();
