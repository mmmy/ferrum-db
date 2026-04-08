import { vi } from 'vitest';

export const invokeMock = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: invokeMock,
}));

export function resetTauriMocks() {
  invokeMock.mockReset();
}
