import React, { useState, useEffect, useRef } from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import type { Props as DesktopProps } from '@theme/DocSidebar/Desktop';

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

export default function CustomSidebarDesktop({ path, sidebar, onCollapse, isHidden }: CustomSidebarProps) {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [isResizing, setIsResizing] = useState(false);
  const sidebarWidthRef = useRef(300);

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
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      // Docusaurus sidebar has a 16px margin on the left
      const newWidth = Math.max(200, Math.min(480, e.clientX - 16));
      sidebarWidthRef.current = newWidth;
      document.documentElement.style.setProperty('--doc-sidebar-width', `${newWidth}px`);
    };

    const handleMouseUp = () => {
      if (isResizing) {
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
    function traverse(items: SidebarItem[]) {
      items.forEach((item) => {
        if (item.type === 'category') {
          if (isCategoryActive(item, path)) {
            initialOpen[item.label] = true;
          }
          traverse(item.items);
        }
      });
    }
    if (sidebar) {
      traverse(sidebar);
    }
    setOpenCategories((prev) => ({ ...initialOpen, ...prev }));
  }, [sidebar, path]);

  const renderSidebarItem = (item: SidebarItem, depth: number, keyPrefix: string) => {
    const labelText = item.label || '';
    // Match leading emoji or icon character
    const match = labelText.match(/^(\p{Emoji_Presentation}|\p{Emoji})\s*(.*)$/u);
    const emoji = match ? match[1] : '';
    const cleanLabel = match ? match[2] : labelText;
    const displayIcon = emoji || (cleanLabel ? cleanLabel.charAt(0) : '📄');

    const isActive = item.href === path;
    const itemKey = `${keyPrefix}-${item.label || item.href || 'item'}`;

    if (item.type === 'category') {
      const isOpen = openCategories[item.label];
      const hasActiveChild = isCategoryActive(item, path);

      const toggleOpen = () => {
        setOpenCategories((prev) => ({
          ...prev,
          [item.label]: !prev[item.label],
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
      if (isHidden) {
        return (
          <Link
            key={itemKey}
            to={item.href}
            className={clsx('custom-menu-link', isActive && 'active')}
            title={cleanLabel}
          >
            <span className="menu-icon">{displayIcon}</span>
          </Link>
        );
      }

      return (
        <Link
          key={itemKey}
          to={item.href}
          className={clsx('custom-menu-link', isActive && 'active')}
          style={depth > 0 ? { paddingLeft: '12px' } : undefined}
          title={cleanLabel}
        >
          {depth === 0 && <span className="menu-icon">{displayIcon}</span>}
          <span className="menu-label">{cleanLabel}</span>
        </Link>
      );
    }

    return null;
  };

  return (
    <div className={clsx('custom-sidebar-container', isHidden && 'collapsed')}>

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
