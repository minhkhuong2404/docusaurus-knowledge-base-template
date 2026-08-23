import React, { useState, useEffect, useMemo } from 'react';
import { useUserProgress } from '../../../context/UserProgressContext';
import { triggerFireworks } from '../../../utils/fireworks';
import { fetchConceptFlashcards, ConceptFlashcardItem } from '../../../services/googleSheetQuizService';
import { INITIAL_CONCEPT_FLASHCARDS } from '../../../data/conceptFlashcardsData';

type CategoryKey = 'all' | 'java' | 'spring-boot' | 'system-design' | 'database';

const CATEGORY_TABS: { id: CategoryKey; label: string; icon: string; color: string }[] = [
  { id: 'all', label: 'All Cards', icon: '🌐', color: '#38bdf8' },
  { id: 'java', label: 'Java Core & JVM', icon: '☕', color: '#fbbf24' },
  { id: 'spring-boot', label: 'Spring Boot', icon: '🍃', color: '#34d399' },
  { id: 'system-design', label: 'System Design', icon: '🏗️', color: '#a855f7' },
  { id: 'database', label: 'Databases & Storage', icon: '🗄️', color: '#ec4899' },
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
  const [allCards, setAllCards] = useState<ConceptFlashcardItem[]>(INITIAL_CONCEPT_FLASHCARDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

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
      triggerFireworks(2000);
      return updated;
    });
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
    return allCards.filter((card) => {
      const matchCategory = selectedCategory === 'all' || card.category === selectedCategory;
      const topicName = card.topic || '';
      const whatItIs = card.whatItIs || '';
      const matchSearch =
        !searchQuery.trim() ||
        topicName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        whatItIs.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (card.categoryLabel && card.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchFilter =
        deckFilter === 'all'
          ? true
          : deckFilter === 'starred'
          ? bookmarkedIds.includes(card.id)
          : masteredIds.includes(card.id);

      return matchCategory && matchSearch && matchFilter;
    });
  }, [allCards, selectedCategory, searchQuery, deckFilter, bookmarkedIds, masteredIds]);

  const currentSafeIndex = activeDeck.length > 0 ? currentIndex % activeDeck.length : 0;
  const card = activeDeck[currentSafeIndex] || INITIAL_CONCEPT_FLASHCARDS[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, activeDeck.length));
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + activeDeck.length) % Math.max(1, activeDeck.length));
  };

  const handleShuffle = () => {
    setAllCards((prev) => shuffle(prev));
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const isBookmarked = bookmarkedIds.includes(card.id);
  const isMastered = masteredIds.includes(card.id);

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(9, 13, 22, 0.98) 100%)',
        borderRadius: '18px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px',
        color: '#f8fafc',
      }}
    >
      {/* ── 1. Compact Header Bar ── */}
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
        {/* Category Dropdown & Deck Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={selectedCategory}
            onChange={(e) => {
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

          <div style={{ display: 'flex', gap: '4px' }}>
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
                  onClick={() => {
                    setDeckFilter(f.id as any);
                    setCurrentIndex(0);
                    setIsFlipped(false);
                  }}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                    color: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Shuffle */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentIndex(0);
            }}
            placeholder="Search concepts..."
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              fontSize: '0.78rem',
              outline: 'none',
              width: '150px',
            }}
          />
          <button
            type="button"
            onClick={handleShuffle}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🔀 Shuffle
          </button>
        </div>
      </div>

      {/* ── 2. Clean 3D Flip Flashcard ── */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        style={{
          minHeight: isFlipped ? '340px' : '220px',
          borderRadius: '14px',
          background: isFlipped
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)',
          border: isFlipped ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
          padding: '24px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          marginBottom: '16px',
          boxShadow: isFlipped ? '0 0 25px rgba(56, 189, 248, 0.25)' : 'none',
          transition: 'all 0.25s ease',
        }}
      >
        {/* Top Card Meta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              {card.categoryLabel || 'Engineering Concept'}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)' }}>
              {card.difficulty || 'Senior'} Level
            </span>
            {isMastered && (
              <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 800 }}>
                ✓ Mastered
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.4)' }}>
            Card {currentSafeIndex + 1} of {activeDeck.length} (Click to flip)
          </span>
        </div>

        {/* ── CARD FRONT (Concept Name & Mental Model Prompt) ── */}
        {!isFlipped ? (
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#ffffff', marginBottom: '10px' }}>
              {card.topic}
            </div>
            <div style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.75)', maxWidth: '620px', margin: '0 auto', lineHeight: 1.5 }}>
              How does this mechanism work under the hood, when should you use it, and what are its key architectural tradeoffs in production?
            </div>
            <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '16px', fontWeight: 700 }}>
              👆 Click card to flip and reveal full concept breakdown
            </div>
          </div>
        ) : (
          /* ── CARD BACK (Full Concept Breakdown & Related Mechanisms) ── */
          <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#38bdf8', marginBottom: '6px' }}>
                {card.topic}
              </div>
            </div>

            {/* What It Is */}
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '2px' }}>
                💡 Core Mechanism:
              </div>
              <div style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.45 }}>
                {card.whatItIs}
              </div>
            </div>

            {/* When To Use */}
            {card.whenToUse && (
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', marginBottom: '2px' }}>
                  🎯 When to Use in Production:
                </div>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.45 }}>
                  {card.whenToUse}
                </div>
              </div>
            )}

            {/* Pros & Cons / Tradeoffs */}
            {((card.pros && card.pros.length > 0) || (card.cons && card.cons.length > 0)) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                {card.pros && card.pros.length > 0 && (
                  <div style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#34d399', marginBottom: '2px' }}>✅ Pros:</div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                      {Array.isArray(card.pros) ? card.pros.join(' • ') : card.pros}
                    </div>
                  </div>
                )}
                {card.cons && card.cons.length > 0 && (
                  <div style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#f87171', marginBottom: '2px' }}>⚠️ Tradeoffs:</div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                      {Array.isArray(card.cons) ? card.cons.join(' • ') : card.cons}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* How to Use / Best Practice */}
            {card.howToUseProperly && (
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#c084fc', textTransform: 'uppercase', marginBottom: '2px' }}>
                  🛠️ Senior Best Practice:
                </div>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.45 }}>
                  {card.howToUseProperly}
                </div>
              </div>
            )}

            {/* Code Snippet */}
            {card.codeExample && (
              <div
                style={{
                  background: '#07090e',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  color: '#e2e8f0',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {card.codeExample}
              </div>
            )}
          </div>
        )}

        {/* Bottom Card Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '8px' }}>
          <span>{isFlipped ? '🔄 Answer / Breakdown View' : '❓ Concept Prompt View'}</span>
          <span>{isBookmarked ? '★ Starred' : '☆ Unstarred'}</span>
        </div>
      </div>

      {/* ── 3. Navigation Controls Bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={handlePrev}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 750,
              cursor: 'pointer',
            }}
          >
            ⬅️ Prev
          </button>
          <button
            type="button"
            onClick={() => setIsFlipped(!isFlipped)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              fontSize: '0.8rem',
              fontWeight: 750,
              cursor: 'pointer',
            }}
          >
            🔄 Flip Card
          </button>
          <button
            type="button"
            onClick={handleNext}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 750,
              cursor: 'pointer',
            }}
          >
            Next ➔
          </button>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => toggleBookmark(card.id)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: isBookmarked ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${isBookmarked ? '#fbbf24' : 'rgba(255, 255, 255, 0.15)'}`,
              color: isBookmarked ? '#fbbf24' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.8rem',
              fontWeight: 750,
              cursor: 'pointer',
            }}
          >
            {isBookmarked ? '★ Starred' : '☆ Star'}
          </button>
          <button
            type="button"
            onClick={() => toggleMastery(card.id)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: isMastered ? 'rgba(52, 211, 153, 0.25)' : 'rgba(52, 211, 153, 0.1)',
              border: '1px solid #34d399',
              color: '#34d399',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {isMastered ? '✓ Mastered' : '🎯 Mark Known (+25 EXP)'}
          </button>
        </div>
      </div>
    </div>
  );
}
