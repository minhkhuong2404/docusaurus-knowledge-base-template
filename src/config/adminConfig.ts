/**
 * Config: adminConfig.ts
 * Manages admin authorization and permission lists.
 */

// Default hardcoded admin email list (case-insensitive)
export const DEFAULT_ADMIN_EMAILS: string[] = [
  'admin@example.com',
  'lukhuong@gmail.com',
  'khuonglu1999@gmail.com',
];

const ADMIN_STORAGE_KEY = 'app_admin_emails_v1';

/**
 * Get all configured admin emails (combines default list + locally added admin emails)
 */
export function getAdminEmails(): string[] {
  if (typeof window === 'undefined') {
    return [...DEFAULT_ADMIN_EMAILS];
  }
  try {
    const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const set = new Set([
          ...DEFAULT_ADMIN_EMAILS.map((e) => e.trim().toLowerCase()),
          ...parsed.map((e) => String(e).trim().toLowerCase()),
        ]);
        return Array.from(set);
      }
    }
  } catch (err) {
    console.error('Failed to load admin emails from localStorage:', err);
  }
  return [...DEFAULT_ADMIN_EMAILS];
}

/**
 * Save new admin email to storage
 */
export function saveAdminEmail(email: string): string[] {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) return getAdminEmails();

  const current = getAdminEmails();
  if (!current.includes(cleanEmail)) {
    const updated = [...current, cleanEmail];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save admin emails to localStorage:', err);
      }
    }
    return updated;
  }
  return current;
}

/**
 * Remove admin email from storage (cannot remove default list)
 */
export function removeAdminEmail(email: string): string[] {
  const cleanEmail = (email || '').trim().toLowerCase();
  const current = getAdminEmails();
  const updated = current.filter((e) => e !== cleanEmail);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to remove admin email from localStorage:', err);
    }
  }
  return updated;
}

/**
 * Check whether a given user email or user object has Admin permissions
 */
export function checkIsAdmin(userEmail?: string | null): boolean {
  if (!userEmail) return false;
  const clean = userEmail.trim().toLowerCase();
  const adminList = getAdminEmails().map((e) => e.trim().toLowerCase());
  return adminList.includes(clean);
}
