/**
 * Lightweight, zero-dependency utilities for:
 * - Reading time estimation
 * - Topic -> Arcade game mapping
 * - Last-visited doc tracking (localStorage)
 * - Article bookmarks (localStorage)
 */

export interface LastVisitedDoc {
  path: string;
  title: string;
  visitedAt: number;
}

export interface BookmarkedDoc {
  path: string;
  title: string;
  savedAt: number;
}

export interface ArcadeRecommendation {
  gameName: string;
  tagline: string;
  href: string;
  accentColor: string;
}

export const LAST_VISITED_KEY = 'kb_last_visited_doc';
export const BOOKMARKS_KEY = 'kb_bookmarked_docs';

/**
 * Estimates reading time in minutes from raw text or word count.
 * Uses 220 WPM for dense technical engineering prose.
 */
export function estimateReadingMinutes(text: string, wordsPerMinute = 220): number {
  if (!text || typeof text !== 'string') return 1;
  const trimmed = text.trim();
  if (!trimmed) return 1;
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

/**
 * Maps a documentation pathname to the most relevant Arcade mini-game.
 */
export function getArcadeRecommendationForPath(pathname: string): ArcadeRecommendation {
  const p = (pathname || '').toLowerCase();

  if (p.includes('/database') || p.includes('/sql')) {
    return {
      gameName: 'SQL Index Optimizer',
      tagline: 'Tune real B+Tree indexes and slash query latency in Arcade',
      href: '/arcade',
      accentColor: '#0ea5e9',
    };
  }
  if (p.includes('/system-design') || p.includes('/kafka') || p.includes('/redis') || p.includes('/aws')) {
    return {
      gameName: 'Architecture Puzzle & Outage Boss',
      tagline: 'Assemble distributed topologies and survive live production incidents',
      href: '/arcade',
      accentColor: '#9333ea',
    };
  }
  if (p.includes('/java') || p.includes('/spring') || p.includes('/design-patterns') || p.includes('/solid')) {
    return {
      gameName: 'Spot The Bug Duel',
      tagline: 'Hunt subtle JVM concurrency and Spring production bugs under pressure',
      href: '/arcade',
      accentColor: '#f59e0b',
    };
  }
  return {
    gameName: 'Flashcard Arena',
    tagline: 'Test your recall and earn cosmic XP in the Engineering Arcade',
    href: '/arcade',
    accentColor: '#10b981',
  };
}

export function getLastVisitedDoc(): LastVisitedDoc | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LAST_VISITED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastVisitedDoc;
    if (parsed && typeof parsed.path === 'string' && typeof parsed.title === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveLastVisitedDoc(docPath: string, title: string): void {
  if (typeof window === 'undefined' || !docPath || !title) return;
  try {
    const payload: LastVisitedDoc = {
      path: docPath,
      title: title.trim(),
      visitedAt: Date.now(),
    };
    window.localStorage.setItem(LAST_VISITED_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

export function getBookmarkedDocs(): BookmarkedDoc[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toggleBookmarkedDoc(docPath: string, title: string): { bookmarked: boolean; list: BookmarkedDoc[] } {
  const current = getBookmarkedDocs();
  const exists = current.some((item) => item.path === docPath);
  const next = exists
    ? current.filter((item) => item.path !== docPath)
    : [{ path: docPath, title: title.trim() || docPath, savedAt: Date.now() }, ...current].slice(0, 50);

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors
    }
  }
  return { bookmarked: !exists, list: next };
}
