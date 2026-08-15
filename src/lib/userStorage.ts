/**
 * userStorage.ts
 *
 * Provides user-scoped localStorage helpers.
 * All keys are namespaced with the current user's token so each user gets
 * their own isolated data — no data leaks between accounts.
 */

/** Returns the active user ID from localStorage, or 'guest' for unauthenticated users. */
export function getActiveUserId(): string {
  return localStorage.getItem('insightai_token') || 'guest';
}

/** Returns a user-scoped localStorage key, e.g. "insightai_user_datasets_metadata::usr-123" */
export function userKey(baseKey: string): string {
  return `${baseKey}::${getActiveUserId()}`;
}

/** Read a user-scoped JSON value from localStorage. */
export function userStorageGet<T>(baseKey: string): T | null {
  try {
    const raw = localStorage.getItem(userKey(baseKey));
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore parse errors
  }
  return null;
}

/** Write a user-scoped JSON value to localStorage. */
export function userStorageSet(baseKey: string, value: unknown): void {
  try {
    localStorage.setItem(userKey(baseKey), JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
}

/** Remove a user-scoped key from localStorage. */
export function userStorageRemove(baseKey: string): void {
  try {
    localStorage.removeItem(userKey(baseKey));
  } catch {
    // ignore
  }
}

/**
 * Clears ALL data for a given user ID.
 * Call this on logout if you want to wipe local user data.
 */
export function clearUserStorage(userId: string): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.endsWith(`::${userId}`)) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}
