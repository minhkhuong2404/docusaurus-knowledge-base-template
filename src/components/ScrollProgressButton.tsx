import React, { useState, useEffect } from 'react';
import { useLocation } from '@docusaurus/router';
import { useUserProgress } from '../context/UserProgressContext';
import { isTrackableArticle } from '../utils/trackablePages';

export default function ScrollProgressButton() {
  const [scrollPercent, setScrollPercent] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const location = useLocation();
  const pagePath = location.pathname;
  const { isPageRead, markPageAsRead, isManuallyUnmarked } = useUserProgress();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const totalScrollable = scrollHeight - clientHeight;

      if (totalScrollable > 0) {
        const percent = Math.min(100, Math.max(0, Math.round((scrollTop / totalScrollable) * 100)));
        setScrollPercent(percent);
        setIsVisible(scrollTop > 40 || percent > 0);

        // Auto mark as read when user reaches end of an eligible article (>= 90% or within 150px of bottom), UNLESS manually unmarked
        if (percent >= 90 || (totalScrollable - scrollTop) < 150) {
          if (isTrackableArticle(pagePath) && !isPageRead(pagePath) && !isManuallyUnmarked(pagePath)) {
            markPageAsRead(pagePath);
          }
        }
      } else {
        setScrollPercent(100);
        setIsVisible(false);
        // Short page without scrollbar — auto mark as read if eligible and not manually unmarked
        if (isTrackableArticle(pagePath) && !isPageRead(pagePath) && !isManuallyUnmarked(pagePath)) {
          markPageAsRead(pagePath);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [pagePath, isPageRead, markPageAsRead, isManuallyUnmarked]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAtEnd = scrollPercent >= 98;

  // Circle radius & circumference for SVG radial progress
  const size = 52;
  const strokeWidth = 3.5;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollPercent / 100) * circumference;

  return (
    <>
      {/* Fixed Top Reading Progress Bar */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: `${scrollPercent}%`,
          height: '3px',
          background: isAtEnd
            ? 'linear-gradient(90deg, #4ade80, #22c55e)'
            : 'linear-gradient(90deg, #38bdf8, #3b82f6, #a855f7)',
          boxShadow: isAtEnd
            ? '0 0 10px rgba(74, 222, 128, 0.8)'
            : '0 0 10px rgba(56, 189, 248, 0.8)',
          zIndex: 999999,
          transition: 'width 0.1s ease-out, background 0.3s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Floating Bottom-Right Scroll Progress Button */}
      <div
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
          type="button"
          onClick={scrollToTop}
          title={isAtEnd ? '100% Read — Click to scroll to top' : `Page Scroll: ${scrollPercent}% — Click to scroll to top`}
          aria-label={`Scroll progress ${scrollPercent}%. Click to scroll to top`}
          style={{
            position: 'relative',
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
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
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={isAtEnd ? '#4ade80' : '#38bdf8'}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.15s ease-out, stroke 0.3s ease',
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
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {scrollPercent}%
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
