import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import type { Props as DesktopProps } from '@theme/DocSidebar/Desktop';

import { useUserProgress } from '../../context/UserProgressContext';
import { isTrackableArticle } from '@site/src/utils/trackablePages';

// Type definitions for Sidebar Items
type SidebarItem = any;

interface CustomSidebarProps extends DesktopProps {}

function isCategoryActive(item: SidebarItem, activePath: string): boolean {
  if (item.type === 'category') {
    return item.items.some((subItem: SidebarItem) => isCategoryActive(subItem, activePath));
  }
  if (item.type === 'doc' || item.type === 'link') {
    return item.href === activePath;
  }
  return false;
}

function getAllDocLinks(items: SidebarItem[]): SidebarItem[] {
  let result: SidebarItem[] = [];
  if (!items) return result;
  items.forEach((item) => {
    if (item.type === 'doc' || item.type === 'link') {
      result.push(item);
    } else if (item.type === 'category' && Array.isArray(item.items)) {
      result = result.concat(getAllDocLinks(item.items));
    }
  });
  return result;
}

export default function CustomSidebarDesktop({ path, sidebar, onCollapse, isHidden }: CustomSidebarProps) {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [isResizing, setIsResizing] = useState(false);
  const sidebarWidthRef = useRef(300);

  const { progress, setTotalArticlesCount, isPageRead } = useUserProgress();
  const docLinks = useMemo(() => (sidebar ? getAllDocLinks(sidebar) : []), [sidebar]);

  useEffect(() => {
    if (docLinks.length > 0) {
      setTotalArticlesCount(docLinks.length);
    }
  }, [docLinks.length, setTotalArticlesCount]);

  const activeIndex = useMemo(() => {
    if (!path || docLinks.length === 0) return 0;
    const idx = docLinks.findIndex((item) => item.href === path);
    return idx !== -1 ? idx + 1 : 0;
  }, [docLinks, path]);

  const handleLocateCurrentPage = () => {
    if (!sidebar || !path) return;

    // Expand all categories that contain the active path
    const categoriesToOpen: Record<string, boolean> = {};
    function expandActive(items: SidebarItem[], keyPrefix: string = 'item') {
      items.forEach((item, idx) => {
        const itemKey = `${keyPrefix}-${item.label || item.href || idx}`;
        if (item.type === 'category') {
          if (isCategoryActive(item, path)) {
            categoriesToOpen[item.label] = true;
            categoriesToOpen[itemKey] = true;
            if (Array.isArray(item.items)) {
              expandActive(item.items, itemKey);
            }
          }
        }
      });
    }
    expandActive(sidebar);
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
        // Docusaurus sidebar has a 16px margin on the left
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

  // Auto-open active categories on load/path change
  useEffect(() => {
    const initialOpen: Record<string, boolean> = {};
    function traverse(items: SidebarItem[], keyPrefix: string = 'item') {
      items.forEach((item, idx) => {
        const itemKey = `${keyPrefix}-${item.label || item.href || idx}`;
        if (item.type === 'category') {
          if (isCategoryActive(item, path)) {
            initialOpen[item.label] = true;
            initialOpen[itemKey] = true;
          }
          if (Array.isArray(item.items)) {
            traverse(item.items, itemKey);
          }
        }
      });
    }
    if (sidebar) {
      traverse(sidebar);
    }
    setOpenCategories((prev) => ({ ...initialOpen, ...prev }));
  }, [sidebar, path]);

  const renderSidebarItem = (item: SidebarItem, depth: number, keyPrefix: string) => {
    const labelText = (item.label || '').trim();
    // Match leading emoji or icon character
    const match = labelText.match(/^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji})\s*(.*)$/u);
    const emoji = match ? match[1] : '';
    const cleanLabel = match ? match[2].trim() : labelText;
    const displayIcon = emoji || (cleanLabel ? cleanLabel.charAt(0) : '📄');

    const isActive = item.href === path;
    const itemKey = `${keyPrefix}-${item.label || item.href || 'item'}`;

    if (item.type === 'category') {
      const isOpen = openCategories[itemKey] ?? openCategories[item.label] ?? false;
      const hasActiveChild = isCategoryActive(item, path);

      const toggleOpen = () => {
        setOpenCategories((prev) => {
          const nextState = !isOpen;
          return {
            ...prev,
            [itemKey]: nextState,
            [item.label]: nextState,
          };
        });
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
          <i className="fab fa-linkedin-in"></i>
        </a>
        <a href="https://github.com/minhkhuong2404" target="_blank" rel="noreferrer" aria-label="GitHub">
          <i className="fab fa-github"></i>
        </a>
        <a href="https://www.facebook.com/luminhkhuong/" target="_blank" rel="noreferrer" aria-label="Facebook">
          <i className="fab fa-facebook-f"></i>
        </a>
        <a href="https://leetcode.com/u/luminhkhuong/" target="_blank" rel="noreferrer" aria-label="LeetCode">
          <i className="fab fa-leetcode"></i>
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
