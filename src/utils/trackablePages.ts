/**
 * Utility to determine if a page/article is eligible for Reading Progress Tracking & "Mark as Read".
 *
 * Included:
 * - Technical Knowledge (/technical-knowledge/...)
 * - Non-Technical Knowledge (/non-technical-knowledge/...)
 * - Coding Interview Prep (/technical-knowledge/coding-interview-prep/...)
 * - Behavioral Interview (/technical-knowledge/interview-questions/behavioral/...)
 * - Books (/books/...)
 * - Intro & General Interview Framework (/intro, /interview-framework)
 *
 * Excluded:
 * - All Daily Quiz pages (*daily-quiz*, *quiz*)
 * - Company Interview Experiences (/company/...)
 * - LeetCode Company-Wise (/technical-knowledge/dsa/leetcode-companywise/...)
 */
export const TOTAL_TRACKABLE_ARTICLES_DEFAULT = 601;

export function isTrackableArticle(href?: string | null): boolean {
  if (!href) return false;
  const path = href.toLowerCase().trim();

  // 1. EXCLUDE all Daily Quiz related pages
  if (path.includes('quiz')) return false;

  // 2. EXCLUDE Company Interview Experiences & LeetCode Company-Wise
  if (path.startsWith('/company') || path.includes('leetcode-companywise')) return false;

  // 3. INCLUDE eligible sections
  if (
    path.includes('/technical-knowledge/') ||
    path.includes('/non-technical-knowledge/') ||
    path.includes('/books/') ||
    path === '/intro' ||
    path.endsWith('/intro') ||
    path.includes('/interview-framework')
  ) {
    return true;
  }

  return false;
}
