import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUserProgress } from '../../../context/UserProgressContext';
import { triggerFireworks } from '../../../utils/fireworks';
import { fetchConceptFlashcards, ConceptFlashcardItem } from '../../../services/googleSheetQuizService';

type CategoryKey = 'all' | 'java' | 'spring-boot' | 'system-design' | 'database';

const CATEGORY_TABS: { id: CategoryKey; label: string; icon: string; color: string }[] = [
  { id: 'all', label: 'All Arenas (5,120 Cards)', icon: '🌐', color: '#38bdf8' },
  { id: 'java', label: 'Java Core & JVM (1,280)', icon: '☕', color: '#fbbf24' },
  { id: 'spring-boot', label: 'Spring Boot & Microservices (1,280)', icon: '🍃', color: '#34d399' },
  { id: 'system-design', label: 'System Design & Distributed (1,280)', icon: '🏗️', color: '#a855f7' },
  { id: 'database', label: 'Databases & Storage Engines (1,280)', icon: '🗄️', color: '#ec4899' },
];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function FlashcardArenaGame(): React.JSX.Element {
  const { addExp, saveMiniGameScore, unlockAchievement } = useUserProgress();
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deckFilter, setDeckFilter] = useState<'all' | 'starred' | 'mastered'>('all');
  const [allCards, setAllCards] = useState<ConceptFlashcardItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [cardsCompleted, setCardsCompleted] = useState(0);
  const [shuffledDeck, setShuffledDeck] = useState<ConceptFlashcardItem[]>([]);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [copiedCard, setCopiedCard] = useState<boolean>(false);

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

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
      return updated;
    });
  };

  // Fetch 5,120 Concept Flashcards from Google Sheet service / pre-bundled static snapshot
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await fetchConceptFlashcards();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setAllCards(data);
          setShuffledDeck(shuffle(data));
        }
      } catch (err) {
        console.error('Error loading concept flashcards:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // When category changes, filter the master pool
  useEffect(() => {
    if (allCards.length === 0) return;
    const pool = selectedCategory === 'all' ? allCards : allCards.filter((c) => c.category === selectedCategory);
    setShuffledDeck(shuffle(pool));
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedCategory, allCards]);

  // Filtered active deck based on search query & deckFilter
  const filteredDeck = useMemo(() => {
    return shuffledDeck.filter((c) => {
      const matchBookmark = deckFilter === 'starred' ? bookmarkedIds.includes(c.id) : true;
      const matchMastery = deckFilter === 'mastered' ? masteredIds.includes(c.id) : true;

      const qLower = searchQuery.toLowerCase().trim();
      const matchSearch =
        !qLower ||
        c.topic.toLowerCase().includes(qLower) ||
        c.whatItIs.toLowerCase().includes(qLower) ||
        c.whenToUse.toLowerCase().includes(qLower) ||
        c.howToUseProperly.toLowerCase().includes(qLower) ||
        c.keyTakeaway.toLowerCase().includes(qLower);

      return matchBookmark && matchMastery && matchSearch;
    });
  }, [shuffledDeck, deckFilter, bookmarkedIds, masteredIds, searchQuery]);

  const activeDeck = filteredDeck.length > 0 ? filteredDeck : shuffledDeck;
  const currentSafeIndex = currentIndex % (activeDeck.length || 1);
  const card = activeDeck[currentSafeIndex] || {
    id: 'placeholder',
    topic: 'Loading Concept Flashcards...',
    category: 'java',
    categoryLabel: 'Engineering Knowledge',
    difficulty: 'Senior',
    whatItIs: 'Fetching 5,120 architectural concepts from the single source of truth...',
    whenToUse: 'Loading production architectural scenarios...',
    pros: ['Decoupled mental model', 'Ultra-high scalability'],
    cons: ['Requires architectural discipline'],
    howToUseProperly: 'Review best practices and key invariants.',
    keyTakeaway: 'Syncing live repository.',
  };

  const isCurrentBookmarked = bookmarkedIds.includes(card.id);
  const isCurrentMastered = masteredIds.includes(card.id);

  const handleRating = useCallback(
    (rating: 'hard' | 'good' | 'easy') => {
      if (activeDeck.length === 0) return;

      let expEarned = 15;
      let comboInc = 1;

      if (rating === 'easy') {
        expEarned = 35;
        comboInc = 2;
        toggleMastery(card.id);
      } else if (rating === 'good') {
        expEarned = 25;
        comboInc = 1;
      } else {
        expEarned = 10;
        comboInc = 0;
        // Spaced repetition: re-insert 3 cards ahead for reinforcement
        if (activeDeck.length > 3) {
          const reQueueIndex = Math.min(activeDeck.length, currentSafeIndex + 3);
          const updated = [...shuffledDeck];
          updated.splice(reQueueIndex, 0, card);
          setShuffledDeck(updated);
        }
      }

      const nextCombo = comboInc > 0 ? combo + comboInc : 0;
      setCombo(nextCombo);
      const roundScore = expEarned + nextCombo * 10;
      const nextScore = score + roundScore;
      setScore(nextScore);

      addExp(expEarned, `Mastered Architectural Concept: ${card.topic}`);
      saveMiniGameScore('flashcards', nextScore);

      const nextCount = cardsCompleted + 1;
      setCardsCompleted(nextCount);

      if (nextCount % 5 === 0) {
        triggerFireworks(3000);
        unlockAchievement('flashcard_master');
      }

      setIsFlipped(false);
      setCurrentIndex((prev) => (prev + 1) % activeDeck.length);
    },
    [activeDeck, card, currentSafeIndex, shuffledDeck, combo, score, cardsCompleted, addExp, saveMiniGameScore, unlockAchievement]
  );

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + activeDeck.length) % activeDeck.length);
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % activeDeck.length);
  };

  const handleShuffleDeck = () => {
    setShuffledDeck((prev) => shuffle(prev));
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleCopyCard = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const text = `### 💡 Architectural Concept: ${card.topic}
**Category**: ${card.categoryLabel} | **Difficulty Level**: ${card.difficulty}

#### 1. What It Is
${card.whatItIs}

#### 2. When To Use (Production Scenarios)
${card.whenToUse}

#### 3. Pros & Cons Trade-Offs
- **Pros**:
${card.pros.map((p) => `  - ✅ ${p}`).join('\n')}
- **Cons & Gotchas**:
${card.cons.map((c) => `  - ⚠️ ${c}`).join('\n')}

#### 4. How To Use Properly & Best Practices
${card.howToUseProperly}

${card.codeExample ? `\`\`\`java\n${card.codeExample}\n\`\`\`\n` : ''}
#### 🔑 Senior Interview Key Takeaway
${card.keyTakeaway}
`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedCard(true);
        setTimeout(() => setCopiedCard(false), 2000);
      });
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === '1') {
        e.preventDefault();
        handleRating('hard');
      } else if (e.key === '2') {
        e.preventDefault();
        handleRating('good');
      } else if (e.key === '3') {
        e.preventDefault();
        handleRating('easy');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextCard();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevCard();
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleShuffleDeck();
      } else if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleBookmark(card.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRating, card.id]);

  const activeTabInfo = CATEGORY_TABS.find((t) => t.id === selectedCategory) || CATEGORY_TABS[0];

  return (
    <div
      style={{
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
        border: `1.5px solid ${activeTabInfo.color}55`,
        boxShadow: `0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px ${activeTabInfo.color}22`,
        padding: '28px',
        color: '#ffffff',
      }}
    >
      {/* ── 1. Header Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: `${activeTabInfo.color}22`,
              border: `1.5px solid ${activeTabInfo.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              boxShadow: `0 0 16px ${activeTabInfo.color}44`,
            }}
          >
            🗂️
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>Concept Flashcards (What, When, Pros & Cons, Best Practices)</span>
              <span style={{ fontSize: '0.74rem', padding: '2px 8px', borderRadius: '6px', background: `${activeTabInfo.color}22`, color: activeTabInfo.color, border: `1px solid ${activeTabInfo.color}66` }}>
                {activeDeck.length} Concepts in View
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
              Architectural mental models • Active recall • Keyboard shortcut drill (Space to Flip)
            </div>
          </div>
        </div>

        {/* Stats & Tools Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(52, 211, 153, 0.12)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              color: '#34d399',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🎯</span>
            <span>Mastered: {masteredIds.length}</span>
          </div>

          <div
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(251, 191, 36, 0.12)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              color: '#fbbf24',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>⭐</span>
            <span>Starred: {bookmarkedIds.length}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowRules((prev) => !prev)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: showRules ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
              background: showRules ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.05)',
              color: showRules ? '#38bdf8' : 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.8rem',
              fontWeight: 750,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📖</span>
            <span>{showRules ? 'Hide Shortcuts' : 'Shortcuts'}</span>
          </button>

          {combo > 1 && (
            <span style={{ fontSize: '0.86rem', fontWeight: 900, color: '#34d399' }}>
              🔥 {combo}x Combo
            </span>
          )}
          <span style={{ fontSize: '0.86rem', fontWeight: 900, color: '#fbbf24' }}>
            🏆 {score.toLocaleString()} pts
          </span>
        </div>
      </div>

      {/* 📖 KEYBOARD SHORTCUTS PANEL */}
      {showRules && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            marginBottom: '20px',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#38bdf8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⌨️</span>
            <span>Flashcard Shortcuts & Concept Structure</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '0.83rem', color: 'rgba(255, 255, 255, 0.85)' }}>
            <div><strong>Space / Enter</strong>: Flip Card</div>
            <div><strong>1 / 2 / 3</strong>: Rate (1=Hard, 2=Good, 3=Easy)</div>
            <div><strong>&larr; / &rarr;</strong>: Prev / Next Card</div>
            <div><strong>B / S</strong>: Star Bookmark / Shuffle Deck</div>
          </div>
        </div>
      )}

      {/* ── 2. Category Tabs & Search Filter ── */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {CATEGORY_TABS.map((tab) => {
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  border: isSelected ? `1.5px solid ${tab.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected ? `${tab.color}25` : 'rgba(255, 255, 255, 0.04)',
                  color: isSelected ? tab.color : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Deck Filters & Keyword Search */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'all', label: 'All Cards' },
              { id: 'starred', label: `⭐ Starred (${bookmarkedIds.length})` },
              { id: 'mastered', label: `🎯 Mastered (${masteredIds.length})` },
            ].map((f) => {
              const isSelected = deckFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setDeckFilter(f.id as any)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    color: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.65)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts (e.g. Virtual Threads, Singleflight, Raft, Postgres MVCC, LSM-Tree, Redis)..."
              style={{
                width: '100%',
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
                fontSize: '0.82rem',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleShuffleDeck}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🔀 Shuffle Deck
          </button>
        </div>
      </div>

      {/* ── 3. Concept Flashcard Container (Front: Question/Mental Model / Back: What, When, Pros & Cons, How) ── */}
      <div
        style={{
          minHeight: isFlipped ? '480px' : '200px',
          borderRadius: '18px',
          background: isFlipped
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.85) 100%)',
          border: isFlipped ? `1.5px solid ${activeTabInfo.color}` : '1.5px solid rgba(255, 255, 255, 0.15)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          marginBottom: '20px',
          transition: 'all 0.25s ease',
          boxShadow: isFlipped ? `0 0 30px ${activeTabInfo.color}33` : 'none',
        }}
      >
        <div>
          {/* Card Top Metadata */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  background: `${activeTabInfo.color}18`,
                  color: activeTabInfo.color,
                  border: `1px solid ${activeTabInfo.color}55`,
                }}
              >
                {card.categoryLabel}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background:
                    card.difficulty === 'Staff'
                      ? 'rgba(239, 68, 68, 0.2)'
                      : card.difficulty === 'Senior'
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'rgba(52, 211, 153, 0.2)',
                  color:
                    card.difficulty === 'Staff'
                      ? '#f87171'
                      : card.difficulty === 'Senior'
                      ? '#fbbf24'
                      : '#34d399',
                  border: `1px solid ${
                    card.difficulty === 'Staff'
                      ? '#ef4444'
                      : card.difficulty === 'Senior'
                      ? '#f59e0b'
                      : '#10b981'
                  }`,
                }}
              >
                {card.difficulty} Level
              </span>
              {isCurrentMastered && (
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399' }}>
                  ✓ Mastered
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={(e) => toggleBookmark(card.id, e)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.3rem',
                  cursor: 'pointer',
                  color: isCurrentBookmarked ? '#fbbf24' : 'rgba(255, 255, 255, 0.3)',
                  padding: '2px 6px',
                }}
                title={isCurrentBookmarked ? 'Starred (Click to unstar)' : 'Star this card for review'}
              >
                {isCurrentBookmarked ? '★' : '☆'}
              </button>

              <button
                type="button"
                onClick={handleCopyCard}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  color: '#38bdf8',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Copy complete markdown concept notes"
              >
                <span>{copiedCard ? '✓' : '📋'}</span>
                <span>{copiedCard ? 'Copied' : 'Copy Concept'}</span>
              </button>

              <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                Card {currentSafeIndex + 1} of {activeDeck.length}
              </span>
            </div>
          </div>

          {/* Front vs Back Content */}
          {!isFlipped ? (
            /* FRONT: Question Prompt & Mental Model Query */
            <div style={{ padding: '12px 0' }}>
              {/* CLICKABLE TITLE TO FLIP */}
              <div
                onClick={() => setIsFlipped(true)}
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  color: '#f8fafc',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 8px',
                  marginLeft: '-8px',
                  borderRadius: '8px',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
                title="Click title or press Spacebar to reveal answer"
              >
                <span>💡 {card.topic}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                  Click Title to Reveal ➔
                </span>
              </div>

              <div style={{ fontSize: '0.92rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.5, marginTop: '4px' }}>
                Formulate your mental model: <em>What is it, when should you use it, what are the pros/cons, and how do you use it properly in production?</em>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsFlipped(true)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#38bdf8',
                    fontSize: '0.8rem',
                    fontWeight: 750,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>🔄 Reveal Concept Breakdown (Space)</span>
                </button>

                {card.docLink && (
                  <a
                    href={card.docLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.76rem',
                      color: '#a78bfa',
                      textDecoration: 'none',
                      fontWeight: 750,
                      background: 'rgba(167, 139, 250, 0.12)',
                      border: '1px solid rgba(167, 139, 250, 0.3)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                    }}
                  >
                    <span>📖 Docs Guide ➔</span>
                  </a>
                )}
              </div>
            </div>
          ) : (
            /* BACK: Full Architectural Concept Deep Dive */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* CLICKABLE TITLE TO COLLAPSE */}
              <div
                onClick={() => setIsFlipped(false)}
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  color: activeTabInfo.color,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 8px',
                  marginLeft: '-8px',
                  borderRadius: '8px',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
                title="Click title or press Spacebar to collapse card"
              >
                <span>💡 {card.topic}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.6)', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '6px' }}>
                  Click Title to Hide ✕
                </span>
              </div>

              {/* 1. What It Is */}
              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.85rem', marginBottom: '4px' }}>
                  1. What It Is (Mental Model & Definition):
                </div>
                <div style={{ fontSize: '0.88rem', color: '#f8fafc', lineHeight: 1.5 }}>
                  {card.whatItIs}
                </div>
              </div>

              {/* 2. When To Use */}
              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.25)' }}>
                <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '0.85rem', marginBottom: '4px' }}>
                  2. When To Use (Target Production Scenarios):
                </div>
                <div style={{ fontSize: '0.88rem', color: '#fef3c7', lineHeight: 1.5 }}>
                  {card.whenToUse}
                </div>
              </div>

              {/* 3. Pros & Cons Split Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.25)' }}>
                  <div style={{ fontWeight: 800, color: '#34d399', fontSize: '0.85rem', marginBottom: '4px' }}>
                    ✅ Pros & Strengths:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.84rem', color: '#d1fae5', lineHeight: 1.45 }}>
                    {card.pros.map((pro, idx) => (
                      <li key={idx} style={{ marginBottom: '3px' }}>
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <div style={{ fontWeight: 800, color: '#f87171', fontSize: '0.85rem', marginBottom: '4px' }}>
                    ⚠️ Cons, Trade-Offs & Pitfalls:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.84rem', color: '#fca5a5', lineHeight: 1.45 }}>
                    {card.cons.map((con, idx) => (
                      <li key={idx} style={{ marginBottom: '3px' }}>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 4. How To Use Properly & Best Practices */}
              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(192, 132, 252, 0.08)', border: '1px solid rgba(192, 132, 252, 0.25)' }}>
                <div style={{ fontWeight: 800, color: '#c084fc', fontSize: '0.85rem', marginBottom: '4px' }}>
                  4. How To Use Properly & Code Pattern:
                </div>
                <div style={{ fontSize: '0.86rem', color: '#f3e8ff', lineHeight: 1.45, marginBottom: card.codeExample ? '8px' : '0' }}>
                  {card.howToUseProperly}
                </div>

                {card.codeExample && (
                  <pre
                    style={{
                      background: '#07090e',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      color: '#a7f3d0',
                      overflowX: 'auto',
                      border: '1px solid rgba(52, 211, 153, 0.25)',
                      margin: 0,
                    }}
                  >
                    <code>{card.codeExample}</code>
                  </pre>
                )}
              </div>

              {/* 5. Key Takeaway & Documentation Deep Dive Link */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.84rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                  🔑 <strong>Senior Interview Key Takeaway:</strong> {card.keyTakeaway}
                </div>

                {card.docLink && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <a
                      href={card.docLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        color: '#38bdf8',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        textDecoration: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(56, 189, 248, 0.2)',
                      }}
                    >
                      <span>📖 Read Dedicated Documentation Guide ➔</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Card Navigation & Response Rating Actions ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <button
          type="button"
          onClick={handlePrevCard}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
            fontWeight: 750,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          &larr; Prev Concept
        </button>

        {isFlipped ? (
          <div style={{ display: 'flex', gap: '10px', flex: 1, maxWidth: '480px' }}>
            <button
              type="button"
              onClick={() => handleRating('hard')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#f87171',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
              title="Re-queues concept in 3 steps for spaced reinforcement [Press 1]"
            >
              🔴 Hard [1]
            </button>
            <button
              type="button"
              onClick={() => handleRating('good')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid #38bdf8',
                color: '#38bdf8',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
              title="Advances concept with standard bonus [Press 2]"
            >
              🔵 Good [2]
            </button>
            <button
              type="button"
              onClick={() => handleRating('easy')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                background: 'rgba(52, 211, 153, 0.15)',
                border: '1px solid #34d399',
                color: '#34d399',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
              title="Marks concept as Mastered with 2x combo [Press 3]"
            >
              🟢 Easy [3]
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.84rem' }}>
            Press <strong>Spacebar</strong> or click card to flip and rate yourself!
          </div>
        )}

        <button
          type="button"
          onClick={handleNextCard}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
            fontWeight: 750,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          Next Concept &rarr;
        </button>
      </div>
    </div>
  );
}
