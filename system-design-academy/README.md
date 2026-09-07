# System Design Academy

Interactive ops game for learning system design: **incident → architecture choices → load test → consequences → lesson → unlock**.

Inspired by the atlas feel of [Pattern Garden](https://designpatterns.guru).

## Run

```bash
cd system-design-academy
npm install
npm run dev
npm test
```

## Layout

- `src/engine/` — pure TS simulation (no React)
- `src/data/components/` — component catalog
- `src/data/scenarios/` — L01–L20 playable + L021–L120 skeleton
- `src/data/quizzes/` — scenario quizzes
- `src/data/library/` — book/doc notes with challenge links
- `src/modes/` — Ops / Quiz / Library UI
- `src/progress/` — localStorage XP & unlocks

## Add a level

1. Add a `Scenario` in `src/data/scenarios/playable.ts` (or new file exported from `campaign.ts`)
2. Register components in the catalog if needed
3. Cover the recommended architecture with a vitest case

Pass rule: **SLO-first** within cost/complexity budgets. Stars reward lean designs.
