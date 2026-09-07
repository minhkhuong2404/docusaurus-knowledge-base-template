---
name: book-journey
description: Turn a book under docs/books into a gamified journey — Pareto flashcards with notes, summary, optional review quizzes, mandatory final exam, badges, journey map.
---

# Book Journey Skill

## Goal

Given chapter markdown under `docs/books/<book>/chapters/`, produce:

1. Journey config + flashcards + question banks in `src/data/journeys/<book>/`
2. `journey.mdx` roadmap page
3. Practice MDX pages under `docs/books/<book>/practice/`
4. Sidebar sections: **Journey** | **Read** | **Practice**

## Per-chapter pipeline

```
Flashcards (Pareto 20%→90% + take notes)
  → Summary
  → Review Easy/Medium/Hard (optional)
  → Final Exam (mandatory, ask→answer→check→explain)
  → Badge when all cards flipped AND final ≥ 80%
```

## Steps

1. **Catalog chapters** — titles, `docPath`, badge name, skill blurb, `reflectionSummary`.
2. **Flashcards** — map major sections to `ChapterFlashcard` (`id`, `section`, `front`, `back`, `notes`). Distill the exam core (rules, traps, tables), not the whole chapter.
3. **Summary** — one paragraph from Exam Quick Reference / key rules.
4. **Review banks** — MCQs from chapter body (easy/medium/hard); optional for the learner.
5. **Final exam** — MCQs from end-of-chapter Review Questions Focus / Extra Exam Tips; every item needs an explanation.
6. **Create** `journey.ts` implementing `BookJourney` from `src/data/journeys/types.ts` (include `flashcards: []` default for unfinished chapters).
7. **Pages** — `journey.mdx` + `practice/chapter-NN.mdx` with `<ChapterJourneyPage />`.
8. **Sidebar** — Journey | Read | Practice.
9. **Trackable filter** — `/practice/`, journey map, and `journey:` keys stay non-articles (`trackablePages.ts`).
10. **Verify** — `npx tsx src/components/BookJourney/journeyProgress.selfcheck.ts`.

## Badge rules (do not change)

- Unlock Summary / Review / Final only after **all flashcards flipped** (per-card keys `journey:<book>:<ch>:card:<id>`).
- Badge = all cards flipped + final exam score ≥ 80% (`JOURNEY_PASS_THRESHOLD`).
- Reviews never gate the badge.
- Book skill unlocks when all chapter badges are earned (derived, not stored).

## OCP follow-up

Fill flashcards + banks for chapters 4–14 the same way as 01–03; add practice MDX + sidebar entries.
