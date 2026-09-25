import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useUserProgress, setCachedUserProfile, getCachedUserProfile } from '../../context/UserProgressContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useLocation } from '@docusaurus/router';
import Link from '@docusaurus/Link';
import { triggerFireworks } from '../../utils/fireworks';

import NavbarGamificationHUD from '../../components/gamification/NavbarGamificationHUD';
import CosmicRankBadge from '../../components/gamification/CosmicRankBadge';
import { getRankForLevel, getExpProgressInCurrentLevel } from '../../data/gamificationData';
import { defaultGamificationState } from '../../services/userProgressService';

const GamificationModal = React.lazy(() => import('../../components/gamification/GamificationModal'));
const UserProfileModal = React.lazy(() => import('../../components/auth/UserProfileModal'));

// Module-scoped variable to remember client mount state across Docusaurus page navigations.
// Prevents flashing the fallback login button whenever clicking on a new page.
let hasClientMounted = typeof window !== 'undefined';

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
    formatTimeOnline,
  } = useUserProgress();
  const [isOpen, setIsOpen] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showGamificationModal, setShowGamificationModal] = useState(false);
  const [gamificationTab, setGamificationTab] = useState<'quests' | 'trophies' | 'ranks'>('quests');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newAdminInput, setNewAdminInput] = useState('');
  const [adminMsg, setAdminMsg] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [keyLoading, setKeyLoading] = useState(false);

  const [isMounted, setIsMounted] = useState(() => hasClientMounted);
  const [coords, setCoords] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const [avatarError, setAvatarError] = useState(false);

  const location = useLocation();

  useEffect(() => {
    setAvatarError(false);
  }, [currentUser?.photoURL]);

  // Automatically close dropdown whenever route/page changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hasClientMounted = true;
    if (!isMounted) setIsMounted(true);
  }, [isMounted]);

  const calcCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      return {
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
      };
    }
    return null;
  };

  const handleToggleDropdown = () => {
    if (!isOpen) {
      const nextCoords = calcCoords();
      if (nextCoords) {
        setCoords(nextCoords);
      }
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Keep coordinates updated on scroll/resize while open
  useEffect(() => {
    if (!isOpen) return;

    let rafId: number | null = null;

    function updateCoords() {
      const nextCoords = calcCoords();
      if (nextCoords) {
        setCoords(nextCoords);
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
      setCachedUserProfile(null);
      localStorage.removeItem('premium_session_state');
      sessionStorage.removeItem('premium_session_state');
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

  const cachedUser = !currentUser && typeof window !== 'undefined' ? getCachedUserProfile() : null;
  const effectiveUser = currentUser || (cachedUser as unknown as typeof currentUser);

  if ((!isMounted && !hasClientMounted) || !effectiveUser) {
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

  const name = effectiveUser.displayName || effectiveUser.email?.split('@')[0] || 'Learner';

  const gamification = progress.gamification || defaultGamificationState;
  const exp = gamification.exp || 0;
  const { currentLevel, percent: expPercent } = getExpProgressInCurrentLevel(exp);
  const rank = getRankForLevel(currentLevel);


  const roleClass = isSuperAdmin ? 'super-admin' : isAdmin ? 'admin' : isPremium ? 'premium' : '';
  const firstLetter = (name.trim().charAt(0) || 'U').toUpperCase();
  const avatarBg = isSuperAdmin
    ? '#dc2626'
    : isAdmin
    ? '#d97706'
    : isPremium
    ? '#0284c7'
    : 'var(--ifm-color-primary, #10b981)';

  return (
    <div className="custom-user-nav-wrapper" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
      <NavbarGamificationHUD />
      <button
        ref={buttonRef}
        type="button"
        className={`login-nav-button user-profile-avatar-button ${roleClass}`}
        onClick={handleToggleDropdown}
        aria-expanded={isOpen}
        aria-label={`User profile for ${name}`}
        title={name}
      >
        {effectiveUser.photoURL && !avatarError ? (
          <img
            src={effectiveUser.photoURL}
            alt={name}
            onError={() => setAvatarError(true)}
            className="user-nav-avatar-img"
          />
        ) : (
          <span
            className="user-nav-avatar-initial"
            style={{ backgroundColor: avatarBg }}
          >
            {firstLetter}
          </span>
        )}
      </button>

      {isOpen && isMounted && coords.top > 0 && ReactDOM.createPortal(
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {effectiveUser.photoURL ? (
              <img
                src={effectiveUser.photoURL}
                alt={name}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: isSuperAdmin ? '2px solid #ef4444' : isAdmin ? '2px solid #f59e0b' : isPremium ? '2px solid #38bdf8' : '2px solid #4ade80',
                  boxShadow: isSuperAdmin ? '0 0 12px rgba(239, 68, 68, 0.55)' : isAdmin ? '0 0 12px rgba(245, 158, 11, 0.55)' : isPremium ? '0 0 10px rgba(56, 189, 248, 0.35)' : 'none',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: avatarBg,
                  color: '#fff',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isSuperAdmin ? '0 0 12px rgba(239, 68, 68, 0.55)' : isAdmin ? '0 0 12px rgba(245, 158, 11, 0.55)' : isPremium ? '0 0 10px rgba(56, 189, 248, 0.35)' : 'none',
                  flexShrink: 0,
                }}
              >
                {firstLetter}
              </div>
            )}
            <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {name}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {effectiveUser.email}
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                {isSuperAdmin ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.68rem',
                      padding: '1px 7px',
                      background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                      border: '1px solid #f87171',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontWeight: 800,
                      boxShadow: '0 2px 6px rgba(239, 68, 68, 0.35)',
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
                      fontSize: '0.68rem',
                      padding: '1px 7px',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      border: '1px solid #fbbf24',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontWeight: 800,
                      boxShadow: '0 2px 6px rgba(245, 158, 11, 0.35)',
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
                      fontSize: '0.68rem',
                      padding: '1px 7px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      border: '1px solid #38bdf8',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontWeight: 700,
                      boxShadow: '0 2px 6px rgba(56, 189, 248, 0.3)',
                    }}
                  >
                    ⭐ Premium
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '0.68rem',
                      padding: '1px 7px',
                      background: 'rgba(74, 222, 128, 0.15)',
                      color: '#4ade80',
                      borderRadius: '8px',
                      fontWeight: 600,
                    }}
                  >
                    ⚡ Member
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Streamlined Cosmic Level & EXP Progress */}
          <div
            className="user-dropdown-compact-level"
            onClick={() => {
              setIsOpen(false);
              setGamificationTab('ranks');
              setShowGamificationModal(true);
            }}
            title="Open Cosmic Ranks"
            style={{
              padding: '7px 9px',
              borderRadius: '8px',
              background: `linear-gradient(135deg, ${rank.color}15 0%, rgba(255, 255, 255, 0.03) 100%)`,
              border: `1px solid ${rank.color}35`,
              cursor: 'pointer',
              marginBottom: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                <CosmicRankBadge level={currentLevel} rank={rank} size="xs" showLevelPill={false} hideOrbitRing={true} disableFloat={true} />
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ffffff' }}>Lv.{currentLevel}</span>
                <span style={{ fontSize: '0.72rem', color: rank.color, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {rank.title}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexShrink: 0 }}>
                <span
                  title="Total Active Study Time"
                  style={{
                    fontSize: '0.68rem',
                    color: '#34d399',
                    fontWeight: 700,
                    background: 'rgba(52, 211, 153, 0.12)',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    border: '1px solid rgba(52, 211, 153, 0.25)',
                  }}
                >
                  ⏱️ {formatTimeOnline(progress?.totalTimeOnlineSeconds || 0)}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.65)', fontWeight: 650 }}>
                  {expPercent}%
                </span>
              </div>
            </div>
            <div style={{ height: '3px', width: '100%', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${expPercent}%`, borderRadius: '2px', background: rank.color, transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Streamlined Menu Actions */}
          <div className="user-dropdown-menu-list" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <Link
              to="/stats"
              className="user-dropdown-item"
              onClick={() => setIsOpen(false)}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <span className="user-dropdown-item-icon">📊</span>
              <span className="user-dropdown-item-label">Learning Stats & Telemetry</span>
            </Link>

            <button
              type="button"
              className="user-dropdown-item"
              onClick={() => {
                setIsOpen(false);
                setShowProfileModal(true);
              }}
            >
              <span className="user-dropdown-item-icon">⚙️</span>
              <span className="user-dropdown-item-label">Account & Security</span>
            </button>

            <button
              type="button"
              className="user-dropdown-item"
              onClick={() => {
                setIsOpen(false);
                setGamificationTab('trophies');
                setShowGamificationModal(true);
              }}
            >
              <span className="user-dropdown-item-icon">🏆</span>
              <span className="user-dropdown-item-label">Achievements & Codex</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                className="user-dropdown-item"
                onClick={() => {
                  setIsOpen(false);
                  setShowAdminModal(true);
                  setAdminMsg('');
                }}
              >
                <span className="user-dropdown-item-icon">🛡️</span>
                <span className="user-dropdown-item-label">Admin Console ({adminEmails.length})</span>
              </button>
            )}

            {!isPremium && (
              <button
                type="button"
                className="user-dropdown-item highlight"
                onClick={() => {
                  setIsOpen(false);
                  setShowKeyModal(true);
                  setKeyError('');
                }}
              >
                <span className="user-dropdown-item-icon">👑</span>
                <span className="user-dropdown-item-label">Unlock Premium</span>
              </button>
            )}

            <div className="user-dropdown-divider" />

            <button
              type="button"
              className="user-dropdown-item danger"
              onClick={handleLogout}
            >
              <span className="user-dropdown-item-icon">🚪</span>
              <span className="user-dropdown-item-label">Sign Out</span>
            </button>
          </div>
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
            initialTab={gamificationTab}
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
