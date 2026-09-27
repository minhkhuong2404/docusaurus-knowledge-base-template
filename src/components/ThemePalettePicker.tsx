import React, { useState, useEffect, useRef } from 'react';
import { useColorMode } from '@docusaurus/theme-common';
import { useUserProgress } from '../context/UserProgressContext';
import {
  THEME_PRESETS,
  getStoredThemePreset,
  setStoredThemePreset,
  applyThemePreset,
  ThemePreset,
} from '../utils/themePresets';

export default function ThemePalettePicker(): React.JSX.Element {
  const { colorMode, setColorMode } = useColorMode();
  const { currentUser, progress, saveThemePreference } = useUserProgress();
  const [activePreset, setActivePreset] = useState<string>('emerald');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state with localStorage and document on mount
  useEffect(() => {
    const saved = getStoredThemePreset();
    setActivePreset(saved);
    applyThemePreset(saved);
  }, []);

  // Sync state from Firestore when user progress loads/updates
  useEffect(() => {
    const remotePref = progress.themePreference;
    if (remotePref?.preset && remotePref.preset !== activePreset) {
      setActivePreset(remotePref.preset);
      setStoredThemePreset(remotePref.preset);
    }
    if (remotePref?.colorMode && remotePref.colorMode !== colorMode) {
      setColorMode(remotePref.colorMode);
    }
  }, [progress.themePreference?.preset, progress.themePreference?.colorMode]);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectPreset = (presetId: string) => {
    setActivePreset(presetId);
    setStoredThemePreset(presetId);
    if (currentUser?.uid) {
      saveThemePreference(presetId, (colorMode || 'dark') as 'light' | 'dark');
    }
  };

  const handleModeChange = (mode: 'light' | 'dark') => {
    setColorMode(mode);
    if (currentUser?.uid) {
      saveThemePreference(activePreset, mode);
    }
  };

  const currentPresetObj = THEME_PRESETS.find((p) => p.id === activePreset) || THEME_PRESETS[0];
  const activeDotColor = colorMode === 'light' ? currentPresetObj.primaryLight : currentPresetObj.primaryDark;

  return (
    <div
      ref={containerRef}
      className="theme-palette-picker-container"
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        margin: '0 4px',
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        className="theme-palette-trigger-btn"
        aria-label="Customize appearance and theme colors"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Customize Theme & Palette"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          background: 'var(--navbar-btn-bg, rgba(255, 255, 255, 0.05))',
          border: '1px solid var(--sidebar-border)',
          borderRadius: '9999px',
          cursor: 'pointer',
          color: 'var(--ifm-color-content, inherit)',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Palette SVG Icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.9 }}
        >
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
          <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
          <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
          <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
        </svg>

        {/* Current Active Theme Color Swatch */}
        <span
          style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: activeDotColor,
            boxShadow: `0 0 6px ${activeDotColor}`,
          }}
        />

        {/* Sun / Moon mode indicator */}
        {colorMode === 'light' ? (
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#818cf8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          className="theme-palette-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '280px',
            backgroundColor: 'var(--ifm-background-surface-color, var(--page-bg))',
            color: 'var(--ifm-color-content, #e2e8f0)',
            border: '1px solid var(--sidebar-border)',
            borderRadius: '14px',
            padding: '14px',
            boxShadow: 'var(--dropdown-shadow, 0 12px 36px rgba(0, 0, 0, 0.45))',
            zIndex: 1000,
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--sidebar-border)',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--ifm-color-content-secondary)',
              }}
            >
              Appearance & Colors
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: '6px',
                background: 'var(--sidebar-active-bg)',
                color: 'var(--brand-green)',
              }}
            >
              Live
            </span>
          </div>

          {/* Section 1: Color Mode Toggle (Light / Dark) */}
          <div style={{ marginBottom: '14px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                marginBottom: '6px',
                color: 'var(--ifm-color-content-secondary)',
              }}
            >
              Mode
            </div>
            <div
              className="mode-toggle-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                background: 'var(--ifm-color-emphasis-100, rgba(0, 0, 0, 0.05))',
                padding: '3px',
                borderRadius: '8px',
                border: '1px solid var(--sidebar-border)',
              }}
            >
              <button
                type="button"
                onClick={() => handleModeChange('light')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: colorMode === 'light' ? 700 : 500,
                  backgroundColor: colorMode === 'light' ? 'var(--ifm-background-surface-color, #ffffff)' : 'transparent',
                  color: colorMode === 'light' ? 'var(--brand-green)' : 'var(--ifm-color-content-secondary)',
                  boxShadow: colorMode === 'light' ? '0 2px 6px rgba(0, 0, 0, 0.12)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
                Light
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('dark')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: colorMode === 'dark' ? 700 : 500,
                  backgroundColor: colorMode === 'dark' ? 'var(--ifm-color-emphasis-200, rgba(255, 255, 255, 0.1))' : 'transparent',
                  color: colorMode === 'dark' ? 'var(--brand-green)' : 'var(--ifm-color-content-secondary)',
                  boxShadow: colorMode === 'dark' ? '0 2px 6px rgba(0, 0, 0, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                Dark
              </button>
            </div>
          </div>

          {/* Section 2: Color Palette Presets */}
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                marginBottom: '8px',
                color: 'var(--ifm-color-content-secondary)',
              }}
            >
              Color Scheme
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {THEME_PRESETS.map((preset: ThemePreset) => {
                const isSelected = activePreset === preset.id;
                const swatchGradient = colorMode === 'light' ? preset.gradientLight : preset.gradientDark;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    className="theme-palette-preset-btn"
                    onClick={() => handleSelectPreset(preset.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: isSelected
                        ? '1px solid var(--brand-green)'
                        : '1px solid transparent',
                      backgroundColor: isSelected
                        ? 'var(--sidebar-active-bg)'
                        : 'transparent',
                      cursor: 'pointer',
                      color: 'inherit',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Dual-color Swatch */}
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: swatchGradient,
                          boxShadow: isSelected
                            ? `0 0 8px ${colorMode === 'light' ? preset.primaryLight : preset.primaryDark}`
                            : 'none',
                          flexShrink: 0,
                          border: '1.5px solid rgba(255, 255, 255, 0.4)',
                        }}
                      />
                      <div>
                        <div
                          style={{
                            fontSize: '12.5px',
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? 'var(--brand-green)' : 'inherit',
                          }}
                        >
                          {preset.name}
                        </div>
                        <div
                          style={{
                            fontSize: '10px',
                            color: 'var(--ifm-color-content-secondary)',
                            opacity: 0.85,
                          }}
                        >
                          {preset.subtitle}
                        </div>
                      </div>
                    </div>

                    {/* Active checkmark */}
                    {isSelected && (
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--brand-green)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Cloud Sync Status Footer */}
          <div
            style={{
              paddingTop: '8px',
              borderTop: '1px solid var(--sidebar-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '10.5px',
              color: 'var(--ifm-color-content-secondary)',
            }}
          >
            {currentUser ? (
              <>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--brand-green)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                  <polyline points="9 13 12 16 17 11" />
                </svg>
                <span>Synced to your Firebase account</span>
              </>
            ) : (
              <>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ opacity: 0.7 }}
                >
                  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                </svg>
                <span>Saved locally. Log in to sync to cloud.</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
