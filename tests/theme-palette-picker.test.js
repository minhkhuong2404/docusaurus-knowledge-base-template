const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { transpileCode, getUndeclaredIdentifiers } = require('./helpers/transpileHelper');

describe('Theme & Palette Switcher Invariants & AST Safety Suite', () => {
  const components = [
    {
      name: 'Theme Palette Picker (ThemePalettePicker.tsx)',
      path: 'src/components/ThemePalettePicker.tsx',
    },
    {
      name: 'Theme Palette Navbar Item (ThemePaletteNavbarItem.tsx)',
      path: 'src/theme/NavbarItem/ThemePaletteNavbarItem.tsx',
    },
    {
      name: 'Theme Presets Utility (themePresets.ts)',
      path: 'src/utils/themePresets.ts',
    },
  ];

  for (const comp of components) {
    it(`should transpile ${comp.name} cleanly without syntax errors`, () => {
      assert.ok(fs.existsSync(comp.path), `File ${comp.path} must exist on disk`);
      const jsCode = transpileCode(comp.path);
      assert.ok(jsCode && jsCode.length > 50, `Transpiled output for ${comp.name} must not be empty`);
    });

    it(`should have 0 undeclared runtime identifiers in ${comp.name}`, () => {
      const undeclared = getUndeclaredIdentifiers(comp.path);
      assert.strictEqual(
        undeclared.length,
        0,
        `Found undeclared identifiers in ${comp.path}: ${undeclared.join(', ')}`
      );
    });
  }

  it('should verify theme presets data integrity in themePresets.ts', () => {
    const fileContent = fs.readFileSync('src/utils/themePresets.ts', 'utf-8');
    
    // Check preset IDs
    const expectedPresets = ['emerald', 'tokyo-night', 'nord', 'catppuccin', 'amber', 'rose'];
    for (const presetId of expectedPresets) {
      assert.ok(
        fileContent.includes(`id: '${presetId}'`),
        `themePresets.ts must define preset ${presetId}`
      );
    }

    // Check helper functions are exported
    assert.ok(fileContent.includes('export function getStoredThemePreset'), 'Must export getStoredThemePreset');
    assert.ok(fileContent.includes('export function setStoredThemePreset'), 'Must export setStoredThemePreset');
    assert.ok(fileContent.includes('export function applyThemePreset'), 'Must export applyThemePreset');
  });

  it('ComponentTypes.tsx should register custom-themePalettePicker', () => {
    const compTypesContent = fs.readFileSync('src/theme/NavbarItem/ComponentTypes.tsx', 'utf-8');
    assert.ok(
      compTypesContent.includes("'custom-themePalettePicker': ThemePaletteNavbarItem"),
      'ComponentTypes.tsx must register custom-themePalettePicker'
    );
  });

  it('docusaurus.config.ts should configure colorMode and custom-themePalettePicker', () => {
    const configContent = fs.readFileSync('docusaurus.config.ts', 'utf-8');
    assert.ok(
      configContent.includes("type: 'custom-themePalettePicker'"),
      'docusaurus.config.ts navbar must include custom-themePalettePicker'
    );
    assert.ok(
      configContent.includes("disableSwitch: false"),
      'docusaurus.config.ts must allow color mode switching (disableSwitch: false)'
    );
  });

  it('userProgressService.ts must export saveThemePreferenceToFirestore and ThemePreference', () => {
    const serviceContent = fs.readFileSync('src/services/userProgressService.ts', 'utf-8');
    assert.ok(
      serviceContent.includes('export async function saveThemePreferenceToFirestore'),
      'userProgressService.ts must export saveThemePreferenceToFirestore'
    );
    assert.ok(
      serviceContent.includes('export interface ThemePreference'),
      'userProgressService.ts must export ThemePreference interface'
    );
    assert.ok(
      serviceContent.includes('themePreference?: ThemePreference'),
      'UserProgressData must include themePreference'
    );
  });

  it('UserProgressContext.tsx must expose saveThemePreference in its context value', () => {
    const contextContent = fs.readFileSync('src/context/UserProgressContext.tsx', 'utf-8');
    assert.ok(
      contextContent.includes('saveThemePreference: (preset: string, colorMode: \'light\' | \'dark\') => Promise<void>'),
      'UserProgressContextType must declare saveThemePreference signature'
    );
    assert.ok(
      contextContent.includes('saveThemePreferenceToFirestore(currentUser.uid, preset, colorMode)'),
      'UserProgressContext must call saveThemePreferenceToFirestore when user is logged in'
    );
  });

  it('ScrollProgressButton must transpile cleanly and use theme variables without hardcoded overrides', () => {
    const filePath = 'src/components/ScrollProgressButton.tsx';
    assert.ok(fs.existsSync(filePath), `${filePath} must exist`);
    const jsCode = transpileCode(filePath);
    assert.ok(jsCode && jsCode.length > 50, 'ScrollProgressButton must transpile cleanly');
    const undeclared = getUndeclaredIdentifiers(filePath);
    assert.strictEqual(undeclared.length, 0, `Undeclared identifiers: ${undeclared.join(', ')}`);

    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('var(--gradient-brand)'), 'ScrollProgressButton top bar must use var(--gradient-brand)');
    assert.ok(content.includes('var(--brand-green)'), 'ScrollProgressButton completion must use var(--brand-green)');
    assert.ok(content.includes('var(--brand-teal)'), 'ScrollProgressButton active stroke must use var(--brand-teal)');
  });

  it('UserProfileModal must transpile cleanly and have 0 undeclared identifiers', () => {
    const filePath = 'src/components/auth/UserProfileModal.tsx';
    assert.ok(fs.existsSync(filePath), `${filePath} must exist`);
    const jsCode = transpileCode(filePath);
    assert.ok(jsCode && jsCode.length > 50, 'UserProfileModal must transpile cleanly');
    const undeclared = getUndeclaredIdentifiers(filePath);
    assert.strictEqual(undeclared.length, 0, `Undeclared identifiers: ${undeclared.join(', ')}`);

    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('user-profile-modal-dialog'), 'UserProfileModal must include user-profile-modal-dialog class');
    assert.ok(content.includes('var(--ifm-background-surface-color'), 'UserProfileModal must use CSS surface color variable');
  });

  it('custom.css must ensure headings, table headers, and scrollbars react to theme preset variables', () => {
    const cssContent = fs.readFileSync('src/css/custom.css', 'utf-8');

    // Headings must use theme CSS variables
    assert.ok(cssContent.includes('color: var(--brand-purple) !important;'), 'H2 and table headers must use var(--brand-purple)');
    assert.ok(cssContent.includes('color: var(--brand-green) !important;'), 'H4 must use var(--brand-green)');
    assert.ok(cssContent.includes('color: var(--brand-teal) !important;'), 'H5 must use var(--brand-teal)');

    // Scrollbar must use color-mix with var(--brand-green)
    assert.ok(cssContent.includes('color-mix(in srgb, var(--brand-green)'), 'Scrollbar thumb must dynamically use var(--brand-green)');

    // Table th must use var(--brand-purple)
    assert.ok(cssContent.includes('border-bottom: 2px solid var(--brand-purple) !important;'), 'Table header border must use var(--brand-purple)');

    // Light mode modal styling must be defined
    assert.ok(cssContent.includes('[data-theme="light"] .user-profile-modal-dialog'), 'custom.css must style user profile modal dialog in light mode');
  });

  it('Arcade and Profile pages must transpile cleanly and have 0 undeclared identifiers', () => {
    const pages = [
      { name: 'Arcade page', path: 'src/pages/arcade/index.tsx' },
      { name: 'Profile page', path: 'src/pages/profile/index.tsx' },
    ];

    for (const page of pages) {
      assert.ok(fs.existsSync(page.path), `${page.path} must exist`);
      const jsCode = transpileCode(page.path);
      assert.ok(jsCode && jsCode.length > 50, `${page.name} must transpile cleanly`);
      const undeclared = getUndeclaredIdentifiers(page.path);
      assert.strictEqual(undeclared.length, 0, `Undeclared identifiers in ${page.name}: ${undeclared.join(', ')}`);
    }
  });

  it('custom.css must include light mode overrides for Arcade and Profile pages', () => {
    const cssContent = fs.readFileSync('src/css/custom.css', 'utf-8');

    // Arcade page light mode
    assert.ok(cssContent.includes('[data-theme="light"] .arcade-page-container'), 'Arcade page container must have light mode styling');
    assert.ok(cssContent.includes('[data-theme="light"] .arcade-game-card'), 'Arcade game card must have light mode styling');
    assert.ok(cssContent.includes('[data-theme="light"] .arcade-oncall-banner'), 'Arcade on-call banner must have light mode styling');
    assert.ok(cssContent.includes('[data-theme="light"] .arcade-game-arena'), 'Arcade game arena must have light mode styling');

    // Profile page light mode
    assert.ok(cssContent.includes('[data-theme="light"] .profile-page-container'), 'Profile page container must have light mode styling');
    assert.ok(cssContent.includes('[data-theme="light"] .profile-hero-card'), 'Profile hero card must have light mode styling');
    assert.ok(cssContent.includes('[data-theme="light"] .profile-nav-tabs'), 'Profile nav tabs must have light mode styling');
    assert.ok(cssContent.includes('[data-theme="light"] .stats-bento-card'), 'Profile bento cards must have light mode styling');
    assert.ok(cssContent.includes('[data-theme="light"] .profile-panel-card'), 'Profile panel cards must have light mode styling');
    assert.ok(cssContent.includes('[data-theme="light"] .domain-row'), 'Profile domain rows must have light mode styling');
    assert.ok(cssContent.includes('[data-theme="light"] .ach-card'), 'Profile achievement cards must have light mode styling');
    assert.ok(cssContent.includes('[data-theme="light"] .quest-box'), 'Profile quest boxes must have light mode styling');
  });

  it('custom.css must style markdown checklists and post/doc tags with theme variables', () => {
    const cssContent = fs.readFileSync('src/css/custom.css', 'utf-8');

    // Markdown Checklists
    assert.ok(
      cssContent.includes('.task-list-item input[type="checkbox"]'),
      'custom.css must style task-list-item checkboxes'
    );
    assert.ok(
      cssContent.includes('accent-color: var(--brand-green) !important;'),
      'task list checkboxes must use accent-color: var(--brand-green)'
    );

    // Tags below posts & doc footer tags
    assert.ok(
      cssContent.includes('.theme-doc-footer-tags'),
      'custom.css must style .theme-doc-footer-tags'
    );
    assert.ok(
      cssContent.includes('.tag'),
      'custom.css must style .tag'
    );
    assert.ok(
      cssContent.includes('var(--sidebar-active-bg)'),
      'Doc tags must use var(--sidebar-active-bg) for theme-adaptive background'
    );
    assert.ok(
      cssContent.includes('var(--sidebar-border)'),
      'Doc tags must use var(--sidebar-border) for theme-adaptive border'
    );
  });

  it('CustomUserNavbarItem must transpile cleanly and have 0 undeclared identifiers', () => {
    const filePath = 'src/theme/NavbarItem/CustomUserNavbarItem.tsx';
    assert.ok(fs.existsSync(filePath), `${filePath} must exist`);
    const jsCode = transpileCode(filePath);
    assert.ok(jsCode && jsCode.length > 50, 'CustomUserNavbarItem must transpile cleanly');
    const undeclared = getUndeclaredIdentifiers(filePath);
    assert.strictEqual(undeclared.length, 0, `Undeclared identifiers: ${undeclared.join(', ')}`);

    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('var(--brand-green'), 'CustomUserNavbarItem must use var(--brand-green)');
    assert.ok(content.includes('var(--sidebar-active-bg'), 'CustomUserNavbarItem must use var(--sidebar-active-bg)');
  });
});


