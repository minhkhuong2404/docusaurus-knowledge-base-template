import { Link, NavLink, Outlet } from 'react-router-dom'
import { useProgress } from '../progress/useProgress'

export function AppShell() {
  const xp = useProgress((s) => s.xp)

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="display text-xl text-[var(--accent)]">
            System Design Academy
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-[var(--muted)]">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? 'text-[var(--ink)]' : 'hover:text-[var(--ink)]'
              }
            >
              Campaign
            </NavLink>
            <NavLink
              to="/quiz"
              className={({ isActive }) =>
                isActive ? 'text-[var(--ink)]' : 'hover:text-[var(--ink)]'
              }
            >
              Quiz
            </NavLink>
            <NavLink
              to="/library"
              className={({ isActive }) =>
                isActive ? 'text-[var(--ink)]' : 'hover:text-[var(--ink)]'
              }
            >
              Library
            </NavLink>
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[var(--accent)]">
              {xp} XP
            </span>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
