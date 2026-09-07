import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QUIZZES } from '../../data/quizzes/sets'
import { useProgress } from '../../progress/useProgress'

export function QuizHome() {
  const quizzes = useProgress((s) => s.quizzes)
  return (
    <div className="space-y-4">
      <h1 className="display text-3xl">Scenario quizzes</h1>
      <p className="text-[var(--muted)]">
        Incident-style questions mined from system design practice — not glossary drills.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {QUIZZES.map((q) => {
          const done = quizzes[q.id]
          return (
            <Link
              key={q.id}
              to={`/quiz/${q.id}`}
              className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-sm"
            >
              <h2 className="display text-xl">{q.title}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {q.questions.length} questions · {q.xp} XP
                {q.relatedLevel ? ` · pairs with ${q.relatedLevel}` : ''}
              </p>
              {done && (
                <p className="mt-2 text-sm text-[var(--accent)]">
                  Best {done.score}/{done.total}
                </p>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function QuizPlay() {
  const { quizId = '' } = useParams()
  const quiz = QUIZZES.find((q) => q.id === quizId)
  const completeQuiz = useProgress((s) => s.completeQuiz)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const score = useMemo(() => {
    if (!quiz) return 0
    return quiz.questions.reduce(
      (acc, q) => acc + (answers[q.id] === q.answerIndex ? 1 : 0),
      0,
    )
  }, [answers, quiz])

  if (!quiz) return <p>Quiz not found.</p>

  return (
    <div className="space-y-4">
      <Link to="/quiz" className="text-sm text-[var(--muted)]">
        All quizzes
      </Link>
      <h1 className="display text-3xl">{quiz.title}</h1>
      {quiz.questions.map((q, idx) => (
        <div
          key={q.id}
          className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4"
        >
          <p className="font-semibold">
            {idx + 1}. {q.stem}
          </p>
          <div className="mt-3 space-y-2">
            {q.choices.map((c, i) => {
              const selected = answers[q.id] === i
              const correct = submitted && i === q.answerIndex
              const wrong = submitted && selected && i !== q.answerIndex
              return (
                <button
                  key={c}
                  type="button"
                  disabled={submitted}
                  onClick={() => setAnswers({ ...answers, [q.id]: i })}
                  className={`block w-full rounded-xl border px-3 py-2 text-left text-sm ${
                    correct
                      ? 'border-[var(--good)] bg-[var(--accent-soft)]'
                      : wrong
                        ? 'border-[var(--danger)]'
                        : selected
                          ? 'border-[var(--accent)]'
                          : 'border-[var(--line)]'
                  }`}
                >
                  {c}
                </button>
              )
            })}
          </div>
          {submitted && (
            <p className="mt-2 text-sm text-[var(--muted)]">{q.explain}</p>
          )}
        </div>
      ))}
      {!submitted ? (
        <button
          type="button"
          disabled={Object.keys(answers).length < quiz.questions.length}
          onClick={() => {
            const finalScore = quiz.questions.reduce(
              (acc, q) => acc + (answers[q.id] === q.answerIndex ? 1 : 0),
              0,
            )
            setSubmitted(true)
            completeQuiz(quiz.id, finalScore, quiz.questions.length, quiz.xp)
          }}
          className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Submit
        </button>
      ) : (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
          <p className="display text-xl">
            Score {score}/{quiz.questions.length}
          </p>
          {quiz.relatedLevel && (
            <Link
              to={`/ops/${quiz.relatedLevel}`}
              className="mt-3 inline-block text-[var(--accent)]"
            >
              Jump to related incident {quiz.relatedLevel}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
