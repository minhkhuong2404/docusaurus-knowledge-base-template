/**
 * Scroll Restoration Client Module for Docusaurus
 * Saves page scroll position before navigating away, and restores the exact
 * position when the user navigates back (via browser back button or popstate).
 */

let isPopNavigation = false;

if (typeof window !== 'undefined') {
  // Listen for browser back / forward navigation
  window.addEventListener('popstate', () => {
    isPopNavigation = true;
  });

  // Track and continuously save scroll position for the current page
  let scrollSaveRaf: number | null = null;
  window.addEventListener(
    'scroll',
    () => {
      if (scrollSaveRaf !== null) return;
      scrollSaveRaf = window.requestAnimationFrame(() => {
        scrollSaveRaf = null;
        const pathname = window.location.pathname;
        const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
        if (scrollY > 0) {
          try {
            sessionStorage.setItem(`scroll_pos_${pathname}`, String(Math.round(scrollY)));
          } catch {
            // Ignore sessionStorage quota errors
          }
        }
      });
    },
    { passive: true }
  );
}

export function onRouteDidUpdate({ location }: { location: { pathname: string; hash?: string } }) {
  if (typeof window === 'undefined') return;

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
        // Immediate restore + multi-frame layout retry as markdown and diagrams render
        window.scrollTo({ top: targetY, behavior: 'auto' });
        setTimeout(() => {
          window.scrollTo({ top: targetY, behavior: 'auto' });
        }, 50);
        setTimeout(() => {
          window.scrollTo({ top: targetY, behavior: 'auto' });
        }, 150);
      }
    } catch {
      // Ignore sessionStorage read errors
    }
  }
}

export default {
  onRouteDidUpdate,
};
