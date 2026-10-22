# pet

You're an unpaid IT intern at a company that's falling apart. Fix their printers, survive your manager, and get hired somewhere better.

A small browser game for people getting into IT. You've inherited Sam's desk: Sam kept the whole place running for six years, then quit, leaving sticky notes and a runbook that's mostly wrong. Each morning you switch on the old computer, log in, and work the ticket queue while the office clock runs from 9 to 5. Company policy says you keep people updated. Some people don't bother with tickets at all: they walk up and lead you across the office to their problem, and you follow them on a top-down map. You can also walk the office floor yourself, where people flag you down for help your manager will never count. Fix things, write internal notes so the same problem is quicker next time, and build a résumé good enough to get out.

## Play it locally

```bash
pnpm install
pnpm dev
```

## Checks

```bash
pnpm test    # game rules
pnpm lint
pnpm build   # also type-checks
```

## Where things live

- `src/features/game/tickets.ts`: the problems (issues) and the tickets that bring them. Add a ticket here; no code changes needed.
- `src/features/game/data.ts`: characters, manager lines, jobs, and the clock and timer settings.
- `src/features/game/rules.ts`: the game rules, tested in `rules.test.ts`.
- `src/features/ui/`: the screens (Sam's desk and login, desktop, help desk, day end, endings).
- `src/features/floor/`: the office map you walk around (`map.ts` is the layout, `world.ts` draws it and moves people).
- `src/features/art/sprites.ts`: the pixel-art animal faces.
