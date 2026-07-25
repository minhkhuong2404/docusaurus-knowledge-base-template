import React from 'react';
import { useLocation } from '@docusaurus/router';
import { useUserProgress } from '../context/UserProgressContext';
import { isTrackableArticle, TOTAL_TRACKABLE_ARTICLES_DEFAULT } from '../utils/trackablePages';

export default function MarkAsReadButton() {
  const location = useLocation();
  const pagePath = location.pathname;

  if (!isTrackableArticle(pagePath)) {
    return null;
  }

  const { isPageRead, togglePageRead, progress, totalArticlesCount } = useUserProgress();

  const isRead = isPageRead(pagePath);
  const totalRead = (progress.readPages || []).filter(isTrackableArticle).length;
  const totalArticles = totalArticlesCount > 0 && totalArticlesCount <= 620 ? totalArticlesCount : TOTAL_TRACKABLE_ARTICLES_DEFAULT;
  const percent = Math.min(100, Math.round((totalRead / totalArticles) * 100));

  return (
    <div
      style={{
        margin: '2.5rem 0 1.5rem 0',
        padding: '1.1rem 1.35rem',
        borderRadius: '14px',
        background: isRead
          ? 'linear-gradient(135deg, rgba(74, 222, 128, 0.12) 0%, rgba(34, 197, 94, 0.05) 100%)'
          : 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
        border: isRead
          ? '1px solid rgba(74, 222, 128, 0.35)'
          : '1px solid var(--ifm-color-emphasis-200)',
        boxShadow: isRead
          ? '0 4px 20px rgba(74, 222, 128, 0.1)'
          : '0 4px 15px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: isRead ? 'rgba(74, 222, 128, 0.2)' : 'rgba(56, 189, 248, 0.15)',
              border: isRead ? '1px solid #4ade80' : '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
            }}
          >
            {isRead ? '✅' : '📖'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ifm-font-color-base)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{isRead ? 'Article Completed' : 'Track Page Progress'}</span>
              <span style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 600 }}>
                {totalRead} / {totalArticles} Read
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => togglePageRead(pagePath)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.55rem 1.15rem',
            borderRadius: '10px',
            border: isRead ? '1px solid #4ade80' : 'none',
            backgroundColor: isRead ? 'rgba(74, 222, 128, 0.18)' : '#3b82f6',
            color: isRead ? '#4ade80' : '#ffffff',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: isRead ? '0 0 12px rgba(74, 222, 128, 0.25)' : '0 4px 12px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.2s ease',
          }}
        >
          <span>{isRead ? '✓ Completed' : 'Mark as Read'}</span>
        </button>
      </div>

      {/* Visual Progress Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--ifm-color-emphasis-600)', marginBottom: '4px', fontWeight: 600 }}>
          <span>Knowledge Base Completion</span>
          <span style={{ color: isRead ? '#4ade80' : '#38bdf8' }}>{percent}%</span>
        </div>
        <div style={{ height: '6px', width: '100%', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${percent}%`,
              borderRadius: '3px',
              background: isRead
                ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                : 'linear-gradient(90deg, #38bdf8, #3b82f6)',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>
    </div>
  );
}
