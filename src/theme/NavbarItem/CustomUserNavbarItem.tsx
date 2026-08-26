import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import Link from '@docusaurus/Link';
import { useUserProgress } from '../../context/UserProgressContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { triggerFireworks } from '../../utils/fireworks';

import { isTrackableArticle, TOTAL_TRACKABLE_ARTICLES_DEFAULT } from '../../utils/trackablePages';
import NavbarGamificationHUD from '../../components/gamification/NavbarGamificationHUD';
import CosmicRankBadge from '../../components/gamification/CosmicRankBadge';
import { getRankForLevel, getExpProgressInCurrentLevel, ACHIEVEMENTS } from '../../data/gamificationData';
import { defaultGamificationState } from '../../services/userProgressService';

const GamificationModal = React.lazy(() => import('../../components/gamification/GamificationModal'));
const UserProfileModal = React.lazy(() => import('../../components/auth/UserProfileModal'));

export default function CustomUserNavbarItem() {
  const {
    currentUser,
    progress,
    isPremium,
    isAdmin,
    isSuperAdmin,
    adminEmails,
    addAdminEmail,
    removeAdminEmail,
    unlockPremium,
    revokePremium,
    resetQuizProgress,
    totalArticlesCount,
  } = useUserProgress();
  const [isOpen, setIsOpen] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showGamificationModal, setShowGamificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newAdminInput, setNewAdminInput] = useState('');
  const [adminMsg, setAdminMsg] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [keyLoading, setKeyLoading] = useState(false);

  const [isMounted, setIsMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

  const [dsaIntensity, setDsaIntensity] = useState<'75' | '150' | '250'>(() => {
    if (typeof window === 'undefined') return '150';
    const saved = localStorage.getItem('dsa-intensity-level');
    return (saved === '75' || saved === '150' || saved === '250') ? saved : '150';
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleIntensityChange = () => {
      const saved = localStorage.getItem('dsa-intensity-level');
      if (saved === '75' || saved === '150' || saved === '250') {
        setDsaIntensity(saved);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('dsa-intensity-changed', handleIntensityChange);
      return () => window.removeEventListener('dsa-intensity-changed', handleIntensityChange);
    }
  }, []);

  // Calculate coordinates whenever isOpen becomes true or on scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    let rafId: number | null = null;

    function updateCoords() {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + 8,
          right: Math.max(12, window.innerWidth - rect.right),
        });
      }
    }

    function handleThrottledUpdate() {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        updateCoords();
        rafId = null;
      });
    }

    updateCoords();
    window.addEventListener('resize', handleThrottledUpdate);
    window.addEventListener('scroll', handleThrottledUpdate, true);

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
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleThrottledUpdate);
      window.removeEventListener('scroll', handleThrottledUpdate, true);
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
      <div className="custom-user-nav-wrapper" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <NavbarGamificationHUD />
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
      </div>
    );
  }

  const name = currentUser.displayName || currentUser.email?.split('@')[0] || 'Learner';
  const readCount = (progress.readPages || []).filter(isTrackableArticle).length;
  const totalArticles = totalArticlesCount > 0 && totalArticlesCount <= 2000 ? totalArticlesCount : TOTAL_TRACKABLE_ARTICLES_DEFAULT;
  const readPercent = Math.min(100, Math.round((readCount / totalArticles) * 100));

  const gamification = progress.gamification || defaultGamificationState;
  const exp = gamification.exp || 0;
  const { currentLevel, expInLevel, neededInLevel, percent: expPercent } = getExpProgressInCurrentLevel(exp);
  const rank = getRankForLevel(currentLevel);
  const unlockedTrophiesCount = (gamification.unlockedAchievements || []).length;
  const streakDays = gamification.streak?.currentStreak || 0;
  const roleBorderColor = isSuperAdmin
    ? '#ef4444' // Crimson Ruby for Super Admin
    : isAdmin
    ? '#f59e0b' // Radiant Amber Gold for Admin
    : isPremium
    ? '#38bdf8' // Sky Blue for Premium
    : '#4ade80';

  const roleTextColor = isSuperAdmin
    ? '#fca5a5'
    : isAdmin
    ? '#fde68a'
    : isPremium
    ? '#bae6fd'
    : '#86efac';

  const roleGlow = isSuperAdmin
    ? '0 4px 14px rgba(0, 0, 0, 0.7), 0 0 14px rgba(239, 68, 68, 0.45)'
    : isAdmin
    ? '0 4px 14px rgba(0, 0, 0, 0.7), 0 0 14px rgba(245, 158, 11, 0.45)'
    : isPremium
    ? '0 4px 14px rgba(0, 0, 0, 0.7), 0 0 12px rgba(56, 189, 248, 0.35)'
    : '0 4px 14px rgba(0, 0, 0, 0.7), 0 0 10px rgba(74, 222, 128, 0.25)';

  const roleClass = isSuperAdmin ? 'super-admin' : isAdmin ? 'admin' : isPremium ? 'premium' : '';

  return (
    <div className="custom-user-nav-wrapper" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
      <NavbarGamificationHUD />
      <button
        ref={buttonRef}
        type="button"
        className={`login-nav-button ${roleClass}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span className="user-nav-name-label">{name}</span>
        <span style={{ fontSize: '10px', opacity: 0.75 }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && isMounted && ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          className={`user-account-dropdown-menu ${isSuperAdmin ? 'super-admin-border' : isAdmin ? 'admin-border' : isPremium ? 'premium-border' : ''}`}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            right: `${Math.max(8, coords.right)}px`,
            width: 'min(300px, calc(100vw - 16px))',
            maxWidth: 'calc(100vw - 16px)',
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
                  border: isSuperAdmin ? '2px solid #ef4444' : isAdmin ? '2px solid #f59e0b' : isPremium ? '2px solid #38bdf8' : '2px solid #4ade80',
                  boxShadow: isSuperAdmin ? '0 0 14px rgba(239, 68, 68, 0.65)' : isAdmin ? '0 0 14px rgba(245, 158, 11, 0.65)' : isPremium ? '0 0 10px rgba(56, 189, 248, 0.4)' : 'none',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: isSuperAdmin ? '#dc2626' : isAdmin ? '#d97706' : isPremium ? '#0284c7' : 'var(--ifm-color-primary)',
                  color: '#fff',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isSuperAdmin ? '0 0 14px rgba(239, 68, 68, 0.65)' : isAdmin ? '0 0 14px rgba(245, 158, 11, 0.65)' : isPremium ? '0 0 10px rgba(56, 189, 248, 0.4)' : 'none',
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
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                {isSuperAdmin ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                      border: '1px solid #f87171',
                      color: '#ffffff',
                      borderRadius: '10px',
                      fontWeight: 850,
                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.45)',
                    }}
                  >
                    👑 Super Admin
                  </span>
                ) : isAdmin ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      border: '1px solid #fbbf24',
                      color: '#ffffff',
                      borderRadius: '10px',
                      fontWeight: 800,
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.45)',
                    }}
                  >
                    🛡️ Admin
                  </span>
                ) : null}
                {isPremium ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      border: '1px solid #38bdf8',
                      color: '#ffffff',
                      borderRadius: '10px',
                      fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(56, 189, 248, 0.35)',
                    }}
                  >
                    ⭐ Premium Active
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'inline-block',
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
          </div>

          {/* SECTION 0: Cosmic Level & Trophy Rank */}
          <div style={{ marginBottom: '1.2rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ifm-color-emphasis-600)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🏆 Cosmic Level & Rank</span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowGamificationModal(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: rank.color,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Codex ➔
              </button>
            </div>

            <div
              className="dropdown-stat-card"
              onClick={() => {
                setIsOpen(false);
                setShowGamificationModal(true);
              }}
              style={{
                padding: '0.75rem',
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${rank.color}18 0%, rgba(15, 23, 42, 0.9) 100%)`,
                border: `1px solid ${rank.color}44`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <CosmicRankBadge level={currentLevel} rank={rank} size="sm" showLevelPill={false} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff' }}>
                      Lv.{currentLevel}
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: rank.color }}>
                      {rank.tierRoman.split(' • ')[0]}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: rank.color, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {rank.title}
                  </div>
                </div>
              </div>

              {/* Level EXP Progress */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '3px' }}>
                <span>EXP Progress</span>
                <span style={{ fontWeight: 700, color: '#ffffff' }}>{expInLevel.toLocaleString()} / {neededInLevel.toLocaleString()} ({expPercent}%)</span>
              </div>
              <div style={{ height: '4px', width: '100%', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ height: '100%', width: `${expPercent}%`, borderRadius: '2px', background: rank.color, transition: 'width 0.4s ease' }} />
              </div>

              {/* Quick stats pills */}
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.75)' }}>
                  <span>🔥</span>
                  <span><b>{streakDays}d</b> Streak</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.75)' }}>
                  <span>🏆</span>
                  <span><b>{unlockedTrophiesCount}/{ACHIEVEMENTS.length}</b> Trophies</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
            <Link
              to="/stats"
              onClick={() => setIsOpen(false)}
              style={{
                width: '100%',
                padding: '0.65rem',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.14) 0%, rgba(99, 102, 241, 0.14) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                borderRadius: '8px',
                fontWeight: 750,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                textDecoration: 'none',
                boxShadow: '0 2px 10px rgba(56, 189, 248, 0.12)',
                transition: 'all 0.2s ease',
              }}
            >
              <span>📊</span>
              <span>Statistics and Telemetry</span>
            </Link>

            <Link
              to="/leaderboard"
              onClick={() => setIsOpen(false)}
              style={{
                width: '100%',
                padding: '0.65rem',
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.14) 0%, rgba(245, 158, 11, 0.14) 100%)',
                border: '1px solid rgba(251, 191, 36, 0.35)',
                color: '#fbbf24',
                borderRadius: '8px',
                fontWeight: 750,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                textDecoration: 'none',
                boxShadow: '0 2px 10px rgba(251, 191, 36, 0.12)',
                transition: 'all 0.2s ease',
              }}
            >
              <span>🏆</span>
              <span>Global Architect Leaderboard</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowGamificationModal(true);
              }}
              style={{
                width: '100%',
                padding: '0.6rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                borderRadius: '8px',
                fontWeight: 650,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <span>🎯</span>
              <span>Mission Control & Trophy Codex</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowProfileModal(true);
              }}
              style={{
                width: '100%',
                padding: '0.6rem',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#38bdf8',
                borderRadius: '8px',
                fontWeight: 650,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <span>⚙️</span>
              <span>Account & Security Settings</span>
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
              👑 Unlock Premium Content
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

          {/* Admin Management Panel Button */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setShowAdminModal(true);
                setAdminMsg('');
              }}
              style={{
                width: '100%',
                padding: '0.65rem',
                marginBottom: '0.6rem',
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.825rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              🛡️ Manage Admin Permissions ({adminEmails.length})
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
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👑</div>
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
      {/* Admin Management Modal Dialog */}
      {showAdminModal && isMounted && ReactDOM.createPortal(
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
          }}
          onClick={() => setShowAdminModal(false)}
        >
          <div
            style={{
              backgroundColor: '#0d1117',
              border: '1.5px solid #f59e0b',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '480px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(245, 158, 11, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.5rem' }}>{isSuperAdmin ? '👑' : '🛡️'}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#ffffff' }}>
                    {isSuperAdmin ? 'Super Admin Permissions' : 'Admin Directory'}
                  </h3>
                  <span style={{ fontSize: '10.5px', color: '#34d399', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    ⚡ Cloud Firestore Live Sync Active
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              {isSuperAdmin
                ? 'As Super Admin (khuonglu1999@gmail.com), you have exclusive authority to grant or revoke administrator privileges. Changes are synchronized live to Firebase Firestore.'
                : 'You are logged in as an Administrator with permissions to trigger Google Sheet sync and inspect quiz configurations. Only Super Admin (khuonglu1999@gmail.com) can add or remove admins.'}
            </p>

            {/* Add New Admin Form — STRICTLY RESTRICTED TO SUPER ADMIN */}
            {isSuperAdmin ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newAdminInput.trim() || !newAdminInput.includes('@')) {
                    setAdminMsg('Please enter a valid email address.');
                    return;
                  }
                  const res = await addAdminEmail(newAdminInput.trim());
                  setAdminMsg(res.message);
                  if (res.success) {
                    setNewAdminInput('');
                  }
                }}
                style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}
              >
                <input
                  type="email"
                  value={newAdminInput}
                  onChange={(e) => setNewAdminInput(e.target.value)}
                  placeholder="new.admin@example.com"
                  style={{
                    flex: 1,
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #30363d',
                    backgroundColor: '#161b22',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '0.65rem 1.2rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  + Add Admin
                </button>
              </form>
            ) : (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  fontSize: '0.8rem',
                  color: '#38bdf8',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                🔒 Read-Only Directory Mode: Contact <strong>khuonglu1999@gmail.com</strong> to add or modify admin accounts.
              </div>
            )}

            {adminMsg && (
              <div
                style={{
                  fontSize: '0.8rem',
                  color: adminMsg.includes('Added') || adminMsg.includes('Removed') ? '#34d399' : '#ef4444',
                  marginBottom: '1rem',
                  fontWeight: 600,
                }}
              >
                {adminMsg}
              </div>
            )}

            {/* Current Admins List */}
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.5rem' }}>
              Authorized Admin Emails ({adminEmails.length})
            </div>
            <div
              style={{
                maxHeight: '180px',
                overflowY: 'auto',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '4px',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
              }}
            >
              {adminEmails.map((email) => {
                const isCurrent = currentUser?.email?.toLowerCase() === email.toLowerCase();
                const isSuper = email.toLowerCase() === 'khuonglu1999@gmail.com';
                return (
                  <div
                    key={email}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      color: isSuper ? '#fbbf24' : isCurrent ? '#38bdf8' : '#e2e8f0',
                      background: isSuper ? 'rgba(245, 158, 11, 0.12)' : isCurrent ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                    }}
                  >
                    <span>
                      {email}{' '}
                      {isSuper && <strong style={{ fontSize: '0.75rem', color: '#f59e0b' }}>(Super Admin)</strong>}
                      {isCurrent && !isSuper && <strong style={{ fontSize: '0.75rem' }}>(You)</strong>}
                    </span>

                    {/* Remove button ONLY if caller is Super Admin AND target is NOT Super Admin */}
                    {isSuperAdmin && !isSuper && (
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await removeAdminEmail(email);
                          setAdminMsg(res.message);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                        title="Revoke admin access in Firebase"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {showGamificationModal && (
        <React.Suspense fallback={null}>
          <GamificationModal
            isOpen={showGamificationModal}
            onClose={() => setShowGamificationModal(false)}
            initialTab="ranks"
          />
        </React.Suspense>
      )}

      {showProfileModal && currentUser && (
        <React.Suspense fallback={null}>
          <UserProfileModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            currentUser={currentUser}
            isSuperAdmin={isSuperAdmin}
            isAdmin={isAdmin}
            isPremium={isPremium}
          />
        </React.Suspense>
      )}
    </div>
  );
}
