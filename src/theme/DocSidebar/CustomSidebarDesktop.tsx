import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import type { Props as DesktopProps } from '@theme/DocSidebar/Desktop';

import { useUserProgress } from '../../context/UserProgressContext';
import { isTrackableArticle } from '@site/src/utils/trackablePages';

// Type definitions for Sidebar Items
type SidebarItem = any;

interface CustomSidebarProps extends DesktopProps {}

function isSamePath(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const cleanA = a.split('?')[0].split('#')[0].replace(/\/+$/, '').toLowerCase();
  const cleanB = b.split('?')[0].split('#')[0].replace(/\/+$/, '').toLowerCase();
  return cleanA === cleanB;
}

export default function CustomSidebarDesktop({ path, sidebar, onCollapse, isHidden }: CustomSidebarProps) {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [isResizing, setIsResizing] = useState(false);
  const sidebarWidthRef = useRef(300);

  const { progress, setTotalArticlesCount, isPageRead } = useUserProgress();

  // Single-pass memoized traversal: computes active category keys, active index, and total doc count
  const { activeCategoryKeys, totalDocs, activeIndex } = useMemo(() => {
    const activeKeys = new Set<string>();
    let docCounter = 0;
    let foundIndex = 0;

    function walk(items: SidebarItem[], keyPrefix: string): boolean {
      let anyActive = false;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemKey = `${keyPrefix}-${item.label || item.href || i}`;
        if (item.type === 'doc' || item.type === 'link') {
          docCounter++;
          if (isSamePath(item.href, path)) {
            foundIndex = docCounter;
            activeKeys.add(itemKey);
            anyActive = true;
          }
        } else if (item.type === 'category') {
          let categorySelfActive = false;
          if (item.href) {
            docCounter++;
            if (isSamePath(item.href, path)) {
              foundIndex = docCounter;
              categorySelfActive = true;
              activeKeys.add(itemKey);
              if (item.label) activeKeys.add(item.label);
              anyActive = true;
            }
          }
          if (Array.isArray(item.items)) {
            const childActive = walk(item.items, itemKey);
            if (childActive || categorySelfActive) {
              activeKeys.add(itemKey);
              if (item.label) activeKeys.add(item.label);
              anyActive = true;
            }
          }
        }
      }
      return anyActive;
    }

    if (sidebar) {
      walk(sidebar, 'top');
    }

    return {
      activeCategoryKeys: activeKeys,
      totalDocs: docCounter,
      activeIndex: foundIndex,
    };
  }, [sidebar, path]);

  useEffect(() => {
    if (totalDocs > 0) {
      setTotalArticlesCount(totalDocs);
    }
  }, [totalDocs, setTotalArticlesCount]);

  // Auto-expand active categories and keep active item visible when navigating or going back
  useEffect(() => {
    if (!sidebar || !path) return;
    if (activeCategoryKeys.size > 0) {
      const categoriesToOpen: Record<string, boolean> = {};
      activeCategoryKeys.forEach((key) => {
        categoriesToOpen[key] = true;
      });
      setOpenCategories((prev) => ({ ...prev, ...categoriesToOpen }));
    }

    const timer = setTimeout(() => {
      const activeEl = document.querySelector('.custom-sidebar-menu .custom-menu-link.active');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [path, sidebar, activeCategoryKeys]);

  const handleLocateCurrentPage = () => {
    if (!sidebar || !path) return;

    // Expand all active categories in one atomic state update
    const categoriesToOpen: Record<string, boolean> = {};
    activeCategoryKeys.forEach((key) => {
      categoriesToOpen[key] = true;
    });
    setOpenCategories((prev) => ({ ...prev, ...categoriesToOpen }));

    // Scroll active link into view & trigger pulse animation
    setTimeout(() => {
      const activeEl = document.querySelector('.custom-sidebar-menu .custom-menu-link.active');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        activeEl.classList.remove('pulse-highlight');
        void (activeEl as HTMLElement).offsetWidth; // trigger reflow
        activeEl.classList.add('pulse-highlight');
        setTimeout(() => {
          activeEl.classList.remove('pulse-highlight');
        }, 2000);
      }
    }, 100);
  };

  // Load saved width on mount
  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebar-width');
    if (savedWidth) {
      const width = parseInt(savedWidth, 10);
      if (!isNaN(width)) {
        sidebarWidthRef.current = width;
        document.documentElement.style.setProperty('--doc-sidebar-width', `${width}px`);
      }
    }
  }, []);

  // Handle resizing mouse events
  useEffect(() => {
    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        const newWidth = Math.max(200, Math.min(480, e.clientX - 16));
        sidebarWidthRef.current = newWidth;
        document.documentElement.style.setProperty('--doc-sidebar-width', `${newWidth}px`);
        rafId = null;
      });
    };

    const handleMouseUp = () => {
      if (isResizing) {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        setIsResizing(false);
        document.body.classList.remove('resizing-sidebar');
        localStorage.setItem('sidebar-width', `${sidebarWidthRef.current}px`);
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.classList.add('resizing-sidebar');
  };

  const renderSidebarItem = (item: SidebarItem, depth: number, keyPrefix: string) => {
    const labelText = (item.label || '').trim();
    // Match leading emoji or icon character
    const match = labelText.match(/^((?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|[0-9#*]\uFE0F?\u20E3)(?:\uFE0F|\u20E3)?(?:\u200D(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:\uFE0F|\u20E3)?)*)\s*(.*)$/u);
    const emoji = match ? match[1] : '';
    const cleanLabel = match ? match[2].trim() : labelText;
    const displayIcon = emoji || (cleanLabel ? cleanLabel.charAt(0) : '📄');

    const isActive = isSamePath(item.href, path);
    const itemKey = `${keyPrefix}-${item.label || item.href || 'item'}`;

    if (item.type === 'category') {
      const hasActiveChild = activeCategoryKeys.has(itemKey) || (item.label ? activeCategoryKeys.has(item.label) : false);
      const isOpen = openCategories[itemKey] ?? (hasActiveChild || false);

      const toggleOpen = () => {
        setOpenCategories((prev) => ({
          ...prev,
          [itemKey]: !isOpen,
          ...(item.label ? { [item.label]: !isOpen } : {}),
        }));
      };

      if (isHidden) {
        return (
          <button
            key={itemKey}
            className={clsx('custom-menu-link', hasActiveChild && 'active-child')}
            onClick={onCollapse}
            title={cleanLabel}
            aria-label={cleanLabel}
          >
            <span className="menu-icon">{displayIcon}</span>
          </button>
        );
      }

      return (
        <div key={itemKey} className={clsx('custom-menu-category', isOpen && 'open')}>
          <button
            className={clsx('custom-menu-category-header', hasActiveChild && 'active-child')}
            onClick={toggleOpen}
            aria-expanded={isOpen}
            title={cleanLabel}
          >
            <span className="menu-icon">{displayIcon}</span>
            <span className="menu-label">{cleanLabel}</span>
            <span className="menu-caret">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </button>
          {isOpen && (
            <div className="custom-menu-category-items">
              {item.items.map((subItem: SidebarItem, idx: number) => renderSidebarItem(subItem, depth + 1, `${itemKey}-${idx}`))}
            </div>
          )}
        </div>
      );
    }

    if (item.type === 'doc' || item.type === 'link') {
      const isTrackable = isTrackableArticle(item.href);
      const isRead = isTrackable && item.href ? isPageRead(item.href) : false;

      if (isHidden) {
        return (
          <Link
            key={itemKey}
            to={item.href}
            className={clsx('custom-menu-link', isActive && 'active', isRead && 'page-read')}
            title={`${cleanLabel}${isRead ? ' (Completed ✓)' : ''}`}
          >
            <span className="menu-icon" style={{ position: 'relative' }}>
              {displayIcon}
              {isRead && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#4ade80',
                    boxShadow: '0 0 6px #4ade80',
                  }}
                />
              )}
            </span>
          </Link>
        );
      }

      const linkElement = (
        <Link
          key={itemKey}
          to={item.href}
          className={clsx('custom-menu-link', isActive && 'active', isRead && 'page-read')}
          style={depth > 0 ? { paddingLeft: '12px' } : undefined}
          title={cleanLabel}
        >
          {depth === 0 && <span className="menu-icon">{displayIcon}</span>}
          <span className="menu-label">{cleanLabel}</span>
          {isRead && (
            <span
              className="menu-read-tick"
              title="Article Completed"
              aria-label="Completed"
              style={{
                marginLeft: 'auto',
                fontSize: '0.7rem',
                color: '#4ade80',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'rgba(74, 222, 128, 0.15)',
                border: '1px solid rgba(74, 222, 128, 0.35)',
                flexShrink: 0,
                boxShadow: '0 0 8px rgba(74, 222, 128, 0.2)',
              }}
            >
              ✓
            </span>
          )}
        </Link>
      );

      if (depth === 0) {
        return (
          <div key={itemKey} className="custom-menu-category">
            {linkElement}
          </div>
        );
      }

      return linkElement;
    }

    return null;
  };

  return (
    <div className={clsx('custom-sidebar-container', isHidden && 'collapsed')}>

      {/* Toolbar / Current Page Index Button */}
      <div className="custom-sidebar-toolbar">
        <button
          className="custom-sidebar-index-btn"
          onClick={handleLocateCurrentPage}
          title={
            activeIndex > 0
              ? `Current Page #${activeIndex} — Click to locate in sidebar`
              : 'Locate current page in sidebar'
          }
          aria-label="Locate current page index in sidebar"
        >
          <div className="index-btn-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="6"></circle>
              <circle cx="12" cy="12" r="2"></circle>
            </svg>
          </div>
          {!isHidden && (
            <div className="index-btn-content">
              <span className="index-btn-title">Current Page</span>
              <span className="index-btn-badge">
                {activeIndex > 0 ? `#${activeIndex}` : 'Not indexed'}
              </span>
            </div>
          )}
          {!isHidden && (
            <span className="index-btn-locate-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </span>
          )}
        </button>
      </div>

      {/* Menu Area */}
      <div className="custom-sidebar-menu">
        {sidebar && sidebar.map((item: SidebarItem, idx: number) => renderSidebarItem(item, 0, `top-${idx}`))}
      </div>

      {/* Social Footer */}
      <div className="custom-sidebar-footer">
        <a href="https://www.linkedin.com/in/luminhkhuong/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
        </a>
        <a href="https://github.com/minhkhuong2404" target="_blank" rel="noreferrer" aria-label="GitHub">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>
        </a>
        <a href="https://www.facebook.com/luminhkhuong/" target="_blank" rel="noreferrer" aria-label="Facebook">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </a>
        <a href="https://leetcode.com/u/luminhkhuong/" target="_blank" rel="noreferrer" aria-label="LeetCode">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .666-1.607L9.36 7.625l4.123-4.419a1.374 1.374 0 0 0-.999-3.206zM13.483 15.311h6.634a1.376 1.376 0 0 0 1.375-1.375 1.376 1.376 0 0 0-1.375-1.375h-6.634a1.376 1.376 0 0 0-1.375 1.375 1.376 1.376 0 0 0 1.375 1.375z"/>
          </svg>
        </a>
      </div>

      {/* Toggle Expand/Collapse Button */}
      <div className="custom-sidebar-toggle-wrapper">
        <button
          className="custom-sidebar-toggle-btn"
          onClick={onCollapse}
          aria-label={isHidden ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="toggle-icon">{isHidden ? '▶' : '◀'}</span>
          <span className="toggle-label">Collapse Sidebar</span>
        </button>
      </div>

      {/* Resize Handle */}
      {!isHidden && (
        <div
          className="custom-sidebar-resize-handle"
          onMouseDown={startResizing}
        />
      )}
    </div>
  );
}
