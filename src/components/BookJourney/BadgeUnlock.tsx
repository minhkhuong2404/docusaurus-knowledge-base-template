import React, { useEffect, useState } from 'react';
import styles from './journeyChrome.module.css';

interface BadgeUnlockProps {
  storageKey: string;
  show: boolean;
  icon: string;
  title: string;
  subtitle: string;
}

/** One-shot celebration when a badge is first earned in this browser. */
export default function BadgeUnlock({
  storageKey,
  show,
  icon,
  title,
  subtitle,
}: BadgeUnlockProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !show) return;
    try {
      if (localStorage.getItem(storageKey) === '1') return;
      localStorage.setItem(storageKey, '1');
      setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [show, storageKey]);

  if (!visible) return null;

  return (
    <div className={styles.unlockOverlay} role="dialog" aria-modal="true">
      <div className={styles.unlockCard}>
        <span className={styles.unlockIcon}>{icon}</span>
        <h3 style={{ margin: '0 0 0.35rem' }}>{title}</h3>
        <p style={{ margin: '0 0 1rem', color: 'var(--ifm-color-emphasis-700)' }}>{subtitle}</p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          style={{
            border: 'none',
            borderRadius: 10,
            padding: '0.55rem 1.2rem',
            fontWeight: 700,
            background: '#22c55e',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Nice
        </button>
      </div>
    </div>
  );
}
