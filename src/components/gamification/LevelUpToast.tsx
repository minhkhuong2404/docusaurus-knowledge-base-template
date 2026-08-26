import React, { useEffect } from 'react';
import { useUserProgress } from '../../context/UserProgressContext';

export default function LevelUpToast() {
  const { toast, dismissToast } = useUserProgress();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 5500);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  if (!toast) return null;

  const isLevelUp = toast.type === 'levelup';
  const isAchievement = toast.type === 'achievement';
  const isStreak = toast.type === 'streak';

  const borderColor = isLevelUp
    ? '#fbbf24'
    : isAchievement
    ? '#a855f7'
    : isStreak
    ? '#f97316'
    : '#38bdf8';

  const glowShadow = isLevelUp
    ? '0 10px 35px rgba(251, 191, 36, 0.45)'
    : isAchievement
    ? '0 10px 35px rgba(168, 85, 247, 0.45)'
    : isStreak
    ? '0 10px 35px rgba(249, 115, 22, 0.45)'
    : '0 10px 35px rgba(56, 189, 248, 0.45)';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999999,
        maxWidth: '380px',
        width: 'calc(100vw - 48px)',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.94) 100%)',
        border: `1.5px solid ${borderColor}`,
        boxShadow: `${glowShadow}, 0 4px 20px rgba(0, 0, 0, 0.8)`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '16px 18px',
        color: '#ffffff',
        animation: 'slideInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <style>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulseGlow {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem',
            flexShrink: 0,
            animation: 'pulseGlow 2s infinite ease-in-out',
          }}
        >
          {toast.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 800,
                color: borderColor,
              }}
            >
              {isLevelUp ? 'Cosmic Advancement' : isAchievement ? 'Trophy Unlocked' : isStreak ? 'Streak Maintained' : 'Mission Completed'}
            </span>
            <button
              type="button"
              onClick={dismissToast}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '0 4px',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff', marginTop: '2px', lineHeight: 1.3 }}>
            {toast.title}
          </div>

          <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.75)', marginTop: '4px', lineHeight: 1.4 }}>
            {toast.subtitle}
          </div>

          {toast.exp && toast.exp > 0 && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '8px',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(251, 191, 36, 0.15)',
                border: '1px solid rgba(251, 191, 36, 0.4)',
                color: '#fbbf24',
                fontSize: '0.78rem',
                fontWeight: 800,
              }}
            >
              <span>⚡ +{toast.exp} EXP Awarded</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
