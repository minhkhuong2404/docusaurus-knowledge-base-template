/**
 * Non-repeating random question & scenario selector for Galactic Arcade games.
 * Ensures that every playthrough and every "Skip / Next" action picks a random
 * unseen item without repeating until the entire pool has been exhausted.
 */

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function readSeenIds(storageKey: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeSeenIds(storageKey: string, ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(ids);
    sessionStorage.setItem(storageKey, serialized);
    localStorage.setItem(storageKey, serialized);
  } catch {
    // Ignore storage quota errors
  }
}

export function pickRandomUnseenItem<T extends { id: string }>(
  pool: T[],
  seenIds: string[],
  currentId?: string
): { item: T; index: number; nextSeenIds: string[] } {
  if (!pool || pool.length === 0) {
    throw new Error('Cannot pick from an empty pool');
  }
  if (pool.length === 1) {
    return {
      item: pool[0],
      index: 0,
      nextSeenIds: [pool[0].id],
    };
  }

  const seenSet = new Set(seenIds);
  const unseenCandidates = pool.filter((item) => item.id !== currentId && !seenSet.has(item.id));

  if (unseenCandidates.length > 0) {
    const chosen = unseenCandidates[Math.floor(Math.random() * unseenCandidates.length)];
    const index = pool.findIndex((item) => item.id === chosen.id);
    const nextSeenIds = seenSet.has(chosen.id) ? seenIds : [...seenIds, chosen.id];
    return {
      item: chosen,
      index: index >= 0 ? index : 0,
      nextSeenIds,
    };
  }

  // All items in the filtered pool have been seen — reset cycle but avoid repeating currentId immediately
  const nonCurrentCandidates = pool.filter((item) => item.id !== currentId);
  const fallbackPool = nonCurrentCandidates.length > 0 ? nonCurrentCandidates : pool;
  const chosen = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
  const index = pool.findIndex((item) => item.id === chosen.id);

  return {
    item: chosen,
    index: index >= 0 ? index : 0,
    nextSeenIds: [chosen.id],
  };
}

export function pickRandomUnseenBatch<T extends { id: string }>(
  pool: T[],
  count: number,
  seenIds: string[]
): { batch: T[]; nextSeenIds: string[] } {
  if (!pool || pool.length === 0) {
    return { batch: [], nextSeenIds: seenIds };
  }

  const targetCount = Math.min(count, pool.length);
  const seenSet = new Set(seenIds);
  const unseen = shuffleArray(pool.filter((item) => !seenSet.has(item.id)));

  if (unseen.length >= targetCount) {
    const batch = unseen.slice(0, targetCount);
    const nextSeenIds = [...seenIds, ...batch.map((item) => item.id)];
    return { batch, nextSeenIds };
  }

  // Not enough unseen items left to fill a full batch: take all remaining unseen + random seen items, then reset cycle
  const seen = shuffleArray(pool.filter((item) => seenSet.has(item.id)));
  const needed = targetCount - unseen.length;
  const batch = shuffleArray([...unseen, ...seen.slice(0, needed)]);
  const nextSeenIds = batch.map((item) => item.id);

  return { batch, nextSeenIds };
}
