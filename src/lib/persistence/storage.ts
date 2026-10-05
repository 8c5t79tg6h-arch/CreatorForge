const MEMORY = new Map<string, string>();

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export const storage = {
  getItem(key: string): string | null {
    if (canUseLocalStorage()) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return MEMORY.get(key) ?? null;
      }
    }
    return MEMORY.get(key) ?? null;
  },
  setItem(key: string, value: string): void {
    MEMORY.set(key, value);
    if (canUseLocalStorage()) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // keep in-memory fallback
      }
    }
  },
  removeItem(key: string): void {
    MEMORY.delete(key);
    if (canUseLocalStorage()) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
  },
};

export function resetMemoryStorageForTests(): void {
  MEMORY.clear();
}
