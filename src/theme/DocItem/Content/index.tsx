import React, { useEffect, useState } from 'react';
import Content from '@theme-original/DocItem/Content';
import type ContentType from '@theme/DocItem/Content';
import type { WrapperProps } from '@docusaurus/types';
import { useLocation } from '@docusaurus/router';
import { estimateReadingMinutes, getBookmarkedDocs, toggleBookmarkedDoc } from '@site/src/utils/learningHelpers';
import { isTrackableArticle } from '@site/src/utils/trackablePages';

type Props = WrapperProps<typeof ContentType>;

export default function ContentWrapper(props: Props): React.ReactNode {
  const location = useLocation();
  const [readMinutes, setReadMinutes] = useState<number | null>(null);
  const [diagramCount, setDiagramCount] = useState<number>(0);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  const trackable = isTrackableArticle(location.pathname);

  useEffect(() => {
    if (!trackable || typeof window === 'undefined') {
      setReadMinutes(null);
      setDiagramCount(0);
      return;
    }

    const saved = getBookmarkedDocs();
    setIsBookmarked(saved.some((item) => item.path === location.pathname));

    const rafId = window.requestAnimationFrame(() => {
      const articleEl = document.querySelector('article .markdown');
      if (!articleEl) return;
      const text = articleEl.textContent || '';
      setReadMinutes(estimateReadingMinutes(text));
      const diagrams = articleEl.querySelectorAll('.interactive-diagram-container').length;
      setDiagramCount(diagrams);
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [location.pathname, trackable]);

  const handleBookmark = () => {
    const h1 = typeof document !== 'undefined' ? document.querySelector('article h1')?.textContent?.trim() : '';
    const res = toggleBookmarkedDoc(location.pathname, h1 || location.pathname);
    setIsBookmarked(res.bookmarked);
  };

  return (
    <>
      {trackable && readMinutes !== null && (
        <div
          className="doc-reading-meta-strip"
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.55rem',
            marginBottom: '1rem',
            fontSize: '0.82rem',
          }}
        >
          <span className="doc-meta-pill">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {readMinutes} min read
          </span>
          {diagramCount > 0 && (
            <span className="doc-meta-pill doc-meta-pill--accent">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <path d="M10 6.5h7.5V14" />
              </svg>
              {diagramCount} Interactive {diagramCount === 1 ? 'Diagram' : 'Diagrams'}
            </span>
          )}
          <button
            type="button"
            onClick={handleBookmark}
            className={`doc-meta-pill doc-meta-pill--btn ${isBookmarked ? 'doc-meta-pill--saved' : ''}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {isBookmarked ? 'Saved to Study List' : 'Save Article'}
          </button>
        </div>
      )}
      <Content {...props} />
    </>
  );
}
