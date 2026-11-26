import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import { useUserProgress } from '../context/UserProgressContext';
import { getBookmarkedDocs, getLastVisitedDoc, LastVisitedDoc, BookmarkedDoc } from '../utils/learningHelpers';
import { isTrackableArticle } from '../utils/trackablePages';

// Lazy-load ONLY the selected diagram when the user scrolls near the spotlight
const SPOTLIGHT_DIAGRAMS = [
  {
    id: 'circuit-breaker',
    label: 'Circuit Breaker',
    category: 'Resilience',
    docHref: '/technical-knowledge/system-design/microservices-patterns',
    Component: React.lazy(() => import('./CircuitBreakerDiagram')),
  },
  {
    id: 'tls-handshake',
    label: 'TLS 1.3 Handshake',
    category: 'Networking',
    docHref: '/technical-knowledge/networking/tls-ssl',
    Component: React.lazy(() => import('./TlsHandshakeDiagram')),
  },
  {
    id: 'kafka-arch',
    label: 'Kafka Architecture',
    category: 'Streaming',
    docHref: '/technical-knowledge/kafka/intro',
    Component: React.lazy(() => import('./KafkaArchitectureOverviewDiagram')),
  },
  {
    id: 'innodb-mvcc',
    label: 'InnoDB MVCC',
    category: 'Database',
    docHref: '/technical-knowledge/database/acid-transactions',
    Component: React.lazy(() => import('./AcidInnodbMvccDiagram')),
  },
];

/**
 * Crisp inline duotone SVG icons for Learning Paths (zero emoji inconsistency, zero bundle bloat).
 */
export function DomainIcon({ name, color = '#34d399' }: { name: string; color?: string }) {
  const key = name.toLowerCase();
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (key.includes('java')) {
    return (
      <svg {...common}>
        <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
        <line x1="6" y1="2" x2="6" y2="4" />
        <line x1="10" y1="2" x2="10" y2="4" />
        <line x1="14" y1="2" x2="14" y2="4" />
      </svg>
    );
  }
  if (key.includes('spring')) {
    return (
      <svg {...common}>
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    );
  }
  if (key.includes('system')) {
    return (
      <svg {...common}>
        <rect x="2" y="3" width="7" height="7" rx="1.5" />
        <rect x="15" y="3" width="7" height="7" rx="1.5" />
        <rect x="8.5" y="14" width="7" height="7" rx="1.5" />
        <path d="M9 6.5h6M5.5 10v2.5A1.5 1.5 0 0 0 7 14h1.5M18.5 10v2.5A1.5 1.5 0 0 1 17 14h-1.5" />
      </svg>
    );
  }
  if (key.includes('database')) {
    return (
      <svg {...common}>
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14a9 3 0 0 0 18 0V5" />
        <path d="M3 12a9 3 0 0 0 18 0" />
      </svg>
    );
  }
  if (key.includes('kafka')) {
    return (
      <svg {...common}>
        <circle cx="5" cy="12" r="2.5" />
        <circle cx="19" cy="6" r="2.5" />
        <circle cx="19" cy="18" r="2.5" />
        <path d="M7.5 11L16.5 7M7.5 13l9 4" />
      </svg>
    );
  }
  if (key.includes('redis')) {
    return (
      <svg {...common}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    );
  }
  if (key.includes('pattern')) {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
        <circle cx="17" cy="17" r="4" />
      </svg>
    );
  }
  if (key.includes('security')) {
    return (
      <svg {...common}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }
  if (key.includes('network')) {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3.6 9h16.8M3.6 15h16.8" />
        <path d="M12 3a14 14 0 0 0 0 18M12 3a14 14 0 0 1 0 18" />
      </svg>
    );
  }
  if (key.includes('devops')) {
    return (
      <svg {...common}>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.29 7 12 12 20.71 7" />
        <line x1="12" y1="22" x2="12" y2="12" />
      </svg>
    );
  }
  if (key.includes('aws')) {
    return (
      <svg {...common}>
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      </svg>
    );
  }
  if (key.includes('bank')) {
    return (
      <svg {...common}>
        <line x1="3" y1="22" x2="21" y2="22" />
        <line x1="6" y1="18" x2="6" y2="11" />
        <line x1="10" y1="18" x2="10" y2="11" />
        <line x1="14" y1="18" x2="14" y2="11" />
        <line x1="18" y1="18" x2="18" y2="11" />
        <polygon points="12 2 20 7 4 7" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M6 21V9a9 9 0 0 0 9 9" />
    </svg>
  );
}

/**
 * Single-pass count-up stat number using IntersectionObserver + requestAnimationFrame.
 */
export function AnimatedStatNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(target);
  const elRef = useRef<HTMLDivElement | null>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const node = elRef.current;
    if (!node || typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 850;
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setValue(Math.max(1, Math.round(eased * target)));
            if (t < 1) {
              requestAnimationFrame(tick);
            } else {
              setValue(target);
            }
          };
          requestAnimationFrame(tick);
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    obs.observe(node);
    return () => obs.disconnect();
  }, [target]);

  return (
    <div ref={elRef} className="lp-stat-num">
      {value}
      {suffix}
    </div>
  );
}

/**
 * Personalized "Resume Learning" Cockpit Strip reading synchronously from UserProgressContext + localStorage.
 */
export function ResumeLearningCockpit() {
  const { progress, gamification, totalArticlesCount } = useUserProgress();
  const [lastDoc, setLastDoc] = useState<LastVisitedDoc | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkedDoc[]>([]);

  useEffect(() => {
    setLastDoc(getLastVisitedDoc());
    setBookmarks(getBookmarkedDocs());
  }, []);

  const readCount = (progress.readPages || []).filter(isTrackableArticle).length;
  const streak = gamification?.streak?.currentStreak || 0;
  const level = gamification?.level || 1;
  const exp = gamification?.exp || 0;

  if (!lastDoc && readCount === 0 && bookmarks.length === 0 && streak === 0) {
    return null;
  }

  return (
    <section
      aria-label="Personal Learning Cockpit"
      style={{ maxWidth: 1100, margin: '0 auto 2.25rem', padding: '0 1.5rem' }}
    >
      <div className="lp-cockpit-card">
        <div className="lp-cockpit-left">
          <div className="lp-cockpit-pills">
            <span className="lp-cockpit-pill lp-cockpit-pill--level">Lv.{level} · {exp.toLocaleString()} XP</span>
            <span className="lp-cockpit-pill lp-cockpit-pill--streak">🔥 {streak}d Streak</span>
            <span className="lp-cockpit-pill lp-cockpit-pill--read">
              {readCount} / {totalArticlesCount} Docs Read
            </span>
          </div>
          {lastDoc ? (
            <div className="lp-cockpit-resume">
              <span className="lp-cockpit-label">Pick up where you left off:</span>{' '}
              <Link to={lastDoc.path} className="lp-cockpit-doclink">
                {lastDoc.title} →
              </Link>
            </div>
          ) : (
            <div className="lp-cockpit-resume">
              <span className="lp-cockpit-label">Keep your momentum going in the</span>{' '}
              <Link to="/arcade" className="lp-cockpit-doclink">
                Engineering Arcade →
              </Link>
            </div>
          )}
        </div>

        <div className="lp-cockpit-actions">
          {bookmarks.length > 0 && (
            <Link to={bookmarks[0].path} className="lp-cockpit-btn lp-cockpit-btn--secondary">
              Saved ({bookmarks.length})
            </Link>
          )}
          <Link to="/profile" className="lp-cockpit-btn lp-cockpit-btn--primary">
            View Stats →
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * Asymmetric Bento Grid showcasing the site's flagship interactive tools.
 */
export function BentoFeatureShowcase({ onCardMouseMove }: { onCardMouseMove: (e: React.MouseEvent<HTMLElement>) => void }) {
  return (
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '4.5rem 1.5rem 2.5rem' }}>
      <div className="lp-section-label">Interactive Platform</div>
      <h2 className="lp-section-title">More Than Static Docs</h2>
      <p
        style={{
          color: 'var(--ifm-color-emphasis-700)',
          fontSize: '1.15rem',
          lineHeight: 1.65,
          maxWidth: 620,
          marginBottom: '2rem',
        }}
      >
        Practice production debugging, design distributed topologies, rehearse senior interviews, and explore animated architecture diagrams.
      </p>

      <div className="lp-bento-grid">
        {/* Large Hero Bento Card: Diagram Atlas */}
        <Link to="/diagrams" className="lp-bento-card lp-bento-span2 lp-spotlight-card" onMouseMove={onCardMouseMove}>
          <div className="lp-bento-top">
            <span className="lp-bento-badge lp-bento-badge--sky">765+ Interactive SVGs</span>
            <span className="lp-bento-arrow">→</span>
          </div>
          <h3 className="lp-bento-title">Visual Architecture Atlas</h3>
          <p className="lp-bento-desc">
            Search and filter every animated protocol handshake, database B+Tree/MVCC flow, Kafka partition topology, and JVM memory model in one fast visual directory.
          </p>
          <div className="lp-bento-chips">
            <span>TLS 1.3</span>
            <span>Kafka EOS</span>
            <span>InnoDB MVCC</span>
            <span>Virtual Threads</span>
            <span>Circuit Breaker</span>
          </div>
        </Link>

        {/* Engineering Arcade */}
        <Link to="/arcade" className="lp-bento-card lp-spotlight-card" onMouseMove={onCardMouseMove}>
          <div className="lp-bento-top">
            <span className="lp-bento-badge lp-bento-badge--purple">5 Mini-Games</span>
            <span className="lp-bento-arrow">→</span>
          </div>
          <h3 className="lp-bento-title">Engineering Arcade</h3>
          <p className="lp-bento-desc">
            Outage Boss Battle, Architecture Puzzle, SQL Index Optimizer, Spot The Bug Duel &amp; Flashcard Arena.
          </p>
        </Link>

        {/* Mock Interview Studio */}
        <Link to="/mock-interview" className="lp-bento-card lp-spotlight-card" onMouseMove={onCardMouseMove}>
          <div className="lp-bento-top">
            <span className="lp-bento-badge lp-bento-badge--amber">Live Simulation</span>
            <span className="lp-bento-arrow">→</span>
          </div>
          <h3 className="lp-bento-title">Mock Interview Studio</h3>
          <p className="lp-bento-desc">
            Company-specific senior interview rounds with structured rubrics, follow-up traps, and scoring feedback.
          </p>
        </Link>

        {/* Career Hub */}
        <Link to="/hub" className="lp-bento-card lp-spotlight-card" onMouseMove={onCardMouseMove}>
          <div className="lp-bento-top">
            <span className="lp-bento-badge lp-bento-badge--emerald">Senior / Staff</span>
            <span className="lp-bento-arrow">→</span>
          </div>
          <h3 className="lp-bento-title">Career Hub &amp; Code Battles</h3>
          <p className="lp-bento-desc">
            50+ senior interview tips, 100 code battles, and Staff-level architectural framing matrices.
          </p>
        </Link>

        {/* Tech English + Leaderboard */}
        <Link to="/tech-english" className="lp-bento-card lp-spotlight-card" onMouseMove={onCardMouseMove}>
          <div className="lp-bento-top">
            <span className="lp-bento-badge lp-bento-badge--sky">Communication</span>
            <span className="lp-bento-arrow">→</span>
          </div>
          <h3 className="lp-bento-title">Tech English &amp; Acronyms</h3>
          <p className="lp-bento-desc">
            Articulate architecture trade-offs clearly in global interviews with curated engineering vocabulary.
          </p>
        </Link>
      </div>
    </section>
  );
}

/**
 * Lazy-mounted Live Interactive Diagram Spotlight.
 * Only downloads the active diagram chunk once the user scrolls near it.
 */
export function LiveDiagramSpotlight() {
  const [activeId, setActiveId] = useState(SPOTLIGHT_DIAGRAMS[0].id);
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin: '240px 0px' }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const active = SPOTLIGHT_DIAGRAMS.find((d) => d.id === activeId) || SPOTLIGHT_DIAGRAMS[0];
  const ActiveDiagram = active.Component;

  return (
    <section
      ref={containerRef}
      style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem 4.5rem' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <div className="lp-section-label">Live Telemetry Preview</div>
          <h2 className="lp-section-title" style={{ marginBottom: '0.35rem' }}>
            Try an Interactive Diagram
          </h2>
          <p style={{ color: 'var(--ifm-color-emphasis-700)', fontSize: '1.02rem', margin: 0 }}>
            Click nodes, step through state transitions, or inspect under-the-hood mechanics right here.
          </p>
        </div>
        <Link to="/diagrams" className="lp-atlas-cta">
          Explore all 765+ Diagrams →
        </Link>
      </div>

      {/* Switcher tabs */}
      <div className="lp-filter-bar" style={{ marginBottom: '1.1rem' }}>
        {SPOTLIGHT_DIAGRAMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveId(item.id)}
            className={`lp-filter-pill ${activeId === item.id ? 'lp-filter-pill--active' : ''}`}
          >
            {item.label}
          </button>
        ))}
        <Link
          to={active.docHref}
          style={{
            marginLeft: 'auto',
            fontSize: '0.88rem',
            fontWeight: 700,
            color: 'var(--brand-blue)',
            alignSelf: 'center',
          }}
        >
          Read full {active.label} guide →
        </Link>
      </div>

      <div style={{ minHeight: 340 }}>
        {inView ? (
          <Suspense
            fallback={
              <div
                style={{
                  minHeight: 340,
                  borderRadius: 14,
                  background: '#090b14',
                  border: '1px solid rgba(56, 189, 248, 0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  fontSize: '0.95rem',
                }}
              >
                Loading {active.label} telemetry diagram...
              </div>
            }
          >
            <ActiveDiagram />
          </Suspense>
        ) : (
          <div
            style={{
              minHeight: 340,
              borderRadius: 14,
              background: '#090b14',
              border: '1px solid rgba(56, 189, 248, 0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
            }}
          >
            Interactive diagram ready on scroll...
          </div>
        )}
      </div>
    </section>
  );
}
