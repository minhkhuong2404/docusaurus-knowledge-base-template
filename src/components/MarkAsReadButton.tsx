import React, { useEffect, useState } from 'react';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import { useUserProgress } from '../context/UserProgressContext';
import { isTrackableArticle, TOTAL_TRACKABLE_ARTICLES_DEFAULT } from '../utils/trackablePages';
import {
  getArcadeRecommendationForPath,
  getBookmarkedDocs,
  saveLastVisitedDoc,
  toggleBookmarkedDoc,
} from '../utils/learningHelpers';

export default function MarkAsReadButton() {
  const location = useLocation();
  const pagePath = location.pathname;
  const { isPageRead, togglePageRead, progress, totalArticlesCount } = useUserProgress();
  const [isBookmarked, setIsBookmarked] = useState(false);

  const trackable = isTrackableArticle(pagePath);

  useEffect(() => {
    if (!trackable || typeof window === 'undefined') return;
    const h1 = document.querySelector('article h1')?.textContent?.trim();
    const title = h1 || document.title.replace(/\s*\|\s*Engineering Knowledge Base.*$/, '').trim() || pagePath;
    saveLastVisitedDoc(pagePath, title);
    const saved = getBookmarkedDocs();
    setIsBookmarked(saved.some((item) => item.path === pagePath));
  }, [pagePath, trackable]);

  if (!trackable) {
    return null;
  }

  const isRead = isPageRead(pagePath);
  const totalRead = (progress.readPages || []).filter(isTrackableArticle).length;
  const totalArticles =
    totalArticlesCount > 0 && totalArticlesCount <= 2000 ? totalArticlesCount : TOTAL_TRACKABLE_ARTICLES_DEFAULT;
  const percent = Math.min(100, Math.round((totalRead / totalArticles) * 100));
  const arcadeRec = getArcadeRecommendationForPath(pagePath);

  const handleToggleBookmark = () => {
    const h1 = typeof document !== 'undefined' ? document.querySelector('article h1')?.textContent?.trim() : '';
    const title = h1 || pagePath;
    const res = toggleBookmarkedDoc(pagePath, title);
    setIsBookmarked(res.bookmarked);
  };

  return (
    <div className={`mark-read-banner ${isRead ? 'completed' : 'tracking'}`}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className={`mark-read-icon-box ${isRead ? 'completed' : 'tracking'}`}>
            {isRead ? '✅' : '📖'}
          </div>
          <div>
            <div className="mark-read-title">
              <span>{isRead ? 'Article Completed' : 'Track Page Progress'}</span>
              <span className="mark-read-counter">
                {totalRead} / {totalArticles} Read
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleToggleBookmark}
            style={{
              padding: '0.48rem 0.9rem',
              borderRadius: 9,
              border: isBookmarked ? '1px solid rgba(251, 191, 36, 0.55)' : '1px solid rgba(148, 163, 184, 0.35)',
              background: isBookmarked ? 'rgba(251, 191, 36, 0.14)' : 'transparent',
              color: isBookmarked ? '#d97706' : 'var(--ifm-font-color-base)',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {isBookmarked ? 'Saved' : 'Save'}
          </button>

          <button
            type="button"
            onClick={() => togglePageRead(pagePath)}
            className={`mark-read-btn ${isRead ? 'completed' : 'tracking'}`}
          >
            <span>{isRead ? '✓ Completed' : 'Mark as Read (+XP)'}</span>
          </button>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div style={{ marginBottom: '1rem' }}>
        <div className="mark-read-progress-label">
          <span>Knowledge Base Completion</span>
          <span className={`mark-read-percent ${isRead ? 'completed' : 'tracking'}`}>{percent}%</span>
        </div>
        <div className="mark-read-progress-track">
          <div
            className={`mark-read-progress-fill ${isRead ? 'completed' : 'tracking'}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Topic-Aware Arcade Practice CTA */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          paddingTop: '0.85rem',
          borderTop: '1px solid rgba(148, 163, 184, 0.18)',
        }}
      >
        <div style={{ fontSize: '0.86rem', color: 'var(--ifm-color-content-secondary)' }}>
          <strong style={{ color: 'var(--ifm-font-color-base)' }}>Reinforce this topic:</strong>{' '}
          {arcadeRec.tagline}
        </div>
        <Link
          to={arcadeRec.href}
          style={{
            padding: '0.45rem 0.95rem',
            borderRadius: 9,
            fontSize: '0.84rem',
            fontWeight: 700,
            textDecoration: 'none',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
            color: '#082f49',
            whiteSpace: 'nowrap',
          }}
        >
          Play {arcadeRec.gameName} →
        </Link>
      </div>
    </div>
  );
}
