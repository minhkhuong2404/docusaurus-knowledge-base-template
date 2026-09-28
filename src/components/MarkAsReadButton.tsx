import React from 'react';
import { useLocation } from '@docusaurus/router';
import { useUserProgress } from '../context/UserProgressContext';
import { isTrackableArticle, TOTAL_TRACKABLE_ARTICLES_DEFAULT } from '../utils/trackablePages';

export default function MarkAsReadButton() {
  const location = useLocation();
  const pagePath = location.pathname;
  const { isPageRead, togglePageRead, progress, totalArticlesCount } = useUserProgress();

  if (!isTrackableArticle(pagePath)) {
    return null;
  }

  const isRead = isPageRead(pagePath);
  const totalRead = (progress.readPages || []).filter(isTrackableArticle).length;
  const totalArticles = totalArticlesCount > 0 && totalArticlesCount <= 2000 ? totalArticlesCount : TOTAL_TRACKABLE_ARTICLES_DEFAULT;
  const percent = Math.min(100, Math.round((totalRead / totalArticles) * 100));

  return (
    <div className={`mark-read-banner ${isRead ? 'completed' : 'tracking'}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '0.85rem' }}>
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

        <button
          type="button"
          onClick={() => togglePageRead(pagePath)}
          className={`mark-read-btn ${isRead ? 'completed' : 'tracking'}`}
        >
          <span>{isRead ? '✓ Completed' : 'Mark as Read'}</span>
        </button>
      </div>

      {/* Visual Progress Bar */}
      <div>
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
    </div>
  );
}
