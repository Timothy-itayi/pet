import { parseSave, type GameState } from '../game/rules.ts';

const KEY = 'pet-save-v1';

// Storage can be missing or throw (private windows, blocked site data); the game still runs without it.
export function loadGame(): GameState | undefined {
  try {
    return parseSave(localStorage.getItem(KEY));
  } catch {
    return undefined;
  }
}

export function saveGame(s: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* not saved; nothing else to do */
  }
}
