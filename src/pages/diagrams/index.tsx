import React, { useMemo, useState, useEffect, Suspense } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import {
  DIAGRAM_ATLAS_ENTRIES,
  DIAGRAM_ATLAS_TOTAL_COMPONENTS,
  DiagramAtlasEntry,
} from '../../data/diagramAtlasData';
import styles from './diagrams.module.css';

// Lazy-loaded flagship interactive diagrams (loaded ONLY when user clicks "Live Preview")
const FLAGSHIP_PREVIEW_LOADERS: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  CircuitBreakerDiagram: React.lazy(() => import('../../components/CircuitBreakerDiagram')),
  TlsHandshakeDiagram: React.lazy(() => import('../../components/TlsHandshakeDiagram')),
  KafkaArchitectureOverviewDiagram: React.lazy(() => import('../../components/KafkaArchitectureOverviewDiagram')),
  AcidInnodbMvccDiagram: React.lazy(() => import('../../components/AcidInnodbMvccDiagram')),
  AQSArchitectureDiagram: React.lazy(() => import('../../components/AQSArchitectureDiagram')),
  CorsDiagram: React.lazy(() => import('../../components/CorsDiagram')),
  TransactionalOutboxDiagram: React.lazy(() => import('../../components/TransactionalOutboxDiagram')),
  VirtualThreadLifecycleDiagram: React.lazy(() => import('../../components/VirtualThreadLifecycleDiagram')),
};

const PAGE_SIZE = 24;

export default function DiagramAtlasPage(): React.ReactNode {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [onlyLivePreview, setOnlyLivePreview] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [previewEntry, setPreviewEntry] = useState<DiagramAtlasEntry | null>(null);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of DIAGRAM_ATLAS_ENTRIES) {
      counts.set(item.category, (counts.get(item.category) || 0) + 1);
    }
    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
    return [{ name: 'All', count: DIAGRAM_ATLAS_ENTRIES.length }, ...sorted];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DIAGRAM_ATLAS_ENTRIES.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (onlyLivePreview && !FLAGSHIP_PREVIEW_LOADERS[item.id]) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.docTitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [query, selectedCategory, onlyLivePreview]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, selectedCategory, onlyLivePreview]);

  useEffect(() => {
    if (!previewEntry) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewEntry(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [previewEntry]);

  const visibleEntries = filtered.slice(0, visibleCount);
  const PreviewComponent = previewEntry ? FLAGSHIP_PREVIEW_LOADERS[previewEntry.id] : null;

  return (
    <Layout
      title="Interactive Diagram Atlas"
      description={`Browse ${DIAGRAM_ATLAS_TOTAL_COMPONENTS}+ interactive React SVG architecture diagrams across distributed systems, JVM, databases, Kafka, and networking.`}
    >
      <main className={styles.atlasPage}>
        <header className={styles.hero}>
          <div className={styles.eyebrow}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <path d="M10 6.5h4M17.5 10v4M6.5 10v7.5H14" />
            </svg>
            Visual Architecture Atlas
          </div>
          <h1 className={styles.title}>
            {DIAGRAM_ATLAS_TOTAL_COMPONENTS}+ Interactive Engineering Diagrams
          </h1>
          <p className={styles.subtitle}>
            Explore every animated protocol handshake, database engine flow, JVM memory layout, and distributed system topology in one searchable atlas.
          </p>
        </header>

        <section className={styles.controls} aria-label="Diagram filters">
          <div className={styles.searchRow}>
            <div className={styles.searchWrap}>
              <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="search"
                className={styles.searchInput}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search diagrams (e.g. Kafka, MVCC, TLS, Circuit Breaker, Virtual Thread)..."
                aria-label="Search interactive diagrams"
              />
            </div>

            <button
              type="button"
              className={`${styles.toggleFeaturedBtn} ${onlyLivePreview ? styles.toggleFeaturedActive : ''}`}
              onClick={() => setOnlyLivePreview((v) => !v)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              {onlyLivePreview ? 'Showing Live Previews (8)' : 'Live Preview Ready (8)'}
            </button>
          </div>

          <div className={styles.categoryBar}>
            {categories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className={`${styles.categoryPill} ${selectedCategory === cat.name ? styles.categoryPillActive : ''}`}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>
        </section>

        <div className={styles.metaRow}>
          <span>
            Showing <strong>{visibleEntries.length}</strong> of <strong>{filtered.length}</strong> diagrams
          </span>
          {selectedCategory !== 'All' || query || onlyLivePreview ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedCategory('All');
                setOnlyLivePreview(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reset filters
            </button>
          ) : null}
        </div>

        <section className={styles.grid}>
          {visibleEntries.map((entry) => {
            const hasLivePreview = Boolean(FLAGSHIP_PREVIEW_LOADERS[entry.id]);
            return (
              <article key={entry.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={styles.catTag}>{entry.category}</span>
                  {hasLivePreview && <span className={styles.liveBadge}>Live Preview</span>}
                </div>
                <h2 className={styles.cardTitle}>{entry.title}</h2>
                <div className={styles.cardDoc}>Featured in: {entry.docTitle}</div>
                <div className={styles.cardActions}>
                  <Link to={entry.docPath} className={styles.openLink}>
                    Open Article →
                  </Link>
                  {hasLivePreview && (
                    <button
                      type="button"
                      className={styles.previewBtn}
                      onClick={() => setPreviewEntry(entry)}
                    >
                      Live Preview
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {visibleCount < filtered.length && (
          <div className={styles.loadMoreWrap}>
            <button
              type="button"
              className={styles.loadMoreBtn}
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            >
              Load More Diagrams ({filtered.length - visibleCount} remaining)
            </button>
          </div>
        )}

        {previewEntry && PreviewComponent && (
          <div
            className={styles.modalBackdrop}
            role="dialog"
            aria-modal="true"
            aria-label={previewEntry.title}
            onClick={() => setPreviewEntry(null)}
          >
            <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div>
                  <h3 className={styles.modalTitle}>{previewEntry.title}</h3>
                  <Link to={previewEntry.docPath} style={{ fontSize: '0.85rem', color: '#38bdf8' }}>
                    Read full deep-dive: {previewEntry.docTitle} →
                  </Link>
                </div>
                <button
                  type="button"
                  className={styles.modalClose}
                  onClick={() => setPreviewEntry(null)}
                >
                  Close (Esc)
                </button>
              </div>
              <Suspense
                fallback={
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    Loading interactive telemetry diagram...
                  </div>
                }
              >
                <PreviewComponent />
              </Suspense>
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}
