import React from 'react';

export interface StreakMilestoneDef {
  days: number;
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  glow: string;
  flameLevel: number;
  expReward: number;
}

export const STREAK_MILESTONES: StreakMilestoneDef[] = [
  {
    days: 1,
    id: 'streak_1',
    title: 'Spark Genesis',
    subtitle: 'Ignited your very first daily learning spark.',
    icon: '✨',
    color: '#fdba74',
    glow: 'rgba(253, 186, 116, 0.45)',
    flameLevel: 1,
    expReward: 30,
  },
  {
    days: 3,
    id: 'streak_3',
    title: 'Sparks of Discipline',
    subtitle: 'Maintained a 3-day active learning ignition.',
    icon: '🔥',
    color: '#fb923c',
    glow: 'rgba(251, 146, 60, 0.45)',
    flameLevel: 1,
    expReward: 80,
  },
  {
    days: 5,
    id: 'streak_5',
    title: 'Ignition Flame',
    subtitle: '5 consecutive days of continuous code practice.',
    icon: '🕯️',
    color: '#f97316',
    glow: 'rgba(249, 115, 22, 0.5)',
    flameLevel: 2,
    expReward: 120,
  },
  {
    days: 7,
    id: 'streak_7',
    title: 'Week of Fire',
    subtitle: '1 full week of uninterrupted daily engineering mastery.',
    icon: '🔥',
    color: '#ea580c',
    glow: 'rgba(234, 88, 12, 0.55)',
    flameLevel: 2,
    expReward: 200,
  },
  {
    days: 10,
    id: 'streak_10',
    title: 'Decade Pulse',
    subtitle: '10 days of continuous algorithmic & system design focus.',
    icon: '⚡',
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.6)',
    flameLevel: 3,
    expReward: 260,
  },
  {
    days: 14,
    id: 'streak_14',
    title: 'Double Fortnight',
    subtitle: '2 consecutive weeks (14 days) without breaking the chain.',
    icon: '⚡',
    color: '#d97706',
    glow: 'rgba(217, 119, 6, 0.65)',
    flameLevel: 3,
    expReward: 320,
  },
  {
    days: 18,
    id: 'streak_18',
    title: 'Synaptic Acceleration',
    subtitle: '18 days of high-bandwidth technical learning.',
    icon: '💡',
    color: '#eab308',
    glow: 'rgba(234, 179, 8, 0.65)',
    flameLevel: 3,
    expReward: 390,
  },
  {
    days: 21,
    id: 'streak_21',
    title: 'Habit Formation Genesis',
    subtitle: '21 days! Daily learning is now hardwired into your daily habit.',
    icon: '🧠',
    color: '#eab308',
    glow: 'rgba(234, 179, 8, 0.7)',
    flameLevel: 4,
    expReward: 450,
  },
  {
    days: 25,
    id: 'streak_25',
    title: 'Silver Quarter',
    subtitle: '25 continuous days of code, architectural, and DSA drills.',
    icon: '🥈',
    color: '#ca8a04',
    glow: 'rgba(202, 138, 4, 0.7)',
    flameLevel: 4,
    expReward: 550,
  },
  {
    days: 30,
    id: 'streak_30',
    title: 'Lunar Combustion',
    subtitle: '1 full lunar month (30 days) of unyielding engineering discipline.',
    icon: '🌙',
    color: '#ca8a04',
    glow: 'rgba(202, 138, 4, 0.75)',
    flameLevel: 4,
    expReward: 750,
  },
  {
    days: 35,
    id: 'streak_35',
    title: 'Five-Week Crucible',
    subtitle: '35 days forged in continuous learning fire.',
    icon: '🔥',
    color: '#a3e635',
    glow: 'rgba(163, 230, 53, 0.75)',
    flameLevel: 5,
    expReward: 850,
  },
  {
    days: 40,
    id: 'streak_40',
    title: 'Ascent of Perseverance',
    subtitle: '40 days scaling technical heights without wavering.',
    icon: '🧗',
    color: '#84cc16',
    glow: 'rgba(132, 204, 22, 0.75)',
    flameLevel: 5,
    expReward: 900,
  },
  {
    days: 45,
    id: 'streak_45',
    title: 'Mid-Quarter Blaze',
    subtitle: '45 continuous days of deep reading & coding simulations.',
    icon: '🌟',
    color: '#84cc16',
    glow: 'rgba(132, 204, 22, 0.75)',
    flameLevel: 5,
    expReward: 950,
  },
  {
    days: 50,
    id: 'streak_50',
    title: 'Half-Century Forge',
    subtitle: '50-day milestone. Your discipline is forged in iron.',
    icon: '🛡️',
    color: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.8)',
    flameLevel: 5,
    expReward: 1050,
  },
  {
    days: 60,
    id: 'streak_60',
    title: 'Bimonthly Dynamo',
    subtitle: '2 full months (60 days) of unstoppable momentum.',
    icon: '🔋',
    color: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.8)',
    flameLevel: 5,
    expReward: 1200,
  },
  {
    days: 70,
    id: 'streak_70',
    title: 'Ten-Week Vanguard',
    subtitle: '70 continuous days (10 weeks) leading by example.',
    icon: '🎖️',
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.8)',
    flameLevel: 5,
    expReward: 1350,
  },
  {
    days: 75,
    id: 'streak_75',
    title: 'Quarter-Century Flare',
    subtitle: '75 days of compounding knowledge and technical depth.',
    icon: '🛡️',
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.8)',
    flameLevel: 5,
    expReward: 1500,
  },
  {
    days: 80,
    id: 'streak_80',
    title: 'Resilience Capacitor',
    subtitle: '80 days storing and executing deep engineering knowledge.',
    icon: '⚡',
    color: '#14b8a6',
    glow: 'rgba(20, 184, 166, 0.8)',
    flameLevel: 6,
    expReward: 1650,
  },
  {
    days: 90,
    id: 'streak_90',
    title: 'Quarter-Year Titan',
    subtitle: '90 days (1 full quarter!). An extraordinary standard of consistency.',
    icon: '🏛️',
    color: '#14b8a6',
    glow: 'rgba(20, 184, 166, 0.8)',
    flameLevel: 6,
    expReward: 1850,
  },
  {
    days: 100,
    id: 'streak_100',
    title: 'Centurion Supernova',
    subtitle: '100 days of non-stop daily mastery. A true centurion!',
    icon: '💯',
    color: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.85)',
    flameLevel: 6,
    expReward: 2500,
  },
  {
    days: 110,
    id: 'streak_110',
    title: 'Orbital Acceleration',
    subtitle: '110 days breaking beyond standard learning thresholds.',
    icon: '🛸',
    color: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.85)',
    flameLevel: 7,
    expReward: 2850,
  },
  {
    days: 120,
    id: 'streak_120',
    title: 'Trimester Overdrive',
    subtitle: '120 days (4 full months) of relentless technical execution.',
    icon: '🚀',
    color: '#0ea5e9',
    glow: 'rgba(14, 165, 233, 0.85)',
    flameLevel: 7,
    expReward: 3200,
  },
  {
    days: 135,
    id: 'streak_135',
    title: 'Starlight Conduit',
    subtitle: '135 days channeling cosmic knowledge daily.',
    icon: '🌠',
    color: '#0ea5e9',
    glow: 'rgba(14, 165, 233, 0.85)',
    flameLevel: 7,
    expReward: 3600,
  },
  {
    days: 150,
    id: 'streak_150',
    title: 'Comet Trail Blazer',
    subtitle: '150 days (5 full months) leaving a blazing trail of knowledge.',
    icon: '☄️',
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.85)',
    flameLevel: 7,
    expReward: 4000,
  },
  {
    days: 165,
    id: 'streak_165',
    title: 'Solar Flares of Dedication',
    subtitle: '165 days emitting radiant passion for complex systems.',
    icon: '☀️',
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.85)',
    flameLevel: 8,
    expReward: 4400,
  },
  {
    days: 180,
    id: 'streak_180',
    title: 'Semi-Annual Equinox',
    subtitle: '180 days (half a year!) of disciplined daily growth.',
    icon: '⚖️',
    color: '#60a5fa',
    glow: 'rgba(96, 165, 250, 0.85)',
    flameLevel: 8,
    expReward: 4800,
  },
  {
    days: 200,
    id: 'streak_200',
    title: 'Orbital Resonance',
    subtitle: '200 days in perfect perpetual orbit with deep engineering.',
    icon: '🪐',
    color: '#818cf8',
    glow: 'rgba(129, 140, 248, 0.9)',
    flameLevel: 8,
    expReward: 5500,
  },
  {
    days: 220,
    id: 'streak_220',
    title: 'Cosmic Pulsar',
    subtitle: '220 days beating with rhythmic technical precision.',
    icon: '📡',
    color: '#818cf8',
    glow: 'rgba(129, 140, 248, 0.9)',
    flameLevel: 9,
    expReward: 6200,
  },
  {
    days: 240,
    id: 'streak_240',
    title: 'Eight-Month Bastion',
    subtitle: '240 days (8 months) of unyielding consistency.',
    icon: '🏰',
    color: '#a78bfa',
    glow: 'rgba(167, 139, 250, 0.9)',
    flameLevel: 9,
    expReward: 7000,
  },
  {
    days: 260,
    id: 'streak_260',
    title: 'Quantum Superposition',
    subtitle: '260 days of quantum-speed learning and persistence.',
    icon: '💠',
    color: '#a78bfa',
    glow: 'rgba(167, 139, 250, 0.9)',
    flameLevel: 9,
    expReward: 8000,
  },
  {
    days: 280,
    id: 'streak_280',
    title: 'Deep Nebula Core',
    subtitle: '280 days forging galaxies of software design expertise.',
    icon: '🌌',
    color: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.95)',
    flameLevel: 10,
    expReward: 9000,
  },
  {
    days: 300,
    id: 'streak_300',
    title: 'Volcanic Transcendence',
    subtitle: '300 days (10 months) of incandescent passion and relentless code excellence.',
    icon: '🌋',
    color: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.95)',
    flameLevel: 10,
    expReward: 10000,
  },
  {
    days: 320,
    id: 'streak_320',
    title: 'Stellar Nucleosynthesis',
    subtitle: '320 days fusing complex architecture into effortless intuition.',
    icon: '⚛️',
    color: '#e879f9',
    glow: 'rgba(232, 121, 249, 1.0)',
    flameLevel: 11,
    expReward: 11500,
  },
  {
    days: 340,
    id: 'streak_340',
    title: 'Event Horizon Approaching',
    subtitle: '340 days on the threshold of complete 1-year mastery.',
    icon: '🔮',
    color: '#f472b6',
    glow: 'rgba(244, 114, 182, 1.0)',
    flameLevel: 11,
    expReward: 13000,
  },
  {
    days: 350,
    id: 'streak_350',
    title: 'Final Countdown to Eternity',
    subtitle: '350 days! Just 15 days left to complete the grand solar orbit.',
    icon: '⏳',
    color: '#fb7185',
    glow: 'rgba(251, 113, 133, 1.0)',
    flameLevel: 12,
    expReward: 14000,
  },
  {
    days: 360,
    id: 'streak_360',
    title: 'Apex Solar Penultimate',
    subtitle: '360 days! 5 days away from universal immortality.',
    icon: '🌟',
    color: '#f43f5e',
    glow: 'rgba(244, 63, 94, 1.0)',
    flameLevel: 12,
    expReward: 14500,
  },
  {
    days: 365,
    id: 'streak_365',
    title: 'Solar Year of Eternity',
    subtitle: '365 DAYS! (THE ULTIMATE ZENITH). A complete 1-year solar revolution without missing a single day.',
    icon: '👑',
    color: '#fbbf24',
    glow: 'rgba(251, 191, 36, 1.0)',
    flameLevel: 14,
    expReward: 20000,
  },
];

interface StreakBadgeSvgProps {
  days: number;
  size?: number;
  isUnlocked?: boolean;
}

export default function StreakBadgeSvg({ days, size = 64, isUnlocked = true }: StreakBadgeSvgProps) {
  const milestone = STREAK_MILESTONES.find((m) => m.days === days) || STREAK_MILESTONES[0];
  const color = milestone.color;
  const isSuper = days >= 365;
  const idSuffix = `${days}-${Math.round(Math.random() * 1000)}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{
        overflow: 'visible',
        display: 'block',
        filter: isUnlocked ? `drop-shadow(0 0 8px ${milestone.glow})` : 'grayscale(1) opacity(0.35)',
      }}
    >
      <defs>
        <linearGradient id={`flameGrad-${idSuffix}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor="#fef08a" />
        </linearGradient>

        <linearGradient id={`shieldGrad-${idSuffix}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        <linearGradient id={`rainbowFlame-${idSuffix}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="25%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#34d399" />
          <stop offset="75%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>

      {/* Outer Glow Aura Halo */}
      {isUnlocked && (
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke={isSuper ? `url(#rainbowFlame-${idSuffix})` : color}
          strokeWidth="1.5"
          strokeDasharray={days >= 100 ? '4 2' : 'none'}
          opacity="0.6"
        />
      )}

      {/* Main Base Shield Frame */}
      <polygon
        points="50,6 88,24 88,64 50,94 12,64 12,24"
        fill={`url(#shieldGrad-${idSuffix})`}
        stroke={isSuper ? `url(#rainbowFlame-${idSuffix})` : color}
        strokeWidth="3"
      />

      {/* Inner Metallic Bezel */}
      <polygon
        points="50,14 80,29 80,60 50,84 20,60 20,29"
        fill="#020617"
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray={days >= 50 ? '3 2' : 'none'}
      />

      {/* Multi-Layer Stylized Fire Flame Crest */}
      <g transform="translate(0, -2)">
        {/* Outer Flame */}
        <path
          d="M 50,22 C 42,32 30,42 30,58 C 30,70 38,78 50,78 C 62,78 70,70 70,58 C 70,42 58,32 50,22 Z"
          fill={isSuper ? `url(#rainbowFlame-${idSuffix})` : `url(#flameGrad-${idSuffix})`}
          opacity="0.9"
        />
        {/* Inner Flame Core */}
        <path
          d="M 50,34 C 45,42 38,48 38,58 C 38,66 43,72 50,72 C 57,72 62,66 62,58 C 62,48 55,42 50,34 Z"
          fill="#fef08a"
          opacity="0.95"
        />
        {/* Center Spark Core */}
        <ellipse cx="50" cy="58" rx="5" ry="7" fill="#ffffff" />
      </g>

      {/* Top Coronet for 365, 500, and 1000 days */}
      {days >= 365 && (
        <polygon
          points="36,12 42,2 50,8 58,2 64,12"
          fill="#fbbf24"
          stroke="#78350f"
          strokeWidth="1"
        />
      )}

      {/* Day Count Plaque at the Bottom */}
      <rect
        x="24"
        y="74"
        width="52"
        height="18"
        rx="5"
        fill="#0f172a"
        stroke={color}
        strokeWidth="1.5"
      />
      <text
        x="50"
        y="86"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontSize="10"
        fontWeight="900"
        letterSpacing="0.5px"
      >
        {days}D
      </text>
    </svg>
  );
}
