import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useUserProgress } from '@site/src/context/UserProgressContext';
import { signOut } from 'firebase/auth';
import { auth } from '@site/src/config/firebase';
import { triggerFireworks } from '@site/src/utils/fireworks';

import { javaQuestions } from '@site/src/data/java-quiz-questions';
import { springBootQuestions } from '@site/src/data/spring-boot-quiz-questions';
import { systemDesignQuestions } from '@site/src/data/system-design-quiz-questions';

export default function CustomUserNavbarItem() {
  const { currentUser, progress, isPremium, unlockPremium, revokePremium, resetQuizProgress } = useUserProgress();
  const [isOpen, setIsOpen] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [keyLoading, setKeyLoading] = useState(false);

  const [isMounted, setIsMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate coordinates whenever isOpen becomes true or on scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    function updateCoords() {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + 8,
          right: Math.max(12, window.innerWidth - rect.right),
        });
      }
    }

    updateCoords();
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, true);

    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsOpen(false);
      window.location.reload();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleUnlockKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) {
      setKeyError('Please enter an activation key.');
      return;
    }
    setKeyLoading(true);
    setKeyError('');

    try {
      const success = await unlockPremium(keyInput);
      if (success) {
        setShowKeyModal(false);
        setIsOpen(false);
        setKeyInput('');
        triggerFireworks(5000);
      } else {
        setKeyError('Invalid key. Please check and try again.');
      }
    } catch (err) {
      console.error('Activation error:', err);
      setKeyError('Activation failed. Please try again.');
    } finally {
      setKeyLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <button
        type="button"
        className="login-nav-button"
        onClick={() => {
          if (typeof window !== 'undefined') {
            const returnTo = `${window.location.pathname}${window.location.search}`;
            window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`;
          }
        }}
      >
        🔑 Login
      </button>
    );
  }

  const name = currentUser.displayName || currentUser.email?.split('@')[0] || 'Learner';
  const readCount = progress.readPages?.length || 0;
  const dsaCount = progress.dsaProgress?.solvedProblems?.length || 0;

  const quizStates = progress.quizStats?.quizStates || {};

  let javaAnswered = 0;
  let springAnswered = 0;
  let sysDesignAnswered = 0;

  let javaTotal = javaQuestions.length;
  let springTotal = springBootQuestions.length;
  let sysDesignTotal = systemDesignQuestions.length;

  Object.entries(quizStates).forEach(([key, state]) => {
    const count = state.answeredQuestionIds?.length ?? Object.keys(state.userAnswers || {}).length;
    const totalFromState = state.totalQuestions;
    const lowerKey = key.toLowerCase();

    if (lowerKey.includes('spring')) {
      springAnswered += count;
      if (totalFromState) springTotal = totalFromState;
    } else if (
      lowerKey.includes('system') ||
      lowerKey.includes('design') ||
      lowerKey.includes('kafka') ||
      lowerKey.includes('backend') ||
      lowerKey.includes('sql') ||
      lowerKey.includes('microservices')
    ) {
      sysDesignAnswered += count;
      if (totalFromState) sysDesignTotal = totalFromState;
    } else {
      javaAnswered += count;
      if (totalFromState) javaTotal = totalFromState;
    }
  });

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="login-nav-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {isPremium ? '💎 ' : '👋 '}Welcome, {name} {isOpen ? '▲' : '▼'}
      </button>

      {isOpen && isMounted && ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          className={`user-account-dropdown-menu ${isPremium ? 'premium-border' : ''}`}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            right: `${coords.right}px`,
            width: '300px',
            backgroundColor: '#0d1117',
            background: '#0d1117',
            opacity: 1,
            zIndex: 9999999,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.98), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
          }}
        >
          {/* Header User Profile Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--ifm-color-emphasis-200)' }}>
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={name}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: isPremium ? '2px solid #f59e0b' : '2px solid #4ade80',
                  boxShadow: isPremium ? '0 0 10px rgba(245, 158, 11, 0.4)' : 'none',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: isPremium ? '#d97706' : 'var(--ifm-color-primary)',
                  color: '#fff',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isPremium ? '0 0 10px rgba(245, 158, 11, 0.4)' : 'none',
                }}
              >
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ifm-font-color-base)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ifm-color-emphasis-600)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.email}
              </div>
              {isPremium ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '4px',
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#ffffff',
                    borderRadius: '10px',
                    fontWeight: 700,
                    boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)',
                  }}
                >
                  💎 Premium Active
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: '4px',
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    background: 'rgba(74, 222, 128, 0.15)',
                    color: '#4ade80',
                    borderRadius: '10px',
                    fontWeight: 600,
                  }}
                >
                  ⚡ Progress Sync Active
                </span>
              )}
            </div>
          </div>

          {/* Progress Tracker Summary */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ifm-color-emphasis-600)', marginBottom: '0.6rem' }}>
              Your Progress Tracker ⚡
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="dropdown-stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.825rem' }}>
                <span>📖 Articles Read</span>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>{readCount}</span>
              </div>

              <div className="dropdown-stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.825rem' }}>
                <span>☕ Java Quiz</span>
                <span style={{ fontWeight: 700, color: '#f59e0b' }}>{javaAnswered} <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>/ {javaTotal}</span></span>
              </div>

              <div className="dropdown-stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.825rem' }}>
                <span>🍃 Spring Boot Quiz</span>
                <span style={{ fontWeight: 700, color: '#4ade80' }}>{springAnswered} <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>/ {springTotal}</span></span>
              </div>

              <div className="dropdown-stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.825rem' }}>
                <span>🏗️ System Design Quiz</span>
                <span style={{ fontWeight: 700, color: '#a855f7' }}>{sysDesignAnswered} <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>/ {sysDesignTotal}</span></span>
              </div>

              <div className="dropdown-stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.825rem' }}>
                <span>💻 DSA Solved</span>
                <span style={{ fontWeight: 700, color: '#ec4899' }}>{dsaCount}</span>
              </div>
            </div>

            {/* Reset Quiz Progress Button */}
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              style={{
                marginTop: '0.6rem',
                width: '100%',
                padding: '0.45rem 0.6rem',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                color: '#ef4444',
                border: '1px dashed rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              🔄 Reset Quiz Progress
            </button>
          </div>

          {/* Premium Unlock / Revoke Buttons */}
          {!isPremium ? (
            <button
              type="button"
              onClick={() => {
                setShowKeyModal(true);
                setKeyError('');
              }}
              style={{
                width: '100%',
                padding: '0.65rem',
                marginBottom: '0.6rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(245, 158, 11, 0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              💎 Unlock Premium Content
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                await revokePremium();
              }}
              style={{
                width: '100%',
                padding: '0.65rem',
                marginBottom: '0.6rem',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.825rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              🔒 Revoke Premium Access
            </button>
          )}

          {/* Actions */}
          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.65rem',
              backgroundColor: 'transparent',
              color: '#ef4444',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#ef4444';
            }}
          >
            Sign Out
          </button>
        </div>,
        document.body
      )}

      {/* Premium Activation Key Modal Dialog */}
      {showKeyModal && isMounted && ReactDOM.createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999999,
            animation: 'fadeInDropdown 0.2s ease-out',
          }}
          onClick={() => setShowKeyModal(false)}
        >
          <div
            style={{
              backgroundColor: '#0d1117',
              border: '1.5px solid #f59e0b',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(245, 158, 11, 0.3)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💎</div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem', color: '#ffffff' }}>
              Activate Premium Access
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
              Enter your Premium Key to activate senior architectural deep-dives and sync status to Cloud Firestore.
            </p>

            <form onSubmit={handleUnlockKeySubmit}>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Enter key (e.g. PREMIUM2026)..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #30363d',
                  backgroundColor: '#161b22',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  marginBottom: '1rem',
                  outline: 'none',
                }}
                autoFocus
              />

              {keyError && (
                <div style={{ color: '#ef4444', fontSize: '0.825rem', marginBottom: '1rem' }}>
                  {keyError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid #30363d',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={keyLoading}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: keyLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 10px rgba(245, 158, 11, 0.4)',
                  }}
                >
                  {keyLoading ? 'Activating...' : 'Activate 🔓'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Double-Check Confirmation Modal for Quiz Reset */}
      {showResetModal && isMounted && ReactDOM.createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999999,
          }}
          onClick={() => setShowResetModal(false)}
        >
          <div
            style={{
              width: '90%',
              maxWidth: '400px',
              backgroundColor: '#0d1117',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(239, 68, 68, 0.2)',
              color: '#ffffff',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#ef4444' }}>
              Reset All Quiz Progress?
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
              Are you sure you want to clear all your saved quiz answers and reset your Java, Spring Boot, and System Design quiz progress to 0? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid #30363d',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await resetQuizProgress();
                  setShowResetModal(false);
                }}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(220, 38, 38, 0.4)',
                }}
              >
                Confirm Reset 🗑️
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
