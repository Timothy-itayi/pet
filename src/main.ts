import './style.css';
import { newGame } from './features/game/rules.ts';
import { loadGame, saveGame } from './features/save/save.ts';
import type { App } from './features/ui/app.ts';
import { bootScreen } from './features/ui/boot.ts';
import { deskScreen } from './features/ui/desk.ts';
import { desktopScreen } from './features/ui/desktop.ts';
import { dayEndScreen, endingScreen } from './features/ui/endings.ts';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app');
const saved = loadGame();

const app: App = {
  state: saved ?? newGame(),
  ui: { booted: false, picked: [] },
  hasSave: saved !== undefined,
  set(next) {
    if (next.phase !== app.state.phase) app.ui.panel = undefined;
    app.state = next;
    app.ui.picked = [];
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
};

app.rerender();
