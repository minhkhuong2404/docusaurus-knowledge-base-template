/**
 * Scroll Restoration Client Module for Docusaurus
 * Saves page scroll position before navigating away, and restores the exact
 * position when the user navigates back (via browser back button or popstate).
 */

let isPopNavigation = false;
let scrollDebounceTimer: any = null;

function saveCurrentScrollPosition() {
  if (typeof window === 'undefined') return;
  const pathname = window.location.pathname;
  const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
  if (scrollY > 0) {
    try {
      sessionStorage.setItem(`scroll_pos_${pathname}`, String(Math.round(scrollY)));
    } catch {
      // Ignore quota errors
    }
  }
}

if (typeof window !== 'undefined') {
  // Listen for browser back / forward navigation
  window.addEventListener('popstate', () => {
    isPopNavigation = true;
  });

  // Debounced scroll listener: does NOT block the main thread during active scrolling
  window.addEventListener(
    'scroll',
    () => {
      if (scrollDebounceTimer !== null) {
        clearTimeout(scrollDebounceTimer);
      }
      scrollDebounceTimer = setTimeout(() => {
        saveCurrentScrollPosition();
        scrollDebounceTimer = null;
      }, 150);
    },
    { passive: true }
  );

  // Guarantee save when tab loses focus or navigates away
  window.addEventListener('pagehide', saveCurrentScrollPosition);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveCurrentScrollPosition();
    }
  });
}

export function onRouteDidUpdate({ location }: { location: { pathname: string; hash?: string } }) {
  if (typeof window === 'undefined') return;

  // Flush any pending save before route updates
  if (scrollDebounceTimer !== null) {
    clearTimeout(scrollDebounceTimer);
    scrollDebounceTimer = null;
    saveCurrentScrollPosition();
  }

  // If there's an anchor hash (e.g. #heading-title), let browser/Docusaurus jump to the anchor
  if (location.hash && location.hash.length > 1) {
    isPopNavigation = false;
    return;
  }

  // Restore previous position only when user navigated back (popstate)
  if (isPopNavigation) {
    isPopNavigation = false;
    try {
      const savedPos = sessionStorage.getItem(`scroll_pos_${location.pathname}`);
      const targetY = savedPos ? parseInt(savedPos, 10) : 0;
      if (targetY > 0) {
        // Immediate restore
        window.scrollTo({ top: targetY, behavior: 'auto' });
        // Single fallback check after layout settles
        window.requestAnimationFrame(() => {
          if (Math.abs((window.scrollY || 0) - targetY) > 5) {
            window.scrollTo({ top: targetY, behavior: 'auto' });
          }
        });
      }
    } catch {
      // Ignore sessionStorage read errors
    }
  }
}

export default {
  onRouteDidUpdate,
};
