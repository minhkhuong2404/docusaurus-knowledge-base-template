import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from '@docusaurus/router';
import { useUserProgress } from '../context/UserProgressContext';
import { isTrackableArticle } from '../utils/trackablePages';

export default function ScrollProgressButton() {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isAtEnd, setIsAtEnd] = useState<boolean>(false);

  const isVisibleRef = useRef<boolean>(false);
  const isAtEndRef = useRef<boolean>(false);
  const hasMarkedReadRef = useRef<boolean>(false);

  const topBarRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  const percentTextRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const location = useLocation();
  const pagePath = location.pathname;
  const { isPageRead, markPageAsRead, isManuallyUnmarked } = useUserProgress();

  // Circle dimensions
  const size = 52;
  const strokeWidth = 3.5;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  // Reset read flag on route change
  useEffect(() => {
    hasMarkedReadRef.current = false;
    isAtEndRef.current = false;
    setIsAtEnd(false);
  }, [pagePath]);

  useEffect(() => {
    if (pagePath.startsWith('/arcade') || pagePath.startsWith('/profile') || pagePath === '/profile' || pagePath.startsWith('/stats')) {
      return;
    }

    let rafId: number | null = null;

    const computeScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const totalScrollable = scrollHeight - clientHeight;

      let percent = 0;
      if (totalScrollable > 0) {
        percent = Math.min(100, Math.max(0, Math.round((scrollTop / totalScrollable) * 100)));
      } else {
        percent = 100;
      }

      // 1. Direct DOM update for Top Reading Bar (0 React re-renders)
      if (topBarRef.current) {
        topBarRef.current.style.width = `${percent}%`;
        if (percent >= 98) {
          topBarRef.current.style.background = 'linear-gradient(90deg, #4ade80, #22c55e)';
          topBarRef.current.style.boxShadow = '0 0 10px rgba(74, 222, 128, 0.8)';
        } else {
          topBarRef.current.style.background = 'linear-gradient(90deg, #38bdf8, #3b82f6, #a855f7)';
          topBarRef.current.style.boxShadow = '0 0 10px rgba(56, 189, 248, 0.8)';
        }
      }

      // 2. Direct DOM update for Radial SVG Progress Ring (0 React re-renders)
      if (circleRef.current) {
        const offset = circumference - (percent / 100) * circumference;
        circleRef.current.style.strokeDashoffset = `${offset}`;
        circleRef.current.setAttribute('stroke', percent >= 98 ? '#4ade80' : '#38bdf8');
      }

      // 3. Direct DOM update for Percent Text (0 React re-renders)
      if (percentTextRef.current) {
        percentTextRef.current.textContent = `${percent}%`;
      }

      // 4. Update button tooltip
      if (buttonRef.current) {
        buttonRef.current.title = percent >= 98
          ? '100% Read — Click to scroll to top'
          : `Page Scroll: ${percent}% — Click to scroll to top`;
      }

      // 5. Only trigger React state update when visibility status actually changes (boolean flip)
      const shouldBeVisible = totalScrollable > 0 && (scrollTop > 40 || percent > 0);
      if (shouldBeVisible !== isVisibleRef.current) {
        isVisibleRef.current = shouldBeVisible;
        setIsVisible(shouldBeVisible);
      }

      // 6. Only trigger React state update when completion status flips
      const completed = percent >= 98;
      if (completed !== isAtEndRef.current) {
        isAtEndRef.current = completed;
        setIsAtEnd(completed);
      }

      // 7. Auto mark as read: GUARDED by ref so it runs AT MOST ONCE per page visit
      if (percent >= 90 || (totalScrollable > 0 && (totalScrollable - scrollTop) < 150)) {
        if (!hasMarkedReadRef.current && isTrackableArticle(pagePath) && !isManuallyUnmarked(pagePath)) {
          hasMarkedReadRef.current = true;
          markPageAsRead(pagePath);
        }
      } else if (totalScrollable <= 0) {
        if (!hasMarkedReadRef.current && isTrackableArticle(pagePath) && !isManuallyUnmarked(pagePath)) {
          hasMarkedReadRef.current = true;
          markPageAsRead(pagePath);
        }
      }
    };

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        computeScroll();
        rafId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    computeScroll(); // Initial check

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pagePath, isPageRead, markPageAsRead, isManuallyUnmarked, circumference]);

  if (pagePath.startsWith('/arcade') || pagePath.startsWith('/stats') || pagePath === '/stats') {
    return null;
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      sessionStorage.removeItem(`scroll_pos_${pagePath}`);
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <>
      {/* Fixed Top Reading Progress Bar */}
      <div
        ref={topBarRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '0%',
          height: '3px',
          background: 'linear-gradient(90deg, #38bdf8, #3b82f6, #a855f7)',
          boxShadow: '0 0 10px rgba(56, 189, 248, 0.8)',
          zIndex: 999999,
          transition: 'width 0.08s ease-out, background 0.3s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Floating Bottom-Right Scroll Progress Button */}
      <div
        className="scroll-progress-wrapper"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.85)',
          pointerEvents: isVisible ? 'auto' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <button
          ref={buttonRef}
          type="button"
          className="scroll-progress-btn"
          onClick={scrollToTop}
          title="Click to scroll to top"
          aria-label="Scroll progress. Click to scroll to top"
          style={{
            position: 'relative',
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            touchAction: 'manipulation',
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxSizing: 'border-box',
            border: 'none',
            color: isAtEnd ? '#4ade80' : '#ffffff',
            boxShadow: isAtEnd
              ? '0 6px 20px rgba(74, 222, 128, 0.3), 0 0 0 1px rgba(74, 222, 128, 0.25)'
              : '0 6px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            margin: 0,
            outline: 'none',
            transition: 'all 0.2s ease',
            overflow: 'hidden',
          }}
        >
          {/* Radial SVG Progress Ring */}
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              transform: 'rotate(-90deg)',
              pointerEvents: 'none',
            }}
          >
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth={strokeWidth}
            />
            <circle
              ref={circleRef}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#38bdf8"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.08s ease-out, stroke 0.3s ease',
              }}
            />
          </svg>

          {/* Inner Content - Perfectly Centered */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              gap: '2px',
            }}
          >
            {isAtEnd ? (
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4ade80', lineHeight: 1 }}>100%</span>
            ) : (
              <>
                <span
                  ref={percentTextRef}
                  style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1, letterSpacing: '-0.02em' }}
                >
                  0%
                </span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ opacity: 0.75, color: '#94a3b8' }}
                >
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              </>
            )}
          </div>
        </button>
      </div>
    </>
  );
}
