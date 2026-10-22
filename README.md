# pet

You're an unpaid IT intern at a company that's falling apart. Fix their printers, survive your manager, and get hired somewhere better.

A small browser game for people getting into IT. Each day your old computer boots up, your manager sends a memo, and coworkers bring you problems. Find the two things that don't add up, then fix it, give them a workaround, or push it back (twice at most). Experience fills your résumé; the job board is your way out.

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

- `src/features/game/data.ts`: all content (tickets, runbook pages, manager lines, jobs). Add a ticket here; no code changes needed.
- `src/features/game/rules.ts`: the game rules, tested in `rules.test.ts`.
- `src/features/ui/`: the screens (boot, desktop, desk, day end, endings).
- `src/features/art/sprites.ts`: the pixel-art animal faces.
