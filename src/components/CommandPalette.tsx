import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useHistory } from '@docusaurus/router';

export interface CommandPaletteItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Interactive' | 'Learning Path' | 'Diagram';
  href: string;
  keywords?: string;
}

const STATIC_COMMANDS: CommandPaletteItem[] = [
  { id: 'app-diagrams', title: 'Interactive Diagram Atlas', subtitle: 'Browse 750+ animated architecture & protocol diagrams', category: 'Interactive', href: '/diagrams', keywords: 'svg visual charts architecture' },
  { id: 'app-arcade', title: 'Engineering Arcade', subtitle: '5 games: Outage Boss, Architecture Puzzle, SQL Optimizer, Bug Duel, Flashcards', category: 'Interactive', href: '/arcade', keywords: 'games xp practice quiz' },
  { id: 'app-mock', title: 'Mock Interview Studio', subtitle: 'Interactive system design & senior engineering mock interviews', category: 'Interactive', href: '/mock-interview', keywords: 'interview simulation practice' },
  { id: 'app-hub', title: 'Career Hub', subtitle: 'Senior interview playbooks, code battles & career strategy', category: 'Interactive', href: '/hub', keywords: 'career senior staff' },
  { id: 'app-english', title: 'Tech English & Acronyms', subtitle: 'Master technical vocabulary, pronunciation & engineering acronyms', category: 'Interactive', href: '/tech-english', keywords: 'vocabulary glossary' },
  { id: 'app-leaderboard', title: 'Cosmic Leaderboard', subtitle: 'Global XP rankings, streaks & cosmic engineer ranks', category: 'Interactive', href: '/leaderboard', keywords: 'rank xp streak' },
  { id: 'app-profile', title: 'My Profile & Progress', subtitle: 'View completed articles, streaks, achievements & stats', category: 'Interactive', href: '/profile', keywords: 'stats progress' },
  { id: 'path-java', title: 'Java & JVM', subtitle: 'Fundamentals, OOP, collections, JVM internals, concurrency', category: 'Learning Path', href: '/technical-knowledge/java/java-overview' },
  { id: 'path-spring', title: 'Spring & Spring Boot', subtitle: 'Boot, Data JPA, Security, Cloud, Batch', category: 'Learning Path', href: '/technical-knowledge/spring/spring-overview' },
  { id: 'path-sd', title: 'System Design', subtitle: 'Distributed systems, CAP, caching, API design, scaling', category: 'Learning Path', href: '/system-design' },
  { id: 'path-db', title: 'Database Internals', subtitle: 'ACID, B+Tree, MVCC, WAL, transactions, replication, NoSQL', category: 'Learning Path', href: '/technical-knowledge/database/' },
  { id: 'path-kafka', title: 'Kafka & Streaming', subtitle: 'Topics, partitions, consumers, EOS, Kafka Streams', category: 'Learning Path', href: '/technical-knowledge/kafka/intro' },
  { id: 'path-redis', title: 'Redis & Caching', subtitle: 'Data structures, pub/sub, caching patterns, Lua scripting', category: 'Learning Path', href: '/technical-knowledge/redis/redis-overview' },
  { id: 'path-patterns', title: 'Design Patterns', subtitle: 'Creational, structural, behavioral GoF patterns', category: 'Learning Path', href: '/technical-knowledge/design-patterns/design-patterns-overview' },
  { id: 'path-security', title: 'Security & Auth', subtitle: 'OAuth2, OIDC, JWT, JWE, OWASP, zero trust', category: 'Learning Path', href: '/security' },
  { id: 'path-networking', title: 'Networking & Protocols', subtitle: 'TCP/IP, DNS, TLS 1.3, HTTP/2, HTTP/3, gRPC, QUIC', category: 'Learning Path', href: '/technical-knowledge/networking/' },
  { id: 'path-devops', title: 'DevOps & Kubernetes', subtitle: 'Docker, Kubernetes networking, CI/CD pipelines', category: 'Learning Path', href: '/devops' },
  { id: 'path-aws', title: 'AWS Cloud (DVA-C02)', subtitle: 'Lambda, DynamoDB, S3, IAM, ECS, certification prep', category: 'Learning Path', href: '/aws' },
  { id: 'path-banking', title: 'Banking & Payments', subtitle: 'Payments, SWIFT, NPP, FX, AML/KYC, core banking', category: 'Learning Path', href: '/banking' },
  { id: 'path-dsa', title: '20-Week DSA Roadmap', subtitle: 'Structured algorithms & LeetCode patterns curriculum', category: 'Learning Path', href: '/technical-knowledge/dsa/20-week-dsa-roadmap-intro' },
  { id: 'path-git', title: 'Git & Workflows', subtitle: 'Branching, rebase, hooks, worktrees, internals', category: 'Learning Path', href: '/technical-knowledge/git' },
];

export const OPEN_COMMAND_PALETTE_EVENT = 'open-kb-command-palette';

export function triggerCommandPalette(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE_EVENT));
  }
}

export default function CommandPalette(): React.ReactNode {
  const history = useHistory();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [diagramItems, setDiagramItems] = useState<CommandPaletteItem[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Global Cmd+K / Ctrl+K shortcut and custom open event
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    const onCustomOpen = () => setOpen(true);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onCustomOpen);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onCustomOpen);
    };
  }, []);

  // Dynamically load diagram metadata ONLY the first time the palette opens
  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    setTimeout(() => inputRef.current?.focus(), 10);

    if (diagramItems.length === 0) {
      import('../data/diagramAtlasData')
        .then((mod) => {
          const mapped: CommandPaletteItem[] = mod.DIAGRAM_ATLAS_ENTRIES.map((d) => ({
            id: `diag-${d.id}`,
            title: d.title,
            subtitle: `${d.category} · ${d.docTitle}`,
            category: 'Diagram',
            href: d.docPath,
            keywords: `${d.category} ${d.docTitle}`,
          }));
          setDiagramItems(mapped);
        })
        .catch(() => {
          // Non-critical fallback
        });
    }
  }, [open, diagramItems.length]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return STATIC_COMMANDS.slice(0, 12);
    }
    const all = [...STATIC_COMMANDS, ...diagramItems];
    const matched: CommandPaletteItem[] = [];
    for (const item of all) {
      const hay = `${item.title} ${item.subtitle} ${item.keywords || ''}`.toLowerCase();
      if (hay.includes(q)) {
        matched.push(item);
        if (matched.length >= 16) break;
      }
    }
    return matched;
  }, [query, diagramItems]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open) return null;

  const navigateTo = (href: string) => {
    setOpen(false);
    setQuery('');
    history.push(href);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((idx) => (results.length ? (idx + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((idx) => (results.length ? (idx - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      navigateTo(results[activeIndex].href);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quick Command Palette"
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        background: 'rgba(2, 6, 23, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '10vh 1rem 1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 640,
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid rgba(56, 189, 248, 0.32)',
          background: '#0b1020',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65)',
          color: '#f8fafc',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.9rem 1.1rem',
            borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Jump to learning paths, Arcade, Mock Interviews, or 750+ diagrams..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f8fafc',
              fontSize: '0.98rem',
            }}
          />
          <kbd
            style={{
              fontSize: '0.72rem',
              padding: '0.2rem 0.45rem',
              borderRadius: 6,
              background: 'rgba(148, 163, 184, 0.16)',
              color: '#cbd5e1',
              border: '1px solid rgba(148, 163, 184, 0.25)',
            }}
          >
            ESC
          </kbd>
        </div>

        <div style={{ maxHeight: '56vh', overflowY: 'auto', padding: '0.5rem' }}>
          {results.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.92rem' }}>
              No quick matches for &ldquo;{query}&rdquo;. Try searching for Kafka, MVCC, Arcade, or Java.
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === activeIndex;
              const badgeColor =
                item.category === 'Interactive'
                  ? { bg: 'rgba(52, 211, 153, 0.15)', text: '#34d399', border: 'rgba(52, 211, 153, 0.35)' }
                  : item.category === 'Diagram'
                  ? { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.35)' }
                  : { bg: 'rgba(167, 139, 250, 0.15)', text: '#c4b5fd', border: 'rgba(167, 139, 250, 0.35)' };

              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => navigateTo(item.href)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    padding: '0.72rem 0.85rem',
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(56, 189, 248, 0.14)' : 'transparent',
                    color: '#f8fafc',
                    transition: 'background 0.12s',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#f8fafc' }}>
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: '#94a3b8',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '0.18rem 0.5rem',
                      borderRadius: 999,
                      background: badgeColor.bg,
                      color: badgeColor.text,
                      border: `1px solid ${badgeColor.border}`,
                    }}
                  >
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.55rem 1rem',
            borderTop: '1px solid rgba(148, 163, 184, 0.15)',
            fontSize: '0.76rem',
            color: '#94a3b8',
            background: 'rgba(15, 23, 42, 0.7)',
          }}
        >
          <span>↑↓ Navigate · ↵ Open · Esc Close</span>
          <span>⌘K Quick Jump</span>
        </div>
      </div>
    </div>
  );
}
