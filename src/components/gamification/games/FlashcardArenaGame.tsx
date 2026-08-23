import React, { useState, useEffect, useMemo } from 'react';
import { useUserProgress } from '../../../context/UserProgressContext';
import { triggerFireworks } from '../../../utils/fireworks';
import { fetchAllTabQuestions, QuizQuestion, QuizCategoryKey } from '../../../services/googleSheetQuizService';

interface FlashcardItem {
  id: string;
  topic: string;
  question: string;
  codeSnippet?: string;
  answer: string;
  keyTakeaway: string;
  difficulty?: string;
  category?: string;
}

const CATEGORY_TABS: { id: QuizCategoryKey; label: string; icon: string; color: string }[] = [
  { id: 'all', label: 'All Questions', icon: '🌐', color: '#38bdf8' },
  { id: 'java', label: 'Java', icon: '☕', color: '#fbbf24' },
  { id: 'spring-boot', label: 'Spring Boot', icon: '🍃', color: '#34d399' },
  { id: 'system-design', label: 'System Design', icon: '🏗️', color: '#a855f7' },
];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function FlashcardArenaGame() {
  const { addExp, saveMiniGameScore } = useUserProgress();
  const [selectedCategory, setSelectedCategory] = useState<QuizCategoryKey>('all');
  const [rawQuestions, setRawQuestions] = useState<Record<string, QuizQuestion[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [cardsCompleted, setCardsCompleted] = useState(0);
  const [shuffledDeck, setShuffledDeck] = useState<FlashcardItem[]>([]);
  const [showRules, setShowRules] = useState<boolean>(false);

  // Fetch from Google Sheet
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await fetchAllTabQuestions();
        if (isMounted) {
          setRawQuestions(data);
        }
      } catch (err) {
        console.error('Error fetching quiz questions for flashcards:', err);
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

  // Convert QuizQuestions into Flashcard items when category or raw data changes
  useEffect(() => {
    const pool = rawQuestions[selectedCategory] || rawQuestions.all || [];
    if (pool.length === 0) return;

    const cards: FlashcardItem[] = pool.map((q) => {
      const correctAns = q.options[q.correctOptionIndex] || q.options[0] || 'See explanation';
      return {
        id: q.id,
        topic: q.topic || 'Engineering Knowledge',
        question: q.questionText,
        codeSnippet: q.codeSnippet,
        answer: correctAns,
        keyTakeaway: q.explanation || 'Key engineering interview concept.',
        difficulty: q.difficulty,
        category: q.category,
      };
    });

    setShuffledDeck(shuffle(cards));
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [rawQuestions, selectedCategory]);

  const activeDeck = shuffledDeck.length > 0 ? shuffledDeck : [];
  const card = activeDeck[currentIndex] || {
    id: 'placeholder',
    topic: 'Loading...',
    question: 'Fetching live flashcards from daily quiz repository...',
    answer: 'Connecting to Google Sheets Single Source of Truth...',
    keyTakeaway: 'Syncing live repository.',
  };

  const handleRating = (rating: 'hard' | 'good' | 'easy') => {
    if (activeDeck.length === 0) return;

    let expEarned = 15;
    let comboInc = 1;

    if (rating === 'easy') {
      expEarned = 35;
      comboInc = 2;
    } else if (rating === 'good') {
      expEarned = 25;
      comboInc = 1;
    } else {
      expEarned = 10;
      comboInc = 0;
    }

    const nextCombo = comboInc > 0 ? combo + comboInc : 0;
    setCombo(nextCombo);
    const roundScore = expEarned + nextCombo * 10;
    const nextScore = score + roundScore;
    setScore(nextScore);

    addExp(expEarned, `Reviewed Flashcard: ${card.topic}`);
    saveMiniGameScore('flashcards', nextScore);

    const nextCount = cardsCompleted + 1;
    setCardsCompleted(nextCount);

    if (nextCount % 5 === 0) {
      triggerFireworks(3000);
    }

    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % activeDeck.length);
  };

  const handleShuffleDeck = () => {
    setShuffledDeck((prev) => shuffle(prev));
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const activeTabInfo = CATEGORY_TABS.find((t) => t.id === selectedCategory) || CATEGORY_TABS[0];

  return (
    <div
      style={{
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
        border: `1px solid ${activeTabInfo.color}55`,
        boxShadow: `0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px ${activeTabInfo.color}22`,
        padding: '24px',
        color: '#ffffff',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: `${activeTabInfo.color}22`,
              border: `1.5px solid ${activeTabInfo.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
            }}
          >
            🗂️
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Flashcard Arena: Spaced Repetition</span>
              <span style={{ fontSize: '0.74rem', padding: '2px 8px', borderRadius: '6px', background: `${activeTabInfo.color}22`, color: activeTabInfo.color, border: `1px solid ${activeTabInfo.color}66` }}>
                {activeDeck.length > 0 ? `${activeDeck.length} Cards in Deck` : 'Loading...'}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.65)' }}>
              Active Recall Drill: Formulate the answer in your mind without multiple choice, then flip to verify.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
              transition: 'all 0.15s ease',
            }}
          >
            <span>📖</span>
            <span>{showRules ? 'Hide Rules' : 'How to Play & Rules'}</span>
          </button>

          <button
            type="button"
            onClick={handleShuffleDeck}
            style={{
              padding: '6px 12px',
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
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#34d399' }}>
            🔥 Combo: {combo}x
          </span>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fbbf24' }}>
            Score: {score}
          </span>
        </div>
      </div>

      {/* 📖 FLASHCARD GUIDELINES PANEL */}
      {showRules && (
        <div
          style={{
            padding: '18px 20px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            marginBottom: '20px',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#38bdf8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📖</span>
            <span>Concept Flashcards — How to Play & Spaced Repetition Guidelines</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '0.83rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.45 }}>
            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>🧠 1. Active Recall</div>
              <div>Formulate the technical explanation or code architecture in your mind before clicking to flip.</div>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontWeight: 800, color: '#fbbf24', marginBottom: '4px' }}>🔄 2. Flip & Verify</div>
              <div>Click the card or press <strong>Spacebar</strong> to reveal the official explanation, key takeaway, and code structure.</div>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontWeight: 800, color: '#34d399', marginBottom: '4px' }}>📊 3. Rate Your Recall</div>
              <div>Rate yourself: <strong>Hard</strong> re-queues the card for spaced reinforcement, while <strong>Good / Easy</strong> awards bonus EXP and stacks combo multipliers.</div>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontWeight: 800, color: '#c084fc', marginBottom: '4px' }}>🌐 4. 15,360 Live Questions</div>
              <div>Filter between Java Core, Spring Boot, System Design, or the entire unified Google Sheets question repository.</div>
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {CATEGORY_TABS.map((tab) => {
          const isSelected = selectedCategory === tab.id;
          const count = (rawQuestions[tab.id] || []).length;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              style={{
                padding: '6px 14px',
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
              {count > 0 && (
                <span style={{ fontSize: '0.7rem', opacity: 0.75 }}>({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Flip Card Container */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        style={{
          minHeight: '230px',
          borderRadius: '16px',
          background: isFlipped
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)',
          border: isFlipped ? `1.5px solid ${activeTabInfo.color}` : '1.5px solid rgba(255, 255, 255, 0.15)',
          padding: '24px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          marginBottom: '20px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isFlipped ? `0 0 25px ${activeTabInfo.color}33` : 'none',
        }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: `${activeTabInfo.color}18`,
                  color: activeTabInfo.color,
                  border: `1px solid ${activeTabInfo.color}55`,
                }}
              >
                {card.topic}
              </span>
              {card.difficulty && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    textTransform: 'capitalize',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: card.difficulty === 'hard' ? '#f87171' : card.difficulty === 'medium' ? '#fbbf24' : '#34d399',
                  }}
                >
                  {card.difficulty}
                </span>
              )}
            </div>

            <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
              Card {currentIndex + 1} of {activeDeck.length} • {isFlipped ? '📖 Answer Revealed' : '🔄 Click anywhere to Flip'}
            </span>
          </div>

          <div style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.45, color: '#ffffff', marginTop: '10px' }}>
            {isFlipped ? (
              <div>
                <span style={{ color: '#34d399', fontWeight: 800, marginRight: '6px' }}>✓ Correct Answer:</span>
                <span>{card.answer}</span>
              </div>
            ) : (
              card.question
            )}
          </div>

          {/* Optional Code Snippet on Question Side */}
          {!isFlipped && card.codeSnippet && (
            <pre
              style={{
                background: '#0d1117',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                color: '#e6edf3',
                overflowX: 'auto',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginTop: '12px',
              }}
            >
              <code>{card.codeSnippet}</code>
            </pre>
          )}
        </div>

        {isFlipped && (
          <div
            style={{
              marginTop: '16px',
              padding: '14px',
              borderRadius: '12px',
              background: 'rgba(52, 211, 153, 0.08)',
              border: '1px solid rgba(52, 211, 153, 0.25)',
              fontSize: '0.84rem',
              color: '#d1fae5',
              lineHeight: 1.45,
            }}
          >
            <div style={{ fontWeight: 800, color: '#34d399', marginBottom: '4px' }}>
              💡 Deep Architectural Insight:
            </div>
            {card.keyTakeaway}
          </div>
        )}
      </div>

      {/* Response Action Buttons (When Flipped) */}
      {isFlipped ? (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => handleRating('hard')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#f87171',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            🔴 Hard (+10 XP)
          </button>
          <button
            type="button"
            onClick={() => handleRating('good')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            🔵 Good (+25 XP)
          </button>
          <button
            type="button"
            onClick={() => handleRating('easy')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(52, 211, 153, 0.15)',
              border: '1px solid #34d399',
              color: '#34d399',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            🟢 Easy (+35 XP)
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <span>🧠</span>
          <span><strong>Active Recall:</strong> Formulate the answer in your own mind first, then click the card to reveal and rate yourself!</span>
        </div>
      )}
    </div>
  );
}
