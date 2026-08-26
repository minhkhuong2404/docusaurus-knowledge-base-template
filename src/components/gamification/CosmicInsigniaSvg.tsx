import React from 'react';

interface CosmicInsigniaSvgProps {
  powerLevel: number;
  color: string;
  size: number;
  isSuper?: boolean;
}

export default function CosmicInsigniaSvg({
  powerLevel,
  color,
  size,
  isSuper = false,
}: CosmicInsigniaSvgProps) {
  const p = Math.max(1, Math.min(10, powerLevel));
  const idSuffix = `${p}-${size}-${Math.round(Math.random() * 1000)}`;
  const starBorderColor = isSuper ? '#fbbf24' : color;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{
        overflow: 'visible',
        display: 'block',
      }}
    >
      <defs>
        {/* Gold Metallic Gradient */}
        <linearGradient id={`goldGrad-${idSuffix}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="30%" stopColor="#fbbf24" />
          <stop offset="70%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>

        {/* Silver Metallic Gradient */}
        <linearGradient id={`silverGrad-${idSuffix}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#e2e8f0" />
          <stop offset="70%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        {/* Bronze Metallic Gradient */}
        <linearGradient id={`bronzeGrad-${idSuffix}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="40%" stopColor="#fb923c" />
          <stop offset="75%" stopColor="#c2410c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </linearGradient>

        {/* Theme Accent Gradient */}
        <linearGradient id={`themeGrad-${idSuffix}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        {/* Super God Rainbow Gradient */}
        <linearGradient id={`rainbowGrad-${idSuffix}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="20%" stopColor="#fbbf24" />
          <stop offset="40%" stopColor="#34d399" />
          <stop offset="60%" stopColor="#38bdf8" />
          <stop offset="80%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>

        {/* Gem Glow Filter */}
        <filter id={`gemGlow-${idSuffix}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Vector Contour Glow on Vector Group (Zero rectangular bounding box) */}
      <g style={{ filter: isSuper ? undefined : `drop-shadow(0 0 1.5px ${color}aa) drop-shadow(0 0 3.5px ${color}66)` }}>
        {/* ========================================================================= */}
        {/* TIER 1: BEGINNER CADET BRONZE TROPHY CUP                                  */}
        {/* ========================================================================= */}
        {p === 1 && (
        <g>
          {/* Base Pedestal */}
          <rect x="34" y="84" width="32" height="10" rx="3" fill={`url(#bronzeGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2" />
          <path d="M 46,70 L 54,70 L 52,84 L 48,84 Z" fill={`url(#bronzeGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="1.5" />
          {/* Left Simple Loop Handle */}
          <path d="M 36,36 C 22,36 22,54 36,54" fill="none" stroke={starBorderColor} strokeWidth="3.5" strokeLinecap="round" />
          {/* Right Simple Loop Handle */}
          <path d="M 64,36 C 78,36 78,54 64,54" fill="none" stroke={starBorderColor} strokeWidth="3.5" strokeLinecap="round" />
          {/* Bronze Chalice Cup Body */}
          <path d="M 32,28 L 68,28 L 62,56 C 60,66 54,70 50,70 C 46,70 40,66 38,56 Z" fill={`url(#bronzeGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2.5" />
          {/* Emerald Center Droplet Jewel */}
          <path
            d="M 50,38 C 50,38 42,48 42,54 C 42,58.5 45.5,62 50,62 C 54.5,62 58,58.5 58,54 C 58,48 50,38 50,38 Z"
            fill={`url(#themeGrad-${idSuffix})`}
            stroke={starBorderColor}
            strokeWidth="1.5"
            filter={`url(#gemGlow-${idSuffix})`}
          />
        </g>
      )}

      {/* ========================================================================= */}
      {/* TIER 2: VETERAN PILOT WINGED SILVER TROPHY GOBLET                         */}
      {/* ========================================================================= */}
      {p === 2 && (
        <g>
          {/* Silver Base Pedestal */}
          <rect x="32" y="84" width="36" height="10" rx="3" fill={`url(#silverGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2" />
          <path d="M 45,68 L 55,68 L 53,84 L 47,84 Z" fill={`url(#silverGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2" />
          {/* Left Aerodynamic Airplane Wing Handle */}
          <path d="M 34,34 L 14,24 L 18,44 L 35,54 Z" fill={`url(#silverGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2" />
          {/* Right Aerodynamic Airplane Wing Handle */}
          <path d="M 66,34 L 86,24 L 82,44 L 65,54 Z" fill={`url(#silverGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2" />
          {/* Silver Cup Body */}
          <path d="M 30,24 L 70,24 L 64,54 C 62,64 54,68 50,68 C 46,68 38,64 36,54 Z" fill={`url(#silverGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2.5" />
          {/* Cyan Flight Compass Star */}
          <polygon points="50,34 53,44 63,47 53,50 50,60 47,50 37,47 47,44" fill={starBorderColor} stroke="#ffffff" strokeWidth="1" filter={`url(#gemGlow-${idSuffix})`} />
        </g>
      )}

      {/* ========================================================================= */}
      {/* TIER 3: EXPERT PIONEER DELTA PRISM TROPHY                                 */}
      {/* ========================================================================= */}
      {p === 3 && (
        <g>
          {/* Gold Pedestal */}
          <polygon points="28,90 72,90 66,80 34,80" fill={`url(#goldGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2.5" />
          <path d="M 44,68 L 56,68 L 54,80 L 46,80 Z" fill={`url(#goldGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2" />
          {/* Left Triangular Geometric Handle */}
          <polygon points="34,32 16,42 34,54" fill="none" stroke={starBorderColor} strokeWidth="4" strokeLinejoin="round" />
          {/* Right Triangular Geometric Handle */}
          <polygon points="66,32 84,42 66,54" fill="none" stroke={starBorderColor} strokeWidth="4" strokeLinejoin="round" />
          {/* Angular Delta Prism Cup Body */}
          <polygon points="26,22 74,22 66,56 50,68 34,56" fill={`url(#goldGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="3" />
          {/* Inner Glowing Cobalt Delta Core */}
          <polygon points="50,30 64,54 36,54" fill="#0f172a" stroke={starBorderColor} strokeWidth="2" />
          <polygon points="50,34 60,51 40,51" fill={`url(#themeGrad-${idSuffix})`} filter={`url(#gemGlow-${idSuffix})`} />
          <circle cx="50" cy="45" r="3" fill="#ffffff" />
        </g>
      )}

      {/* ========================================================================= */}
      {/* TIER 4: ELITE VANGUARD QUANTUM SPACESHIP TROPHY                           */}
      {/* ========================================================================= */}
      {p === 4 && (
        <g>
          {/* Quantum Stabilizer Pedestal */}
          <polygon points="24,90 76,90 70,80 30,80" fill={`url(#silverGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2.5" />
          <rect x="42" y="70" width="16" height="10" fill={`url(#goldGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="1.5" />
          {/* Left Swept Quantum Cross Fin Handle */}
          <path d="M 32,30 L 10,24 L 14,56 L 33,56 Z" fill={`url(#silverGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2" />
          {/* Right Swept Quantum Cross Fin Handle */}
          <path d="M 68,30 L 90,24 L 86,56 L 67,56 Z" fill={`url(#silverGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2" />
          {/* Hexagonal Sci-Fi Trophy Cup */}
          <polygon points="26,24 74,24 68,56 50,70 32,56" fill={`url(#silverGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="3" />
          {/* Center Hexagonal Amethyst Power Void */}
          <polygon points="50,32 64,40 64,58 50,66 36,58 36,40" fill="#0f172a" stroke={starBorderColor} strokeWidth="2" />
          {/* Pulsing Quantum Diamond Gem */}
          <polygon points="50,36 60,49 50,62 40,49" fill={starBorderColor} stroke="#ffffff" strokeWidth="1.5" filter={`url(#gemGlow-${idSuffix})`} />
          <circle cx="50" cy="49" r="3.5" fill="#ffffff" />
        </g>
      )}

      {/* ========================================================================= */}
      {/* TIER 5: MASTER ARCHITECT SOLAR GRAND TROPHY                               */}
      {/* ========================================================================= */}
      {p === 5 && (
        <g>
          {/* 8-Pointed Solar Sunburst Halo Behind the Cup */}
          <polygon points="50,8 56,22 70,16 64,30 78,36 64,42 70,56 56,50 50,64 44,50 30,56 36,42 22,36 36,30 30,16 44,22" fill={`url(#goldGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2" opacity="0.9" />
          {/* Stepped Gold Pedestal */}
          <rect x="26" y="86" width="48" height="8" rx="2" fill={`url(#goldGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2" />
          <path d="M 43,70 L 57,70 L 54,86 L 46,86 Z" fill={`url(#goldGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2" />
          {/* Ornate Gold Filigree Handles */}
          <path d="M 30,32 C 10,30 10,60 33,56" fill="none" stroke={starBorderColor} strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 70,32 C 90,30 90,60 67,56" fill="none" stroke={starBorderColor} strokeWidth="4.5" strokeLinecap="round" />
          {/* Solar Gold Chalice Bowl */}
          <path d="M 26,26 L 74,26 L 68,54 C 64,66 56,70 50,70 C 44,70 36,66 32,54 Z" fill={`url(#goldGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="3" />
          {/* Central Pulsing Amethyst Atomic Core */}
          <circle cx="50" cy="48" r="14" fill="#0f172a" stroke={starBorderColor} strokeWidth="2" />
          <polygon points="50,38 54,46 62,48 54,50 50,58 46,50 38,48 46,46" fill={starBorderColor} stroke="#ffffff" strokeWidth="1" filter={`url(#gemGlow-${idSuffix})`} />
          <circle cx="50" cy="48" r="3.5" fill="#ffffff" />
        </g>
      )}

      {/* ========================================================================= */}
      {/* TIER 6: CHAMPION ENGINEER VICTORY TROPHY                                  */}
      {/* ========================================================================= */}
      {p === 6 && (
        <g>
          {/* Pedestal Base */}
          <rect x="26" y="84" width="48" height="10" rx="3" fill={`url(#bronzeGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2.5" />
          <rect x="34" y="76" width="32" height="8" rx="2" fill={`url(#goldGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2" />
          {/* Trophy Stem */}
          <path d="M 44,66 L 56,66 L 54,76 L 46,76 Z" fill={`url(#goldGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2" />
          {/* Left Trophy Wing Handle */}
          <path d="M 31,30 C 14,30 14,58 34,58" fill="none" stroke={starBorderColor} strokeWidth="5" strokeLinecap="round" />
          {/* Right Trophy Wing Handle */}
          <path d="M 69,30 C 86,30 86,58 66,58" fill="none" stroke={starBorderColor} strokeWidth="5" strokeLinecap="round" />
          {/* Main Trophy Chalice Body */}
          <path d="M 26,22 L 74,22 L 68,54 C 64,66 56,70 50,70 C 44,70 36,66 32,54 Z" fill={`url(#goldGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="3" />
          {/* Trophy Embossed Star */}
          <polygon points="50,34 53,42 61,43 55,48 57,56 50,51 43,56 45,48 39,43 47,42" fill={starBorderColor} stroke="#ffffff" strokeWidth="1" filter={`url(#gemGlow-${idSuffix})`} />
        </g>
      )}

      {/* ========================================================================= */}
      {/* TIER 7: HERO GRANDMASTER CELESTIAL CHALICE                                */}
      {/* ========================================================================= */}
      {p === 7 && (
        <g>
          {/* Crystal Pedestal */}
          <polygon points="24,88 76,88 70,78 30,78" fill={`url(#silverGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2.5" />
          <rect x="42" y="68" width="16" height="10" rx="2" fill={`url(#themeGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2" />
          {/* Flared Wing Handles */}
          <path d="M 30,28 C 6,22 8,64 34,60 L 30,54" fill={`url(#silverGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2.5" />
          <path d="M 70,28 C 94,22 92,64 66,60 L 70,54" fill={`url(#silverGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2.5" />
          {/* Diamond-Cut Chalice Cup */}
          <polygon points="22,18 78,18 70,56 50,70 30,56" fill={`url(#silverGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="3" />
          <polygon points="28,22 72,22 66,52 50,64 34,52" fill="#0f172a" stroke={starBorderColor} strokeWidth="2" />
          {/* Large Glowing Cyan Diamond Inlay */}
          <polygon points="50,28 63,44 50,60 37,44" fill={starBorderColor} stroke="#ffffff" strokeWidth="1.5" filter={`url(#gemGlow-${idSuffix})`} />
          <polygon points="50,35 57,44 50,53 43,44" fill="#ffffff" />
        </g>
      )}

      {/* ========================================================================= */}
      {/* TIER 8: KING OF ARCHITECTURE CROWN TROPHY                                 */}
      {/* ========================================================================= */}
      {p === 8 && (
        <g>
          {/* Imperial Base with Tiered Gold Steps */}
          <rect x="20" y="86" width="60" height="10" rx="3" fill={`url(#goldGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2.5" />
          <rect x="28" y="78" width="44" height="8" rx="2" fill={`url(#goldGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2" />
          <path d="M 43,68 L 57,68 L 54,78 L 46,78 Z" fill={`url(#goldGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2" />
          {/* Royal Filigree Ornate Handles */}
          <path d="M 28,34 C 4,32 4,68 34,62" fill="none" stroke={starBorderColor} strokeWidth="5.5" strokeLinecap="round" />
          <path d="M 72,34 C 96,32 96,68 66,62" fill="none" stroke={starBorderColor} strokeWidth="5.5" strokeLinecap="round" />
          {/* Gold Chalice Bowl */}
          <path d="M 24,30 L 76,30 L 70,58 C 66,68 56,72 50,72 C 44,72 34,68 30,58 Z" fill={`url(#goldGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="3" />
          {/* Regal 5-Point Crown Finial on Top */}
          <polygon points="26,30 32,12 42,22 50,8 58,22 68,12 74,30" fill={`url(#goldGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2.5" />
          {/* Crown Jewels (Ruby & Emeralds) */}
          <circle cx="32" cy="14" r="2.5" fill="#ef4444" filter={`url(#gemGlow-${idSuffix})`} />
          <circle cx="50" cy="10" r="3.5" fill={starBorderColor} filter={`url(#gemGlow-${idSuffix})`} />
          <circle cx="68" cy="14" r="2.5" fill="#10b981" filter={`url(#gemGlow-${idSuffix})`} />
          {/* Royal Crest Emblem */}
          <polygon points="50,40 54,49 64,51 56,57 58,66 50,61 42,66 44,57 36,51 46,49" fill={starBorderColor} stroke="#ffffff" strokeWidth="1" filter={`url(#gemGlow-${idSuffix})`} />
        </g>
      )}

      {/* ========================================================================= */}
      {/* TIER 9: COSMIC LORD CELESTIAL RELIC TROPHY                                */}
      {/* ========================================================================= */}
      {p === 9 && (
        <g>
          {/* Segmented Dark Matter Pedestal */}
          <polygon points="18,90 82,90 74,80 26,80" fill={`url(#silverGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2.5" />
          <rect x="36" y="70" width="28" height="10" rx="3" fill="#0f172a" stroke={starBorderColor} strokeWidth="2.5" />
          {/* Orbiting Hyper-Drive Arc Wings */}
          <path d="M 24,24 C -6,20 -4,74 32,66" fill="none" stroke={starBorderColor} strokeWidth="5" strokeLinecap="round" filter={`url(#gemGlow-${idSuffix})`} />
          <path d="M 76,24 C 106,20 104,74 68,66" fill="none" stroke={starBorderColor} strokeWidth="5" strokeLinecap="round" filter={`url(#gemGlow-${idSuffix})`} />
          {/* Dark Obsidian Chalice */}
          <polygon points="20,22 80,22 70,58 50,74 30,58" fill="#020617" stroke={starBorderColor} strokeWidth="3" />
          {/* Swirling Deep Space Galaxy Core Portal */}
          <ellipse cx="50" cy="46" rx="18" ry="18" fill="radial-gradient(circle, #f43f5e 0%, #881337 60%, #020617 100%)" stroke={starBorderColor} strokeWidth="2" />
          <ellipse cx="50" cy="46" rx="14" ry="6" fill="none" stroke="#ffffff" strokeWidth="1.5" transform="rotate(-30 50 46)" />
          <ellipse cx="50" cy="46" rx="14" ry="6" fill="none" stroke={starBorderColor} strokeWidth="1.5" transform="rotate(45 50 46)" />
          <circle cx="50" cy="46" r="4" fill="#ffffff" filter={`url(#gemGlow-${idSuffix})`} />
        </g>
      )}

      {/* ========================================================================= */}
      {/* TIER 10: SUPER GOD TRANSCENDENT CELESTIAL TROPHY (MAX POWER)             */}
      {/* ========================================================================= */}
      {p === 10 && (
        <g>
          {/* Massive Golden Dragon / Angelic Wings */}
          <path
            d="M 50,55 C 20,45 -4,25 2,2 C 14,24 28,34 50,44 Z"
            fill={isSuper ? `url(#rainbowGrad-${idSuffix})` : `url(#goldGrad-${idSuffix})`}
            stroke={starBorderColor}
            strokeWidth="3"
            filter={`url(#gemGlow-${idSuffix})`}
          />
          <path
            d="M 50,55 C 80,45 104,25 98,2 C 86,24 72,34 50,44 Z"
            fill={isSuper ? `url(#rainbowGrad-${idSuffix})` : `url(#goldGrad-${idSuffix})`}
            stroke={starBorderColor}
            strokeWidth="3"
            filter={`url(#gemGlow-${idSuffix})`}
          />

          {/* Imperial Divine Pedestal with Ruby/Emerald Core */}
          <polygon points="14,92 86,92 78,82 22,82" fill={`url(#goldGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="3" />
          <rect x="32" y="74" width="36" height="8" rx="2" fill={`url(#goldGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2.5" />
          <path d="M 42,66 L 58,66 L 55,74 L 45,74 Z" fill={`url(#goldGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2" />

          {/* Grand Master Trophy Body */}
          <path
            d="M 20,28 L 80,28 L 72,60 C 66,72 56,76 50,76 C 44,76 34,72 28,60 Z"
            fill={isSuper ? `url(#rainbowGrad-${idSuffix})` : `url(#goldGrad-${idSuffix})`}
            stroke={starBorderColor}
            strokeWidth="3"
          />

          {/* Inner Celestial Core Void */}
          <ellipse cx="50" cy="50" rx="16" ry="18" fill="#0f172a" stroke={starBorderColor} strokeWidth="2.5" />

          {/* 7-Point Imperial Coronet on Cup Rim */}
          <polygon points="20,28 26,10 34,22 42,6 50,18 58,6 66,22 74,10 80,28" fill={`url(#goldGrad-${idSuffix})`} stroke={starBorderColor} strokeWidth="2.5" />
          {/* Coronet Jewels */}
          <circle cx="26" cy="12" r="2.5" fill="#f43f5e" filter={`url(#gemGlow-${idSuffix})`} />
          <circle cx="42" cy="8" r="3" fill="#38bdf8" filter={`url(#gemGlow-${idSuffix})`} />
          <circle cx="58" cy="8" r="3" fill="#34d399" filter={`url(#gemGlow-${idSuffix})`} />
          <circle cx="74" cy="12" r="2.5" fill="#f43f5e" filter={`url(#gemGlow-${idSuffix})`} />

          {/* Central Eternal Power Lightning Crystal */}
          <polygon
            points="50,34 58,48 48,50 56,66 42,52 50,50"
            fill="#ffffff"
            stroke={starBorderColor}
            strokeWidth="2"
            filter={`url(#gemGlow-${idSuffix})`}
          />
        </g>
      )}
      </g>
    </svg>
  );
}
