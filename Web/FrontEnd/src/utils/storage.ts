const inMemoryStorage = new Map<string, string>();

export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    } catch (e) {
      console.warn("localStorage read blocked. using in-memory fallback.");
    }
    return inMemoryStorage.get(key) || null;
  },

  setItem(key: string, value: string): void {
    inMemoryStorage.set(key, value);
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("localStorage write blocked. using in-memory fallback.");
    }
  },

  removeItem(key: string): void {
    inMemoryStorage.delete(key);
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("localStorage delete blocked. using in-memory fallback.");
    }
  }
};
