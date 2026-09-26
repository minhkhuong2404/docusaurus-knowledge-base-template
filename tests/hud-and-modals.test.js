const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { transpileCode, getUndeclaredIdentifiers } = require('./helpers/transpileHelper');

describe('Gamification HUD, Modal & Leaderboard Safety Suite', () => {
  const components = [
    {
      name: 'Navbar HUD (NavbarGamificationHUD.tsx)',
      path: 'src/components/gamification/NavbarGamificationHUD.tsx',
    },
    {
      name: 'Cosmic Rank Badge (CosmicRankBadge.tsx)',
      path: 'src/components/gamification/CosmicRankBadge.tsx',
    },
    {
      name: 'Cosmic Insignia SVG (CosmicInsigniaSvg.tsx)',
      path: 'src/components/gamification/CosmicInsigniaSvg.tsx',
    },
    {
      name: 'Level Up Toast (LevelUpToast.tsx)',
      path: 'src/components/gamification/LevelUpToast.tsx',
    },
    {
      name: 'Streak Badge SVG (StreakBadgeSvg.tsx)',
      path: 'src/components/gamification/StreakBadgeSvg.tsx',
    },
    {
      name: 'Profile & Codex Page (src/pages/profile/index.tsx)',
      path: 'src/pages/profile/index.tsx',
    },
    {
      name: 'Stats Redirect Page (src/pages/stats/index.tsx)',
      path: 'src/pages/stats/index.tsx',
    },
    {
      name: 'Custom User Navbar Item (CustomUserNavbarItem.tsx)',
      path: 'src/theme/NavbarItem/CustomUserNavbarItem.tsx',
    },
  ];

  if (fs.existsSync('src/pages/leaderboard/index.tsx')) {
    components.push({
      name: 'Leaderboard Page (src/pages/leaderboard/index.tsx)',
      path: 'src/pages/leaderboard/index.tsx',
    });
  } else if (fs.existsSync('src/pages/leaderboard.tsx')) {
    components.push({
      name: 'Leaderboard Page (src/pages/leaderboard.tsx)',
      path: 'src/pages/leaderboard.tsx',
    });
  }

  for (const comp of components) {
    it(`should transpile ${comp.name} without syntax errors`, () => {
      assert.ok(fs.existsSync(comp.path), `Component ${comp.path} must exist on disk`);
      const jsCode = transpileCode(comp.path);
      assert.ok(jsCode && jsCode.length > 50, `Transpiled output for ${comp.name} must not be empty`);
    });

    it(`should have 0 undeclared runtime identifiers in ${comp.name}`, () => {
      const undeclared = getUndeclaredIdentifiers(comp.path);
      assert.deepStrictEqual(
        undeclared,
        [],
        `Found undeclared runtime identifier(s) in ${comp.name}: ${undeclared.join(', ')}`
      );
    });
  }
});
