# pet

You're an unpaid IT intern at a company that's falling apart. Fix their printers, survive your manager, and get hired somewhere better.

A small browser game for people getting into IT. Each day your old computer boots up, your manager sends a memo, and coworkers' problems land in your ticket queue while the office clock runs from 9 to 5. Read what they say and what's on their screen, keep them updated before their reply-by time runs out, and fix it, give them a workaround, or set it to pending. You can also leave your computer to walk the office floor, where people flag you down with no ticket: help them on the spot (your manager won't count it), or ask them to submit a ticket (they won't like it). After each fix, write an internal note: the right one becomes your runbook page, so the same problem is a known issue next time. Experience fills your résumé; the job board is your way out.

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
- `src/features/ui/`: the screens (boot, desktop, desk, day end, endings).
- `src/features/art/sprites.ts`: the pixel-art animal faces.
