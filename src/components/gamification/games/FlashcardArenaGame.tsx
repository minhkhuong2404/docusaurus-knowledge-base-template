import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUserProgress } from '../../../context/UserProgressContext';
import { triggerFireworks } from '../../../utils/fireworks';
import { arcadeAudio } from '../../../utils/arcadeAudio';
import { fetchConceptFlashcards, ConceptFlashcardItem } from '../../../services/googleSheetQuizService';
import { INITIAL_CONCEPT_FLASHCARDS } from '../../../data/conceptFlashcardsData';

type CategoryKey = 'all' | 'java' | 'spring-boot' | 'system-design' | 'database';
type ArenaMode = 'spaced' | 'match' | 'blitz';

const CATEGORY_TABS: { id: CategoryKey; label: string; icon: string; color: string }[] = [
  { id: 'all', label: 'All Cards', icon: '🌐', color: '#38bdf8' },
  { id: 'java', label: 'Java Core & JVM', icon: '☕', color: '#fbbf24' },
  { id: 'spring-boot', label: 'Spring Boot', icon: '🍃', color: '#34d399' },
  { id: 'system-design', label: 'System Design', icon: '🏗️', color: '#a855f7' },
  { id: 'database', label: 'Databases & Storage', icon: '🗄️', color: '#ec4899' },
];

interface TrueOrTrapQuestion {
  statement: string;
  isTrue: boolean;
  explanation: string;
  topic: string;
}

const TRUE_OR_TRAP_DECK: TrueOrTrapQuestion[] = [
  {
    statement: 'The volatile keyword in Java guarantees atomic compound operations like count++.',
    isTrue: false,
    explanation: 'Trap! volatile guarantees visibility and instruction ordering, but not atomicity for read-modify-write operations (use AtomicInteger or synchronized).',
    topic: 'Java Concurrency',
  },
  {
    statement: 'Read Committed isolation level allows Non-Repeatable Reads within the same transaction.',
    isTrue: true,
    explanation: 'True! Only Repeatable Read and Serializable prevent Non-Repeatable Reads.',
    topic: 'Databases',
  },
  {
    statement: 'Kafka guarantees strict total message ordering across all partitions in a topic.',
    isTrue: false,
    explanation: 'Trap! Kafka only guarantees strict FIFO ordering within an individual partition, never across partitions.',
    topic: 'Kafka',
  },
  {
    statement: 'Redis executes single-threaded commands in its main loop, eliminating thread context-switching locks for memory access.',
    isTrue: true,
    explanation: 'True! Redis runs the core command processor on a single thread and uses I/O multiplexing.',
    topic: 'Redis',
  },
  {
    statement: 'A 301 Redirect response forces browsers and CDNs to query the server on every subsequent click.',
    isTrue: false,
    explanation: 'Trap! 301 is Permanent Redirect and gets cached heavily in browsers; 302 (Found) is required for server-side click tracking.',
    topic: 'Networking',
  },
  {
    statement: 'ThreadLocal variables must be cleared via remove() when used with thread pools to avoid ClassLoader memory leaks.',
    isTrue: true,
    explanation: 'True! Thread pool worker threads persist across requests, retaining ThreadLocal values unless explicitly removed.',
    topic: 'Core Java',
  },
  {
    statement: 'B-Tree indexes are better than Hash indexes for range queries (BETWEEN, <, >).',
    isTrue: true,
    explanation: 'True! B-Trees maintain sorted leaf nodes linked for range scans; Hash indexes only support O(1) equality lookups.',
    topic: 'Databases',
  },
  {
    statement: 'Spring @Transactional rollbackFor defaults to rolling back on all Checked Exceptions.',
    isTrue: false,
    explanation: 'Trap! By default, Spring only rolls back on unchecked exceptions (RuntimeException and Error), not Exception.',
    topic: 'Spring Boot',
  },
];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface MatchTile {
  id: string;
  cardId: string;
  type: 'concept' | 'def';
  text: string;
  matched: boolean;
}

export default function FlashcardArenaGame(): React.JSX.Element {
  const { addExp, saveMiniGameScore, unlockAchievement } = useUserProgress();
  const [arenaMode, setArenaMode] = useState<ArenaMode>('spaced');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deckFilter, setDeckFilter] = useState<'all' | 'starred' | 'mastered'>('all');
  const [allCards, setAllCards] = useState<ConceptFlashcardItem[]>(INITIAL_CONCEPT_FLASHCARDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Speed Match Mode State
  const [matchTiles, setMatchTiles] = useState<MatchTile[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [matchTimeLeft, setMatchTimeLeft] = useState<number>(45);
  const [isMatchActive, setIsMatchActive] = useState<boolean>(false);
  const [matchScore, setMatchScore] = useState<number>(0);

  // True or Trap Blitz Mode State
  const [blitzIndex, setBlitzIndex] = useState<number>(0);
  const [blitzScore, setBlitzScore] = useState<number>(0);
  const [blitzStreak, setBlitzStreak] = useState<number>(0);
  const [blitzTimeLeft, setBlitzTimeLeft] = useState<number>(60);
  const [isBlitzActive, setIsBlitzActive] = useState<boolean>(false);
  const [blitzFeedback, setBlitzFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);

  // Bookmarking & Mastery state in localStorage
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('concept_flashcard_bookmarked_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [masteredIds, setMasteredIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('concept_flashcard_mastered_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleBookmark = (id: string) => {
    arcadeAudio.playBlip();
    setBookmarkedIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('concept_flashcard_bookmarked_ids', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const toggleMastery = (id: string) => {
    setMasteredIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem('concept_flashcard_mastered_ids', JSON.stringify(updated));
      } catch {}
      addExp(25, `Mastered concept: ${id}`);
      saveMiniGameScore('flashcards', updated.length * 25);
      unlockAchievement('flashcard_scholar');
      arcadeAudio.playVictory();
      triggerFireworks(2000);
      return updated;
    });
  };

  // Leitner spaced review action
  const handleLeitnerRate = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (rating === 'again') {
      arcadeAudio.playError();
    } else {
      arcadeAudio.playCorrect();
      if (rating === 'easy') {
        toggleMastery(card.id);
      }
    }
    handleNext();
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await fetchConceptFlashcards();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setAllCards(data);
        }
      } catch (err) {
        console.error('Error loading concept flashcards:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeDeck = useMemo(() => {
    return allCards.filter((c) => {
      const matchCategory = selectedCategory === 'all' || c.category === selectedCategory;
      const topicName = c.topic || '';
      const whatItIs = c.whatItIs || '';
      const matchSearch =
        !searchQuery.trim() ||
        topicName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        whatItIs.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.categoryLabel && c.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchFilter =
        deckFilter === 'all'
          ? true
          : deckFilter === 'starred'
          ? bookmarkedIds.includes(c.id)
          : masteredIds.includes(c.id);

      return matchCategory && matchSearch && matchFilter;
    });
  }, [allCards, selectedCategory, searchQuery, deckFilter, bookmarkedIds, masteredIds]);

  const currentSafeIndex = activeDeck.length > 0 ? currentIndex % activeDeck.length : 0;
  const card = activeDeck[currentSafeIndex] || INITIAL_CONCEPT_FLASHCARDS[0];

  const handleNext = () => {
    arcadeAudio.playFlip();
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, activeDeck.length));
  };

  const handlePrev = () => {
    arcadeAudio.playFlip();
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + activeDeck.length) % Math.max(1, activeDeck.length));
  };

  const handleShuffle = () => {
    arcadeAudio.playLaser();
    setAllCards((prev) => shuffle(prev));
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // ── ⚡ SPEED MATCH MATRIX ENGINE ──
  const startMatchGame = () => {
    arcadeAudio.playLaser();
    const sourcePool = activeDeck.length >= 6 ? activeDeck : INITIAL_CONCEPT_FLASHCARDS;
    const sampled = shuffle(sourcePool).slice(0, 6);

    const tiles: MatchTile[] = [];
    sampled.forEach((c) => {
      tiles.push({
        id: `c-${c.id}`,
        cardId: c.id,
        type: 'concept',
        text: c.topic,
        matched: false,
      });
      tiles.push({
        id: `d-${c.id}`,
        cardId: c.id,
        type: 'def',
        text: c.whatItIs.length > 70 ? c.whatItIs.slice(0, 68) + '...' : c.whatItIs,
        matched: false,
      });
    });

    setMatchTiles(shuffle(tiles));
    setSelectedTileId(null);
    setMatchTimeLeft(45);
    setMatchScore(0);
    setIsMatchActive(true);
  };

  useEffect(() => {
    if (!isMatchActive) return;
    if (matchTimeLeft <= 0) {
      setIsMatchActive(false);
      arcadeAudio.playError();
      return;
    }
    const timer = setInterval(() => {
      setMatchTimeLeft((p) => p - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isMatchActive, matchTimeLeft]);

  const handleTileClick = (tileId: string) => {
    const tile = matchTiles.find((t) => t.id === tileId);
    if (!tile || tile.matched) return;

    arcadeAudio.playBlip();

    if (!selectedTileId) {
      setSelectedTileId(tileId);
      return;
    }

    if (selectedTileId === tileId) {
      setSelectedTileId(null);
      return;
    }

    const firstTile = matchTiles.find((t) => t.id === selectedTileId);
    if (!firstTile) {
      setSelectedTileId(tileId);
      return;
    }

    // Check match condition: same cardId, different type
    if (firstTile.cardId === tile.cardId && firstTile.type !== tile.type) {
      arcadeAudio.playCorrect();
      setMatchTiles((prev) =>
        prev.map((t) => (t.id === firstTile.id || t.id === tile.id ? { ...t, matched: true } : t))
      );
      setSelectedTileId(null);
      const newScore = matchScore + 100;
      setMatchScore(newScore);

      // Check if all matched
      const remainingUnmatched = matchTiles.filter((t) => !t.matched && t.id !== firstTile.id && t.id !== tile.id);
      if (remainingUnmatched.length === 0) {
        setIsMatchActive(false);
        arcadeAudio.playVictory();
        triggerFireworks(2500);
        addExp(50, 'Mastered Speed Match Grid');
        saveMiniGameScore('flashcards', newScore);
      }
    } else {
      arcadeAudio.playError();
      setSelectedTileId(null);
    }
  };

  // ── ⚔️ TRUE OR TRAP BLITZ ENGINE ──
  const startBlitzGame = () => {
    arcadeAudio.playLaser();
    setBlitzIndex(0);
    setBlitzScore(0);
    setBlitzStreak(0);
    setBlitzTimeLeft(60);
    setBlitzFeedback(null);
    setIsBlitzActive(true);
  };

  useEffect(() => {
    if (!isBlitzActive) return;
    if (blitzTimeLeft <= 0) {
      setIsBlitzActive(false);
      arcadeAudio.playVictory();
      triggerFireworks(2000);
      return;
    }
    const timer = setInterval(() => {
      setBlitzTimeLeft((p) => p - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isBlitzActive, blitzTimeLeft]);

  const handleBlitzAnswer = (answeredTrue: boolean) => {
    if (!isBlitzActive || blitzFeedback) return;
    const currentQ = TRUE_OR_TRAP_DECK[blitzIndex % TRUE_OR_TRAP_DECK.length];
    const isCorrect = answeredTrue === currentQ.isTrue;

    if (isCorrect) {
      arcadeAudio.playCorrect();
      const newStreak = blitzStreak + 1;
      setBlitzStreak(newStreak);
      const points = 100 + newStreak * 25;
      setBlitzScore((p) => p + points);
      setBlitzFeedback({ isCorrect: true, text: `✓ Correct! ${currentQ.explanation}` });
    } else {
      arcadeAudio.playError();
      setBlitzStreak(0);
      setBlitzFeedback({ isCorrect: false, text: `✗ Trap! ${currentQ.explanation}` });
    }

    setTimeout(() => {
      setBlitzFeedback(null);
      setBlitzIndex((p) => p + 1);
    }, 1200);
  };

  const isBookmarked = bookmarkedIds.includes(card.id);
  const isMastered = masteredIds.includes(card.id);

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(9, 13, 22, 0.98) 100%)',
        borderRadius: '18px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '22px',
        color: '#f8fafc',
      }}
    >
      {/* ── Arena Mode Switcher Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          paddingBottom: '14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'spaced', label: '📇 Spaced Recall', icon: '🧠' },
            { id: 'match', label: '⚡ Speed Match Matrix', icon: '🧩' },
            { id: 'blitz', label: '⚔️ True or Trap? Blitz', icon: '🎯' },
          ].map((mode) => {
            const isSelected = arenaMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  arcadeAudio.playFlip();
                  setArenaMode(mode.id as any);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1.5px solid ${isSelected ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
                  color: isSelected ? '#10b981' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', fontSize: '0.74rem', fontWeight: 800 }}>
          🎯 {masteredIds.length} / {allCards.length} Mastered
        </div>
      </div>

      {/* ── MODE 1: SPACED RECALL FLASHCARDS ── */}
      {arenaMode === 'spaced' && (
        <div>
          {/* Controls bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <select
              value={selectedCategory}
              onChange={(e) => {
                arcadeAudio.playBlip();
                setSelectedCategory(e.target.value as CategoryKey);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: '#0f172a',
                border: '1.5px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                fontSize: '0.82rem',
                fontWeight: 800,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {CATEGORY_TABS.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.icon} {tab.label}
                </option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={handlePrev}
                style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                ◀ Prev
              </button>
              <button
                type="button"
                onClick={handleNext}
                style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Next ▶
              </button>
              <button
                type="button"
                onClick={handleShuffle}
                style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                🔀 Shuffle
              </button>
            </div>
          </div>

          {/* Flipcard Canvas */}
          <div
            onClick={() => {
              arcadeAudio.playFlip();
              setIsFlipped(!isFlipped);
            }}
            style={{
              minHeight: '260px',
              borderRadius: '16px',
              background: isFlipped ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' : 'linear-gradient(135deg, #090d16 0%, #0f172a 100%)',
              border: isFlipped ? '2px solid #a855f7' : '1.5px solid rgba(56, 189, 248, 0.4)',
              padding: '24px',
              cursor: 'pointer',
              marginBottom: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: isFlipped ? '0 0 25px rgba(168, 85, 247, 0.3)' : '0 0 20px rgba(56, 189, 248, 0.2)',
              transition: 'all 0.2s ease',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                  {card.categoryLabel || card.category}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.45)' }}>
                  Card {currentSafeIndex + 1} of {activeDeck.length} • Click to Flip 🔄
                </span>
              </div>

              {!isFlipped ? (
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff', marginBottom: '8px' }}>
                    {card.topic}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.5 }}>
                    {card.whatItIs}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#c084fc', marginBottom: '6px', textTransform: 'uppercase' }}>
                    💡 Architectural Internals & Interview Core:
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#ffffff', lineHeight: 1.55, marginBottom: '10px' }}>
                    {card.howItWorks || card.whatItIs}
                  </div>
                  {card.tradeoffs && (
                    <div style={{ fontSize: '0.78rem', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '6px 10px', borderRadius: '6px' }}>
                      ⚖️ Tradeoffs: {card.tradeoffs}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookmark(card.id);
                  }}
                  style={{ background: 'none', border: 'none', color: isBookmarked ? '#fbbf24' : 'rgba(255, 255, 255, 0.4)', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  {isBookmarked ? '⭐ Starred' : '☆ Star'}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMastery(card.id);
                  }}
                  style={{ background: 'none', border: 'none', color: isMastered ? '#34d399' : 'rgba(255, 255, 255, 0.4)', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  {isMastered ? '✓ Mastered' : '○ Mark Mastered'}
                </button>
              </div>

              <span style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                {isFlipped ? 'Answer View' : 'Question View'}
              </span>
            </div>
          </div>

          {/* Leitner Spaced Review Rating Bar */}
          {isFlipped && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => handleLeitnerRate('again')}
                style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', fontWeight: 800, fontSize: '0.76rem', cursor: 'pointer' }}
              >
                🔴 Again (1m)
              </button>
              <button
                type="button"
                onClick={() => handleLeitnerRate('hard')}
                style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#fde68a', fontWeight: 800, fontSize: '0.76rem', cursor: 'pointer' }}
              >
                🟡 Hard (1d)
              </button>
              <button
                type="button"
                onClick={() => handleLeitnerRate('good')}
                style={{ padding: '8px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8', color: '#bae6fd', fontWeight: 800, fontSize: '0.76rem', cursor: 'pointer' }}
              >
                🟢 Good (3d)
              </button>
              <button
                type="button"
                onClick={() => handleLeitnerRate('easy')}
                style={{ padding: '8px', borderRadius: '8px', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid #34d399', color: '#bbf7d0', fontWeight: 800, fontSize: '0.76rem', cursor: 'pointer' }}
              >
                ⚡ Easy (7d)
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── MODE 2: SPEED MATCH MATRIX ── */}
      {arenaMode === 'match' && (
        <div>
          {!isMatchActive ? (
            <div style={{ textAlign: 'center', padding: '30px 10px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🧩</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', marginBottom: '6px' }}>
                Speed Match Matrix (Memory Grid)
              </div>
              <div style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.7)', maxWidth: '480px', margin: '0 auto 16px auto', lineHeight: 1.45 }}>
                Match 6 core architecture concepts with their exact definitions before the 45-second timer expires.
              </div>
              <button
                type="button"
                onClick={startMatchGame}
                style={{
                  padding: '12px 32px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                }}
              >
                🚀 Start 45s Match Grid
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: matchTimeLeft <= 10 ? '#ef4444' : '#34d399' }}>
                  ⏱️ Time Left: {matchTimeLeft}s
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fbbf24' }}>
                  🏆 Score: {matchScore} pts
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                {matchTiles.map((tile) => {
                  const isSelected = selectedTileId === tile.id;
                  if (tile.matched) {
                    return (
                      <div
                        key={tile.id}
                        style={{
                          padding: '14px',
                          borderRadius: '10px',
                          background: 'rgba(52, 211, 153, 0.1)',
                          border: '1.5px solid rgba(52, 211, 153, 0.3)',
                          color: '#34d399',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          textAlign: 'center',
                          opacity: 0.4,
                        }}
                      >
                        ✓ Matched
                      </div>
                    );
                  }

                  return (
                    <div
                      key={tile.id}
                      onClick={() => handleTileClick(tile.id)}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.85)',
                        fontSize: '0.8rem',
                        fontWeight: tile.type === 'concept' ? 800 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        minHeight: '80px',
                        boxShadow: isSelected ? '0 0 14px rgba(56, 189, 248, 0.3)' : 'none',
                      }}
                    >
                      <div style={{ fontSize: '0.66rem', color: tile.type === 'concept' ? '#38bdf8' : '#c084fc', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 800 }}>
                        {tile.type === 'concept' ? '💡 Concept' : '📖 Definition'}
                      </div>
                      <div>{tile.text}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODE 3: TRUE OR TRAP BLITZ ── */}
      {arenaMode === 'blitz' && (
        <div>
          {!isBlitzActive ? (
            <div style={{ textAlign: 'center', padding: '30px 10px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>⚔️</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', marginBottom: '6px' }}>
                True or Trap? 60-Second Interview Blitz
              </div>
              <div style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.7)', maxWidth: '480px', margin: '0 auto 16px auto', lineHeight: 1.45 }}>
                Rapid-fire gauntlet testing tricky misconceptions in Concurrency, Databases, and Distributed Systems.
              </div>
              <button
                type="button"
                onClick={startBlitzGame}
                style={{
                  padding: '12px 32px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)',
                }}
              >
                🚀 Start 60s Blitz
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: blitzTimeLeft <= 10 ? '#ef4444' : '#38bdf8' }}>
                  ⏱️ {blitzTimeLeft}s
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fde68a' }}>
                  🔥 Streak: {blitzStreak}x
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fbbf24' }}>
                  🏆 Score: {blitzScore} pts
                </span>
              </div>

              {/* Statement Card */}
              <div
                style={{
                  padding: '24px',
                  borderRadius: '14px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1.5px solid rgba(255, 255, 255, 0.12)',
                  marginBottom: '16px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
                  {TRUE_OR_TRAP_DECK[blitzIndex % TRUE_OR_TRAP_DECK.length].topic}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.45 }}>
                  "{TRUE_OR_TRAP_DECK[blitzIndex % TRUE_OR_TRAP_DECK.length].statement}"
                </div>
              </div>

              {/* Feedback Prompt */}
              {blitzFeedback && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: blitzFeedback.isCorrect ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${blitzFeedback.isCorrect ? '#34d399' : '#ef4444'}`,
                    color: blitzFeedback.isCorrect ? '#34d399' : '#fca5a5',
                    fontSize: '0.82rem',
                    marginBottom: '12px',
                    textAlign: 'center',
                  }}
                >
                  {blitzFeedback.text}
                </div>
              )}

              {/* Choice Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  type="button"
                  disabled={Boolean(blitzFeedback)}
                  onClick={() => handleBlitzAnswer(true)}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'rgba(52, 211, 153, 0.15)',
                    border: '2px solid #34d399',
                    color: '#34d399',
                    fontWeight: 900,
                    fontSize: '1.05rem',
                    cursor: blitzFeedback ? 'default' : 'pointer',
                    boxShadow: '0 4px 14px rgba(52, 211, 153, 0.2)',
                  }}
                >
                  ✓ TRUE
                </button>
                <button
                  type="button"
                  disabled={Boolean(blitzFeedback)}
                  onClick={() => handleBlitzAnswer(false)}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '2px solid #ef4444',
                    color: '#f87171',
                    fontWeight: 900,
                    fontSize: '1.05rem',
                    cursor: blitzFeedback ? 'default' : 'pointer',
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.2)',
                  }}
                >
                  ✗ TRAP / FALSE
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
