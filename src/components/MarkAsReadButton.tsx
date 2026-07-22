import React from 'react';
import { useLocation } from '@docusaurus/router';
import { useUserProgress } from '../context/UserProgressContext';

export default function MarkAsReadButton() {
  const location = useLocation();
  const pagePath = location.pathname;
  const { isPageRead, togglePageRead, currentUser, progress } = useUserProgress();

  const isRead = isPageRead(pagePath);
  const totalRead = progress.readPages.length;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        margin: '2rem 0 1.5rem 0',
        padding: '0.85rem 1.25rem',
        borderRadius: '12px',
        background: isRead
          ? 'linear-gradient(135deg, rgba(74, 222, 128, 0.12) 0%, rgba(34, 197, 94, 0.06) 100%)'
          : 'var(--ifm-background-surface-color)',
        border: isRead
          ? '1px solid rgba(74, 222, 128, 0.35)'
          : '1px solid var(--ifm-color-emphasis-200)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '1.25rem' }}>{isRead ? '✅' : '📖'}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ifm-font-color-base)' }}>
            {isRead ? 'Article Completed' : 'Reading Progress'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ifm-color-emphasis-600)' }}>
            {currentUser
              ? `${totalRead} ${totalRead === 1 ? 'article' : 'articles'} marked as read on Cloud Firestore`
              : 'Sign in to sync your completed articles across devices'}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => togglePageRead(pagePath)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          border: isRead ? '1px solid #4ade80' : '1px solid var(--ifm-color-primary)',
          backgroundColor: isRead ? 'rgba(74, 222, 128, 0.15)' : 'var(--ifm-color-primary)',
          color: isRead ? '#4ade80' : '#ffffff',
          fontWeight: 600,
          fontSize: '0.85rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <span>{isRead ? '✓ Completed' : 'Mark as Read'}</span>
      </button>
    </div>
  );
}
