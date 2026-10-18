import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { TECH_VOCABULARY_DATA, TechTerm } from '../data/techEnglishVocabularyData';

export type { TechTerm };
export const TECH_TERMS: TechTerm[] = TECH_VOCABULARY_DATA;

export default function TechGlossaryFlashcards({
  initialMode = 'flashcards',
}: {
  initialMode?: 'flashcards' | 'quiz' | 'dictionary';
} = {}): React.JSX.Element {
  // Navigation & Mode
  const [activeMode, setActiveMode] = useState<'flashcards' | 'quiz' | 'dictionary'>(initialMode);

  useEffect(() => {
    setActiveMode(initialMode);
  }, [initialMode]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [speechSpeed, setSpeechSpeed] = useState<number>(0.9);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // User Mastery & Bookmarks (with LocalStorage)
  const [masteredIds, setMasteredIds] = useState<string[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'learning' | 'mastered' | 'bookmarked'>('all');

  // Quiz State
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizStreak, setQuizStreak] = useState<number>(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<string | null>(null);
  const [quizAnswerChecked, setQuizAnswerChecked] = useState<boolean>(false);
  const [quizOptions, setQuizOptions] = useState<TechTerm[]>([]);

  // Load from localStorage on client
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedMastered = localStorage.getItem('tech_vocab_mastered');
      if (savedMastered) setMasteredIds(JSON.parse(savedMastered));

      const savedBookmarks = localStorage.getItem('tech_vocab_bookmarks');
      if (savedBookmarks) setBookmarkedIds(JSON.parse(savedBookmarks));
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  // Sync to localStorage
  const toggleMastered = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMasteredIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      if (typeof window !== 'undefined') {
        localStorage.setItem('tech_vocab_mastered', JSON.stringify(next));
      }
      return next;
    });
  };

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarkedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      if (typeof window !== 'undefined') {
        localStorage.setItem('tech_vocab_bookmarks', JSON.stringify(next));
      }
      return next;
    });
  };

  // Web Speech API Pronunciation
  const speakTerm = useCallback(
    (text: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (typeof window === 'undefined') return;

      if (!('speechSynthesis' in window)) {
        alert('Trình duyệt của bạn hiện chưa hỗ trợ Web Speech API.');
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = speechSpeed;
      utterance.pitch = 1.0;

      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [speechSpeed]
  );

  // Filtered list based on category, status, and search query
  const filteredTerms = useMemo(() => {
    return TECH_TERMS.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (filterStatus === 'mastered' && !masteredIds.includes(item.id)) return false;
      if (filterStatus === 'bookmarked' && !bookmarkedIds.includes(item.id)) return false;
      if (filterStatus === 'learning' && masteredIds.includes(item.id)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTerm = item.term.toLowerCase().includes(q);
        const matchesVn = item.vnMeaning.toLowerCase().includes(q);
        const matchesDef = item.vnDefinition.toLowerCase().includes(q);
        return matchesTerm || matchesVn || matchesDef;
      }
      return true;
    });
  }, [selectedCategory, filterStatus, searchQuery, masteredIds, bookmarkedIds]);

  // Clamp current index when filter changes
  useEffect(() => {
    if (currentIndex >= filteredTerms.length) {
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [filteredTerms.length, currentIndex]);

  const currentTerm = filteredTerms[currentIndex] || TECH_TERMS[0];

  // Navigation handlers
  const handleNext = () => {
    if (filteredTerms.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % filteredTerms.length);
  };

  const handlePrev = () => {
    if (filteredTerms.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + filteredTerms.length) % filteredTerms.length);
  };

  const handleShuffle = () => {
    if (filteredTerms.length <= 1) return;
    setIsFlipped(false);
    let rand = Math.floor(Math.random() * filteredTerms.length);
    if (rand === currentIndex) rand = (rand + 1) % filteredTerms.length;
    setCurrentIndex(rand);
  };

  // Keyboard navigation for power users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeMode !== 'flashcards') return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMode, filteredTerms.length]);

  // Prepare Quiz Question
  const setupNewQuizQuestion = useCallback(() => {
    if (TECH_TERMS.length < 4) return;
    const correct = TECH_TERMS[Math.floor(Math.random() * TECH_TERMS.length)];
    const distractors = TECH_TERMS.filter((t) => t.id !== correct.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const options = [correct, ...distractors].sort(() => 0.5 - Math.random());

    setQuizOptions(options);
    setQuizSelectedOption(null);
    setQuizAnswerChecked(false);
    setCurrentIndex(TECH_TERMS.findIndex((t) => t.id === correct.id));
  }, []);

  useEffect(() => {
    if (activeMode === 'quiz' && quizOptions.length === 0) {
      setupNewQuizQuestion();
    }
  }, [activeMode, quizOptions.length, setupNewQuizQuestion]);

  const handleSelectQuizOption = (optionId: string) => {
    if (quizAnswerChecked) return;
    setQuizSelectedOption(optionId);
    setQuizAnswerChecked(true);

    if (optionId === currentTerm.id) {
      setQuizScore((prev) => prev + 10);
      setQuizStreak((prev) => prev + 1);
    } else {
      setQuizStreak(0);
    }
  };

  return (
    <div
      className="interactive-diagram-container tgf-arena-container"
      style={{
        fontFamily: 'var(--ifm-font-family-base)',
        color: '#f8fafc',
        borderRadius: '12px',
        padding: '20px',
        background: '#090b14',
        border: '1px solid #1e293b',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <style>{`
        .tgf-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          border-bottom: 1px solid #1e293b;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }
        .tgf-title-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .tgf-title {
          font-size: 18px;
          font-weight: 700;
          color: #38bdf8;
          margin: 0;
          letter-spacing: -0.01em;
        }
        .tgf-subtitle {
          font-size: 12px;
          color: #94a3b8;
          margin: 0;
        }
        .tgf-mode-tabs {
          display: flex;
          gap: 6px;
          background: #0f172a;
          padding: 4px;
          border-radius: 8px;
          border: 1px solid #334155;
        }
        .tgf-mode-btn {
          background: transparent;
          border: none;
          padding: 6px 14px;
          border-radius: 6px;
          color: #94a3b8;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .tgf-mode-btn.active {
          background: #38bdf8;
          color: #090b14;
          box-shadow: 0 2px 8px rgba(56, 189, 248, 0.4);
        }
        .tgf-controls-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 20px;
        }
        .tgf-select, .tgf-input {
          background: #0f172a;
          border: 1px solid #334155;
          color: #e2e8f0;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
        }
        .tgf-select:focus, .tgf-input:focus {
          border-color: #38bdf8;
        }
        .tgf-stats-bar {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #94a3b8;
          align-items: center;
          margin-left: auto;
        }
        .tgf-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
        }
        .tgf-badge-category {
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.3);
        }
        .tgf-badge-pos {
          background: rgba(167, 139, 250, 0.15);
          color: #c084fc;
          border: 1px solid rgba(167, 139, 250, 0.3);
        }
        /* 3D Flashcard Animation */
        .tgf-card-scene {
          perspective: 1200px;
          width: 100%;
          min-height: 380px;
          cursor: pointer;
        }
        .tgf-card {
          width: 100%;
          min-height: 380px;
          position: relative;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }
        .tgf-card.flipped {
          transform: rotateY(180deg);
        }
        .tgf-card-face {
          position: absolute;
          width: 100%;
          height: 100%;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          border-radius: 12px;
          padding: 24px;
          background: #0d111e;
          border: 1px solid #1e293b;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }
        .tgf-card-back {
          transform: rotateY(180deg);
          background: #0f172a;
          border-color: #38bdf8;
        }
        .tgf-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .tgf-card-body {
          text-align: center;
          padding: 20px 0;
        }
        .tgf-term-title {
          font-size: 32px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }
        .tgf-phonetic {
          font-family: monospace;
          font-size: 16px;
          color: #38bdf8;
          margin-bottom: 16px;
        }
        .tgf-btn-speak {
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          border: 1px solid #38bdf8;
          border-radius: 999px;
          padding: 8px 18px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .tgf-btn-speak:hover {
          background: #38bdf8;
          color: #090b14;
        }
        .tgf-btn-speak.speaking {
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(56, 189, 248, 0); }
          100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
        }
        .tgf-hint-flip {
          font-size: 12px;
          color: #64748b;
          text-align: center;
          margin-top: 10px;
        }
        .tgf-nav-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
        }
        .tgf-nav-btn {
          background: #1e293b;
          border: 1px solid #334155;
          color: #e2e8f0;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background 0.2s;
        }
        .tgf-nav-btn:hover {
          background: #334155;
        }
        .tgf-progress-track {
          width: 100%;
          height: 6px;
          background: #1e293b;
          border-radius: 999px;
          overflow: hidden;
          margin-top: 16px;
        }
        .tgf-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #38bdf8, #34d399);
          transition: width 0.3s ease;
        }
        /* Dictionary Table */
        .tgf-dict-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          font-size: 13px;
        }
        .tgf-dict-table th {
          background: #0f172a;
          color: #94a3b8;
          text-align: left;
          padding: 10px 14px;
          border-bottom: 2px solid #1e293b;
        }
        .tgf-dict-table td {
          padding: 12px 14px;
          border-bottom: 1px solid #1e293b;
          vertical-align: top;
        }
        .tgf-dict-row:hover td {
          background: rgba(255, 255, 255, 0.02);
        }
        /* Quiz Arena */
        .tgf-quiz-card {
          background: #0d111e;
          border: 1px solid #1e293b;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
        }
        .tgf-quiz-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 20px;
        }
        @media (max-width: 640px) {
          .tgf-quiz-options {
            grid-template-columns: 1fr;
          }
        }
        .tgf-quiz-btn {
          background: #0f172a;
          border: 1px solid #334155;
          color: #e2e8f0;
          padding: 16px;
          border-radius: 8px;
          font-size: 14px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tgf-quiz-btn:hover:not(:disabled) {
          border-color: #38bdf8;
          background: rgba(56, 189, 248, 0.08);
        }
        .tgf-quiz-btn.correct {
          background: rgba(52, 211, 153, 0.2);
          border-color: #34d399;
          color: #34d399;
        }
        .tgf-quiz-btn.wrong {
          background: rgba(248, 113, 113, 0.2);
          border-color: #f87171;
          color: #f87171;
        }
      `}</style>

      {/* Header */}
      <div className="tgf-header">
        <div className="tgf-title-group">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
            <path d="M6 6h10" />
            <path d="M6 10h10" />
            <path d="M6 14h6" />
          </svg>
          <div>
            <h3 className="tgf-title">Technical English & Flashcard Arena</h3>
            <p className="tgf-subtitle">Master English Vocabulary, Native Phonetics & Senior Phrasing</p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="tgf-mode-tabs">
          <button
            className={`tgf-mode-btn ${activeMode === 'flashcards' ? 'active' : ''}`}
            onClick={() => setActiveMode('flashcards')}
          >
            🎴 Flashcards
          </button>
          <button
            className={`tgf-mode-btn ${activeMode === 'quiz' ? 'active' : ''}`}
            onClick={() => {
              setActiveMode('quiz');
              setupNewQuizQuestion();
            }}
          >
            🎯 Listening Quiz
          </button>
          <button
            className={`tgf-mode-btn ${activeMode === 'dictionary' ? 'active' : ''}`}
            onClick={() => setActiveMode('dictionary')}
          >
            📖 Dictionary ({TECH_TERMS.length})
          </button>
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <div className="tgf-controls-row">
        <select
          className="tgf-select"
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setCurrentIndex(0);
            setIsFlipped(false);
          }}
        >
          <option value="all">🌐 All Categories ({TECH_TERMS.length})</option>
          <option value="system-design">🏗️ System Design & Distributed</option>
          <option value="database">💾 Databases & Storage</option>
          <option value="os-concurrency">⚡ OS & Concurrency</option>
          <option value="networking">🌐 Networking & Protocols</option>
          <option value="java-jvm">☕ Java & JVM</option>
          <option value="security">🛡️ Security & Auth</option>
          <option value="devops">🔄 DevOps & Cloud</option>
        </select>

        {activeMode === 'flashcards' && (
          <select
            className="tgf-select"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as any);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
          >
            <option value="all">📋 All Statuses</option>
            <option value="learning">⏳ Learning ({TECH_TERMS.length - masteredIds.length})</option>
            <option value="mastered">✅ Mastered ({masteredIds.length})</option>
            <option value="bookmarked">⭐ Bookmarked ({bookmarkedIds.length})</option>
          </select>
        )}

        <input
          type="text"
          className="tgf-input"
          placeholder="🔍 Search English / Tiếng Việt..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentIndex(0);
          }}
          style={{ width: '220px' }}
        />

        <div className="tgf-stats-bar">
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <span>Speed:</span>
            <select
              className="tgf-select"
              style={{ padding: '2px 6px', fontSize: '11px' }}
              value={speechSpeed}
              onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
            >
              <option value="1.0">1.0x (Normal)</option>
              <option value="0.85">0.85x (Slow)</option>
              <option value="0.7">0.7x (Very Slow)</option>
            </select>
          </label>
          <span>
            Mastered: <strong style={{ color: '#34d399' }}>{masteredIds.length}</strong> / {TECH_TERMS.length}
          </span>
        </div>
      </div>

      {/* --- MODE 1: FLASHCARDS --- */}
      {activeMode === 'flashcards' && (
        <div>
          {filteredTerms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <p style={{ fontSize: '16px' }}>Không tìm thấy từ vựng nào khớp với bộ lọc.</p>
              <button
                className="tgf-nav-btn"
                style={{ margin: '0 auto' }}
                onClick={() => {
                  setSelectedCategory('all');
                  setFilterStatus('all');
                  setSearchQuery('');
                }}
              >
                Reset Bộ Lọc
              </button>
            </div>
          ) : (
            <div>
              {/* Flashcard 3D Scene */}
              <div className="tgf-card-scene" onClick={() => setIsFlipped((prev) => !prev)}>
                <div className={`tgf-card ${isFlipped ? 'flipped' : ''}`}>
                  {/* FRONT FACE */}
                  <div className="tgf-card-face tgf-card-front">
                    <div className="tgf-card-header">
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span className="tgf-badge tgf-badge-category">{currentTerm.categoryLabel}</span>
                        <span className="tgf-badge tgf-badge-pos">{currentTerm.pos}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={(e) => toggleBookmark(currentTerm.id, e)}
                          title="Bookmark for review"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: bookmarkedIds.includes(currentTerm.id) ? '#fbbf24' : '#64748b',
                            cursor: 'pointer',
                            fontSize: '18px',
                          }}
                        >
                          ★
                        </button>
                        <button
                          type="button"
                          onClick={(e) => toggleMastered(currentTerm.id, e)}
                          title="Mark as mastered"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: masteredIds.includes(currentTerm.id) ? '#34d399' : '#64748b',
                            cursor: 'pointer',
                            fontSize: '18px',
                          }}
                        >
                          ✔
                        </button>
                      </div>
                    </div>

                    <div className="tgf-card-body">
                      <h2 className="tgf-term-title">{currentTerm.term}</h2>
                      <div className="tgf-phonetic">{currentTerm.phonetic}</div>
                      <button
                        type="button"
                        className={`tgf-btn-speak ${isSpeaking ? 'speaking' : ''}`}
                        onClick={(e) => speakTerm(currentTerm.term, e)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                        </svg>
                        Listen Pronunciation
                      </button>
                    </div>

                    <div className="tgf-hint-flip">
                      <kbd style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px', color: '#94a3b8' }}>Space</kbd> or Click to flip for Vietnamese meaning & Senior tip ➔
                    </div>
                  </div>

                  {/* BACK FACE */}
                  <div className="tgf-card-face tgf-card-back">
                    <div className="tgf-card-header">
                      <span className="tgf-badge tgf-badge-category" style={{ color: '#38bdf8' }}>
                        {currentTerm.term} — Meaning
                      </span>
                      <button
                        type="button"
                        className="tgf-btn-speak"
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                        onClick={(e) => speakTerm(currentTerm.term, e)}
                      >
                        🔊 Hear Again
                      </button>
                    </div>

                    <div style={{ textAlign: 'left', overflowY: 'auto', padding: '10px 0' }}>
                      <h4 className="tgf-back-meaning" style={{ color: '#34d399', fontSize: '18px', margin: '0 0 6px 0' }}>
                        {currentTerm.vnMeaning}
                      </h4>
                      <p className="tgf-back-def" style={{ color: '#e2e8f0', fontSize: '13px', lineHeight: '1.5', margin: '0 0 10px 0' }}>
                        {currentTerm.vnDefinition}
                      </p>

                      <div className="tgf-back-analogy-box" style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px', marginBottom: '10px', borderLeft: '3px solid #fbbf24' }}>
                        <span className="tgf-back-analogy-label" style={{ color: '#fbbf24', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>💡 Intuitive Analogy:</span>
                        <div className="tgf-back-analogy-text" style={{ color: '#cbd5e1', fontSize: '12px', marginTop: '4px' }}>{currentTerm.analogy}</div>
                      </div>

                      {currentTerm.codeExample && (
                        <div className="tgf-back-code" style={{ background: '#090b14', padding: '8px 10px', borderRadius: '6px', marginBottom: '10px', fontFamily: 'monospace', fontSize: '12px', color: '#38bdf8', overflowX: 'auto' }}>
                          {currentTerm.codeExample}
                        </div>
                      )}

                      <div className="tgf-back-tip-box" style={{ background: 'rgba(167, 139, 250, 0.1)', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #a78bfa' }}>
                        <span className="tgf-back-tip-label" style={{ color: '#c084fc', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>🎯 Senior Interview Collocations & Phrasing:</span>
                        <div className="tgf-back-tip-text" style={{ color: '#e2e8f0', fontSize: '12px', marginTop: '4px', fontStyle: 'italic' }}>
                          "{currentTerm.interviewTip}"
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                          {currentTerm.collocations.map((col, idx) => (
                            <span key={idx} className="tgf-dict-collocation" style={{ background: '#1e293b', color: '#93c5fd', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>
                              {col}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="tgf-hint-flip">
                      Click to flip back to English term
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="tgf-nav-bar">
                <button type="button" className="tgf-nav-btn" onClick={handlePrev}>
                  ◀ Previous
                </button>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button type="button" className="tgf-nav-btn" onClick={handleShuffle} title="Random word">
                    🔀 Random
                  </button>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                    {currentIndex + 1} / {filteredTerms.length}
                  </span>
                </div>

                <button type="button" className="tgf-nav-btn" onClick={handleNext}>
                  Next ▶
                </button>
              </div>

              {/* Progress bar */}
              <div className="tgf-progress-track">
                <div
                  className="tgf-progress-fill"
                  style={{ width: `${((currentIndex + 1) / filteredTerms.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- MODE 2: QUIZ ARENA --- */}
      {activeMode === 'quiz' && (
        <div className="tgf-quiz-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="tgf-badge tgf-badge-category">Active Recall & Listening Mode</span>
            <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
              <span>Score: <strong style={{ color: '#38bdf8' }}>{quizScore}</strong> pts</span>
              <span>Streak: <strong style={{ color: '#34d399' }}>{quizStreak}</strong> 🔥</span>
            </div>
          </div>

          <div style={{ padding: '16px 0' }}>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>
              Listen to the English term and pick the accurate Vietnamese technical meaning:
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', margin: '14px 0' }}>
              <h2 className="tgf-term-title" style={{ fontSize: '32px', color: '#ffffff', margin: 0 }}>
                {currentTerm.term}
              </h2>
              <button
                type="button"
                className="tgf-btn-speak"
                onClick={() => speakTerm(currentTerm.term)}
              >
                🔊 Listen
              </button>
            </div>
            <div className="tgf-phonetic">{currentTerm.phonetic}</div>
          </div>

          {/* Quiz Options */}
          <div className="tgf-quiz-options">
            {quizOptions.map((opt) => {
              let optClass = '';
              if (quizAnswerChecked) {
                if (opt.id === currentTerm.id) optClass = 'correct';
                else if (quizSelectedOption === opt.id) optClass = 'wrong';
              }
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`tgf-quiz-btn ${optClass}`}
                  disabled={quizAnswerChecked}
                  onClick={() => handleSelectQuizOption(opt.id)}
                >
                  <div className="tgf-quiz-opt-title" style={{ fontWeight: 700, marginBottom: '4px' }}>{opt.vnMeaning}</div>
                  <div className="tgf-quiz-opt-desc" style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {opt.vnDefinition.slice(0, 95)}...
                  </div>
                </button>
              );
            })}
          </div>

          {/* Feedback & Next Question */}
          {quizAnswerChecked && (
            <div style={{ marginTop: '20px', padding: '16px', borderRadius: '8px', background: quizSelectedOption === currentTerm.id ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)' }}>
              <div style={{ color: quizSelectedOption === currentTerm.id ? '#34d399' : '#f87171', fontWeight: 700, fontSize: '16px' }}>
                {quizSelectedOption === currentTerm.id ? '🎉 Chính xác! (+10 pts)' : '❌ Chưa chính xác!'}
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '13px', marginTop: '6px' }}>
                <strong>{currentTerm.term}</strong> nghĩa là: {currentTerm.vnMeaning}.
              </div>
              <div style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  className="tgf-btn-speak"
                  style={{ background: '#38bdf8', color: '#090b14', border: 'none' }}
                  onClick={setupNewQuizQuestion}
                >
                  Next Question ➔
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- MODE 3: DICTIONARY TABLE --- */}
      {activeMode === 'dictionary' && (
        <div style={{ overflowX: 'auto' }}>
          <table className="tgf-dict-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>Audio</th>
                <th>Term & IPA</th>
                <th>Category</th>
                <th>Vietnamese Meaning</th>
                <th>Definition & Analogy</th>
                <th>Collocations / Senior Phrasing</th>
                <th style={{ width: '60px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTerms.map((t) => (
                <tr key={t.id} className="tgf-dict-row">
                  <td>
                    <button
                      type="button"
                      className="tgf-audio-btn"
                      onClick={() => speakTerm(t.term)}
                      title="Pronounce"
                      style={{
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid #38bdf8',
                        color: '#38bdf8',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      🔊
                    </button>
                  </td>
                  <td>
                    <div className="tgf-dict-term" style={{ fontWeight: 800, color: '#ffffff', fontSize: '15px' }}>{t.term}</div>
                    <div className="tgf-dict-ipa" style={{ fontFamily: 'monospace', color: '#38bdf8', fontSize: '12px' }}>{t.phonetic}</div>
                    <span className="tgf-badge tgf-badge-pos" style={{ marginTop: '4px' }}>{t.pos}</span>
                  </td>
                  <td>
                    <span className="tgf-badge tgf-badge-category">{t.categoryLabel}</span>
                  </td>
                  <td>
                    <strong className="tgf-dict-vn" style={{ color: '#34d399' }}>{t.vnMeaning}</strong>
                  </td>
                  <td>
                    <div className="tgf-dict-def" style={{ color: '#cbd5e1', marginBottom: '6px' }}>{t.vnDefinition}</div>
                    <div className="tgf-dict-analogy" style={{ fontSize: '11px', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '4px 6px', borderRadius: '4px' }}>
                      💡 {t.analogy}
                    </div>
                  </td>
                  <td>
                    <div className="tgf-dict-tip" style={{ fontSize: '11px', color: '#93c5fd', fontStyle: 'italic', marginBottom: '4px' }}>
                      "{t.interviewTip}"
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {t.collocations.map((c, i) => (
                        <span key={i} className="tgf-dict-collocation" style={{ background: '#1e293b', fontSize: '10px', padding: '1px 5px', borderRadius: '3px', color: '#cbd5e1' }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => toggleBookmark(t.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: bookmarkedIds.includes(t.id) ? '#fbbf24' : '#475569',
                          cursor: 'pointer',
                          fontSize: '16px',
                        }}
                      >
                        ★
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleMastered(t.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: masteredIds.includes(t.id) ? '#34d399' : '#475569',
                          cursor: 'pointer',
                          fontSize: '16px',
                        }}
                      >
                        ✔
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
