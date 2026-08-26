import React from 'react';
import { CosmicRank, getRankForLevel } from '../../data/gamificationData';
import CosmicInsigniaSvg from './CosmicInsigniaSvg';

interface CosmicRankBadgeProps {
  level: number;
  rank?: CosmicRank;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showLevelPill?: boolean;
  hideOrbitRing?: boolean;
  interactive?: boolean;
  disableFloat?: boolean;
}

const SIZE_CONFIGS = {
  xs: { box: 20, icon: '11px', pill: '8px', glow: 6, sparkleSize: 4 },
  sm: { box: 36, icon: '18px', pill: '10px', glow: 12, sparkleSize: 6 },
  md: { box: 48, icon: '24px', pill: '11px', glow: 18, sparkleSize: 8 },
  lg: { box: 70, icon: '34px', pill: '12px', glow: 26, sparkleSize: 10 },
  xl: { box: 92, icon: '46px', pill: '14px', glow: 36, sparkleSize: 13 },
  hero: { box: 116, icon: '58px', pill: '15px', glow: 45, sparkleSize: 16 },
};

export default function CosmicRankBadge({
  level,
  rank: customRank,
  size = 'md',
  showLevelPill = true,
  interactive = false,
  disableFloat = false,
}: CosmicRankBadgeProps) {
  const rank = customRank || getRankForLevel(level);
  const cfg = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;
  const power = rank.powerLevel || 1;
  const isSuper = !!rank.isSuperLevel || power >= 10;
  const shouldDisableFloat = disableFloat || size === 'xs';

  // Visual scaling multiplier for higher tier ranks
  const powerScale = 1 + (power - 1) * 0.03 + (isSuper ? 0.06 : 0);
  const finalBoxSize = Math.round(cfg.box * (size === 'xs' ? 1 : powerScale));

  // Snug canvas fitting closely to the trophy
  const canvasSize = finalBoxSize;
  const centerCoord = canvasSize / 2;

  // Optimized star count for silky 60 FPS performance without CPU spikes
  const sparkleCount = shouldDisableFloat ? 0 : Math.min(12, Math.max(6, Math.round(power * 0.9 + (isSuper ? 3 : 0))));
  const orbitSpeedSec = Math.max(2.5, 6.5 - power * 0.35);
  const floatDurationSec = Math.max(2.5, 4.0 - power * 0.15);

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}
    >
      <style>{`
        /* 🚀 GPU-Accelerated Floating (Uses pure translate3d) */
        @keyframes trophyHoverFloat-${power} {
          0%, 100% {
            transform: translate3d(0, 0px, 0);
          }
          50% {
            transform: translate3d(0, -3.5px, 0);
          }
        }
        /* ⚡ Smooth Opacity Pulse (GPU Composited, Zero CPU Rasterization) */
        @keyframes trophyDirectNeonPulse-${power} {
          0%, 100% {
            opacity: 0.92;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes superGodRainbowNeonGlow-${power} {
          0% { filter: hue-rotate(0deg) drop-shadow(0 0 4px #f43f5e) drop-shadow(0 0 10px #f43f5e); }
          50% { filter: hue-rotate(180deg) drop-shadow(0 0 4px #38bdf8) drop-shadow(0 0 10px #38bdf8); }
          100% { filter: hue-rotate(360deg) drop-shadow(0 0 4px #f43f5e) drop-shadow(0 0 10px #f43f5e); }
        }
        /* 🌟 Border Flow: Left Side (translate3d) */
        @keyframes starBorderGlideLeft-${power} {
          0% {
            transform: translate3d(-16px, 32px, 0) scale(0.2);
            opacity: 0;
          }
          25% {
            opacity: 1;
            transform: translate3d(-30px, 4px, 0) scale(0.95);
          }
          70% {
            opacity: 0.95;
            transform: translate3d(-24px, -24px, 0) scale(1.05);
          }
          100% {
            transform: translate3d(-14px, -36px, 0) scale(0.15);
            opacity: 0;
          }
        }
        /* 🌟 Border Flow: Right Side (translate3d) */
        @keyframes starBorderGlideRight-${power} {
          0% {
            transform: translate3d(16px, 32px, 0) scale(0.2);
            opacity: 0;
          }
          25% {
            opacity: 1;
            transform: translate3d(30px, 4px, 0) scale(0.95);
          }
          70% {
            opacity: 0.95;
            transform: translate3d(24px, -24px, 0) scale(1.05);
          }
          100% {
            transform: translate3d(14px, -36px, 0) scale(0.15);
            opacity: 0;
          }
        }
        /* ✨ Center Core Outward Burst (translate3d) */
        @keyframes starCenterCoreBurst-${power} {
          0% {
            transform: translate3d(0px, 6px, 0) scale(0.2);
            opacity: 0;
          }
          30% {
            opacity: 1;
            transform: translate3d(0px, -12px, 0) scale(1.15);
          }
          70% {
            opacity: 0.9;
            transform: translate3d(0px, -26px, 0) scale(0.95);
          }
          100% {
            transform: translate3d(0px, -38px, 0) scale(0.1);
            opacity: 0;
          }
        }
        .cosmic-badge-${power} {
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        ${shouldDisableFloat ? '' : `
        .cosmic-badge-${power}:hover .cosmic-trophy-${power},
        .cosmic-trophy-${power}:hover {
          transform: translate3d(0, -2.5px, 0) scale(1.04) !important;
        }
        `}
        .cosmic-badge-${power}:hover .cosmic-trophy-${power} svg g,
        .cosmic-trophy-${power}:hover svg g {
          filter: drop-shadow(0 0 2px ${rank.color}) drop-shadow(0 0 5px ${rank.color}88) !important;
        }
        .cosmic-badge-${power}:hover .cosmic-level-pill-${power} {
          border-color: ${rank.color} !important;
          box-shadow: 0 0 8px ${rank.color}66, inset 0 0 4px ${rank.color}22 !important;
          background: linear-gradient(135deg, ${rank.color}25 0%, rgba(15, 23, 42, 0.98) 100%) !important;
        }
      `}</style>

      {/* Main Relative Container for Trophy + Moving Sparkles */}
      <div
        className={`cosmic-badge-${power}`}
        style={{
          position: 'relative',
          width: `${canvasSize}px`,
          height: `${canvasSize}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* ========================================================= */}
        {/* ✨ DYNAMIC SMALL STARS ON TROPHY BORDER & CENTER          */}
        {/* ========================================================= */}
        {sparkleCount > 0 && (
          <svg
            width={finalBoxSize}
            height={finalBoxSize}
            viewBox="0 0 100 100"
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'visible',
              pointerEvents: 'none',
              zIndex: 4,
            }}
          >
            {/* Centered Anchor Group with GPU Promotion */}
            <g transform="translate(50, 50)" style={{ willChange: 'transform' }}>
              {/* 1. LEFT BORDER STREAM OF SMALL STARS */}
              {Array.from({ length: Math.ceil(sparkleCount / 3) }).map((_, i) => {
                const count = Math.ceil(sparkleCount / 3);
                const delay = (orbitSpeedSec / count) * i;
                const starSize = 7 + (i % 2) * 2;

                return (
                  <g
                    key={`left-${i}`}
                    style={{
                      animation: `starBorderGlideLeft-${power} ${orbitSpeedSec}s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
                      animationDelay: `-${delay}s`,
                      willChange: 'transform, opacity',
                    }}
                  >
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={rank.color}
                      fontSize={starSize}
                      fontWeight="900"
                      style={{
                        filter: `drop-shadow(0 0 3px ${rank.color}) drop-shadow(0 0 6px ${rank.color})`,
                      }}
                    >
                      ★
                    </text>
                  </g>
                );
              })}

              {/* 2. RIGHT BORDER STREAM OF SMALL STARS */}
              {Array.from({ length: Math.ceil(sparkleCount / 3) }).map((_, i) => {
                const count = Math.ceil(sparkleCount / 3);
                const delay = (orbitSpeedSec / count) * i + (orbitSpeedSec / (count * 2));
                const starSize = 7 + (i % 2) * 2;

                return (
                  <g
                    key={`right-${i}`}
                    style={{
                      animation: `starBorderGlideRight-${power} ${orbitSpeedSec}s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
                      animationDelay: `-${delay}s`,
                      willChange: 'transform, opacity',
                    }}
                  >
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={rank.color}
                      fontSize={starSize}
                      fontWeight="900"
                      style={{
                        filter: `drop-shadow(0 0 3px ${rank.color}) drop-shadow(0 0 6px ${rank.color})`,
                      }}
                    >
                      ★
                    </text>
                  </g>
                );
              })}

              {/* 3. CENTER CORE RADIATING OUTWARD STARS */}
              {Array.from({ length: Math.max(1, Math.floor(sparkleCount / 3)) }).map((_, i) => {
                const count = Math.max(1, Math.floor(sparkleCount / 3));
                const delay = (orbitSpeedSec / count) * i + 0.25;
                const starSize = 8;

                return (
                  <g
                    key={`center-${i}`}
                    style={{
                      animation: `starCenterCoreBurst-${power} ${orbitSpeedSec * 0.9}s ease-in-out infinite`,
                      animationDelay: `-${delay}s`,
                      willChange: 'transform, opacity',
                    }}
                  >
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={rank.color}
                      fontSize={starSize}
                      fontWeight="900"
                      style={{
                        filter: `drop-shadow(0 0 4px ${rank.color}) drop-shadow(0 0 8px ${rank.color})`,
                      }}
                    >
                      ✦
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        )}

        {/* ========================================================= */}
        {/* 🏆 FLOATING TROPHY WITH DIRECT NEON EFFECT & HOVER LEVITATE */}
        {/* ========================================================= */}
        <div
          className={`cosmic-trophy-${power}`}
          style={{
            position: 'relative',
            width: `${finalBoxSize}px`,
            height: `${finalBoxSize}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            animation: isSuper
              ? `superGodRainbowNeonGlow-${power} 5s linear infinite${shouldDisableFloat ? '' : `, trophyHoverFloat-${power} ${floatDurationSec}s ease-in-out infinite`}`
              : `trophyDirectNeonPulse-${power} ${Math.max(2, 3.5 - power * 0.1)}s ease-in-out infinite${shouldDisableFloat ? '' : `, trophyHoverFloat-${power} ${floatDurationSec}s ease-in-out infinite`}`,
            cursor: interactive ? 'pointer' : 'default',
            zIndex: 3,
            willChange: shouldDisableFloat ? 'opacity' : 'transform, opacity',
          }}
        >
          {/* TIER 10: SUPER LEVEL GOD (Floating Imperial Crown) */}
          {isSuper && size !== 'xs' && (
            <div
              style={{
                position: 'absolute',
                top: `-${Math.round(finalBoxSize * 0.36)}px`,
                fontSize: `${Math.round(cfg.box * 0.45)}px`,
                filter: 'drop-shadow(0 0 10px #fbbf24)',
                animation: `trophyHoverFloat-${power} 2s ease-in-out infinite`,
                zIndex: 10,
                willChange: 'transform',
              }}
            >
              👑
            </div>
          )}

          {/* Core Vector 3D Trophy with Direct Neon Illumination */}
          <CosmicInsigniaSvg
            powerLevel={power}
            color={rank.color}
            size={finalBoxSize}
            isSuper={isSuper}
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🏷️ LEVEL PILL BADGE                                       */}
      {/* ========================================================= */}
      {showLevelPill && (
        <div
          className={`cosmic-level-pill-${power}`}
          style={{
            marginTop: '4px',
            padding: '2px 8px',
            borderRadius: '10px',
            background: `linear-gradient(135deg, ${rank.color}25 0%, rgba(15, 23, 42, 0.95) 100%)`,
            border: `1px solid ${rank.color}77`,
            boxShadow: `0 0 10px ${rank.borderGlow}`,
            fontSize: cfg.pill,
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            zIndex: 5,
          }}
        >
          <span style={{ color: rank.color }}>Lv.{level}</span>
          <span style={{ opacity: 0.6, fontSize: '0.7em' }}>•</span>
          <span style={{ fontSize: '0.9em', color: rank.color }}>{rank.title}</span>
        </div>
      )}
    </div>
  );
}
