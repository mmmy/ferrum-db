const memoryState = new Map<string, unknown>();

function hasLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function resetPersistedState(key: string) {
  memoryState.delete(key);

  if (hasLocalStorage()) {
    window.localStorage.removeItem(key);
  }
}

export function loadPersistedState<T>(key: string): T | null {
  const memoryValue = memoryState.get(key);
  if (memoryValue !== undefined) {
    return memoryValue as T;
  }

  if (!hasLocalStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as T;
    memoryState.set(key, parsed);
    return parsed;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

export function savePersistedState<T>(key: string, value: T) {
  memoryState.set(key, value);

  if (hasLocalStorage()) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}
